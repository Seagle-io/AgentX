#!/usr/bin/env python3
"""Tests de dash._flux : arcs chef→agent et dep→tâche."""
import os
import sys
import tempfile
import unittest
from pathlib import Path

TMP = tempfile.mkdtemp()
os.environ["AGENTX_ROOT"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent))
import dash  # noqa: E402


def flux(*taches):
    return dash._flux([(None, {"role": "implementeur", "titre": "x", **t}) for t in taches])


class Flux(unittest.TestCase):
    def test_en_cours_sans_dep(self):
        a = flux({"id": "T1", "statut": "en-cours"})
        self.assertEqual([(e["de"], e["vers"], e["etat"]) for e in a], [("chef", "implementeur", "actif")])

    def test_bloque_sans_dep(self):
        self.assertEqual(flux({"id": "T1", "statut": "bloque"})[0]["etat"], "bloque")

    def test_dep_en_cours(self):
        a = flux({"id": "T1", "statut": "en-cours"}, {"id": "T2", "statut": "a-faire", "deps": ["T1"]})
        self.assertEqual(sorted((e["de_tid"], e["vers_tid"], e["etat"]) for e in a),
                         [("T1", "T2", "actif"), ("pack", "T1", "actif")])

    def test_pret(self):
        a = flux({"id": "T1", "statut": "pret"})
        self.assertEqual([(e["de"], e["etat"]) for e in a], [("chef", "livre")])

    def test_fait_sans_dep(self):
        self.assertEqual(flux({"id": "T1", "statut": "fait"}), [])

    def test_dep_fait(self):
        a = flux({"id": "T1", "statut": "fait"}, {"id": "T2", "statut": "a-faire", "deps": ["T1"]})
        self.assertEqual([e["etat"] for e in a], ["livre"])


if __name__ == "__main__":
    unittest.main()
