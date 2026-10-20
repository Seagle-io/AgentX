#!/usr/bin/env python3
"""Tests lot 3 L-back : dash._demandes, actions demande-fermer/demande-lier, `vx set --demande`.
Fixtures tmp : le vrai run/demandes.jsonl et le vrai vault ne sont jamais touchés en écriture."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
TMP = Path(tempfile.mkdtemp())
RUN = TMP / "run"
BANC = TMP / "banc"
os.environ["AGENTX_ROOT"] = str(TMP)
os.environ["AGENTX_RUN_DIR"] = str(RUN)
sys.path.insert(0, str(ICI))
import dash  # noqa: E402
import demandes  # noqa: E402


def ecrire_jsonl(lignes: list):
    RUN.mkdir(parents=True, exist_ok=True)
    demandes.FICHIER.write_text("".join(l if isinstance(l, str) else json.dumps(l) + "\n" for l in lignes),
                                encoding="utf-8")


def dem(i, t, statut="ouverte", texte="x"):
    return {"id": i, "t": t, "texte": texte, "statut": statut}


def setUpModule():
    (BANC / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "frontmatter.py", "agents.py",
              "terminal.py", "voix.py", "demandes.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(DEPOT / "roles.json", BANC / "roles.json")
    (BANC / "vault" / "_templates").mkdir(parents=True)
    for f in ("task.md", "context.md"):
        shutil.copy(DEPOT / "vault" / "_templates" / f, BANC / "vault" / "_templates" / f)
    (BANC / "vault" / "projets" / "banc").mkdir(parents=True)


def tearDownModule():
    shutil.rmtree(TMP, ignore_errors=True)


def vx(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(BANC / "bin" / "vx.py"), *args],
                          capture_output=True, text=True, cwd=str(BANC))


class Etat(unittest.TestCase):
    def test_jsonl_absent(self):
        demandes.FICHIER.unlink(missing_ok=True)
        self.assertEqual(dash._demandes(), ([], 0))

    def test_fermee_corrompue_ouvertes_tri(self):
        ecrire_jsonl([dem("D001", "2026-10-20T08:00:00", "fermee"), "pas du json\n",
                      dem("D002", "2026-10-20T09:00:00"), dem("D003", "2026-10-20T10:00:00")])
        vues, total = dash._demandes()
        self.assertEqual(([d["id"] for d in vues], total), (["D003", "D002"], 2))
        self.assertEqual(vues[0]["taches"], [])

    def test_texte_tronque(self):
        ecrire_jsonl([dem("D001", "2026-10-20T08:00:00", texte="a" * 2500)])
        self.assertEqual(len(dash._demandes()[0][0]["texte"]), 2001)

    def test_plafond(self):
        ecrire_jsonl([dem(f"D{i:03d}", f"2026-10-20T08:{i:02d}:00") for i in range(1, 26)])
        vues, total = dash._demandes()
        self.assertEqual((len(vues), total, vues[0]["id"]), (20, 25, "D025"))

    def test_exception(self):
        with unittest.mock.patch.object(dash, "_demandes_vue", side_effect=OSError):
            self.assertEqual(dash._demandes(), ([], 0))


class Argv(unittest.TestCase):
    def test_fermer(self):
        self.assertEqual(dash.construire_argv({"action": "demande-fermer", "demande": "D007"}),
                         ["demande", "fermer", "D007"])

    def test_lier(self):
        with unittest.mock.patch.object(dash, "_projet_connu", lambda p: p):
            self.assertEqual(dash.construire_argv(
                {"action": "demande-lier", "demande": "D007", "tid": "T212", "projet": "agentx"}),
                ["set", "T212", "--demande", "D007", "--projet", "agentx"])

    def test_demande_invalide(self):
        for action in ("demande-fermer", "demande-lier"):
            with self.assertRaisesRegex(ValueError, "demande invalide : X1"):
                dash.construire_argv({"action": action, "demande": "X1"})

    def test_tid_invalide(self):
        with self.assertRaisesRegex(ValueError, "identifiant de tache invalide : 212"):
            dash.construire_argv({"action": "demande-lier", "demande": "D001", "tid": "212", "projet": "banc"})


class SetDemande(unittest.TestCase):
    def test_lier(self):
        ecrire_jsonl([dem("D001", "2026-10-20T08:00:00")])
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur")
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        env = {**os.environ, "AGENTX_RUN_DIR": str(RUN)}
        run = lambda *a: subprocess.run([sys.executable, str(BANC / "bin" / "vx.py"), *a],
                                        capture_output=True, text=True, cwd=str(BANC), env=env)
        r = run("set", tid, "--demande", "D001", "--projet", "banc")
        self.assertEqual((r.returncode, r.stdout.strip()), (0, f"{tid}  demande D001"), r.stderr)
        task = next((BANC / "vault/projets/banc/taches").glob(f"{tid}-*")) / "task.md"
        self.assertIn("demande: D001", task.read_text(encoding="utf-8"))
        r = run("demande", "liste", "--json")
        self.assertEqual(json.loads(r.stdout)[0]["taches"], [tid])
        self.assertEqual(run("set", tid, "--demande", "D999", "--projet", "banc").returncode, 2)
        r = run("set", tid, "--demande", "D001", "--statut", "abandonne", "--projet", "banc")
        self.assertIn("set : --demande seul", r.stderr)


if __name__ == "__main__":
    unittest.main()
