#!/usr/bin/env python3
"""Tests de rh.personnel : compteur bloque_repris (reponses: >= 1), virees inchangees."""
import os
import sys
import tempfile
import unittest
from pathlib import Path

TMP = tempfile.mkdtemp()
os.environ["AGENTX_ROOT"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent))
import rh  # noqa: E402

rh.VAULT = Path(TMP) / "vault"  # vx.VAULT ignore AGENTX_ROOT : on pointe rh sur le tmp


def tache(tid: str, statut: str, reponses: int | None = None):
    d = Path(TMP) / "vault" / "projets" / "p" / "taches" / f"{tid}-x"
    d.mkdir(parents=True, exist_ok=True)
    rep = "" if reponses is None else f"reponses: {reponses}\n"
    (d / "task.md").write_text(f"---\nid: {tid}\nrole: implementeur\nstatut: {statut}\n{rep}---\n", encoding="utf-8")


def ligne():
    return next(l for l in rh.personnel("p")["roles"] if l["cle"] == "implementeur")


class BloqueRepris(unittest.TestCase):
    def test_une_reprise(self):
        tache("T001", "revue", 1)
        tache("T002", "rejete")
        l = ligne()
        self.assertEqual(l["bloque_repris"], 1)
        self.assertEqual(l["virees"], 1)
        self.assertEqual(l["taux_renvoi"], 0.5)

    def test_zero_reponse(self):
        for t in Path(TMP).rglob("T00*-x"):
            (t / "task.md").unlink()
            t.rmdir()
        tache("T003", "fait")
        self.assertEqual(ligne()["bloque_repris"], 0)


if __name__ == "__main__":
    unittest.main()
