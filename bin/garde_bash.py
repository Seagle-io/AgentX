#!/usr/bin/env python3
"""garde_bash — hook PreToolUse sur `Bash` : ce qui engage le dépôt ou la base
revient à l'humain, jamais à un agent.

Refusé, quel que soit le projet : `git push`, les migrations (typeorm
migration:run / generate / revert, prisma migrate, alembic upgrade...), `git
reset --hard`, `git clean -f`, `git branch -D`, `git checkout .`, `git stash`
(sauf list/show) sur tout.
Serveurs de dev (`npm run dev`, `vite`, `nest start`...) : refusés aussi, le
chef les démarre et les partage (`./bin/agentx env up <nom>`, incident OOM).
Détectés en position de commande (découpe shlex), pas sur le texte cité (T062).
Le message indique la commande à lancer soi-même. Règle OrthoPro `RULE.MD`,
généralisée : un agent n'a pas à décider ça.
"""

import json
import os
import re
import shlex
import sys

INTERDITS = [
    # `-c` couvre `-C` (re.I) : deux alternatives = retour arrière exponentiel.
    (r"\bgit(\s+(-c\s+\S+|--no-pager|--(work-tree|git-dir)(=|\s+)\S+))*\s+push\b",
     "git push — pousse toi-même après relecture"),
    (r"\bmigration:(run|generate|revert|create)\b",    "migration TypeORM — à lancer par l'humain"),
    (r"\btypeorm\b.*\bmigration\b",                    "migration TypeORM — à lancer par l'humain"),
    (r"\bprisma\s+(migrate|db\s+push)\b",              "migration Prisma — à lancer par l'humain"),
    (r"\balembic\s+(upgrade|downgrade|revision)\b",    "migration Alembic — à lancer par l'humain"),
    (r"\bgit\s+reset\s+--hard\b",                      "git reset --hard — destructif"),
    (r"\bgit\s+clean\s+-[a-z]*f",                      "git clean -f — destructif"),
    (r"\bgit\s+branch\s+-D\b",                         "git branch -D — destructif"),
    (r"\bgit\s+checkout\s+(--\s+)?\.\s*$",             "git checkout . — efface le travail en cours"),
    # Arbre partagé : d'autres agents écrivent en même temps (incident T108).
    (r"\bgit\s+stash\b(?!\s+(list|show)\b)",           "git stash — arbre partagé, d'autres agents écrivent en même temps"),
    (r"\bDROP\s+(DATABASE|SCHEMA)\b",                  "DROP DATABASE/SCHEMA — à lancer par l'humain"),
    # Volumes Docker : un prune ne choisit pas ses victimes (incident geolens-viewer T042).
    (r"\bdocker\s+(\w+\s+)?prune\b",                   "docker … prune — supprime aussi ce qui n'est pas à toi"),
    (r"\bdocker\s+volume\s+(rm|remove)\b",             "docker volume rm — données d'un autre projet possibles"),
    (r"\bdocker[\s-]compose\b.*\bdown\b.*(\s-v\b|--volumes\b)", "docker compose down -v — détruit les volumes"),
]

# Serveurs de dev : un par agent sature la RAM (incident OOM 2026-10-14).
PARTAGE = " — serveur partagé du chef : ./bin/agentx env up <nom>"
# Repli si shlex échoue (guillemet non fermé) : motifs texte d'avant T062.
SERVEURS_REPLI = [
    (r"\b(npm|pnpm|yarn)(\s+(--prefix|-w|--workspace|--filter|-C|--cwd|workspace)(\s+|=)\S+)*"
     r"\s+(run\s+)?(dev(:[\w-]+)?|serve|preview|start(:dev)?)(?=$|[\s;&|)<>\"'])", "serveur de dev"),
    (r"(^|[;&|(\n\"']|\$\()[ \t]*((npx|bunx|nohup|setsid|exec|env|npm\s+exec|timeout\s+\S+|[A-Z_][A-Z0-9_]*=\S*|--?[\w-]+)\s+)*"
     r"(\S*node_modules/\.bin/)?vite(@\S*)?(?=$|[\s;&|)<>\"'])(?!\s+(build|optimize)\b)", "vite"),
    (r"vite/bin/vite\.js", "vite"),
    (r"\bnest\s+start\b", "nest start"),
]
PONCTUATION = ";&|()<>`\n"
HEREDOC = re.compile(r"(?<!<)<<(-?)\s*(['\"]?)([\w.-]+)\2")
SCRIPTS_DEV = {"dev", "serve", "preview", "start", "start:dev", "storybook"}
PREFIXES = {"sudo", "nice", "ionice", "nohup", "setsid", "exec", "env", "timeout", "xargs", "time",
            "stdbuf", "corepack", "command", "{", "!", "if", "then", "else", "while", "until", "do"}
OPTIONS_PREFIXE = {"timeout": {"-s", "--signal", "-k", "--kill-after"}, "sudo": {"-u", "-g"},
                   "xargs": {"-I", "-d", "-a", "-E"}, "env": {"-u", "-C"}}
OPTIONS_PM = {"--prefix", "--dir", "-C", "--cwd", "-w", "--workspace", "--filter"}


def _sans_heredocs(cmd: str) -> str:
    """Retire le corps des heredocs : du texte, pas des commandes."""
    garde, attente = [], []
    for ligne in cmd.split("\n"):
        if attente:
            fin, tabs = attente[0]
            if (ligne.lstrip("\t") if tabs else ligne) == fin:
                attente.pop(0)
            continue
        garde.append(ligne)
        attente = [(m.group(3), m.group(1) == "-") for m in HEREDOC.finditer(ligne)]
    return "\n".join(garde)


