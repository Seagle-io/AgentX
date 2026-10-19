#!/usr/bin/env python3
"""Boucle d'amélioration continue, lot L1 (contrat T044 §1, §3, §4).

Module pur : lit le vault, calcule déclencheurs, niveaux, indicateurs, tendances ;
n'écrit rien. I/O seulement dans charger, seuils et declencheurs.
"""

from __future__ import annotations

import datetime as _dt
import fnmatch
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

from vx import STATUT_OUVERT, _manques_result, _section, categorie_manque, deaccent, lire_frontmatter

SEUILS = {
    "capitaliser_n": 10, "syndicat_k": 50, "renvoi_taux": 0.5, "renvoi_min_livrees": 2,
    "bloque_n": 3, "bloque_fenetre_h": 24, "gabarit_n": 3, "env_n": 2, "mesure_n": 10,
    "projet_systeme": "agentx-entreprise",
    "bruit": {"renvoi": 0.05, "manquait": 0.05, "bloque": 0.05, "hors_wl": 0.2, "pack_lignes": 5},
}
INDICATEURS = ("renvoi", "hors_wl", "manquait", "bloque", "pack_lignes")
GABARIT = "vault/_templates/context.md"
SKILL_CHEF = ".claude/skills/chef-de-projet/SKILL.md"
INCIDENTS = {
    "port_occupe": r"eaddrinuse|address already in use|port \S* ?(deja )?(occupe|utilise|pris)",
    "outil_absent": r"hors outils|outil absent|absent des outils|command not found|indisponible",
    "classifieur": r"classifieur|refus\S* (par )?(le )?(classifieur|permission)|permission denied",
    "lint_wl": r"pack-lint|whitelist trop large|wl ?> ?12",
    "hook_dispatch": r"garde_dispatch|hook .*(modele|effort)|(modele|effort) .*refus",
}
# 1re ligne qui matche ; tout le reste (bin/**, roles.json, CLAUDE.md, .claude/**, vault/_templates/**, inconnu) = humain
NIVEAUX = (
    ("vault/connaissances/**", "auto"),
    (".claude/skills/conventions-*/**", "auto"),
    ("vault/projets/*/env.md", "auto"),
    ("vault/_templates/pack-*.md", "chef"),
    ("budget:*", "chef"),
)
RX_BLOQUE = re.compile(r"^- `(\d{4}-\d{2}-\d{2} \d{2}:\d{2})` (T\d{3,}) statut \S+ -> bloque")


@dataclass(frozen=True)
class TacheVue:
    projet: str
    tid: str
    role: str
    statut: str
    modele: str
    result: str | None
    result_mtime: float | None
    pack_lignes: int | None
    maj: str
    archive: bool


@dataclass(frozen=True)
class Declenchement:
    cle: str
    regle: str
    projet: str
    raison: str
    sources: tuple[str, ...]
    action: str          # tache:scribe | tache:syndicat | proposition
    donnees: dict


def livree(v: TacheVue) -> bool:
    return v.result is not None or v.statut == "rejete"


def _num(tid: str) -> int:
    return int(tid[1:])


def _instant(v: TacheVue) -> float:
    """Epoch de livraison : mtime du result, sinon minuit local de `maj` (rejete sans result)."""
    if v.result_mtime is not None:
        return v.result_mtime
    return _dt.datetime.combine(_dt.date.fromisoformat(v.maj), _dt.time()).timestamp()


def _jour(v: TacheVue) -> str:
    return _dt.date.fromtimestamp(v.result_mtime).isoformat() if v.result_mtime is not None else v.maj


# --------------------------------------------------------------------------- #
# lecture du vault
# --------------------------------------------------------------------------- #

def _vue(proj: Path, d: Path, archive: bool) -> TacheVue:
    """Lève (OSError, ValueError) sur tâche illisible : non UTF-8, tid ou date invalide."""
    meta, _ = lire_frontmatter(d / "task.md")
    tid, statut = str(meta.get("id", "")), str(meta.get("statut", ""))
    _num(tid)
    maj = str(meta.get("maj", ""))
    _dt.date.fromisoformat(maj)
    res, ctx = d / "result.md", d / "context.md"
    return TacheVue(
        projet=proj.name, tid=tid, role=str(meta.get("role", "")), statut=statut,
        modele=str(meta.get("modele", "")),
        result=res.read_text(encoding="utf-8") if res.exists() else None,
        result_mtime=res.stat().st_mtime if res.exists() else None,
        pack_lignes=len(ctx.read_text(encoding="utf-8").splitlines()) if ctx.exists() else None,
        maj=maj, archive=archive)


