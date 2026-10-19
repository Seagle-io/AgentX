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
import fnmatch
import hashlib
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
from typing import Iterator

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
# retouche (tache --retouche) : Decisions actees, Environnement, Budget optionnels
PACK_SECTIONS_RETOUCHE = tuple(s for s in PACK_SECTIONS
                               if s not in ("## Decisions actees", "## Environnement", "## Budget"))
# roles juges : DoD sans mesure HEAD toleree (syndicat R4)
JUGES = {"evaluateur", "critique", "verificateur", "syndicat", "scribe", "eclaireur"}
PACK_MAX_LIGNES = 220
PACK_MAX_FICHIERS = 12
LINT_VERSION = "2"        # lot B ; bump => tout pack_sha perime => relint complet
EVENEMENTS = ROOT / "run" / "evenements.jsonl"   # bin/sonnerie.py (agent rendu), bin/garde_dispatch.py (dispatch)
PRET_SANS_AGENT_S = 15 * 60
PORTABLES = ("bin", "dash", "outils", ".claude", "docs")   # livrables qui doivent tourner ailleurs
RE_CHEMIN_PERSO = re.compile(r"/home/[A-Za-z0-9._-]+/")
RE_CODE_INLINE = re.compile(r"`[^`\n]*`")
RE_DOD_SEUIL = re.compile(r"[≤≥]\s*\d"
                          r"|(?<![-=<>!])(?:<=?|>=?)(?=\s)\s*\d"
                          r"|\d+(?:[.,]\d+)?:1\b"
                          r"|→\s*\d+(?:[.,]\d+)?\s*(?:px|ms|s|lignes|tests|tok|car\.|Mo|Ko|%)(?!\w)")
RE_DOD_HEAD = re.compile(r"HEAD\s*:\s*\S|\bsur HEAD\b")
RE_DOD_EXEMPTE = re.compile(r"result\.md|Pour la suite|Format de sortie")
RE_COORD = re.compile(r"[\w./-]+\.\w+:L?\d+")


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


def exiger_raison(val: str, quoi: str) -> str:
    """Pre-controle CLI avant toute ecriture : raison non vide et encodable."""
    if not val.strip():
        die(f"{quoi} : raison vide")
    try:
        encoder_scalaire(val, quoi)
    except FrontmatterInvalide as e:
        die(str(e))
    return val


def deaccent(texte: str) -> str:
    return unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()


from frontmatter import (  # noqa: F401
    CLES_LISTE, FrontmatterInvalide, _INTERDIT, _CLE,
    _GUILLEMETS, INDICATEURS, _ITEM_REFUS, _nu_possible,
    encoder_scalaire, encoder_item, encoder_liste, rendre_frontmatter,
    _ligne, lire_frontmatter_texte, _frontmatter, lire_frontmatter,
    _ecrire_atomique, Texte, _AUTRE_TYPE, _CONTROLE,
    _ECHAPPE, _DE_ECHAPPE, _valeur, _scalaire,
    ecrire_frontmatter,
)


def champ(meta: dict, cle: str, defaut: str = "—") -> str:
    """Valeur d'affichage : remplace vide / liste vide par un marqueur lisible."""
    val = meta.get(cle)
    if isinstance(val, list):
        return ", ".join(val) if val else defaut
    val = str(val).strip() if val is not None else ""
    return val or defaut


_VERROUS: dict[Path, list] = {}


@contextlib.contextmanager
def verrou_projet(proj: Path) -> Iterator[None]:
    """flock LOCK_EX sur proj/.verrou ; reentrant par processus (dict proj→[fd, profondeur]) — flock 2 fd = interblocage."""
    cle = proj.resolve()
    if cle in _VERROUS:
        _VERROUS[cle][1] += 1
        try:
            yield
        finally:
            _VERROUS[cle][1] -= 1
        return
    with (proj / ".verrou").open("w") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        _VERROUS[cle] = [fh, 1]
        try:
            yield
        finally:
            del _VERROUS[cle]


def substituer(texte: str, vars_: dict) -> str:
    """Marqueurs a doubles accolades connus de vars_ remplaces ; 1 passe : valeur substituee jamais relue."""
    return re.sub(r"\{\{(\w+)\}\}", lambda m: (", ".join(v) if isinstance(v := vars_[m[1]], list) else v)
                  if m[1] in vars_ else m[0], texte)


def rendre_template(nom: str, **vars_: str | list[str]) -> str:
    """Frontmatter relu, substitue puis reencode (listes : item '{{X}}' → elements) ; corps brut."""
    src = TEMPLATES / nom
    if not src.exists():
        die(f"template manquant : {src.relative_to(ROOT)} (lance `vx init`)")

    def sub(texte: str) -> str:
        return substituer(texte, vars_)

    meta, corps = lire_frontmatter_texte(src.read_text(encoding="utf-8"))
    for cle, val in meta.items():
        if isinstance(val, list):
            items = []
            for x in val:
                v = vars_.get(x[2:-2]) if x.startswith("{{") and x.endswith("}}") else None
                items += v if isinstance(v, list) else [sub(x)]
            meta[cle] = items
        else:
            mm = re.fullmatch(r"\{\{(\w+)\}\}", val)   # valeur = 1 variable : son type (Texte) survit
            meta[cle] = vars_[mm[1]] if mm and isinstance(vars_.get(mm[1]), str) else sub(val)
    return rendre_frontmatter(meta) + sub(corps)   # corps brut : sa 1re ligne vide reste


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


def journaliser(proj: Path, msg: str):
    jr = proj / "journal.md"
    entete = "" if jr.exists() else "# Journal\n\nAppend-only. Le plus recent en bas.\n"
    with jr.open("a", encoding="utf-8") as fh:
        fh.write(f"{entete}\n- `{now()}` {msg}\n" if entete else f"- `{now()}` {msg}\n")


# --------------------------------------------------------------------------- #
# front / controles parent-enfant (dash.py importe d'ici)
# --------------------------------------------------------------------------- #

FRONT_EXT = re.compile(r"\.(tsx|jsx|vue|svelte|astro|css|scss|less|html)$", re.I)
FRONT_JS = re.compile(r"\.(js|ts|mjs)$", re.I)
FRONT_DOSSIERS = {"dash", "front", "ortho-front", "components", "ui", "pages", "views", "apparence"}
BACK_SEGMENT = re.compile(r"^(.*-)?back$", re.I)


def est_front(f: str) -> bool:
    """Chemin de WL front : extension UI, ou js/ts sous un dossier UI."""
    chemin = re.split(r"[\s:]", f.strip(), maxsplit=1)[0]
    if FRONT_EXT.search(chemin):
        return True
    dossiers = chemin.split("/")[:-1]
    if any(BACK_SEGMENT.match(d) for d in dossiers):
        return False
    return bool(FRONT_JS.search(chemin) and any(d.lower() in FRONT_DOSSIERS for d in dossiers))


def fichiers_whitelist(brut: str) -> list[str]:
    """Chemins de la 1re colonne sous « Fichiers autorises » d'un pack (colonne Pourquoi ignoree)."""
    bloc = ""
    m = re.search(r"##\s*Fichiers autoris\S*s(.*?)(?=\n## |\Z)", brut, re.S)
    if m:
        bloc = m.group(1)
    return _whitelist(bloc)[0]


def whitelist_droits(brut: str) -> list[tuple[str, str]]:
    """(chemin, "E"|"L") des lignes de tableau sous « Fichiers autorises » ; chemins = backticks de la 1re cellule."""
    m = re.search(r"##\s*Fichiers autoris\S*s(.*?)(?=\n## |\Z)", brut, re.S)
    droits = []
    for l in (m.group(1) if m else "").splitlines():
        cellules = l.split("|")
        if len(cellules) < 3 or cellules[2].strip() not in ("E", "L"):
            continue
        for f in re.findall(r"`([^`\n]+?)`", cellules[1]):
            if "/" in f or "." in f:
                droits.append((f.split(":")[0].strip(), cellules[2].strip()))
    return droits


