"""Tests de parle_hook : agent détaché muet, chef inchangé. Aucun `say` réel (send remplacé).

Lancer : python3 -m unittest bin/test_parle_hook.py
"""

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

TMP = Path(tempfile.mkdtemp(prefix="agentx-hook-"))
os.environ.update(AGENTX_VOIX_DIR=str(TMP), AGENTX_ROOT=str(TMP))
os.environ.pop("AGENTX_TID", None)
sys.path.insert(0, str(Path(__file__).resolve().parent))
import agents       # noqa: E402
import parle_hook   # noqa: E402

agents.REG = TMP / "run" / "agents"   # agents peut avoir été importé avant, avec une autre racine


def fiche(tid, sid):
    return {"id_session": sid, "nom": f"agentx-x-{tid}", "pid": None, "role": "implementeur",
            "tid": tid, "projet": "x", "lance": "2026-10-16T00:00:00", "modele": None,
            "mode": "acceptEdits", "mort_signale": False}


def transcript(nom, premier, reponse="Fait. <voix>C'est fait.</voix>"):
    p = TMP / nom
    lignes = [{"type": "user", "message": {"content": premier}},
              {"type": "assistant", "message": {"content": [{"type": "text", "text": reponse}]}}]
    p.write_text("\n".join(json.dumps(x) for x in lignes), encoding="utf-8")
    return str(p)


class ParleHook(unittest.TestCase):
    def setUp(self):
        agents.ecrire(fiche("T001", "aaaa1111"))
        agents.ecrire(fiche("T002", "bbbb2222"))
        Path(parle_hook.FLAG).touch()
        Path(parle_hook.JOURNAL).unlink(missing_ok=True)
        os.environ.pop("AGENTX_TID", None)
        self.envois = []
        parle_hook.send = self.envois.append

    def lancer(self, mode, data):
        sys.argv = ["parle_hook.py", mode]
        sys.stdin = io.StringIO(json.dumps(data) if data is not None else "")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            parle_hook.main()
        return out.getvalue()

    def lignes_journal(self):
        p = Path(parle_hook.JOURNAL)
        return p.read_text().splitlines() if p.exists() else []

    def test_chef_stop_dit_et_journalise(self):
        self.lancer("stop", {"session_id": "chef0000", "transcript_path": transcript("c.jsonl", "Bonjour")})
        self.assertEqual(self.envois, [{"cmd": "say", "text": "C'est fait."}])
        self.assertEqual(len(self.lignes_journal()), 1)

    def test_chef_prompt_consigne_et_stop(self):
        sortie = self.lancer("prompt", {"session_id": "chef0000", "prompt": "salut",
                                        "transcript_path": transcript("c.jsonl", "Bonjour")})
        self.assertIn("Mode vocal actif", sortie)
        self.assertEqual(self.envois, [{"cmd": "stop"}])

    def test_agent_par_fiche_stop_muet(self):
        self.lancer("stop", {"session_id": "aaaa1111", "transcript_path": transcript("a.jsonl", "Bonjour")})
        self.assertEqual(self.envois, [])
        self.assertEqual(self.lignes_journal(), [])

    def test_agent_par_fiche_prompt_muet(self):
        sortie = self.lancer("prompt", {"session_id": "bbbb2222-ffff", "prompt": "x"})
        self.assertEqual((sortie, self.envois), ("", []))

    def test_agent_par_transcript_sans_fiche(self):
        t = transcript("t.jsonl", "T042 · projet x\npack: ...")
        self.assertEqual(self.lancer("prompt", {"session_id": "zzzz", "transcript_path": t}), "")
        self.lancer("stop", {"session_id": "zzzz", "transcript_path": t})
        self.assertEqual((self.envois, self.lignes_journal()), ([], []))

    def test_agent_par_env(self):
        os.environ["AGENTX_TID"] = "T042"
        self.lancer("stop", {"session_id": "chef0000", "transcript_path": transcript("c.jsonl", "Bonjour")})
        self.assertEqual((self.envois, self.lignes_journal()), ([], []))

    def test_defaut_chef_stdin_vide_ou_transcript_absent(self):
        self.assertFalse(parle_hook.est_agent({}))
        self.assertFalse(parle_hook.est_agent({"session_id": "chef0000", "transcript_path": "/nulle/part"}))
        self.assertEqual(self.lancer("prompt", None).count("Mode vocal actif"), 1)

    def test_premier_user_en_blocs(self):
        p = TMP / "b.jsonl"
        p.write_text(json.dumps({"type": "user", "message": {"content": [{"type": "text", "text": "T007 · projet y"}]}}))
        self.assertTrue(parle_hook.est_agent({"session_id": "q", "transcript_path": str(p)}))


if __name__ == "__main__":
    unittest.main()
