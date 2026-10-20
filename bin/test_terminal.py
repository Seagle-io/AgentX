"""Tests de terminal.py : chefs multiples (clé, étages, compte), consigne, démon réel. 0 `claude` lancé.

    python3 -m unittest bin/test_terminal.py
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))

import agents      # noqa: E402
import terminal    # noqa: E402

BANC = ICI.parent / ".sorties" / "agentx" / "T159"      # chemins de socket courts (< 100 car.)


def chef(cle: str, vivant: bool | None = True, projets: dict | None = None, compte: str = "defaut") -> dict:
    projets = projets or {}
    return {"cle": cle, "defaut": cle == "defaut", "vivant": vivant, "etages": list(projets), "projets": projets,
            "pid": None, "depuis": None, "compte": compte}


class Base(unittest.TestCase):
    def setUp(self):
        BANC.mkdir(parents=True, exist_ok=True)
        self.tmp = Path(tempfile.mkdtemp(dir=BANC))
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.etat = self.tmp / ".local" / "state"
        self.etat.mkdir(parents=True)
        p = mock.patch.object(terminal, "_dossier_etat", return_value=str(self.etat))
        p.start()
        self.addCleanup(p.stop)

    def assertRefus(self, fn, code: str, http: int, rc: int, message: str):
        with self.assertRaises(terminal.ChefRefus) as cm:
            fn()
        e = cm.exception
        self.assertEqual((e.code, e.http, e.rc, e.message, str(e)), (code, http, rc, message, message))


class Identite(unittest.TestCase):
    def test_re_cle(self):
        for ok in ("a", "bureau", "o-w", "0x", "a" * 24):
            self.assertTrue(terminal.RE_CLE.fullmatch(ok), ok)
        for ko in ("", "-a", "A", "a_b", "a" * 25, "a b"):
            self.assertFalse(terminal.RE_CLE.fullmatch(ko), ko)

    def test_chemin_socket_defaut_est_celui_de_head(self):
        head = os.path.join(os.path.expanduser("~"), ".local", "state", "agentx-chef.sock")
        self.assertEqual(terminal.chemin_socket(), head)
        self.assertEqual(terminal.chemin_socket(terminal.DEFAUT), head)
        self.assertEqual(terminal._chemin_socket("/ailleurs"), head)
        self.assertEqual(terminal.chemin_journal(), head[:-5] + ".log")
        self.assertEqual(terminal.chemin_socket("bis"), head[:-5] + "-bis.sock")
        self.assertEqual(terminal.chemin_journal("bis"), head[:-5] + "-bis.log")


class Consigne(unittest.TestCase):
    ETAGES = {"agentx": ["agentx"], "ortho": ["o1", "o2"]}

    def test_defaut(self):
        c = terminal.consigne_chef("defaut", {})
        self.assertIn("CHEF DE PROJET AgentX par défaut", c)
        self.assertIn("`./bin/agentx chef liste` dit quels étages sont tenus par un autre chef", c)
        self.assertNotIn("seul chef de l'immeuble", c)
        self.assertNotIn("demande à l'utilisateur sur quel étage", c)
        self.assertIn("Ne pose jamais de question bloquante", c)
        self.assertIn("Plusieurs étages vivent en même temps", c)
        self.assertIn("L'affectation des étages peut changer pendant ta session", c)

    def test_dedie(self):
        c = terminal.consigne_chef("bureau", self.ETAGES)
        self.assertIn("CHEF DE PROJET AgentX « bureau », seul chef de tes étages : agentx (agentx); ortho (o1, o2).", c)
        self.assertIn("l'état de tes étages (`./bin/agentx board --projet agentx`, "
                      "`./bin/agentx board --projet o1`, `./bin/agentx board --projet o2`)", c)
        self.assertNotIn("seul chef de l'immeuble", c)
        self.assertNotIn("AgentX par défaut", c)
        self.assertIn("Ne pose jamais de question bloquante", c)
        self.assertIn("Plusieurs étages vivent en même temps", c)
        self.assertIn("L'affectation des étages peut changer pendant ta session", c)

    def test_programme(self):
        head = "Bonjour, je suis dans la salle des agents. Présente-toi et fais le point sur les étages de l'immeuble."
        self.assertEqual(terminal.programme("defaut", {}),
                         ["claude", "--append-system-prompt", terminal.consigne_chef("defaut", {}), head])
        self.assertEqual(terminal.programme("bureau", self.ETAGES),
                         ["claude", "--append-system-prompt", terminal.consigne_chef("bureau", self.ETAGES),
                          "Bonjour, je suis dans la salle des agents. Présente-toi et fais le point sur tes étages : agentx, ortho."])


class Refus(Base):
    def test_les_11_codes(self):
        pl = [chef("defaut"), chef("a", projets={"x": ["p"]}), chef("b"), chef("c")]
        cas = [
            ("plafond", 409, 3, "refus : 3 chefs vivants (plafond) — arrête-en un : agentx chef arreter <cle>",
             lambda: terminal._verifier_plafond(pl)),
            ("etage-tenu", 409, 3, "refus : étage x déjà tenu par le chef a",
             lambda: self.ouvrir({"x": ["p"]}, "n", [chef("defaut"), chef("a", projets={"x": ["p"]})])),
            ("cle-prise", 409, 3, "refus : chef a existe déjà",
             lambda: self.ouvrir({"y": ["p"]}, "a", [chef("defaut"), chef("a")])),
            ("cle-invalide", 400, 2, "clé invalide : Bad (a-z0-9-, ≤ 24, ≠ defaut)",
             lambda: terminal.ouvrir_chef("/x", {"y": ["p"]}, "Bad")),
            ("etage-inconnu", 400, 2, "étage inconnu : (aucun)", lambda: terminal.ouvrir_chef("/x", {})),
            ("chef-inconnu", 404, 2, "chef inconnu : zz",
             lambda: terminal.arreter_chef("/x", "zz")),
            ("compte-invalide", 400, 2, "compte invalide : X (a-z0-9-, ≤ 24)",
             lambda: self.compte_ko("compte-invalide", "compte invalide : X (a-z0-9-, ≤ 24)")),
            ("compte-inconnu", 404, 2, "compte inconnu : u — à créer par toi : cmd",
             lambda: self.compte_ko("compte-inconnu", "compte inconnu : u — à créer par toi : cmd")),
            ("compte-deconnecte", 409, 3, "compte u non connecté — dans ton terminal : cmd",
             lambda: self.compte_ko("compte-deconnecte", "compte u non connecté — dans ton terminal : cmd")),
            ("compte-fige", 409, 3, "refus : chef bis tourne sous le compte defaut — arrête-le pour changer de compte",
             lambda: self.vivant("bis").demarrer(compte="u")),
            ("chef-mort", 409, 3, "refus : chef b non vivant — réaffectation impossible",
             lambda: self.reaffecter([chef("defaut"), chef("b", vivant=False)], "b")),
            ("compte-connecte", 409, 3, "compte u déjà connecté",
             lambda: self.compte_ko("compte-connecte", "compte u déjà connecté")),
            ("login-en-cours", 409, 3, "connexion déjà en cours : c0", lambda: self.login_en_cours()),
            ("login-absent", 404, 2, "aucune connexion en cours pour c", lambda: terminal.login_courant("c")),
            ("libelle-invalide", 400, 2, "libellé invalide : '' (1-32 caractères imprimables)",
             lambda: terminal.libeller_chef("/x", "defaut", "")),
        ]
        self.assertEqual({c[0] for c in cas}, set(terminal._HTTP_RC))
        with mock.patch.object(terminal.TerminalClient, "info", return_value=None):
            for code, http, rc, message, fn in cas:
                with self.subTest(code):
                    self.assertRefus(fn, code, http, rc, message)

    def test_etage_tenu_sous_verrou(self):
        verrou = mock.MagicMock()
        with mock.patch.object(terminal, "_verrou", return_value=verrou):
            self.assertRefus(lambda: self.ouvrir({"x": ["p"]}, "n", [chef("defaut"), chef("a", projets={"x": ["p"]})]),
                             "etage-tenu", 409, 3, "refus : étage x déjà tenu par le chef a")
        verrou.__enter__.assert_called_once()
        verrou.__exit__.assert_called_once()

    def ouvrir(self, etages, cle, chefs):
        with mock.patch.object(agents, "verifier_compte"), mock.patch.object(terminal, "lister_chefs", return_value=chefs), \
                mock.patch.object(terminal, "_lancer_demon", side_effect=AssertionError("démon lancé")):
            terminal.ouvrir_chef("/x", etages, cle)

    def compte_ko(self, code, message):
        with mock.patch.object(agents, "verifier_compte", side_effect=agents.CompteErreur(code, message)):
            terminal._verifier_compte("u")

    def vivant(self, cle):
        t = terminal.Terminal("/x", cle)
        t.pid = 1
        return t

    def login_en_cours(self):
        faux = mock.Mock(compte="c0")
        faux.vivant.return_value = True
        with mock.patch.object(terminal, "_COURANT", [faux]):
            terminal.ouvrir_login("/x", "c1")

    def reaffecter(self, chefs, vers):
        with mock.patch.object(terminal, "lister_chefs", return_value=chefs):
            terminal.reaffecter_etage("/x", "x", ["p"], vers)


class Ouvrir(Base):
    def test_plafond_compte_vivants_seulement(self):
        chefs = [chef("defaut", vivant=None), chef("a"), chef("b"), chef("c", vivant=False)]
        terminal._verifier_plafond(chefs)     # 2 vivants : pas de refus

    def test_ouvrir_chef_chemin_heureux(self):
        info = {"cle": "agentx", "vivant": True, "etages": {"agentx": ["agentx"]}, "pid": 7, "depuis": "d", "compte": "defaut"}
        with mock.patch.object(agents, "verifier_compte"), \
                mock.patch.object(terminal, "lister_chefs", return_value=[chef("defaut")]), \
                mock.patch.object(terminal, "_lancer_demon") as lancer, \
                mock.patch.object(terminal.TerminalClient, "_ouvrir") as ouvrir, \
                mock.patch.object(terminal.TerminalClient, "info", return_value=info):
            r = terminal.ouvrir_chef("/x", {"agentx": ["agentx"]}, cols=100, rows=20)
        lancer.assert_called_once_with("/x", "agentx", {"agentx": ["agentx"]}, "defaut")
        self.assertEqual(r["cle"], "agentx")
        self.assertEqual((r["etages"], r["projets"], r["pid"], r["defaut"]), (["agentx"], {"agentx": ["agentx"]}, 7, False))
        self.assertEqual(ouvrir.call_args.args, (100, 20, "defaut"))

    def test_cle_derivee_du_premier_etage(self):
        with mock.patch.object(agents, "verifier_compte"), \
                mock.patch.object(terminal, "lister_chefs", return_value=[chef("defaut")]), \
                mock.patch.object(terminal, "_lancer_demon") as lancer, \
                mock.patch.object(terminal.TerminalClient, "_ouvrir"), \
                mock.patch.object(terminal.TerminalClient, "info",
                                  return_value={"cle": "k", "vivant": True, "etages": {}, "pid": None, "depuis": None, "compte": "defaut"}):
            terminal.ouvrir_chef("/x", {"un-etage-au-nom-vraiment-trop-long-": ["p"]})
        self.assertEqual(lancer.call_args.args[1], "un-etage-au-nom-vraiment")

    def test_lister_chefs(self):
        for n in ("agentx-chef-b.sock", "agentx-chef-a.sock", "agentx-chef-mort.sock", "agentx-chef-Bad.sock", "agentx-chef.sock"):
            (self.etat / n).touch()
        table = {"b": {"cle": "b", "vivant": True, "etages": {"y": ["q"]}, "pid": 2, "depuis": "d", "compte": "u"},
                 "a": {"cle": "a", "vivant": False, "etages": {}, "pid": None, "depuis": None, "compte": "defaut"}}
        with mock.patch.object(terminal.TerminalClient, "info", autospec=True,
                               side_effect=lambda self, delai=1.0: table.get(self.cle)):
            chefs = terminal.lister_chefs("/x")
        self.assertEqual([c["cle"] for c in chefs], ["defaut", "a", "b"])
        self.assertEqual((chefs[0]["vivant"], chefs[0]["defaut"]), (None, True))
        self.assertEqual((chefs[2]["etages"], chefs[2]["projets"], chefs[2]["compte"]), (["y"], {"y": ["q"]}, "u"))


class Libelles(Base):
    def test_libeller_defaut_puis_effacer(self):
        terminal.libeller_chef("/x", "defaut", "session-sylvain")
        self.assertEqual(terminal.libelles(), {"defaut": "session-sylvain"})
        self.assertEqual(oct((self.etat / terminal.LIBELLES).stat().st_mode & 0o777), "0o600")
        terminal.libeller_chef("/x", "defaut", None)
        self.assertNotIn("defaut", terminal.libelles())

    def test_lister_chefs_porte_libelle(self):
        terminal.libeller_chef("/x", "defaut", "session-sylvain")
        with mock.patch.object(terminal.TerminalClient, "info", return_value=None):
            chefs = terminal.lister_chefs("/x")
        self.assertEqual(chefs[0]["libelle"], "session-sylvain")

    def test_lister_chefs_sans_libelle(self):
        with mock.patch.object(terminal.TerminalClient, "info", return_value=None):
            self.assertNotIn("libelle", terminal.lister_chefs("/x")[0])

    def test_libelle_strippe(self):
        terminal.libeller_chef("/x", "defaut", "  x  ")
        self.assertEqual(terminal.libelles(), {"defaut": "x"})

    def test_libelle_invalide(self):
        for mauvais in ("", "   ", "a" * 33, "a\tb"):
            with self.subTest(mauvais=mauvais):
                with self.assertRaises(terminal.ChefRefus) as cm:
                    terminal.libeller_chef("/x", "defaut", mauvais)
                self.assertEqual((cm.exception.code, cm.exception.rc), ("libelle-invalide", 2))

    def test_libelle_chef_inconnu(self):
        with mock.patch.object(terminal.TerminalClient, "info", return_value=None):
            self.assertRefus(lambda: terminal.libeller_chef("/x", "zzz", "x"), "chef-inconnu", 404, 2, "chef inconnu : zzz")

    def test_libelle_json_corrompu(self):
        (self.etat / terminal.LIBELLES).write_text("{pas du json")
        self.assertEqual(terminal.libelles(), {})

    def test_libelle_effacer_orphelin_sans_refus(self):
        self.assertEqual(terminal.libeller_chef("/x", "zzz", None), {})


class Tenant(unittest.TestCase):
    CHEFS = [chef("defaut"), chef("a", projets={"x": ["p1", "p2"]})]

    def test_dedie(self):
        self.assertEqual(terminal.tenant_de_projet(self.CHEFS, "p2")["cle"], "a")

    def test_defaut(self):
        self.assertEqual(terminal.tenant_de_projet(self.CHEFS, "autre")["cle"], "defaut")

    def test_aucun(self):
        self.assertIsNone(terminal.tenant_de_projet([chef("a", projets={"x": ["p"]})], "z"))


class Reaffecter(Base):
    CHEFS = [chef("defaut"), chef("a", projets={"x": ["p"]}), chef("b", projets={"y": ["q"]})]

    def lancer(self, vers, chefs=None, echec_au=None):
        appels = []

        def poser(cwd, cle, etages):
            appels.append((cle, etages))
            if echec_au == len(appels):
                raise RuntimeError("non")
        with mock.patch.object(terminal, "lister_chefs", return_value=chefs or self.CHEFS), \
                mock.patch.object(terminal, "_poser_etages", side_effect=poser):
            try:
                r = terminal.reaffecter_etage("/x", "x", ["p"], vers)
            except RuntimeError as exc:
                return appels, exc
        return appels, r

    def test_no_op(self):
        appels, r = self.lancer("a")
        self.assertEqual((appels, r), ([], self.CHEFS))

    def test_retrait_puis_ajout(self):
        appels, _ = self.lancer("b")
        self.assertEqual(appels, [("a", {}), ("b", {"y": ["q"], "x": ["p"]})])

    def test_vers_defaut_ne_fait_que_retirer(self):
        self.assertEqual(self.lancer("defaut")[0], [("a", {})])

    def test_depuis_defaut_ne_fait_qu_ajouter(self):
        chefs = [chef("defaut"), chef("b", projets={"y": ["q"]})]
        self.assertEqual(self.lancer("b", chefs)[0], [("b", {"y": ["q"], "x": ["p"]})])

    def test_restauration_sur_echec(self):
        appels, exc = self.lancer("b", echec_au=2)
        self.assertIsInstance(exc, RuntimeError)
        self.assertEqual(appels, [("a", {}), ("b", {"y": ["q"], "x": ["p"]}), ("a", {"x": ["p"]})])

    def test_chef_inconnu_et_cle_invalide(self):
        self.assertRefus(lambda: self.lancer("zz"), "chef-inconnu", 404, 2, "chef inconnu : zz")
        self.assertRefus(lambda: self.lancer("Zz"), "cle-invalide", 400, 2, "clé invalide : Zz (a-z0-9-, ≤ 24, ≠ defaut)")


class Terminal(Base):
    def test_demarrer_compte_fige(self):
        t = terminal.Terminal("/x", "bis", {"x": ["p"]}, "u")
        t.pid = 1
        self.assertRefus(lambda: t.demarrer(compte="v"), "compte-fige", 409, 3,
                         "refus : chef bis tourne sous le compte u — arrête-le pour changer de compte")
        t.demarrer(compte="u")      # même compte : no-op
        t.demarrer()                # sans compte : no-op

    def test_demarrer_env_et_argv(self):
        t = terminal.Terminal("/x", "bis", {"x": ["p"]}, "u")
        vu = {}

        def exec_(argv0, argv, env):
            vu.update(argv=argv, env=env)
            raise OSError("test")
        with mock.patch.object(agents, "verifier_compte"), \
                mock.patch.object(agents, "env_par_compte", side_effect=lambda c, b: dict(b, AGENTX_COMPTE=c)) as env, \
                mock.patch.object(terminal, "programme", return_value=["claude", "x"]) as prog, \
                mock.patch.object(terminal.os, "forkpty", return_value=(0, 3)), \
                mock.patch.object(terminal.os, "chdir"), \
                mock.patch.object(terminal.os, "execvpe", side_effect=exec_), \
                mock.patch.object(terminal.os, "write"), \
                mock.patch.object(terminal.os, "_exit", side_effect=SystemExit):
            with self.assertRaises(SystemExit):
                t.demarrer(compte="u")
        prog.assert_called_once_with("bis", {"x": ["p"]})
        self.assertEqual(env.call_args.args[0], "u")
        self.assertEqual((vu["argv"], vu["env"]["AGENTX_CHEF"], vu["env"]["AGENTX_COMPTE"], vu["env"]["TERM"]),
                         (["claude", "x"], "bis", "u", "xterm-256color"))
        self.assertEqual(t.compte, "u")

    def test_info_demon_head(self):
        with mock.patch.object(terminal.TerminalClient, "_envoyer", return_value={"vivant": True, "code": None, "pos": 3}):
            i = terminal.TerminalClient("/x").info()
        self.assertEqual((i["cle"], i["etages"], i["compte"], i["vivant"], i["pos"]), ("defaut", {}, "defaut", True, 3))

    def test_info_socket_muet(self):
        self.assertIsNone(terminal.TerminalClient("/x", "absent").info())

    def test_client_dedie_absent_ne_lance_pas(self):
        with mock.patch.object(terminal, "_lancer_demon", side_effect=AssertionError("lancé")):
            self.assertRefus(lambda: terminal.TerminalClient("/x", "absent")._appel({"op": "etat"}),
                             "chef-inconnu", 404, 2, "chef inconnu : absent")


class Demon(Base):
    """Démon réel sur un socket Unix ; HOME patché dans l'enfant, aucune session claude lancée."""

    def demarrer(self, *args: str) -> subprocess.Popen:
        p = subprocess.Popen([sys.executable, str(ICI / "terminal.py"), "--daemon", str(self.tmp), *args],
                             env=dict(os.environ, HOME=str(self.tmp)), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        self.addCleanup(p.kill)
        self.addCleanup(p.stdout.close)
        return p

    def attendre_socket(self, cle: str) -> terminal.TerminalClient:
        client = terminal.TerminalClient(str(self.tmp), cle)
        for _ in range(100):
            if client.info() is not None:
                return client
            time.sleep(0.1)
        self.fail("démon muet")

    def test_dedie_etat_etages_quitter(self):
        p = self.demarrer("--chef", "t1", "--etages", '{"x":["p"]}', "--compte", "defaut")
        c = self.attendre_socket("t1")
        i = c.info()
        self.assertEqual((i["cle"], i["etages"], i["compte"], i["vivant"], i["pid"]), ("t1", {"x": ["p"]}, "defaut", False, None))
        self.assertEqual(c._appel({"op": "etages", "etages": {"y": ["q"]}}, lancer=False), {"ok": True, "etages": {"y": ["q"]}})
        self.assertEqual(c.info()["etages"], {"y": ["q"]})
        self.assertEqual([x["cle"] for x in terminal.lister_chefs(str(self.tmp))], ["defaut", "t1"])
        c._appel({"op": "quitter"}, lancer=False)
        self.assertEqual(p.wait(5), 0)

    def test_defaut_etages_refuse(self):
        p = self.demarrer()
        c = self.attendre_socket("defaut")
        self.assertEqual(c.info()["cle"], "defaut")
        rep = c._appel({"op": "etages", "etages": {"y": ["q"]}}, lancer=False)
        self.assertEqual(rep, {"erreur": "chef inconnu : defaut", "code": "chef-inconnu"})
        self.assertRefus(lambda: c._verifier(rep), "chef-inconnu", 404, 2, "chef inconnu : defaut")
        c._appel({"op": "quitter"}, lancer=False)
        self.assertEqual(p.wait(5), 0)

    def test_argv_invalide_exit_2(self):
        for args in (["--chef", "Bad"], ["--chef", "t1", "--etages", "{pas du json"], ["--compte", "X!"]):
            with self.subTest(args):
                r = subprocess.run([sys.executable, str(ICI / "terminal.py"), "--daemon", str(self.tmp), *args],
                                   env=dict(os.environ, HOME=str(self.tmp)), capture_output=True, timeout=20)
                self.assertEqual(r.returncode, 2, r.stderr)


class Login(Base):
    """Faux `claude` = script sh dans PATH ; le vrai n'est jamais appelé."""

    def setUp(self):
        super().setUp()
        self.bin = self.tmp / "bin"
        self.bin.mkdir()
        self.comptes = self.tmp / "comptes"
        self.comptes.mkdir()
        for p in (mock.patch.dict(os.environ, {"PATH": f"{self.bin}:{os.environ['PATH']}"}),
                  mock.patch.object(agents, "COMPTES_DIR", self.comptes),
                  mock.patch.object(terminal, "_COURANT", [])):
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.tuer)

    def tuer(self):
        for lg in terminal._COURANT:
            lg.arreter()

    def faux(self, corps: str) -> None:
        f = self.bin / "claude"
        f.write_text("#!/bin/sh\n" + corps + "\n")
        f.chmod(0o755)

    def fin(self, lg, delai: float = 10.0):
        t = time.monotonic() + delai
        while lg.code is None and time.monotonic() < t:
            time.sleep(0.05)
        self.assertIsNotNone(lg.code, "login non terminé")
        return lg.etat()

    def test_login_argv_fixe(self):
        argv, env, cree = agents.preparer_login("perso")
        self.assertEqual(argv, ["claude", "auth", "login"])
        self.assertEqual(env["CLAUDE_CONFIG_DIR"], str(self.comptes / "perso"))
        self.assertTrue(cree)
        with mock.patch.dict(os.environ, {"CLAUDE_CONFIG_DIR": "/ailleurs"}), \
                mock.patch.object(agents, "dossier_compte", return_value=self.tmp / "home-defaut"):
            argv, env, _ = agents.preparer_login("defaut")
        self.assertEqual(argv, ["claude", "auth", "login"])
        self.assertNotIn("CLAUDE_CONFIG_DIR", env)

    def test_login_nom_invalide(self):
        self.assertRefus(lambda: terminal.ouvrir_login("/x", "A b"), "compte-invalide", 400, 2,
                         "compte invalide : A b (a-z0-9-, ≤ 24)")

    def test_login_compte_connecte(self):
        d = self.comptes / "ok"
        d.mkdir()
        (d / ".credentials.json").write_text("{}")
        self.faux("touch " + str(self.tmp / "lance"))
        self.assertRefus(lambda: terminal.ouvrir_login(str(self.tmp), "ok"), "compte-connecte", 409, 3,
                         "compte ok déjà connecté")
        time.sleep(0.3)
        self.assertFalse((self.tmp / "lance").exists())
        self.assertEqual(terminal._COURANT, [])

    def test_login_en_cours(self):
        self.faux("sleep 5")
        lg = terminal.ouvrir_login(str(self.tmp), "un")
        self.assertTrue(lg.vivant())
        for cible in ("un", "deux"):
            self.assertRefus(lambda c=cible: terminal.ouvrir_login(str(self.tmp), c), "login-en-cours", 409, 3,
                             "connexion déjà en cours : un")

    def test_login_succes(self):
        self.faux('echo "https://exemple.test/auth?x=1"\nread l\n'
                  'echo "{}" > "$CLAUDE_CONFIG_DIR/.credentials.json"\nexit 0')
        lg = terminal.ouvrir_login(str(self.tmp), "un")
        pos, bloc, _ = lg.attendre(0, 5)
        self.assertIn(b"https://exemple.test/auth?x=1", bloc)
        lg.ecrire(b"code\r")
        etat = self.fin(lg)
        self.assertEqual((etat["issue"], etat["code"], etat["vivant"]), ("connecte", 0, False))
        self.assertTrue((self.comptes / "un" / ".credentials.json").exists())

    def test_login_echec_rmdir(self):
        self.faux("exit 3")
        etat = self.fin(terminal.ouvrir_login(str(self.tmp), "neuf"))
        self.assertEqual((etat["issue"], etat["code"]), ("echec", 3))
        self.assertFalse((self.comptes / "neuf").exists())
        (self.comptes / "ancien").mkdir()
        etat = self.fin(terminal.ouvrir_login(str(self.tmp), "ancien"))
        self.assertEqual((etat["issue"], etat["code"]), ("echec", 3))
        self.assertTrue((self.comptes / "ancien").is_dir())

    def test_login_sans_credentials(self):
        self.faux("exit 0")
        etat = self.fin(terminal.ouvrir_login(str(self.tmp), "un"))
        self.assertEqual((etat["issue"], etat["code"]), ("sans-credentials", 0))

    def test_login_delai(self):
        self.faux("sleep 30")
        with mock.patch.object(terminal.Login, "DELAI_S", 1):
            lg = terminal.ouvrir_login(str(self.tmp), "un")
            pid = lg.proc.pid
            etat = self.fin(lg, 4.0)
        self.assertEqual(etat["issue"], "delai")
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    def test_login_arreter(self):
        self.faux("sleep 30")
        lg = terminal.ouvrir_login(str(self.tmp), "un")
        lg.arreter()
        etat = self.fin(lg, 5.0)
        self.assertEqual(etat["issue"], "arrete")
        self.assertIs(terminal.login_courant("un"), lg)
        self.assertRefus(lambda: terminal.login_courant("autre"), "login-absent", 404, 2,
                         "aucune connexion en cours pour autre")


if __name__ == "__main__":
    unittest.main()