def _base_chemin(x: str) -> str:
    if x.endswith("/"):
        return x
    coupe = re.split(r"[*?\[]", x, maxsplit=1)[0]
    return coupe[:coupe.rfind("/") + 1] if coupe != x else x


def se_touchent(a: str, b: str) -> bool:
    """Memes chemins, glob couvrant l'autre, ou prefixe de dossier commun."""
    if a == b or fnmatch.fnmatch(a, b) or fnmatch.fnmatch(b, a):
        return True
    return any(base and autre.startswith(base) for base, autre in ((_base_chemin(a), b), (_base_chemin(b), a)))


def pack_front(pack: Path) -> bool:
    if not pack.exists():
        return False
    return any(est_front(f) for f in fichiers_whitelist(pack.read_text(encoding="utf-8")))


CONTROLES: dict[str, tuple[str, str]] = {
    "verificateur": ("sans_verif", "Casser"),
    "critique":     ("sans_critique", "Critiquer"),
}
AVEC = {"verificateur": "avec_verif", "critique": "avec_critique"}   # opt-in task.md (vx tache --verif/--critique)
STATUTS_CASCADE = ("a-faire", "pret", "bloque")


def _deps(meta: dict) -> list[str]:
    deps = meta.get("deps") or []
    return deps if isinstance(deps, list) else [deps]


def est_retouche(meta: dict) -> bool:
    return str(meta.get("retouche", "")).lower() == "true"


def enfants(taches: list[tuple[Path, dict]], tid: str, role: str | None = None) -> list[tuple[Path, dict]]:
    return [(d, m) for d, m in taches
            if str(m.get("parent", "")) == tid and (role is None or str(m.get("role")) == role)]


def _creer_tache(proj: Path, titre: str, role: str, deps: list[str],
                 tokens: str = "40k", modele: str | None = None,
                 extra: dict | None = None, effort: str | None = None) -> tuple[str, Path]:
    with verrou_projet(proj):
        existants = lister_taches(proj)
        nums = [int(m.group(1)) for _, meta in existants
                if (m := re.match(r"T(\d+)", str(meta.get("id", ""))))]
        tid = f"T{max(nums) + 1 if nums else 1:03d}"
        slug = slugify(titre)
        d = proj / "taches" / f"{tid}-{slug}"

        deps = [x.strip().upper() for x in deps if x.strip()]
        connus = {str(meta.get("id")) for _, meta in existants}
        for dep in deps:
            if dep not in connus:
                die(f"dependance inconnue : {dep} (tâches existantes : {', '.join(sorted(connus)) or 'aucune'})")

        meta, corps = lire_frontmatter_texte(rendre_template(
            "task.md", ID=tid, TITRE=Texte(titre), ROLE=role, PROJET=Texte(proj.name), DATE=today(),
            DEPS=deps, STATUT="a-faire", TOKENS=tokens, MODELE=modele or roles.role(role).modele))
        meta.update(extra or {})
        meta.setdefault("effort", effort or roles.role(role).effort)
        rendre_frontmatter(meta)   # leve FrontmatterInvalide avant mkdir
        d.mkdir(parents=True, exist_ok=False)
        ecrire_frontmatter(d / "task.md", meta, corps)
    if not (d / "context.md").exists():
        (d / "context.md").write_text(
            _avec_fiche_env(rendre_template("context.md", ID=tid, TITRE=titre, ROLE=role,
                                            PROJET=proj.name, DATE=today()), proj),
            encoding="utf-8")
    journaliser(proj, f"{tid} creee — {titre} [{role}]")
    return tid, d


def _controle_present(taches: list[tuple[Path, dict]], tid: str, role: str) -> bool:
    """Enfant du role (abandonnes compris) ou tache legacy du role non abandonnee avec tid en deps."""
    return bool(enfants(taches, tid, role)) or any(
        str(m.get("role")) == role and str(m.get("statut")) != "abandonne" and tid in _deps(m)
        for _, m in taches)


def _sans_enfants(meta: dict) -> bool:
    return (str(meta.get("role")) != "implementeur" or str(meta.get("statut")) == "abandonne"
            or bool(str(meta.get("parent") or "").strip()))


def assurer_enfants(proj: Path, d: Path, meta: dict) -> list[str]:
    """Cree les enfants verificateur/critique dus ; idempotent, abandonnes compris."""
    if _sans_enfants(meta):
        return []
    crees = []
    with verrou_projet(proj):
        meta, _ = lire_frontmatter(d / "task.md")   # etat disque, sous verrou
        if _sans_enfants(meta):
            return []
        tid = str(meta.get("id"))
        titre = meta.get("titre", "")
        if isinstance(titre, list):   # legacy
            titre = champ(meta, "titre", "")
        for role, (cle, prefixe) in CONTROLES.items():
            if (not meta.get(AVEC[role]) or str(meta.get(cle) or "").strip()
                    or _controle_present(lister_taches(proj), tid, role)):
                continue
            cid, _ = _creer_tache(proj, f"{prefixe} {tid} — {titre}", role, [tid],
                                  extra={"parent": tid})
            journaliser(proj, f"{cid} creee — enfant {role} de {tid}")
            crees.append(cid)
    return crees


def controles_manquants(taches: list[tuple[Path, dict]], d: Path, meta: dict) -> list[str]:
    if str(meta.get("role")) != "implementeur" or str(meta.get("statut")) != "fait":
        return []
    tid = str(meta.get("id"))
    manquants = []
    for role, (cle, _) in CONTROLES.items():
        if (not meta.get(AVEC[role]) or str(meta.get(cle) or "").strip()
                or _controle_present(taches, tid, role)):
            continue
        manquants.append(role)
    return manquants


def sans_critique(taches: list[tuple[Path, dict]]) -> list[str]:
    """Producteurs `fait` dont la WL E touche apps/web/, sans enfant critique ni renonciation."""
    ids = []
    for d, m in taches:
        if str(m.get("statut")) != "fait" or roles.livre_en(str(m.get("role"))) != "revue":
            continue
        pack = d / "context.md"
        if not pack.exists() or not any(
                droit == "E" and f.startswith("apps/web/")
                for f, droit in whitelist_droits(pack.read_text(encoding="utf-8"))):
            continue
        tid = str(m.get("id"))
        if not str(m.get("sans_critique") or "").strip() and not _controle_present(taches, tid, "critique"):
            ids.append(tid)
    return ids


def _abandonner(proj: Path, d: Path, note: str):
    with verrou_projet(proj):
        meta, corps = lire_frontmatter(d / "task.md")
        avant = meta.get("statut")
        meta["statut"], meta["note"], meta["maj"] = "abandonne", note, today()
        ecrire_frontmatter(d / "task.md", meta, corps)
    journaliser(proj, f"{meta['id']} statut {avant} -> abandonne ({note})")


def renoncer(proj: Path, d: Path, meta: dict, role: str, raison: str) -> list[str]:
    exiger_raison(raison, "--raison")
    cle = CONTROLES[role][0]
    tid = str(meta.get("id"))
    abandonnes = []
    with verrou_projet(proj):
        disque, corps = lire_frontmatter(d / "task.md")
        disque[cle] = raison
        disque["maj"] = today()
        ecrire_frontmatter(d / "task.md", disque, corps)
        for e, m in enfants(lister_taches(proj), tid, role):
            if str(m.get("statut")) in STATUTS_CASCADE:
                _abandonner(proj, e, f"renonciation : {raison}")
                abandonnes.append(str(m.get("id")))
    journaliser(proj, f"{tid} {cle} — {raison}")
    return abandonnes


