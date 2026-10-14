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
]

PERMIS = [
    "git stash list",
    "git status",
]


def decision(cmd: str) -> str:
    """Forme réelle du hook : JSON sur stdin, sortie vide = allow."""
    r = subprocess.run([sys.executable, os.path.join(ICI, "garde_bash.py")],
                       input=json.dumps({"tool_name": "Bash", "tool_input": {"command": cmd}}),
                       capture_output=True, text=True, check=True)
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


if __name__ == "__main__":
    unittest.main()
