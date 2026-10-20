"""Tests de demandes.py : 1 ligne par prompt humain du chef, rien pour agent/relais/commande.

Lancer : AGENTX_SANS_INJECTION=1 AGENTX_SANS_ATTENTE=1 python3 bin/test_demandes.py
"""

import atexit
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import demandes  # noqa: E402

TMP = Path(tempfile.mkdtemp(prefix="agentx-demandes-"))
atexit.register(shutil.rmtree, TMP, ignore_errors=True)
SCRIPT = Path(__file__).resolve().parent / "demandes.py"
RUN = TMP / "run"


def lancer(prompt, run=RUN, **env):
    e = {k: v for k, v in os.environ.items() if k != "AGENTX_TID"}
    e.update(AGENTX_RUN_DIR=str(run), **env)
    return subprocess.run([sys.executable, str(SCRIPT)], input=json.dumps({"prompt": prompt, "session_id": "s1"}),
                          capture_output=True, text=True, env=e)


def lignes():
    p = RUN / "demandes.jsonl"
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines()] if p.exists() else []


class Demandes(unittest.TestCase):
    def setUp(self):
        shutil.rmtree(RUN, ignore_errors=True)

    def test_ecrit_demande(self):
        r = lancer("fais ceci\navec accents é")
        self.assertEqual((r.returncode, r.stdout), (0, ""))
        (l,) = lignes()
        self.assertEqual((l["id"], l["texte"], l["statut"], l["session"]), ("D001", "fais ceci\navec accents é", "ouverte", "s1"))
        self.assertRegex(l["t"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$")

    def test_id_incremente(self):
        lancer("un")
        lancer("deux")
        self.assertEqual([l["id"] for l in lignes()], ["D001", "D002"])

    def test_ignore_agent_tid(self):
        lancer("un", AGENTX_TID="T001")
        self.assertEqual(lignes(), [])

    def test_ignore_relais(self):
        lancer("<task-notification>fini</task-notification>")
        lancer("[SYSTEM NOTIFICATION] x")
        self.assertEqual(lignes(), [])

    def test_ignore_commande_slash(self):
        for p in ("/board", "!ls", "", "   "):
            lancer(p)
        self.assertEqual(lignes(), [])

    def test_exception_exit_0(self):
        fichier = TMP / "pas-un-dossier"
        fichier.write_text("x")
        r = lancer("un", run=fichier)
        self.assertEqual((r.returncode, r.stdout, r.stderr), (0, "", ""))

    def test_lire_absent_vide(self):
        with mock.patch.object(demandes, "FICHIER", TMP / "nulle" / "demandes.jsonl"):
            self.assertEqual(demandes.lire(), [])

    def test_lire_ignore_ligne_invalide(self):
        f = TMP / "lire.jsonl"
        f.write_text('{"id": "D001"}\n{pas du json\n{"id": "D002"}\n', encoding="utf-8")
        with mock.patch.object(demandes, "FICHIER", f):
            self.assertEqual([l["id"] for l in demandes.lire()], ["D001", "D002"])

    def test_ecrire_remplace(self):
        with mock.patch.object(demandes, "RUN_DIR", TMP / "e"), mock.patch.object(demandes, "FICHIER", TMP / "e" / "d.jsonl"):
            demandes.ecrire([{"id": "D001", "texte": "é"}])
            demandes.ecrire([{"id": "D002"}])
            self.assertEqual(demandes.lire(), [{"id": "D002"}])
            self.assertFalse((TMP / "e" / "d.tmp").exists())

    def _traitees(self, session_id, **env):
        e = {k: v for k, v in os.environ.items() if k != "AGENTX_TID"}
        e.update(AGENTX_RUN_DIR=str(RUN), **env)
        return subprocess.run([sys.executable, str(SCRIPT), "--traitees"], input=json.dumps({"session_id": session_id}),
                              capture_output=True, text=True, env=e)

    def _deux_sessions(self):
        RUN.mkdir(parents=True, exist_ok=True)
        (RUN / "demandes.jsonl").write_text("".join(
            json.dumps({"id": f"D00{i}", "t": "2026-10-20T11:00:00", "texte": s, "statut": "ouverte", "session": s}) + "\n"
            for i, s in ((1, "a"), (2, "b"))), encoding="utf-8")

    def test_traitees_ferme_session_courante(self):
        self._deux_sessions()
        r = self._traitees("a")
        self.assertEqual((r.returncode, r.stdout), (0, ""))
        a, b = lignes()
        self.assertEqual((a["statut"], b["statut"]), ("traitee", "ouverte"))
        self.assertRegex(a["traitee_t"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$")
        self.assertNotIn("traitee_t", b)

    def test_traitees_session_vide_ferme_tout(self):
        self._deux_sessions()
        self._traitees("")
        self.assertEqual([l["statut"] for l in lignes()], ["traitee", "traitee"])

    def test_traitees_ignore_agent_tid(self):
        self._deux_sessions()
        self._traitees("a", AGENTX_TID="T1")
        self.assertEqual([l["statut"] for l in lignes()], ["ouverte", "ouverte"])


if __name__ == "__main__":
    unittest.main()
