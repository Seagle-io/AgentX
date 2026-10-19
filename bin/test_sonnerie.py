"""Tests de sonnerie.ecrire_evenement : anti-doublon et rotation.

Lancer : python3 -m unittest bin/test_sonnerie.py
Écrit dans .cache/banc-T083/ev.jsonl, jamais dans run/.
"""

import io
import json
import os
import sys
import types
import unittest
from pathlib import Path
from unittest import mock

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


RESULT = "---\ntache: T128\nprojet: banc\nstatut: revue\n---\n## Livré\n- x\n"


class TestEcrireResult(unittest.TestCase):
    """main() : result.md absent + texte final a frontmatter ⇒ ecrit ; present ⇒ intact."""

    def setUp(self):
        self.racine = Path(ICI).parent / ".cache" / "banc-T128"
        self.dossier = self.racine / "vault" / "projets" / "banc" / "taches" / "T128-banc"
        self.dossier.mkdir(parents=True, exist_ok=True)
        (self.dossier / "result.md").unlink(missing_ok=True)
        import agents
        self.patchs = [mock.patch.object(sonnerie, "ROOT", self.racine),
                       mock.patch.object(agents, "ROOT", self.racine),
                       mock.patch.object(sonnerie, "EVENEMENTS", self.racine / "ev.jsonl"),
                       mock.patch.object(sonnerie, "est_role_agentx", lambda nom: True)]
        for p in self.patchs:
            p.start()
        sonnerie.EVENEMENTS.unlink(missing_ok=True)
        sys.modules["voix"] = types.SimpleNamespace(annoncer=lambda e: None)

    def tearDown(self):
        for p in self.patchs:
            p.stop()
        sys.modules.pop("voix", None)

    def rendre(self, texte: str) -> dict:
        entree = json.dumps({"agent_type": "implementeur", "last_assistant_message": texte})
        with mock.patch.object(sys, "stdin", io.StringIO(entree)):
            sonnerie.main()
        return json.loads(sonnerie.EVENEMENTS.read_text(encoding="utf-8").splitlines()[-1])

    def test_result_ecrit_depuis_le_texte(self):
        long = RESULT + "- y\n" * 400                       # > 1000 car. : texte entier, pas la tete
        ev = self.rendre("```markdown\n" + long + "```")
        self.assertEqual((self.dossier / "result.md").read_text(encoding="utf-8"), long)
        self.assertEqual((ev["quoi"], ev["tid"], ev["projet"], ev["ecrit"]), ("agent-fini", "T128", "banc", True))

    def test_result_present_non_reecrit(self):
        (self.dossier / "result.md").write_text("rendu par Write\n", encoding="utf-8")
        ev = self.rendre(RESULT)
        self.assertEqual((self.dossier / "result.md").read_text(encoding="utf-8"), "rendu par Write\n")
        self.assertNotIn("ecrit", ev)

    def test_prose_rien(self):
        self.rendre("Fait.\ntache: T128\nprojet: banc\nstatut: revue\n")
        self.assertFalse((self.dossier / "result.md").exists())


class TestSeuleEnCours(unittest.TestCase):
    def tache(self, texte: str) -> tuple[str, str]:
        d = BANC.parent / "vault" / "projets" / "banc" / "taches" / "T777-x"
        d.mkdir(parents=True, exist_ok=True)
        (d / "task.md").write_text(texte, encoding="utf-8")
        with mock.patch.object(sonnerie, "ROOT", BANC.parent):
            return sonnerie.seule_en_cours("implementeur")

    def test_corps_ne_compte_pas(self):
        self.assertEqual(self.tache("---\nrole: implementeur\nstatut: fait\n---\nstatut: en-cours\n"), ("", ""))

    def test_en_cours_de_tete(self):
        self.assertEqual(self.tache("---\nrole: implementeur\nstatut: en-cours\n---\n"), ("T777", "banc"))

    def test_sans_frontmatter(self):
        self.assertEqual(self.tache("role: implementeur\nstatut: en-cours\n"), ("", ""))


if __name__ == "__main__":
    unittest.main()
