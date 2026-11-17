#!/usr/bin/env python3
"""Tests d'ameliorer : transitions -> bloque lues dans journal.md + journal/*.md, TID préfixé ou non."""

from __future__ import annotations

import datetime as _dt
import sys
import tempfile
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ameliorer  # noqa: E402


class BloqueJournalMachine(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.vault = Path(self.tmp.name) / "vault"
        self.proj = self.vault / "projets" / "p"
        d = self.proj / "taches" / "T001-x"
        d.mkdir(parents=True)
        (d / "task.md").write_text("---\nid: T001\nstatut: pret\nrole: implementeur\nmaj: 2026-11-17\n---\n",
                                   encoding="utf-8")
        (self.proj / "brief.md").write_text("---\nslug: p\n---\n", encoding="utf-8")
        (self.proj / "journal").mkdir()
        h = (_dt.datetime.now() - _dt.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M")
        (self.proj / "journal" / "c.md").write_text(f"- `{h}` T005 statut en-cours -> bloque\n", encoding="utf-8")
        (self.proj / "journal" / "AAA.md").write_text(f"- `{h}` AAA-T006 statut en-cours -> bloque\n",
                                                      encoding="utf-8")

    def test_deux_bloque_deux_vus(self):
        self.assertEqual(len(ameliorer.transitions_bloque("\n".join(ameliorer.lire_journal(self.proj)))), 2)

    def test_declencheur_syndicat_bloque(self):
        s = {**ameliorer.SEUILS, "bloque_n": 2}
        d = [x for x in ameliorer.declencheurs(self.vault, time.time(), s) if x.action == "tache:syndicat"]
        self.assertEqual([(x.regle, x.raison) for x in d], [("c", "2 bloque en 24 h")])


if __name__ == "__main__":
    unittest.main()
