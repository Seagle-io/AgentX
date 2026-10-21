"""Tests de effectif : racine de banc sous AGENTX_ROOT (tmp), le vrai run/ n'est jamais touché.

Lancer : python3 -m unittest bin/test_effectif.py
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
BANC = Path(tempfile.mkdtemp(prefix="agentx-ef-"))
os.environ["AGENTX_ROOT"] = str(BANC)
for var in ("AGENTX_TID", "AGENTX_PROJET"):
    os.environ.pop(var, None)
sys.path.insert(0, str(ICI))

import agents  # noqa: E402
import effectif  # noqa: E402
import produits  # noqa: E402
import roles  # noqa: E402

ETAGE = effectif.etage_de("banc")
R1, R2 = roles.affectables()[:2]
AUTRE = "p-autre"


def fiche(slug: str, tid: str, role: str, vivante: bool) -> None:
    agents.ecrire({"id_session": f"s{tid}", "nom": f"agentx-{slug}-{tid}", "pid": None, "role": role,
                   "tid": tid, "projet": slug,
                   "lance": datetime.fromtimestamp(time.time() - (0 if vivante else 3600)).isoformat()})


def ecrire_brut(texte: str) -> None:
    effectif.CHEMIN.parent.mkdir(parents=True, exist_ok=True)
    effectif.CHEMIN.write_text(texte, encoding="utf-8")


def tearDownModule():
    import shutil
    shutil.rmtree(BANC)


class TestEffectif(unittest.TestCase):
    def setUp(self):
        effectif.CHEMIN.unlink(missing_ok=True)
        for p in (BANC / "run" / "agents").glob("*.json") if (BANC / "run" / "agents").exists() else []:
            p.unlink()
        patch = mock.patch.object(agents, "sessions", return_value=[{"id": "sT1", "state": "working"}])
        patch.start()
        self.addCleanup(patch.stop)

    def test_banc_isole(self):
        self.assertEqual(effectif.CHEMIN, BANC / "run" / "effectif.json")
        self.assertIn(ETAGE, effectif.etages_connus())

    def test_lire_absent(self):
        self.assertEqual(effectif.lire(), {})

    def test_lire_illisible(self):
        for brut in ("pas du json", '{"version": 2, "etages": {}}', '{"version": 1, "etages": []}',
                     '{"version": 1, "etages": {"a": {"x": -1}}}', '{"version": 1, "etages": {"a": {"x": true}}}',
                     '{"version": 1, "etages": {"a": 3}}', "[]"):
            ecrire_brut(brut)
            with self.assertRaises(effectif.Illisible, msg=brut):
                effectif.lire()

    def test_ecrire_lire(self):
        effectif.ecrire({"a": {"juriste": 1}})
        brut = json.loads(effectif.CHEMIN.read_text(encoding="utf-8"))
        self.assertEqual((brut["version"], brut["etages"]), (1, {"a": {"juriste": 1}}))
        self.assertTrue(brut["maj"])
        self.assertEqual(effectif.lire(), {"a": {"juriste": 1}})

    def test_recruter_licencier(self):
        self.assertEqual(effectif.recruter(ETAGE, R1), {R1: 1})
        self.assertEqual(effectif.recruter(ETAGE, R1), {R1: 2})
        self.assertEqual(effectif.recruter(ETAGE, R2), {R1: 2, R2: 1})
        self.assertEqual(effectif.licencier(ETAGE, R1), {R1: 1, R2: 1})

    def test_role_a_zero_cle_supprimee(self):
        effectif.recruter(ETAGE, R1)
        self.assertEqual(effectif.licencier(ETAGE, R1), {})
        self.assertEqual(effectif.lire(), {})

    def test_plafond_role(self):
        for _ in range(effectif.PLAFOND_ROLE):
            effectif.recruter(ETAGE, R1)
        with self.assertRaises(ValueError) as c:
            effectif.recruter(ETAGE, R1)
        self.assertEqual(str(c.exception), "plafond atteint : 4 postes " + R1 + " max par étage")

    def test_plafond_etage(self):
        pool = [r for r in roles.affectables()]
        n = 0
        for r in pool:
            for _ in range(effectif.PLAFOND_ROLE):
                if n == effectif.PLAFOND_ETAGE:
                    break
                effectif.recruter(ETAGE, r)
                n += 1
        self.assertEqual(n, 18)
        libre = next(r for r in pool if effectif.lire()[ETAGE].get(r, 0) < effectif.PLAFOND_ROLE)
        with self.assertRaises(ValueError) as c:
            effectif.recruter(ETAGE, libre)
        self.assertEqual(str(c.exception), "étage plein : 18 postes max")

    def test_erreurs_400(self):
        cas = [(lambda: effectif.recruter("nulle-part", R1), "étage inconnu : nulle-part"),
               (lambda: effectif.recruter(ETAGE, "zzz"), "rôle inconnu : zzz"),
               (lambda: effectif.recruter(ETAGE, "chef"), "rôle non affectable : chef"),
               (lambda: effectif.licencier(ETAGE, R1), f"aucun poste {R1} à licencier sur {ETAGE}")]
        for appel, msg in cas:
            with self.assertRaises(ValueError) as c:
                appel()
            self.assertEqual(str(c.exception), msg)

    def test_recruter_illisible(self):
        ecrire_brut("pas du json")
        with self.assertRaises(ValueError) as c:
            effectif.recruter(ETAGE, R1)
        self.assertTrue(str(c.exception).startswith("run/effectif.json illisible : "))
        self.assertTrue(str(c.exception).endswith(" — corriger ou supprimer à la main"))

    def test_vue(self):
        self.assertEqual(effectif.vue(ETAGE), {"postes": {}, "total": 0, "plafond_role": 4,
                                                "plafond_etage": 18, "erreur": ""})
        effectif.recruter(ETAGE, R2)
        effectif.recruter(ETAGE, R1)
        effectif.recruter(ETAGE, R1)
        v = effectif.vue(ETAGE)
        self.assertEqual(v["postes"], {R1: 2, R2: 1})
        self.assertEqual((list(v["postes"]), v["total"]), ([R1, R2], 3))
        ecrire_brut("pas du json")
        v = effectif.vue(ETAGE)
        self.assertEqual((v["postes"], v["total"]), ({}, 0))
        self.assertTrue(v["erreur"])

    def test_refus_non_recrute(self):
        self.assertEqual(effectif.refus("banc", "T1", R1),
                         f"rôle non recruté : {R1} sur l'étage {ETAGE} — recruter depuis la salle")

    def test_refus_plein(self):
        effectif.ecrire({ETAGE: {R1: 1}})
        fiche("banc", "T2", R1, True)
        self.assertEqual(effectif.occupes(ETAGE, R1), 1)
        self.assertEqual(effectif.refus("banc", "T1", R1),
                         f"0 poste libre : {R1} 1/1 sur l'étage {ETAGE} — attendre une fin ou recruter")
        fiche("banc", "T2", R1, False)
        self.assertIsNone(effectif.refus("banc", "T1", R1))

    def test_refus_fiche_propre_vivante(self):
        fiche("banc", "T1", R1, True)
        self.assertIsNone(effectif.refus("banc", "T1", R1))

    def test_occupes_sauf_et_autre_role(self):
        fiche("banc", "T1", R1, True)
        fiche("banc", "T2", R2, True)
        self.assertEqual(effectif.occupes(ETAGE, R1), 1)
        self.assertEqual(effectif.occupes(ETAGE, R1, sauf=("banc", "T1")), 0)

    def test_refus_illisible(self):
        ecrire_brut("pas du json")
        r = effectif.refus("banc", "T1", R1)
        self.assertTrue(r.startswith("effectif illisible : run/effectif.json ("))
        self.assertTrue(r.endswith(") — corriger depuis la salle"))

    def test_garde_refuse_edit(self):
        entree = json.dumps({"session_id": "zz", "tool_name": "Edit",
                             "tool_input": {"file_path": "run/effectif.json", "old_string": "a", "new_string": "b"}})
        r = subprocess.run([sys.executable, str(ICI / "garde_vault.py")], input=entree, capture_output=True,
                           text=True, env=dict(os.environ), cwd=str(BANC))
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(r.stdout)["hookSpecificOutput"]["permissionDecisionReason"],
                         "GARDE AGENTX — run/effectif.json : recruter/licencier = page de la salle (humain) ; "
                         "chef et agents : 0 écriture.")


if __name__ == "__main__":
    unittest.main()
