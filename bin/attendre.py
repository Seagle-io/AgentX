#!/usr/bin/env python3
"""attendre — `agentx attendre` : bloque jusqu'au result.md des agents detaches.

    agentx attendre <TID> [<TID>...] --projet <slug> [--tout] [--integrer [--long] [--appliquer]] [--build] [--suite] [--delai 20] [--max 7200]

Sortie : « HH:MM TID » par agent rendu ; « TID MORT » si la fiche est morte sans result.md.
--tout attend tous les TID (sinon le premier rendu suffit). --integrer enchaine
`vx integrer <rendus> --projet <slug> --verdict --court` (--long : 4 sections). Codes : 0 rendu ; 1 agent mort ; 2 usage ; 3 delai --max depasse ;
rc 4 : TID NON LANCE (a-faire/pret/abandonne/rejete, 0 fiche) ; rc 2 aussi si TID inconnu.
--appliquer (avec --integrer) : `retenir --sans-eval` si verdict « Vérifié sans NV, Écarts ∅ » et 0 controle/evaluateur ouvert.
--build (avec --tout) : rendu producteur sous apps/web/ => `npm run build` puis `make invariants` avant retenue ;
rc 5 : build ou invariants KO (0 retenue des rendus front). --suite : dispatche les taches `pret` dont les deps sont `fait`.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import agents
import frontmatter
import roles
import vx

BIN = Path(__file__).resolve().parent
BUILD_DOSSIER = "apps/web"
BUILD_CMD = ["npm", "run", "build"]
CONTROLES_BLOQUANTS = ("verificateur", "critique", "evaluateur")
FERMES = ("fait", "abandonne", "rejete")


def _rendu(slug: str, tid: str) -> bool:
    """result.md present ; avec fiche, ecrit depuis le lancement (une relance ne reprend pas l'ancien)."""
    f = agents.lire(slug, tid)
    if f:
        return agents.a_rendu(f)
    d = agents.dossier_tache(slug, tid)
    return bool(d and (d / "result.md").exists())


def _mort(slug: str, tid: str) -> bool:
    f = agents.lire(slug, tid)
    return bool(f) and agents.mort(f, agents.sessions(0))


def _non_lance(slug: str, tid: str) -> str | None:
    """Statut si la tache n'a jamais ete dispatchee (0 fiche), "inconnu" si ni tache ni fiche, sinon None."""
    if agents.lire(slug, tid):
        return None
    s = agents.statut_tache(slug, tid)
    if not s:
        return "inconnu"
    return s if s in ("a-faire", "pret", "abandonne", "rejete") else None


def _taches(slug: str) -> list[tuple[Path, dict]]:
    base = agents.ROOT / "vault" / "projets" / slug / "taches"
    return [(d, frontmatter.lire_frontmatter(d / "task.md")[0]) for d in sorted(base.glob("*"))
            if (d / "task.md").exists()]


def _deps(meta: dict) -> list[str]:
    deps = meta.get("deps") or []
    return [str(x) for x in (deps if isinstance(deps, list) else [deps])]


def _role(slug: str, tid: str) -> str:
    d = agents.dossier_tache(slug, tid)
    return str(frontmatter.lire_frontmatter(d / "task.md")[0].get("role", "")) if d else ""


def wl_ecriture(slug: str, tid: str) -> list[str]:
    d = agents.dossier_tache(slug, tid)
    if not d or not (d / "context.md").exists():
        return []
    return [c for c, droit in vx.whitelist_droits((d / "context.md").read_text(encoding="utf-8")) if droit == "E"]


def touche_build(chemins: list[str]) -> bool:
    return any(c.lstrip("./").startswith(BUILD_DOSSIER + "/") or c.rstrip("/") == BUILD_DOSSIER for c in chemins)


def refus_application(slug: str, tid: str) -> str | None:
    """None si `retenir --sans-eval` est applicable ; sinon la raison (1 ligne)."""
    d = agents.dossier_tache(slug, tid)
    if not d or not (d / "task.md").exists():
        return "tâche introuvable"
    meta = frontmatter.lire_frontmatter(d / "task.md")[0]
    role, statut = str(meta.get("role", "")), str(meta.get("statut", ""))
    if roles.livre_en(role) != "revue":
        return f"rôle {role} non producteur"
    if statut not in ("revue", "en-cours"):
        return f"tâche {statut}"
    if not (d / "result.md").exists():
        return "result.md absent"
    texte = (d / "result.md").read_text(encoding="utf-8")
    rmeta = frontmatter.lire_frontmatter_texte(texte)[0]
    if str(rmeta.get("statut")) != "revue":
        return f"result: {rmeta.get('statut')}"
    p = vx.verdict_propose(slug, tid, statut, rmeta, texte)
    if p is None or " retenir " not in p.split("   # proposé : ")[0]:
        return p.split("   # proposé : ")[-1] if p else "aucun verdict"
    for _, em in _taches(slug):
        if tid in _deps(em) and em.get("role") in CONTROLES_BLOQUANTS:
            if em.get("role") == "evaluateur":
                return f"évaluation {em.get('id')} existe"
            if em.get("statut") not in FERMES:
                return f"contrôle ouvert {em.get('id')}"
    return None


def construire() -> tuple[bool, str]:
    dossier = agents.ROOT / BUILD_DOSSIER
    try:
        r = subprocess.run(BUILD_CMD, cwd=dossier, capture_output=True, text=True, timeout=600)
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        return False, f"build {BUILD_DOSSIER} ÉCHEC {'npm introuvable' if isinstance(e, FileNotFoundError) else 'délai 600 s'}"
    sortie = (r.stdout or "") + (r.stderr or "")
    if r.returncode != 0:
        fin = "\n".join("      " + l for l in sortie.splitlines()[-15:])
        return False, f"build {BUILD_DOSSIER} ÉCHEC rc {r.returncode}\n{fin}"
    m = re.search(r"✓ built in \S+", sortie)
    mtimes = [f.stat().st_mtime for f in (dossier / "dist" / "assets").glob("*")]
    heure = f"{datetime.fromtimestamp(max(mtimes)):%H:%M:%S}" if mtimes else "∅"
    return True, f"build {BUILD_DOSSIER} : {m.group(0) if m else 'ok'} · dist/assets {heure}"


def invariants() -> tuple[bool, str]:
    """`make invariants` apres le build ; KO ou rc != 0 => (False, resume)."""
    try:
        r = subprocess.run(["make", "invariants"], cwd=agents.ROOT, capture_output=True, text=True, timeout=600)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False, "invariants ÉCHEC make introuvable ou délai 600 s"
    sortie = (r.stdout or "") + (r.stderr or "")
    m = re.search(r"\d+ OK / (\d+) KO", sortie)
    resume = m.group(0) if m else f"invariants ÉCHEC rc {r.returncode}"
    return r.returncode == 0 and bool(m) and m.group(1) == "0", f"invariants : {resume}"


def prets_suite(slug: str) -> list[str]:
    """Taches `pret` du projet dont toutes les deps sont `fait`."""
    taches = _taches(slug)
    statuts = {str(m.get("id")): str(m.get("statut")) for _, m in taches}
    return [str(m.get("id")) for _, m in taches
            if m.get("statut") == "pret" and all(statuts.get(x) == "fait" for x in _deps(m))]


def main(argv: list[str] | None = None, sommeil=time.sleep) -> int:
    p = argparse.ArgumentParser(prog="agentx attendre", description=__doc__.split("\n\n")[1],
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("tids", nargs="*", metavar="TID")
    p.add_argument("--projet", metavar="SLUG")
    p.add_argument("--tout", action="store_true")
    p.add_argument("--integrer", action="store_true")
    p.add_argument("--long", action="store_true")
    p.add_argument("--appliquer", action="store_true")
    p.add_argument("--build", action="store_true")
    p.add_argument("--suite", action="store_true")
    p.add_argument("--delai", type=int, default=20, metavar="S")
    p.add_argument("--max", type=int, default=7200, metavar="S")
    a = p.parse_args(argv)
    if (not a.projet or not a.tids or (a.appliquer and not a.integrer) or (a.build and not a.tout)):
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
        subprocess.run([sys.executable, str(BIN / "vx.py"), "integrer", *rendus, "--projet", a.projet, "--verdict"]
                       + ([] if a.long else ["--court"]))
    cibles: list[str] = []
    if a.build:
        if rc != 0:
            print(f"   => build sauté : vague incomplète (rc {rc})", flush=True)
        else:
            cibles = [t for t in rendus if refus_application(a.projet, t) != f"rôle {_role(a.projet, t)} non producteur"
                      and touche_build(wl_ecriture(a.projet, t))]
            if not cibles:
                print("   => build sauté : 0 rendu sous apps/web/", flush=True)
            else:
                ok, resume = construire()
                if ok:
                    ok, inv = invariants()
                    resume += f"\n   => {inv}"
                print("   => " + resume, flush=True)
                if not ok:
                    rc = 5
                else:
                    cibles = []
    if a.appliquer:
        for t in rendus:
            r = refus_application(a.projet, t) or ("build échoué" if t in cibles else None)
            if r:
                print(f"   => non appliqué {t} : {r}", flush=True)
                continue
            n = subprocess.run([sys.executable, str(BIN / "vx.py"), "retenir", t, "--projet", a.projet,
                                "--sans-eval"]).returncode
            print(f"   => retenu {t}" if n == 0 else f"   => échec retenir {t} (rc {n})", flush=True)
    if a.suite and rendus:
        candidats = prets_suite(a.projet)
        if candidats:
            print("   ++ dispatch " + " ".join(candidats), flush=True)
            subprocess.run([str(BIN / "agentx"), "dispatch", "--vague", *candidats, "--projet", a.projet])
    return rc


if __name__ == "__main__":
    sys.exit(main())
