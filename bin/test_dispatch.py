"""Tests de dispatch / agents : faux `claude`, vault de banc sous .cache/banc-T081 (AGENTX_ROOT).

Lancer : python3 -m unittest bin/test_dispatch.py
Le vrai vault et le vrai run/ ne sont jamais touches : AGENTX_ROOT pointe sur le banc,
AGENTX_CLAUDE sur un script qui journalise son argv et imprime un id de session.
"""

import contextlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from datetime import datetime, timedelta
from unittest import mock
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = DEPOT / ".cache" / "banc-T081" / f"b{os.getpid()}"
JOURNAL = BANC / "claude.argv.jsonl"
FAUX = BANC / "claude"
EXT = Path(tempfile.mkdtemp(prefix="agentx-ext-"))   # depots externes : hors ROOT et hors du .git d'AgentX

os.environ.update(AGENTX_ROOT=str(BANC), AGENTX_CLAUDE=str(FAUX), BANC_JOURNAL=str(JOURNAL), AGENTX_SANS_ATTENTE="1")
sys.path.insert(0, str(ICI))
import agents      # noqa: E402  (ROOT lu de l'env au-dessus)
import dispatch    # noqa: E402
import terminal    # noqa: E402

FAUX_SRC = '''#!/usr/bin/env python3
import json, os, sys
with open(os.environ["BANC_JOURNAL"], "a") as f:
    f.write(json.dumps(sys.argv[1:]) + "\\n")
if sys.argv[1:2] == ["agents"]:
    print(os.environ.get("BANC_SESSIONS", "[]"))
elif sys.argv[1:2] == ["respawn"]:
    sys.exit(int(os.environ.get("BANC_RESPAWN_RC", "0")))
else:
    print("Started background session 7c5dcf5d")
'''

PACK = """---
pack: {tid}
---
# Pack {tid}
## Mission
banc
## Definition of Done
- [ ] banc
## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/agents.py` | L | banc |
{wl}
## Contrats
```
contrat banc
```
## Décisions actées
∅
## Hors périmètre
∅
## Environnement
∅
## Budget
∅
## Format de sortie
result.md
"""


