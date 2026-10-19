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
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

import produits
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
    "## Environnement",
    "## Budget",
    "## Format de sortie",
)
PACK_MAX_LIGNES = 220
PACK_MAX_FICHIERS = 12
EVENEMENTS = ROOT / "run" / "evenements.jsonl"   # bin/sonnerie.py (agent rendu), bin/garde_dispatch.py (dispatch)
PRET_SANS_AGENT_S = 15 * 60
PORTABLES = ("bin", "dash", "outils", ".claude", "docs")   # livrables qui doivent tourner ailleurs
RE_CHEMIN_PERSO = re.compile(r"/home/[A-Za-z0-9._-]+/")


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
    meta, corps, _ = _frontmatter(chemin.read_text(encoding="utf-8"))
    return meta, corps


def _frontmatter(texte: str) -> tuple[dict, str, dict]:
    """(meta, corps, ligne brute par cle d'une seule ligne) ; corps = tout apres la ligne `---` fermante."""
    if not texte.startswith("---"):
        return {}, texte, {}
    parts = texte.split("\n---", 1)
    if len(parts) < 2:
        return {}, texte, {}
    bloc, corps = parts[0][3:], parts[1].partition("\n")[2]
    meta: dict = {}
    brut: dict = {}
    avec_items: set[str] = set()   # clés ayant réellement reçu un « - item »
    cle_liste = None
    for ligne in bloc.splitlines():
        if not ligne.strip() or ligne.lstrip().startswith("#"):
            continue
        if ligne.lstrip().startswith("- ") and cle_liste:
            meta[cle_liste].append(_valeur(ligne.lstrip()[2:].strip()))
            avec_items.add(cle_liste)
            brut.pop(cle_liste, None)
            continue
        m = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", ligne)
        if not m:
            continue
        cle, val = m.group(1), m.group(2).strip()
        brut[cle] = ligne
        if val == "":
            # Ambigu : soit une liste « - x » qui suit, soit une valeur vide.
            # Tranché après la boucle selon la présence d'items.
            cle_liste, meta[cle] = cle, []
        elif val.startswith("[") and val.endswith("]"):
            cle_liste = None
            inner = val[1:-1].strip()
            meta[cle] = [_valeur(x.strip()) for x in inner.split(",") if x.strip()] if inner else []
            avec_items.add(cle)
        else:
            cle_liste = None
            meta[cle] = _valeur(val)
    for cle, val in list(meta.items()):
        if val == [] and cle not in avec_items and cle not in CLES_LISTE:
            meta[cle] = ""
    return meta, corps, brut


def champ(meta: dict, cle: str, defaut: str = "—") -> str:
    """Valeur d'affichage : remplace vide / liste vide par un marqueur lisible."""
    val = meta.get(cle)
    if isinstance(val, list):
        return ", ".join(val) if val else defaut
    val = str(val).strip() if val is not None else ""
    return val or defaut


class Texte(str):
    """Chaine qui doit rester chaine en YAML : lue entre guillemets, ou saisie (titre, note, motif)."""


# lu par YAML comme booleen, null, nombre ou date si non quote
_AUTRE_TYPE = re.compile(
    r"(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF"
    r"|<<|=|[-+]?\.?[0-9][0-9a-fA-F_.:xXoObBeE+-]*|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN)"
    r"|\d{4}-\d\d?-\d\d?(?:[Tt\s].*)?)", re.S)

# sauts de ligne, tabulation, controles C0/DEL/C1 : cassent la ligne (vx) ou le YAML -> echappes entre "…"
_CONTROLE = r"\x00-\x1f\x7f-\x9f\u2028\u2029"
_ECHAPPE = {"\\": "\\\\", '"': '\\"', "\n": "\\n", "\r": "\\r", "\t": "\\t"}
_DE_ECHAPPE = {v[1]: k for k, v in _ECHAPPE.items()}


