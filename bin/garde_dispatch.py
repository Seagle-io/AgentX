#!/usr/bin/env python3
"""garde_dispatch — hook PreToolUse sur `Agent` : pas de tache vault, pas d'agent.

La salle n'affiche que le vault. Un agent lance sans tache est invisible, non
suivi, non capitalise. Ce hook refuse l'appel `Agent` si son prompt ne nomme pas
un pack `vault/projets/<slug>/taches/<TID>-.../context.md` qui existe, dont la
tache est en statut pret/en-cours et dont le pack passe pack-lint.

Les roles AgentX seuls sont gardes : un `Explore` ou `general-purpose` du chef
pour une question ponctuelle reste libre.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROLES = {"eclaireur", "architecte", "implementeur", "verificateur", "scribe"}
RE_PACK = re.compile(r"vault/projets/([a-z0-9-]+)/taches/(T\d{3})[^\s`'\"]*?/context\.md")


def refuser(raison: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                      "permissionDecision": "deny",
                      "permissionDecisionReason": "GARDE AGENTX — " + raison}}))
    sys.exit(0)


def main() -> None:
    try:
        entree = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if entree.get("tool_name") != "Agent":
        sys.exit(0)
    ti = entree.get("tool_input") or {}
    if str(ti.get("subagent_type", "")) not in ROLES:
        sys.exit(0)
    prompt = str(ti.get("prompt", ""))
    m = RE_PACK.search(prompt)
    if not m:
        refuser("le prompt ne nomme aucun pack vault/projets/<slug>/taches/<TID>-…/context.md. "
                "Cree la tache (./bin/agentx tache), ecris son pack, puis dispatche.")
    slug, tid = m.group(1), m.group(2)
    dossiers = list((ROOT / "vault" / "projets" / slug / "taches").glob(f"{tid}-*"))
    if not dossiers or not (dossiers[0] / "context.md").exists():
        refuser(f"pack introuvable pour {tid} ({slug}).")
    task = (dossiers[0] / "task.md").read_text(encoding="utf-8")
    st = re.search(r"^statut:\s*(\S+)", task, re.M)
    statut = st.group(1) if st else "?"
    if statut not in ("pret", "en-cours"):
        refuser(f"{tid} est en statut « {statut} » : passe-la en pret/en-cours "
                f"(./bin/agentx set {tid} --statut en-cours --projet {slug}).")
    lint = subprocess.run([sys.executable, str(ROOT / "bin" / "vx.py"), "pack-lint", tid, "--projet", slug],
                          capture_output=True, text=True, cwd=str(ROOT))
    if lint.returncode != 0:
        refuser(f"pack-lint refuse {tid} :\n" + (lint.stdout + lint.stderr).strip()[-800:])
    sys.exit(0)


if __name__ == "__main__":
    main()
