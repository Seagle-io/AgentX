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
import shutil
import sys
import unicodedata
from pathlib import Path
from typing import Iterator

ROOT = Path(__file__).resolve().parent.parent
VAULT = ROOT / "vault"
TEMPLATES = VAULT / "_templates"

ROLES = ("eclaireur", "architecte", "implementeur", "verificateur", "critique", "scribe")
STATUTS = ("a-faire", "pret", "en-cours", "bloque", "revue", "fait", "abandonne")
STATUT_OUVERT = ("a-faire", "pret", "en-cours", "bloque", "revue")

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


CLES_LISTE = ("deps", "tags")


class FrontmatterInvalide(ValueError):
    pass


# ⊇ separateurs de str.splitlines() : \n \r \x0b \x0c \x1c \x1d \x1e \x85    
# ∪ C0 sauf \t ∪ DEL + C1 ∪ surrogates ∪ non-caracteres — hors « printable » YAML 1.2
_INTERDIT = re.compile(r"[\x00-\x08\x0a-\x1f\x7f-\x9f  \ud800-\udfff￾￿]")
_CLE = re.compile(r"[A-Za-z0-9_][A-Za-z0-9_-]*")
_GUILLEMETS = re.compile(r'"((?:[^"\\]|\\["\\])*)"')
INDICATEURS = set("-?:,[]{}#&*!|>'\"%@`")
_ITEM_REFUS = set(',[]{}"\'#')


def _nu_possible(v: str) -> bool:
    return (v != "" and v == v.strip()            # str.strip() Python, ≠ espace seul
            and v[0] not in INDICATEURS
            and v[-1] not in "\"':"
            and ": " not in v and " #" not in v and "\t" not in v)


def encoder_scalaire(v: str, quoi: str) -> str:
    if not isinstance(v, str): raise TypeError(f"{quoi} : str attendu, {type(v).__name__}")
    if (m := _INTERDIT.search(v)): raise FrontmatterInvalide(f"{quoi} : caractere interdit U+{ord(m.group()):04X}")
    if _nu_possible(v): return v
    return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'


def encoder_item(x: str, quoi: str) -> str:
    if not isinstance(x, str): raise TypeError(f"{quoi} : str attendu, {type(x).__name__}")
    if (_INTERDIT.search(x) or x != x.strip() or x == "" or _ITEM_REFUS & set(x)
            or ": " in x or "\t" in x):
        raise FrontmatterInvalide(f"{quoi} : element de liste invalide {x!r}")
    return x


def encoder_liste(v: list[str], quoi: str) -> str:
    return "[" + ", ".join(encoder_item(x, quoi) for x in v) + "]"   # [] si vide


def rendre_frontmatter(meta: dict[str, str | list[str]]) -> str:
    """'---\n' + 'cle: enc\n'* + '---\n' ; pur ; leve avant tout I/O."""
    lignes = ["---"]
    for cle, val in meta.items():
        if not _CLE.fullmatch(cle):
            raise FrontmatterInvalide(f"cle invalide {cle!r}")
        enc = encoder_liste(val, cle) if isinstance(val, list) else encoder_scalaire(val, cle)
        lignes.append(f"{cle}: {enc}")
    return "\n".join(lignes) + "\n---\n"


def lire_frontmatter_texte(texte: str) -> tuple[dict, str]:
    """Parseur YAML-frontmatter minimal : scalaires, listes inline [a, b], listes '- x'."""
    if not texte.startswith("---"):
        return {}, texte
    parts = texte.split("\n---", 1)
    if len(parts) < 2:
        return {}, texte
    bloc, corps = parts[0][3:], parts[1].partition("\n")[2].lstrip("\n")   # reste de la ligne « --- »
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
            q = _GUILLEMETS.fullmatch(val)
            meta[cle] = re.sub(r'\\(["\\])', r"\1", q.group(1)) if q else val.strip("\"'")
    for cle, val in list(meta.items()):
        if val == [] and cle not in avec_items and cle not in CLES_LISTE:
            meta[cle] = ""
    return meta, corps


