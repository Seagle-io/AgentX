"""Tests de garde_chef : racine de banc sous AGENTX_ROOT (tmp), le vrai run/ n'est jamais touché.

Lancer : python3 -m unittest bin/test_garde_chef.py
"""

import contextlib
import datetime
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
(ICI.parent / ".cache").mkdir(exist_ok=True)
BANC = Path(tempfile.mkdtemp(prefix="banc-T083-", dir=ICI.parent / ".cache"))
os.environ["AGENTX_ROOT"] = str(BANC)
for var in ("AGENTX_TID", "AGENTX_PROJET", "AGENTX_GARDE_CHEF", "AGENTX_CHEF"):
    os.environ.pop(var, None)
sys.path.insert(0, str(ICI))

import demandes  # noqa: E402
import environnement  # noqa: E402
import garde_chef  # noqa: E402
import reprise  # noqa: E402
import terminal  # noqa: E402
import vx  # noqa: E402

TP = BANC / "transcript.jsonl"
SID = "chef-1"


def ligne(total: int, **extra) -> str:
    return json.dumps({"type": "assistant", "message": {"usage": {
        "input_tokens": 1, "cache_read_input_tokens": total - 1, "cache_creation_input_tokens": 0}}, **extra})


def transcript(*lignes: str) -> None:
    TP.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def hook(evt: str, outil: str, sid: str = SID, tp: Path | None = TP, cwd: Path = BANC, **saisie) -> str:
    """'' si silence, sinon texte de l'additionalContext (Post)."""
    entree = {"session_id": sid, "transcript_path": str(tp), "cwd": str(cwd), "hook_event_name": evt,
              "tool_name": outil, "tool_input": saisie}
    r = subprocess.run([sys.executable, str(ICI / "garde_chef.py")], input=json.dumps(entree),
                       capture_output=True, text=True, env=dict(os.environ), cwd=str(BANC))
    assert r.returncode == 0, r.stderr
    if not r.stdout.strip():
        return ""
    return json.loads(r.stdout)["hookSpecificOutput"]["additionalContext"]


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


def vider_diag(_=None):
    for f in garde_chef.DIAG.glob("*") if garde_chef.DIAG.exists() else ():
        f.unlink()


class Pre(unittest.TestCase):
    def setUp(self):
        vider_diag()

    def test_pre_tool_use_jamais_refuse(self):
        transcript(ligne(300_000))
        self.assertEqual(hook("PreToolUse", "Bash", command="./bin/agentx tache x --projet p"), "")
        self.assertEqual(hook("PreToolUse", "Bash", command="./bin/agentx dispatch T1 --projet p"), "")

    def test_post_plein_contexte_sans_rappel(self):
        transcript(ligne(300_000))
        self.assertEqual(post("./bin/agentx board"), "")
        self.assertFalse((garde_chef.DIAG / f"{SID}.json").exists())

    def test_session_agent_silence(self):
        reg = BANC / "run" / "agents"
        reg.mkdir(parents=True, exist_ok=True)
        (reg / "p-T1.json").write_text(json.dumps({"id_session": "agent-9", "nom": "a", "pid": None,
                                                    "role": "implementeur", "tid": "T1", "projet": "p"}))
        try:
            self.assertEqual(hook("PostToolUse", "Read", sid="agent-9", file_path=str(BANC / "src" / "app.py")), "")
        finally:
            (reg / "p-T1.json").unlink()

    def test_coupure_diagnostic(self):
        with mock.patch.dict(os.environ, {"AGENTX_GARDE_CHEF": "0"}):
            self.assertEqual(hook("PostToolUse", "Read", file_path=str(BANC / "src" / "app.py")), "")


class Course(unittest.TestCase):
    def test_deux_post_diag_conserve(self):
        import threading
        vider_diag()
        transcript(ligne(1_000))
        taches = [threading.Thread(target=hook, args=("PostToolUse", "Read"),
                                   kwargs={"file_path": str(BANC / "src" / "app.py")}),
                  threading.Thread(target=post, args=("sed -n 1p vault/p/note.md src/app.py",), kwargs={"sid": SID})]
        for t in taches:
            t.start()
        for t in taches:
            t.join()
        self.assertEqual(json.loads((garde_chef.DIAG / f"{SID}.json").read_text())["lus"], ["src/app.py"])


