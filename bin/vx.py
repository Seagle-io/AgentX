#!/usr/bin/env python3
"""vx — pilote du Vault multi-agent AgentX.

Toute la comptabilite du vault (creation, statuts, graphe de dependances,
index, lint des context packs) est faite ici, en deterministe, pour qu'aucun
agent ne depense de tokens a lire/parcourir le vault.

Zero dependance externe. Python 3.9+.

Usage :
    python3 bin/vx.py <commande> [options]
    python3 bin/vx.py help
"""

from __future__ import annotations

import argparse
import contextlib
import datetime as _dt
import fcntl
import json
import os
import re
import shlex
import shutil
import sys
import unicodedata
from pathlib import Path

import roles

ROOT = Path(__file__).resolve().parent.parent
VAULT = ROOT / "vault"
TEMPLATES = VAULT / "_templates"

ROLES = roles.affectables()          # () si roles.json invalide
MODELES = roles.MODELES
STATUTS = ("a-faire", "pret", "en-cours", "bloque", "revue", "fait", "abandonne", "rejete")
STATUT_OUVERT = ("a-faire", "pret", "en-cours", "bloque", "revue")
STATUT_FERME = ("fait", "abandonne", "rejete")
MARQUEUR = "TODO" + "-PACK"

# Sections obligatoires d'un context pack (voir vault/_templates/context.md)
PACK_SECTIONS = (
    "## Mission",
    "## Definition of Done",
    "## Fichiers autorises",
    "## Contrats",
    "## Decisions actees",
    "## Hors perimetre",
    "## Budget",
    "## Format de sortie",
)
PACK_MAX_LIGNES = 220
PACK_MAX_FICHIERS = 12


# --------------------------------------------------------------------------- #
# utilitaires
# --------------------------------------------------------------------------- #

def today() -> str:
    return _dt.date.today().isoformat()


def now() -> str:
    return _dt.datetime.now().strftime("%Y-%m-%d %H:%M")


def die(msg: str, code: int = 1):
    print(f"vx: erreur: {msg}", file=sys.stderr)
    sys.exit(code)


def slugify(texte: str) -> str:
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    return re.sub(r"-{2,}", "-", t)[:48] or "sans-titre"


def deaccent(texte: str) -> str:
    return unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()


CLES_LISTE = ("deps", "tags")


def lire_frontmatter(chemin: Path) -> tuple[dict, str]:
    """Parseur YAML-frontmatter minimal : scalaires, listes inline [a, b], listes '- x'."""
    if not chemin.exists():
        return {}, ""
    texte = chemin.read_text(encoding="utf-8")
    if not texte.startswith("---"):
        return {}, texte
    parts = texte.split("\n---", 1)
    if len(parts) < 2:
        return {}, texte
    bloc, corps = parts[0][3:], parts[1].lstrip("-\n")
    meta: dict = {}
    avec_items: set[str] = set()   # clés ayant réellement reçu un « - item »
    cle_liste = None
    for ligne in bloc.splitlines():
        if not ligne.strip() or ligne.lstrip().startswith("#"):
            continue
        if ligne.lstrip().startswith("- ") and cle_liste:
            meta[cle_liste].append(ligne.lstrip()[2:].strip().strip("\"'"))
            avec_items.add(cle_liste)
            continue
        m = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", ligne)
        if not m:
            continue
        cle, val = m.group(1), m.group(2).strip()
        if val == "":
            # Ambigu : soit une liste « - x » qui suit, soit une valeur vide.
            # Tranché après la boucle selon la présence d'items.
            cle_liste, meta[cle] = cle, []
        elif val.startswith("[") and val.endswith("]"):
            cle_liste = None
            inner = val[1:-1].strip()
            meta[cle] = [x.strip().strip("\"'") for x in inner.split(",") if x.strip()] if inner else []
            avec_items.add(cle)
        else:
            cle_liste = None
            meta[cle] = val.strip("\"'")
    for cle, val in list(meta.items()):
        if val == [] and cle not in avec_items and cle not in CLES_LISTE:
            meta[cle] = ""
    return meta, corps


def champ(meta: dict, cle: str, defaut: str = "—") -> str:
    """Valeur d'affichage : remplace vide / liste vide par un marqueur lisible."""
    val = meta.get(cle)
    if isinstance(val, list):
        return ", ".join(val) if val else defaut
    val = str(val).strip() if val is not None else ""
    return val or defaut


def ecrire_frontmatter(chemin: Path, meta: dict, corps: str):
    lignes = ["---"]
    for cle, val in meta.items():
        if isinstance(val, list):
            lignes.append(f"{cle}: [{', '.join(val)}]")
        else:
            lignes.append(f"{cle}: {val}")
    lignes.append("---")
    chemin.write_text("\n".join(lignes) + "\n" + corps.lstrip("\n"), encoding="utf-8")