def lire_frontmatter(chemin: Path) -> tuple[dict, str]:
    if not chemin.exists():
        return {}, ""
    return lire_frontmatter_texte(chemin.read_text(encoding="utf-8"))


def _ecrire_atomique(chemin: Path, texte: str):
    tmp = chemin.with_name(f".{chemin.name}.{os.getpid()}.tmp")
    tmp.write_text(texte, encoding="utf-8")
    os.replace(tmp, chemin)


def champ(meta: dict, cle: str, defaut: str = "—") -> str:
    """Valeur d'affichage : remplace vide / liste vide par un marqueur lisible."""
    val = meta.get(cle)
    if isinstance(val, list):
        return ", ".join(val) if val else defaut
    val = str(val).strip() if val is not None else ""
    return val or defaut


def ecrire_frontmatter(chemin: Path, meta: dict, corps: str):
    _ecrire_atomique(chemin, rendre_frontmatter(meta) + corps.lstrip("\n"))


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


def rendre_template(nom: str, **vars_: str | list[str]) -> str:
    """Frontmatter relu, substitue puis reencode (listes : item '{{X}}' → elements) ; corps brut."""
    src = TEMPLATES / nom
    if not src.exists():
        die(f"template manquant : {src.relative_to(ROOT)} (lance `vx init`)")

    def remplacer(m: re.Match) -> str:
        if m[1] not in vars_:
            return m[0]
        v = vars_[m[1]]
        return ", ".join(v) if isinstance(v, list) else v

    def sub(texte: str) -> str:
        return re.sub(r"\{\{(\w+)\}\}", remplacer, texte)   # 1 passe : valeur substituee jamais relue

    meta, corps = lire_frontmatter_texte(src.read_text(encoding="utf-8"))
    for cle, val in meta.items():
        if isinstance(val, list):
            items = []
            for x in val:
                v = vars_.get(x[2:-2]) if x.startswith("{{") and x.endswith("}}") else None
                items += v if isinstance(v, list) else [sub(x)]
            meta[cle] = items
        else:
            meta[cle] = sub(val)
    return rendre_frontmatter(meta) + "\n" + sub(corps)


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
    """Chemins en backticks sous « Fichiers autorises » d'un pack."""
    bloc = ""
    m = re.search(r"##\s*Fichiers autoris\S*s(.*?)(?=\n## |\Z)", brut, re.S)
    if m:
        bloc = m.group(1)
    fichiers = re.findall(r"`([^`\n]+?)`", bloc)
    return [f.split(":")[0].strip() for f in fichiers if "/" in f or "." in f]


def pack_front(pack: Path) -> bool:
    if not pack.exists():
        return False
    return any(est_front(f) for f in fichiers_whitelist(pack.read_text(encoding="utf-8")))


CONTROLES: dict[str, tuple[str, str]] = {
    "verificateur": ("sans_verif", "Casser"),
    "critique":     ("sans_critique", "Critiquer"),
}
STATUTS_CASCADE = ("a-faire", "pret", "bloque")


def _deps(meta: dict) -> list[str]:
    deps = meta.get("deps") or []
    return deps if isinstance(deps, list) else [deps]


def enfants(taches: list[tuple[Path, dict]], tid: str, role: str | None = None) -> list[tuple[Path, dict]]:
    return [(d, m) for d, m in taches
            if str(m.get("parent", "")) == tid and (role is None or str(m.get("role")) == role)]


