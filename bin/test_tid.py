#!/usr/bin/env python3
"""Tests de tid (contrat §1) + garde : aucune regex de TID hors tid.py."""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

BIN = Path(__file__).resolve().parent
sys.path.insert(0, str(BIN))

import tid  # noqa: E402


class TestFormat(unittest.TestCase):
    def test_exact(self):
        for ok in ("MAR-T007", "T007", "T1234"):
            self.assertTrue(tid.est_tid(ok), ok)
        for ko in ("XMAR-T007", "T07", "mar-t007", "MA-T007", "MAR-T007x", ""):
            self.assertFalse(tid.est_tid(ko), ko)

    def test_findall(self):
        self.assertEqual(tid.RE_TID.findall("Intégrer MAR-T007 (revue), T003"), ["MAR-T007", "T003"])
        self.assertEqual(tid.RE_TID.findall("XMAR-T007"), [])

    def test_dossier(self):
        self.assertEqual(tid.RE_TID.match("MAR-T007-contrat-x")[0], "MAR-T007")
        self.assertEqual(tid.RE_TID.match("T002-l1-format")[0], "T002")

    def test_normaliser(self):
        self.assertEqual(tid.normaliser(" mar-t007 "), "MAR-T007")
        with self.assertRaises(tid.TidInvalide) as c:
            tid.normaliser("T07")
        self.assertEqual(c.exception.tid, "T07")
        self.assertEqual(str(c.exception), f"ID de tâche invalide : {'T07'!r}")

    def test_decomposer_numero(self):
        self.assertEqual(tid.decomposer("MAR-T007"), ("MAR", 7))
        self.assertEqual(tid.decomposer("T007"), ("", 7))
        self.assertEqual(tid.numero("SYL-T012"), 12)
        self.assertEqual(tid.numero("T1000"), 1000)
        with self.assertRaises(tid.TidInvalide):
            tid.decomposer("T07")

    def test_cle_tri(self):
        self.assertLess(tid.cle_tri("T099"), tid.cle_tri("ABC-T001"))
        self.assertLess(tid.cle_tri("MAR-T002"), tid.cle_tri("SYL-T001"))
        self.assertLess(tid.cle_tri("ABC-T001"), tid.cle_tri("zz"))
        self.assertEqual(tid.cle_tri("zz"), (2, "zz", 0))
        self.assertEqual(sorted(["MAR-T003", "T010", "T002"], key=tid.cle_tri), ["T002", "T010", "MAR-T003"])

    def test_prochain(self):
        self.assertEqual(tid.prochain(["T001", "T009", "MAR-T003", "SYL-T012"], "MAR"), "MAR-T010")
        self.assertEqual(tid.prochain(["T001", "T009", "MAR-T003"], None), "T010")
        self.assertEqual(tid.prochain([], None), "T001")
        self.assertEqual(tid.prochain(["bidon"], "MAR"), "MAR-T001")
        with self.assertRaises(tid.TidInvalide):
            tid.prochain([], "MARS")


class TestGarde(unittest.TestCase):
    def test_aucune_regex_tid_hors_tid_py(self):
        motif = re.compile(r"T\\d|T\[0-9\](?!\{2\}:)")   # T[0-9]{2}: = heure ISO (contrats.py), pas un TID
        for f in sorted(BIN.glob("*.py")):
            if f.name.startswith("test_") or f.name == "tid.py":
                continue
            self.assertIsNone(motif.search(f.read_text(encoding="utf-8")), f.name)


if __name__ == "__main__":
    unittest.main()