class Diagnostic(unittest.TestCase):
    def setUp(self):
        vider_diag()
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


AUJOURDHUI = datetime.date.today().isoformat()
ORDRE = ["# Reprise chef agentx", "## Étages", "## Consignes actives", "## Vos choix ouverts", "## Maintenant — alpha",
         "## En vol / attentes", "## Décisions sans tâche", "## Demandes", "## Services", "## Plan", "## Notes", "## Sources"]


def tache(proj: Path, tid: str, statut: str, result: str = "", demande: str = "") -> None:
    d = proj / "taches" / f"{tid}-x"
    d.mkdir(parents=True)
    (d / "task.md").write_text(f"---\nid: {tid}\ntitre: t {tid}\nstatut: {statut}\nrole: implementeur\ndeps: []\n"
                               + (f"demande: {demande}\n" if demande else "") + "---\n", encoding="utf-8")
    if result:
        (d / "result.md").write_text(result, encoding="utf-8")


class Reprise(unittest.TestCase):
    """Vault, run/chefs, vagues, attentes et demandes en fixture tempfile ; agents et env simulés."""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory(dir=BANC)
        self.addCleanup(tmp.cleanup)
        self.racine = Path(tmp.name)
        self.vault = self.racine / "vault"
        self.alpha, self.beta = self.vault / "projets" / "alpha", self.vault / "projets" / "beta"
        chefs = self.racine / "chefs"
        chefs.mkdir()
        (chefs / "agentx.json").write_text(json.dumps({"etages": {"alpha": ["alpha"]}, "compte": "marianne"}))
        (chefs / "autre.json").write_text(json.dumps({"etages": {"beta": ["beta"]}, "compte": "defaut"}))
        run = self.racine / "run"
        (run / "vagues").mkdir(parents=True)
        (run / "attentes").mkdir()
        self.vols = []
        self.client = mock.Mock()
        for cible in (mock.patch.object(vx, "VAULT", self.vault),
                      mock.patch.object(terminal, "chemin_chef", lambda cle: str(chefs / f"{cle}.json")),
                      mock.patch.object(terminal, "TerminalClient", self.client),
                      mock.patch.object(demandes, "FICHIER", run / "demandes.jsonl"),
                      mock.patch.object(reprise, "VAGUES", run / "vagues"),
                      mock.patch.object(reprise, "ATTENTES", run / "attentes"),
                      mock.patch("agents.sessions", return_value=[]),
                      mock.patch("agents.lister", side_effect=lambda: self.vols),
                      mock.patch("agents.etat", return_value="working"),
                      mock.patch.object(environnement, "charger", return_value={"svc": object()}),
                      mock.patch.object(environnement, "etat", return_value={
                          "nom": "svc", "etat": "vivant", "url": "http://127.0.0.1:7778", "depuis": "2026-10-20T14:42:00"})):
            cible.start()
            self.addCleanup(cible.stop)
        self.run_ = run
        self.fixture()

    def fixture(self):
        a, b = self.alpha, self.beta
        tache(a, "T001", "a-faire")
        tache(a, "T002", "pret")
        tache(a, "T003", "en-cours")
        tache(a, "T004", "bloque", result="---\nstatut: bloque\n---\n## Écarts\n- contrat ambigu\n")
        tache(a, "T005", "revue", result="---\nstatut: revue\n---\n## Livré\n- x\n## Vérifié comment\nNV — pas de banc\n"
                                       "## Pour la suite\n- supprimer run/x ? (proposé oui)\n")
        tache(a, "T006", "fait")
        tache(a, "T007", "rejete")
        tache(a, "T008", "abandonne")
        tache(b, "T001", "pret", demande="D001")
        (a / "todo.md").write_text("- [ ] ? choisir la couleur\n- [ ] Pack T001 : + retrait Deck\n"
                                   "- [ ] après T005 : relancer la salle\n- [ ] EN VOL T006 vieux\n", encoding="utf-8")
        (b / "todo.md").write_text("- [ ] note de beta\n", encoding="utf-8")
        (a / "decisions.md").write_text(
            f"# Decisions\n\n## {AUJOURDHUI} 10:00 — périmètre\n- consigne: ne pas toucher geolens (jusqu'à: ∅)\n"
            f"- consigne: vieille (jusqu'à: T006)\n\n## {AUJOURDHUI} 11:00 — R7 demandes par étage\n- acceptée\n\n"
            f"## {AUJOURDHUI} 12:00 — lot\n- porté par T002\n", encoding="utf-8")
        self.vols.append({"projet": "alpha", "tid": "T003", "role": "implementeur"})
        (self.run_ / "vagues" / "alpha-20261020-155009.json").write_text(json.dumps({"taches": ["T003"]}))
        (self.run_ / "attentes" / "alpha-20261020-155009.log").write_text("")
        (self.run_ / "demandes.jsonl").write_text("".join(json.dumps(d) + "\n" for d in (
            {"id": "D001", "t": "2026-10-20T15:00:00", "texte": "beta seul", "statut": "ouverte"},
            {"id": "D002", "t": "2026-10-20T15:10:00", "texte": "libre", "statut": "ouverte"},
            {"id": "D003", "t": "2026-10-20T15:49:00", "texte": "annule", "statut": "traitee"})), encoding="utf-8")

    def appeler(self, entree: dict, chef: str | None = "agentx") -> str:
        sortie = io.StringIO()
        env = {"AGENTX_CHEF": chef} if chef else {}
        with mock.patch.dict(os.environ, env), mock.patch("sys.stdin", io.StringIO(json.dumps(entree))), \
                contextlib.redirect_stdout(sortie):
            garde_chef.main()
        return sortie.getvalue()

    def reprise(self, chef: str | None = "agentx", source: str = "compact") -> str:
        r = self.appeler({"hook_event_name": "SessionStart", "source": source, "session_id": "t1"}, chef)
        d = json.loads(r)["hookSpecificOutput"]
        self.assertEqual(d["hookEventName"], "SessionStart")
        return d["additionalContext"]

    def test_e1_precompact_disque_sans_pty(self):
        with mock.patch("subprocess.Popen") as popen:
            self.assertEqual(self.appeler({"hook_event_name": "PreCompact", "session_id": "t1", "trigger": "auto"}), "")
        popen.assert_not_called()
        self.client.assert_not_called()
        self.assertRegex((self.alpha / "plan.md").read_text(encoding="utf-8"), r"# Plan — alpha \(généré .*\n\n- 8 tâches")
        jr = (self.alpha / "journal.md").read_text(encoding="utf-8")
        self.assertEqual(jr.count("passation (PreCompact)"), 1)
        self.assertIn("périmé (retiré de todo.md) :\n- [ ] EN VOL T006 vieux", jr)
        self.assertFalse((self.beta / "journal.md").exists())
        self.assertFalse((self.beta / "plan.md").exists())

    def test_e1_plan_garde_frontmatter(self):
        (self.alpha / "plan.md").write_text("---\ntags: [plan]\n---\n# vieux\n", encoding="utf-8")
        reprise.ecrire_plan(self.alpha)
        texte = (self.alpha / "plan.md").read_text(encoding="utf-8")
        self.assertTrue(texte.startswith("---\ntags: [plan]\n---\n# Plan — alpha"))
        self.assertNotIn("vieux", texte)

    def test_e2_compact_et_clear_seuls(self):
        self.assertLessEqual(len(self.reprise().splitlines()), 60)
        self.assertIn("(clear)", self.reprise(source="clear"))
        for source in ("startup", "resume"):
            self.assertEqual(self.appeler({"hook_event_name": "SessionStart", "source": source, "session_id": "t1"}), "")
        self.assertFalse((self.alpha / "journal.md").exists())

    def test_e3_sections_dans_l_ordre(self):
        bloc = self.reprise()
        titres = [l for l in bloc.splitlines() if l.startswith("#")]
        self.assertEqual([next(o for o in ORDRE if l.startswith(o)) for l in titres], ORDRE)
        for attendu in ("- alpha · compte marianne", "- 10:00 ne pas toucher geolens", "- [ ] ? choisir la couleur",
                        "- Intégrer T005 (result: revue)", "- verdict proposé T005 (", "- question T005 : supprimer run/x ?",
                        "- Pack T001 (+ retrait Deck)", "- Dispatcher T002", "- Répondre/virer T004",
                        "- T003 implementeur working (alpha)", "- attente alpha-20261020-155009 (T003)",
                        "- 11:00 R7 demandes par étage", "- D002 ouverte « libre » 15:10",
                        "- dernier message : D003 15:49 « annule » — traitee", "- svc vivant http://127.0.0.1:7778 depuis 14:42",
                        "- 8 tâches : a-faire 1 · pret 1 · en-cours 1 · bloque 1 · revue 1 · fait 1 · abandonne 1 · rejete 1",
                        "- [ ] après T005 : relancer la salle"):
            self.assertIn(attendu, bloc)
        for absent in ("vieille", "D001", "lot", "EN VOL T006", "beta", "Pack T001 :"):
            self.assertNotIn(absent, bloc)

    def test_e3_debordement(self):
        for i in range(10, 30):
            tache(self.alpha, f"T0{i}", "pret")
        bloc = self.reprise()
        self.assertIn("… +", bloc)
        self.assertRegex(bloc, r"(?m)^… \+\d+ \(board\)$")
        self.assertLessEqual(len(bloc.splitlines()), 60)
        self.assertTrue(bloc.splitlines()[-1].startswith("## Sources"))

    def test_e3_coupe_globale_jamais_silencieuse(self):
        with mock.patch.object(reprise, "MAX_LIGNES", 12):
            lignes = self.reprise().splitlines()
        self.assertEqual(len(lignes), 12)
        self.assertRegex(lignes[-2], r"^… \+\d+ \(board\)$")

    def chefs(self, *dedies: dict) -> mock.Mock:
        """terminal.lister_chefs simulé : défaut + dédiés vivants {"cle", "projets"}."""
        liste = [{"cle": "defaut", "defaut": True, "vivant": True, "etages": [], "projets": {}, "compte": "defaut"}]
        liste += [dict(d, defaut=False, vivant=True, etages=list(d["projets"]), compte="defaut") for d in dedies]
        p = mock.patch.object(terminal, "lister_chefs", return_value=liste)
        self.addCleanup(p.stop)
        return p.start()

    def test_d2_defaut_etages_non_tenus(self):
        gamma = self.vault / "projets" / "gamma"
        tache(gamma, "T001", "pret")
        (gamma / "todo.md").write_text("- [ ] note de gamma\n", encoding="utf-8")
        self.chefs({"cle": "autre", "projets": {"beta": ["beta"]}})
        for chef in (None, "defaut"):
            with self.subTest(chef=chef):
                bloc = self.reprise(chef=chef)
                self.assertIn("## Étages\n- alpha, gamma · compte defaut", bloc)
                for attendu in ("## Maintenant — alpha", "## Maintenant — gamma", "- [ ] note de gamma", "## Plan"):
                    self.assertIn(attendu, bloc)
                for absent in ("beta", "non tenus"):
                    self.assertNotIn(absent, bloc)
        self.assertEqual(self.appeler({"hook_event_name": "PreCompact", "session_id": "t1"}, chef="defaut"), "")
        for proj in (self.alpha, gamma):
            self.assertIn("passation (PreCompact)", (proj / "journal.md").read_text(encoding="utf-8"))
            self.assertTrue((proj / "plan.md").exists())
        self.assertFalse((self.beta / "journal.md").exists())
        self.assertFalse((self.beta / "plan.md").exists())

    def test_d2_defaut_tout_tenu_non_tenus(self):
        self.chefs({"cle": "agentx", "projets": {"alpha": ["alpha"]}}, {"cle": "autre", "projets": {"beta": ["beta"]}})
        bloc = self.reprise(chef="defaut")
        self.assertIn("## Étages : non tenus", bloc)
        for absent in ("## Maintenant", "## Vos choix", "## Notes", "## Plan", "## Consignes", "T00"):
            self.assertNotIn(absent, bloc)

    def test_d1_demande_close_ne_perime_pas_tache_ouverte(self):
        statuts, dem = {"T016": "en-cours", "T006": "fait"}, {"D001": "fermee", "D002": "ouverte"}
        for ligne, attendu in (("- [ ] URGENT finir T016 (suite de D001)", False), ("- [ ] URGENT T006 (D002)", True),
                               ("- [ ] EN VOL T006 T016", False), ("- [ ] reprendre D001", True),
                               ("- [ ] reprendre D001 D002", False), ("- [ ] URGENT relancer la salle", False),
                               ("- [ ] ? URGENT T006", False)):
            with self.subTest(ligne):
                self.assertIs(reprise.perimee(ligne, statuts, dem), attendu)

    def test_d1_repro_todo_garde_la_ligne(self):
        tache(self.alpha, "T016", "en-cours")
        (self.run_ / "demandes.jsonl").write_text(json.dumps(
            {"id": "D001", "t": "2026-10-20T15:00:00", "texte": "x", "statut": "fermee"}) + "\n", encoding="utf-8")
        ligne_ = "- [ ] URGENT finir T016 (suite de D001)"
        (self.alpha / "todo.md").write_text(ligne_ + "\n", encoding="utf-8")
        self.appeler({"hook_event_name": "PreCompact", "session_id": "t1"})
        self.assertIn(ligne_, (self.alpha / "todo.md").read_text(encoding="utf-8").splitlines())
        self.assertNotIn("périmé", (self.alpha / "journal.md").read_text(encoding="utf-8"))
        self.assertIn(f"## Notes\n{ligne_}", self.reprise())

    def test_e5_autre_chef_ses_etages_seuls(self):
        bloc = self.reprise(chef="autre")
        self.assertIn("## Maintenant — beta", bloc)
        self.assertIn("- D001 ouverte", bloc)
        self.assertNotIn("alpha", bloc)

    def test_e6_exception_fail_open(self):
        with mock.patch.object(reprise, "bloc", side_effect=RuntimeError("x")), \
                contextlib.redirect_stderr(io.StringIO()) as err:
            self.assertEqual(self.appeler({"hook_event_name": "SessionStart", "source": "compact", "session_id": "t1"}), "")
        self.assertIn("garde_chef: ignoré (x)", err.getvalue())
        r = subprocess.run([sys.executable, str(ICI / "garde_chef.py")], input="pas du json",
                           capture_output=True, text=True, cwd=str(BANC))
        self.assertEqual((r.returncode, r.stdout), (0, ""))