def _creer_tache(proj: Path, titre: str, role: str, deps: list[str],
                 tokens: str = "40k", modele: str | None = None,
                 extra: dict | None = None) -> tuple[str, Path]:
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
            "task.md", ID=tid, TITRE=titre, ROLE=role, PROJET=proj.name, DATE=today(),
            DEPS=deps, STATUT="a-faire", TOKENS=tokens, MODELE=modele or "inherit"))
        meta.update(extra or {})
        rendre_frontmatter(meta)   # leve FrontmatterInvalide avant mkdir
        d.mkdir(parents=True, exist_ok=False)
        ecrire_frontmatter(d / "task.md", meta, corps)
    if not (d / "context.md").exists():
        (d / "context.md").write_text(
            rendre_template("context.md", ID=tid, TITRE=titre, ROLE=role,
                            PROJET=proj.name, DATE=today()),
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
            if str(meta.get(cle) or "").strip() or _controle_present(lister_taches(proj), tid, role):
                continue
            if role == "critique" and not pack_front(d / "context.md"):
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
        if str(meta.get(cle) or "").strip():
            continue
        if _controle_present(taches, tid, role):
            continue
        if role == "critique" and not pack_front(d / "context.md"):
            continue
        manquants.append(role)
    return manquants


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


def cmd_projet(args):
    slug = slugify(args.slug)
    proj = VAULT / "projets" / slug
    if proj.exists() and not args.force:
        die(f"le projet {slug} existe deja (--force pour ecraser le brief)")
    titre = args.titre or slug.replace("-", " ").capitalize()
    brief = rendre_template("brief.md", SLUG=slug, TITRE=titre, DATE=today())
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


def cmd_tache(args):
    proj = dossier_projet(slugify(args.projet))
    if args.role not in ROLES:
        die(f"role invalide : {args.role} (attendu : {', '.join(ROLES)})")
    extra = {}
    for cle in ("sans_verif", "sans_critique"):
        val = getattr(args, cle)
        if val is not None:
            extra[cle] = exiger_raison(val, f"--{cle.replace('_', '-')}")
    tid, d = _creer_tache(proj, args.titre, args.role, args.dep or [],
                          tokens=args.tokens, modele=args.modele, extra=extra)
    crees = []
    if args.role == "implementeur":
        meta, _ = lire_frontmatter(d / "task.md")
        crees = assurer_enfants(proj, d, meta)
    cmd_index(argparse.Namespace(quiet=True))
    print(f"{tid}  {d.relative_to(ROOT)}")
    _afficher_crees(proj, crees)
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
    crees, abandonnes = [], []
    with verrou_projet(proj):
        meta, corps = lire_frontmatter(d / "task.md")
        avant = meta.get("statut")
        if args.statut:
            meta["statut"] = args.statut
        if args.note:
            meta["note"] = args.note
        meta["maj"] = today()
        ecrire_frontmatter(d / "task.md", meta, corps)
        journaliser(proj, f"{meta['id']} statut {avant} -> {meta.get('statut')}"
                          + (f" ({args.note})" if args.note else ""))
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
        print(f"   {'ID':<7} {'ROLE':<13} {'STATUT':<10} {'PACK':<5} {'DEPS':<14} TITRE")
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
            bloquants = [x for x in deps if statuts.get(x) != "fait"]
            dep_txt = ",".join(deps) if deps else "-"
            if bloquants and str(m.get("statut")) in ("a-faire", "pret"):
                dep_txt += " !"
            pack = "ok" if _pack_rempli(d / "context.md") else "VIDE"
            print(f"   {marque + str(m.get('id')):<7} {str(m.get('role')):<13} "
                  f"{str(m.get('statut')):<10} {pack:<5} {dep_txt:<14} {m.get('titre', '')}")


def _section(texte: str, titre: str) -> str:
    m = re.search(r"##\s*" + titre + r"[^\n]*\n(.*?)(?=\n## |\Z)", texte, re.S | re.I)
    return (m.group(1).strip() if m else "")


def cmd_integrer(args):
    """Ce que le chef lit d'un result.md, et rien d'autre : Pour la suite,
    Ecarts, Verifie comment. Evite d'ouvrir les fichiers un par un."""
    projets = [dossier_projet(slugify(args.projet))] if args.projet else lister_projets()
    voulu = {t.upper() for t in (args.tid or [])}
    n = 0
    for proj in projets:
        taches, _ = _etat_taches(proj)
        for d, m in taches:
            tid = str(m.get("id"))
            statut = str(m.get("statut"))
            if voulu and tid not in voulu:
                continue
            if not voulu and statut not in ("fait", "bloque", "revue"):
                continue
            r = d / "result.md"
            if not r.exists():
                print(f"\n== {proj.name}/{tid} [{statut}] — {m.get('titre','')}\n   result.md ABSENT")
                n += 1
                continue
            texte = r.read_text(encoding="utf-8")
            rmeta, _ = lire_frontmatter(r)
            print(f"\n== {proj.name}/{tid} [{statut} · result: {champ(rmeta, 'statut', '?')}] — {m.get('titre','')}")
            for titre in ("Pour la suite", "Ecarts|Écarts", "Verifie comment|Vérifié comment"):
                corps = _section(texte, "(?:" + titre + ")")
                print(f"   -- {titre.split('|')[0]}")
                for ligne in (corps or "∅").splitlines()[:40]:
                    print("   " + ligne)
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
            if any(statuts.get(x) != "fait" for x in deps):
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
    import environnement as env
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

    fichiers = fichiers_whitelist(brut)
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
    crees = assurer_enfants(proj, d, meta)
    _afficher_crees(proj, crees)
    if crees:
        cmd_index(argparse.Namespace(quiet=True))
    if str(meta.get("statut")) == "a-faire":
        print(f"  -> python3 bin/vx.py set {meta.get('id')} --statut pret --projet {proj.name}")


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


def cmd_doctor(_args):
    pbs = []
    for proj in lister_projets():
        taches, statuts = _etat_taches(proj)
        ids = {str(m.get("id")) for _, m in taches}
        for d, m in taches:
            tid = str(m.get("id"))
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            for dep in deps:
                if dep not in ids:
                    pbs.append(f"{proj.name}/{tid} : dependance fantome {dep}")
                if dep == tid:
                    pbs.append(f"{proj.name}/{tid} : depend d'elle-meme")
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
    sp.add_argument("--role", required=True, choices=ROLES)
    sp.add_argument("--dep", action="append", help="ID d'une tache prerequise (repetable)")
    sp.add_argument("--tokens", default="40k", help="budget indicatif (defaut 40k)")
    sp.add_argument("--modele", help="inherit|opus|sonnet|haiku")
    sp.add_argument("--sans-verif", metavar="RAISON", help="implementeur sans enfant verificateur")
    sp.add_argument("--sans-critique", metavar="RAISON", help="implementeur sans enfant critique")
    sp.set_defaults(f=cmd_tache)

    sp = sub.add_parser("renoncer", help="renonce aux controles (verif/critique) d'implementeurs")
    sp.add_argument("tid", nargs="*"); sp.add_argument("--projet", required=True)
    sp.add_argument("--raison", required=True)
    sp.add_argument("--verif", action="store_true"); sp.add_argument("--critique", action="store_true")
    sp.set_defaults(f=cmd_renoncer)

    sp = sub.add_parser("set", help="change le statut d'une tache")
    sp.add_argument("tid"); sp.add_argument("--statut", choices=STATUTS)
    sp.add_argument("--note"); sp.add_argument("--projet")
    sp.set_defaults(f=cmd_set)

    sp = sub.add_parser("board", help="tableau de bord compact (a lire au lieu du vault)")
    sp.add_argument("--projet"); sp.set_defaults(f=cmd_board)

    sp = sub.add_parser("a-clore", help="projets sans tache ouverte, a proposer a la cloture")
    sp.add_argument("--json", action="store_true"); sp.set_defaults(f=cmd_a_clore)

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
