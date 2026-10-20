#!/usr/bin/env python3
"""Tests multi-chefs de dash : _chef, _etages_ouverts, state.json chefs/comptes, CLI --chef."""
import contextlib
import io
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

TMP = tempfile.mkdtemp()
os.environ["AGENTX_ROOT"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent))
import dash  # noqa: E402
import terminal  # noqa: E402

PROJETS = []
for slug, statut in (("alpha", "actif"), ("beta", "actif"), ("vieux", "clos")):
    d = Path(TMP) / "vault" / "projets" / slug
    d.mkdir(parents=True, exist_ok=True)
    (d / "brief.md").write_text(f"---\nstatut: {statut}\n---\n# {slug}\n")
    PROJETS.append(d)
dash.lister_projets = lambda: PROJETS        # le vault de test, pas celui d'AgentX

DEFAUT = {"cle": "defaut", "defaut": True, "vivant": True, "etages": [], "projets": {},
          "pid": 10, "depuis": "2026-10-20T10:00:00", "compte": "defaut"}
DEDIE = {"cle": "alpha", "defaut": False, "vivant": True, "etages": ["alpha"], "projets": {"alpha": ["alpha"]},
         "pid": 11, "depuis": "2026-10-20T10:05:00", "compte": "pro"}
COMPTES = [{"nom": "defaut", "dossier": "~/.claude", "connecte": True, "login": "x"},
           {"nom": "pro", "dossier": "~/.claude-pro", "connecte": False, "login": "CLAUDE_CONFIG_DIR=~/.claude-pro claude auth login"}]


def cli(*args, en_json=False):
    out, err = io.StringIO(), io.StringIO()
    rc = 0
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            dash.chef_cli(list(args), None, None, en_json)
        except SystemExit as e:
            rc = e.code
    return rc, out.getvalue(), err.getvalue()


class Chef(unittest.TestCase):
    def setUp(self):
        dash.CHEFS.clear()
        dash._CHEFS_CACHE.clear()

    def test_chefs_cache_ttl(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT]) as l:
            dash._chefs("/x")
            dash._chefs("/x")
            self.assertEqual(l.call_count, 1)

    def test_chefs_ttl_expire(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT]) as l:
            dash._chefs("/x")
            dash._chefs("/x", ttl=0)
            self.assertEqual(l.call_count, 2)
            with mock.patch.object(dash.time, "monotonic", return_value=time.monotonic() + 3):
                dash._chefs("/x")
            self.assertEqual(l.call_count, 3)

    def test_defaut_cache(self):
        c = dash._chef("defaut")
        self.assertIs(c, dash._chef("defaut"))
        self.assertEqual(c.cle, "defaut")

    def test_cle_invalide(self):
        with self.assertRaises(terminal.ChefRefus) as e:
            dash._chef("Mauvais cle")
        self.assertEqual(e.exception.code, "cle-invalide")

    def test_chef_inconnu(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT]):
            with self.assertRaises(terminal.ChefRefus) as e:
                dash._chef("alpha")
        self.assertEqual((e.exception.code, e.exception.http), ("chef-inconnu", 404))

    def test_dedie_connu(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT, DEDIE]):
            self.assertEqual(dash._chef("alpha").cle, "alpha")

    def test_etages_ouverts(self):
        self.assertEqual(dash._etages_ouverts(), {"alpha": ["alpha"], "beta": ["beta"]})

    def test_open_passe_compte(self):
        client = mock.Mock(position=mock.Mock(return_value=0), vivant=mock.Mock(return_value=True))
        with mock.patch.object(dash, "_chef", return_value=client):
            dash.Handler._terminal(None, "open", {"cols": 80, "rows": 24}, "alpha", "pro")
            client.demarrer.assert_called_with(80, 24, "pro")
            dash.Handler._terminal(None, "open", {"compte": "autre"}, "alpha", None)
            client.demarrer.assert_called_with(120, 32, "autre")