class ContexteFichier(unittest.TestCase):
    def setUp(self):
        for f in garde_chef.CONTEXTE.glob("*") if garde_chef.CONTEXTE.exists() else ():
            f.unlink()
        transcript(ligne(420_000))

    def test_chef_ecrit_tokens(self):
        with mock.patch.dict(os.environ, {"AGENTX_CHEF": "alice", "AGENTX_GARDE_CHEF": "0"}):
            self.assertEqual(post("true"), "")
        f = json.loads((garde_chef.CONTEXTE / "alice.json").read_text(encoding="utf-8"))
        self.assertEqual(f["tokens"], 420_000)
        datetime.datetime.fromisoformat(f["t"])

    def test_chef_sans_cle_defaut(self):
        post("true")
        self.assertTrue((garde_chef.CONTEXTE / "defaut.json").exists())

    def test_agent_rien(self):
        with mock.patch.dict(os.environ, {"AGENTX_TID": "T1", "AGENTX_PROJET": "p"}):
            post("true")
        self.assertFalse(list(garde_chef.CONTEXTE.glob("*")))


class Cablage(unittest.TestCase):
    def test_e6_settings(self):
        reglages = json.loads((ICI.parent / ".claude" / "settings.json").read_text(encoding="utf-8"))
        h = reglages["hooks"]
        cmd = 'python3 "$CLAUDE_PROJECT_DIR"/bin/garde_chef.py'
        self.assertEqual([x["command"] for g in h["PreCompact"] for x in g["hooks"]], [cmd])
        self.assertEqual([(g["matcher"], [x["command"] for x in g["hooks"]]) for g in h["SessionStart"]],
                         [("compact|clear", [cmd])])
        self.assertNotIn(cmd, [x["command"] for g in h["PreToolUse"] for x in g["hooks"]])
        self.assertNotIn("AGENTX_GARDE_CHEF", reglages.get("env", {}))


if __name__ == "__main__":
    unittest.main()
