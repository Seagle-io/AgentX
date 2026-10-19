#!/usr/bin/env python3
"""Tests de dash._estimation : durées lues dans le journal, reste estimé, fiabilité."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dash  # noqa: E402


def j(h, tid, a, b):
    return (f"2026-10-16 {h}", f"{tid} statut {a} -> {b} [dispatch]")


def ligne(tid, role, statut):
    return {"id": tid, "role": role, "statut": statut}


# implementeur : T1 10 min, T2 20 min (relancée : dernier en-cours), T3 bloquée 30 min -> moy 20
# testeur : T4 40 min ; T5 > 24 h ignorée ; architecte : aucune mesure
JR = [
    j("08:00", "T1", "pret", "en-cours"), j("08:10", "T1", "en-cours", "revue"),
    j("08:00", "T2", "pret", "en-cours"), j("08:05", "T2", "en-cours", "bloque"),
    j("09:00", "T2", "pret", "en-cours"), j("09:20", "T2", "en-cours", "revue"),
    j("10:00", "T3", "pret", "en-cours"), j("10:30", "T3", "en-cours", "bloque"),
    j("11:00", "T4", "a-faire", "en-cours"), j("11:40", "T4", "en-cours", "fait"),
    ("2026-10-14 08:00", "T5 statut pret -> en-cours [dispatch]"),
    ("2026-10-16 12:00", "T5 statut en-cours -> revue"),
]
L = [ligne("T1", "implementeur", "revue"), ligne("T2", "implementeur", "revue"),
     ligne("T3", "implementeur", "bloque"), ligne("T4", "testeur", "fait"),
     ligne("T5", "testeur", "revue"), ligne("T6", "architecte", "pret"),
     ligne("T7", "implementeur", "fait")]


class Estimation(unittest.TestCase):
    def setUp(self):
        self.e = dash._estimation(JR, L)

    def test_moyenne_par_role(self):
        # T1 10, T2 5 (bloque, <… 5 min valide) puis 20 (dernier en-cours), T3 30
        self.assertEqual(self.e["par_role"]["implementeur"]["moy_min"], 16.2)
        self.assertEqual(self.e["par_role"]["implementeur"]["n_mesures"], 4)

    def test_ouvertes_hors_fait(self):
        self.assertEqual(self.e["ouvertes"], 5)
        self.assertEqual(self.e["par_role"]["implementeur"]["ouvertes"], 3)

    def test_duree_sup_24h_ignoree(self):
        self.assertEqual(self.e["par_role"]["testeur"]["n_mesures"], 1)
        self.assertEqual(self.e["par_role"]["testeur"]["moy_min"], 40.0)

    def test_role_sans_mesure_mediane(self):
        # médiane de {implementeur 16.25, testeur 40} = 28.1 (arrondi)
        self.assertEqual(self.e["par_role"]["architecte"]["moy_min"], 28.1)
        self.assertEqual(self.e["par_role"]["architecte"]["n_mesures"], 0)

    def test_reste_min(self):
        self.assertEqual(self.e["reste_min"], round(3 * 16.25 + 1 * 40 + 1 * 28.125, 1))

    def test_fiabilite_basse_si_role_sans_mesure(self):
        self.assertEqual(self.e["fiabilite"], "basse")

    def test_aucune_mesure(self):
        e = dash._estimation([], L)
        self.assertIsNone(e["reste_min"])
        self.assertEqual(e["fiabilite"], "∅")
        self.assertEqual(e["ouvertes"], 5)

    def test_fiabilite_haute_et_moyenne(self):
        jr = [j(f"0{i}:00", f"T{i}", "pret", "en-cours") for i in range(1, 7)]
        jr += [j(f"0{i}:10", f"T{i}", "en-cours", "revue") for i in range(1, 7)]
        lg = [ligne(f"T{i}", "testeur", "revue") for i in range(1, 7)]
        self.assertEqual(dash._estimation(jr, lg)["fiabilite"], "haute")
        self.assertEqual(dash._estimation(jr[:2] + jr[6:8], lg[:2])["fiabilite"], "moyenne")


if __name__ == "__main__":
    unittest.main()