class Etat(unittest.TestCase):
    def setUp(self):
        dash._CHEFS_CACHE.clear()

    def etat(self, chefs):
        with mock.patch.object(terminal, "lister_chefs", return_value=chefs), \
                mock.patch.object(dash.agents, "lister_comptes", return_value=COMPTES):
            return dash.construire_etat()["immeuble"]

    def test_champs(self):
        i = self.etat([DEFAUT, DEDIE])
        self.assertEqual(i["chefs_max"], 3)
        self.assertEqual(i["comptes"], COMPTES)
        self.assertTrue(all("projets" not in c for c in i["chefs"]))
        self.assertEqual(i["toit"]["chef"], {"vivant": True, "cle": "defaut"})

    def test_chef_par_etage(self):
        mort = {**DEDIE, "vivant": False}
        par = {e["slug"]: e["chef"] for e in self.etat([DEFAUT, mort])["etages"]}
        self.assertEqual(par["alpha"], {"cle": "alpha", "vivant": False})
        self.assertEqual(par["beta"], {"cle": "defaut", "vivant": True})

    def test_lister_chefs_en_exception(self):
        with mock.patch.object(terminal, "lister_chefs", side_effect=OSError("x")), \
                mock.patch.object(dash.agents, "lister_comptes", return_value=COMPTES):
            i = dash.construire_etat()["immeuble"]
        self.assertEqual(i["chefs"], [])
        self.assertEqual(i["toit"]["chef"], {"vivant": None, "cle": "defaut"})


class Cli(unittest.TestCase):
    def setUp(self):
        dash._CHEFS_CACHE.clear()

    def test_liste_texte(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT, DEDIE]):
            rc, out, _ = cli("liste")
        self.assertEqual(rc, 0)
        self.assertEqual(out, "defaut  vivant  étages: non tenus  pid 10  depuis 2026-10-20T10:00:00  compte defaut\n"
                              "alpha  vivant  étages: alpha  pid 11  depuis 2026-10-20T10:05:00  compte pro\n"
                              "2/3 chefs vivants\n")

    def test_ouvrir_etage_inconnu(self):
        rc, _, err = cli("ouvrir", "zzz")
        self.assertEqual(rc, 2)
        self.assertEqual(err.strip(), "étage inconnu : zzz")

    def test_ouvrir(self):
        with mock.patch.object(terminal, "ouvrir_chef", return_value=DEDIE) as o:
            rc, out, _ = cli("ouvrir", "alpha")
        self.assertEqual(rc, 0)
        self.assertEqual(o.call_args.args[1], {"alpha": ["alpha"]})
        self.assertEqual(out.strip(), "chef alpha ouvert · compte pro · étages: alpha · pid 11")

    def test_arreter(self):
        with mock.patch.object(terminal, "arreter_chef") as a:
            rc, out, _ = cli("arreter", "alpha")
        a.assert_called_once()
        self.assertEqual(out.strip(), "chef alpha arrêté")

    def test_reaffecter(self):
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT, DEDIE]), \
                mock.patch.object(terminal, "reaffecter_etage", return_value=[]) as r:
            rc, out, _ = cli("reaffecter", "alpha", "defaut")
        self.assertEqual(r.call_args.args[1:], ("alpha", ["alpha"], "defaut"))
        self.assertEqual(out.strip(), "étage alpha : alpha → defaut")

    def test_reaffecter_refus_rc(self):
        refus = terminal._refus("chef-mort", "refus : chef x non vivant — réaffectation impossible")
        with mock.patch.object(terminal, "lister_chefs", return_value=[DEFAUT]), \
                mock.patch.object(terminal, "reaffecter_etage", side_effect=refus):
            rc, _, err = cli("reaffecter", "alpha", "x")
        self.assertEqual(rc, 3)
        self.assertIn("non vivant", err)

    def test_comptes(self):
        with mock.patch.object(dash.agents, "lister_comptes", return_value=COMPTES):
            rc, out, _ = cli("comptes")
        lignes = out.splitlines()
        self.assertEqual(lignes[0], "defaut  connecté  ~/.claude")
        self.assertEqual(lignes[1], "pro  non connecté  ~/.claude-pro  connexion : " + COMPTES[1]["login"])


if __name__ == "__main__":
    unittest.main()
