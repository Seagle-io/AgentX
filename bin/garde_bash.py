#!/usr/bin/env python3
"""garde_bash — hook PreToolUse sur `Bash` : ce qui engage le dépôt ou la base
revient à l'humain, jamais à un agent.

Refusé, quel que soit le projet : `git push`, les migrations (typeorm
migration:run / generate / revert, prisma migrate, alembic upgrade...), `git
reset --hard`, `git clean -f`, `git branch -D`, `git checkout .` sur tout.
Le message indique la commande à lancer soi-même. Règle OrthoPro `RULE.MD`,
généralisée : un agent n'a pas à décider ça.
"""

import json
import re
import sys

INTERDITS = [
    (r"\bgit\s+push\b",                               "git push — pousse toi-même après relecture"),
    (r"\bmigration:(run|generate|revert|create)\b",    "migration TypeORM — à lancer par l'humain"),
    (r"\btypeorm\b.*\bmigration\b",                    "migration TypeORM — à lancer par l'humain"),
    (r"\bprisma\s+(migrate|db\s+push)\b",              "migration Prisma — à lancer par l'humain"),
    (r"\balembic\s+(upgrade|downgrade|revision)\b",    "migration Alembic — à lancer par l'humain"),
    (r"\bgit\s+reset\s+--hard\b",                      "git reset --hard — destructif"),
    (r"\bgit\s+clean\s+-[a-z]*f",                      "git clean -f — destructif"),
    (r"\bgit\s+branch\s+-D\b",                         "git branch -D — destructif"),
    (r"\bgit\s+checkout\s+(--\s+)?\.\s*$",             "git checkout . — efface le travail en cours"),
    (r"\bDROP\s+(DATABASE|SCHEMA)\b",                  "DROP DATABASE/SCHEMA — à lancer par l'humain"),
    # Volumes Docker : un prune ne choisit pas ses victimes (incident geolens-viewer T042).
    (r"\bdocker\s+(\w+\s+)?prune\b",                   "docker … prune — supprime aussi ce qui n'est pas à toi"),
    (r"\bdocker\s+volume\s+(rm|remove)\b",             "docker volume rm — données d'un autre projet possibles"),
    (r"\bdocker[\s-]compose\b.*\bdown\b.*(\s-v\b|--volumes\b)", "docker compose down -v — détruit les volumes"),
]


def main() -> None:
    try:
        entree = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if entree.get("tool_name") != "Bash":
        sys.exit(0)
    cmd = str((entree.get("tool_input") or {}).get("command", ""))
    for motif, raison in INTERDITS:
        if re.search(motif, cmd, re.I | re.M):
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                              "permissionDecision": "deny",
                              "permissionDecisionReason":
                                  f"GARDE AGENTX — {raison}. Cette commande engage le dépôt ou la base : "
                                  f"demande à l'humain de la lancer lui-même et marque la tâche "
                                  f"`bloque` avec la commande exacte dans result.md."}}))
            sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    main()