def rendre_template(nom: str, **vars_) -> str:
    src = TEMPLATES / nom
    if not src.exists():
        die(f"template manquant : {src.relative_to(ROOT)} (lance `vx init`)")
    texte = src.read_text(encoding="utf-8")
    for cle, val in vars_.items():
        texte = texte.replace("{{" + cle + "}}", str(val))
    return texte


def dossier_projet(slug: str) -> Path:
    d = VAULT / "projets" / slug
    if not d.exists():
        dispo = sorted(p.name for p in (VAULT / "projets").glob("*") if p.is_dir())
        die(f"projet inconnu : {slug}" + (f" (dispo : {', '.join(dispo)})" if dispo else ""))
    return d


def lister_projets() -> list[Path]:
    base = VAULT / "projets"
    return sorted((p for p in base.glob("*") if p.is_dir()), key=lambda p: p.name) if base.exists() else []


def lister_taches(proj: Path) -> list[tuple[Path, dict]]:
    base = proj / "taches"
    out = []
    if base.exists():
        for d in sorted(base.glob("*")):
            if d.is_dir() and (d / "task.md").exists():
                meta, _ = lire_frontmatter(d / "task.md")
                out.append((d, meta))
    return sorted(out, key=lambda x: x[1].get("id", ""))


@contextlib.contextmanager
def verrou(proj: Path):
    """Verrou exclusif du projet : numerotation des taches sans collision entre process."""
    with (proj / ".verrou").open("a") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        yield


def journaliser(proj: Path, msg: str):
    jr = proj / "journal.md"
    entete = "" if jr.exists() else "# Journal\n\nAppend-only. Le plus recent en bas.\n"
    with jr.open("a", encoding="utf-8") as fh:
        fh.write(f"{entete}\n- `{now()}` {msg}\n" if entete else f"- `{now()}` {msg}\n")


# --------------------------------------------------------------------------- #
# commandes
# --------------------------------------------------------------------------- #

def cmd_init(_args):
    for d in ("projets", "connaissances", "artefacts", "archive", "_templates"):
        (VAULT / d).mkdir(parents=True, exist_ok=True)
    manquants = [n for n in ("brief.md", "plan.md", "task.md", "context.md",
                             "result.md", "note.md") if not (TEMPLATES / n).exists()]
    if manquants:
        print(f"! templates absents : {', '.join(manquants)}")
    cmd_index(argparse.Namespace(quiet=True))
    print(f"vault pret : {VAULT.relative_to(ROOT)}")


def cmd_projet(args):
    slug = slugify(args.slug)
    proj = VAULT / "projets" / slug
    if proj.exists() and not args.force:
        die(f"le projet {slug} existe deja (--force pour ecraser le brief)")
    (proj / "taches").mkdir(parents=True, exist_ok=True)
    titre = args.titre or slug.replace("-", " ").capitalize()
    (proj / "brief.md").write_text(
        rendre_template("brief.md", SLUG=slug, TITRE=titre, DATE=today()), encoding="utf-8")
    if not (proj / "plan.md").exists():
        (proj / "plan.md").write_text(
            rendre_template("plan.md", SLUG=slug, TITRE=titre, DATE=today()), encoding="utf-8")
    if not (proj / "decisions.md").exists():
        (proj / "decisions.md").write_text(
            f"# Decisions — {titre}\n\nUne decision = un bloc. Jamais de reecriture, on ajoute.\n",
            encoding="utf-8")
    journaliser(proj, f"projet cree ({titre})")
    cmd_index(argparse.Namespace(quiet=True))
    print(f"projet : {(proj / 'brief.md').relative_to(ROOT)}")
    print(f"plan   : {(proj / 'plan.md').relative_to(ROOT)}")


def _exiger_registre():
    if roles.erreur():
        die(f"roles.json invalide : {roles.erreur()}", 3)


def cmd_tache(args):
    _exiger_registre()
    proj = dossier_projet(slugify(args.projet))
    with verrou(proj):
        existants = lister_taches(proj)
        nums = [int(m.group(1)) for _, meta in existants
                if (m := re.match(r"T(\d+)", str(meta.get("id", ""))))]
        tid = f"T{max(nums) + 1 if nums else 1:03d}"
        slug = slugify(args.titre)
        d = proj / "taches" / f"{tid}-{slug}"
        deps = [x.strip().upper() for x in (args.dep or []) if x.strip()]
        connus = {str(meta.get("id")) for _, meta in existants}
        for dep in deps:
            if dep not in connus:
                die(f"dependance inconnue : {dep} (tâches existantes : {', '.join(sorted(connus)) or 'aucune'})")
        d.mkdir(parents=True, exist_ok=False)

        (d / "task.md").write_text(
            rendre_template("task.md", ID=tid, TITRE=args.titre, ROLE=args.role,
                            PROJET=proj.name, DATE=today(),
                            DEPS=", ".join(deps), STATUT="a-faire",
                            TOKENS=args.tokens, MODELE=args.modele or roles.role(args.role).modele),
            encoding="utf-8")
        if not (d / "context.md").exists():
            (d / "context.md").write_text(
                rendre_template("context.md", ID=tid, TITRE=args.titre, ROLE=args.role,
                                PROJET=proj.name, DATE=today()),
                encoding="utf-8")
        journaliser(proj, f"{tid} creee — {args.titre} [{args.role}]")
        cmd_index(argparse.Namespace(quiet=True))
        print(f"{tid}  {d.relative_to(ROOT)}")
        print(f"-> remplis le pack : {(d / 'context.md').relative_to(ROOT)}")
        print(f"-> puis : python3 bin/vx.py pack-lint {tid} --projet {proj.name}")