def _valeur(val: str) -> str:
    """Valeur lue : seule une paire "…" (\\" \\\\ \\n \\r \\t \\xHH \\uHHHH) ou '…' ('' -> ') est retiree, sinon brute."""
    if m := re.fullmatch(r'"((?:[^"\\]|\\.)*)"', val, re.S):
        return Texte(re.sub(r"\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)", lambda e: chr(int(e.group(1)[1:], 16))
                            if len(e.group(1)) > 1 else _DE_ECHAPPE.get(e.group(1), e.group(0)), m.group(1)))
    if m := re.fullmatch(r"'((?:[^']|'')*)'", val, re.S):
        return Texte(m.group(1).replace("''", "'"))
    return val


def _scalaire(val) -> str:
    """Valeur YAML relue a l'identique par vx et par YAML : guillemets doubles si besoin."""
    s = str(val)
    if (s != s.strip() or re.search(rf"\s#|:(?:\s|$)|[{_CONTROLE}]", s) or s.startswith(tuple("-?:,[]{}#&*!|>'\"%@`"))
            or (isinstance(val, Texte) and _AUTRE_TYPE.fullmatch(s))):
        return '"' + re.sub(rf'[\\"{_CONTROLE}]', lambda e: _ECHAPPE.get(e.group()) or (
            f"\\x{ord(e.group()):02x}" if ord(e.group()) < 0x100 else f"\\u{ord(e.group()):04x}"), s) + '"'
    return s


def ecrire_frontmatter(chemin: Path, meta: dict, corps: str):
    """Cle de valeur inchangee : ligne d'origine recopiee telle quelle (aller-retour a l'octet)."""
    ancien, _, brut = _frontmatter(chemin.read_text(encoding="utf-8")) if chemin.exists() else ({}, "", {})
    lignes = ["---"]
    for cle, val in meta.items():
        if cle in brut and ancien.get(cle) == val:
            lignes.append(brut[cle])
        elif isinstance(val, list):
            lignes.append(f"{cle}: [{', '.join(val)}]")
        else:
            lignes.append(f"{cle}: {_scalaire(val)}" if str(val) else f"{cle}:")
    lignes.append("---")
    chemin.write_text("\n".join(lignes) + "\n" + corps, encoding="utf-8")


def rendre_template(nom: str, **vars_) -> str:
    src = TEMPLATES / nom
    if not src.exists():
        die(f"template manquant : {src.relative_to(ROOT)} (lance `vx init`)")
    texte = src.read_text(encoding="utf-8")
    # frontmatter : valeurs passees par _scalaire (YAML valide) ; corps : brutes
    fm, sep, corps = texte.partition("\n---") if texte.startswith("---") else ("", "", texte)
    for cle, val in vars_.items():
        fm = fm.replace("{{" + cle + "}}", _scalaire(val))
        corps = corps.replace("{{" + cle + "}}", str(val))
    return fm + sep + corps


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


def _exiger_produit(cle: str):
    if cle not in produits.tous():
        die(f"produit inconnu : {cle} (cles : {', '.join(produits.tous()) or produits.erreur()})", 2)


def cmd_projet(args):
    if args.produit:
        _exiger_produit(args.produit)
    slug = Texte(slugify(args.slug))
    proj = VAULT / "projets" / slug
    if proj.exists() and not args.force:
        die(f"le projet {slug} existe deja (--force pour ecraser le brief)")
    (proj / "taches").mkdir(parents=True, exist_ok=True)
    titre = Texte(args.titre or slug.replace("-", " ").capitalize())
    (proj / "brief.md").write_text(
        rendre_template("brief.md", SLUG=slug, TITRE=titre, DATE=today(), PRODUIT=args.produit or ""),
        encoding="utf-8")
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


