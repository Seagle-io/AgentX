#!/usr/bin/env python3
"""rh — dossier du personnel : livrees, retenues, virees, renvoi par role et modele.

Calcul seul, aucune ecriture : `vx personnel` l'affiche, la salle le met dans
state.json. Stdlib seule.
"""

from __future__ import annotations

import roles
from vx import VAULT, lister_projets, lister_taches


def _ligne(cle: str, statuts: list[str], reponses: list[int]) -> dict:
    livrees = sum(1 for s in statuts if s in ("revue", "fait", "rejete"))
    virees = statuts.count("rejete")
    return {"cle": cle, "taches": len(statuts), "livrees": livrees,
            "retenues": statuts.count("fait"), "virees": virees,
            "en_revue": statuts.count("revue"),
            "bloque_repris": sum(1 for r in reponses if r >= 1),
            "taux_renvoi": round(virees / livrees, 3) if livrees else None}


def _split(paires: list[tuple[str, int]]) -> tuple[list[str], list[int]]:
    return [s for s, _ in paires], [r for _, r in paires]


def personnel(projet: str | None = None) -> dict:
    if projet is None:
        projets = lister_projets()
        base = VAULT / "archive"
        archives = sorted(p for p in base.glob("*") if p.is_dir()) if base.exists() else []
    else:
        projets, archives = [VAULT / "projets" / projet], []
    par_role: dict[str, list[tuple[str, int]]] = {}
    par_modele: dict[str, list[tuple[str, int]]] = {}
    n = 0
    for proj in projets + archives:
        for _, m in lister_taches(proj):
            statut = str(m.get("statut", ""))
            rep = int(m.get("reponses", 0) or 0)
            par_role.setdefault(str(m.get("role", "")), []).append((statut, rep))
            par_modele.setdefault(str(m.get("modele", "")) or "?", []).append((statut, rep))
            n += 1
    ordre = list(roles.affectables()) + sorted(c for c in par_role if c not in roles.affectables())
    return {"perimetre": "tout" if projet is None else projet,
            "projets": len(projets), "archives": len(archives), "taches": n,
            "roles": [_ligne(c, *_split(par_role.get(c, []))) for c in ordre],
            "modeles": [_ligne(c, *_split(par_modele[c])) for c in sorted(par_modele)]}
