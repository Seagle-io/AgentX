#!/usr/bin/env python3
"""garde_dispatch — hook PreToolUse sur `Agent` : pas de tache vault, pas d'agent.

La salle n'affiche que le vault. Un agent lance sans tache est invisible, non
suivi, non capitalise. Ce hook refuse l'appel `Agent` si son prompt ne nomme pas
un pack `vault/projets/<slug>/taches/<TID>-.../context.md` qui existe, dont la
tache est en statut pret/en-cours, dont le pack passe pack-lint et dont les
`- service:` de « ## Environnement » sont vivants (vx.py env verifier --pack).

Les roles AgentX seuls sont gardes : un `Explore` ou `general-purpose` du chef
pour une question ponctuelle reste libre. Un role AgentX dont la tache est
valide n'est pas lance en sous-agent : il tourne detache (`agentx dispatch`),
seul moyen de survivre a Echap et a la fermeture de la session chef. C'est
`dispatch.py` qui passe la tache pret -> en-cours (`vx.py set --dispatch`), note
`quoi: dispatch` dans run/evenements.jsonl et impose `modele:` / `effort:` de
task.md a l'agent ; doctor et la todo du chef signalent une tache en-cours sans
ce dispatch.

`verifier()` est la seule implementation des cinq refus : `dispatch.py`
l'importe, le hook l'appelle.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
RE_PACK = re.compile(r"vault/projets/([a-z0-9-]+)/taches/(T\d{3})[^\s`'\"]*?/context\.md")


def refuser(raison: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                      "permissionDecision": "deny",
                      "permissionDecisionReason": "GARDE AGENTX — " + raison}}))
    sys.exit(0)


def est_role_agentx(nom: str) -> bool:
    try:
        import roles
        return roles.est_role_agentx(nom)
    except Exception:
        return (ROOT / ".claude" / "agents" / f"{nom}.md").exists()


def verifier(slug: str, tid: str, role: str | None, relance_bloque: bool = False) -> tuple[Path, str, None] | tuple[None, None, str]:
    """(dossier, role_tache, None) si dispatchable, sinon (None, None, raison).

    Refus, dans l'ordre : 1 pack introuvable ; 2 statut hors pret/en-cours (bloque admis si relance_bloque) ;
    3 role fourni ≠ role de la tache (role None : non verifie) ; 4 pack-lint ;
    5 services du pack non vivants.
    """
    dossiers = list((ROOT / "vault" / "projets" / slug / "taches").glob(f"{tid}-*"))
    if not dossiers or not (dossiers[0] / "context.md").exists():
        return None, None, f"pack introuvable pour {tid} ({slug})."
    task = (dossiers[0] / "task.md").read_text(encoding="utf-8")
    st = re.search(r"^statut:\s*(\S+)", task, re.M)
    statut = st.group(1) if st else "?"
    if statut not in ("pret", "en-cours", *(("bloque",) if relance_bloque else ())):
        return None, None, (f"{tid} est en statut « {statut} » : "
                            f"python3 bin/vx.py pack-lint {tid} --projet {slug} (vert ⇒ pret) ; le dispatch la passe en-cours.")
    rl = re.search(r"^role:\s*(\S+)", task, re.M)
    r = rl.group(1) if rl else "?"
    if role is not None and r != role:
        return None, None, f"{tid} est une tache « {r} », pas « {role} » : dispatche subagent_type={r}."
    lint = subprocess.run([sys.executable, str(ROOT / "bin" / "vx.py"), "pack-lint", tid, "--projet", slug],
                          capture_output=True, text=True, cwd=str(ROOT))
    if lint.returncode != 0:
        return None, None, f"pack-lint refuse {tid} :\n" + (lint.stdout + lint.stderr).strip()[-800:]
    env = subprocess.run([sys.executable, str(ROOT / "bin" / "vx.py"), "env", "verifier",
                          "--pack", str(dossiers[0] / "context.md")],
                         capture_output=True, text=True, cwd=str(ROOT))
    if env.returncode != 0:
        return None, None, ("environnement non prêt :\n" + (env.stdout + env.stderr).strip()[-800:]
                            + "\nlance ./bin/agentx env up <nom> puis redispatche")
    return dossiers[0], r, None


def main() -> None:
    try:
        entree = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if entree.get("tool_name") != "Agent":
        sys.exit(0)
    ti = entree.get("tool_input") or {}
    t = str(ti.get("subagent_type", ""))
    if not est_role_agentx(t):
        sys.exit(0)
    prompt = str(ti.get("prompt", ""))
    m = RE_PACK.search(prompt)
    if not m:
        refuser("le prompt ne nomme aucun pack vault/projets/<slug>/taches/<TID>-…/context.md. "
                "Cree la tache (./bin/agentx tache), ecris son pack, puis dispatche.")
    slug, tid = m.group(1), m.group(2)
    _, _, raison = verifier(slug, tid, t)
    if raison:
        refuser(raison)
    refuser(f"les agents AgentX tournent détachés : ./bin/agentx dispatch {tid} --projet {slug} "
            "(vague : --vague T1 T2…)")


if __name__ == "__main__":
    main()
