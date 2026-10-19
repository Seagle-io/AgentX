"""Tests de garde_chef : racine de banc sous AGENTX_ROOT (tmp), le vrai run/ n'est jamais touché.

Lancer : python3 -m unittest bin/test_garde_chef.py
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
(ICI.parent / ".cache").mkdir(exist_ok=True)
BANC = Path(tempfile.mkdtemp(prefix="banc-T083-", dir=ICI.parent / ".cache"))
os.environ["AGENTX_ROOT"] = str(BANC)
for var in ("AGENTX_TID", "AGENTX_PROJET", "AGENTX_GARDE_CHEF"):
    os.environ.pop(var, None)
sys.path.insert(0, str(ICI))

import garde_chef  # noqa: E402

TP = BANC / "transcript.jsonl"
SID = "chef-1"


def ligne(total: int, **extra) -> str:
    return json.dumps({"type": "assistant", "message": {"usage": {
        "input_tokens": 1, "cache_read_input_tokens": total - 1, "cache_creation_input_tokens": 0}}, **extra})


def transcript(*lignes: str) -> None:
    TP.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def hook(evt: str, outil: str, sid: str = SID, tp: Path | None = TP, cwd: Path = BANC, **saisie) -> str:
    """'' si silence, sinon texte du deny (Pre) ou de l'additionalContext (Post)."""
    entree = {"session_id": sid, "transcript_path": str(tp), "cwd": str(cwd), "hook_event_name": evt,
              "tool_name": outil, "tool_input": saisie}
    r = subprocess.run([sys.executable, str(ICI / "garde_chef.py")], input=json.dumps(entree),
                       capture_output=True, text=True, env=dict(os.environ), cwd=str(BANC))
    assert r.returncode == 0, r.stderr
    if not r.stdout.strip():
        return ""
    sortie = json.loads(r.stdout)["hookSpecificOutput"]
    assert sortie.get("permissionDecision", "deny") == "deny"
    return sortie.get("permissionDecisionReason") or sortie["additionalContext"]


def pre(cmd: str, **kw) -> str:
    return hook("PreToolUse", "Bash", command=cmd, **kw)


def post(cmd: str, **kw) -> str:
    return hook("PostToolUse", "Bash", command=cmd, **kw)


def setUpModule():
    (BANC / "src").mkdir()
    (BANC / "src" / "app.py").write_text("x = 1\n", encoding="utf-8")
    (BANC / "vault" / "p").mkdir(parents=True)
    (BANC / "vault" / "p" / "note.md").write_text("n\n", encoding="utf-8")
    (BANC / "autre").mkdir()
    (BANC / "autre" / "result.md").write_text("r\n", encoding="utf-8")


def tearDownModule():
    import shutil
    shutil.rmtree(BANC, ignore_errors=True)


class Contexte(unittest.TestCase):
    def test_somme_trois_champs(self):
        transcript(json.dumps({"type": "assistant", "message": {"usage": {
            "input_tokens": 10, "cache_read_input_tokens": 200, "cache_creation_input_tokens": 3000}}}))
        self.assertEqual(garde_chef.contexte(str(TP)), 3210)

    def test_sidechain_ignore(self):
        transcript(ligne(150_000), ligne(999_999, isSidechain=True))
        self.assertEqual(garde_chef.contexte(str(TP)), 150_000)

    def test_derniere_ligne_tronquee(self):
        transcript(ligne(160_000), ligne(170_000)[:40])
        self.assertEqual(garde_chef.contexte(str(TP)), 160_000)

    def test_gros_fichier_queue_seule(self):
        TP.write_text(("x" * 99 + "\n") * 100_000 + ligne(180_000) + "\n", encoding="utf-8")
        self.assertGreater(TP.stat().st_size, 9_000_000)
        self.assertEqual(garde_chef.contexte(str(TP)), 180_000)

    def test_absent_ou_sans_assistant(self):
        self.assertIsNone(garde_chef.contexte(str(BANC / "nul.jsonl")))
        self.assertIsNone(garde_chef.contexte(None))
        transcript(json.dumps({"type": "user"}))
        self.assertIsNone(garde_chef.contexte(str(TP)))

    def test_ligne_malformee_ignoree(self):
        transcript(ligne(160_000), json.dumps({"type": "assistant", "message": "texte"}),
                   json.dumps({"type": "assistant", "message": {"usage": {"input_tokens": "12x"}}}))
        self.assertEqual(garde_chef.contexte(str(TP)), 160_000)

    def test_synthetic_ignore(self):
        transcript(ligne(160_000), json.dumps({"type": "assistant", "message": {
            "model": "<synthetic>", "usage": {"input_tokens": 0}}}))
        self.assertEqual(garde_chef.contexte(str(TP)), 160_000)