def _trouver_tache(slug_projet: str | None, tid: str) -> tuple[Path, Path, dict]:
    tid = tid.upper()
    cibles = [dossier_projet(slugify(slug_projet))] if slug_projet else lister_projets()
    for proj in cibles:
        for d, meta in lister_taches(proj):
            if str(meta.get("id", "")).upper() == tid:
                return proj, d, meta
    die(f"tache introuvable : {tid}" + (f" dans {slug_projet}" if slug_projet else ""))


def cmd_set(args):
    if args.statut and args.statut not in STATUTS:
        die(f"statut invalide : {args.statut} (attendu : {', '.join(STATUTS)})")
    proj, d, _ = _trouver_tache(args.projet, args.tid)
    meta, corps = lire_frontmatter(d / "task.md")
    avant = meta.get("statut")
    tid, role = meta.get("id"), str(meta.get("role"))
    if args.statut == "rejete":
        die(f"rejete : passe par `virer {tid} --motif \"...\"`")
    if args.statut == "fait" and roles.livre_en(role) == "revue" and avant != "fait":
        die(f"{tid} ({role}) livre en revue : `retenir {tid}`")
    if avant == "rejete":
        die(f"{tid} rejetee : statut terminal (remplacante : {meta.get('remplacee_par', '')})")
    if args.statut:
        meta["statut"] = args.statut
    if args.note:
        meta["note"] = args.note
    meta["maj"] = today()
    ecrire_frontmatter(d / "task.md", meta, corps)
    journaliser(proj, f"{meta['id']} statut {avant} -> {meta.get('statut')}"
                      + (f" ({args.note})" if args.note else ""))
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{meta['id']} : {avant} -> {meta.get('statut')}")


def _pack_remplacant(texte: str, tid: str, n: str, role: str, motif: str) -> str:
    """Pack de la remplacante : copie de l'ancien, renumerote, marque a corriger."""
    lignes = texte.split("\n")
    fin_fm = lignes.index("---", 1) if lignes and lignes[0] == "---" and "---" in lignes[1:] else 0
    for i in range(1, fin_fm):
        if lignes[i].startswith("pack:"):
            lignes[i] = f"pack: {n}"
        elif lignes[i].startswith("role:"):
            lignes[i] = f"role: {role}"
    marque = f"- {MARQUEUR} remplace {tid} — vire : {motif} — corrige ce pack puis retire cette ligne"
    titres = [deaccent(l).lower() for l in lignes]
    dec = next((i for i, l in enumerate(titres) if l.startswith("## decisions actees")), None)
    hors = next((i for i, l in enumerate(titres) if l.startswith("## hors perimetre")), None)
    if dec is not None:
        lignes.insert(dec + 1, marque)
    elif hors is not None:
        lignes.insert(hors, marque)
    else:
        lignes.append(marque)
    return "\n".join(lignes).replace(f"Pack {tid}", f"Pack {n}", 1)