def _afficher_crees(proj: Path, crees: list[str]):
    roles = {str(m.get("id")): str(m.get("role")) for _, m in lister_taches(proj)}
    for cid in crees:
        print(f"  + {cid} {roles.get(cid)} (enfant)")


def cascade_abandon(proj: Path, tid: str) -> list[str]:
    abandonnes = []
    for e, m in enfants(lister_taches(proj), tid):
        if str(m.get("statut")) in STATUTS_CASCADE:
            _abandonner(proj, e, f"parent {tid} abandonne")
            abandonnes.append(str(m.get("id")))
    return abandonnes


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
    titre = Texte(args.titre or slug.replace("-", " ").capitalize())
    brief = rendre_template("brief.md", SLUG=slug, TITRE=titre, DATE=today(), PRODUIT=args.produit or "")
    bmeta, bcorps = lire_frontmatter_texte(brief)
    if "produit" not in bmeta:   # gabarit sans `produit:` : cle posee apres `depot`
        av = dict(bmeta) if "depot" not in bmeta else {}
        for k, v in bmeta.items():
            av[k] = v
            if k == "depot":
                av["produit"] = args.produit or ""
        av.setdefault("produit", args.produit or "")
        brief = rendre_frontmatter(av) + bcorps
    plan = rendre_template("plan.md", SLUG=slug, TITRE=titre, DATE=today())
    (proj / "taches").mkdir(parents=True, exist_ok=True)   # apres rendu : titre invalide → 0 dossier
    (proj / "brief.md").write_text(brief, encoding="utf-8")
    if not (proj / "plan.md").exists():
        (proj / "plan.md").write_text(plan, encoding="utf-8")
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


def _pack_complet(texte: str, tid: str, proj: str, role: str, titre: str) -> str:
    """Pack du chef + en-tete frontmatter et titre H1 du gabarit, poses s'ils manquent."""
    texte = substituer(texte.strip("\n") + "\n", {"ID": tid, "PROJET": proj, "DATE": today()})
    texte = re.sub(r"\A(---\n(?:(?!---\n).*\n)*?)pack:.*\n", lambda m: f"{m[1]}pack: {tid}\n", texte)   # pack: = TID cree
    if not texte.startswith("---\n"):
        texte = f"---\npack: {tid}\nprojet: {proj}\nrole: {role}\ncree: {today()}\n---\n\n{texte}"
    if not re.search(r"^# ", texte, re.M):
        texte = re.sub(r"^(---\n.*?\n---\n\n?)", lambda m: f"{m.group(1)}# Pack {tid} — {titre}\n\n",
                       texte, count=1, flags=re.S)
    return texte


def cmd_tache(args):
    _exiger_registre()
    proj = dossier_projet(slugify(args.projet))
    if args.role not in ROLES:
        die(f"role invalide : {args.role} (attendu : {', '.join(ROLES)})")
    pack = getattr(args, "pack", None)   # appel interne (publier.py) : Namespace partiel
    if getattr(args, "dispatch", False) and not pack:
        die("--dispatch exige --pack (- pour stdin, ou un fichier)")
    if pack:
        try:
            texte = sys.stdin.read() if pack == "-" else Path(pack).read_text(encoding="utf-8")
        except OSError as e:
            die(f"pack illisible : {pack} ({e.strerror})")
    extra = {}
    for cle in ("sans_verif", "sans_critique"):
        if getattr(args, cle, None) is not None:   # appel interne (publier.py) : Namespace partiel
            print(f"~ --{cle.replace('_', '-')} sans objet : plus d'enfant par défaut", file=sys.stderr)
    critique = getattr(args, "critique", False)
    for cle, voulu in (("avec_verif", getattr(args, "verif", False)), ("avec_critique", critique)):
        if voulu:
            extra[cle] = "true"
    if getattr(args, "retouche", False):   # controles : 0 enfant sauf opt-in
        extra["retouche"] = "true"
        if not getattr(args, "verif", False):
            extra.setdefault("sans_verif", "retouche")
        if not critique:
            extra.setdefault("sans_critique", "retouche")
    tid, d = _creer_tache(proj, args.titre, args.role, args.dep or [],
                          tokens=args.tokens, modele=args.modele,
                          effort=getattr(args, "effort", None), extra=extra)
    if "retouche" in extra:
        journaliser(proj, f"{tid} retouche : " + ("enfant critique seul" if critique else "0 enfant"))
    if pack:
        (d / "context.md").write_text(
            _pack_complet(texte, tid, proj.name, args.role, args.titre), encoding="utf-8")
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{tid}  {(d / 'context.md').relative_to(ROOT)}")
    if not pack:
        return
    try:
        cmd_pack_lint(argparse.Namespace(tid=tid, projet=proj.name, force=False, v=False))
    except SystemExit as e:
        sys.exit(e.code)
    if args.dispatch:
        sys.stdout.flush()
        sys.exit(subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "dispatch.py"),
                                 tid, "--projet", proj.name]).returncode)


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
    crees, abandonnes = [], []
    with verrou_projet(proj):
        meta, corps = lire_frontmatter(d / "task.md")
        avant = meta.get("statut")
        tid, role = meta.get("id"), str(meta.get("role"))
        if args.statut == "en-cours" and avant != "en-cours" and not (args.force or args.dispatch):
            die("en-cours = dispatch : ./bin/agentx dispatch <TID> la passe en-cours")
        if args.statut == "pret" and avant != "pret" and not args.force:
            die(f"pret = pack-lint vert : python3 bin/vx.py pack-lint {tid} --projet {proj.name}")
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
        if args.statut in ("pret", "en-cours", "revue", "fait"):
            crees = assurer_enfants(proj, d, meta)
        elif args.statut == "abandonne":
            abandonnes = cascade_abandon(proj, str(meta["id"]))
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{meta['id']} : {avant} -> {meta.get('statut')}")
    _afficher_crees(proj, crees)
    for cid in abandonnes:
        print(f"  - {cid} abandonne (enfant)")


def cmd_renoncer(args):
    proj = dossier_projet(slugify(args.projet))
    roles = [r for r, voulu in (("verificateur", args.verif), ("critique", args.critique)) if voulu] \
        or list(CONTROLES)
    taches = lister_taches(proj)
    if args.tid:
        par_id = {str(m.get("id")): (d, m) for d, m in taches}
        cibles = []
        for tid in dict.fromkeys(t.upper() for t in args.tid):
            if tid not in par_id:
                die(f"tache introuvable : {tid} dans {proj.name}")
            cibles.append((*par_id[tid], roles))
    else:
        cibles = [(d, m, [r for r in controles_manquants(taches, d, m) if r in roles])
                  for d, m in taches]
    n = 0
    for d, m, a_poser in cibles:
        for role in a_poser:
            renoncer(proj, d, m, role, args.raison)
            print(f"{m.get('id')} {CONTROLES[role][0]}")
        n += bool(a_poser)
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{n} tache(s) marquee(s)")


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


def _arreter_session(tid: str, slug: str) -> str:
    """Arrete par id la session vivante de la fiche, rend la ligne a afficher ; echec du stop ⇒ die, rien n'est vire."""
    import agents
    f = agents.lire(slug, tid)
    e = agents.etat(f, agents.sessions(0)) if f else None
    if f and agents.vivant(e) is True:
        i = f["id_session"]
        r = subprocess.run([agents.CLAUDE, "stop", i], cwd=ROOT, stdin=subprocess.DEVNULL,
                     capture_output=True, text=True, timeout=60)
        if r.returncode != 0:
            ligne = (r.stderr.strip().splitlines() or ["echec"])[-1]
            die(f"virer {tid} : claude stop {i} echoue ({ligne}) ; arrete-le a la main puis relance virer")
        return f"{tid} session {i} arretee"
    if e == "inconnu":
        return f"~ etat inconnu ({f['id_session']}) : claude logs {f['id_session']}"
    return f"{tid} aucune session"


