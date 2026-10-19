"""Tests attributs de role (contrat-roles-attributs@v1) : roles.json -> roles.py.

Lancer : python3 -m unittest bin/test_roles.py
Registres fabriques en tmp : le vrai roles.json n'est lu que par registre_reel_valeurs.
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import roles  # noqa: E402


def _entree(cle, couleur, affectable=True, **extra):
    return {"cle": cle, "nom": cle.upper(), "sous": "s", "livrable": "l", "couleur": couleur,
            "modele": "sonnet" if affectable else "", "affectable": affectable,
            "livre_en": "fait" if affectable else "", "juge": False, "objet": "pack", **extra}


def _registre(*, a=None, b=None, chef=None):
    return {"version": 1, "roles": [
        _entree("chef", "#000001", False, **(chef or {})),
        _entree("alpha", "#000002", **(a or {})),
        _entree("beta", "#000003", **(b or {})),
        _entree("vault", "#000004", False),
    ]}


class TestRoles(unittest.TestCase):
    def _charger(self, brut):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "roles.json"
            f.write_text(json.dumps(brut), encoding="utf-8")
            return roles.charger(f)

    def test_defauts_sans_cles(self):
        r = self._charger(_registre())["alpha"]
        self.assertEqual((r.contrats_libres, r.code, r.enquete, r.sollicitables), (False, False, False, ()))

    def test_registre_reel_valeurs(self):
        self.assertEqual(roles.erreur(), "")
        self.assertEqual(roles.contrats_libres(), ("eclaireur", "scribe", "syndicat"))
        self.assertEqual(roles.codeurs(), ("implementeur", "testeur", "devops"))
        self.assertEqual(roles.enqueteur(), "syndicat")
        self.assertEqual(roles.sollicitables("syndicat"), ("eclaireur", "architecte", "verificateur", "syndicat"))
        self.assertEqual(roles.sollicitables("inconnu"), ())

    def test_type_invalide_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, r"roles\[1\]\.code : 'oui' invalide \(bool attendu\)"):
            self._charger(_registre(a={"code": "oui"}))

    def test_sollicitable_inconnu_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, "alpha.sollicitables ∋ zeta inconnu ou non affectable"):
            self._charger(_registre(a={"sollicitables": ["zeta"]}))

    def test_sollicitable_non_affectable_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, "alpha.sollicitables ∋ chef inconnu ou non affectable"):
            self._charger(_registre(a={"sollicitables": ["chef"]}))

    def test_sollicitables_doublon_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, r"roles\[1\]\.sollicitables .* invalide"):
            self._charger(_registre(a={"sollicitables": ["beta", "beta"]}))

    def test_enquete_sans_sollicitables_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, r"roles\[1\]\.enquete : true sans sollicitables"):
            self._charger(_registre(a={"enquete": True}))

    def test_deux_enqueteurs_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, "enquete sur alpha, beta — un seul enquêteur"):
            self._charger(_registre(a={"enquete": True, "sollicitables": ["beta"]},
                                    b={"enquete": True, "sollicitables": ["alpha"]}))

    def test_non_affectable_attribut_ko(self):
        with self.assertRaisesRegex(roles.RegistreInvalide, r"roles\[0\]\.code : invalide \(non affectable"):
            self._charger(_registre(chef={"code": True}))


if __name__ == "__main__":
    unittest.main()