def cmd_virer(args):
    _exiger_registre()
    proj, d, _ = _trouver_tache(args.projet, args.tid)
    with verrou(proj):  # statut relu sous verrou : 2 virer de la meme tache -> 1 seul passe
        meta, corps = lire_frontmatter(d / "task.md")
        tid, avant = str(meta.get("id")), str(meta.get("statut"))
        if avant not in ("en-cours", "bloque", "revue", "fait"):
            die(f"{tid} en statut « {avant} » : aucun agent a virer (abandonne-la)")
        motif = re.sub(r"\s+", " ", args.motif).strip().replace("[", "(").replace("]", ")").strip("\"'")
        if not 1 <= len(motif) <= 200:
            die(f"motif : 1 a 200 caracteres (recu {len(motif)})")
        if not (d / "context.md").exists():
            die(f"{tid} sans pack : {(d / 'context.md').relative_to(ROOT)} absent, rien a recopier", 2)
        role = args.role or str(meta.get("role"))
        modele = args.modele or str(meta.get("modele", ""))
        taches = lister_taches(proj)
        nums = [int(x.group(1)) for _, m in taches if (x := re.match(r"T(\d+)", str(m.get("id", ""))))]
        n = f"T{max(nums) + 1:03d}"
        titre = str(meta.get("titre", ""))
        nd = proj / "taches" / f"{n}-{slugify(titre)}"
        nd.mkdir(parents=True, exist_ok=False)

        ecrire_frontmatter(nd / "task.md", {
            "id": n, "titre": titre, "projet": proj.name, "role": role, "statut": "a-faire",
            "deps": meta.get("deps") or [], "budget_tokens": meta.get("budget_tokens", ""),
            "modele": modele, "cree": today(), "maj": today(), "tags": ["tache"], "remplace": tid,
        }, corps.replace(f"# {tid} —", f"# {n} —", 1))
        (nd / "context.md").write_text(
            _pack_remplacant((d / "context.md").read_text(encoding="utf-8"), tid, n, role, motif),
            encoding="utf-8")

        meta.update(statut="rejete", maj=today())
        meta["motif"], meta["remplacee_par"] = motif, n
        ecrire_frontmatter(d / "task.md", meta, corps)

        reecrites = []
        for td, m in taches:
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            if td == d or str(m.get("statut")) in STATUT_FERME or tid not in deps:
                continue
            tmeta, tcorps = lire_frontmatter(td / "task.md")
            tmeta["deps"] = [n if x == tid else x for x in deps]
            tmeta["maj"] = today()
            ecrire_frontmatter(td / "task.md", tmeta, tcorps)
            reecrites.append(str(m.get("id")))

        journaliser(proj, f"{tid} viree -> rejete ({motif}) ; remplacante {n} [{role}/{modele}]")
        journaliser(proj, f"{n} creee — {titre} [{role}] (remplace {tid})")
        for x in reecrites:
            journaliser(proj, f"{x} deps {tid} -> {n}")
        cmd_index(argparse.Namespace(quiet=True))
        print(f"{tid} : {avant} -> rejete (motif : {motif})")
        print(f"{n}  {nd.relative_to(ROOT)}")
        print(f"deps reecrites : {', '.join(reecrites) or '∅'}")
        print(f"-> corrige le pack : {(nd / 'context.md').relative_to(ROOT)}")
        print(f"-> puis : python3 bin/vx.py pack-lint {n} --projet {proj.name}")
        if avant == "en-cours":
            print(f"~ {tid} etait en-cours : verifie qu'aucun agent ne tourne encore")


def cmd_retenir(args):
    proj, d, _ = _trouver_tache(args.projet, args.tid)
    meta, corps = lire_frontmatter(d / "task.md")
    tid, s = str(meta.get("id")), str(meta.get("statut"))
    if s != "revue":
        die(f"{tid} en statut « {s} » : seul revue se retient")
    evaluation = "chef"
    if not args.sans_eval:
        evals = []
        for ed, m in lister_taches(proj):
            deps = m.get("deps") or []
            if str(m.get("role")) == "evaluateur" and tid in (deps if isinstance(deps, list) else [deps]):
                evals.append((str(m.get("id")), ed, m))
        if not evals:
            die(f"aucune evaluation de {tid} — python3 bin/vx.py tache \"Evaluer {tid}\" --projet {proj.name} "
                f"--role evaluateur --dep {tid} (ou --sans-eval)")
        e, ed, em = max(evals, key=lambda x: x[0])
        if str(em.get("statut")) != "fait":
            die(f"evaluation {e} pas encore faite (statut {em.get('statut')})")
        rmeta, _ = lire_frontmatter(ed / "result.md")
        verdict = str(rmeta.get("verdict", ""))
        if verdict not in ("retenir", "virer"):
            die(f"verdict illisible dans {e}/result.md")
        if verdict == "virer":
            motif = _motif_eval((ed / "result.md").read_text(encoding="utf-8"))
            die(f"{e} conclut virer : python3 bin/vx.py virer {tid} --motif {_citer_motif(motif)} "
                f"--projet {proj.name} (ou --sans-eval)")
        evaluation = e
    meta.update(statut="fait", maj=today())
    meta["retenu"], meta["evaluation"] = today(), evaluation
    ecrire_frontmatter(d / "task.md", meta, corps)
    journaliser(proj, f"{tid} statut revue -> fait (retenue, eval {evaluation})")
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{tid} : revue -> fait (retenue, eval {evaluation})")


def cmd_personnel(args):
    import rh
    slug = dossier_projet(slugify(args.projet)).name if args.projet else None
    d = rh.personnel(slug)
    if args.json:
        print(json.dumps(d, ensure_ascii=False, indent=2))
        return
    if not d["taches"]:
        print("aucune tache — rien a mesurer.")
        return
    if slug:
        print(f"PERSONNEL — {slug}, {d['taches']} tache(s)")
    else:
        print(f"PERSONNEL — {d['projets']} projet(s) + {d['archives']} archive(s), {d['taches']} tache(s)")
    for titre, lignes in (("ROLE", d["roles"]), ("MODELE", d["modeles"])):
        print(f"  {titre:<13} {'TACHES':>6} {'LIVREES':>7} {'RETENUES':>8} {'VIREES':>6} {'RENVOI':>7}")
        for l in lignes:
            r = "—" if l["taux_renvoi"] is None else f"{round(100 * l['taux_renvoi'])} %"
            print(f"  {l['cle']:<13} {l['taches']:>6} {l['livrees']:>7} {l['retenues']:>8} {l['virees']:>6} {r:>7}")


