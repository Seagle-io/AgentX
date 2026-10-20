"""Tests de attendre : vault de banc sous .cache/banc-T122 (AGENTX_ROOT), sessions simulees, sommeil injecte.

Lancer : python3 -m unittest bin/test_attendre.py
"""

import io
import os
import shutil
import sys
import unittest
from contextlib import redirect_stdout
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
BANC = ICI.parent / ".cache" / "banc-T122" / f"b{os.getpid()}"

os.environ.update(AGENTX_ROOT=str(BANC))
sys.path.insert(0, str(ICI))
import agents      # noqa: E402  (ROOT lu de l'env au-dessus)
import attendre    # noqa: E402


def setUpModule():
    BANC.mkdir(parents=True)


def tearDownModule():
    shutil.rmtree(BANC)


def tache(tid: str, rendu: bool = False) -> Path:
    d = BANC / "vault" / "projets" / "banc" / "taches" / f"{tid}-banc"
    d.mkdir(parents=True, exist_ok=True)
    (d / "task.md").write_text(f"---\nid: {tid}\nstatut: en-cours\n---\n", encoding="utf-8")
    if rendu:
        rendre(d)
    return d


def tache_statut(tid: str, statut: str) -> None:
    d = tache(tid)
    (d / "task.md").write_text(f"---\nid: {tid}\nstatut: {statut}\n---\n", encoding="utf-8")


def rendre(d: Path) -> None:
    (d / "result.md").write_text("---\nstatut: revue\n---\n", encoding="utf-8")


def jamais_relancer(slug, tid):
    raise AssertionError("relance inattendue")


def attendre_les(*args: str, sessions=None, pendant=None, relancer=jamais_relancer) -> tuple[int, str, list[int]]:
    """(rc, sortie, durees dormies) ; `pendant` s'execute a chaque sommeil (l'agent travaille)."""
    dormis: list[int] = []

    def sommeil(s):
        dormis.append(s)
        if pendant:
            pendant()
    sortie = io.StringIO()
    with mock.patch.object(agents, "sessions", lambda cache_s=5.0: sessions), redirect_stdout(sortie):
        rc = attendre.main([*args, "--projet", "banc"], sommeil=sommeil, relancer=relancer)
    return rc, sortie.getvalue(), dormis


