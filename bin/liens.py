#!/usr/bin/env python3
"""liens — chemins des projets, lus dans `.env` a la racine (local, non versionne).

Le vault ne porte jamais de chemin en dur : il ecrit `${NOM}` (ex. `${ORTHOPRO}/ortho-front/src`),
`.env` donne `NOM=/chemin/reel` (modele : `.env.exemple`). `${AGENTX}` vaut la racine par defaut.
Lien absent de `.env` : signale (`agentx`, `agentx liens`), jamais bloquant.

Stdlib seule ; n'importe ni vx ni dash.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FICHIER = ROOT / ".env"
RE_LIEN = re.compile(r"\$\{([A-Z][A-Z0-9_]*)\}")
RE_LIGNE = re.compile(r"\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$")


def charger(fichier: Path | None = None) -> dict[str, str]:
    """NOM -> chemin (~ developpe, guillemets retires) ; fichier absent -> {AGENTX: racine}."""
    liens = {"AGENTX": str(ROOT)}
    try:
        lignes = (fichier or FICHIER).read_text(encoding="utf-8").splitlines()
    except OSError:
        return liens
    for l in lignes:
        m = RE_LIGNE.fullmatch(l)
        if not m or l.lstrip().startswith("#"):
            continue
        v = m.group(2)
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        if v:
            liens[m.group(1)] = os.path.expanduser(v)
    return liens


def developper(texte: str, liens: dict[str, str] | None = None) -> str:
    """Remplace chaque `${NOM}` connu ; un lien inconnu reste tel quel (visible, jamais vide)."""
    liens = charger() if liens is None else liens
    return RE_LIEN.sub(lambda m: liens.get(m.group(1), m.group(0)), texte)


def cites(texte: str) -> list[str]:
    return sorted(set(RE_LIEN.findall(texte)))


def manquants(vault: Path | None = None, liens: dict[str, str] | None = None) -> dict[str, list[str]]:
    """NOM -> projets du vault qui le citent sans qu'il soit dans `.env` (projets clos et archive exclus)."""
    liens = charger() if liens is None else liens
    out: dict[str, set[str]] = {}
    for proj in sorted(((vault or ROOT / "vault") / "projets").glob("*/")):
        brief = proj / "brief.md"
        if brief.is_file() and re.search(r"^statut:\s*clos\b", brief.read_text(encoding="utf-8", errors="replace"), re.M):
            continue
        for f in proj.rglob("*.md"):
            for nom in cites(f.read_text(encoding="utf-8", errors="replace")):
                if nom not in liens:
                    out.setdefault(nom, set()).add(proj.name)
    return {k: sorted(v) for k, v in sorted(out.items())}


def message_manquants(m: dict[str, list[str]]) -> str:
    if not m:
        return ""
    lignes = [f"liens absents de {FICHIER.name} ({len(m)}) — à ajouter, ex. {next(iter(m))}=/chemin/du/projet :"]
    lignes += [f"    {nom}  (cité par {', '.join(p)})" for nom, p in m.items()]
    return "\n".join(lignes)


def main(argv: list[str]) -> int:
    """`agentx liens` : liens connus, puis manquants. rc 1 s'il en manque."""
    liens = charger()
    for nom, v in sorted(liens.items()):
        print(f"  {nom}={v}{'' if Path(v).exists() else '   (chemin introuvable)'}")
    msg = message_manquants(manquants(liens=liens))
    if msg:
        print(f"! {msg}")
    return 1 if msg else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
