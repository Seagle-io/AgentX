"""Tests de identite.py : registre des préfixes, appelant, battement, propriété. 0 écriture dans le vrai vault.

Lancer : python3 -m unittest bin/test_identite.py
Banc jetable .cache/banc-identite/b<pid> : identite.CHEFS y est patché.
"""

import contextlib
import io
import os
import shutil
import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))

import identite  # noqa: E402

BANC = ICI.parent / ".cache" / "banc-identite" / f"b{os.getpid()}"
T0 = datetime(2026, 11, 17, 14, 32, 5)


class Base(unittest.TestCase):
    def setUp(self):
        self.chefs = BANC / self._testMethodName / "vault" / "chefs"
        self.addCleanup(shutil.rmtree, BANC, True)
        for p in (mock.patch.object(identite, "CHEFS", self.chefs),
                  mock.patch.dict(os.environ, AGENTX_MACHINE="pc-a")):
            p.start()
            self.addCleanup(p.stop)
        os.environ.pop("AGENTX_CHEF", None)

    def poser(self, prefixe: str, machine: str, nom: str | None = None):
        self.chefs.mkdir(parents=True, exist_ok=True)
        (self.chefs / (nom or f"{prefixe}.md")).write_text(
            f"---\nprefixe: {prefixe}\nmachine: {machine}\ncree: 2026-11-17\ntags: [chef]\n---\n", encoding="utf-8")

    def assertErreur(self, fn, cls, code: str, message: str):
        with self.assertRaises(cls) as cm:
            fn()
        self.assertEqual((cm.exception.code, cm.exception.message, str(cm.exception)), (code, message, message))


class Registre(Base):
    def test_vide_mode_ancien(self):
        self.assertEqual(identite.registre(), {})
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            self.assertIsNone(identite.prefixe_pour_creer())
        self.assertEqual(err.getvalue(), "~ machine pc-a sans préfixe : ID T0xx (collision possible à plusieurs "
                                         "machines) — ./bin/agentx prefixe <ABC>\n")
        self.assertIsNone(identite.prefixe_machine())

    def test_declarer(self):
        chemin = identite.declarer("MAR")
        self.assertEqual(chemin, self.chefs / "MAR.md")
        self.assertTrue(chemin.read_text(encoding="utf-8").startswith(
            f"---\nprefixe: MAR\nmachine: pc-a\ncree: {datetime.now():%Y-%m-%d}\ntags: [chef]\n---\n"))
        self.assertEqual(identite.registre(), {"MAR": "pc-a"})
        self.assertEqual((identite.prefixe_machine(), identite.prefixe_pour_creer()), ("MAR", "MAR"))

    def test_conflicted_copy_ignore(self):
        self.poser("MAR", "pc-a")
        self.poser("MAR", "pc-a", "MAR (conflicted copy 2026-11-17 143205).md")
        self.poser("ABC", "pc-a", "ABC (conflicted copy).md")
        self.assertEqual(identite.registre(), {"MAR": "pc-a"})
        self.assertEqual(identite.prefixe_machine(), "MAR")

    def test_dossier_battement_et_nom_hors_motif_ignores(self):
        self.poser("MAR", "pc-a")
        (self.chefs / "MAR").mkdir()
        self.poser("mar", "pc-b", "notes.md")
        self.assertEqual(identite.registre(), {"MAR": "pc-a"})

    def test_prefixe_invalide(self):
        for p in ("mar", "MA", "MARS", "M4R", ""):
            with self.subTest(p):
                self.assertErreur(lambda: identite.declarer(p), identite.IdentiteErreur, "prefixe-invalide",
                                  f"refus : préfixe {p} invalide (3 lettres A-Z)")
        self.assertFalse(self.chefs.exists())

    def test_prefixe_pris(self):
        self.poser("SYL", "pc-b")
        self.assertErreur(lambda: identite.declarer("SYL"), identite.IdentiteErreur, "prefixe-pris",
                          "refus : préfixe SYL déjà pris par la machine pc-b")

    def test_prefixe_double(self):
        identite.declarer("MAR")
        for p in ("ABC", "MAR"):
            with self.subTest(p):
                self.assertErreur(lambda: identite.declarer(p), identite.IdentiteErreur, "prefixe-double",
                                  "refus : la machine pc-a a déjà le préfixe MAR")
        self.poser("ABC", "pc-a")
        self.assertErreur(identite.prefixe_machine, identite.IdentiteErreur, "prefixe-double",
                          "refus : la machine pc-a a déjà le préfixe ABC, MAR")

    def test_prefixe_requis(self):
        self.poser("SYL", "pc-b")
        self.poser("MAR", "pc-c")
        self.assertIsNone(identite.prefixe_machine())
        self.assertErreur(identite.prefixe_pour_creer, identite.IdentiteErreur, "prefixe-requis",
                          "refus : machine pc-a sans préfixe alors que MAR, SYL en ont un — ./bin/agentx prefixe <ABC>")

    def test_machine_hostname_par_defaut(self):
        os.environ.pop("AGENTX_MACHINE")
        with mock.patch.object(identite.socket, "gethostname", return_value="h1"):
            self.assertEqual(identite.machine(), "h1")


