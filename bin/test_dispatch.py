"""Tests de dispatch / agents : faux `claude`, vault de banc sous .cache/banc-T081 (AGENTX_ROOT).

Lancer : python3 -m unittest bin/test_dispatch.py
Le vrai vault et le vrai run/ ne sont jamais touches : AGENTX_ROOT pointe sur le banc,
AGENTX_CLAUDE sur un script qui journalise son argv et imprime un id de session.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = DEPOT / ".cache" / "banc-T081" / f"b{os.getpid()}"
JOURNAL = BANC / "claude.argv.jsonl"
FAUX = BANC / "claude"
EXT = Path(tempfile.mkdtemp(prefix="agentx-ext-"))   # depots externes : hors ROOT et hors du .git d'AgentX

os.environ.update(AGENTX_ROOT=str(BANC), AGENTX_CLAUDE=str(FAUX), BANC_JOURNAL=str(JOURNAL))
sys.path.insert(0, str(ICI))
import agents      # noqa: E402  (ROOT lu de l'env au-dessus)
import dispatch    # noqa: E402

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
∅
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
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py"):
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
        attendu = ["--bg", "--agent", "implementeur", "--name", "agentx-banc-T001",
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

    def test_refus_8_mort_puis_relancer(self):
        tache("T006")
        fiche("T006", "bbbbbbbb")
        r = run("T006", "--projet", "banc")
        self.assertEqual((r.returncode, r.stdout), (1, "T006 KO agent mort : agentx dispatch --relancer T006\n"))
        r = run("--relancer", "T006", "--projet", "banc")
        self.assertEqual((r.returncode, r.stdout), (0, "T006 OK bbbbbbbb implementeur dontAsk\n"))
        argv = [json.loads(l) for l in JOURNAL.read_text(encoding="utf-8").splitlines()]
        self.assertIn(["respawn", "bbbbbbbb"], argv)
        self.assertEqual(journal_bg(), [])
        self.assertEqual(statut_de("T006"), "en-cours")

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
                                 "etat": "blocked", "depuis": "2026-10-16T10:00:00", "id": "dddddddd"})


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


class TestAgents(unittest.TestCase):
    def test_etat_et_vivant(self):
        f = fiche("T030", "eeeeeeee")
        self.assertEqual(agents.etat(f, []), "stopped")
        self.assertEqual(agents.etat(f, [{"id": "eeeeeeee99", "state": "done"}]), "done")
        self.assertEqual(agents.etat(f, [{"name": "agentx-banc-T030", "state": "working"}]), "working")
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


if __name__ == "__main__":
    unittest.main()
