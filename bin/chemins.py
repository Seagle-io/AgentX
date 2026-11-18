#!/usr/bin/env python3
"""chemins — racines locales des depots, lues dans `.env` (racine AgentX, jamais versionne).

Le vault et produits.json n'ecrivent pas de chemin de machine : `${WORKSPACE}/Kora/…`,
`${AGENTX}/bin/vx.py`. Chaque machine fixe ses racines dans `.env` (modele : `.env.exemple`).
`${AGENTX}` vaut la racine du depot AgentX si `.env` ne le fixe pas.

Charge a l'import : les variables vont dans os.environ (l'environnement reel l'emporte),
donc les agents et la session chef les heritent. Variable inconnue : laissee telle quelle,
le chemin est alors introuvable — jamais une erreur.

Stdlib seule ; n'importe aucun autre module AgentX.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
FICHIER = ROOT / ".env"
RE_VAR = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")
RE_LIGNE = re.compile(r"(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)")


def developper(s: str) -> str:
    """`${NOM}` depuis l'environnement, puis `~` ; inconnu laisse tel quel."""
    s = RE_VAR.sub(lambda m: os.environ.get(m.group(1), m.group(0)), str(s))
    return os.path.expanduser(s)


def chemin(s: str) -> Path:
    """Comme developper, en Path ; `~inconnu/` leve RuntimeError (Path.expanduser), l'appelant decide."""
    return Path(RE_VAR.sub(lambda m: os.environ.get(m.group(1), m.group(0)), str(s))).expanduser()


def lire(fichier: Path = FICHIER) -> dict[str, str]:
    """`NOM=valeur` du fichier (commentaires, `export`, guillemets acceptes) ; absent => {}."""
    try:
        brut = fichier.read_text(encoding="utf-8")
    except OSError:
        return {}
    out = {}
    for ligne in brut.splitlines():
        m = RE_LIGNE.fullmatch(ligne.strip())
        if not m:
            continue
        v = m.group(2).strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        out[m.group(1)] = v
    return out


def charger(fichier: Path = FICHIER) -> dict[str, str]:
    """Pose les variables de `.env` dans os.environ sans ecraser l'existant ; rend celles posees."""
    os.environ.setdefault("AGENTX", str(ROOT))
    poses = {}
    for nom, v in lire(fichier).items():
        if nom not in os.environ:
            os.environ[nom] = poses[nom] = developper(v)
    return poses


def racines() -> dict[str, str]:
    """Variables de chemin connues (AGENTX + celles de `.env`) et leur valeur sur cette machine."""
    return {n: os.environ[n] for n in ["AGENTX", *lire()] if n in os.environ}


charger()
