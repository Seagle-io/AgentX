"""Tests du choix du dossier web de bin/agentx (apps/web/dist par defaut)."""
import importlib.machinery
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path

_chemin = Path(__file__).resolve().parent / "agentx"
_loader = importlib.machinery.SourceFileLoader("agentx_cli", str(_chemin))
_spec = importlib.util.spec_from_loader("agentx_cli", _loader)
agentx = importlib.util.module_from_spec(_spec)
_loader.exec_module(agentx)


def _touch(p: Path, t: float):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("x")
    os.utime(p, (t, t))


class DossierWeb(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def test_dist_present_donne_v2(self):
        (self.root / "apps/web/dist").mkdir(parents=True)
        self.assertEqual(agentx.dossier_web([], self.root), "apps/web/dist")

    def test_dist_absent_donne_dist(self):
        self.assertEqual(agentx.dossier_web([], self.root), "apps/web/dist")

    def test_web_explicite_gagne(self):
        (self.root / "apps/web/dist").mkdir(parents=True)
        self.assertEqual(agentx.dossier_web(["--web", "x"], self.root), "x")

    def test_perime_sans_index(self):
        self.assertTrue(agentx.dist_perime(self.root))

    def test_perime_si_src_plus_recent(self):
        _touch(self.root / "apps/web/dist/index.html", 1000)
        _touch(self.root / "apps/web/src/a/b.ts", 2000)
        self.assertTrue(agentx.dist_perime(self.root))

    def test_frais_si_dist_plus_recent(self):
        _touch(self.root / "apps/web/src/a/b.ts", 1000)
        _touch(self.root / "apps/web/dist/index.html", 2000)
        self.assertFalse(agentx.dist_perime(self.root))


if __name__ == "__main__":
    unittest.main()
