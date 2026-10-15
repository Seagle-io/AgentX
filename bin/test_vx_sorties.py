"""Tests e2e de vx set : purge de .sorties/<projet-vault>/<TID> quand la famille est close.

Lancer : python3 -m unittest bin/test_vx_sorties.py
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)


class TestPurgeSorties(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, True)
        os.makedirs(os.path.join(self.tmp, "bin"))
        shutil.copy(os.path.join(ICI, "vx.py"), os.path.join(self.tmp, "bin", "vx.py"))
        shutil.copytree(os.path.join(RACINE, "vault", "_templates"),
                        os.path.join(self.tmp, "vault", "_templates"))
        self.vx("init")
        self.vx("projet", "p-un")

    def vx(self, *args):
        r = subprocess.run([sys.executable, os.path.join(self.tmp, "bin", "vx.py"), *args],
                           cwd=self.tmp, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        return r.stdout

    def tache(self, titre, role, *extra):
        self.vx("tache", "--projet", "p-un", "--role", role, *extra, titre)

    def sortie(self, tid, projet="p-un"):
        p = os.path.join(self.tmp, ".sorties", projet, tid)
        os.makedirs(p, exist_ok=True)
        with open(os.path.join(p, "x.txt"), "w") as fh:
            fh.write("x")
        return p

    def set(self, tid, statut):
        return self.vx("set", tid, "--statut", statut, "--projet", "p-un")

    def test_famille_ouverte_puis_close(self):
        self.tache("Impl", "implementeur", "--sans-critique", "x")  # T001 + T002 verificateur
        racine, enfant = self.sortie("T001"), self.sortie("T002")
        sortie = self.set("T001", "fait")                            # (a)
        self.assertNotIn("sorties purgees", sortie)
        self.assertTrue(os.path.isdir(racine))
        self.assertTrue(os.path.isdir(enfant))
        sortie = self.set("T002", "fait")                            # (b)
        self.assertIn("sorties purgees : T001 T002", sortie)
        self.assertFalse(os.path.exists(racine))
        self.assertFalse(os.path.exists(enfant))

    def test_sans_enfant_fait(self):                                 # (c)
        self.tache("Eclairer", "eclaireur")
        p = self.sortie("T001")
        self.assertIn("sorties purgees : T001", self.set("T001", "fait"))
        self.assertFalse(os.path.exists(p))

    def test_abandon_du_dernier_ouvert(self):                        # (d)
        self.tache("Impl", "implementeur", "--sans-critique", "x")
        self.set("T001", "fait")
        racine = self.sortie("T001")
        self.assertIn("sorties purgees : T001", self.set("T002", "abandonne"))
        self.assertFalse(os.path.exists(racine))

    def test_dossier_absent(self):                                   # (e)
        self.tache("Eclairer", "eclaireur")
        self.assertNotIn("sorties purgees", self.set("T001", "fait"))

    def test_autre_projet_intact(self):                              # (f)
        self.tache("Eclairer", "eclaireur")
        self.sortie("T001")
        autre = self.sortie("T001", projet="p-deux")
        self.set("T001", "fait")
        self.assertTrue(os.path.isfile(os.path.join(autre, "x.txt")))

    def test_aucune_purge_hors_fait(self):
        self.tache("Eclairer", "eclaireur")
        p = self.sortie("T001")
        self.set("T001", "revue")
        self.assertTrue(os.path.isdir(p))

    def test_lien_retire_cible_intacte(self):
        self.tache("Impl", "implementeur", "--sans-critique", "x")
        cible = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, cible, True)
        with open(os.path.join(cible, "x.txt"), "w") as fh:
            fh.write("x")
        lien = os.path.join(self.tmp, ".sorties", "p-un", "T002")
        os.makedirs(os.path.dirname(lien), exist_ok=True)
        os.symlink(cible, lien)
        self.set("T001", "fait")
        self.assertIn("sorties purgees : T002", self.set("T002", "fait"))
        self.assertFalse(os.path.lexists(lien))
        self.assertTrue(os.path.isfile(os.path.join(cible, "x.txt")))


if __name__ == "__main__":
    unittest.main()