def cmd_virer(args):
    _exiger_registre()
    proj, d, _ = _trouver_tache(args.projet, args.tid)
    with verrou_projet(proj):  # statut relu sous verrou : 2 virer de la meme tache -> 1 seul passe
        meta, corps = lire_frontmatter(d / "task.md")
        tid, avant = str(meta.get("id")), str(meta.get("statut"))
        if avant not in ("en-cours", "bloque", "revue", "fait"):
            die(f"{tid} en statut « {avant} » : aucun agent a virer (abandonne-la)")
        motif = Texte(re.sub(r"\s+", " ", args.motif).strip().replace("[", "(").replace("]", ")"))
        if not 1 <= len(motif) <= 200:
            die(f"motif : 1 a 200 caracteres (recu {len(motif)})")
        if not (d / "context.md").exists():
            die(f"{tid} sans pack : {(d / 'context.md').relative_to(ROOT)} absent, rien a recopier", 2)
        session = _arreter_session(tid, proj.name)
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
            **({k: meta[k] for k in ("retouche", "sans_verif", "sans_critique") if meta.get(k)}
               if est_retouche(meta) else {}),
            **{k: meta[k] for k in ("avec_verif", "avec_critique") if meta.get(k)},
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
            if str(tmeta.get("parent") or "") == tid:   # l'enfant de controle suit la remplacante
                tmeta["parent"] = n
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
        print(session)
        if avant == "en-cours":
            print(f"~ {tid} etait en-cours : verifie qu'aucun agent ne tourne encore")


def _preuve_retouche(d: Path, tid: str) -> str:
    """Retouche sans evaluateur : result.md revue|fait et « Verifie comment » sans NV."""
    r = d / "result.md"
    rmeta, rcorps = lire_frontmatter(r)
    rs = str(rmeta.get("statut")) if r.exists() else "absent"
    if rs not in ("revue", "fait"):
        die(f"{tid} retouche : result absent (result.md : {rs})")
    if re.search(r"\bNV\b", _section(rcorps, "V[ée]rifi[ée] comment")):
        die(f"{tid} retouche : NV présent dans « Vérifié comment » — evaluateur ou --sans-eval")
    return "retouche"


def cmd_retenir(args):
    proj, d, _ = _trouver_tache(args.projet, args.tid)
    meta, corps = lire_frontmatter(d / "task.md")
    tid, s = str(meta.get("id")), str(meta.get("statut"))
    if s == "en-cours":
        r = d / "result.md"
        rs = str(lire_frontmatter(r)[0].get("statut")) if r.exists() else "absent"
        if rs not in ("revue", "fait"):
            die(f"{tid} en statut « {s} » : seul revue se retient (result.md : {rs})")
    elif s != "revue":
        die(f"{tid} en statut « {s} » : seul revue se retient")
    evaluation = "chef"
    if not args.sans_eval:
        evals = []
        for ed, m in lister_taches(proj):
            deps = m.get("deps") or []
            if str(m.get("role")) == "evaluateur" and tid in (deps if isinstance(deps, list) else [deps]):
                evals.append((str(m.get("id")), ed, m))
        if not evals and est_retouche(meta):
            evaluation = _preuve_retouche(d, tid)
        elif not evals:
            die(f"aucune evaluation de {tid} — {_cmd_evaluer(tid, proj.name)} (ou --sans-eval)")
        else:
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
    if s == "en-cours":
        journaliser(proj, f"{tid} statut en-cours -> revue (result.md)")
    journaliser(proj, f"{tid} statut revue -> fait (retenue, eval {evaluation})")
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{tid} : {s} -> fait (retenue, eval {evaluation})")


def cmd_repondre(args):
    texte = args.texte.strip()
    if len([l for l in texte.splitlines() if l.strip()]) > 5:
        die("reponse > 5 lignes non vides : condense")
    proj, d, _ = _trouver_tache(args.projet, args.tid)
    res = d / "result.md"
    if not res.exists():
        die(f"{args.tid.upper()} : result.md absent")
    with verrou_projet(proj):
        rmeta, _ = lire_frontmatter(res)
        if rmeta.get("statut") != "bloque":
            die(f"{args.tid.upper()} : result.md statut {rmeta.get('statut')} (attendu : bloque)")
        meta, corps = lire_frontmatter(d / "task.md")
        avant = meta.get("statut")
        if avant not in ("en-cours", "bloque"):
            die(f"{meta['id']} : statut {avant} (attendu : en-cours ou bloque)")
        n = int(meta.get("reponses", 0) or 0) + 1
        with res.open("a", encoding="utf-8") as f:
            f.write(f"\n## Réponse du chef — {now()}\n{texte}\n")
        meta["statut"] = "bloque"
        meta["reponses"] = n
        meta["maj"] = today()
        ecrire_frontmatter(d / "task.md", meta, corps)
        journaliser(proj, f"{meta['id']} statut {avant} -> bloque (réponse {n})")
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{meta['id']} : {avant} -> bloque (réponse {n})")


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
        print(f"  {titre:<13} {'TACHES':>6} {'LIVREES':>7} {'RETENUES':>8} {'VIREES':>6} {'RENVOI':>7} {'REPRIS':>6}")
        for l in lignes:
            r = "—" if l["taux_renvoi"] is None else f"{round(100 * l['taux_renvoi'])} %"
            print(f"  {l['cle']:<13} {l['taches']:>6} {l['livrees']:>7} {l['retenues']:>8} {l['virees']:>6} {r:>7} {l['bloque_repris']:>6}")


def _etat_taches(proj: Path):
    taches = lister_taches(proj)
    statut_par_id = {str(m.get("id")): str(m.get("statut", "a-faire")) for _, m in taches}
    return taches, statut_par_id


def a_clore() -> list[dict]:
    """Projets dont plus aucune tache n'est ouverte : le chef doit proposer a
    l'humain de les clore. `depuis` = derniere ligne du journal."""
    out = []
    for proj in lister_projets():
        taches = lister_taches(proj)
        if not taches or any(str(m.get("statut")) in STATUT_OUVERT for _, m in taches):
            continue
        depuis = ""
        jr = proj / "journal.md"
        if jr.exists():
            dates = re.findall(r"^- `(\d{4}-\d{2}-\d{2})", jr.read_text(encoding="utf-8"), re.M)
            depuis = dates[-1] if dates else ""
        jours = (_dt.date.today() - _dt.date.fromisoformat(depuis)).days if depuis else None
        out.append({"projet": proj.name,
                    "faites": sum(1 for _, m in taches if str(m.get("statut")) == "fait"),
                    "abandonnees": sum(1 for _, m in taches if str(m.get("statut")) == "abandonne"),
                    "depuis": depuis, "jours": jours})
    return out


def _depuis_txt(c: dict) -> str:
    j = c["jours"]
    return ("date inconnue" if j is None else "aujourd'hui" if j == 0
            else "hier" if j == 1 else f"il y a {j} jours")


def cmd_a_clore(args):
    cands = a_clore()
    if args.json:
        print(json.dumps(cands, ensure_ascii=False, indent=2))
        return
    if not cands:
        print("rien a clore : chaque projet a encore une tache ouverte")
        return
    for c in cands:
        print(f"{c['projet']} : {c['faites']} faites, {c['abandonnees']} abandonnees, "
              f"plus rien d'ouvert — derniere activite {_depuis_txt(c)}  -> /clore {c['projet']}")


