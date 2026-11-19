"""Tests trello : carte liee a une tache seulement avec l'accord humain, 1 tache ouverte par carte,
action attendue du chef (deplacer a verifier), deplacement note au vault, remplacante qui garde la carte.

Lancer : python3 -m unittest bin/test_trello.py
Banc jetable .cache/banc-trello/b<pid> : le vrai vault n'est jamais touche.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = DEPOT / ".cache" / "banc-trello" / f"b{os.getpid()}"
CARTE = "https://trello.com/c/AbCd1234/42-griser-le-module-facturation"
COURTE = "https://trello.com/c/AbCd1234"


def setUpModule():
    (BANC / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "chemins.py", "frontmatter.py", "agents.py",
              "terminal.py", "voix.py", "demandes.py", "tid.py", "identite.py", "partage.py", "personne.py",
              "trello.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(DEPOT / "roles.json", BANC / "roles.json")
    (BANC / "vault" / "_templates").mkdir(parents=True)
    for f in ("task.md", "context.md"):
        shutil.copy(DEPOT / "vault" / "_templates" / f, BANC / "vault" / "_templates" / f)
    (BANC / "vault" / "projets" / "kora-trello").mkdir(parents=True)
    (BANC / "trello.json").write_text(json.dumps({"tableaux": [{
        "url": "https://trello.com/b/CLzKfnkx/kora", "projet": "kora-trello",
        "a_faire": "TODO", "a_verifier": "A Vérifier"}]}), encoding="utf-8")


def tearDownModule():
    shutil.rmtree(BANC.parent)


def vx(*args: str) -> subprocess.CompletedProcess:
    env = {**os.environ, "AGENTX_PERSONNE": "julien"}
    env.pop("AGENTX_CHEF", None)
    return subprocess.run([sys.executable, str(BANC / "bin" / "vx.py"), *args],
                          capture_output=True, text=True, cwd=str(BANC), env=env)


def meta(tid: str) -> str:
    d = next((BANC / "vault" / "projets" / "kora-trello" / "taches").glob(f"{tid}-*"))
    return (d / "task.md").read_text(encoding="utf-8")


def etat() -> dict:
    r = vx("trello", "--json")
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


class Trello(unittest.TestCase):
    def test_1_sans_accord_refuse(self):
        r = vx("tache", "Griser Facturation", "--projet", "kora-trello", "--role", "implementeur",
               "--trello", CARTE)
        self.assertEqual(r.returncode, 1)
        self.assertIn("--trello exige --accord", r.stderr)
        self.assertFalse((BANC / "vault" / "projets" / "kora-trello" / "taches").exists())
        r = vx("tache", "x", "--projet", "kora-trello", "--role", "implementeur", "--trello", CARTE, "--accord", "  ")
        self.assertEqual(r.returncode, 1)
        self.assertIn("--accord : 1 a 200", r.stderr)
        r = vx("tache", "x", "--projet", "kora-trello", "--role", "implementeur",
               "--trello", "https://trello.com/b/CLzKfnkx/kora", "--accord", "oui")
        self.assertIn("carte Trello invalide", r.stderr)

    def test_2_accord_lie_et_doublon_refuse(self):
        r = vx("tache", "Griser Facturation", "--projet", "kora-trello", "--role", "implementeur",
               "--trello", CARTE, "--accord", "Julien : oui, vas-y")
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        m = meta(tid)
        self.assertIn(f"trello: {COURTE}\n", m)
        self.assertRegex(m, r"trello_accord: .?\d{4}-\d{2}-\d{2} Julien : oui, vas-y")
        journal = "".join(p.read_text(encoding="utf-8")
                          for p in (BANC / "vault" / "projets" / "kora-trello").rglob("*.md") if "journal" in str(p))
        self.assertIn(f"{tid} carte {COURTE} — accord : ", journal)
        r = vx("tache", "encore", "--projet", "kora-trello", "--role", "implementeur",
               "--trello", CARTE + "?x", "--accord", "oui")
        self.assertEqual(r.returncode, 1)
        self.assertIn(f"carte {COURTE} deja prise : kora-trello/{tid}", r.stderr)
        e = etat()
        self.assertEqual(e["tableaux"][0]["a_verifier"], "A Vérifier")
        self.assertEqual([(t["tid"], t["action"]) for t in e["taches"]], [(tid, "")])

    def test_3_rendue_puis_deplacee(self):
        tid = etat()["taches"][0]["tid"]
        r = vx("set", tid, "--statut", "revue", "--projet", "kora-trello", "--force")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(etat()["taches"][0]["action"], "deplacer vers « A Vérifier » + commenter le TID")
        r = vx("trello", "deplace", tid, "--projet", "kora-trello", "--liste", "A Vérifier")
        self.assertEqual((r.returncode, r.stdout), (0, f"{tid} : carte -> « A Vérifier »\n"), r.stderr)
        self.assertEqual(etat()["taches"][0]["action"], "")
        self.assertIn("trello_liste: A Vérifier", meta(tid))
        r = vx("trello")
        self.assertIn(f"kora-trello/{tid}", r.stdout)
        self.assertIn("liste « A Vérifier »", r.stdout)

    def test_4_deplace_sans_carte_refuse(self):
        r = vx("tache", "sans carte", "--projet", "kora-trello", "--role", "implementeur")
        tid = r.stdout.split()[0]
        r = vx("trello", "deplace", tid, "--projet", "kora-trello", "--liste", "A Vérifier")
        self.assertEqual(r.returncode, 1)
        self.assertIn("aucune carte Trello liee", r.stderr)

    def test_5_trello_json_invalide(self):
        f = BANC / "trello.json"
        bon = f.read_text(encoding="utf-8")
        try:
            f.write_text(json.dumps({"tableaux": [{"url": "https://exemple.fr", "projet": "p",
                                                   "a_faire": "TODO", "a_verifier": "AV"}]}), encoding="utf-8")
            r = vx("trello")
            self.assertEqual(r.returncode, 1)
            self.assertIn("tableaux[0].url", r.stderr)
        finally:
            f.write_text(bon, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
