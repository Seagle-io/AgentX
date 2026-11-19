"""produit_du : brief, sinon préfixe de slug, sinon entreprise."""
import unittest
from unittest import mock

import produits


class ProduitDu(unittest.TestCase):
    def setUp(self):
        for n, v in [("erreur", ""), ("tous", ("agentx", "geolens", "kora", "seagle"))]:
            p = mock.patch.object(produits, n, return_value=v)
            p.start()
            self.addCleanup(p.stop)
        e = mock.Mock(cle="seagle")
        p = mock.patch.object(produits, "entreprise", return_value=e)
        p.start()
        self.addCleanup(p.stop)

    def test_brief_prime(self):
        self.assertEqual(produits.produit_du("kora-x", {"produit": "geolens"}), ("geolens", "brief"))

    def test_slug_agentx(self):
        self.assertEqual(produits.produit_du("agentx-comptes", {}), ("agentx", "slug"))

    def test_slug_date_ote(self):
        self.assertEqual(produits.produit_du("2026-10-20-geolens-v2", {}), ("geolens", "slug"))

    def test_entreprise(self):
        self.assertEqual(produits.produit_du("salle-premium-a2", {}), ("seagle", "defaut"))

    def test_registre_invalide(self):
        with mock.patch.object(produits, "erreur", return_value="KO"):
            self.assertEqual(produits.produit_du("agentx-comptes", {}), ("", ""))

    def test_brief_inconnu_slug_kora(self):
        self.assertEqual(produits.produit_du("kora-x", {"produit": "inconnu"}), ("kora", "slug"))


if __name__ == "__main__":
    unittest.main()
