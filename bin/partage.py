#!/usr/bin/env python3
"""partage — fichiers partagés du vault : 1 écrivain par fichier (§5).

Décisions : vault/etages/<etage>/decisions/<AAAA-MM-JJ>-<ABC>-<sujet>.md (1 fichier, jamais réécrit) ;
ancien vault/projets/<p>/decisions.md lu seulement. todo / journal : 1 fichier par machine
vault/projets/<slug>/{todo,journal}/<ABC>.md. Générés : ecrire_si_change. Stdlib seule.
"""

from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Literal, TypedDict

import identite
import produits
from frontmatter import _ecrire_atomique, lire_frontmatter, rendre_frontmatter

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
VAULT = ROOT / "vault"
CONFLIT = "conflicted copy"
RE_DATE = re.compile(r"(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?")
RE_JOURNAL = re.compile(r"^- `([^`]*)`")


class Decision(TypedDict):
    source: str
    date: str
    heure: str
    titre: str
    corps: str
    chef: str | None
    projet: str | None


def _abc() -> str:
    """Préfixe de la machine ; mode ancien : slugify(machine())."""
    import vx   # vx importe partage : import différé
    return identite.prefixe_machine() or vx.slugify(identite.machine())


def _fichiers(dossier: Path) -> list[Path]:
    """*.md du dossier, tri nom, copies de conflit de sync ignorées (doctor les signale)."""
    return [f for f in sorted(dossier.glob("*.md")) if f.is_file() and CONFLIT not in f.name] \
        if dossier.is_dir() else []


def etage_de(slug: str) -> str:
    brief, _ = lire_frontmatter(VAULT / "projets" / slug / "brief.md")
    return produits.produit_du(slug, brief)[0] or slug


def ecrire_decision(etage: str, titre: str, corps: str, *, projet: str | None, chef: str | None,
                    quand: datetime | None = None, supersede: str | None = None) -> Path:
    import vx   # vx importe partage : import différé
    quand = quand or datetime.now()
    dossier = VAULT / "etages" / etage / "decisions"
    dossier.mkdir(parents=True, exist_ok=True)
    meta = {"date": f"{quand:%Y-%m-%d %H:%M}", **({"chef": chef} if chef else {}), "etage": etage,
            **({"projet": projet} if projet else {}), **({"supersede": supersede} if supersede else {}),
            "tags": ["decision"]}
    texte = rendre_frontmatter(meta) + f"\n# {titre}\n\n{corps.strip()}\n"
    base = f"{quand:%Y-%m-%d}-{_abc()}-{vx.slugify(titre)[:40]}"
    n = 1
    while True:
        chemin = dossier / (f"{base}.md" if n == 1 else f"{base}-{n}.md")
        try:
            with chemin.open("x", encoding="utf-8") as fh:
                fh.write(texte)
            return chemin
        except FileExistsError:
            n += 1


def blocs_anciens(texte: str) -> list[tuple[str, str, str, str]]:
    """[(date, heure, titre, corps)] des blocs « ## … » de decisions.md."""
    blocs = []
    for b in re.split(r"(?m)^## ", texte)[1:]:
        tete, _, corps = b.partition("\n")
        m = RE_DATE.search(tete)
        titre = re.sub(r"^[\s—–:-]+", "", tete[m.end():] if m else tete).strip()
        blocs.append((m.group(1) if m else "", (m.group(2) or "") if m else "", titre, corps))
    return blocs


def lire_decisions(etage: str, projet: str | None = None) -> list[Decision]:
    """Dossier de l'étage (projet égal ou absent) + ancien decisions.md des projets de l'étage ; tri (date, heure, source)."""
    out: list[Decision] = []
    for f in _fichiers(VAULT / "etages" / etage / "decisions"):
        meta, corps = lire_frontmatter(f)
        p = str(meta.get("projet") or "") or None
        if projet is not None and p not in (None, projet):
            continue
        m = RE_DATE.match(str(meta.get("date", "")))
        tete, _, reste = corps.lstrip("\n").partition("\n")
        out.append(Decision(source=str(f.relative_to(ROOT)), date=m.group(1) if m else "",
                            heure=(m.group(2) or "") if m else "", titre=tete.removeprefix("# ").strip(),
                            corps=reste, chef=str(meta.get("chef") or "") or None, projet=p))
    base = VAULT / "projets"
    noms = [projet] if projet is not None else sorted(d.name for d in base.glob("*") if d.is_dir()) \
        if base.is_dir() else []
    for nom in noms:
        f = base / nom / "decisions.md"
        if not f.is_file() or etage_de(nom) != etage:
            continue
        for jour, heure, titre, corps in blocs_anciens(f.read_text(encoding="utf-8")):
            out.append(Decision(source=str(f.relative_to(ROOT)), date=jour, heure=heure, titre=titre,
                                corps=corps, chef=None, projet=nom))
    return sorted(out, key=lambda d: (d["date"], d["heure"], d["source"]))


def fichier_machine(proj: Path, nom: Literal["todo", "journal"]) -> Path:
    (proj / nom).mkdir(exist_ok=True)
    return proj / nom / f"{_abc()}.md"


def lire_todo(proj: Path) -> list[str]:
    """Ancien todo.md + todo/*.md (tri nom), rstrip, dédoublonnées (1re occurrence)."""
    vues: dict[str, None] = {}
    for f in ([proj / "todo.md"] if (proj / "todo.md").is_file() else []) + _fichiers(proj / "todo"):
        for ligne in f.read_text(encoding="utf-8").splitlines():
            vues.setdefault(ligne.rstrip())
    return list(vues)


def lire_journal(proj: Path) -> list[str]:
    """Lignes « - `horodatage` … » de l'ancien journal.md + journal/*.md, triées par horodatage (stable)."""
    lignes = []
    for f in ([proj / "journal.md"] if (proj / "journal.md").is_file() else []) + _fichiers(proj / "journal"):
        lignes += [l.rstrip() for l in f.read_text(encoding="utf-8").splitlines() if RE_JOURNAL.match(l)]
    return sorted(lignes, key=lambda l: RE_JOURNAL.match(l).group(1))


def ecrire_si_change(chemin: Path, texte: str) -> bool:
    """Écrit ssi le contenu diffère de l'existant ; True si écrit."""
    if chemin.is_file() and chemin.read_text(encoding="utf-8") == texte:
        return False
    _ecrire_atomique(chemin, texte)
    return True