def cmd_rattacher(args):
    _exiger_produit(args.cle)
    proj = dossier_projet(slugify(args.projet))
    meta, corps = lire_frontmatter(proj / "brief.md")
    if not meta:
        die(f"{(proj / 'brief.md').relative_to(ROOT)} sans frontmatter : rien a rattacher")
    if meta.get("produit") == args.cle:
        print(f"{proj.name} : deja rattache a {args.cle} (0 changement)")
        return
    if "produit" not in meta:  # ordre du gabarit : produit apres depot
        items = list(meta.items())
        i = [k for k, _ in items].index("depot") + 1 if "depot" in meta else len(items)
        meta = dict(items[:i] + [("produit", "")] + items[i:])
    avant = meta["produit"]
    meta["produit"] = args.cle
    ecrire_frontmatter(proj / "brief.md", meta, corps)
    journaliser(proj, f"rattaché à {args.cle}" + (f" (avant : {avant})" if avant else ""))
    print(f"{proj.name} : {avant or '∅'} -> {args.cle}")


def cmd_publier(args):
    try:
        import publier
    except ModuleNotFoundError as e:
        if e.name != "publier":
            raise
        die("bin/publier.py absent : porte de publication pas encore livree", 3)
    sys.exit(publier.cmd(args))


def _exiger_registre():
    if roles.erreur():
        die(f"roles.json invalide : {roles.erreur()}", 3)


def _blocs_code(lignes: list[str]) -> tuple[list[bool], int | None]:
    """Par ligne : dans un bloc ``` ou ~~~ (delimiteurs compris) ; + L<n> d'un bloc non referme, sinon None."""
    dedans, fence, ouverture = [], "", None
    for n, l in enumerate(lignes, 1):
        s, avant = l.lstrip(), bool(fence)
        if fence and s.startswith(fence):   # ferme par le meme delimiteur seulement
            fence = ""
        elif not fence and s.startswith(("```", "~~~")):
            fence, ouverture = s[:3], n
        dedans.append(avant or bool(fence))
    return dedans, ouverture if fence else None


