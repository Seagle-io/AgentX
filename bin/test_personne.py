"""Tests vault partage : identite (personne.py), porteur, par:, journal signe, conflits de synchro.

Lancer : python3 -m unittest bin/test_personne.py
Banc jetable .cache/banc-personne/b<pid> : le vrai vault n'est jamais touche,
le fichier d'identite du banc remplace ~/.config/agentx/personne.
"""

import os
import shutil
import subprocess
import sys
import unittest
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = DEPOT / ".cache" / "banc-personne" / f"b{os.getpid()}"
VAULT = BANC / "vault"
FICHIER = BANC / "personne"

sys.path.insert(0, str(ICI))
import personne  # noqa: E402


def setUpModule():
    (BANC / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "chemins.py", "frontmatter.py", "agents.py",
              "terminal.py", "voix.py", "demandes.py", "tid.py", "identite.py", "partage.py", "personne.py",
              "trello.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(DEPOT / "roles.json", BANC / "roles.json")
    (VAULT / "_templates").mkdir(parents=True)
    for f in ("task.md", "context.md", "brief.md", "plan.md"):
        shutil.copy(DEPOT / "vault" / "_templates" / f, VAULT / "_templates" / f)


def tearDownModule():
    shutil.rmtree(BANC)


def vx(*args: str, qui: str | None = "julien") -> subprocess.CompletedProcess:
    """qui=None : AGENTX_PERSONNE absente (fichier du banc, puis git)."""
    env = {k: v for k, v in os.environ.items() if k != "AGENTX_PERSONNE"}
    env["AGENTX_PERSONNE_FICHIER"] = str(FICHIER)
    if qui is not None:
        env["AGENTX_PERSONNE"] = qui
    return subprocess.run([sys.executable, str(BANC / "bin" / "vx.py"), *args],
                          capture_output=True, text=True, cwd=str(BANC), env=env)


def ok(*args: str, qui: str | None = "julien") -> str:
    r = vx(*args, qui=qui)
    assert r.returncode == 0, r.stderr
    return r.stdout


def lire(chemin: Path) -> str:
    """journal.md : ancien fichier + journal/<machine>.md (journal par machine, partage.fichier_machine)."""
    if chemin.name == "journal.md":
        morceaux = [chemin] if chemin.is_file() else []
        morceaux += sorted((chemin.parent / "journal").glob("*.md"))
        return "".join(f.read_text(encoding="utf-8") for f in morceaux)
    return chemin.read_text(encoding="utf-8")


class Identite(unittest.TestCase):
    def test_normaliser(self):
        self.assertEqual(personne.normaliser("Julien Drac"), "julien-drac")
        self.assertEqual(personne.normaliser("Élodie"), "elodie")
        self.assertEqual(personne.normaliser("  "), "")
        self.assertEqual(personne.normaliser("x" * 33), "")

    def test_ordre_env_fichier_git(self):
        f = BANC / "id-ordre"
        with mock.patch.dict(os.environ, {"AGENTX_PERSONNE_FICHIER": str(f)}), \
                mock.patch.object(personne, "_git", return_value="gitnom"):
            os.environ.pop("AGENTX_PERSONNE", None)
            self.assertEqual(personne.courante_et_source(), ("gitnom", "git"))
            self.assertEqual(personne.definir("Sylvain"), "sylvain")
            self.assertEqual(personne.courante_et_source(), ("sylvain", "fichier"))
            os.environ["AGENTX_PERSONNE"] = "Julien"
            self.assertEqual(personne.courante_et_source(), ("julien", "env"))
            os.environ["AGENTX_PERSONNE"] = ""          # posee vide : inconnu voulu
            self.assertEqual(personne.courante(), "")
            self.assertEqual(personne.suffixe(), "")
        with self.assertRaises(ValueError):
            personne.definir("!!")

    def test_moi(self):
        self.assertIn("identite : sylvain", ok("moi", "Sylvain", qui=None))
        self.assertEqual(lire(FICHIER), "sylvain\n")
        self.assertIn("sylvain  (source : fichier", ok("moi", qui=None))
        self.assertEqual(vx("moi", qui="").returncode, 3)
        FICHIER.unlink()


class Porteur(unittest.TestCase):
    def setUp(self):
        self.slug = f"p{self._testMethodName[-12:].replace('_', '')}"
        ok("projet", self.slug, "--titre", "Essai")
        self.proj = VAULT / "projets" / self.slug

    def tache(self, titre: str, qui: str = "julien") -> subprocess.CompletedProcess:
        return vx("tache", titre, "--projet", self.slug, "--role", "eclaireur", qui=qui)

    def test_projet_et_tache_signes(self):
        self.assertIn("porteur: julien", lire(self.proj / "brief.md"))
        r = self.tache("Premiere")
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        self.assertIn("par: julien", lire(next((self.proj / "taches").glob(f"{tid}-*")) / "task.md"))
        jr = lire(self.proj / "journal.md")
        self.assertIn("projet cree (Essai) · @julien", jr)
        self.assertRegex(jr, rf"(?m)^- `[\d\- :]+` {tid} creee — Premiere \[eclaireur\] · @julien$")
        index = lire(VAULT / "INDEX.md")
        self.assertIn("· porteur : julien", index)
        self.assertRegex(index, rf"\| \[{tid}\]\([^)]*\) \| eclaireur \| a-faire \| julien \| Premiere \|")

    def test_projet_d_un_autre_refuse_puis_repris(self):
        r = self.tache("Intrus", qui="sylvain")
        self.assertEqual(r.returncode, 1)
        self.assertIn("porte par julien (vous : sylvain)", r.stderr)
        self.assertIn(f"agentx porteur {self.slug} sylvain", r.stderr)
        self.assertFalse(any((self.proj / "taches").iterdir()))   # refus avant toute ecriture
        self.assertIn("porteur julien -> sylvain", ok("porteur", self.slug, qui="sylvain"))
        self.assertIn("porteur : julien -> sylvain · @sylvain", lire(self.proj / "journal.md"))
        self.assertEqual(self.tache("Repris", qui="sylvain").returncode, 0)
        self.assertEqual(self.tache("Plus a moi", qui="julien").returncode, 1)

    def test_inconnus_ni_signe_ni_refus(self):
        ok("porteur", self.slug, "-")
        self.assertNotIn("porteur:", lire(self.proj / "brief.md"))
        r = self.tache("Anonyme", qui="")
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        self.assertNotIn("par:", lire(next((self.proj / "taches").glob(f"{tid}-*")) / "task.md"))
        self.assertRegex(lire(self.proj / "journal.md"), rf"(?m)^- `[\d\- :]+` {tid} creee — Anonyme \[eclaireur\]$")
        self.assertEqual(self.tache("Sans porteur", qui="sylvain").returncode, 0)   # projet d'avant : libre
        board = ok("board", "--projet", self.slug)
        self.assertIn("· porteur —", board)
        self.assertRegex(board, rf"{tid}\s+eclaireur\s+a-faire\s+-\s")

    def test_board_filtre(self):
        self.assertIn(f"== {self.slug} ", ok("board", "--porteur", "moi"))
        self.assertNotIn(f"== {self.slug} ", ok("board", "--porteur", "sylvain"))
        self.assertNotIn(f"== {self.slug} ", ok("board", "--porteur", "-"))

    def test_id_compte_les_dossiers_recus_sans_task(self):
        (self.proj / "taches" / "T007-recu-de-l-autre-machine").mkdir(parents=True)
        self.assertTrue(self.tache("Apres").stdout.startswith("T008 "))

    def test_ready_et_doctor_ignorent_le_projet_d_un_autre(self):
        tid = self.tache("En cours ailleurs").stdout.split()[0]
        ok("set", tid, "--statut", "en-cours", "--projet", self.slug, "--force")
        alerte = f"{self.slug}/{tid} : en-cours, prete mais aucun agent lance"
        self.assertIn(alerte, vx("doctor").stdout)                # porteur = moi : alerte gardee
        self.assertNotIn(alerte, vx("doctor", qui="sylvain").stdout)   # agents chez julien : run/ local muet
        r = vx("ready", qui="sylvain")
        self.assertIn("projets portes par d'autres, ignores : ", r.stderr)
        self.assertIn(self.slug, r.stderr)

    def test_verrou_hors_vault(self):
        self.tache("Verrou")
        self.assertFalse((self.proj / ".verrou").exists())
        self.assertTrue((BANC / "run" / "verrous" / f"{self.slug}.verrou").exists())


class ConflitsSynchro(unittest.TestCase):
    def test_doctor_et_board(self):
        ok("projet", "conflits", "--titre", "Conflits")
        proj = VAULT / "projets" / "conflits"
        copie = proj / "journal (conflicted copy 2026-10-30 101500).md"
        copie.write_text("x", encoding="utf-8")
        (proj / "node_modules").mkdir()
        (proj / "node_modules" / "a (conflicted copy 2026-10-30 101500).js").write_text("", encoding="utf-8")
        try:
            r = vx("doctor")
            self.assertIn("conflit-sync vault/projets/conflits/journal (conflicted copy 2026-10-30 101500).md",
                          r.stdout)
            self.assertNotIn("node_modules", r.stdout)
            self.assertIn("! conflits de synchro : 1 copie(s)", ok("board"))
        finally:
            copie.unlink()
        self.assertNotIn("conflits de synchro", ok("board"))


if __name__ == "__main__":
    unittest.main()