def _etat_taches(proj: Path):
    taches = lister_taches(proj)
    statut_par_id = {str(m.get("id")): str(m.get("statut", "a-faire")) for _, m in taches}
    return taches, statut_par_id


def cmd_board(args):
    projets = [dossier_projet(slugify(args.projet))] if args.projet else lister_projets()
    if not projets:
        print("vault vide — `python3 bin/vx.py projet <slug> --titre \"...\"`")
        return
    for proj in projets:
        bmeta, _ = lire_frontmatter(proj / "brief.md")
        taches, statuts = _etat_taches(proj)
        ouvertes = sum(1 for _, m in taches if str(m.get("statut")) in STATUT_OUVERT)
        print(f"\n== {proj.name}  [{champ(bmeta, 'statut', '?')}]  "
              f"{len(taches)} taches, {ouvertes} ouvertes")
        if champ(bmeta, "objectif", "") :
            print(f"   objectif : {champ(bmeta, 'objectif')}")
        if champ(bmeta, "depot", ""):
            print(f"   depot    : {champ(bmeta, 'depot')}")
        if not taches:
            print("   (aucune tache)")
            continue
        print(f"   {'ID':<5} {'ROLE':<13} {'STATUT':<10} {'PACK':<5} {'DEPS':<14} TITRE")
        for d, m in taches:
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            bloquants = [x for x in deps
                         if not roles.dep_satisfaite(statuts.get(x, ""), str(m.get("role")))]
            dep_txt = ",".join(deps) if deps else "-"
            if bloquants and str(m.get("statut")) in ("a-faire", "pret"):
                dep_txt += " !"
            pack = "ok" if _pack_rempli(d / "context.md") else "VIDE"
            print(f"   {str(m.get('id')):<5} {str(m.get('role')):<13} "
                  f"{str(m.get('statut')):<10} {pack:<5} {dep_txt:<14} {m.get('titre', '')}")


def _section(texte: str, titre: str) -> str:
    m = re.search(r"##\s*" + titre + r"[^\n]*\n(.*?)(?=\n## |\Z)", texte, re.S | re.I)
    return (m.group(1).strip() if m else "")


def _citer_motif(motif: str) -> str:
    """Motif pret a coller dans un shell ; sans motif, placeholder lisible."""
    return shlex.quote(motif) if motif else '"<motif>"'


def _motif_eval(texte: str) -> str:
    """1re ligne non vide de « ## Motif » d'un result.md evaluateur ; ∅ -> ""."""
    ligne = next((l.strip() for l in _section(texte, "Motif").splitlines() if l.strip()), "")
    return "" if ligne == "∅" else ligne


def cmd_integrer(args):
    """Ce que le chef lit d'un result.md, et rien d'autre : Pour la suite,
    Ecarts, Verifie comment. Evite d'ouvrir les fichiers un par un."""
    projets = [dossier_projet(slugify(args.projet))] if args.projet else lister_projets()
    voulu = {t.upper() for t in (args.tid or [])}
    n = 0
    for proj in projets:
        taches, statuts = _etat_taches(proj)
        for d, m in taches:
            tid = str(m.get("id"))
            statut = str(m.get("statut"))
            if voulu and tid not in voulu:
                continue
            if not voulu and statut not in ("fait", "bloque", "revue"):
                continue
            rejet = (f"\n   remplacee par {m.get('remplacee_par', '')} — motif : {m.get('motif', '')}"
                     if statut == "rejete" else "")
            r = d / "result.md"
            if not r.exists():
                print(f"\n== {proj.name}/{tid} [{statut}] — {m.get('titre','')}{rejet}\n   result.md ABSENT")
                n += 1
                continue
            texte = r.read_text(encoding="utf-8")
            rmeta, _ = lire_frontmatter(r)
            entete = f"{statut} · result: {champ(rmeta, 'statut', '?')}"
            sections = ("Pour la suite", "Ecarts|Écarts", "Verifie comment|Vérifié comment")
            suite = ""
            if str(m.get("role")) == "evaluateur":
                deps = m.get("deps") or []
                deps = deps if isinstance(deps, list) else [deps]
                evalue = deps[0] if deps else "?"
                verdict = champ(rmeta, "verdict", "?")
                entete += f" · verdict: {verdict} → {evalue}"
                sections = ("Verdict", "Motif", "DoD", "Ecarts|Écarts", "Verifie comment|Vérifié comment")
                motif = _motif_eval(texte)
                if verdict == "virer" and statuts.get(evalue) not in ("rejete", "abandonne", None):
                    suite = f"   -> python3 bin/vx.py virer {evalue} --motif {_citer_motif(motif)} --projet {proj.name}"
                elif verdict == "retenir" and statuts.get(evalue) == "revue":
                    suite = f"   -> python3 bin/vx.py retenir {evalue} --projet {proj.name}"
            print(f"\n== {proj.name}/{tid} [{entete}] — {m.get('titre','')}{rejet}")
            for titre in sections:
                corps = _section(texte, "(?:" + titre + ")")
                print(f"   -- {titre.split('|')[0]}")
                for ligne in (corps or "∅").splitlines()[:40]:
                    print("   " + ligne)
            if suite:
                print(suite)
            n += 1
    if not n:
        print("rien a integrer (aucune tache fait/bloque/revue avec result.md).")


