#!/usr/bin/env python3
"""attendre — `agentx attendre` : bloque jusqu'au result.md des agents detaches.

    agentx attendre <TID> [<TID>...] --projet <slug> [--tout] [--integrer] [--delai 20] [--max 7200]

Sortie : « HH:MM TID » par agent rendu ; « TID MORT » si la fiche est morte sans result.md.
--tout attend tous les TID (sinon le premier rendu suffit). --integrer enchaine
`vx integrer <rendus> --projet <slug>`. Codes : 0 rendu ; 1 agent mort ; 2 usage ; 3 delai --max depasse ;
rc 4 : TID NON LANCE (a-faire/pret/abandonne/rejete, 0 fiche) ; rc 2 aussi si TID inconnu.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import agents

BIN = Path(__file__).resolve().parent


def _rendu(slug: str, tid: str) -> bool:
    """result.md present ; avec fiche, ecrit depuis le lancement (une relance ne reprend pas l'ancien)."""
    f = agents.lire(slug, tid)
    if f:
        return agents.a_rendu(f)
    d = agents.dossier_tache(slug, tid)
    return bool(d and (d / "result.md").exists())


def _mort(slug: str, tid: str) -> bool:
    f = agents.lire(slug, tid)
    return bool(f) and agents.vivant(agents.etat(f, agents.sessions(0))) is False


def _non_lance(slug: str, tid: str) -> str | None:
    """Statut si la tache n'a jamais ete dispatchee (0 fiche), "inconnu" si ni tache ni fiche, sinon None."""
    if agents.lire(slug, tid):
        return None
    s = agents.statut_tache(slug, tid)
    if not s:
        return "inconnu"
    return s if s in ("a-faire", "pret", "abandonne", "rejete") else None


def main(argv: list[str] | None = None, sommeil=time.sleep) -> int:
    p = argparse.ArgumentParser(prog="agentx attendre", description=__doc__.split("\n\n")[1],
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("tids", nargs="*", metavar="TID")
    p.add_argument("--projet", metavar="SLUG")
    p.add_argument("--tout", action="store_true")
    p.add_argument("--integrer", action="store_true")
    p.add_argument("--delai", type=int, default=20, metavar="S")
    p.add_argument("--max", type=int, default=7200, metavar="S")
    a = p.parse_args(argv)
    if not a.projet or not a.tids:
        p.print_usage(sys.stderr)
        return 2
    attente = [t.upper() for t in a.tids]
    rendus: list[str] = []
    ecoule = 0
    rc = 3
    for tid in attente:
        s = _non_lance(a.projet, tid)
        if s == "inconnu":
            print(f"{tid} inconnu", flush=True)
            return 2
        if s:
            print(f"{tid} NON LANCE ({s}) — corrige le pack puis dispatch", flush=True)
            return 4
    while True:
        for tid in list(attente):
            if _rendu(a.projet, tid):
                print(f"{datetime.now():%H:%M} {tid}", flush=True)
                rendus.append(tid)
                attente.remove(tid)
            elif _mort(a.projet, tid):
                print(f"{tid} MORT", flush=True)
                rc = 1
        if rc == 1:
            break
        if rendus and (not a.tout or not attente):
            rc = 0
            break
        if ecoule >= a.max:
            break
        sommeil(a.delai)
        ecoule += a.delai
    if a.integrer and rendus:
        subprocess.run([sys.executable, str(BIN / "vx.py"), "integrer", *rendus, "--projet", a.projet])
    return rc


if __name__ == "__main__":
    sys.exit(main())