def _avec_fiche_env(pack: str, proj: Path) -> str:
    """Recopie vault/projets/<slug>/env.md en tete de « ## Environnement » du pack ; absent -> inchange."""
    env = proj / "env.md"
    if not env.exists():
        return pack
    lignes = pack.split("\n")
    i = next((i for i, l in enumerate(lignes) if deaccent(l).lower().startswith("## environnement")), None)
    if i is None:
        return pack
    # pas lire_frontmatter : son lstrip("-\n") mange le « - » d'une 1re puce
    corps = re.sub(r"\A---\n.*?\n---[^\n]*\n", "", env.read_text(encoding="utf-8"), flags=re.S)
    # hors blocs de code : H1, lignes vides et marqueur de lint ecartes ;
    # « ## X » -> ligne vide + « **X** » : le pack garde ses 9 titres
    src, fiche = corps.split("\n"), []
    for l, code in zip(src, _blocs_code(src)[0]):
        if code:
            fiche.append(l)
        elif l.startswith("## "):
            fiche += ["", f"**{l[3:].strip()}**"]
        elif l.strip() and not l.startswith("# ") and MARQUEUR not in l:
            fiche.append(l)
    lignes[i + 1:i + 1] = [
        f"Fiche projet (`vault/projets/{proj.name}/env.md`, recopiée au scaffold — ne pas éditer ici) :",
        *fiche, ""]
    return "\n".join(lignes)


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
            rendre_template("task.md", ID=tid, TITRE=Texte(args.titre), ROLE=args.role,
                            PROJET=Texte(proj.name), DATE=today(),
                            DEPS=", ".join(deps), STATUT="a-faire",
                            TOKENS=args.tokens, MODELE=args.modele or roles.role(args.role).modele),
            encoding="utf-8")
        meta, corps = lire_frontmatter(d / "task.md")
        meta["effort"] = getattr(args, "effort", None) or roles.role(args.role).effort
        ecrire_frontmatter(d / "task.md", meta, corps)
        if not (d / "context.md").exists():
            (d / "context.md").write_text(
                _avec_fiche_env(rendre_template("context.md", ID=tid, TITRE=args.titre, ROLE=args.role,
                                                PROJET=proj.name, DATE=today()), proj),
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
    if args.statut == "en-cours" and avant != "en-cours" and not (args.force or args.dispatch):
        die("en-cours = dispatch : lance l'agent (le hook passe la tâche en-cours)")
    if args.statut == "rejete":
        die(f"rejete : passe par `virer {tid} --motif \"...\"`")
    if args.statut == "fait" and roles.livre_en(role) == "revue" and avant != "fait":
        die(f"{tid} ({role}) livre en revue : `retenir {tid}`")
    if avant == "rejete":
        die(f"{tid} rejetee : statut terminal (remplacante : {meta.get('remplacee_par', '')})")
    if args.statut:
        meta["statut"] = args.statut
    if args.note:
        meta["note"] = Texte(args.note)
    meta["maj"] = today()
    ecrire_frontmatter(d / "task.md", meta, corps)
    journaliser(proj, f"{meta['id']} statut {avant} -> {meta.get('statut')}"
                      + (f" ({args.note})" if args.note else "")
                      + (" [dispatch]" if args.dispatch else " [force]" if args.force else ""))
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
        motif = Texte(re.sub(r"\s+", " ", args.motif).strip().replace("[", "(").replace("]", ")"))
        if not 1 <= len(motif) <= 200:
            die(f"motif : 1 a 200 caracteres (recu {len(motif)})")
        if not (d / "context.md").exists():
            die(f"{tid} sans pack : {(d / 'context.md').relative_to(ROOT)} absent, rien a recopier", 2)
        role = args.role or str(meta.get("role"))
        modele = args.modele or str(meta.get("modele", ""))
        effort = args.effort or str(meta.get("effort", ""))
        taches = lister_taches(proj)
        nums = [int(x.group(1)) for _, m in taches if (x := re.match(r"T(\d+)", str(m.get("id", ""))))]
        n = f"T{max(nums) + 1:03d}"
        titre = Texte(meta.get("titre", ""))
        nd = proj / "taches" / f"{n}-{slugify(titre)}"
        nd.mkdir(parents=True, exist_ok=False)

        ecrire_frontmatter(nd / "task.md", {
            "id": n, "titre": titre, "projet": Texte(proj.name), "role": role, "statut": "a-faire",
            "deps": meta.get("deps") or [], "budget_tokens": meta.get("budget_tokens", ""),
            "modele": modele, **({"effort": effort} if effort else {}),
            "cree": today(), "maj": today(), "tags": ["tache"], "remplace": tid,
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
        print(f"   {'ID':<5} {'ROLE':<13} {'STATUT':<10} {'MODELE/EFFORT':<15} {'PACK':<5} {'DEPS':<14} TITRE")
        for d, m in taches:
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            bloquants = [x for x in deps
                         if not roles.dep_satisfaite(statuts.get(x, ""), str(m.get("role")))]
            dep_txt = ",".join(deps) if deps else "-"
            if bloquants and str(m.get("statut")) in ("a-faire", "pret"):
                dep_txt += " !"
            pack = "ok" if _pack_rempli(d / "context.md") else "VIDE"
            me = f"{m.get('modele') or '-'}/{m.get('effort') or '-'}"
            print(f"   {str(m.get('id')):<5} {str(m.get('role')):<13} "
                  f"{str(m.get('statut')):<10} {me:<15} {pack:<5} {dep_txt:<14} {m.get('titre', '')}")


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
    Ecarts, Verifie comment, Retour sur le pack. Evite d'ouvrir les fichiers un par un."""
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
            sections = ("Pour la suite", "Ecarts|Écarts", "Verifie comment|Vérifié comment", "Retour sur le pack")
            suite = ""
            if str(m.get("role")) == "evaluateur":
                deps = m.get("deps") or []
                deps = deps if isinstance(deps, list) else [deps]
                evalue = deps[0] if deps else "?"
                verdict = champ(rmeta, "verdict", "?")
                entete += f" · verdict: {verdict} → {evalue}"
                sections = ("Verdict", "Motif", "DoD", "Ecarts|Écarts", "Verifie comment|Vérifié comment",
                            "Retour sur le pack")
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


# 1re regex qui matche (texte desaccentue, minuscules) ; sinon « autre »
MANQUES_CATEGORIES = (
    ("environnement", r"seed|\bcompte|login|cookie|mot de passe|\bport|base_url|\.env|\btz|fuseau|docker|image"),
    ("version", r"version|v\d+\.\d+|changelog|notes de version|release"),
    ("outil", r"outil|\btools?\b|hors outils|bash\(|commande .* (absente|interdite)|diff|sed|psql|node -e"
               r"|make -n|syntaxe|git show"),
    ("contrat", r"signature|\btype|contrat|interface|schema|\.d\.ts|props|\bapi|forme de|semantique"),
    ("coordonnee", r"\bligne|:\d+-\d+|coordonn|perime|decal"),
    ("baseline", r"baseline|avant|arbre partage|deja modifie|\bhunk|commit"),
    ("wl", r"whitelist|wl|hors wl|fichier .* absent"),
)


def categorie_manque(texte: str) -> str:
    t = deaccent(texte).lower()
    return next((cle for cle, rx in MANQUES_CATEGORIES if re.search(rx, t)), "autre")


def _manques_result(texte: str) -> list[str]:
    """Lignes « Manquait » de « ## Retour sur le pack » : texte apres « : », « | Inutile » coupe, « ∅… » ignore."""
    out = []
    for ligne in _section(texte, "Retour sur le pack").splitlines():
        m = re.match(r"\s*(?:-\s*)?Manquait[^:]*:(.*)$", ligne)
        if not m:
            continue
        t = re.sub(r"\|\s*Inutile.*$", "", m.group(1)).strip()
        if t and not t.startswith("∅"):     # « ∅ · Inutile … » : rien ne manquait
            out.append(t)
    return out


def cmd_manques(args):
    """Les « Manquait » des result.md (archive exclue), par categorie et role. Lecture seule."""
    projets = [dossier_projet(slugify(args.projet))] if args.projet else lister_projets()
    cats = {cle: {"total": 0, "roles": {}, "exemples": []}
            for cle in [c for c, _ in MANQUES_CATEGORIES] + ["autre"]}
    for proj in projets:
        for d, m in lister_taches(proj):
            role = str(m.get("role"))
            r = d / "result.md"
            if (args.role and role != args.role) or not r.exists():
                continue
            for texte in _manques_result(r.read_text(encoding="utf-8")):
                c = cats[categorie_manque(texte)]
                c["total"] += 1
                c["roles"][role] = c["roles"].get(role, 0) + 1
                if len(c["exemples"]) < 3:
                    c["exemples"].append({"projet": proj.name, "tid": str(m.get("id")),
                                          "role": role, "texte": texte})
    categories = sorted(
        ({"cle": cle, "total": c["total"],
          "roles": dict(sorted(c["roles"].items(), key=lambda x: (-x[1], x[0]))),
          "exemples": c["exemples"]} for cle, c in cats.items() if c["total"]),
        key=lambda c: -c["total"])
    out = {"perimetre": projets[0].name if args.projet else "tous",
         "total": sum(c["total"] for c in categories), "categories": categories}
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return
    if not out["total"]:
        print("aucun Manquait — rien a agreger.")
        return
    print(f"MANQUES — {out['perimetre']}" + (f", role {args.role}" if args.role else "")
          + f", {out['total']} Manquait")
    for c in categories:
        roles_txt = " · ".join(f"{r} {n}" for r, n in c["roles"].items())
        print(f"\n  {c['cle']:<13} {c['total']:>4}   {roles_txt}")
        for e in c["exemples"]:
            t = e["texte"] if len(e["texte"]) <= 100 else e["texte"][:99] + "…"
            print(f"     {e['projet']}/{e['tid']} — {t}")


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


def _accolades(chemin: str) -> list[str]:
    """`a/{x,y}.ts` -> [`a/x.ts`, `a/y.ts`] (accolades imbriquees developpees de proche en proche)."""
    m = re.search(r"\{([^{}]*)\}", chemin)
    if not m:
        return [chemin]
    return [r for alt in m.group(1).split(",")
            for r in _accolades(chemin[:m.start()] + alt.strip() + chemin[m.end():])]


def _whitelist(bloc: str) -> tuple[list[str], list[str]]:
    """Chemins (1re colonne du tableau, accolades developpees) et droit (2e colonne) du bloc.
    Sans tableau : tous les chemins en backticks du bloc, droit vide."""
    lignes = [l.strip() for l in bloc.splitlines() if l.strip().startswith("|")]
    cellules = [[c.strip() for c in l.strip("|").split("|")] for l in lignes]
    cellules = [c for c in cellules if not re.fullmatch(r"[-:\s|]*", "".join(c))]
    if not cellules:
        cellules = [[c] for c in re.findall(r"`[^`\n]+?`", bloc)]
    fichiers, droits = [], []
    for c in cellules:
        droit = c[1].strip("` ") if len(c) > 1 else ""
        for f in re.findall(r"`([^`\n]+?)`", c[0]):
            f = f.split(":")[0].strip()
            if "/" in f or "." in f:
                for r in _accolades(f):
                    fichiers.append(r)
                    droits.append(droit)
    return fichiers, droits


def cmd_pack_lint(args):
    proj, d, meta = _trouver_tache(args.projet, args.tid)
    pack = d / "context.md"
    if not pack.exists():
        die(f"pack absent : {pack.relative_to(ROOT)}")
    brut = pack.read_text(encoding="utf-8", errors="replace")
    texte = deaccent(brut)
    lignes = brut.splitlines()
    erreurs, avertis = [], []

    for sec in PACK_SECTIONS:
        if sec not in texte:
            erreurs.append(f"section manquante : {sec}")
    # titres « ## » hors blocs de code : ceux du gabarit, une fois chacun, dans l'ordre
    src = texte.splitlines()
    dedans, ouvert = _blocs_code(src)
    if ouvert:
        erreurs.append(f"bloc de code non ferme (L{ouvert})")
    titres = [l.rstrip() for l, code in zip(src, dedans) if not code and l.startswith("## ")]
    for t in dict.fromkeys(titres):
        if t not in PACK_SECTIONS:
            erreurs.append(f"titre hors gabarit : {t}")
        elif titres.count(t) > 1:
            erreurs.append(f"section dupliquee : {t}")
    connus = [t for t in titres if t in PACK_SECTIONS]
    if connus != sorted(connus, key=PACK_SECTIONS.index):
        erreurs.append("sections dans le desordre — suivre vault/_templates/context.md")
    if "<!-- A REMPLIR" in texte or "TODO-PACK" in texte:
        erreurs.append("le pack contient encore des marqueurs a remplir")
    if len(lignes) > PACK_MAX_LIGNES:
        erreurs.append(f"pack trop long : {len(lignes)} lignes (max {PACK_MAX_LIGNES}) "
                       "— deporte le detail dans vault/connaissances/ et mets un lien")

    # whitelist : colonne « Chemin » du tableau sous "Fichiers autorises" (accolades developpees)
    bloc = ""
    m = re.search(r"##\s*Fichiers autoris\S*s(.*?)(?=\n## |\Z)", brut, re.S)
    if m:
        bloc = m.group(1)
    fichiers, droits = _whitelist(bloc)
    if not fichiers:
        avertis.append("aucun fichier en backticks dans « Fichiers autorises » "
                       "— un worker sans whitelist va explorer et exploser son contexte")
    if len(fichiers) > PACK_MAX_FICHIERS:
        erreurs.append(f"whitelist trop large : {len(fichiers)} fichiers (max {PACK_MAX_FICHIERS}) "
                       "— decoupe la tache")
    for f in fichiers:
        if f.startswith(("http", "N/A", "aucun")) or "<" in f or f.startswith("~"):
            continue
        chemin = Path(f)
        if chemin.is_absolute() and ROOT not in chemin.parents:
            continue
        if not (ROOT / chemin).exists():
            avertis.append(f"chemin introuvable dans la whitelist : {f}")
    en_e = {f for f, dr in zip(fichiers, droits) if dr == "E"}
    for f in sorted(en_e):
        base, ext = os.path.splitext(f)
        if ext in (".js", ".mjs"):
            jumeau = base + ".d.ts" if ext == ".js" else base + ".d.mts"
            if (ROOT / jumeau).exists() and jumeau not in en_e:
                erreurs.append(f"fichier de types jumeau absent de la whitelist en E : {jumeau} (jumeau de {f})")

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


def evenements_par_tache() -> dict[tuple[str, str], list[str]]:
    """(projet, tid) -> les `quoi` de run/evenements.jsonl, dans l'ordre."""
    out: dict[tuple[str, str], list[str]] = {}
    try:
        lignes = EVENEMENTS.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return out
    for ligne in lignes:
        try:
            ev = json.loads(ligne)
        except ValueError:
            continue
        if isinstance(ev, dict) and ev.get("tid"):
            out.setdefault((str(ev.get("projet", "")), str(ev["tid"])), []).append(str(ev.get("quoi", "")))
    return out


def sans_agent(statut: str, mtime: float, quois: list[str], maintenant: float) -> bool:
    """en-cours jamais dispatchee, ou pret depuis > 15 min sans dispatch depuis son dernier rendu."""
    if statut == "en-cours":
        return "dispatch" not in quois
    return (statut == "pret" and maintenant - mtime > PRET_SANS_AGENT_S
            and (not quois or quois[-1] != "dispatch"))


def chemins_personnels() -> list[str]:
    """`chemin:ligne` des fichiers PORTABLES citant /home/<nom>/ ou un shebang absolu hors env.

    Suivis ou a suivre (non ignores) : un outil neuf est vu avant son premier commit.
    """
    try:
        r = subprocess.run(["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard",
                            "--", *PORTABLES], cwd=ROOT,
                           capture_output=True, text=True)
    except OSError:
        return []       # pas de git : rien de suivi
    out = []
    for nom in filter(None, r.stdout.split("\0") if r.returncode == 0 else []):
        try:
            brut = (ROOT / nom).read_bytes()
        except OSError:
            continue    # suivi mais supprime de l'arbre
        if b"\0" in brut:
            continue    # binaire
        for n, ligne in enumerate(brut.decode("utf-8", "replace").splitlines(), 1):
            shebang = n == 1 and ligne.startswith("#!/") and not ligne.startswith("#!/usr/bin/env")
            if shebang or RE_CHEMIN_PERSO.search(ligne):
                out.append(f"{nom}:{n}")
    return out


def cmd_doctor(_args):
    if roles.erreur():
        print(f"x roles.json invalide : {roles.erreur()}")
        sys.exit(3)
    pbs = []
    if produits.erreur():
        pbs.append(f"produits.json invalide : {produits.erreur()}")
    for cle in produits.tous():
        p = produits.produit(cle)
        if p.etat == "actif":
            pbs += [f"produit {cle} : {ko}" for ko in produits.verifier(p)]
    evs, maintenant = evenements_par_tache(), time.time()
    for proj in lister_projets():
        if not produits.erreur():
            v = lire_frontmatter(proj / "brief.md")[0].get("produit", "")
            if not v:
                pbs.append(f"projet {proj.name} : produit absent")
            elif v not in produits.tous():
                pbs.append(f"projet {proj.name} : produit inconnu ({v})")
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
            if sans_agent(statut, (d / "task.md").stat().st_mtime, evs.get((proj.name, tid), []), maintenant):
                pbs.append(f"{proj.name}/{tid} : {statut}, prete mais aucun agent lance — dispatcher")
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
    pbs += [f"{c} : chemin personnel ou shebang absolu — livrable non portable"
            for c in chemins_personnels()]
    print("\n".join(f"x {p}" for p in pbs) if pbs else "vault coherent.")
    sys.exit(2 if pbs else 0)


# --------------------------------------------------------------------------- #

def main():
    p = argparse.ArgumentParser(prog="vx.py", description="Pilote du Vault multi-agent.")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="cree/repare l'arborescence du vault").set_defaults(f=cmd_init)

    sp = sub.add_parser("projet", help="nouveau projet (brief + plan + journal)")
    sp.add_argument("slug"); sp.add_argument("--titre"); sp.add_argument("--force", action="store_true")
    sp.add_argument("--produit", help="cle de produits.json (vide -> etage entreprise + alerte doctor)")
    sp.set_defaults(f=cmd_projet)

    sp = sub.add_parser("rattacher", help="rattache un projet a un produit (produit: du brief)")
    sp.add_argument("projet"); sp.add_argument("cle"); sp.set_defaults(f=cmd_rattacher)

    sp = sub.add_parser("publier", help="porte de publication d'un produit (bin/publier.py)")
    sp.add_argument("cle"); sp.add_argument("--json", action="store_true")
    sp.add_argument("--taches", action="store_true", help="cree les taches des ecarts")
    sp.add_argument("--acquitter", metavar="ID"); sp.add_argument("--motif")
    sp.set_defaults(f=cmd_publier)

    sp = sub.add_parser("tache", help="nouvelle tache (task.md + pack vierge)")
    sp.add_argument("titre"); sp.add_argument("--projet", required=True)
    sp.add_argument("--role", required=True, choices=ROLES or None)
    sp.add_argument("--dep", action="append", help="ID d'une tache prerequise (repetable)")
    sp.add_argument("--tokens", default="40k", help="budget indicatif (defaut 40k)")
    sp.add_argument("--modele", choices=MODELES, help="surcharge le modele du role")
    sp.add_argument("--effort", choices=roles.EFFORTS, help="surcharge l'effort du role")
    sp.set_defaults(f=cmd_tache)

    sp = sub.add_parser("set", help="change le statut d'une tache")
    sp.add_argument("tid"); sp.add_argument("--statut", choices=STATUTS)
    sp.add_argument("--note"); sp.add_argument("--projet")
    sp.add_argument("--force", action="store_true", help="en-cours hors dispatch (reprise), journalise")
    sp.add_argument("--dispatch", action="store_true", help="reserve au hook garde_dispatch")
    sp.set_defaults(f=cmd_set)

    sp = sub.add_parser("virer", help="rejette le livrable d'un agent et cree la tache remplacante")
    sp.add_argument("tid"); sp.add_argument("--motif", required=True)
    sp.add_argument("--role", choices=ROLES or None, help="role de la remplacante (defaut : le meme)")
    sp.add_argument("--modele", choices=MODELES, help="modele de la remplacante (defaut : le meme)")
    sp.add_argument("--effort", choices=roles.EFFORTS, help="effort de la remplacante (defaut : le meme)")
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

    sp = sub.add_parser("integrer", help="les 4 sections des result.md que le chef lit (fait/bloque/revue)")
    sp.add_argument("tid", nargs="*"); sp.add_argument("--projet"); sp.set_defaults(f=cmd_integrer)

    sp = sub.add_parser("manques", help="les « Manquait » des result.md, par categorie et role")
    sp.add_argument("--projet"); sp.add_argument("--role", choices=ROLES or None)
    sp.add_argument("--json", action="store_true"); sp.set_defaults(f=cmd_manques)

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
