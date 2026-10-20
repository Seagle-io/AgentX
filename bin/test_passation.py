"""Tests de `vx passation` : vault et run/demandes.jsonl temporaires, vx.VAULT patche, agents simules.

Lancer : python3 -m unittest bin/test_passation.py
"""

import argparse
import contextlib
import io
import json
import sys
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import demandes  # noqa: E402
import vx  # noqa: E402


def tache(proj: Path, tid: str, statut: str, result: bool = False, role: str = "implementeur", deps: str = "[]"):
    d = proj / "taches" / f"{tid}-x"
    d.mkdir(parents=True)
    (d / "task.md").write_text(
        f"---\nid: {tid}\nstatut: {statut}\nrole: {role}\ndeps: {deps}\n---\n", encoding="utf-8")
    if result:
        (d / "result.md").write_text("---\nstatut: revue\n---\n", encoding="utf-8")


class Passation(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.proj = Path(self.tmp.name) / "projets" / "p"
        self.proj.mkdir(parents=True)
        self.vols = []
        self.demandes = Path(self.tmp.name) / "demandes.jsonl"
        for cible in (mock.patch.object(vx, "VAULT", Path(self.tmp.name)),
                      mock.patch.object(demandes, "FICHIER", self.demandes),
                      mock.patch("agents.sessions", return_value=[]),
                      mock.patch("agents.lister", side_effect=lambda: self.vols),
                      mock.patch("agents.etat", return_value="working"),
                      mock.patch.dict(os.environ, {"AGENTX_VOIX_DIR": self.tmp.name})):
            cible.start()
            self.addCleanup(cible.stop)

    def lancer(self, note=None) -> str:
        sortie = io.StringIO()
        with contextlib.redirect_stdout(sortie):
            vx.cmd_passation(argparse.Namespace(projet="p", note=note))
        return sortie.getvalue()

    def todo(self) -> str:
        return (self.proj / "todo.md").read_text(encoding="utf-8")

    def test_lignes_deduites(self):
        tache(self.proj, "T001", "revue", result=True)
        tache(self.proj, "T002", "pret")
        tache(self.proj, "T003", "bloque", result=True)
        self.vols.append({"projet": "p", "tid": "T004"})
        out = self.lancer()
        for ligne in ("- [ ] Intégrer T001 (revue)", "- [ ] Dispatcher T002",
                      "- [ ] Répondre/virer T003", "- [ ] En vol : T004"):
            self.assertIn(ligne, out)
            self.assertIn(ligne, self.todo())

    def test_demande_ouverte_ligne(self):
        run = Path(self.tmp.name) / "run"
        run.mkdir()
        (run / "demandes.jsonl").write_text(
            json.dumps({"id": "D001", "t": "x", "texte": "fais ça " + "z" * 100, "statut": "ouverte"}) + "\n"
            + json.dumps({"id": "D002", "t": "x", "texte": "fermée", "statut": "fermee"}) + "\n", encoding="utf-8")
        with mock.patch.object(demandes, "FICHIER", run / "demandes.jsonl"):
            self.lancer()
            self.assertRegex(self.todo(), r"(?m)^- \[ \] demande D001 ouverte — « fais ça z+… » — lier ou fermer$")
            self.assertNotIn("D002", self.todo())
            self.lancer()
            self.assertEqual(self.todo().count("demande D001"), 1)

    def test_contrat_sans_lot(self):
        tache(self.proj, "T001", "fait", role="architecte")
        ligne = "- [ ] contrat T001 sans lot — créer le lot ou renoncer"
        self.assertIn(ligne, self.lancer())
        self.assertEqual(self.todo().count(ligne), 1)
        tache(self.proj, "T002", "pret", deps="[T001]")
        self.lancer()
        self.assertNotIn("contrat T001", self.todo())

    def test_append_sans_doublon(self):
        tache(self.proj, "T001", "pret")
        self.lancer()
        avant = self.todo()
        self.assertIn("1 ligne(s) de bloc remplacée(s)", self.lancer())
        self.assertEqual(self.todo(), avant)

    def test_blocs_remplaces(self):
        tache(self.proj, "T001", "pret")
        (self.proj / "todo.md").write_text(
            "- [ ] En vol : T1, T2\n- [ ] Intégrer T009 (en-cours)\n- [ ] En vol : T1\n", encoding="utf-8")
        out = self.lancer()
        self.assertEqual(self.todo(), "- [ ] Dispatcher T001\n")
        self.assertIn("3 ligne(s) de bloc remplacée(s), 0 URGENT en tête", out)

    def test_urgent_en_tete(self):
        tache(self.proj, "T001", "pret")
        (self.proj / "todo.md").write_text(
            "- [x] fait\n- [ ] URGENT a\n- [ ] ? q\n- [ ] URGENT b\n- [ ] Pack T005\n", encoding="utf-8")
        out = self.lancer()
        self.assertEqual(self.todo(), "- [ ] URGENT a\n- [ ] URGENT b\n- [x] fait\n- [ ] ? q\n- [ ] Dispatcher T001\n")
        self.assertIn("1 ligne(s) de bloc remplacée(s), 2 URGENT en tête", out)

    def test_todo_absent_cree(self):
        tache(self.proj, "T001", "pret")
        self.lancer()
        self.assertEqual(self.todo(), "- [ ] Dispatcher T001\n")

    def test_journal_une_entree_horodatee(self):
        tache(self.proj, "T001", "pret")
        self.lancer()
        jr = (self.proj / "journal.md").read_text(encoding="utf-8")
        self.assertRegex(jr, r"## \d{4}-\d{2}-\d{2} \d{2}:\d{2} — passation \(vx passation\)")
        self.assertEqual(jr.count("passation (vx passation)"), 1)
        self.assertIn("- [ ] Dispatcher T001", jr)

    def test_note(self):
        self.lancer(note="reprendre par T001")
        self.assertIn("reprendre par T001", (self.proj / "journal.md").read_text(encoding="utf-8"))

    def test_vault_sans_tache(self):
        self.assertIn("∅ rien à passer", self.lancer())
        self.assertFalse((self.proj / "todo.md").exists())
        self.assertIn("passation (vx passation)", (self.proj / "journal.md").read_text(encoding="utf-8"))

    def test_perimees_vers_journal(self):
        tache(self.proj, "T013", "fait")
        tache(self.proj, "T008", "rejete")
        tache(self.proj, "T014", "fait")
        self.demandes.write_text(json.dumps({"id": "D010", "t": "x", "texte": "y", "statut": "traitee"}) + "\n",
                                 encoding="utf-8")
        perimees = ["- [ ] EN VOL T013 syndicat", "- [ ] URGENT au rendu de T008 : retirer Deck",
                    "- [ ] demande D010 ouverte (ancienne)"]
        (self.proj / "todo.md").write_text("\n".join(perimees + ["- [ ] ? question", "- [ ] après T014 : R3"]) + "\n",
                                           encoding="utf-8")
        self.lancer()
        self.assertEqual(self.todo(), "- [ ] ? question\n- [ ] après T014 : R3\n")
        jr = (self.proj / "journal.md").read_text(encoding="utf-8")
        self.assertIn("périmé (retiré de todo.md) :\n" + "\n".join(perimees), jr)

    def test_urgent_tache_ouverte_garde(self):
        tache(self.proj, "T008", "en-cours")
        (self.proj / "todo.md").write_text("- [ ] URGENT au rendu de T008 : x\n- [ ] demande D404 inconnue\n", encoding="utf-8")
        self.lancer()
        self.assertEqual(self.todo(), "- [ ] URGENT au rendu de T008 : x\n- [ ] demande D404 inconnue\n")
        self.assertNotIn("périmé", (self.proj / "journal.md").read_text(encoding="utf-8"))

    def test_aucune_injection_pty(self):
        tache(self.proj, "T001", "pret")
        with mock.patch("subprocess.Popen") as popen, mock.patch("terminal.TerminalClient") as client:
            out = self.lancer()
        popen.assert_not_called()
        client.assert_not_called()
        self.assertNotIn("/clear", out)

    def test_blocs_seuls_zero_fraiche_reecrits(self):
        (self.proj / "todo.md").write_text("- [ ] En vol : T1\n- [ ] Pack T005\n", encoding="utf-8")
        out = self.lancer()
        self.assertEqual(self.todo(), "")
        self.assertIn("∅ rien à passer", out)
        self.assertIn("2 ligne(s) de bloc remplacée(s)", out)

    def test_todo_absent_zero_fraiche_reste_absent(self):
        self.lancer()
        self.assertFalse((self.proj / "todo.md").exists())

    def test_voix_passation_auto_drapeau(self):
        import voix
        self.assertTrue(voix.passation_auto(True)["passation_auto"])
        self.assertFalse(voix.passation_auto(False)["passation_auto"])


if __name__ == "__main__":
    unittest.main()