def charger(vault: Path, ignorees: list[str] | None = None) -> list[TacheVue]:
    """projets/* (archive=False) + archive/* (archive=True) ; tâche illisible → ignorée, tracée dans `ignorees`."""
    vues = []
    for sous, archive in (("projets", False), ("archive", True)):
        for proj in sorted(p for p in (vault / sous).glob("*") if p.is_dir()):
            for d in sorted((proj / "taches").glob("*/")):
                if not (d / "task.md").exists():
                    continue
                try:
                    vues.append(_vue(proj, d, archive))
                except (OSError, ValueError):   # UnicodeDecodeError ⊂ ValueError
                    if ignorees is not None:
                        ignorees.append(f"{proj.name}/{d.name}")
    return vues


def seuils(root: Path) -> dict:
    f = root / "ameliorations.json"
    surcharge = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    inconnues = sorted(set(surcharge) - set(SEUILS))
    if inconnues:
        raise ValueError(f"ameliorations.json : clé inconnue {', '.join(inconnues)}")
    return {**SEUILS, **surcharge}


def transitions_bloque(journal: str) -> list[float]:
    return [_dt.datetime.strptime(m.group(1), "%Y-%m-%d %H:%M").timestamp()
            for m in map(RX_BLOQUE.match, journal.splitlines()) if m]


# --------------------------------------------------------------------------- #
# déclencheurs
# --------------------------------------------------------------------------- #

def d_capitaliser(projet: str, vues: list[TacheVue], s: dict) -> Declenchement | None:
    vues = [v for v in vues if not v.archive and v.projet == projet]
    if any(v.role == "scribe" and v.statut in STATUT_OUVERT for v in vues):
        return None
    ref = max((_num(v.tid) for v in vues if v.role == "scribe" and v.statut not in ("rejete", "abandonne")),
              default=0)
    faits = [v for v in vues if v.statut == "fait" and v.role != "scribe" and _num(v.tid) > ref]
    if not faits:
        return None
    if len(faits) >= s["capitaliser_n"]:
        raison = f"{len(faits)} fait depuis T{ref:03d}"
    elif not any(v.statut in STATUT_OUVERT for v in vues):
        raison = "vague close"
    else:
        return None
    dernier = max(faits, key=lambda v: _num(v.tid)).tid
    return Declenchement(f"capitaliser:{projet}:{dernier}", "D1", projet, raison,
                         tuple(f"{projet}/{v.tid}" for v in faits), "tache:scribe",
                         {"n": len(faits), "ref": ref})


def _personnel(vues: list[TacheVue]) -> dict:
    """Même forme que rh.personnel()['roles'] (livrees, virees, taux_renvoi), calculée sur les vues."""
    par_role: dict[str, list[TacheVue]] = defaultdict(list)
    for v in vues:
        par_role[v.role].append(v)
    roles = []
    for r, vs in sorted(par_role.items()):
        liv = sum(1 for v in vs if v.statut in ("revue", "fait", "rejete"))
        vir = sum(1 for v in vs if v.statut == "rejete")
        roles.append({"cle": r, "livrees": liv, "virees": vir, "taux_renvoi": round(vir / liv, 3) if liv else None})
    return {"roles": roles}