class TestAttendre(unittest.TestCase):
    def test_rendu_immediat(self):
        tache("T070", rendu=True)
        tache("T071")
        rc, sortie, dormis = attendre_les("T070", "T071")
        self.assertEqual((rc, dormis), (0, []))
        self.assertRegex(sortie, r"^\d\d:\d\d T070\n$")

    def test_tout_attend_les_deux(self):
        tache("T072", rendu=True)
        d = tache("T073")
        rc, sortie, dormis = attendre_les("T072", "T073", "--tout", "--delai", "5", pendant=lambda: rendre(d))
        self.assertEqual((rc, dormis), (0, [5]))
        self.assertEqual([l[6:] for l in sortie.splitlines()], ["T072", "T073"])

    def test_mort_sans_result(self):
        tache("T074")
        agents.ecrire({"id_session": "aaaaaaaa", "nom": "agentx-banc-T074", "pid": None, "role": "implementeur",
                       "tid": "T074", "projet": "banc", "lance": "2026-10-17T09:00:00", "modele": None,
                       "mode": "dontAsk", "mort_signale": False})
        rc, sortie, dormis = attendre_les("T074", "--sans-relance", sessions=[])
        self.assertEqual((rc, sortie, dormis), (1, "T074 MORT\n", []))

    def test_attendre_mort_par_id(self):
        tache("T079")
        n = "agentx-banc-T079"
        fiche = {"id_session": "cfd7916e", "nom": n, "pid": None, "role": "implementeur", "tid": "T079",
                 "projet": "banc", "lance": datetime.now().isoformat(timespec="seconds"), "modele": None,
                 "mode": "dontAsk", "mort_signale": False}
        agents.ecrire(fiche)
        sess = [{"id": "cfd7916e", "state": "stopped"}]
        rc, sortie, _ = attendre_les("T079", "--max", "0", sessions=sess)           # âge < 60 s
        self.assertEqual((rc, sortie), (3, ""))
        agents.ecrire(dict(fiche, lance=(datetime.now() - timedelta(seconds=61)).isoformat(timespec="seconds")))
        rc, sortie, _ = attendre_les("T079", "--sans-relance", sessions=sess)
        self.assertEqual((rc, sortie), (1, "T079 MORT\n"))
        sess.append({"id": "bbbb1111", "name": n, "state": "working"})              # homonyme vivant
        rc, sortie, _ = attendre_les("T079", "--sans-relance", sessions=sess)
        self.assertEqual((rc, sortie), (1, "T079 MORT\n"))

    def _fiche_morte(self, tid: str) -> None:
        tache(tid)
        agents.ecrire({"id_session": "aaaaaaaa", "nom": f"agentx-banc-{tid}", "pid": None, "role": "implementeur",
                       "tid": tid, "projet": "banc", "lance": "2026-10-17T09:00:00", "modele": None,
                       "mode": "dontAsk", "mort_signale": False})

    def test_mort_relance_puis_rendu(self):
        self._fiche_morte("T080")
        appels = []
        d = tache("T080")

        def relancer(slug, tid):
            appels.append((slug, tid))
            return "OK", "respawn"
        rc, sortie, _ = attendre_les("T080", sessions=[], relancer=relancer, pendant=lambda: rendre(d))
        self.assertEqual((rc, appels), (0, [("banc", "T080")]))
        self.assertIn("T080 MORT → relancé (respawn)", sortie)

    def test_mort_deux_fois(self):
        self._fiche_morte("T081")
        appels = []

        def relancer(slug, tid):
            appels.append(tid)
            return "OK", "respawn"
        rc, sortie, _ = attendre_les("T081", sessions=[], relancer=relancer)
        self.assertEqual((rc, appels), (1, ["T081"]))
        self.assertTrue(sortie.endswith("T081 MORT\n"))

    def test_mort_relance_ko(self):
        self._fiche_morte("T082")
        rc, sortie, _ = attendre_les("T082", sessions=[], relancer=lambda s, t: ("KO", "agent vivant"))
        self.assertEqual((rc, sortie), (1, "T082 MORT (relance KO : agent vivant)\n"))

    def test_max_depasse(self):
        tache("T075")
        rc, sortie, dormis = attendre_les("T075", "--delai", "20", "--max", "60")
        self.assertEqual((rc, sortie, dormis), (3, "", [20, 20, 20]))

    def test_a_faire_non_lance(self):
        tache_statut("T076", "a-faire")
        rc, sortie, dormis = attendre_les("T076")
        self.assertEqual((rc, sortie, dormis), (4, "T076 NON LANCE (a-faire) — corrige le pack puis dispatch\n", []))

    def test_pret_non_lance(self):
        tache_statut("T077", "pret")
        rc, sortie, dormis = attendre_les("T077")
        self.assertEqual((rc, dormis), (4, []))
        self.assertIn("NON LANCE (pret)", sortie)

    def test_inconnu(self):
        rc, sortie, dormis = attendre_les("T999")
        self.assertEqual((rc, sortie, dormis), (2, "T999 inconnu\n", []))

    def _argv_integrer(self, *args: str) -> list[str]:
        tache("T078", rendu=True)
        with mock.patch.object(attendre.subprocess, "run") as run:
            attendre_les("T078", *args)
        return run.call_args.args[0]

    def test_integrer_court_et_verdict(self):
        argv = self._argv_integrer("--integrer")
        self.assertEqual(argv[2:], ["integrer", "T078", "--projet", "banc", "--verdict", "--court"])
        self.assertIn("--court", argv)

    def test_integrer_long_sans_court(self):
        argv = self._argv_integrer("--integrer", "--long")
        self.assertIn("--verdict", argv)
        self.assertNotIn("--court", argv)

    def test_usage(self):
        with redirect_stdout(io.StringIO()), mock.patch.object(sys, "stderr", io.StringIO()):
            self.assertEqual(attendre.main([]), 2)
            self.assertEqual(attendre.main(["T070"]), 2)


VERT = "---\nstatut: revue\n---\n## Vérifié comment\ntest → OK\n## Écarts\n- ∅\n"


def prod(tid: str, ecrit: str = "bin/x.py", result: str = VERT, role: str = "implementeur",
         statut: str = "en-cours", deps: str = "") -> Path:
    d = BANC / "vault" / "projets" / "banc" / "taches" / f"{tid}-banc"
    d.mkdir(parents=True, exist_ok=True)
    (d / "task.md").write_text(f"---\nid: {tid}\nrole: {role}\nstatut: {statut}\n{deps}---\n", encoding="utf-8")
    (d / "context.md").write_text(f"## Fichiers autorisés\n| Chemin | Droit | Pourquoi |\n|---|---|---|\n| `{ecrit}` | E | x |\n",
                                  encoding="utf-8")
    if result:
        (d / "result.md").write_text(result, encoding="utf-8")
    return d


class Faux:
    """subprocess.run simule : enregistre les commandes, rc par motif."""
    def __init__(self, **rcs):
        self.appels, self.rcs = [], rcs

    def __call__(self, cmd, **kw):
        self.appels.append(cmd)
        cle = next((k for k in ("build", "invariants", "retenir", "dispatch") if k in (cmd[1:3] + cmd[:3])), "")
        rc = self.rcs.get(cle, 0)
        sortie = {"build": "✓ built in 4.1s\n", "invariants": "21 OK / 0 KO · 3 s\n" if rc == 0 else "20 OK / 1 KO · 3 s\n"}.get(cle, "")
        return mock.Mock(returncode=rc, stdout=sortie, stderr="")

    def a(self, mot: str) -> list:
        return [c for c in self.appels if mot in c]