def cmd_board(args):
    projets = [dossier_projet(slugify(args.projet))] if args.projet else lister_projets()
    if not projets:
        print("vault vide — `python3 bin/vx.py projet <slug> --titre \"...\"`")
        return
    manquants = [t for p in projets for t in sans_critique(lister_taches(p))]
    if args.json:
        print(json.dumps({"sans_critique": manquants}, ensure_ascii=False))
        return
    if manquants:
        print(f"! lot front retenu sans critique : {', '.join(manquants)}")
    cands = [c for c in a_clore() if c["projet"] in {p.name for p in projets}]
    if cands:
        print("== A CLORE — demande a l'humain s'il faut ranger (/clore <slug>)")
        for c in cands:
            print(f"   {c['projet']} : {c['faites']} faites, rien d'ouvert, "
                  f"derniere activite {_depuis_txt(c)}")
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
        print(f"   {'ID':<7} {'ROLE':<13} {'STATUT':<10} {'MODELE/EFFORT':<15} {'PACK':<5} {'DEPS':<14} TITRE")
        par_id = {str(m.get("id")): m for _, m in taches}

        def sous(m):   # parent present et lui-meme racine -> imprime sous lui
            p = str(m.get("parent") or "")
            return p in par_id and not par_id[p].get("parent")

        ordre = []
        for d, m in taches:
            if not sous(m):
                ordre.append((d, m, ""))
                ordre += [(e, me, "└") for e, me in enfants(taches, str(m.get("id"))) if sous(me)]
        for d, m, marque in ordre:
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            bloquants = [x for x in deps
                         if not roles.dep_satisfaite(statuts.get(x, ""), str(m.get("role")))]
            dep_txt = ",".join(deps) if deps else "-"
            if bloquants and str(m.get("statut")) in ("a-faire", "pret"):
                dep_txt += " !"
            pack = "ok" if _pack_rempli(d / "context.md") else "VIDE"
            me = f"{m.get('modele') or '-'}/{m.get('effort') or '-'}"
            print(f"   {marque + str(m.get('id')):<7} {str(m.get('role')):<13} "
                  f"{str(m.get('statut')):<10} {me:<15} {pack:<5} {dep_txt:<14} "
                  f"{'[retouche] ' if est_retouche(m) else ''}{m.get('titre', '')}")


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


def ecarts_vides(corps: str) -> bool:
    """Ecarts presents et tous ∅ (« ∅ », « lecture hors WL: ∅ ») ; section absente/vide -> False."""
    lignes = [re.sub(r"^- ", "", l.strip()) for l in corps.splitlines() if l.strip()]
    return bool(lignes) and all(re.match(r"∅|[^:]{1,60}:\s*∅\.?\s*$", l) for l in lignes)


def _cmd_evaluer(tid: str, slug: str) -> str:
    return f'python3 bin/vx.py tache "Evaluer {tid}" --projet {slug} --role evaluateur --dep {tid}'


def verdict_propose(slug: str, tid: str, statut: str, rmeta: dict, texte: str) -> str | None:
    """« commande   # proposé : raison » pour un result producteur ; None si rien à proposer. Jamais exécuté."""
    if statut not in ("revue", "en-cours", "bloque"):
        return None
    ecarts = _section(texte, "(?:Ecarts|Écarts)")
    if str(rmeta.get("statut")) == "bloque":
        motif = next((re.sub(r"^- ", "", l.strip()) for l in ecarts.splitlines()
                      if l.strip() and not re.match(r"(- )?∅", l.strip())), "")
        return f"python3 bin/vx.py virer {tid} --motif {_citer_motif(motif[:200])} --projet {slug}   # proposé : bloque"
    verifie = _section(texte, "(?:Verifie comment|Vérifié comment)")
    if not verifie or verifie == "∅":
        raison = "Vérifié comment vide"
    elif re.search(r"\bNV\b|non v[ée]rifi[ée]", verifie, re.I):
        raison = "NV dans Vérifié comment"
    elif not ecarts_vides(ecarts):
        raison = "Écarts non vides"
    else:
        return f"python3 bin/vx.py retenir {tid} --projet {slug} --sans-eval   # proposé : Vérifié sans NV, Écarts ∅"
    return f"{_cmd_evaluer(tid, slug)}   # proposé : {raison}"


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
            sections = (("Pour la suite", "Ecarts|Écarts") if args.court else
                        ("Pour la suite", "Ecarts|Écarts", "Verifie comment|Vérifié comment", "Retour sur le pack"))
            suite = ""
            if str(m.get("role")) == "evaluateur":
                deps = m.get("deps") or []
                deps = deps if isinstance(deps, list) else [deps]
                evalue = deps[0] if deps else "?"
                verdict = champ(rmeta, "verdict", "?")
                entete += f" · verdict: {verdict} → {evalue}"
                sections = (("Verdict", "Motif") if args.court else
                            ("Verdict", "Motif", "DoD", "Ecarts|Écarts", "Verifie comment|Vérifié comment",
                             "Retour sur le pack"))
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
            elif args.verdict and str(m.get("role")) != "evaluateur":
                proposition = verdict_propose(proj.name, tid, statut, rmeta, texte)
                if proposition:
                    commande, raison = proposition.split("   # proposé : ", 1)
                    print(f"   -> {commande}   # proposé : {raison}")
            n += 1
    if not n:
        print("rien a integrer (aucune tache fait/bloque/revue avec result.md).")


def lignes_passation(slug: str) -> list[str]:
    """Lignes de todo deduites de l'etat du vault (comme la todo de dash)."""
    import agents
    out = []
    for d, m in lister_taches(dossier_projet(slug)):
        tid, statut = str(m.get("id")), str(m.get("statut"))
        rendu = (d / "result.md").exists()
        if statut == "revue" or (statut == "en-cours" and rendu):
            out.append(f"- [ ] Intégrer {tid} ({statut})")
        elif statut == "a-faire" and not _pack_rempli(d / "context.md"):
            out.append(f"- [ ] Pack {tid}")
        elif statut == "pret":
            out.append(f"- [ ] Dispatcher {tid}")
        elif statut == "bloque":
            out.append(f"- [ ] Répondre/virer {tid}")
    sess = agents.sessions()
    vols = sorted(f["tid"] for f in agents.lister()
                  if f["projet"] == slug and agents.vivant(agents.etat(f, sess)))
    if vols:
        out.append(f"- [ ] En vol : {', '.join(vols)}")
    return out


def cmd_passation(args):
    """todo.md (append sans doublon) + journal.md depuis l'etat ; deverrouille le chef (garde_chef)."""
    try:
        import garde_chef
    except ImportError as e:
        print(f"passation : garde_chef indisponible ({e})", file=sys.stderr)
        sys.exit(1)
    proj = dossier_projet(slugify(args.projet))
    lignes = lignes_passation(proj.name)
    todo = proj / "todo.md"
    existant = todo.read_text(encoding="utf-8") if todo.exists() else ""
    deja = {l.strip() for l in existant.splitlines()}
    neuves = [l for l in lignes if l not in deja]
    if neuves:
        sep = "" if not existant or existant.endswith("\n") else "\n"
        with todo.open("a", encoding="utf-8") as fh:
            fh.write(sep + "\n".join(neuves) + "\n")
    jr = proj / "journal.md"
    entete = "" if jr.exists() else "# Journal\n\nAppend-only. Le plus recent en bas.\n"
    corps = "\n".join(lignes) if lignes else "∅ rien à passer"
    note = f"\n\n{args.note}" if args.note else ""
    horodatage = _dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    with jr.open("a", encoding="utf-8") as fh:
        fh.write(f"{entete}\n## {horodatage} — passation (vx passation)\n\n{corps}{note}\n")
    print("\n".join(neuves) if neuves else "∅ rien à passer")
    garde_chef.marquer_dernier(proj.name, len(lignes))


