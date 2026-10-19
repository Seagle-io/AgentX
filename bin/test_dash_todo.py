#!/usr/bin/env python3
"""Tests de dash._todo : `- [ ] ? q` → prio 0 VOTRE CHOIX, notes → prio 4."""
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path

TMP = tempfile.mkdtemp()
os.environ["AGENTX_ROOT"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent))
import dash  # noqa: E402


def items(todo):
    proj = Path(TMP) / "vault" / "projets" / "p"
    proj.mkdir(parents=True, exist_ok=True)
    (proj / "todo.md").write_text(todo, encoding="utf-8")
    return [i for i in dash._todo(proj, [], []) if i["prio"] in (0, 4)]


class TodoQuestions(unittest.TestCase):
    def test_question(self):
        got = items("- [ ] ? q1\n")
        self.assertEqual([{k: got[0][k] for k in ("prio", "etiquette", "titre", "cmd", "exe")}],
                         [{"prio": 0, "etiquette": "VOTRE CHOIX", "titre": "q1", "cmd": "", "exe": None}])

    def test_question_cochee_ignoree(self):
        self.assertEqual(items("- [x] ? vieux\n"), [])

    def test_note_prio_4(self):
        got = items("- [ ] note\n")
        self.assertEqual((got[0]["prio"], got[0]["titre"]), (4, "note"))

    def test_tri_question_avant_note(self):
        self.assertEqual([i["prio"] for i in items("- [ ] note\n- [ ] ? q\n")], [0, 4])


def alerte(todo, bloque=0):
    item = lambda p: {"prio": p, "etiquette": "VOTRE CHOIX", "titre": "q", "detail": "", "cmd": "", "exe": None}
    compteurs = {k: 0 for k in dash.STATUTS}
    compteurs["bloque"] = bloque
    bloc = {"slug": "p", "bmeta": {}, "compteurs": compteurs, "todo": [item(p) for p in todo],
            "taches": [], "activite": time.time()}
    return dash._bloc_produit(None, [bloc], "p", time.time())["alerte"]


class AlerteEtage(unittest.TestCase):
    def test_choix(self):
        self.assertEqual(alerte([0, 0]), {"niveau": "choix", "texte": "2 question(s) pour vous"})

    def test_bloque_avant_choix(self):
        self.assertEqual(alerte([0, 1], bloque=1)["niveau"], "bloque")

    def test_urgent(self):
        self.assertEqual(alerte([1])["niveau"], "urgent")


if __name__ == "__main__":
    unittest.main()