def attendre_faux(*args: str, **rcs) -> tuple[int, str, Faux]:
    faux = Faux(**rcs)
    with mock.patch.object(attendre.subprocess, "run", faux):
        rc, sortie, _ = attendre_les(*args)
    return rc, sortie, faux


class TestChaine(unittest.TestCase):
    def test_usage_appliquer_build(self):
        prod("T110")
        with mock.patch.object(sys, "stderr", io.StringIO()):
            self.assertEqual(attendre_les("T110", "--appliquer")[0], 2)
            self.assertEqual(attendre_les("T110", "--integrer", "--build")[0], 2)

    def test_appliquer_vert_retient(self):
        prod("T111")
        rc, sortie, faux = attendre_faux("T111", "--integrer", "--appliquer")
        self.assertEqual(rc, 0)
        self.assertIn("   => retenu T111", sortie)
        self.assertEqual(faux.a("retenir")[0][2:], ["retenir", "T111", "--projet", "banc", "--sans-eval"])

    def test_appliquer_nv_propose_seulement(self):
        prod("T112", result=VERT.replace("test → OK", "NV"))
        rc, sortie, faux = attendre_faux("T112", "--integrer", "--appliquer")
        self.assertIn("   => non appliqué T112 : NV dans Vérifié comment", sortie)
        self.assertEqual(faux.a("retenir"), [])

    def test_appliquer_controle_ouvert(self):
        prod("T113")
        prod("T114", role="critique", statut="pret", deps="deps: [T113]\n", result="")
        rc, sortie, faux = attendre_faux("T113", "--integrer", "--appliquer")
        self.assertIn("non appliqué T113 : contrôle ouvert T114", sortie)
        self.assertEqual(faux.a("retenir"), [])

    def test_appliquer_non_producteur(self):
        prod("T115", role="eclaireur")
        rc, sortie, faux = attendre_faux("T115", "--integrer", "--appliquer")
        self.assertIn("non appliqué T115 : rôle eclaireur non producteur", sortie)

    def test_build_front_une_fois_puis_retenue(self):
        prod("T116", ecrit="apps/web/src/a.tsx")
        prod("T117", ecrit="apps/web/src/b.tsx")
        rc, sortie, faux = attendre_faux("T116", "T117", "--tout", "--integrer", "--appliquer", "--build")
        self.assertEqual(rc, 0)
        self.assertEqual(len(faux.a("build")), 1)
        self.assertIn("✓ built in 4.1s", sortie)
        self.assertIn("invariants : 21 OK / 0 KO", sortie)
        ordre = faux.appels
        self.assertLess(ordre.index(attendre.BUILD_CMD), ordre.index(faux.a("retenir")[0]))
        self.assertEqual(len(faux.a("retenir")), 2)

    def test_build_invariants_ko_rc5_pas_de_retenue_front(self):
        prod("T118", ecrit="apps/web/src/a.tsx")
        prod("T119", ecrit="bin/x.py")
        rc, sortie, faux = attendre_faux("T118", "T119", "--tout", "--integrer", "--appliquer", "--build", invariants=2)
        self.assertEqual(rc, 5)
        self.assertIn("non appliqué T118 : build échoué", sortie)
        self.assertEqual([c[3] for c in faux.a("retenir")], ["T119"])

    def test_build_saute_sans_front(self):
        prod("T120", ecrit="bin/x.py")
        rc, sortie, faux = attendre_faux("T120", "--tout", "--build")
        self.assertIn("build sauté : 0 rendu sous apps/web/", sortie)
        self.assertEqual(faux.a("build"), [])

    def test_suite_dispatche_candidat_pret(self):
        prod("T121", statut="fait")
        prod("T122", ecrit="bin/y.py", statut="pret", deps="deps: [T121]\n", result="")
        prod("T123")
        rc, sortie, faux = attendre_faux("T123", "--suite")
        self.assertIn("T122", faux.a("dispatch")[0])
        self.assertRegex(sortie, r"   \+\+ dispatch .*T122")

    def test_suite_dep_non_faite_ou_a_faire_rien(self):
        prod("T124", statut="en-cours")
        prod("T125", statut="pret", deps="deps: [T124]\n", result="")
        prod("T126", statut="a-faire", result="")
        rc, sortie, faux = attendre_faux("T124", "--suite")
        self.assertFalse({"T125", "T126"} & set(sum(faux.a("dispatch"), [])))


if __name__ == "__main__":
    unittest.main()
