"""Tests de attendre : vault de banc sous .cache/banc-T122 (AGENTX_ROOT), sessions simulees, sommeil injecte.

Lancer : python3 -m unittest bin/test_attendre.py
"""

import io
import os
import shutil
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
BANC = ICI.parent / ".cache" / "banc-T122" / f"b{os.getpid()}"

os.environ.update(AGENTX_ROOT=str(BANC))
sys.path.insert(0, str(ICI))
import agents      # noqa: E402  (ROOT lu de l'env au-dessus)
import attendre    # noqa: E402


def setUpModule():
    BANC.mkdir(parents=True)


def tearDownModule():
    shutil.rmtree(BANC)


def tache(tid: str, rendu: bool = False) -> Path:
    d = BANC / "vault" / "projets" / "banc" / "taches" / f"{tid}-banc"
    d.mkdir(parents=True, exist_ok=True)
    (d / "task.md").write_text(f"---\nid: {tid}\nstatut: en-cours\n---\n", encoding="utf-8")
    if rendu:
        rendre(d)
    return d


def rendre(d: Path) -> None:
    (d / "result.md").write_text("---\nstatut: revue\n---\n", encoding="utf-8")


def attendre_les(*args: str, sessions=None, pendant=None) -> tuple[int, str, list[int]]:
    """(rc, sortie, durees dormies) ; `pendant` s'execute a chaque sommeil (l'agent travaille)."""
    dormis: list[int] = []

    def sommeil(s):
        dormis.append(s)
        if pendant:
            pendant()
    sortie = io.StringIO()
    with mock.patch.object(agents, "sessions", lambda cache_s=5.0: sessions), redirect_stdout(sortie):
        rc = attendre.main([*args, "--projet", "banc"], sommeil=sommeil)
    return rc, sortie.getvalue(), dormis


class TestAttendre(unittest.TestCase):
    def test_rendu_immediat(self):
        tache("T070", rendu=True)
        tache("T071")
        rc, sortie, dormis = attendre_les("T070", "T071")
        self.assertEqual((rc, dormis), (0, []))
        self.assertRegex(sortie, r"^\d\d:\d\d T070\n$")

    def test_tout_attend_les_deux(self):
        tache("T072", rendu=True)
        d = tache("T073")
        rc, sortie, dormis = attendre_les("T072", "T073", "--tout", "--delai", "5", pendant=lambda: rendre(d))
        self.assertEqual((rc, dormis), (0, [5]))
        self.assertEqual([l[6:] for l in sortie.splitlines()], ["T072", "T073"])

    def test_mort_sans_result(self):
        tache("T074")
        agents.ecrire({"id_session": "aaaaaaaa", "nom": "agentx-banc-T074", "pid": None, "role": "implementeur",
                       "tid": "T074", "projet": "banc", "lance": "2026-10-17T09:00:00", "modele": None,
                       "mode": "dontAsk", "mort_signale": False})
        rc, sortie, dormis = attendre_les("T074", sessions=[])
        self.assertEqual((rc, sortie, dormis), (1, "T074 MORT\n", []))

    def test_max_depasse(self):
        tache("T075")
        rc, sortie, dormis = attendre_les("T075", "--delai", "20", "--max", "60")
        self.assertEqual((rc, sortie, dormis), (3, "", [20, 20, 20]))

    def test_usage(self):
        with redirect_stdout(io.StringIO()), mock.patch.object(sys, "stderr", io.StringIO()):
            self.assertEqual(attendre.main([]), 2)
            self.assertEqual(attendre.main(["T070"]), 2)


if __name__ == "__main__":
    unittest.main()
