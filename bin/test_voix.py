"""Tests de voix.passation_auto : cache patché sur un tmp, ~/.cache réel jamais touché.

Lancer : python3 -m unittest bin/test_voix.py
"""

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

import voix  # noqa: E402


class PassationAuto(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        p = patch.object(voix, "_cache", return_value=Path(self.tmp.name))
        p.start()
        self.addCleanup(p.stop)

    def test_defaut_actif(self):
        self.assertTrue(voix.etat()["passation_auto"])

    def test_desactiver_pose_le_fichier_off(self):
        self.assertFalse(voix.passation_auto(False)["passation_auto"])
        self.assertTrue((Path(self.tmp.name) / "claude-passation-auto-off").exists())

    def test_reactiver_retire_le_fichier_off(self):
        voix.passation_auto(False)
        self.assertTrue(voix.passation_auto(True)["passation_auto"])
        self.assertFalse((Path(self.tmp.name) / "claude-passation-auto-off").exists())


if __name__ == "__main__":
    unittest.main()
