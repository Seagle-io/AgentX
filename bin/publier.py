#!/usr/bin/env python3
"""publier — porte de publication d'un produit : GO / NO-GO (contrat seagle-pilotage §C5).

Lecture seule : git log / rev-parse sur les refs LOCALES (0 reseau), calendriers
marketing lus sur disque. Ecrit dans le vault seulement avec --acquitter
(acquits.md, append-only) et --taches (projet publication-<cle>).

Stdlib ; importe produits et vx.
Usage : python3 bin/publier.py <cle> [--json] [--taches] [--acquitter <id> --motif "<1 ligne>"]
"""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import json
import re
import shlex
import subprocess
import sys
import time
from datetime import date, datetime
from pathlib import Path

import produits
import vx

RE_FEAT = re.compile(r"^(feat|ajout|ajoute|nouveau|new)\b", re.I)
RE_OUVERT = re.compile(r"à (faire|corriger|vérifier|valider|relire)|\bTODO\b|- \[ \]", re.I)
RE_ACQUIT = re.compile(r"^- \d{4}-\d{2}-\d{2} `([^`]+)` — ", re.M)
MAX_PREUVES = 20
MAX_GLOB = 6          # au-dela, la WL du pack cite le motif, pas les fichiers


class GitErreur(RuntimeError):
    pass


class Refus(Exception):
    """Porte refusee avant verdict : code 2 (usage) ou 3 (registre)."""

    def __init__(self, msg: str, code: int):
        super().__init__(msg)
        self.code = code


def git(depot: Path, *argv: str) -> str:
    try:
        r = subprocess.run(["git", "-C", str(depot), *argv], capture_output=True,
                           encoding="utf-8", errors="replace", timeout=10)
    except (OSError, subprocess.SubprocessError) as e:
        raise GitErreur(f"git -C {depot} {shlex.join(argv)} : {e}") from None
    if r.returncode:
        raise GitErreur(f"git -C {depot} {shlex.join(argv)} : {r.stderr.strip() or f'rc {r.returncode}'}")
    return r.stdout


def _globs(motifs) -> list[str]:
    return [f":(glob){m}" for m in motifs]


def _cmd(depot: str, argv) -> str:
    return f"git -C {depot} {shlex.join(argv)}"


def _sujet(ligne: str) -> str:
    return (ligne.split(" ", 2) + ["", ""])[2]


def _iso(t: str) -> datetime:
    return datetime.fromisoformat(t)


def _controle(cid: str, commande: str, t0: float, statut: str) -> dict:
    return {"id": cid, "statut": statut, "commande": commande,
            "duree_ms": int((time.monotonic() - t0) * 1000)}


def _ecart(id_: str, gravite: str, titre: str, preuves: list[str], role: str) -> dict:
    reste = len(preuves) - MAX_PREUVES
    return {"id": id_, "type": id_.split(":", 1)[0], "gravite": gravite, "titre": titre,
            "preuves": preuves[:MAX_PREUVES] + ([f"… {reste} autres"] if reste > 0 else []),
            "role": role, "acquitte": False, "tache": ""}


def _statut(nouveaux: list[dict], erreur: bool) -> str:
    if erreur:
        return "erreur"
    if any(e["gravite"] == "bloquant" for e in nouveaux):
        return "ecart"
    return "avertissement" if nouveaux else "ok"


def _dossier(cle: str) -> Path:
    return vx.VAULT / "projets" / f"publication-{cle}"


def _acquits(cle: str) -> set[str]:
    f = _dossier(cle) / "acquits.md"
    return set(RE_ACQUIT.findall(f.read_text(encoding="utf-8"))) if f.exists() else set()


def _produit(cle: str) -> produits.Produit:
    err = produits.erreur()
    if err:
        raise Refus(f"produits.json invalide : {err}", 3)
    p = produits.produit(cle)
    if p is None:
        raise Refus(f"produit inconnu : {cle} (cles : {', '.join(produits.tous())})", 2)
    if p.entreprise:
        raise Refus(f"{cle} : entreprise, porte produit seulement", 2)
    if p.site is None:
        raise Refus(f"{cle} : site null, rien a publier", 2)
    ko = produits.verifier(p)
    if ko:
        raise Refus(f"{cle} : registre non verifie : {' ; '.join(ko)}", 3)
    return p


