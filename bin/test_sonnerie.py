"""Tests de sonnerie.ecrire_evenement : anti-doublon et rotation.

Lancer : python3 -m unittest bin/test_sonnerie.py
Écrit dans .cache/banc-T083/ev.jsonl, jamais dans run/.
"""

import json
import os
import sys
import types
import unittest
from pathlib import Path

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import sonnerie  # noqa: E402

BANC = Path(ICI).parent / ".cache" / "banc-T083" / "ev.jsonl"


def ev(**champs: str) -> dict:
    base = {"id": "0" * 16, "t": "10:00:00", "quoi": "agent-fini", "role": "implementeur",
            "tid": "T999", "statut": "revue", "verdict": "", "projet": "agentx"}
    return {**base, **champs}


class TestEcrireEvenement(unittest.TestCase):
    def setUp(self):
        BANC.parent.mkdir(parents=True, exist_ok=True)
        if BANC.exists():
            BANC.unlink()
        sonnerie.EVENEMENTS = BANC
        self.annonces = []
        sys.modules["voix"] = types.SimpleNamespace(annoncer=lambda e: self.annonces.append(e))

    def tearDown(self):
        sys.modules.pop("voix", None)

    def lignes(self) -> list:
        return [json.loads(l) for l in BANC.read_text(encoding="utf-8").splitlines()]

    def test_doublon_ignore(self):
        sonnerie.ecrire_evenement(ev())
        sonnerie.ecrire_evenement(ev(id="1" * 16, t="10:00:59"))
        self.assertEqual(len(self.lignes()), 1)
        self.assertEqual(len(self.annonces), 1)

    def test_statut_different_ecrit(self):
        sonnerie.ecrire_evenement(ev())
        sonnerie.ecrire_evenement(ev(statut="bloque", quoi="agent-bloque"))
        self.assertEqual([l["statut"] for l in self.lignes()], ["revue", "bloque"])
        self.assertEqual(len(self.annonces), 2)

    def test_apres_60s_ecrit(self):
        sonnerie.ecrire_evenement(ev())
        sonnerie.ecrire_evenement(ev(t="10:01:00"))
        self.assertEqual(len(self.lignes()), 2)

    def test_rotation(self):
        bourrage = json.dumps(ev(quoi="x", tid="T000")) + "\n"
        with BANC.open("w", encoding="utf-8") as f:
            for _ in range(sonnerie.MAX_OCTETS // len(bourrage) + 2):
                f.write(bourrage)
        self.assertGreater(BANC.stat().st_size, sonnerie.MAX_OCTETS)
        sonnerie.ecrire_evenement(ev())
        lignes = self.lignes()
        self.assertEqual(len(lignes), 51)
        self.assertEqual(lignes[-1]["tid"], "T999")


if __name__ == "__main__":
    unittest.main()