def _pack_rempli(chemin: Path) -> bool:
    if not chemin.exists():
        return False
    corps = deaccent(chemin.read_text(encoding="utf-8"))
    return "<!-- A REMPLIR" not in corps and "TODO-PACK" not in corps


def cmd_ready(args):
    """Tâches dispatchables : statut pret/a-faire, deps toutes faites, pack rempli."""
    projets = [dossier_projet(slugify(args.projet))] if args.projet else lister_projets()
    pretes = []
    for proj in projets:
        taches, statuts = _etat_taches(proj)
        for d, m in taches:
            if str(m.get("statut")) not in ("pret", "a-faire"):
                continue
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            if any(not roles.dep_satisfaite(statuts.get(x, ""), str(m.get("role"))) for x in deps):
                continue
            if not _pack_rempli(d / "context.md"):
                continue
            pretes.append({
                "id": str(m.get("id")), "titre": m.get("titre", ""),
                "role": str(m.get("role")), "projet": proj.name,
                "modele": str(m.get("modele", "inherit")),
                "pack": str((d / "context.md").relative_to(ROOT)),
                "result": str((d / "result.md").relative_to(ROOT)),
                "tokens": str(m.get("budget_tokens", "")),
            })
    if args.json:
        print(json.dumps(pretes, ensure_ascii=False, indent=2))
        return
    if not pretes:
        print("rien a dispatcher (verifie : deps faites ? pack rempli ? statut pret ?)")
        return
    print(f"{len(pretes)} tache(s) dispatchable(s) — lots parallelisables :")
    for t in pretes:
        print(f"  {t['id']}  {t['role']:<13} {t['pack']}")
        print(f"        {t['titre']}")


def cmd_pack_lint(args):
    proj, d, meta = _trouver_tache(args.projet, args.tid)
    pack = d / "context.md"
    if not pack.exists():
        die(f"pack absent : {pack.relative_to(ROOT)}")
    brut = pack.read_text(encoding="utf-8")
    texte = deaccent(brut)
    lignes = brut.splitlines()
    erreurs, avertis = [], []

    for sec in PACK_SECTIONS:
        if sec not in texte:
            erreurs.append(f"section manquante : {sec}")
    if "<!-- A REMPLIR" in texte or "TODO-PACK" in texte:
        erreurs.append("le pack contient encore des marqueurs a remplir")
    if len(lignes) > PACK_MAX_LIGNES:
        erreurs.append(f"pack trop long : {len(lignes)} lignes (max {PACK_MAX_LIGNES}) "
                       "— deporte le detail dans vault/connaissances/ et mets un lien")

    # whitelist : chemins en backticks sous "Fichiers autorises"
    bloc = ""
    m = re.search(r"##\s*Fichiers autoris\S*s(.*?)(?=\n## |\Z)", brut, re.S)
    if m:
        bloc = m.group(1)
    fichiers = re.findall(r"`([^`\n]+?)`", bloc)
    fichiers = [f.split(":")[0].strip() for f in fichiers if "/" in f or "." in f]
    if not fichiers:
        avertis.append("aucun fichier en backticks dans « Fichiers autorises » "
                       "— un worker sans whitelist va explorer et exploser son contexte")
    if len(fichiers) > PACK_MAX_FICHIERS:
        erreurs.append(f"whitelist trop large : {len(fichiers)} fichiers (max {PACK_MAX_FICHIERS}) "
                       "— decoupe la tache")
    for f in fichiers:
        if f.startswith(("http", "N/A", "aucun")):
            continue
        chemin = Path(f.split(":")[0]).expanduser()      # `~/...` et `chemin:L1-L2` acceptes
        if not (ROOT / chemin).exists() and not chemin.exists():
            avertis.append(f"chemin introuvable dans la whitelist : {f}")

    if "## Definition of Done" in texte:
        dod = re.search(r"##\s*Definition of Done(.*?)(?=\n## |\Z)", brut, re.S)
        if dod and not re.search(r"^\s*-\s*\[ \]", dod.group(1), re.M):
            erreurs.append("« Definition of Done » doit etre une checklist `- [ ]` verifiable")

    approx = int(len(brut) / 3.6)
    print(f"pack {meta.get('id')} — {pack.relative_to(ROOT)}")
    print(f"  {len(lignes)} lignes, ~{approx} tokens, {len(fichiers)} fichier(s) en whitelist")
    for a in avertis:
        print(f"  ~ {a}")
    for e in erreurs:
        print(f"  x {e}")
    if erreurs:
        sys.exit(2)
    print("  OK — pack dispatchable.")
    if str(meta.get("statut")) == "a-faire":
        print(f"  -> python3 bin/vx.py set {meta.get('id')} --statut pret --projet {proj.name}")