def evaluer(cle: str, aujourd_hui: date | None = None) -> dict:
    t0 = time.monotonic()
    p = _produit(cle)
    controles = [_controle("P0", "produits.erreur() ; produits.verifier(p)", t0, "ok")]
    ecarts: list[dict] = []
    s = p.site
    S, B = produits.chemin(s.depot), s.branche

    # P1 site sur sa branche + P2 reference site (P2 vide -> ecart P1 force)
    t0 = time.monotonic()
    a_hors = ("log", "--format=%h %cs %s", "-n", "50", f"{B}..HEAD", "--",
              *_globs(s.pages + s.textes + s.captures))
    try:
        hors = git(S, *a_hors).splitlines()
        head = git(S, "rev-parse", "--short", "HEAD").strip()
        controles.append(_controle("P1", _cmd(s.depot, a_hors), t0, "ecart" if hors else "ok"))
    except GitErreur as e:
        hors, head = [], ""
        controles.append(_controle("P1", str(e), t0, "erreur"))
    t0 = time.monotonic()
    a_txt = ("log", "-1", "--format=%cI", B, "--", *_globs(s.pages + s.textes))
    a_cap = ("log", "-1", "--format=%cI", B, "--", *_globs(s.captures))
    try:
        t_txt, t_cap = git(S, *a_txt).strip(), git(S, *a_cap).strip()
        absentes = [t for vide, t in ((not t_txt, f"pages et textes absents de {B}"),
                                      (not t_cap, f"captures absentes de {B}")) if vide]
        controles.append(_controle("P2", f"{_cmd(s.depot, a_txt)} ; {_cmd(s.depot, a_cap)}", t0,
                                   "ecart" if absentes else "ok"))
    except GitErreur as e:
        t_txt = t_cap = ""
        absentes = []
        controles.append(_controle("P2", str(e), t0, "erreur"))
    titres = [f"{len(hors)} commits du site hors {B} touchent {p.nom}"] if hors else []
    preuves = list(hors)
    if absentes:
        titres += absentes
        preuves.append(f"{B} T_txt={t_txt or '∅'} T_cap={t_cap or '∅'}")
    if titres and head:
        ecarts.append(_ecart(f"site-branche:{cle}:{head}", "bloquant", " ; ".join(titres), preuves, "devops"))

    uis = [d for d in p.depots if d.ui]

    # P3 commits non refletes par les textes du site (sujets seulement)
    t0, n0, cmds, err = time.monotonic(), len(ecarts), [], False
    for d in uis if t_txt else []:
        argv = ("log", "--no-merges", "--format=%h %cI %s", f"--since={t_txt}",
                d.branche_publication, "--", *_globs(d.ui))
        try:
            lignes = git(produits.chemin(d.chemin), *argv).splitlines()
            cmds.append(_cmd(d.chemin, argv))
        except GitErreur as e:
            cmds.append(str(e))
            err = True
            continue
        feat = [l for l in lignes if RE_FEAT.match(_sujet(l))]
        autres = [l for l in lignes if not RE_FEAT.match(_sujet(l))]
        nom = Path(d.chemin).name
        if feat:
            ecarts.append(_ecart(f"textes:{cle}:{feat[0].split()[0]}", "bloquant",
                                 f"{len(lignes)} commits de {nom} dont {len(feat)} feat depuis les textes du site "
                                 f"({t_txt[:10]}) : à vérifier par un agent", feat, "marketing"))
        if autres:
            ecarts.append(_ecart(f"commits:{cle}:{autres[0].split()[0]}", "avertissement",
                                 f"{len(autres)} autres commits UI de {nom} depuis {t_txt[:10]}", autres, ""))
    if uis and not t_txt:
        cmds, err = ["T_txt vide (P2)"], True
    controles.append(_controle("P3", " ; ".join(cmds) or "∅ dépôt ui", t0, _statut(ecarts[n0:], err)))

    # P4 captures du site vs derniere modification UI
    t0, n0, cmds, err = time.monotonic(), len(ecarts), [], False
    t_ui, src = "", ""
    for d in uis if t_cap else []:
        argv = ("log", "-1", "--format=%cI", d.branche_publication, "--", *_globs(d.ui))
        try:
            t = git(produits.chemin(d.chemin), *argv).strip()
            cmds.append(_cmd(d.chemin, argv))
        except GitErreur as e:
            cmds.append(str(e))
            err = True
            continue
        if t and (not t_ui or _iso(t) > _iso(t_ui)):
            t_ui, src = t, d.chemin
    if uis and not t_cap:
        cmds, err = ["T_cap vide (P2)"], True
    if t_ui and _iso(t_cap) < _iso(t_ui):
        ecarts.append(_ecart(f"captures:{cle}:{t_ui[:10]}", "bloquant",
                             f"captures du site ({t_cap[:10]}) antérieures à l'UI ({t_ui[:10]})",
                             [f"T_cap {t_cap} {s.depot} {B}", f"T_ui {t_ui} {src}"], "designer"))
    controles.append(_controle("P4", " ; ".join(cmds) or "∅ dépôt ui", t0, _statut(ecarts[n0:], err)))

    # P5 calendrier marketing (lecture fichier, pas git)
    t0, n0 = time.monotonic(), len(ecarts)
    m = p.marketing
    vus: set[str] = set()
    for cal in m.calendriers if m else ():
        f = produits.chemin(m.vault) / cal
        for n, ligne in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if not (any(x.lower() in ligne.lower() for x in m.motifs) and RE_OUVERT.search(ligne)):
                continue
            id_ = f"marketing:{hashlib.sha1((cal + ligne).encode()).hexdigest()[:8]}"
            if id_ not in vus:
                vus.add(id_)
                ecarts.append(_ecart(id_, "bloquant", f"{cal}:{n} ouvert : {ligne.strip()[:80]}",
                                     [f"{cal}:{n}: {ligne}"], "marketing"))
    lecture = " ; ".join(f"lecture {m.vault}/{c}" for c in m.calendriers) if m else "∅ marketing"
    controles.append(_controle("P5", lecture, t0, _statut(ecarts[n0:], False)))

    acquits = _acquits(cle)
    for e in ecarts:
        e["acquitte"] = e["id"] in acquits
    nogo = (any(e["gravite"] == "bloquant" and not e["acquitte"] for e in ecarts)
            or any(c["statut"] == "erreur" for c in controles))
    quand = datetime.now() if aujourd_hui is None else datetime.combine(aujourd_hui, datetime.min.time())
    return {"produit": cle, "verdict": "NO-GO" if nogo else "GO", "horodate": quand.strftime("%Y-%m-%d %H:%M"),
            "controles": controles, "ecarts": ecarts, "taches_creees": []}