def _git(depot: Path, *a: str) -> str:
    """Sortie d'une commande git en lecture seule ; die si git absent, pas un depot ou erreur."""
    try:
        r = subprocess.run(["git", "-C", str(depot), *a], capture_output=True, text=True)
    except FileNotFoundError:
        die("git absent")
    if r.returncode != 0:
        die(f"git {a[0]} : {r.stderr.strip() or 'echec'} ({depot})")
    return r.stdout


def couvre(motif: str, chemin: str) -> bool:
    return chemin == motif or fnmatch.fnmatch(chemin, motif) or (motif.endswith("/") and chemin.startswith(motif))


def fichiers_vague(slug: str, depot: Path, base_iso: str):
    """(taches [(tid, titre)], suivis, neufs, hors) : taches retenues depuis base_iso, fichiers WL E modifies du depot."""
    taches, motifs = [], []
    for d, meta in lister_taches(dossier_projet(slug)):
        if (meta.get("statut") != "fait" or roles.livre_en(meta.get("role", "")) != "revue"
                or str(meta.get("retenu", "")) < base_iso[:10]):
            continue
        taches.append((meta.get("id", d.name.split("-")[0]), meta.get("titre", "")))
        pack = d / "context.md"
        if pack.exists():
            motifs += [c for c, droit in whitelist_droits(pack.read_text(encoding="utf-8")) if droit == "E"]
    champs = _git(depot, "status", "--porcelain=v1", "-z", "-uall").split("\0")
    modifies, i = [], 0
    while i < len(champs) and champs[i]:
        xy, chemin = champs[i][:2], champs[i][3:]
        modifies.append((xy, chemin))
        i += 2 if "R" in xy or "C" in xy else 1   # renommage : l'origine suit
    suivis = sorted({c for xy, c in modifies if xy != "??" and any(couvre(m, c) for m in motifs)})
    neufs = sorted({c for xy, c in modifies if xy == "??" and any(couvre(m, c) for m in motifs)})
    hors = sorted({c for _, c in modifies if c not in suivis and c not in neufs})
    return taches, suivis, neufs, hors


def message_commit(slug: str, taches: list[tuple[str, str]]) -> str:
    msg = f"{slug} : {', '.join(t for t, _ in taches)} — {' ; '.join(titre[:40] for _, titre in taches)}"
    return msg if len(msg) <= 120 else msg[:119] + "…"


def cmd_commit_vague(args):
    """Affiche git add / git commit des taches retenues depuis le dernier commit ; n'execute jamais."""
    slug = slugify(args.projet)
    depot = Path(args.depot) if args.depot else ROOT
    _git(depot, "rev-parse", "--show-toplevel")
    if args.depuis:
        base = _git(depot, "show", "-s", "--format=%H%x09%cI", "--end-of-options", args.depuis).strip()
    else:
        base = _git(depot, "log", "-1", "--format=%H%x09%cI").strip()
    sha, iso = base.split("\t")
    taches, suivis, neufs, hors = fichiers_vague(slug, depot, iso)
    if not taches or not (suivis or neufs):
        print(f"∅ rien à committer ({'0 tâche retenue depuis la base' if not taches else '0 fichier modifié'})")
        return
    print(f"# commit-vague {slug} — base {sha[:7]} {iso} — {len(taches)} tâches, {len(suivis) + len(neufs)} fichiers")
    for tid, titre in taches:
        print(f"# {tid} — {titre}")
    if suivis:
        print("git add -- " + " ".join(shlex.quote(c) for c in suivis))
    if neufs:
        print("# non suivis (??) — vérifier avant d'ajouter :")
        print("git add -- " + " ".join(shlex.quote(c) for c in neufs))
    print("git commit -m " + shlex.quote(message_commit(slug, taches)))
    if hors:
        print(f"# hors WL modifiés (non inclus) : {len(hors)}")
        for c in hors[:10]:
            print(f"#   {c}")


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


def empreinte_pack(brut: str, role: str, extra: str = "") -> str:
    """Cle du cache pack_sha ; extra = versions des contrats cites (lots suivants)."""
    return hashlib.sha256(f"{LINT_VERSION}\0{role}\0{extra}\0{brut}".encode("utf-8")).hexdigest()[:16]


def _regles_env(brut: str) -> list[str]:
    import environnement as env
    erreurs = []
    try:
        paires = env.services_du_pack(_section_env(brut))
    except env.ErreurEnv as e:
        paires = []
        erreurs.append(str(e))
    if paires:
        try:
            services = env.charger()
        except env.ErreurEnv as e:
            services = {}
            erreurs.append(f"environnement.json invalide : {e}")
        for nom, url in paires:
            if nom not in services:
                erreurs.append(f"service inconnu dans « Environnement » : {nom} (environnement.json)")
            elif url != services[nom].url:
                erreurs.append(f"service {nom} : url {url} ≠ declaree {services[nom].url}")
    return erreurs


def _cases_dod(brut: str) -> list[str]:
    """Lignes `- [ ]` de « ## Definition of Done »."""
    dod = re.search(r"##\s*Definition of Done(.*?)(?=\n## |\Z)", brut, re.S)
    return [l for l in (dod.group(1) if dod else "").splitlines() if re.match(r"^\s*-\s*\[ \]", l)]


def dod_sans_mesure(brut: str) -> list[int]:
    """Rang 1-based des cases de DoD a seuil sans mesure HEAD."""
    return [n for n, l in enumerate(_cases_dod(brut), 1)
            if not RE_DOD_EXEMPTE.search(l) and RE_DOD_SEUIL.search(RE_CODE_INLINE.sub("", l))
            and not RE_DOD_HEAD.search(l)]


def contrats_reels(brut: str) -> bool:
    """« ## Contrats » porte une ligne de code (hors …) ou une coordonnee chemin:L."""
    lignes = brut.splitlines()
    dedans, _ = _blocs_code(lignes)
    dans = False
    for l, code in zip(lignes, dedans):
        if not code and l.startswith("## "):
            dans = l.startswith("## Contrats")
        elif dans and code:
            if not l.lstrip().startswith(("```", "~~~")) and l.strip() not in ("", "…", "..."):
                return True
        elif dans and RE_COORD.search(l):
            return True
    return False


def _regle_dep_inutile(brut: str, meta: dict, proj: Path) -> list[str]:
    """Dep dont la WL E ne touche pas la WL du dependant : avertissement."""
    propres = [c for c, _ in whitelist_droits(brut)]
    par_id = {str(m.get("id")): (d, m) for d, m in lister_taches(proj)}
    avertis = []
    for dep in _deps(meta):
        d, m = par_id.get(str(dep), (None, {}))
        if d is None or str(m.get("role")) not in roles.codeurs() or not _pack_rempli(d / "context.md"):
            continue
        e_dep = [c for c, droit in whitelist_droits((d / "context.md").read_text(encoding="utf-8")) if droit == "E"]
        if e_dep and not any(se_touchent(a, b) for a in propres for b in e_dep):
            avertis.append(f"dep {dep} : 0 fichier commun — inutile ?")
    return avertis


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


def _regles_pack(brut: str, role: str, meta: dict | None = None,
                 proj: Path | None = None) -> tuple[list[str], list[str], list[str]]:
    """Regles du lint : (erreurs, avertissements, fichiers de la whitelist)."""
    texte = deaccent(brut)
    lignes = brut.splitlines()
    erreurs, avertis = [], []
    retouche = meta is not None and est_retouche(meta)

    for sec in PACK_SECTIONS_RETOUCHE if retouche else PACK_SECTIONS:
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
    if (m := re.search(r"\{\{[A-Z_]+\}\}", texte)):
        erreurs.append(f"marqueur non substitue : {m[0]}")
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
        if not _cases_dod(brut):
            erreurs.append("« Definition of Done » doit etre une checklist `- [ ]` verifiable")
        if not (retouche or role in JUGES) and (ns := dod_sans_mesure(brut)):
            erreurs.append(f"DoD {', '.join(map(str, ns))} sans mesure HEAD")
    if role not in roles.contrats_libres() and not contrats_reels(brut):
        erreurs.append(f"Contrats vide : code ou chemin:L requis ({role})")
    if meta is not None and proj is not None:
        avertis += _regle_dep_inutile(brut, meta, proj)

    erreurs += _regles_env(brut)
    return erreurs, avertis, fichiers