def cmd_index(args):
    VAULT.mkdir(parents=True, exist_ok=True)
    L = ["# INDEX du vault", "",
         f"<!-- genere par `python3 bin/vx.py index` le {now()} — ne pas editer a la main -->", ""]
    projets = lister_projets()
    if not projets:
        L += ["Aucun projet.", ""]
    for proj in projets:
        bmeta, _ = lire_frontmatter(proj / "brief.md")
        taches, statuts = _etat_taches(proj)
        faites = sum(1 for _, m in taches if str(m.get("statut")) == "fait")
        L += [f"## {proj.name} — {champ(bmeta, 'titre', proj.name)}", "",
              f"- statut : **{champ(bmeta, 'statut', '?')}** · avancement : {faites}/{len(taches)}",
              f"- objectif : {champ(bmeta, 'objectif')}",
              f"- [brief](projets/{proj.name}/brief.md) · "
              f"[plan](projets/{proj.name}/plan.md) · "
              f"[decisions](projets/{proj.name}/decisions.md) · "
              f"[journal](projets/{proj.name}/journal.md)", ""]
        if taches:
            L += ["| ID | role | statut | tache |", "|---|---|---|---|"]
            for d, m in taches:
                rel = d.relative_to(VAULT)
                L.append(f"| [{m.get('id')}]({rel}/context.md) | {m.get('role')} "
                         f"| {m.get('statut')} | {m.get('titre', '')} |")
            L.append("")
    notes = sorted((VAULT / "connaissances").glob("*.md")) if (VAULT / "connaissances").exists() else []
    if notes:
        L += ["## Connaissances capitalisees", ""]
        for n in notes:
            nmeta, _ = lire_frontmatter(n)
            L.append(f"- [{champ(nmeta, 'titre', n.stem)}](connaissances/{n.name}) — "
                     f"{champ(nmeta, 'resume', '')}")
        L.append("")
    (VAULT / "INDEX.md").write_text("\n".join(L), encoding="utf-8")
    if not getattr(args, "quiet", False):
        print(f"index ecrit : {(VAULT / 'INDEX.md').relative_to(ROOT)} ({len(projets)} projet(s))")


def cmd_archive(args):
    proj = dossier_projet(slugify(args.slug))
    dest = VAULT / "archive" / f"{today()}-{proj.name}"
    if dest.exists():
        shutil.rmtree(dest)
    shutil.move(str(proj), str(dest))
    cmd_index(argparse.Namespace(quiet=True))
    print(f"archive : {dest.relative_to(ROOT)}")


def cmd_doctor(_args):
    if roles.erreur():
        print(f"x roles.json invalide : {roles.erreur()}")
        sys.exit(3)
    pbs = []
    for proj in lister_projets():
        taches, statuts = _etat_taches(proj)
        ids = {str(m.get("id")) for _, m in taches}
        par_id = {str(m.get("id")): m for _, m in taches}
        dossiers: dict[str, list[str]] = {}
        for d, m in taches:
            dossiers.setdefault(str(m.get("id")), []).append(d.name)
        for tid, noms in dossiers.items():
            if len(noms) > 1:
                pbs.append(f"{proj.name}/{tid} : id en double ({', '.join(noms)})")
        for d, m in taches:
            tid = str(m.get("id"))
            statut = str(m.get("statut"))
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            for dep in deps:
                if dep not in ids:
                    pbs.append(f"{proj.name}/{tid} : dependance fantome {dep}")
                if dep == tid:
                    pbs.append(f"{proj.name}/{tid} : depend d'elle-meme")
                if statuts.get(dep) == "rejete" and statut not in STATUT_FERME:
                    pbs.append(f"{proj.name}/{tid} : depend de {dep} rejetee "
                               f"(remplacante {par_id[dep].get('remplacee_par', '')})")
            if statut not in STATUTS:
                pbs.append(f"{proj.name}/{tid} : statut inconnu « {statut} »")
            if statut == "rejete":
                n = str(m.get("remplacee_par", ""))
                if not n:
                    pbs.append(f"{proj.name}/{tid} : rejete sans remplacee_par")
                elif n not in ids:
                    pbs.append(f"{proj.name}/{tid} : remplacee_par {n} introuvable")
            if str(m.get("statut")) == "fait" and not (d / "result.md").exists():
                pbs.append(f"{proj.name}/{tid} : marquee fait sans result.md")
            if str(m.get("statut")) in ("pret", "en-cours") and not _pack_rempli(d / "context.md"):
                pbs.append(f"{proj.name}/{tid} : {m.get('statut')} mais pack vide")
            if str(m.get("role")) not in ROLES:
                pbs.append(f"{proj.name}/{tid} : role inconnu « {m.get('role')} »")
        # cycles
        graphe = {}
        for _, m in taches:
            deps = m.get("deps") or []
            graphe[str(m.get("id"))] = deps if isinstance(deps, list) else [deps]
        vus, pile = set(), set()

        def descend(n):
            if n in pile:
                pbs.append(f"{proj.name} : cycle de dependances sur {n}")
                return
            if n in vus:
                return
            vus.add(n); pile.add(n)
            for v in graphe.get(n, []):
                if v in graphe:
                    descend(v)
            pile.discard(n)

        for n in graphe:
            descend(n)
    print("\n".join(f"x {p}" for p in pbs) if pbs else "vault coherent.")
    sys.exit(2 if pbs else 0)