class AppelantT(Base):
    def test_chef_et_libelle(self):
        A = identite.Appelant
        self.assertEqual((A("marianne", "MAR").chef(), A("marianne", "MAR").libelle()), ("marianne@MAR",) * 2)
        self.assertEqual((A(None, "MAR").chef(), A(None, "MAR").libelle()), ("defaut@MAR", "humain@MAR"))
        self.assertEqual((A("x", None).chef(), A("x", None).libelle()), (None, "machine pc-a sans préfixe"))

    def test_appelant_env(self):
        self.poser("MAR", "pc-a")
        self.assertEqual(identite.appelant(), identite.Appelant(None, "MAR"))
        os.environ["AGENTX_CHEF"] = "marianne"
        self.assertEqual(identite.appelant(), identite.Appelant("marianne", "MAR"))
        os.environ["AGENTX_CHEF"] = ""
        self.assertEqual(identite.appelant().cle, None)


class Battement(Base):
    def test_sans_prefixe_rien(self):
        identite.battre("marianne")
        self.assertFalse(self.chefs.exists())
        self.assertEqual(identite.dernier_signe("marianne@MAR"), (None, "inconnu"))

    def test_battre_puis_dernier_signe(self):
        self.poser("MAR", "pc-a")
        identite.battre("marianne", maintenant=T0)
        f = self.chefs / "MAR" / "marianne.md"
        self.assertEqual(f.read_text(encoding="utf-8"),
                         "---\nchef: marianne@MAR\nvu: 2026-11-17T14:32:05\netat: vivant\n---\n")
        self.assertEqual(identite.dernier_signe("marianne@MAR"), (T0, "vivant"))
        self.assertEqual(identite.signe("marianne@MAR"), "vu 2026-11-17 14:32")
        identite.battre("marianne", "arrete", maintenant=T0)
        self.assertEqual(identite.dernier_signe("marianne@MAR"), (T0, "arrete"))
        self.assertEqual(identite.signe("marianne@MAR"), "arrêté 2026-11-17 14:32")
        self.assertEqual(os.listdir(self.chefs / "MAR"), ["marianne.md"])
        for inconnu in ("autre@MAR", "marianne@SYL", "sans-arobase", "@MAR"):
            self.assertEqual(identite.dernier_signe(inconnu), (None, "inconnu"), inconnu)
        self.assertEqual(identite.signe("autre@MAR"), "jamais vu")

    def test_battre_atomique(self):
        self.poser("MAR", "pc-a")
        identite.battre("marianne", maintenant=T0)
        avant = (self.chefs / "MAR" / "marianne.md").read_text(encoding="utf-8")
        with mock.patch("os.replace", side_effect=OSError("disque plein")), self.assertRaises(OSError):
            identite.battre("marianne", "arrete")
        self.assertEqual((self.chefs / "MAR" / "marianne.md").read_text(encoding="utf-8"), avant)

    def test_vu_illisible_jamais_vu(self):
        (self.chefs / "MAR").mkdir(parents=True)
        (self.chefs / "MAR" / "marianne.md").write_text("---\nchef: marianne@MAR\nvu: hier\netat: vivant\n---\n",
                                                        encoding="utf-8")
        self.assertEqual(identite.dernier_signe("marianne@MAR"), (None, "vivant"))


class Propriete(Base):
    MAR = {"id": "MAR-T001", "chef": "marianne@MAR"}

    def test_proprietaire(self):
        self.assertEqual(identite.proprietaire(self.MAR), "marianne@MAR")
        for libre in ({}, {"chef": ""}, {"chef": "  "}):
            self.assertIsNone(identite.proprietaire(libre))

    def test_autorise(self):
        A = identite.Appelant
        cas = [({"id": "T001"}, A("bob", "SYL"), True),
               (self.MAR, A("bob", "SYL"), False), (self.MAR, A(None, "SYL"), False), (self.MAR, A("x", None), False),
               (self.MAR, A(None, "MAR"), True), (self.MAR, A("marianne", "MAR"), True),
               (self.MAR, A("bob", "MAR"), False), ({"chef": "defaut@MAR"}, A("defaut", "MAR"), True)]
        for meta, qui, attendu in cas:
            with self.subTest(meta=meta, qui=qui):
                self.assertIs(identite.autorise(meta, qui), attendu)

    def test_exiger_proprio_message(self):
        self.poser("MAR", "pc-a")
        identite.battre("marianne", "arrete", maintenant=T0)
        self.assertErreur(lambda: identite.exiger_proprio(self.MAR, "set", "banc", identite.Appelant("bob", "MAR")),
                          identite.ProprieteRefus, "chef-proprietaire",
                          "refus : MAR-T001 appartient au chef marianne@MAR (arrêté 2026-11-17 14:32) — set refusé "
                          "depuis bob@MAR ; reprise si arrêté > 2 h : ./bin/agentx reprendre MAR-T001 --projet banc "
                          "--raison \"<…>\"")

    def test_exiger_proprio_appelant_par_defaut(self):
        self.poser("SYL", "pc-a")
        self.assertErreur(lambda: identite.exiger_proprio(self.MAR, "virer", "banc"),
                          identite.ProprieteRefus, "chef-proprietaire",
                          "refus : MAR-T001 appartient au chef marianne@MAR (jamais vu) — virer refusé depuis "
                          "humain@SYL ; reprise si arrêté > 2 h : ./bin/agentx reprendre MAR-T001 --projet banc "
                          "--raison \"<…>\"")
        identite.exiger_proprio({"id": "T001"}, "virer", "banc")   # libre : 0 lecture du registre requise

    def test_libre_sans_registre_lisible(self):
        with mock.patch.object(identite, "prefixe_machine", side_effect=AssertionError("lu")):
            identite.exiger_proprio({"id": "T001"}, "set", "banc")


if __name__ == "__main__":
    unittest.main()
