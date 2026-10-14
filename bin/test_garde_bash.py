"""Tests de garde_bash : refuse ce qui engage le dépôt ou la base.

Lancer : python3 -m unittest bin/test_garde_bash.py
"""

import json
import os
import subprocess
import sys
import unittest

ICI = os.path.dirname(os.path.abspath(__file__))

REFUS = [
    "git push",
    "cd x && git push origin main",
    "git stash",
    "git stash -u",
    'bash -c "git push"',
    "sh -c 'git reset --hard'",
    'psql -c "DROP DATABASE x"',
    "npx typeorm migration:run",
    "docker volume rm v",
    "git clean -fd",
    "git checkout .",
    "git checkout -- .",
    'echo "git push" | bash',
    "echo $(git push)",
    'echo "$(git stash)"',
    "echo ok\ngit push",
    "bash <<EOF\ngit push\nEOF",
    'git commit -m "x" && git push',
    "git checkout .\nls",
    "awk 'BEGIN{system(\"git push\")}'",
    "npm run dev",
    "npx vite --port 5201",
    "vite",
    "node web/node_modules/vite/bin/vite.js --config x",
    "npm run start:dev",
    # Contournements T040 (D2, D3) et git -C.
    "npx vite > /tmp/v.log 2>&1 &",
    "nohup npx vite > x &",
    "vite 2>&1 | tee x",
    "./node_modules/.bin/vite",
    "node_modules/.bin/vite --port 1",
    "npx vite@5",
    "npx vite .",
    "vite web",
    "vite serve web",
    "npm --prefix web run dev",
    "npm -w web run dev",
    "pnpm --filter web dev",
    "pnpm -C web dev",
    "yarn --cwd web dev",
    "yarn workspace web dev",
    "git -C repo push",
    "git -C ../x push origin main",
    "docker system prune -af",
    "docker compose down -v",
    "git reset --hard HEAD",
    'bash -c "vite"',
    "sh -c 'npm run dev'",
    # D4-D8 T051 / T062 : position de commande.
    "pnpm exec vite",
    "pnpm vite",
    "yarn vite",
    "yarn dlx vite",
    "pnpm --dir web dev",
    "pnpm -r dev",
    "npm -s run dev",
    "npm run-script dev",
    "npm run storybook",
    "bun run dev",
    "npx next dev",
    "turbo run dev",
    "xargs vite",
    "`npx vite`",
    "nice vite",
    "sudo vite",
    "timeout -s KILL 60 vite",
    "env FOO=1 vite",
    "npx --package vite vite",
    "npm exec -- vite",
    "bash -lc 'cd web && npm run dev'",
    "cd web && vite --port 5300",
    "npx vite preview",
    "yarn workspaces foreach run dev",
    "git -c x=y push",
    "git --git-dir=.git push",
    "git --no-pager push",
    "git --work-tree=. push",
    "x=$(git push origin main)",
]

PERMIS = [
    "git stash list",
    "git status",
    "vitest run",
    "npx vite build",
    "cat vite.config.mjs",
    "node /tmp/banc-impression/shot.mjs --url http://127.0.0.1:5200/",
    "./bin/agentx env up banc-impression",
    # Faux positifs D4 T040.
    "npm i -D vite",
    "npm ls vite",
    "rg vite",
    "cat package.json | grep vite",
    "npm run preview:build",
    "npm run start:prod",
    "npm run dev-check",
    "npx vitest run",
    "npm run build",
    "npm run test",
    "ls node_modules/vite",
    # Texte cité, faux positifs T051 / T062.
    'rg -n "vite" src',
    'grep -rn "vite" .',
    "node -e \"require('vite')\"",
    "python3 -c \"print('vite')\"",
    "cat > package.json <<'EOF'\n{\n  \"devDependencies\": {\n    \"vite\": \"^5.0.0\"\n  }\n}\nEOF",
    "rg -n 'npm run dev' docs",
    "git log -p -S 'npm start'",
    "npx vitest run src/x",
    "npm run test -- --run",
    "npm run lint",
    "npx playwright test",
    "node /tmp/banc-impression/shot.mjs --url http://127.0.0.1:5200/ --out /tmp/x QCM",
    "cat vite.config.ts",
    "vite build --watch",
    "which vite",
    "npm test -- dev",
    "git commit -m 'fix: vite --host config'",
    "git help push",
    "git log --grep push",
]


def decision(cmd: str) -> str:
    """Forme réelle du hook : JSON sur stdin, sortie vide = allow."""
    return decision_brute(json.dumps({"tool_name": "Bash", "tool_input": {"command": cmd}}))


def decision_brute(entree: str) -> str:
    r = subprocess.run([sys.executable, os.path.join(ICI, "garde_bash.py")],
                       input=entree, capture_output=True, text=True, check=True)
    if not r.stdout.strip():
        return "allow"
    return json.loads(r.stdout)["hookSpecificOutput"]["permissionDecision"]


class TestGardeBash(unittest.TestCase):
    def test_refus(self):
        for cmd in REFUS:
            with self.subTest(cmd=cmd):
                self.assertEqual(decision(cmd), "deny")

    def test_permis(self):
        for cmd in PERMIS:
            with self.subTest(cmd=cmd):
                self.assertEqual(decision(cmd), "allow")

    def test_entree_mal_formee(self):
        for brut, attendu in [("null", "deny"), ("[]", "deny"), ("not json", "deny"),
                              ('{"tool_name":"Bash","tool_input":"x"}', "deny"),
                              ('{"tool_name":"Bash","tool_input":{"command":1}}', "deny"),
                              ('{"tool_name":"Read"}', "allow")]:
            with self.subTest(brut=brut):
                self.assertEqual(decision_brute(brut), attendu)


if __name__ == "__main__":
    unittest.main()