def _poser_pret(proj: Path, d: Path, e: str) -> bool:
    """pack_sha + a-faire -> pret sous verrou ; True si task.md a change."""
    with verrou_projet(proj):
        meta, corps = lire_frontmatter(d / "task.md")
        pret = str(meta.get("statut")) == "a-faire"
        if str(meta.get("pack_sha")) == e and not pret:
            return False
        meta["pack_sha"] = e
        if pret:
            meta["statut"] = "pret"
            meta["maj"] = today()
            journaliser(proj, f"{meta['id']} statut a-faire -> pret [lint]")
        ecrire_frontmatter(d / "task.md", meta, corps)
        return pret


def cmd_pack_lint(args):
    proj, d, meta = _trouver_tache(args.projet, args.tid)
    pack = d / "context.md"
    if not pack.exists():
        die(f"pack absent : {pack.relative_to(ROOT)}")
    brut = pack.read_text(encoding="utf-8", errors="replace")
    tid, e = str(meta.get("id")), empreinte_pack(brut, str(meta.get("role")))
    cache = not args.force and str(meta.get("pack_sha")) == e
    erreurs, avertis, fichiers = ([], [], []) if cache else _regles_pack(brut, str(meta.get("role")), meta, proj)
    if erreurs:
        brefs = erreurs if args.v else [r.split(" — ")[0] for r in erreurs]
        print(f"{tid} KO: " + "; ".join(brefs))
        sys.exit(1)
    # statut ferme : lecture seule (pas d'ecriture sur le vault livre)
    ouvert = str(meta.get("statut")) in STATUT_OUVERT
    pret = _poser_pret(proj, d, e) if ouvert else False
    crees = assurer_enfants(proj, d, meta) if ouvert else []
    if pret or crees:
        cmd_index(argparse.Namespace(quiet=True))
    roles_crees = {str(m.get("id")): str(m.get("role")) for _, m in lister_taches(proj)}
    segments = ["a-faire -> pret"] if pret else []
    if crees:
        segments.append("+ " + ", ".join(f"{c} {roles_crees.get(c)}" for c in crees))
    if avertis and not args.v:
        segments.append(f"~ {len(avertis)} avert. (--v)")
    bilan = "(cache)" if cache else f"({len(brut.splitlines())} l., ~{int(len(brut) / 3.6)} tok, {len(fichiers)} WL)"
    print(" ; ".join([f"{tid} OK {bilan}", *segments]))
    if args.v:
        for a in avertis:
            print(f"~ {a}")


def _section_env(texte: str) -> str:
    """Section « ## Environnement » d'un pack, titre en debut de ligne seulement."""
    m = re.search(r"^## Environnement[^\n]*\n(.*?)(?=\n## |\Z)", texte, re.S | re.M)
    return m.group(1) if m else ""


def _ligne_env(e: dict) -> str:
    if e["pid"] is None:
        return f"{e['nom']}  {e['etat']}  -  {e['url']}"
    depuis = (e["depuis"] or "?")[11:16]
    rss = f"{e['rss_mo']} Mo" if e["rss_mo"] is not None else "?"
    return f"{e['nom']}  {e['etat']}  pid {e['pid']}  {e['url']}  depuis {depuis}  rss {rss}"


