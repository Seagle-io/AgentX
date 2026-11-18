#!/usr/bin/env python3
"""chemins : lecture de .env, developpement de ${VAR} et ~, l'environnement reel l'emporte."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

BIN = Path(__file__).resolve().parent.parent / "bin"
sys.path.insert(0, str(BIN))
import chemins  # noqa: E402


class Chemins(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.env = Path(self.tmp.name) / ".env"

    def tearDown(self):
        self.tmp.cleanup()

    def test_lire_formats(self):
        self.env.write_text("# commentaire\nWORKSPACE=~/w\nexport A=\"/a b\"\nB='x'\nligne invalide\n")
        self.assertEqual(chemins.lire(self.env), {"WORKSPACE": "~/w", "A": "/a b", "B": "x"})

    def test_lire_absent(self):
        self.assertEqual(chemins.lire(Path(self.tmp.name) / "nulle-part"), {})

    def test_charger_developpe_sans_ecraser(self):
        self.env.write_text("T_WS=~/w\nT_KORA=${T_WS}/Kora\nT_FIXE=/pas-ca\n")
        with mock.patch.dict(os.environ, {"HOME": "/maison", "T_FIXE": "/reel"}):
            poses = chemins.charger(self.env)
            self.assertEqual(poses, {"T_WS": "/maison/w", "T_KORA": "/maison/w/Kora"})
            self.assertEqual(os.environ["T_FIXE"], "/reel")
            self.assertEqual(chemins.developper("${T_KORA}/front"), "/maison/w/Kora/front")

    def test_variable_inconnue_laissee(self):
        self.assertEqual(chemins.developper("${T_JAMAIS_DEFINIE}/x"), "${T_JAMAIS_DEFINIE}/x")

    def test_agentx_vaut_la_racine(self):
        self.assertEqual(os.environ["AGENTX"], str(chemins.ROOT))


if __name__ == "__main__":
    unittest.main()