class Commande(unittest.TestCase):
    def test_motifs(self):
        c = garde_chef.commande_chef
        self.assertEqual(c("./bin/agentx tache x --projet p"), "tache")
        self.assertEqual(c("python3 bin/vx.py dispatch T1 --projet p"), "dispatch")
        self.assertEqual(c("cd x && ./bin/agentx passation --projet p"), "passation")
        self.assertIsNone(c("./bin/agentx dispatch --etat"))
        self.assertIsNone(c("./bin/agentx board"))
        self.assertIsNone(c("echo agentx tache"))

    def test_etat_partout(self):
        self.assertIsNone(garde_chef.commande_chef("./bin/agentx dispatch --projet p --etat"))

    def test_texte_cite_ignore(self):
        c = garde_chef.commande_chef
        self.assertIsNone(c("echo 'fini; ./bin/agentx dispatch T1'"))
        self.assertIsNone(c('git commit -m "x; agentx tache y"'))

    def test_passation_prioritaire(self):
        c = garde_chef.commande_chef
        self.assertEqual(c("./bin/agentx passation --projet p && ./bin/agentx dispatch T1"), "passation")
        self.assertEqual(c("./bin/agentx dispatch T1 && ./bin/agentx passation --projet p"), "passation")

    def test_lanceurs_indirects(self):
        c = garde_chef.commande_chef
        self.assertEqual(c("bash bin/agentx tache x"), "tache")
        self.assertEqual(c("/usr/bin/python3 bin/vx.py dispatch T1"), "dispatch")
        self.assertEqual(c("env A=1 ./bin/agentx dispatch T1"), "dispatch")