def cmd_env(args):
    """Serveurs de dev declares dans environnement.json (voir bin/environnement.py)."""
    import time
    import environnement as env
    try:
        services = env.charger()
        if args.action == "url":
            if len(args.noms) != 1:
                raise env.ErreurEnv(1, "env url attend un seul NOM")
            print(env.selection(services, args.noms, None, False)[0].url)
            sys.exit(0)
        if args.action == "verifier" and args.pack:
            try:
                texte = Path(args.pack).read_text(encoding="utf-8")
            except OSError as e:
                raise env.ErreurEnv(1, f"pack illisible : {args.pack} ({e.strerror})")
            paires = env.services_du_pack(_section_env(texte))
            choisis = []
            for nom, url in paires:
                s = env.selection(services, [nom], None, False)[0]
                if url != s.url:
                    raise env.ErreurEnv(1, f"{nom} : url du pack {url} ≠ declaree {s.url}")
                choisis.append(s)
        else:
            if args.action in ("up", "down") and not (args.noms or args.projet or args.tous):
                raise env.ErreurEnv(1, "nomme un service ou --projet")
            choisis = env.selection(services, args.noms, args.projet, args.tous)
    except env.ErreurEnv as e:
        print(f"! {e}", file=sys.stderr)
        sys.exit(e.code)

    if args.action == "statut":
        try:
            etats = [env.etat(s) for s in choisis]
        except env.ErreurEnv as e:
            print(f"! {e}", file=sys.stderr)
            sys.exit(e.code)
        if args.json:
            print(json.dumps(etats, ensure_ascii=False, indent=2))
        else:
            print("\n".join(_ligne_env(e) for e in etats) or "aucun service declare")
        sys.exit(0)

    rc = 0
    for s in choisis:
        if args.action == "verifier":
            try:
                e = env.etat(s)
            except env.ErreurEnv as err:
                print(f"! {err}", file=sys.stderr)
                sys.exit(err.code)
            if e["etat"] != "vivant":
                print(f"{s.nom} {e['etat']} — ./bin/agentx env up {s.nom}")
                rc = max(rc, 3)
            continue
        t0 = time.monotonic()
        try:
            if args.action == "up":
                e = env.demarrer(s)
                duree = f"{time.monotonic() - t0:.1f}".replace(".", ",")
                print(f"{s.nom} vivant en {duree} s · pid {e['pid']} · {s.url}")
            else:
                pid = env.arreter(s)["arrete"]
                print(f"{s.nom} arrêté (pid {pid})" if pid else f"{s.nom} déjà arrêté")
        except env.ErreurEnv as err:
            print(f"! {s.nom} {err}", file=sys.stderr)
            if err.code == 3:
                journal = Path(env.etat(s)["journal"])
                if journal.exists():
                    print("\n".join(journal.read_text(encoding="utf-8", errors="replace")
                                    .splitlines()[-20:]), file=sys.stderr)
            rc = max(rc, err.code)
    sys.exit(rc)


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
    if produits.erreur() and produits.FICHIER.exists():   # absent = mode projets (modele : produits.exemple.json)
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
            parent = str(m.get("parent") or "")
            if parent:
                if parent not in ids:
                    pbs.append(f"{proj.name}/{tid} : parent fantome {parent}")
                if parent not in deps:
                    pbs.append(f"{proj.name}/{tid} : parent {parent} absent de deps")
                if str(m.get("role")) not in CONTROLES:
                    pbs.append(f"{proj.name}/{tid} : enfant de role {m.get('role')} (attendu verificateur|critique)")
                pm = next((pm for _, pm in taches if str(pm.get("id")) == parent), None)
                if pm is not None and str(pm.get("role")) != "implementeur":
                    pbs.append(f"{proj.name}/{tid} : parent {parent} n'est pas implementeur")
                if pm is not None and pm.get("parent"):
                    pbs.append(f"{proj.name}/{tid} : profondeur > 1 (parent {parent} a lui-meme un parent)")
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

    sp = sub.add_parser("tache", help="nouvelle tache (task.md + pack vierge ; --pack - : pack stdin + lint ; --dispatch ; "
                                      "0 enfant par defaut ; --verif/--critique : enfants au pret ; "
                                      "--retouche : lint allege, retenir sans eval)")
    sp.add_argument("titre"); sp.add_argument("--projet", required=True)
    sp.add_argument("--role", required=True, choices=ROLES or None)
    sp.add_argument("--dep", action="append", help="ID d'une tache prerequise (repetable)")
    sp.add_argument("--tokens", default="40k", help="budget indicatif (defaut 40k)")
    sp.add_argument("--modele", choices=MODELES, help="surcharge le modele du role")
    sp.add_argument("--effort", choices=roles.EFFORTS, help="surcharge l'effort du role")
    sp.add_argument("--verif", action="store_true", help="implementeur : enfant verificateur au pret")
    sp.add_argument("--critique", action="store_true", help="implementeur : enfant critique au pret")
    sp.add_argument("--sans-verif", metavar="RAISON", help="sans objet (compat) : plus d'enfant par defaut")
    sp.add_argument("--sans-critique", metavar="RAISON", help="sans objet (compat) : plus d'enfant par defaut")
    sp.add_argument("--retouche", action="store_true",
                    help="retouche = WL ≤ 3 fichiers, diff attendu ≤ 30 l., sorties lint/tests collées, 0 NV ; "
                         "le chef en répond. 0 enfant, pack sans Budget/Environnement/Decisions, DoD sans HEAD, "
                         "retenir sans evaluateur")
    sp.add_argument("--pack", metavar="{-|FICHIER}", help="pack depuis stdin (-) ou un fichier : ecrit, lint, pret")
    sp.add_argument("--dispatch", action="store_true", help="avec --pack : dispatch si lint vert")
    sp.set_defaults(f=cmd_tache)

    sp = sub.add_parser("renoncer", help="renonce aux controles (verif/critique) d'implementeurs")
    sp.add_argument("tid", nargs="*"); sp.add_argument("--projet", required=True)
    sp.add_argument("--raison", required=True)
    sp.add_argument("--verif", action="store_true"); sp.add_argument("--critique", action="store_true")
    sp.set_defaults(f=cmd_renoncer)

    sp = sub.add_parser("set", help="change le statut d'une tache")
    sp.add_argument("tid"); sp.add_argument("--statut", choices=STATUTS)
    sp.add_argument("--note"); sp.add_argument("--projet")
    sp.add_argument("--force", action="store_true", help="en-cours hors dispatch (reprise), journalise")
    sp.add_argument("--dispatch", action="store_true", help="reserve a agentx dispatch")
    sp.set_defaults(f=cmd_set)

    sp = sub.add_parser("repondre", help="reponse du chef a une tache bloquee (result.md append-only, reponses: +1)")
    sp.add_argument("tid"); sp.add_argument("--projet", required=True)
    sp.add_argument("--texte", required=True, help="5 lignes non vides max")
    sp.set_defaults(f=cmd_repondre)

    sp = sub.add_parser("virer", help="rejette le livrable d'un agent et cree la tache remplacante")
    sp.add_argument("tid"); sp.add_argument("--motif", required=True)
    sp.add_argument("--role", choices=ROLES or None, help="role de la remplacante (defaut : le meme)")
    sp.add_argument("--modele", choices=MODELES, help="modele de la remplacante (defaut : le meme)")
    sp.add_argument("--effort", choices=roles.EFFORTS, help="effort de la remplacante (defaut : le meme)")
    sp.add_argument("--projet"); sp.set_defaults(f=cmd_virer)

    sp = sub.add_parser("retenir", help="valide un livrable en revue : revue -> fait (en-cours + result.md revue|fait accepte)")
    sp.add_argument("tid"); sp.add_argument("--projet")
    sp.add_argument("--sans-eval", action="store_true", help="retenir sans evaluation (le chef assume)")
    sp.set_defaults(f=cmd_retenir)

    sp = sub.add_parser("personnel", help="dossier RH : livrees, retenues, virees, renvoi par role et modele")
    sp.add_argument("--projet"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(f=cmd_personnel)

    sp = sub.add_parser("board", help="tableau de bord compact (a lire au lieu du vault)")
    sp.add_argument("--projet"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(f=cmd_board)

    sp = sub.add_parser("a-clore", help="projets sans tache ouverte, a proposer a la cloture")
    sp.add_argument("--json", action="store_true"); sp.set_defaults(f=cmd_a_clore)

    sp = sub.add_parser("ready", help="taches dispatchables maintenant")
    sp.add_argument("--projet"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(f=cmd_ready)

    sp = sub.add_parser("integrer", help="les 4 sections des result.md que le chef lit (fait/bloque/revue) ; --court : 2")
    sp.add_argument("tid", nargs="*"); sp.add_argument("--projet")
    sp.add_argument("--court", action="store_true", help="Pour la suite + Ecarts seulement (evaluateur : Verdict + Motif)")
    sp.add_argument("--verdict", action="store_true", help="ajoute 1 ligne « -> commande   # proposé : raison » par tâche (jamais exécutée)")
    sp.set_defaults(f=cmd_integrer)

    sp = sub.add_parser("passation", help="ecrit todo.md + journal.md depuis l'etat du vault, deverrouille le chef")
    sp.add_argument("--projet", required=True)
    sp.add_argument("--note", help="ligne libre ajoutee au journal")
    sp.set_defaults(f=cmd_passation)

    sp = sub.add_parser("commit-vague", help="propose git add + git commit des taches retenues depuis le dernier commit (affiche, n'execute jamais)")
    sp.add_argument("--projet", required=True)
    sp.add_argument("--depuis", help="sha du commit de base (defaut : dernier commit du depot)")
    sp.add_argument("--depot", help="chemin du depot git (defaut : racine AgentX)")
    sp.set_defaults(f=cmd_commit_vague)

    sp = sub.add_parser("manques",help="les « Manquait » des result.md, par categorie et role")
    sp.add_argument("--projet"); sp.add_argument("--role", choices=ROLES or None)
    sp.add_argument("--json", action="store_true"); sp.set_defaults(f=cmd_manques)

    sp = sub.add_parser("pack-lint", help="valide un context pack avant dispatch")
    sp.add_argument("tid"); sp.add_argument("--projet")
    sp.add_argument("--force", action="store_true"); sp.add_argument("--v", action="store_true")
    sp.set_defaults(f=cmd_pack_lint)

    sp = sub.add_parser("index", help="regenere vault/INDEX.md")
    sp.add_argument("--quiet", action="store_true"); sp.set_defaults(f=cmd_index)

    sp = sub.add_parser("archive", help="deplace un projet vers vault/archive/")
    sp.add_argument("slug"); sp.set_defaults(f=cmd_archive)

    sp = sub.add_parser("env", help="serveurs de dev declares dans environnement.json")
    sp.add_argument("action", choices=("up", "down", "statut", "url", "verifier"))
    sp.add_argument("noms", nargs="*", metavar="NOM"); sp.add_argument("--projet")
    sp.add_argument("--tous", action="store_true", help="down : tous les services")
    sp.add_argument("--json", action="store_true", help="statut : list[EtatService]")
    sp.add_argument("--pack", metavar="CHEMIN_CONTEXT_MD", help="verifier : services du pack")
    sp.set_defaults(f=cmd_env)

    sub.add_parser("doctor", help="detecte deps fantomes, cycles, incoherences").set_defaults(f=cmd_doctor)

    sub.add_parser("help", help="affiche cette aide").set_defaults(f=lambda _a: p.print_help())

    args = p.parse_args()
    try:
        args.f(args)
    except FrontmatterInvalide as e:
        die(str(e))


if __name__ == "__main__":
    main()
