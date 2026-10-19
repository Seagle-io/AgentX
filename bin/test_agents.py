#!/usr/bin/env python3
"""Tests des comptes de agents.py : COMPTES_DIR et HOME pointes sur un tmp, subprocess.run patche."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agents  # noqa: E402

VAR = "CLAUDE_CONFIG_" + "DIR"


class Base(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.tmp = Path(t.name)
        self.comptes = self.tmp / "comptes"
        self.home = self.tmp / "home"
        (self.home / ".claude").mkdir(parents=True)
        for p in (patch.object(agents, "COMPTES_DIR", self.comptes),
                  patch.dict(os.environ, {"HOME": str(self.home)})):
            p.start()
            self.addCleanup(p.stop)

    def compte(self, nom, connecte=False):
        (self.comptes / nom).mkdir(parents=True)
        if connecte:
            (self.comptes / nom / ".credentials.json").write_text("{}")


class TestNoms(Base):
    def test_re_ok(self):
        for c in ("a", "0", "perso-2", "a" * 24):
            self.assertTrue(agents.RE_COMPTE.fullmatch(c), c)

    def test_re_ko(self):
        for c in ("", "-a", "A", "a_b", "a" * 25, "a/b", ".."):
            self.assertFalse(agents.RE_COMPTE.fullmatch(c), c)

    def test_dossier_defaut_et_nom(self):
        self.assertEqual(agents.dossier_compte("defaut"), self.home / ".claude")
        self.assertEqual(agents.dossier_compte("pro"), self.comptes / "pro")

    def test_dossier_invalide(self):
        with self.assertRaises(agents.CompteErreur) as e:
            agents.dossier_compte("../x")
        self.assertEqual(e.exception.code, "compte-invalide")
        self.assertEqual(str(e.exception), "compte invalide : ../x (a-z0-9-, ≤ 24)")


class TestLister(Base):
    def test_absent(self):
        l = agents.lister_comptes()
        self.assertEqual([c["nom"] for c in l], ["defaut"])
        self.assertEqual(l[0]["login"], "claude auth login")

    def test_tri_filtre_connecte(self):
        self.compte("zeta", connecte=True)
        self.compte("alpha")
        self.compte("Mauvais")
        self.compte("defaut", connecte=True)
        (self.comptes / "fichier").write_text("")
        l = agents.lister_comptes()
        self.assertEqual([c["nom"] for c in l], ["defaut", "alpha", "zeta"])
        self.assertEqual([c["connecte"] for c in l[1:]], [False, True])

    def test_login_exact(self):
        self.compte("pro")
        d = self.comptes / "pro"
        self.assertEqual(agents.lister_comptes()[1]["login"],
                         f"mkdir -p {d} && {VAR}={d} claude auth login")

    def test_aucun_mkdir(self):
        agents.lister_comptes()
        self.assertFalse(self.comptes.exists())


class TestCompteDe(Base):
    def test_absent(self):
        self.assertEqual(agents.compte_de({}), "defaut")

    def test_non_str(self):
        self.assertEqual(agents.compte_de({"compte": 3}), "defaut")

    def test_present(self):
        self.assertEqual(agents.compte_de({"compte": "pro"}), "pro")


class TestVerifier(Base):
    def test_invalide(self):
        with self.assertRaises(agents.CompteErreur) as e:
            agents.verifier_compte("A")
        self.assertEqual(e.exception.code, "compte-invalide")

    def test_inconnu(self):
        with self.assertRaises(agents.CompteErreur) as e:
            agents.verifier_compte("pro")
        self.assertEqual(e.exception.code, "compte-inconnu")
        self.assertTrue(e.exception.message.startswith("compte inconnu : pro — à créer par toi : mkdir -p "))

    def test_deconnecte(self):
        self.compte("pro")
        with self.assertRaises(agents.CompteErreur) as e:
            agents.verifier_compte("pro")
        self.assertEqual(e.exception.code, "compte-deconnecte")
        self.assertIn("compte pro non connecté — dans ton terminal : ", str(e.exception))
        agents.verifier_compte("pro", connecte=False)

    def test_ok(self):
        self.compte("pro", connecte=True)
        self.assertIsNone(agents.verifier_compte("pro"))


class TestEnv(Base):
    def test_defaut_sans_var(self):
        env = agents.env_par_compte("defaut", {VAR: "x", "A": "1"})
        self.assertNotIn(VAR, env)
        self.assertEqual(env["AGENTX_COMPTE"], "defaut")
        self.assertEqual(env["A"], "1")

    def test_nom_pose_var_et_base_intacte(self):
        self.compte("pro")
        base = {VAR: "x"}
        env = agents.env_par_compte("pro", base)
        self.assertEqual(env[VAR], str(self.comptes / "pro"))
        self.assertEqual(env["AGENTX_COMPTE"], "pro")
        self.assertEqual(base, {VAR: "x"})

    def test_base_par_defaut_os_environ(self):
        with patch.dict(os.environ, {"ZZ": "1"}):
            self.assertEqual(agents.env_par_compte("defaut")["ZZ"], "1")

    def test_inconnu(self):
        with self.assertRaises(agents.CompteErreur) as e:
            agents.env_par_compte("pro", {})
        self.assertEqual(e.exception.code, "compte-inconnu")


class TestSessions(Base):
    def setUp(self):
        super().setUp()
        p = patch.dict(agents._SESSIONS, {"t": 0.0, "v": None})
        p.start()
        self.addCleanup(p.stop)

    @staticmethod
    def rep(liste, rc=0):
        return MagicMock(returncode=rc, stdout=json.dumps(liste))

    def test_fusion_par_id(self):
        self.compte("pro", connecte=True)
        self.compte("off")

        def run(cmd, **kw):
            if kw["env"]["AGENTX_COMPTE"] == "defaut":
                return self.rep([{"id": "a"}, {"id": "b"}])
            return self.rep([{"id": "b"}, {"id": "c"}])
        with patch.object(agents.subprocess, "run", side_effect=run) as m:
            v = agents.sessions(cache_s=0)
        self.assertEqual(m.call_count, 2)
        self.assertEqual([(s["id"], s["compte"]) for s in v],
                         [("a", "defaut"), ("b", "defaut"), ("c", "pro")])

    def test_un_echec_none(self):
        self.compte("pro", connecte=True)

        def run(cmd, **kw):
            if kw["env"]["AGENTX_COMPTE"] == "pro":
                raise subprocess.TimeoutExpired(cmd, 3)
            return self.rep([{"id": "a"}])
        with patch.object(agents.subprocess, "run", side_effect=run):
            self.assertIsNone(agents.sessions(cache_s=0))

    def test_sans_id_conserves(self):
        brut = [{"id": "a"}, {"x": 1}, {"x": 2}]
        with patch.object(agents.subprocess, "run", return_value=self.rep(brut)):
            v = agents.sessions(cache_s=0)
        self.assertEqual(v, [{"id": "a", "compte": "defaut"}, {"x": 1, "compte": "defaut"}, {"x": 2, "compte": "defaut"}])

    def test_non_dict_et_id_none_conserves(self):
        with patch.object(agents.subprocess, "run", return_value=self.rep([3, {"id": None}, {"id": ""}, {"id": None}])):
            self.assertEqual(len(agents.sessions(cache_s=0)), 4)

    def test_defaut_seul_et_cache(self):
        with patch.object(agents.subprocess, "run", return_value=self.rep([{"id": "a"}])) as m:
            self.assertEqual(len(agents.sessions(cache_s=0)), 1)
            agents.sessions()
        self.assertEqual(m.call_count, 1)


if __name__ == "__main__":
    unittest.main()