def d_syndicat(vues: list[TacheVue], personnel: dict, bloques: list[float], ref_cahier: float,
               maintenant: float, ouverte: bool, s: dict) -> Declenchement | None:
    if ouverte:
        return None
    vraies = []   # (regle, cle, perimetre, raison), ordre de priorité c > b > a
    fenetre = sorted(t for t in bloques if maintenant - s["bloque_fenetre_h"] * 3600 < t <= maintenant)
    if len(fenetre) >= s["bloque_n"]:
        debut = _dt.datetime.fromtimestamp(fenetre[0]).strftime("%Y-%m-%dT%H:%M")
        vraies.append(("c", f"syndicat:bloque:{debut}", "tous",
                       f"{len(fenetre)} bloque en {s['bloque_fenetre_h']} h"))
    chauds = sorted((r for r in personnel.get("roles", [])
                     if r["livrees"] >= s["renvoi_min_livrees"] and r["taux_renvoi"] is not None
                     and r["taux_renvoi"] >= s["renvoi_taux"]), key=lambda r: -r["taux_renvoi"])
    if chauds:
        r = chauds[0]
        vraies.append(("b", f"syndicat:renvoi:{r['cle']}:{r['virees']}", f"role:{r['cle']}",
                       "; ".join(f"{c['cle']} {c['virees']}/{c['livrees']} virés" for c in chauds)))
    n = sum(1 for v in vues if not v.archive and livree(v) and _instant(v) > ref_cahier)
    if n >= s["syndicat_k"]:
        vraies.append(("a", f"syndicat:volume:{int(ref_cahier)}", "tous", f"{n} livrées depuis le dernier cahier"))
    if not vraies:
        return None
    regle, cle, perimetre, _ = vraies[0]
    return Declenchement(cle, regle, s["projet_systeme"], "; ".join(x[3] for x in vraies), (),
                         "tache:syndicat", {"perimetre": perimetre})


def d_gabarit(vues: list[TacheVue], mtime_gabarit: float, s: dict) -> list[Declenchement]:
    par_cat: dict[str, set[tuple[str, str]]] = defaultdict(set)
    for v in vues:
        if v.archive or v.result is None or v.result_mtime <= mtime_gabarit:
            continue
        for c in {categorie_manque(t) for t in _manques_result(v.result)} - {"autre"}:
            par_cat[c].add((v.projet, v.tid))
    return [Declenchement(f"gabarit:{c}:{int(mtime_gabarit)}", "D3", s["projet_systeme"],
                          f"{len(ids)} result citent « {c} » depuis la dernière édition du gabarit",
                          tuple(f"{p}/{t}" for p, t in sorted(ids)), "proposition",
                          {"cible": GABARIT, "indicateur": "manquait", "perimetre": "tous",
                           "sens": "baisse", "categorie": c})
            for c, ids in sorted(par_cat.items()) if len(ids) >= s["gabarit_n"]]


def _incidents(result: str) -> set[str]:
    texte = deaccent("\n".join(_section(result, t) for t in ("Écarts", "Vérifié comment", "Retour sur le pack"))).lower()
    return {next(k for k, rx in INCIDENTS.items() if re.search(rx, ligne))
            for ligne in texte.splitlines() if any(re.search(rx, ligne) for rx in INCIDENTS.values())}


def d_env(vues: list[TacheVue], cibles: dict[str, tuple[str, float]], s: dict) -> list[Declenchement]:
    ids: dict[tuple[str, str], set[str]] = defaultdict(set)
    for v in vues:
        if v.archive or v.result is None or v.projet not in cibles or v.result_mtime <= cibles[v.projet][1]:
            continue
        for inc in _incidents(v.result):
            ids[(v.projet, inc)].add(v.tid)
    out, projets_par_incident = [], defaultdict(list)
    for (p, inc), tids in sorted(ids.items()):
        if len(tids) < s["env_n"]:
            continue
        chemin, mtime = cibles[p]
        projets_par_incident[inc].append(p)
        out.append(Declenchement(f"env:{p}:{inc}:{int(mtime)}", "D4", p, f"{len(tids)} tâches : {inc}",
                                 tuple(f"{p}/{t}" for t in sorted(tids)), "proposition",
                                 {"cible": chemin, "incident": inc}))
    chef, mtime_chef = cibles.get("*", (SKILL_CHEF, 0.0))
    for inc, projets in sorted(projets_par_incident.items()):
        if len(projets) >= 2:
            out.append(Declenchement(f"env:*:{inc}:{int(mtime_chef)}", "D4", s["projet_systeme"],
                                     f"{inc} sur {len(projets)} projets", tuple(projets), "proposition",
                                     {"cible": chef, "incident": inc}))
    return out


def _cible_env(root: Path, projet: str) -> tuple[str, float]:
    meta, _ = lire_frontmatter(root / "vault" / "projets" / projet / "brief.md")
    conv = str(meta.get("conventions", "")).strip()
    prefixe = f".claude/skills/conventions-{projet.split('-')[0]}/SKILL.md"
    if conv:
        chemin = f".claude/skills/{conv}/SKILL.md"
    elif (root / prefixe).exists():
        chemin = prefixe
    else:
        chemin = f"vault/projets/{projet}/env.md"
    f = root / chemin
    return chemin, f.stat().st_mtime if f.exists() else 0.0


