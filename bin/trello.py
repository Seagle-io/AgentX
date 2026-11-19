#!/usr/bin/env python3
"""trello — tableaux Trello lus et tenus par le chef (le CLI ne parle jamais a Trello).

Le chef lit et deplace les cartes par ses outils Trello (MCP) ; le vault garde la trace :
task.md `trello:` (URL de la carte), `trello_accord:` (date + accord humain, obligatoire),
`trello_liste:` (derniere liste ou le chef a pose la carte). Config locale `trello.json`
(non versionnee, modele `trello.exemple.json`). Stdlib seule ; n'importe ni vx ni dash.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
FICHIER = ROOT / "trello.json"
RE_CARTE = re.compile(r"https://trello\.com/c/([A-Za-z0-9]{8})(?:/[^\s]*)?")
RE_TABLEAU = re.compile(r"https://trello\.com/b/([A-Za-z0-9]{8})(?:/[^\s]*)?")
ACCORD_MAX = 200
LIVRE = ("revue", "fait")          # tache rendue : la carte part en « a verifier »
ARRETE = ("rejete", "abandonne")   # tache arretee : la carte revient en « a faire » (commentaire)


class TrelloErreur(ValueError):
    pass


@dataclass(frozen=True)
class Tableau:
    url: str
    projet: str        # projet du vault qui recoit les cartes
    a_faire: str       # liste lue (cartes proposees)
    a_verifier: str    # liste ou part la carte quand la tache est rendue


def charger(chemin: Path | None = None) -> list[Tableau]:
    """trello.json absent : [] ; invalide : TrelloErreur (message 1 ligne)."""
    chemin = chemin or FICHIER
    if not chemin.exists():
        return []
    try:
        brut = json.loads(chemin.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise TrelloErreur(f"{chemin.name} illisible : {e}") from None
    out = []
    for i, t in enumerate(brut.get("tableaux", []) if isinstance(brut, dict) else []):
        ou = f"{chemin.name} tableaux[{i}]"
        if not isinstance(t, dict):
            raise TrelloErreur(f"{ou} : objet attendu")
        for k in ("url", "projet", "a_faire", "a_verifier"):
            if not isinstance(t.get(k), str) or not t[k].strip():
                raise TrelloErreur(f"{ou}.{k} : texte non vide attendu")
        if not RE_TABLEAU.fullmatch(t["url"]):
            raise TrelloErreur(f"{ou}.url : https://trello.com/b/<id>/… attendu (recu {t['url']!r})")
        out.append(Tableau(t["url"], t["projet"], t["a_faire"], t["a_verifier"]))
    return out


def carte(url: str) -> str:
    """URL de carte -> forme canonique https://trello.com/c/<id> ; TrelloErreur sinon."""
    m = RE_CARTE.fullmatch(str(url).strip())
    if not m:
        raise TrelloErreur(f"carte Trello invalide : {url!r} (attendu https://trello.com/c/<id>/…)")
    return f"https://trello.com/c/{m.group(1)}"


def accord(texte: str) -> str:
    t = re.sub(r"\s+", " ", str(texte or "")).strip()
    if not 1 <= len(t) <= ACCORD_MAX:
        raise TrelloErreur(f"--accord : 1 a {ACCORD_MAX} caracteres, l'accord de l'humain tel qu'il l'a donne "
                           f"(recu {len(t)})")
    return t


def action(statut: str, liste: str, tableau: Tableau | None) -> str:
    """Ce que le chef doit faire sur Trello pour cette tache ("" : rien)."""
    cible = tableau.a_verifier if tableau else "a verifier"
    if statut in LIVRE and liste != cible:
        return f"deplacer vers « {cible} » + commenter le TID"
    if statut in ARRETE and liste != "arrete":
        return "commenter : tache arretee (carte laissee en place)"
    return ""