def _apres_options(args: list, a_valeur=frozenset()) -> list:
    i = 0
    while i < len(args) and args[i].startswith("-"):
        i += 2 if args[i] in a_valeur else 1
    return args[i:]


def _commande(mots: list) -> list:
    """Commande utile : saute préfixes (sudo, env, timeout <n>…), affectations, drapeaux."""
    i, prefixe = 0, None
    while i < len(mots):
        m = mots[i]
        if m in PREFIXES:
            prefixe = m
        elif prefixe and m in OPTIONS_PREFIXE.get(prefixe, ()):
            i += 1
        elif not (re.match(r"[A-Za-z_]\w*=", m) or m.startswith("-") or (prefixe and m[:1].isdigit())):
            return mots[i:]
        i += 1
    return []


def _script_dev(script: str) -> bool:
    return script in SCRIPTS_DEV or script.startswith("dev:")


def _serveur(mots: list, profondeur: int) -> str | None:
    """Ce que lance la commande simple `mots`, si c'est un serveur de dev."""
    mots = _commande(mots)
    if not mots:
        return None
    nom, args = os.path.basename(mots[0]), mots[1:]
    positionnels = [a for a in args if not a.startswith("-")]
    if nom == "vite" or nom.startswith("vite@"):
        return None if positionnels[:1] in (["build"], ["optimize"]) else "vite"
    if (positionnels[0] if nom == "node" and positionnels else mots[0]).endswith("vite/bin/vite.js"):
        return "vite"
    if nom in ("npx", "bunx"):
        return _serveur(_apres_options(args, {"-p", "--package"}), profondeur)
    if nom in ("npm", "pnpm", "yarn", "bun"):
        reste = args
        while True:
            reste = _apres_options(reste, OPTIONS_PM)
            if reste[:1] == ["workspace"]:
                reste = reste[2:]
            elif reste[:1] in (["workspaces"], ["foreach"]):
                reste = reste[1:]
            else:
                break
        if not reste:
            return None
        sous = reste[0]
        if sous in ("exec", "dlx", "x"):
            return _serveur(reste[1:], profondeur)
        if sous in ("run", "run-script"):
            script = _apres_options(reste[1:], OPTIONS_PM)[:1]
            return f"{nom} run {script[0]}" if script and _script_dev(script[0]) else None
        if _script_dev(sous):
            return f"{nom} {sous}"
        return None if nom == "npm" else _serveur(reste, profondeur)
    if nom == "turbo":
        reste = _apres_options(args, OPTIONS_PM)
        if reste[:1] == ["run"]:
            reste = _apres_options(reste[1:], OPTIONS_PM)
        return f"turbo {reste[0]}" if reste and _script_dev(reste[0]) else None
    if (nom, positionnels[:1]) in (("nest", ["start"]), ("next", ["dev"])):
        return f"{nom} {positionnels[0]}"
    if nom in ("sh", "bash") and profondeur < 3:
        for j, a in enumerate(args):
            if re.fullmatch(r"-[a-z]*c[a-z]*", a):
                return serveur_de_dev(args[j + 1], profondeur + 1) if j + 1 < len(args) else None
            if not a.startswith("-"):
                break
    return None


def serveur_de_dev(cmd: str, profondeur: int = 0) -> str | None:
    """Raison de refus si une commande simple de `cmd` lance un serveur de dev."""
    lex = shlex.shlex(_sans_heredocs(cmd), posix=True, punctuation_chars=PONCTUATION)
    lex.whitespace = " \t\r"
    lex.whitespace_split = True
    lex.commenters = ""
    try:
        jetons = list(lex)
    except ValueError:
        quoi = next((q for motif, q in SERVEURS_REPLI if re.search(motif, cmd, re.I | re.M)), None)
        return quoi and quoi + PARTAGE
    mots, cible = [], False
    for j in jetons + [";"]:
        if j and set(j) <= set("<>"):
            cible = True
        elif j and set(j) <= set(PONCTUATION):
            quoi = _serveur(mots, profondeur)
            if quoi:
                return quoi + PARTAGE
            mots = []
        elif cible:
            cible = False
        else:
            mots.append(j)
    return None


def main() -> None:
    try:
        entree = json.load(sys.stdin)
    except Exception:
        entree = None                               # hook branche sur Bash seul : refus
    if isinstance(entree, dict) and entree.get("tool_name") != "Bash":
        sys.exit(0)
    outil = entree.get("tool_input") if isinstance(entree, dict) else None
    cmd = outil.get("command") if isinstance(outil, dict) else None
    if not isinstance(cmd, str):
        raison = "entrée de garde mal formée"
    else:
        raison = next((r for motif, r in INTERDITS if re.search(motif, cmd, re.I | re.M)), None) or serveur_de_dev(cmd)
    if raison:
        if not isinstance(cmd, str):
            suite = "Relance la commande ; si le refus persiste, marque la tâche `bloque` dans result.md."
        elif "env up" in raison:
            suite = ("Un agent ne lance pas de serveur : utilise l'URL de ton pack ; "
                     "service mort → marque la tâche `bloque` avec cette commande dans result.md.")
        else:
            suite = ("Cette commande engage le dépôt ou la base : "
                     "demande à l'humain de la lancer lui-même et marque la tâche "
                     "`bloque` avec la commande exacte dans result.md.")
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                          "permissionDecision": "deny",
                          "permissionDecisionReason": f"GARDE AGENTX — {raison}. {suite}"}}))
    sys.exit(0)


if __name__ == "__main__":
    main()