def setUpModule():
    (BANC / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "frontmatter.py", "terminal.py", "voix.py", "demandes.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(DEPOT / "roles.json", BANC / "roles.json")
    FAUX.write_text(FAUX_SRC, encoding="utf-8")
    FAUX.chmod(0o755)


def tearDownModule():
    shutil.rmtree(BANC)
    shutil.rmtree(EXT)


def tache(tid: str, role: str = "implementeur", statut: str = "pret", wl: str = "", slug: str = "banc",
          extra: str = "") -> Path:
    d = BANC / "vault" / "projets" / slug / "taches" / f"{tid}-banc"
    d.mkdir(parents=True, exist_ok=True)
    (d / "task.md").write_text(f"---\nid: {tid}\ntitre: banc {tid}\nrole: {role}\nstatut: {statut}\n"
                               f"parent: T000\n{extra}---\n", encoding="utf-8")
    (d / "context.md").write_text(PACK.format(tid=tid, wl=wl), encoding="utf-8")
    return d


def statut_de(tid: str) -> str:
    return agents.statut_tache("banc", tid)


def run(*args: str, sessions: list | None = None) -> subprocess.CompletedProcess:
    env = dict(os.environ, BANC_SESSIONS=json.dumps(sessions or []))
    return subprocess.run([sys.executable, str(ICI / "dispatch.py"), *args],
                          capture_output=True, text=True, env=env, cwd=str(DEPOT))


def hook(entree: dict) -> str:
    r = subprocess.run([sys.executable, str(ICI / "garde_dispatch.py")], input=json.dumps(entree),
                       capture_output=True, text=True, check=True)
    if not r.stdout.strip():
        return "allow"
    return json.loads(r.stdout)["hookSpecificOutput"]["permissionDecisionReason"]


def journal_bg() -> list[list[str]]:
    lignes = [json.loads(l) for l in JOURNAL.read_text(encoding="utf-8").splitlines()] if JOURNAL.exists() else []
    return [a for a in lignes if "--bg" in a]                        # --add-dir peut précéder --bg


def fiche(tid: str, id_session: str | None, lance: str = "2026-10-16T10:00:00") -> agents.Fiche:
    f = {"id_session": id_session, "nom": f"agentx-banc-{tid}", "pid": None, "role": "implementeur",
         "tid": tid, "projet": "banc", "lance": lance, "modele": None, "mode": "dontAsk", "mort_signale": False}
    agents.ecrire(f)
    return f


class TestDispatch(unittest.TestCase):
    def setUp(self):
        JOURNAL.unlink(missing_ok=True)

    def test_argv_verbatim(self):
        d = tache("T001")
        r = run("T001", "--projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(r.stdout, "T001 OK 7c5dcf5d implementeur dontAsk\n")
        fm = (DEPOT / ".claude" / "agents" / "implementeur.md").read_text(encoding="utf-8")
        tools = [t.strip() for t in re.search(r"^tools:\s*(.*)$", fm, re.M).group(1).split(",")]
        nom = journal_bg()[0][journal_bg()[0].index("--name") + 1]
        self.assertRegex(nom, r"^agentx-banc-T001-\d{8}-\d{6}$")
        attendu = ["--bg", "--agent", "implementeur", "--name", nom,
                   "--permission-mode", "dontAsk",
                   "--settings", json.dumps({"permissions": {"allow": tools}, "worktree": {"bgIsolation": "none"}}),
                   "T001 · projet banc\n"
                   f"pack: vault/projets/banc/taches/{d.name}/context.md\n"
                   "→ lire en entier · exécuter · result.md même dossier, sections « Format de sortie », dense\n"
                   "rien d'autre du vault"]
        self.assertEqual(journal_bg(), [attendu])
        self.assertEqual(statut_de("T001"), "en-cours")
        f = agents.lire("banc", "T001")
        self.assertEqual((f["id_session"], f["mode"], f["modele"], f["mort_signale"]),
                         ("7c5dcf5d", "dontAsk", None, False))

    def test_mode_auto_si_wl_e_claude(self):
        tache("T002", wl="| `.claude/x` | E | banc |")
        r = run("T002", "--projet", "banc")
        self.assertEqual(r.stdout, "T002 OK 7c5dcf5d implementeur auto\n")
        self.assertIn("auto", journal_bg()[0][journal_bg()[0].index("--permission-mode") + 1])
        tache("T012", wl="| `.claude/y` | L | banc |")
        self.assertEqual(run("T012", "--projet", "banc").stdout, "T012 OK 7c5dcf5d implementeur dontAsk\n")

    def test_modele_effort_de_la_tache(self):
        tache("T098", extra="modele: opus\neffort: high\n")
        run("T098", "--projet", "banc")
        argv = journal_bg()[0]
        self.assertEqual(argv[argv.index("--model") + 1], "opus")
        self.assertEqual(argv[argv.index("--effort") + 1], "high")
        self.assertEqual((agents.lire("banc", "T098")["modele"], agents.lire("banc", "T098")["effort"]), ("opus", "high"))
        tache("T099", extra="modele: inherit\n")
        run("T099", "--projet", "banc")
        self.assertNotIn("--effort", journal_bg()[-1])             # effort absent : rien d'impose
        ev = [json.loads(l) for l in (BANC / "run" / "evenements.jsonl").read_text().splitlines()]
        self.assertIn(("dispatch", "T098", "en-cours"), [(e["quoi"], e["tid"], e["statut"]) for e in ev])

    def test_modele(self):
        tache("T013")
        run("T013", "--projet", "banc", "--modele", "opus")
        self.assertEqual(journal_bg()[0][-3:-1], ["--model", "opus"])
        self.assertEqual(agents.lire("banc", "T013")["modele"], "opus")

    def test_add_dir_depot_externe(self):
        (EXT / "repo" / ".git").mkdir(parents=True, exist_ok=True)
        (EXT / "autre").mkdir(parents=True, exist_ok=True)
        tache("T017", wl=f"| `{EXT}/repo/src/a.ts` | E | banc |\n"
                         f"| `{EXT}/repo/lib/b.ts` | L | banc |\n"
                         f"| `{EXT}/autre/c.md` | L | banc |")
        r = run("T017", "--projet", "banc")
        self.assertEqual(r.stdout, "T017 OK 7c5dcf5d implementeur dontAsk\n")
        argv = journal_bg()[0]
        self.assertEqual(argv.count("--add-dir"), 2)
        self.assertEqual(argv[0:4], ["--add-dir", f"{EXT}/autre", "--add-dir", f"{EXT}/repo"])
        self.assertEqual(argv[4], "--bg")                            # variadique en tête, avant --bg
        self.assertTrue(argv[-1].startswith("T017 · projet banc"))   # prompt dernier positionnel
        self.assertNotIn(argv[-2], (f"{EXT}/autre", f"{EXT}/repo"))  # jamais un répertoire juste avant

    def test_add_dir_absent_si_wl_interne(self):
        tache("T018", wl="| `bin/vx.py` | L | banc |")
        run("T018", "--projet", "banc")
        self.assertNotIn("--add-dir", journal_bg()[0])

    def test_refus_2_tache_fait(self):
        tache("T003", statut="fait")
        r = run("T003", "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertTrue(r.stdout.startswith("T003 KO T003 est en statut « fait »"), r.stdout)
        self.assertEqual(journal_bg(), [])

    def test_refus_4_pack_lint(self):
        d = tache("T014")
        (d / "context.md").write_text("# vide\n", encoding="utf-8")
        r = run("T014", "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertTrue(r.stdout.startswith("T014 KO pack-lint refuse T014 : "), r.stdout)
        self.assertEqual(r.stdout.count("\n"), 1)

    def test_refus_6_role_sans_md(self):
        tache("T004", role="fantome")
        r = run("T004", "--projet", "banc")
        self.assertEqual((r.returncode, r.stdout), (1, "T004 KO role sans agent : .claude/agents/fantome.md absent\n"))
        self.assertEqual(journal_bg(), [])

    def test_refus_7_deja_vivant(self):
        tache("T005")
        fiche("T005", "aaaaaaaa")
        sess = [{"id": "aaaaaaaa1234", "state": "working", "pid": 1, "name": "agentx-banc-T005"}]
        r = run("--vague", "T005", "--projet", "banc", sessions=sess)
        self.assertEqual((r.returncode, r.stdout), (0, "T005 DEJA aaaaaaaa implementeur\n"))
        self.assertEqual(journal_bg(), [])

    def test_refus_8_mort_rendu_sinon_relance(self):
        d = tache("T006")
        fiche("T006", "bbbbbbbb")
        (d / "result.md").write_text("---\ntache: T006\n---\n", encoding="utf-8")
        r = run("T006", "--projet", "banc")
        self.assertEqual((r.returncode, r.stdout),
                         (1, "T006 KO agent mort, result.md rendu : agentx dispatch --relancer T006\n"))
        (d / "result.md").unlink()
        env = dict(os.environ, BANC_RESPAWN_RC="1", BANC_SESSIONS="[]")
        r = subprocess.run([sys.executable, str(ICI / "dispatch.py"), "T006", "--projet", "banc"],
                           capture_output=True, text=True, env=env, cwd=str(DEPOT))
        self.assertEqual((r.returncode, r.stdout), (0, "T006 OK 7c5dcf5d implementeur dontAsk\n"))

    def test_relancer_respawn_ko_relance_neuf(self):
        tache("T015")
        fiche("T015", "cccccccc")
        env = dict(os.environ, BANC_RESPAWN_RC="1", BANC_SESSIONS="[]")
        r = subprocess.run([sys.executable, str(ICI / "dispatch.py"), "--relancer", "T015", "--projet", "banc"],
                           capture_output=True, text=True, env=env, cwd=str(DEPOT))
        self.assertEqual((r.returncode, r.stdout), (0, "T015 OK 7c5dcf5d implementeur dontAsk\n"))
        self.assertEqual(len(journal_bg()), 1)

    def test_vague_ordre_et_rc(self):
        tache("T007")
        tache("T008", statut="fait")
        r = run("--vague", "T007", "T008", "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        lignes = r.stdout.splitlines()
        self.assertEqual(len(lignes), 2)
        self.assertEqual(lignes[0], "T007 OK 7c5dcf5d implementeur dontAsk")
        self.assertTrue(lignes[1].startswith("T008 KO "))

    def test_usage(self):
        self.assertEqual(run().returncode, 2)
        self.assertEqual(run("T001").returncode, 2)
        self.assertEqual(run("T001", "--vague", "T002", "--projet", "banc").returncode, 2)

    def test_etat_json(self):
        tache("T016", statut="en-cours")
        fiche("T016", "dddddddd")
        r = run("--etat", "--projet", "banc", "--json",
                sessions=[{"id": "dddddddd0000", "state": "blocked", "name": "agentx-banc-T016"}])
        self.assertEqual(r.returncode, 0)
        ligne = [x for x in json.loads(r.stdout) if x["tid"] == "T016"][0]
        self.assertEqual(ligne, {"tid": "T016", "projet": "banc", "role": "implementeur", "vivant": True,
                                 "etat": "blocked", "depuis": "2026-10-16T10:00:00", "id": "dddddddd",
                                 "nom": "agentx-banc-T016"})


class TestLancerInjecte(unittest.TestCase):
    def test_claude_rc_non_nul(self):
        tache("T020")
        appels = []

        def executer(argv, **kw):
            return subprocess.CompletedProcess(argv, 1, stdout="", stderr="x\nUnknown agent\n")

        res = dispatch.lancer(["T020"], "banc", None, executer=executer,
                              set_statut=lambda t, s: appels.append(t) or (0, ""))
        self.assertEqual(res, [("T020", "KO", "Unknown agent")])
        self.assertIsNone(agents.lire("banc", "T020"))
        self.assertEqual(appels, [])

    def test_set_ko_agent_garde(self):
        tache("T021")

        def executer(argv, **kw):
            return subprocess.CompletedProcess(argv, 0, stdout="session 0123abcd\n", stderr="")

        res = dispatch.lancer(["T021"], "banc", None, executer=executer,
                              set_statut=lambda t, s: (1, "vx: erreur: verrou"),
                              maintenant=lambda: "2026-10-16T12:00:00")
        self.assertEqual(res, [("T021", "KO", "set en-cours : vx: erreur: verrou (agent 0123abcd vivant)")])
        self.assertEqual(agents.lire("banc", "T021")["lance"], "2026-10-16T12:00:00")


def ok_executer(appels=None):
    def executer(argv, **kw):
        if appels is not None:
            appels.append(kw)
        return subprocess.CompletedProcess(argv, 0, stdout="session 0123abcd\n", stderr="")
    return executer


def vague(vague_id: str, tids: list[str], lance: str) -> Path:
    f = BANC / "run" / "vagues" / f"{vague_id}.json"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps({"id": vague_id, "projet": "banc", "lance": lance, "taches": tids, "contrats": {}}),
                 encoding="utf-8")
    return f


def sessions_successives(*etats):
    """agents.sessions simulee : un retour par appel, le dernier se repete."""
    it = iter(etats)
    dernier = []

    def sessions(cache_s=5.0):
        nonlocal dernier
        dernier = next(it, dernier)
        return dernier
    return sessions


class TestRelancer(unittest.TestCase):
    def relancer(self, tid, sessions, executer):
        tache(tid)
        fiche(tid, "bbbbbbbb")
        with mock.patch.object(agents, "sessions", sessions):
            return dispatch.lancer([tid], "banc", None, executer=executer, relancer=True,
                                   set_statut=lambda t, s: (0, ""), maintenant=lambda: "2026-10-17T09:00:00",
                                   sommeil=lambda s: None)

    def test_respawn_busy_repris(self):
        appels = []
        executer = lambda argv, **kw: appels.append(argv[1:]) or subprocess.CompletedProcess(argv, 0, stdout="", stderr="")
        busy = [{"id": "bbbbbbbb0000", "state": "working", "pid": 5, "name": "agentx-banc-T060"}]
        res = self.relancer("T060", sessions_successives([], busy), executer)
        self.assertEqual(res, [("T060", "OK", "bbbbbbbb implementeur dontAsk")])
        self.assertEqual(appels, [["respawn", "bbbbbbbb"]])
        f = agents.lire("banc", "T060")
        self.assertEqual((f["id_session"], f["lance"], f["pid"]), ("bbbbbbbb", "2026-10-17T09:00:00", 5))

    def test_respawn_blocked_repris(self):
        appels = []
        executer = lambda argv, **kw: appels.append(argv[1:]) or subprocess.CompletedProcess(argv, 0, stdout="", stderr="")
        blocked = [{"id": "bbbbbbbb0000", "state": "blocked", "pid": 6, "name": "agentx-banc-T064"}]
        res = self.relancer("T064", sessions_successives([], blocked), executer)
        self.assertEqual(res, [("T064", "OK", "bbbbbbbb implementeur dontAsk")])
        self.assertEqual(appels, [["respawn", "bbbbbbbb"]])

    def test_vivant_busy(self):
        self.assertIs(agents.vivant("busy"), True)

    def test_vivant_idle(self):
        self.assertIs(agents.vivant("idle"), False)

    def test_etat_session_repli_status(self):
        self.assertEqual(agents.etat_session({"status": "busy"}), "busy")

    def test_etat_session_inconnu(self):
        self.assertEqual(agents.etat_session({}), "inconnu")

    def test_respawn_idle_stop_et_lancement_neuf(self):
        appels = []

        def executer(argv, **kw):
            appels.append(argv[1:])
            return subprocess.CompletedProcess(argv, 0, stdout="session 0123abcd\n", stderr="")
        idle = [{"id": "bbbbbbbb0000", "state": "idle", "name": "agentx-banc-T061"}]
        res = self.relancer("T061", sessions_successives([], idle), executer)
        self.assertEqual(res, [("T061", "OK", "0123abcd implementeur dontAsk (respawn idle ⇒ relance neuve)")])
        self.assertEqual(appels[:2], [["respawn", "bbbbbbbb"], ["stop", "bbbbbbbb"]])
        self.assertEqual(len(appels), 3)
        self.assertIn("--bg", appels[2])
        self.assertEqual(agents.lire("banc", "T061")["id_session"], "0123abcd")

    def test_respawn_ko_lancement_neuf(self):
        def executer(argv, **kw):
            rc = 1 if argv[1] == "respawn" else 0
            return subprocess.CompletedProcess(argv, rc, stdout="session 0123abcd\n", stderr="")
        res = self.relancer("T062", sessions_successives([]), executer)
        self.assertEqual(res, [("T062", "OK", "0123abcd implementeur dontAsk")])
        self.assertEqual(agents.lire("banc", "T062")["id_session"], "0123abcd")


class TestCompte(unittest.TestCase):
    """Compte du tenant (C3), fiche (C4), refus croise (C9) : terminal patche, executer injecte."""

    def setUp(self):
        self.comptes = Path(tempfile.mkdtemp(prefix="agentx-comptes-"))
        self.addCleanup(shutil.rmtree, self.comptes)
        (self.comptes / "u2").mkdir()
        (self.comptes / "u2" / ".credentials.json").write_text("{}", encoding="utf-8")
        for p in (mock.patch.object(agents, "COMPTES_DIR", self.comptes),
                  mock.patch.object(agents, "verifier_compte", wraps=self.verif),
                  mock.patch.dict(os.environ, {}, clear=False)):
            p.start()
            self.addCleanup(p.stop)
        os.environ.pop("AGENTX_CHEF", None)
        os.environ.pop("CLAUDE_CONFIG_DIR", None)
        dispatch._CHEFS = None
        self.addCleanup(setattr, dispatch, "_CHEFS", None)

    def verif(self, compte, connecte=True):
        if compte != "defaut":                      # defaut : ~/.claude de la machine, hors banc
            d = agents.dossier_compte(compte)
            if not d.is_dir():
                raise agents.CompteErreur("compte-inconnu", f"compte inconnu : {compte}")
            if connecte and not (d / ".credentials.json").exists():
                raise agents.CompteErreur("compte-deconnecte",
                                          f"compte {compte} non connecté — dans ton terminal : claude auth login")

    def tenant(self, cle, compte):
        t = {"cle": cle, "defaut": cle == "defaut", "vivant": True, "etages": ["banc"], "projets": {},
             "pid": 1, "depuis": "", "compte": compte}
        return (mock.patch.object(terminal, "lister_chefs", return_value=[t]),
                mock.patch.object(terminal, "tenant_de_projet", return_value=t))

    def lancer(self, tid, tenant, relancer=False, **kw):
        appels = []
        tache(tid)
        with tenant[0], tenant[1]:
            res = dispatch.lancer([tid], "banc", None, executer=ok_executer(appels), relancer=relancer,
                                  set_statut=lambda t, s: (0, ""), maintenant=lambda: "2026-10-20T09:00:00",
                                  sommeil=lambda s: None, **kw)
        return res, appels

    def sans_tenant(self):
        return (mock.patch.object(terminal, "lister_chefs", return_value=[]),
                mock.patch.object(terminal, "tenant_de_projet", return_value=None))

    def test_tenant_dedie_env_et_fiche(self):
        res, appels = self.lancer("T200", self.tenant("u2", "u2"))
        self.assertEqual(res[0][1], "OK")
        self.assertTrue(appels[0]["env"]["CLAUDE_CONFIG_DIR"].endswith("/u2"))
        self.assertEqual(appels[0]["env"]["AGENTX_COMPTE"], "u2")
        self.assertEqual(agents.lire("banc", "T200")["compte"], "u2")

    def test_sans_tenant_defaut(self):
        res, appels = self.lancer("T201", self.sans_tenant())
        self.assertEqual(res[0][1], "OK")
        self.assertNotIn("CLAUDE_CONFIG_DIR", appels[0]["env"])
        self.assertEqual(agents.lire("banc", "T201")["compte"], "defaut")

    def test_refus_croise(self):
        os.environ["AGENTX_CHEF"] = "bureau"
        res, appels = self.lancer("T202", self.tenant("defaut", "defaut"))
        self.assertEqual(res, [("T202", "KO", "projet banc tenu par le chef defaut : dispatch refusé depuis le chef bureau")])
        self.assertEqual(appels, [])

    def test_appelant_tenant_ok(self):
        os.environ["AGENTX_CHEF"] = "bureau"
        res, appels = self.lancer("T203", self.tenant("bureau", "defaut"))
        self.assertEqual(res[0][1], "OK")
        self.assertEqual(len(appels), 1)

    def test_compte_deconnecte(self):
        (self.comptes / "u2" / ".credentials.json").unlink()
        res, appels = self.lancer("T204", self.tenant("u2", "u2"))
        self.assertEqual(res[0][1], "KO")
        self.assertTrue(res[0][2].startswith("compte u2 non connecté — dans ton terminal : "))
        self.assertEqual(appels, [])

    def test_respawn_compte_de_la_fiche(self):
        tache("T205")
        f = fiche("T205", "bbbbbbbb")
        agents.ecrire({**f, "compte": "u2"})
        appels = []
        busy = [{"id": "bbbbbbbb0000", "state": "working", "pid": 5, "name": "agentx-banc-T205"}]
        with mock.patch.object(agents, "sessions", sessions_successives([], busy)), \
                self.sans_tenant()[0], self.sans_tenant()[1]:
            res = dispatch.lancer(["T205"], "banc", None, executer=ok_executer(appels), relancer=True,
                                  set_statut=lambda t, s: (0, ""), maintenant=lambda: "2026-10-20T09:00:00",
                                  sommeil=lambda s: None)
        self.assertEqual(res[0][1], "OK")
        self.assertTrue(appels[0]["env"]["CLAUDE_CONFIG_DIR"].endswith("/u2"))

    def test_resume_compte_de_la_fiche(self):
        d = tache("T206", statut="bloque")
        (d / "result.md").write_text("## Réponse du chef\noui\n", encoding="utf-8")
        agents.ecrire({**fiche("T206", "bbbbbbbb"), "compte": "u2", "pack_sha": dispatch._sha_pack(d),
                       "session_uuid": "u-1"})
        appels = []
        with self.sans_tenant()[0], self.sans_tenant()[1]:
            res = dispatch.lancer(["T206"], "banc", None, executer=ok_executer(appels), relancer=True,
                                  set_statut=lambda t, s: (0, ""), maintenant=lambda: "2026-10-20T09:00:00")
        self.assertEqual(res[0][1], "OK")
        self.assertTrue(appels[0]["env"]["CLAUDE_CONFIG_DIR"].endswith("/u2"))

    def test_relancer_refus_croise_en_tete(self):
        os.environ["AGENTX_CHEF"] = "bureau"
        tache("T207")
        fiche("T207", "bbbbbbbb")
        appels = []
        with self.tenant("defaut", "defaut")[0], self.tenant("defaut", "defaut")[1]:
            res = dispatch.lancer(["T207"], "banc", None, executer=ok_executer(appels), relancer=True,
                                  set_statut=lambda t, s: (0, ""))
        self.assertEqual(res[0][1], "KO")
        self.assertEqual(appels, [])

    def test_chefs_ttl(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[]) as l, \
                mock.patch.object(terminal, "tenant_de_projet", return_value=None), \
                mock.patch.object(dispatch.time, "monotonic", side_effect=[100.0, 100.0, 103.5, 103.5]):
            dispatch.compte_lancement("banc")
            dispatch.compte_lancement("banc")
            self.assertEqual(l.call_count, 1)
            dispatch.compte_lancement("banc")
            self.assertEqual(l.call_count, 2)


class TestReponseChef(unittest.TestCase):
    def test_titre_nu_et_date_acceptes(self):
        self.assertTrue(dispatch.RE_REPONSE.search("## Réponse du chef\n"))
        self.assertTrue(dispatch.RE_REPONSE.search("## Réponse du chef — 2026-10-19 13:21\ntexte"))

    def test_titre_avec_suffixe_libre_refuse(self):
        self.assertFalse(dispatch.RE_REPONSE.search("## Réponse du chef (brouillon)\n"))


class TestReprendreBloque(unittest.TestCase):
    PROMPT = ("{tid} · projet banc\nréponse du chef : vault/projets/banc/taches/{tid}-banc/result.md § « Réponse du chef »\n"
              "→ lire · reprendre là où tu t'es arrêté · result.md append-only : ajoute « ## Livré (reprise) », "
              "« ## Vérifié comment (reprise) », statut revue | fait | bloque\nrien d'autre du vault")

    def monter(self, tid, reponse=True, sha=None, repris=0):
        d = tache(tid, statut="bloque")
        (d / "result.md").write_text("---\nstatut: bloque\n---\n## Livré\n∅\n" + ("## Réponse du chef\noui\n" if reponse else ""),
                                     encoding="utf-8")
        f = fiche(tid, "bbbbbbbb")
        f.update(pack_sha=sha or dispatch._sha_pack(d), session_uuid="bbbbbbbb-2222-3333-4444-555555555555", repris=repris)
        agents.ecrire(f)

    def reprendre(self, tid, rc=0):
        appels = []

        def executer(argv, **kw):
            appels.append(argv)
            return subprocess.CompletedProcess(argv, rc, stdout="", stderr="boum\n" if rc else "")
        sets = []
        res = dispatch.lancer([tid], "banc", None, executer=executer, relancer=True,
                              set_statut=lambda t, s: sets.append(t) or (0, ""), maintenant=lambda: "2026-10-19T09:00:00",
                              sommeil=lambda s: None)
        return res, appels, sets

    def test_ok(self):
        self.monter("T070")
        with mock.patch.object(agents, "sessions", lambda c=5.0: []):
            res, appels, sets = self.reprendre("T070")
        self.assertEqual(res, [("T070", "OK", "bbbbbbbb implementeur repris")])
        self.assertEqual(appels[-1][1:], ["--bg", "--resume", "bbbbbbbb-2222-3333-4444-555555555555",
                                          self.PROMPT.format(tid="T070")])
        self.assertEqual(sets, ["T070"])
        f = agents.lire("banc", "T070")
        self.assertEqual((f["repris"], f["lance"]), (1, "2026-10-19T09:00:00"))
        evs = [json.loads(l) for l in agents.EVENEMENTS.read_text(encoding="utf-8").splitlines()]
        self.assertEqual([e["quoi"] for e in evs if e["tid"] == "T070"], ["reponse"])

    def test_sans_reponse(self):
        self.monter("T071", reponse=False)
        res, appels, _ = self.reprendre("T071")
        self.assertEqual(res, [("T071", "KO", "## Réponse du chef absent de result.md : vx repondre")])
        self.assertEqual(appels, [])

    def test_pack_modifie(self):
        self.monter("T072", sha="0" * 16)
        res, appels, _ = self.reprendre("T072")
        self.assertEqual(res, [("T072", "KO", "pack modifié depuis le lancement : virer")])
        self.assertEqual(appels, [])

    def test_deja_repris(self):
        self.monter("T073", repris=1)
        res, appels, _ = self.reprendre("T073")
        self.assertEqual(res, [("T073", "KO", "déjà repris 1 fois : virer")])
        self.assertEqual(appels, [])

    def test_fiche_absente(self):
        self.monter("T074")
        agents._chemin("banc", "T074").unlink()
        res, _, _ = self.reprendre("T074")
        self.assertEqual(res, [("T074", "KO", "fiche ou session introuvable : virer")])

    def test_reprendre_bloque_uuid_incoherent(self):
        self.monter("T077")
        f = agents.lire("banc", "T077")
        f.update(session_uuid="b615bd59-2222-3333-4444-555555555555")
        agents.ecrire(f)
        with mock.patch.object(agents, "sessions", lambda c=5.0: []):
            _, appels, _ = self.reprendre("T077")
        self.assertEqual(appels[-1][1:4], ["--bg", "--resume", "bbbbbbbb"])

    def test_rc_non_nul(self):
        self.monter("T075")
        res, _, sets = self.reprendre("T075", rc=1)
        self.assertEqual(res, [("T075", "KO", "boum")])
        self.assertEqual((sets, agents.lire("banc", "T075")["repris"]), ([], 0))

    def test_verifier_refuse_avant_respawn(self):
        self.monter("T078")
        with mock.patch.object(dispatch, "verifier", lambda *a, **k: (None, None, "lint KO")), \
                mock.patch.object(agents, "sessions", lambda c=5.0: []):
            res, appels, sets = self.reprendre("T078")
        self.assertEqual(res, [("T078", "KO", "lint KO")])
        self.assertEqual((appels, sets), ([], []))

    def test_verifier_bloque(self):
        tache("T076", statut="bloque")
        from garde_dispatch import verifier
        self.assertIn("bloque", verifier("banc", "T076", None)[2])
        self.assertNotIn("est en statut", verifier("banc", "T076", None, relance_bloque=True)[2] or "")


class TestIdentiteSession(unittest.TestCase):
    NOM = "agentx-banc-T080"

    def setUp(self):
        JOURNAL.unlink(missing_ok=True)

    def test_nom_session_suffixe(self):
        self.assertEqual(agents.nom_session("agentx", "T091", datetime(2026, 10, 19, 15, 21, 34)),
                         "agentx-agentx-T091-20261019-152134")
        argv = dispatch.argv_de("implementeur", "banc", "T080", Path("T080-banc"), "dontAsk", [], None, [], nom="X")
        self.assertEqual(argv[argv.index("--name"):argv.index("--name") + 2], ["--name", "X"])

    def test_lancer_sans_id_ko_sans_fiche(self):
        tache("T081")
        sets = []
        executer = lambda argv, **kw: subprocess.CompletedProcess(argv, 0, stdout="ok\n", stderr="")
        res = dispatch.lancer(["T081"], "banc", None, executer=executer, maintenant=lambda: "2026-10-19T15:21:34",
                              set_statut=lambda t, s: sets.append(t) or (0, ""))
        self.assertEqual(res[0][:2], ("T081", "KO"))
        self.assertIn("id de session absent", res[0][2])
        self.assertIsNone(agents.lire("banc", "T081"))
        self.assertEqual(sets, [])

    def test_lancer_uuid_jamais_homonyme(self):
        tache("T082")
        nom = agents.nom_session("banc", "T082", datetime(2026, 10, 19, 15, 21, 34))
        homonyme = [{"id": "aaaa0000", "name": nom, "sessionId": "aaaa0000-1111-2222-3333-444444444444"}]
        executer = lambda argv, **kw: subprocess.CompletedProcess(argv, 0, stdout="cfd7916e\n", stderr="")
        with mock.patch.object(agents, "sessions", lambda c=5.0: homonyme):
            dispatch.lancer(["T082"], "banc", None, executer=executer, maintenant=lambda: "2026-10-19T15:21:34",
                            set_statut=lambda t, s: (0, ""))
        f = agents.lire("banc", "T082")
        self.assertEqual((f["id_session"], f["nom"], f["session_uuid"]), ("cfd7916e", nom, None))

    def test_relancer_refuse_vivant(self):
        tache("T083")
        fiche("T083", "cfd7916e")
        appels = []
        executer = lambda argv, **kw: appels.append(argv) or subprocess.CompletedProcess(argv, 0, stdout="", stderr="")
        vivante = [{"id": "cfd7916e0000", "state": "working", "name": self.NOM}]
        with mock.patch.object(agents, "sessions", lambda c=5.0: vivante):
            res = dispatch.lancer(["T083"], "banc", None, executer=executer, relancer=True,
                                  set_statut=lambda t, s: (0, ""))
        self.assertEqual(res[0][:2], ("T083", "KO"))
        self.assertIn("agent vivant (cfd7916e)", res[0][2])
        self.assertEqual(appels, [])

    def test_relancer_fiche_sans_id_ko(self):
        tache("T084")
        fiche("T084", None)
        appels = []
        executer = lambda argv, **kw: appels.append(argv) or subprocess.CompletedProcess(argv, 0, stdout="", stderr="")
        with mock.patch.object(agents, "sessions", lambda c=5.0: []):
            res = dispatch.lancer(["T084"], "banc", None, executer=executer, relancer=True,
                                  set_statut=lambda t, s: (0, ""))
        self.assertEqual(res, [("T084", "KO", "état inconnu (sans id) : virer")])
        self.assertEqual(appels, [])

    def homonymes(self):
        return [{"id": "aaaa0000", "name": self.NOM, "state": "done"},
                {"id": "cfd7916e0000", "name": self.NOM, "state": "working"}]

    def test_homonymes_etat_working(self):
        tache("T080", statut="en-cours")
        fiche("T080", "cfd7916e")
        r = run("--etat", "--projet", "banc", sessions=self.homonymes())
        self.assertIn("T080 implementeur working 2026-10-16T10:00:00 cfd7916e agentx-banc-T080", r.stdout)

    def test_homonymes_relancer_ko_vivant(self):
        tache("T085")
        fiche("T085", "cfd7916e")
        r = run("--relancer", "T085", "--projet", "banc", sessions=[dict(s, name="agentx-banc-T085") for s in self.homonymes()])
        self.assertEqual(r.returncode, 1)
        self.assertIn("T085 KO agent vivant (cfd7916e)", r.stdout)
        self.assertEqual(journal_bg(), [])


class TestVagues(unittest.TestCase):
    def test_vague_ecrite(self):
        d = tache("T050")
        (d / "context.md").write_text((d / "context.md").read_text(encoding="utf-8")
                                      .replace("contrat banc", "contrat-banc.md@v1"), encoding="utf-8")
        note = BANC / "vault" / "projets" / "banc" / "notes" / "contrat-banc.md"
        note.parent.mkdir(parents=True, exist_ok=True)
        note.write_text("---\nversion: 1\n---\ncorps\n", encoding="utf-8")
        res = dispatch.lancer(["T050", "T999"], "banc", None, executer=ok_executer(),
                              set_statut=lambda t, s: (0, ""), maintenant=lambda: "2026-10-16T12:00:01")
        self.assertEqual([r[:2] for r in res], [("T050", "OK"), ("T999", "KO")])
        f = BANC / "run" / "vagues" / "banc-20261016-120001.json"
        self.assertEqual(json.loads(f.read_text(encoding="utf-8")),
                         {"id": "banc-20261016-120001", "projet": "banc", "lance": "2026-10-16T12:00:01",
                          "taches": ["T050"], "contrats": {"vault/projets/banc/notes/contrat-banc.md": 1}})

    def test_relancer_refuse_si_vague_active(self):
        tache("T051", statut="en-cours")
        vague("banc-20261016-120002", ["T051", "T052"], "2026-10-16T12:00:02")
        res = dispatch.lancer(["T051"], "banc", None, relancer=True, maintenant=lambda: "2026-10-16T12:00:02",
                              executer=lambda *a, **k: self.fail("lancement malgré vague active"))
        self.assertEqual(res, [("T051", "KO", "dans la vague banc-20261016-120002 active : "
                                              "relance réservée à un agent mort sans result.md")])

    def test_fiche_morte_vague_active_relancee(self):
        tache("T056", statut="en-cours")
        fiche("T056", "56565656")
        vague("banc-20261016-120005", ["T056"], "2026-10-16T12:00:05")
        with mock.patch.object(agents, "sessions", lambda cache_s=5.0: []):
            for relancer in (True, False):
                res = dispatch.lancer(["T056"], "banc", None, executer=ok_executer(), relancer=relancer,
                                      set_statut=lambda t, s: (0, ""), maintenant=lambda: "2026-10-16T12:00:05",
                                      sommeil=lambda s: None)
                self.assertEqual(res, [("T056", "OK", "0123abcd implementeur dontAsk (respawn idle ⇒ relance neuve)")])
                fiche("T056", "56565656")

    def _main_vague(self, tids: list[str]) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(dispatch, "lancer", lambda t, *a, **k: [(x, "OK", "d") for x in t]), \
                contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = dispatch.main(["--vague", *tids, "--projet", "p"])
        return rc, out.getvalue(), err.getvalue()

    def test_vague_recouvrement_avertit(self):
        tache("T1", slug="p", wl="| `x/a.py` | E | banc |")
        tache("T2", slug="p", wl="| `x/a.py` | E | banc |")
        tache("T3", slug="p", wl="| `x/a.py` | L | banc |")
        self.assertEqual(dispatch.recouvrements("p", ["T1", "T2", "T3"]), [("T1", "T2", "x/a.py", "x/a.py")])
        rc, out, err = self._main_vague(["T1", "T2"])
        self.assertIn("~ T1 ∩ T2 : x/a.py", out)
        self.assertIn("1 recouvrement(s) de WL E", err)
        self.assertEqual(rc, 0)

    def test_vague_sans_recouvrement_silence(self):
        tache("T4", slug="p", wl="| `x/a.py` | E | banc |")
        tache("T5", slug="p", wl="| `y/b.py` | E | banc |")
        self.assertEqual(dispatch.recouvrements("p", ["T4", "T5"]), [])
        rc, out, err = self._main_vague(["T4", "T5"])
        self.assertNotIn("~", out)
        self.assertEqual((rc, err), (0, ""))

    def test_purge_vagues_30j(self):
        tache("T053", statut="fait")
        tache("T054", statut="en-cours")
        vieille = vague("banc-20260801-100000", ["T053"], "2026-08-01T10:00:00")
        active = vague("banc-20260801-100001", ["T054"], "2026-08-01T10:00:01")
        recente = vague("banc-20261010-100000", ["T053"], "2026-10-10T10:00:00")
        dispatch.lancer([], "banc", None, maintenant=lambda: "2026-10-16T12:00:03")
        self.assertEqual([vieille.exists(), active.exists(), recente.exists()], [False, True, True])

    def test_env_agent_pose(self):
        tache("T055")
        appels = []
        dispatch.lancer(["T055"], "banc", None, executer=ok_executer(appels), set_statut=lambda t, s: (0, ""),
                        maintenant=lambda: "2026-10-16T12:00:04")
        env = appels[0]["env"]
        self.assertEqual((env["AGENTX_TID"], env["AGENTX_PROJET"]), ("T055", "banc"))


class TestAgents(unittest.TestCase):
    def test_par_session(self):
        fiche("T036", "99999999")
        self.assertEqual(agents.par_session("99999999-aaaa-bbbb")["tid"], "T036")
        self.assertEqual(agents.par_session("9999")["tid"], "T036")
        self.assertIsNone(agents.par_session("zz"))
        self.assertIsNone(agents.par_session(""))

    def test_etat_et_vivant(self):
        f = fiche("T030", "eeeeeeee")
        self.assertEqual(agents.etat(f, []), "stopped")
        self.assertEqual(agents.etat(f, [{"id": "eeeeeeee99", "state": "done"}]), "done")
        self.assertEqual(agents.etat(f, [{"name": "agentx-banc-T030", "state": "working"}]), "stopped")
        self.assertEqual(agents.etat(f, None), "inconnu")
        self.assertEqual(agents.etat(dict(f, pid=os.getpid()), None), "working")
        self.assertEqual([agents.vivant(e) for e in ("working", "blocked", "inconnu", "done", "failed", "stopped")],
                         [True, True, None, False, False, False])

    def test_signaler_morts_une_fois(self):
        tache("T031", statut="en-cours")
        fiche("T031", "ffffffff")
        sess = [{"id": "ffffffff00", "state": "failed"}]
        ev = [e for e in agents.signaler_morts(sess) if e["tid"] == "T031"]      # autres fiches du banc ignorees
        self.assertEqual(len(ev), 1)
        self.assertEqual((ev[0]["quoi"], ev[0]["statut"], ev[0]["projet"], ev[0]["role"]),
                         ("agent-mort", "failed", "banc", "implementeur"))
        lignes = [json.loads(l) for l in (BANC / "run" / "evenements.jsonl").read_text(encoding="utf-8").splitlines()]
        self.assertEqual([l["tid"] for l in lignes if l["quoi"] == "agent-mort" and l["tid"] == "T031"], ["T031"])
        self.assertTrue(agents.lire("banc", "T031")["mort_signale"])
        self.assertEqual(agents.signaler_morts(sess), [])

    def test_stopped_sous_60s_inconnu(self):
        tache("T037", statut="en-cours")
        f = fiche("T037", "37373737", lance=datetime.now().isoformat(timespec="seconds"))
        self.assertEqual(agents.etat(f, []), "inconnu")
        self.assertEqual([e for e in agents.signaler_morts([]) if e["tid"] == "T037"], [])
        self.assertFalse(agents.lire("banc", "T037")["mort_signale"])
        f = fiche("T037", "37373737", lance=(datetime.now() - timedelta(seconds=61)).isoformat(timespec="seconds"))
        self.assertEqual(agents.etat(f, []), "stopped")

    def test_done_sans_result_mort(self):
        tache("T038", statut="en-cours")
        fiche("T038", "38383838", lance=(datetime.now() - timedelta(seconds=61)).isoformat(timespec="seconds"))
        ev = [e for e in agents.signaler_morts([{"id": "3838383800", "state": "done"}]) if e["tid"] == "T038"]
        self.assertEqual([(e["quoi"], e["statut"]) for e in ev], [("agent-mort", "done")])

    def test_etat_ignore_homonyme_par_nom(self):
        n = "agentx-banc-T040"
        f = dict(fiche("T040", "cfd7916e"), nom=n)
        sess = [{"id": "aaaa0000", "name": n, "state": "done"}, {"id": "cfd7916e", "state": "working"}]
        self.assertEqual(agents.etat(f, sess), "working")
        self.assertEqual(agents.session_de(f, sess)["id"], "cfd7916e")

    def test_etat_nom_seul_jamais_apparie(self):
        n = "agentx-banc-T041"
        f = dict(fiche("T041", "cfd7916e", lance=(datetime.now() - timedelta(seconds=120)).isoformat(timespec="seconds")), nom=n)
        self.assertEqual(agents.etat(f, [{"id": "bbbb1111", "name": n, "state": "working"}]), "stopped")

    def test_etat_sans_id_inconnu(self):
        f = fiche("T042", None)
        self.assertEqual(agents.etat(f, [{"name": f["nom"], "state": "done"}]), "inconnu")

    def test_uuid_fiable(self):
        self.assertEqual(agents.uuid_fiable({"id_session": "cfd7916e", "session_uuid": "cfd7916e-aaaa-bbbb"}), "cfd7916e-aaaa-bbbb")
        self.assertIsNone(agents.uuid_fiable({"id_session": "cfd7916e", "session_uuid": "b615bd59-aaaa-bbbb"}))
        self.assertIsNone(agents.uuid_fiable({"id_session": None, "session_uuid": "cfd7916e-aaaa-bbbb"}))

    def test_mort_grace_60s(self):
        d = tache("T043", statut="en-cours")
        t0 = datetime(2026, 10, 19, 15, 0, 0)
        f = fiche("T043", "cfd7916e", lance=t0.isoformat())
        self.assertFalse(agents.mort(f, [], t0.timestamp() + 30))
        self.assertTrue(agents.mort(f, [], t0.timestamp() + 61))
        (d / "result.md").write_text("---\ntache: T043\n---\n", encoding="utf-8")
        self.assertFalse(agents.mort(f, [], t0.timestamp() + 61))

    def test_pas_mort_si_rendu_ou_vivant(self):
        d = tache("T032", statut="en-cours")
        fiche("T032", "abababab")
        (d / "result.md").write_text("---\ntache: T032\n---\n", encoding="utf-8")
        self.assertEqual(agents.signaler_morts([]), [])
        tache("T033", statut="en-cours")
        fiche("T033", "cdcdcdcd")
        self.assertEqual(agents.signaler_morts(None), [])          # inconnu ≠ mort
        self.assertEqual(agents.signaler_morts([{"id": "cdcdcdcd", "state": "working"}]), [])

    def test_purger(self):
        tache("T034", statut="fait")
        tache("T035", statut="en-cours")
        fiche("T034", "11111111")
        fiche("T035", "22222222")
        self.assertEqual(agents.purger(), 1)
        self.assertIsNone(agents.lire("banc", "T034"))
        self.assertIsNotNone(agents.lire("banc", "T035"))


class TestGardeDispatch(unittest.TestCase):
    def test_hook(self):
        d = tache("T040")
        tache("T041", statut="fait")
        base = {"tool_name": "Agent", "tool_input": {"subagent_type": "implementeur", "prompt": ""}}
        pack = f"pack: vault/projets/banc/taches/{d.name}/context.md"
        self.assertEqual(hook({**base, "tool_input": {**base["tool_input"], "prompt": pack}}),
                         "GARDE AGENTX — les agents AgentX tournent détachés : ./bin/agentx dispatch T040 "
                         "--projet banc (vague : --vague T1 T2…)")
        self.assertTrue(hook(base).startswith("GARDE AGENTX — le prompt ne nomme aucun pack"))
        fait = f"pack: vault/projets/banc/taches/T041-banc/context.md"
        self.assertTrue(hook({**base, "tool_input": {**base["tool_input"], "prompt": fait}})
                        .startswith("GARDE AGENTX — T041 est en statut « fait »"))
        self.assertEqual(hook({**base, "tool_input": {"subagent_type": "Explore", "prompt": ""}}), "allow")


class TestAttenteEnFond(unittest.TestCase):
    def setUp(self):
        self.appels = []
        self.popen = lambda *a, **k: self.appels.append((a, k)) or types.SimpleNamespace(pid=1)

    def test_deux_ok_un_popen(self):
        with mock.patch.dict(os.environ):
            os.environ.pop("AGENTX_SANS_ATTENTE", None)
            log = dispatch.attendre_en_fond(["T1", "T2"], "banc", self.popen,
                                            lambda: datetime(2026, 10, 20, 9, 8, 7))
        self.assertEqual(len(self.appels), 1)
        a, k = self.appels[0]
        self.assertEqual(a[0], [sys.executable, str(dispatch.BIN / "attendre.py"), "T1", "T2",
                                "--projet", "banc", "--tout", "--integrer"])
        self.assertEqual(log, BANC / "run" / "attentes" / "banc-20261020-090807.log")
        self.assertTrue(log.exists())
        self.assertEqual((k["cwd"], k["start_new_session"], k["stdin"]), (str(BANC), True, subprocess.DEVNULL))

    def test_zero_ok_rien(self):
        with mock.patch.dict(os.environ):
            os.environ.pop("AGENTX_SANS_ATTENTE", None)
            self.assertIsNone(dispatch.attendre_en_fond([], "banc", self.popen))
        self.assertEqual(self.appels, [])

    def test_sans_attente_env(self):
        with mock.patch.dict(os.environ, AGENTX_SANS_ATTENTE="1"):
            self.assertIsNone(dispatch.attendre_en_fond(["T1"], "banc", self.popen))
        self.assertEqual(self.appels, [])

    def lancer_main(self, sans_attente: bool) -> str:
        res = [("T1", "OK", "x"), ("T2", "OK", "y")]
        sortie = io.StringIO()
        with mock.patch.dict(os.environ), mock.patch.object(dispatch, "lancer", lambda *a, **k: res), \
                contextlib.redirect_stdout(sortie):
            os.environ.pop("AGENTX_SANS_ATTENTE", None)
            if sans_attente:
                os.environ["AGENTX_SANS_ATTENTE"] = "1"
            with mock.patch.object(dispatch, "attendre_en_fond",
                                   lambda t, s: None if sans_attente else dispatch.ROOT / "run" / "attentes" / "p.log"):
                dispatch.main(["T1", "T2", "--projet", "p"])
        return sortie.getvalue()

    def test_ligne_reveil_chef(self):
        self.assertIn("réveil chef : ./bin/agentx attendre T1 T2 --projet p --tout --integrer --sans-relance  (Bash run_in_background)\n",
                      self.lancer_main(False))

    def test_pas_de_ligne_sans_attente(self):
        self.assertNotIn("réveil chef", self.lancer_main(True))


if __name__ == "__main__":
    unittest.main()