def _projet(p: produits.Produit) -> Path:
    proj = _dossier(p.cle)
    if not proj.exists():
        with contextlib.redirect_stdout(sys.stderr):
            vx.cmd_projet(argparse.Namespace(slug=proj.name, titre=f"Publication {p.nom}",
                                             force=False, produit=p.cle))
    return proj


def _acquitter(cle: str, id_: str, motif: str) -> None:
    if not motif.strip() or "\n" in motif:
        raise Refus("--acquitter exige --motif \"<1 ligne>\"", 2)
    ids = [e["id"] for e in evaluer(cle)["ecarts"]]
    if id_ not in ids:
        raise Refus(f"ecart absent de l'evaluation courante : {id_} (ids : {', '.join(ids) or '∅'})", 2)
    f = _projet(produits.produit(cle)) / "acquits.md"
    entete = "" if f.exists() else f"# Acquits — publication {cle}\n\nAppend-only. L'acquit expire quand l'id change.\n\n"
    with f.open("a", encoding="utf-8") as fh:
        fh.write(f"{entete}- {vx.today()} `{id_}` — {motif.strip()}\n")


def _wl(p: produits.Produit, e: dict) -> list[tuple[str, str, str]]:
    """(chemin, droit, champ du registre) : fichiers du motif dans site.depot ; > MAX_GLOB -> le motif."""
    s, m = p.site, p.marketing
    if e["type"] == "marketing":
        return [(f"{m.vault}/{c}", "E", "marketing.calendriers") for c in m.calendriers]
    par_type = {"site-branche": [("pages", "L"), ("textes", "L"), ("captures", "L")],
                "textes": [("textes", "E"), ("pages", "L")],
                "captures": [("captures", "E"), ("pages", "L")]}
    racine, out = produits.chemin(s.depot), []
    for champ, droit in par_type[e["type"]]:
        for motif in getattr(s, champ):
            trouves = sorted(racine.glob(motif))
            chemins = [f.relative_to(racine) for f in trouves] if len(trouves) <= MAX_GLOB else [motif]
            out += [(f"{s.depot}/{c}", droit, f"site.{champ}") for c in chemins]
    return out


