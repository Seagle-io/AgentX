"""Tests de `vx passation` : vault temporaire, vx.VAULT patche, garde_chef et agents simules.

Lancer : python3 -m unittest bin/test_passation.py
"""

import argparse
import contextlib
import io
import sys
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import garde_chef  # noqa: E402
import vx  # noqa: E402


def tache(proj: Path, tid: str, statut: str, result: bool = False):
    d = proj / "taches" / f"{tid}-x"
    d.mkdir(parents=True)
    (d / "task.md").write_text(f"---\nid: {tid}\nstatut: {statut}\n---\n", encoding="utf-8")
    if result:
        (d / "result.md").write_text("---\nstatut: revue\n---\n", encoding="utf-8")


class Passation(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.proj = Path(self.tmp.name) / "projets" / "p"
        self.proj.mkdir(parents=True)
        self.vols = []
        for cible in (mock.patch.object(vx, "VAULT", Path(self.tmp.name)),
                      mock.patch("agents.sessions", return_value=[]),
                      mock.patch("agents.lister", side_effect=lambda: self.vols),
                      mock.patch("agents.etat", return_value="working"),
                      mock.patch("garde_chef.marquer_dernier"),
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

    def test_append_sans_doublon(self):
        tache(self.proj, "T001", "pret")
        self.lancer()
        avant = self.todo()
        self.assertIn("∅ rien à passer", self.lancer())
        self.assertEqual(self.todo(), avant)

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

    def test_marquer_dernier_appele(self):
        tache(self.proj, "T001", "pret")
        tache(self.proj, "T002", "bloque")
        self.lancer()
        garde_chef.marquer_dernier.assert_called_once_with("p", 2)

    def test_vault_sans_tache(self):
        self.assertIn("∅ rien à passer", self.lancer())
        self.assertFalse((self.proj / "todo.md").exists())
        self.assertIn("passation (vx passation)", (self.proj / "journal.md").read_text(encoding="utf-8"))
        garde_chef.marquer_dernier.assert_called_once_with("p", 0)

    def injecter(self, auto: bool, vivant: bool):
        client = mock.Mock()
        client.TerminalClient.return_value.vivant.return_value = vivant
        with mock.patch.object(vx.voix, "etat", return_value={"passation_auto": auto}), \
                mock.patch.object(vx, "terminal", client), \
                mock.patch("subprocess.Popen") as popen:
            return self.lancer(), popen

    def test_drapeau_off_aucun_popen(self):
        sortie, popen = self.injecter(False, True)
        popen.assert_not_called()
        self.assertIn("passation auto off", sortie)

    def test_drapeau_on_chef_mort_aucun_popen(self):
        sortie, popen = self.injecter(True, False)
        popen.assert_not_called()
        self.assertIn("chef hors salle", sortie)

    def test_drapeau_on_chef_vivant_un_popen(self):
        sortie, popen = self.injecter(True, True)
        popen.assert_called_once()
        cmd, kw = popen.call_args
        self.assertTrue(kw["start_new_session"])
        self.assertIn("/clear", cmd[0][2])
        self.assertIn("/board", cmd[0][2])
        self.assertIn("passation auto : /clear puis /board envoyés au chef", sortie)

    def test_voix_passation_auto_drapeau(self):
        import voix
        self.assertTrue(voix.passation_auto(True)["passation_auto"])
        self.assertFalse(voix.passation_auto(False)["passation_auto"])


if __name__ == "__main__":
    unittest.main()