# --------------------------------------------------------------------------- #

def main():
    p = argparse.ArgumentParser(prog="vx.py", description="Pilote du Vault multi-agent.")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="cree/repare l'arborescence du vault").set_defaults(f=cmd_init)

    sp = sub.add_parser("projet", help="nouveau projet (brief + plan + journal)")
    sp.add_argument("slug"); sp.add_argument("--titre"); sp.add_argument("--force", action="store_true")
    sp.set_defaults(f=cmd_projet)

    sp = sub.add_parser("tache", help="nouvelle tache (task.md + pack vierge)")
    sp.add_argument("titre"); sp.add_argument("--projet", required=True)
    sp.add_argument("--role", required=True, choices=ROLES or None)
    sp.add_argument("--dep", action="append", help="ID d'une tache prerequise (repetable)")
    sp.add_argument("--tokens", default="40k", help="budget indicatif (defaut 40k)")
    sp.add_argument("--modele", help="inherit|opus|sonnet|haiku")
    sp.set_defaults(f=cmd_tache)

    sp = sub.add_parser("set", help="change le statut d'une tache")
    sp.add_argument("tid"); sp.add_argument("--statut", choices=STATUTS)
    sp.add_argument("--note"); sp.add_argument("--projet")
    sp.set_defaults(f=cmd_set)

    sp = sub.add_parser("virer", help="rejette le livrable d'un agent et cree la tache remplacante")
    sp.add_argument("tid"); sp.add_argument("--motif", required=True)
    sp.add_argument("--role", choices=ROLES or None, help="role de la remplacante (defaut : le meme)")
    sp.add_argument("--modele", choices=MODELES, help="modele de la remplacante (defaut : le meme)")
    sp.add_argument("--projet"); sp.set_defaults(f=cmd_virer)

    sp = sub.add_parser("retenir", help="valide un livrable en revue : revue -> fait")
    sp.add_argument("tid"); sp.add_argument("--projet")
    sp.add_argument("--sans-eval", action="store_true", help="retenir sans evaluation (le chef assume)")
    sp.set_defaults(f=cmd_retenir)

    sp = sub.add_parser("personnel", help="dossier RH : livrees, retenues, virees, renvoi par role et modele")
    sp.add_argument("--projet"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(f=cmd_personnel)

    sp = sub.add_parser("board", help="tableau de bord compact (a lire au lieu du vault)")
    sp.add_argument("--projet"); sp.set_defaults(f=cmd_board)

    sp = sub.add_parser("ready", help="taches dispatchables maintenant")
    sp.add_argument("--projet"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(f=cmd_ready)

    sp = sub.add_parser("integrer", help="les 3 sections des result.md que le chef lit (fait/bloque/revue)")
    sp.add_argument("tid", nargs="*"); sp.add_argument("--projet"); sp.set_defaults(f=cmd_integrer)

    sp = sub.add_parser("pack-lint", help="valide un context pack avant dispatch")
    sp.add_argument("tid"); sp.add_argument("--projet"); sp.set_defaults(f=cmd_pack_lint)

    sp = sub.add_parser("index", help="regenere vault/INDEX.md")
    sp.add_argument("--quiet", action="store_true"); sp.set_defaults(f=cmd_index)

    sp = sub.add_parser("archive", help="deplace un projet vers vault/archive/")
    sp.add_argument("slug"); sp.set_defaults(f=cmd_archive)

    sub.add_parser("doctor", help="detecte deps fantomes, cycles, incoherences").set_defaults(f=cmd_doctor)

    sub.add_parser("help", help="affiche cette aide").set_defaults(f=lambda _a: p.print_help())

    args = p.parse_args()
    args.f(args)


if __name__ == "__main__":
    main()