def _mtime(f: Path) -> float:
    return f.stat().st_mtime if f.exists() else 0.0


def declencheurs(vault: Path, maintenant: float, s: dict | None = None) -> list[Declenchement]:
    root = vault.parent
    s = s or seuils(root)
    vues = [v for v in charger(vault) if not v.archive]
    projets = sorted({v.projet for v in vues})
    out = [d for p in projets if (d := d_capitaliser(p, vues, s))]
    ref_cahier = max((_mtime(f) for f in (vault / "syndicat").glob("*.md")), default=0.0)
    bloques = [t for p in projets for t in transitions_bloque(_lire(vault / "projets" / p / "journal.md"))]
    ouverte = any(v.role == "syndicat" and v.statut in STATUT_OUVERT for v in vues)
    if d := d_syndicat(vues, _personnel(vues), bloques, ref_cahier, maintenant, ouverte, s):
        out.append(d)
    out += d_gabarit(vues, _mtime(root / GABARIT), s)
    cibles = {p: _cible_env(root, p) for p in projets}
    cibles["*"] = (SKILL_CHEF, _mtime(root / SKILL_CHEF))
    return out + d_env(vues, cibles, s)


def _lire(f: Path) -> str:
    return f.read_text(encoding="utf-8", errors="replace") if f.exists() else ""


# --------------------------------------------------------------------------- #
# niveaux, indicateurs, tendances
# --------------------------------------------------------------------------- #

def niveau(cible: str) -> str:
    return next((n for motif, n in NIVEAUX if fnmatch.fnmatchcase(cible, motif)), "humain")


def indicateurs_tache(v: TacheVue, bloques: set[tuple[str, str]]) -> dict[str, float | None] | None:
    if not livree(v):
        return None
    texte = v.result or ""
    ecarts = _section(texte, "Écarts").splitlines()
    hors = sum(1 for l in ecarts if "lecture hors WL" in l and "∅" not in l and ": 0" not in l)
    bloque = (v.projet, v.tid) in bloques or re.match(r"---\n(?:.*\n)*?statut:\s*bloque\s*\n", texte) is not None
    return {"renvoi": 1.0 if v.statut == "rejete" else 0.0, "hors_wl": float(hors),
            "manquait": 1.0 if _manques_result(texte) else 0.0, "bloque": 1.0 if bloque else 0.0,
            "pack_lignes": float(v.pack_lignes) if v.pack_lignes is not None else None}


def _moyenne(valeurs: list[float | None]) -> float | None:
    vs = [x for x in valeurs if x is not None]
    return round(sum(vs) / len(vs), 2) if vs else None


def tendances(vues: list[TacheVue], *, par: str = "role", depuis: str | None = None,
              role: str | None = None, modele: str | None = None) -> list[dict]:
    groupes: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for v in vues:
        ind = indicateurs_tache(v, set())
        jour = _jour(v)
        if ind is None or (depuis and jour < depuis) or (role and v.role != role) or (modele and v.modele != modele):
            continue
        groupes[(jour, v.role if par == "role" else v.modele)].append(ind)
    return [{"jour": j, "cle": c, "n": len(inds), **{i: _moyenne([x[i] for x in inds]) for i in INDICATEURS}}
            for (j, c), inds in sorted(groupes.items())]


def _dans(v: TacheVue, perimetre: str) -> bool:
    genre, _, val = perimetre.partition(":")
    return {"tous": True, "role": v.role == val, "projet": v.projet == val, "modele": v.modele == val}[genre]


def valeur(vues: list[TacheVue], indicateur: str, perimetre: str, *, avant: float | None = None,
           apres: float | None = None, n: int) -> tuple[float | None, int]:
    """avant=ts : n dernières livrées du périmètre avant ts ; apres=ts : n premières après ts."""
    liv = sorted((v for v in vues if livree(v) and _dans(v, perimetre)), key=_instant)
    if avant is not None:
        liv = [v for v in liv if _instant(v) < avant][-n:]
    else:
        liv = [v for v in liv if _instant(v) > apres][:n]
    vals = [indicateurs_tache(v, set())[indicateur] for v in liv]
    vals = [x for x in vals if x is not None]
    return (sum(vals) / len(vals) if vals else None), len(vals)