class Refus(unittest.TestCase):
    def setUp(self):
        for d in (garde_chef.ETAT, garde_chef.DIAG):
            for f in d.glob("*") if d.exists() else ():
                f.unlink()

    def test_seuil_refus(self):
        transcript(ligne(199_999))
        self.assertEqual(pre("./bin/agentx tache x --projet p"), "")
        transcript(ligne(200_000))
        raison = pre("./bin/agentx tache x --projet p")
        self.assertIn("200k", raison)
        self.assertLessEqual(len(raison), 200)
        self.assertTrue(pre("./bin/agentx dispatch T1 --projet p"))

    def test_autres_commandes_silence(self):
        transcript(ligne(300_000))
        self.assertEqual(pre("./bin/agentx dispatch --etat"), "")
        self.assertEqual(pre("./bin/agentx board"), "")
        self.assertEqual(pre("./bin/agentx passation --projet p"), "")
        self.assertEqual(hook("PreToolUse", "Read", file_path=str(BANC / "src" / "app.py")), "")

    def test_session_agent_et_transcript_absent_silence(self):
        transcript(ligne(300_000))
        reg = BANC / "run" / "agents"
        reg.mkdir(parents=True, exist_ok=True)
        (reg / "p-T1.json").write_text(json.dumps({"id_session": "agent-9", "nom": "a", "pid": None,
                                                    "role": "implementeur", "tid": "T1", "projet": "p"}))
        self.assertEqual(pre("./bin/agentx tache x", sid="agent-9"), "")
        (reg / "p-T1.json").unlink()
        self.assertEqual(pre("./bin/agentx tache x", tp=BANC / "nul.jsonl"), "")

    def test_sid_invalide_et_coupure(self):
        transcript(ligne(300_000))
        self.assertEqual(pre("./bin/agentx tache x", sid="../x"), "")
        os.environ["AGENTX_GARDE_CHEF"] = "0"
        try:
            self.assertEqual(pre("./bin/agentx tache x"), "")
        finally:
            del os.environ["AGENTX_GARDE_CHEF"]

    def test_rappel_par_palier(self):
        transcript(ligne(149_999))
        self.assertEqual(post("./bin/agentx board"), "")
        transcript(ligne(150_000))
        msg = post("./bin/agentx board")
        self.assertIn("150k", msg)
        self.assertLessEqual(len(msg), 200)
        transcript(ligne(160_000))
        self.assertEqual(post("./bin/agentx board"), "")
        transcript(ligne(175_000))
        self.assertIn("175k", post("./bin/agentx board"))

    def test_passation_deverrouille(self):
        transcript(ligne(210_000))
        garde_chef.marquer_dernier("p", 3)
        post("./bin/agentx passation --projet p")
        self.assertEqual(pre("./bin/agentx dispatch T1 --projet p"), "")
        transcript(ligne(259_999))
        self.assertEqual(pre("./bin/agentx dispatch T1 --projet p"), "")
        transcript(ligne(260_000))
        self.assertTrue(pre("./bin/agentx dispatch T1 --projet p"))

    def test_dernier_perime_sans_marqueur(self):
        transcript(ligne(210_000))
        garde_chef.ecrire_json(garde_chef.DERNIER, {"projet": "p", "ts": time.time() - 301, "lignes": 1})
        post("./bin/agentx passation --projet p")
        self.assertIsNone(json.loads((garde_chef.ETAT / f"{SID}.json").read_text())["passation"])
        self.assertTrue(pre("./bin/agentx tache x --projet p"))


class Course(unittest.TestCase):
    def test_deux_post_marqueur_conserve(self):
        import threading
        Refus.setUp(self)
        transcript(ligne(210_000))
        garde_chef.marquer_dernier("p", 3)
        taches = [threading.Thread(target=post, args=("./bin/agentx passation --projet p",)),
                  threading.Thread(target=hook, args=("PostToolUse", "Read"),
                                   kwargs={"file_path": str(BANC / "src" / "app.py")})]
        for t in taches:
            t.start()
        for t in taches:
            t.join()
        etat = json.loads((garde_chef.ETAT / f"{SID}.json").read_text())
        self.assertIsInstance(etat["passation"], dict)


class Diagnostic(unittest.TestCase):
    def setUp(self):
        Refus.setUp(self)
        transcript(ligne(1_000))

    def test_read_une_fois_par_fichier(self):
        f = str(BANC / "src" / "app.py")
        msg = hook("PostToolUse", "Read", file_path=f)
        self.assertIn("src/app.py", msg)
        self.assertLessEqual(len(msg), 200)
        self.assertEqual(hook("PostToolUse", "Read", file_path=f, offset=900), "")

    def test_exceptions_silence(self):
        self.assertEqual(hook("PostToolUse", "Read", file_path=str(BANC / "vault" / "p" / "note.md")), "")
        self.assertEqual(hook("PostToolUse", "Read", file_path=str(BANC / "autre" / "result.md")), "")
        self.assertEqual(hook("PostToolUse", "Read", file_path=str(BANC / "README.md")), "")
        self.assertEqual(post("rg x vault/"), "")

    def test_bash_sed_et_grep_sans_path(self):
        self.assertIn("src/app.py", post("sed -n 1,9p src/app.py"))
        self.assertEqual(post("sed 's/x/y/' src/app.py", sid="chef-2"), "")
        self.assertIn('(.)', hook("PostToolUse", "Grep", pattern="x"))

    def test_sid_invalide_silence(self):
        self.assertEqual(hook("PostToolUse", "Read", sid="../x", file_path=str(BANC / "src" / "app.py")), "")


if __name__ == "__main__":
    unittest.main()