def _remplir(pack: Path, p: produits.Produit, e: dict) -> None:
    """Pre-remplit le pack ; « ## Décisions actées » garde le marqueur : le chef relit avant dispatch."""
    wl = "\n".join(f"| `{c}` | {droit} | {champ} |" for c, droit, champ in _wl(p, e))
    sections = {
        "Mission": f"Résoudre l'écart `{e['id']}` ({e['gravite']}, {e['type']}) : {e['titre']}.",
        "Definition of Done": f"- [ ] `agentx publier {p.cle} --json` → id `{e['id']}` absent des `ecarts`\n"
                              "- [ ] `result.md` rempli selon « Format de sortie »",
        "Fichiers autorisés": f"| Chemin | Droit | Pourquoi |\n|---|---|---|\n{wl}",
        "Contrats": f"Preuves `agentx publier {p.cle} --json`, verbatim :\n```\n" + "\n".join(e["preuves"]) + "\n```",
        "Hors périmètre": "- jamais push, jamais migration",
    }
    texte = pack.read_text(encoding="utf-8")
    for titre, corps in sections.items():
        texte = re.sub(rf"(^## {titre}\n).*?(?=^## )", lambda mm: f"{mm.group(1)}{corps}\n\n", texte,
                       count=1, flags=re.S | re.M)
    pack.write_text(texte, encoding="utf-8")


def _taches(cle: str, r: dict) -> list[str]:
    a_faire = [e for e in r["ecarts"] if e["gravite"] == "bloquant" and not e["acquitte"]]
    if not a_faire:
        return []
    p = produits.produit(cle)
    proj = _projet(p)
    ouvertes = [(str(m.get("id", "")), str(m.get("titre", ""))) for _, m in vx.lister_taches(proj)
                if m.get("statut") in vx.STATUT_OUVERT]
    creees = []
    for e in a_faire:
        marque = f"{e['type']} {e['id'].rsplit(':', 1)[1]}"
        e["tache"] = next((tid for tid, titre in ouvertes if marque in titre), "")
        if e["tache"]:
            continue
        titre = f"publier {cle} : {marque}"
        sortie = io.StringIO()
        with contextlib.redirect_stdout(sortie):
            vx.cmd_tache(argparse.Namespace(titre=titre, projet=proj.name, role=e["role"],
                                            dep=None, tokens="40k", modele=None))
        tid, rel = sortie.getvalue().split()[:2]
        _remplir(vx.ROOT / rel / "context.md", p, e)
        e["tache"] = tid
        creees.append(tid)
        ouvertes.append((tid, titre))
    return creees


def cmd(args) -> None:
    try:
        if args.motif and not args.acquitter:
            raise Refus("--motif sans --acquitter", 2)
        if args.acquitter:
            _acquitter(args.cle, args.acquitter, args.motif or "")
        r = evaluer(args.cle)
        if args.taches:
            r["taches_creees"] = _taches(args.cle, r)
    except Refus as e:
        print(f"publier: erreur: {e}", file=sys.stderr)
        sys.exit(e.code)
    if args.json:
        print(json.dumps(r, ensure_ascii=False, indent=2))
    else:
        print(f"{r['verdict']} {args.cle}")
        for e in r["ecarts"]:
            suite = (" (acquitté)" if e["acquitte"] else "") + (f" → {e['tache']}" if e["tache"] else "")
            print(f"[{e['gravite']}] {e['id']} — {e['titre']}{suite}")
    sys.exit(1 if r["verdict"] == "NO-GO" else 0)


def main():
    ap = argparse.ArgumentParser(prog="publier.py", description="Porte de publication d'un produit : GO / NO-GO.")
    ap.add_argument("cle")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--taches", action="store_true", help="1 tache par ecart bloquant non acquitte")
    ap.add_argument("--acquitter", metavar="ID", help="acquitte un ecart de l'evaluation courante")
    ap.add_argument("--motif", help="1 ligne, obligatoire avec --acquitter")
    cmd(ap.parse_args())


if __name__ == "__main__":
    main()
