"""Registre des produits (bin/produits.py, contrat seagle-pilotage §C1).

Le module est importé par chemin depuis AGENTX_BIN (défaut : bin/ du dépôt) ;
une copie modifiée y est passée pour prouver qu'un défaut fait échouer les tests.
Registres temporaires uniquement ; le vrai produits.json n'est que lu.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

DEPOT = Path(__file__).resolve().parent.parent
BIN = Path(os.environ.get("AGENTX_BIN", DEPOT / "bin"))


def charger_module():
    """Module produits neuf (cache vide), importé par chemin."""
    spec = importlib.util.spec_from_file_location("produits_sous_test", BIN / "produits.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod  # dataclasses résout les annotations via sys.modules
    sys.dont_write_bytecode = True  # 0 écriture dans bin/__pycache__
    spec.loader.exec_module(mod)
    return mod


def git(depot: Path, *argv: str) -> None:
    subprocess.run(["git", "-c", "user.email=t@t", "-c", "user.name=t", "-C", str(depot), *argv],
                   check=True, capture_output=True)


def produit(cle: str, couleur: str, entreprise: bool = False, **sur) -> dict:
    p = {"cle": cle, "nom": cle.capitalize(), "sous": "sous-titre", "couleur": couleur,
         "entreprise": entreprise, "etat": "actif", "env": "",
         "depots": [{"chemin": "/tmp/x", "branche_publication": "main", "ui": ["src"]}],
         "site": {"depot": "~/site", "branche": "main", "pages": ["p/*.tsx"], "textes": [],
                  "captures": ["c/*.webp"]},
         "marketing": {"vault": "/tmp/m", "calendriers": ["cal.md"], "motifs": ["Kora"]},
         "sources": [{"domaine": "finance", "chemin": "/tmp/bp.md"}]}
    p.update(sur)
    return p


def registre() -> dict:
    return {"version": 1, "produits": [
        produit("kora", "#14b8a6"),
        produit("geolens", "#38bdf8", env="vault/projets/geolens/env.md"),
        produit("seagle", "#e2b04a", entreprise=True, site=None, depots=[], marketing=None, sources=[])]}


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.m = charger_module()
        self.f = self.dir / "produits.json"

    def tearDown(self):
        self.tmp.cleanup()

    def ecrire(self, brut, f: Path | None = None) -> Path:
        f = f or self.f
        f.write_text(brut if isinstance(brut, str) else json.dumps(brut), encoding="utf-8")
        return f

    def brancher(self, brut) -> None:
        """Le registre par défaut (FICHIER figé à l'import) pointe sur le registre temporaire."""
        self.ecrire(brut)
        self.m.FICHIER = self.f
        self.m.charger.__defaults__ = (self.f,)


class RegistreValide(Base):
    def test_charger_ordre_du_fichier(self):
        r = self.m.charger(self.ecrire(registre()))
        self.assertEqual(list(r), ["kora", "geolens", "seagle"])
        k = r["kora"]
        self.assertIsInstance(k, self.m.Produit)
        self.assertEqual(k.depots, (self.m.Depot("/tmp/x", "main", ("src",)),))
        self.assertEqual(k.site, self.m.Site("~/site", "main", ("p/*.tsx",), (), ("c/*.webp",)))
        self.assertEqual(k.marketing, self.m.Marketing("/tmp/m", ("cal.md",), ("Kora",)))
        self.assertEqual(k.sources, (self.m.Source("finance", "/tmp/bp.md"),))
        self.assertIsNone(r["seagle"].site)

    def test_tous_entreprise_produit(self):
        self.brancher(registre())
        self.assertEqual(self.m.erreur(), "")
        self.assertEqual(self.m.tous(), ("kora", "geolens", "seagle"))
        self.assertEqual(self.m.entreprise().cle, "seagle")
        self.assertEqual(self.m.produit("geolens").env, "vault/projets/geolens/env.md")
        self.assertIsNone(self.m.produit("zz"))

    def test_produit_de_brief_defaut_inconnu(self):
        self.brancher(registre())
        self.assertEqual(self.m.produit_de({"produit": "kora"}), ("kora", "brief"))
        self.assertEqual(self.m.produit_de({"produit": "seagle"}), ("seagle", "brief"))
        self.assertEqual(self.m.produit_de({}), ("seagle", "defaut"))
        self.assertEqual(self.m.produit_de({"produit": ""}), ("seagle", "defaut"))
        self.assertEqual(self.m.produit_de({"produit": "zz"}), ("seagle", "defaut"))

    def test_registre_invalide_api_degradee(self):
        self.brancher({"version": 2, "produits": []})
        self.assertEqual(self.m.erreur(), "version : 2 invalide (attendu 1)")
        self.assertEqual(self.m.tous(), ())
        self.assertIsNone(self.m.produit("kora"))
        self.assertIsNone(self.m.entreprise())
        self.assertEqual(self.m.produit_de({"produit": "kora"}), ("", ""))

    def test_fichier_absent_ou_illisible(self):
        with self.assertRaises(self.m.RegistreInvalide) as cm:
            self.m.charger(self.dir / "absent.json")
        self.assertEqual(str(cm.exception), "absent.json absent")
        with self.assertRaises(self.m.RegistreInvalide) as cm:
            self.m.charger(self.ecrire("{pas du json"))
        self.assertTrue(str(cm.exception).startswith("produits.json illisible : "), cm.exception)

    def test_bords_valides(self):
        r = registre()
        r["produits"][0].update(depots=[], site=None, marketing=None, sources=[], env="")
        r["produits"][1]["marketing"]["motifs"] = []
        r["produits"][1]["etat"] = "archive"
        r["produits"][0]["nom"] = "n" * 24
        r["produits"][0]["sous"] = "s" * 48
        self.assertEqual(list(self.m.charger(self.ecrire(r))), ["kora", "geolens", "seagle"])

    def test_vrai_registre_valide(self):
        r = self.m.charger(DEPOT / "produits.exemple.json")
        self.assertEqual(sum(p.entreprise for p in r.values()), 1)


def muter(chemin: str, valeur):
    """Fabrique : registre() dont la clé pointée (a.b.0.c) vaut `valeur`."""
    def f():
        r = registre()
        *tete, der = chemin.split(".")
        o = r
        for k in tete:
            o = o[int(k)] if k.isdigit() else o[k]
        o[int(der) if der.isdigit() else der] = valeur
        return r
    return f


def deux_entreprises():
    r = registre()
    r["produits"][1]["entreprise"] = True
    return r


def aucune_entreprise():
    r = registre()
    r["produits"][2]["entreprise"] = False
    return r


def cle_double():
    r = registre()
    r["produits"][1]["cle"] = "kora"
    return r


def couleur_double():
    r = registre()
    r["produits"][2]["couleur"] = "#14b8a6"
    return r


def sans_champ():
    r = registre()
    del r["produits"][1]["sources"]
    return r


INVALIDES = [
    ("racine", lambda: [], "racine : list invalide (objet attendu)"),
    ("version", muter("version", 2), "version : 2 invalide (attendu 1)"),
    ("version bool", muter("version", True), "version : True invalide (attendu 1)"),
    ("produits vide", muter("produits", []), "produits : [] invalide (liste non vide attendue)"),
    ("produit non objet", muter("produits.1", "x"), "produits[1] : 'x' invalide (objet attendu)"),
    ("type bool≠int", muter("produits.0.entreprise", 0), "produits[0].entreprise : 0 invalide (bool attendu)"),
    ("champ absent", sans_champ, "produits[1].sources : None invalide (list attendu)"),
    ("site type", muter("produits.0.site", []), "produits[0].site : [] invalide (dict|null attendu)"),
    ("cle", muter("produits.0.cle", "Kora"), "produits[0].cle : Kora invalide ([a-z][a-z0-9]{1,19})"),
    ("cle courte", muter("produits.0.cle", "k"), "produits[0].cle : k invalide ([a-z][a-z0-9]{1,19})"),
    ("cle double", cle_double, "produits[1].cle : kora invalide (en double, déjà produits[0])"),
    ("nom long", muter("produits.0.nom", "n" * 25), f"produits[0].nom : {'n' * 25!r} invalide (1..24 car.)"),
    ("sous vide", muter("produits.1.sous", ""), "produits[1].sous : '' invalide (1..48 car.)"),
    ("couleur", muter("produits.0.couleur", "#14B8A6"), "produits[0].couleur : #14B8A6 invalide (#[0-9a-f]{6})"),
    ("couleur double", couleur_double, "produits[2].couleur : #14b8a6 invalide (en double, déjà produits[0])"),
    ("etat", muter("produits.0.etat", "ferme"), "produits[0].etat : 'ferme' invalide (actif|archive)"),
    ("2 entreprises", deux_entreprises, "produits[2].entreprise : true invalide (déjà geolens, exactement 1)"),
    ("0 entreprise", aucune_entreprise, "produits : 0 entreprise invalide (exactement 1 entreprise:true)"),
    ("entreprise archivee", muter("produits.2.etat", "archive"),
     "produits[2].etat : 'archive' invalide (entreprise → actif)"),
    ("env", muter("produits.0.env", "vault/x.md"),
     "produits[0].env : 'vault/x.md' invalide (\"\" ou vault/projets/….md)"),
    ("depot chemin", muter("produits.0.depots.0.chemin", "rel/x"),
     "produits[0].depots[0].chemin : 'rel/x' invalide (commence par / ou ~/)"),
    ("depot ~user", muter("produits.0.depots.0.chemin", "~jd/x"),
     "produits[0].depots[0].chemin : '~jd/x' invalide (commence par / ou ~/)"),
    ("branche", muter("produits.0.depots.0.branche_publication", "a b"),
     "produits[0].depots[0].branche_publication : 'a b' invalide ([A-Za-z0-9._/-]{1,64})"),
    ("ui ..", muter("produits.0.depots.0.ui", ["src", "a/../b"]),
     "produits[0].depots[0].ui[1] : 'a/../b' invalide (relatif, sans ..)"),
    ("ui absolu", muter("produits.0.depots.0.ui", ["/src"]),
     "produits[0].depots[0].ui[0] : '/src' invalide (relatif, sans ..)"),
    ("site depot", muter("produits.0.site.depot", "site"),
     "produits[0].site.depot : 'site' invalide (commence par / ou ~/)"),
    ("site branche", muter("produits.0.site.branche", ""),
     "produits[0].site.branche : '' invalide ([A-Za-z0-9._/-]{1,64})"),
    ("site pages", muter("produits.0.site.pages", "p"), "produits[0].site.pages : 'p' invalide (liste attendue)"),
    ("captures vides", muter("produits.0.site.captures", []),
     "produits[0].site.captures : [] invalide (liste non vide attendue)"),
    ("marketing vault", muter("produits.1.marketing.vault", "m"),
     "produits[1].marketing.vault : 'm' invalide (commence par / ou ~/)"),
    ("calendriers vides", muter("produits.1.marketing.calendriers", []),
     "produits[1].marketing.calendriers : [] invalide (liste non vide attendue)"),
    ("motif non str", muter("produits.1.marketing.motifs", ["Geo", 3]),
     "produits[1].marketing.motifs[1] : 3 invalide (str attendu)"),
    ("domaine", muter("produits.0.sources.0.domaine", "rh"),
     "produits[0].sources[0].domaine : 'rh' invalide (finance|juridique|marketing|rssi|produit)"),
    ("source chemin", muter("produits.0.sources.0.chemin", "bp.md"),
     "produits[0].sources[0].chemin : 'bp.md' invalide (commence par / ou ~/)"),
]


class RegistresInvalides(Base):
    def test_une_regle_un_message(self):
        self.assertGreaterEqual(len(INVALIDES), 12)
        for nom, fabrique, attendu in INVALIDES:
            with self.subTest(nom):
                self.m._CACHE.clear()
                f = self.ecrire(fabrique(), self.dir / f"r{len(nom)}{abs(hash(nom))}.json")
                with self.assertRaises(self.m.RegistreInvalide) as cm:
                    self.m.charger(f)
                self.assertEqual(str(cm.exception), attendu)


class Cache(Base):
    def setUp(self):
        super().setUp()
        self.lectures = 0
        valider = self.m._valider

        def compte(brut):
            self.lectures += 1
            return valider(brut)
        self.m._valider = compte

    def test_deux_appels_une_lecture(self):
        f = self.ecrire(registre())
        a = self.m.charger(f)
        b = self.m.charger(f)
        self.assertEqual(self.lectures, 1)
        self.assertIs(a, b)

    def test_mtime_change_relu(self):
        f = self.ecrire(registre())
        st = f.stat()
        self.assertEqual(list(self.m.charger(f)), ["kora", "geolens", "seagle"])
        r = registre()
        r["produits"].pop(1)
        self.ecrire(r)
        os.utime(f, ns=(st.st_atime_ns, st.st_mtime_ns + 1_000_000_000))
        self.assertEqual(list(self.m.charger(f)), ["kora", "seagle"])
        self.assertEqual(self.lectures, 2)

    def test_meme_mtime_pas_relu(self):
        f = self.ecrire(registre())
        st = f.stat()
        self.m.charger(f)
        self.ecrire({"version": 2})
        os.utime(f, ns=(st.st_atime_ns, st.st_mtime_ns))
        self.assertEqual(list(self.m.charger(f)), ["kora", "geolens", "seagle"])
        self.assertEqual(self.lectures, 1)


class Verifier(Base):
    def p(self, **sur):
        base = dict(cle="kora", nom="Kora", sous="s", couleur="#000000", entreprise=False, etat="actif",
                    env="", depots=(), site=None, marketing=None, sources=())
        base.update(sur)
        return self.m.Produit(**base)

    def depot_git(self, nom="d", branche="main") -> Path:
        d = self.dir / nom
        (d / "src").mkdir(parents=True)
        (d / "src" / "a.ts").write_text("a")
        git(d, "init", "-q", "-b", branche)
        git(d, "add", ".")
        git(d, "commit", "-q", "-m", "init")
        return d

    def test_tout_present_vide(self):
        d = self.depot_git()
        (self.dir / "m").mkdir()
        (self.dir / "m" / "cal.md").write_text("x")
        p = self.p(depots=(self.m.Depot(str(d), "main", ("src",)),),
                   site=self.m.Site(str(d), "main", ("src/*.ts",), (), ("src/a.*",)),
                   marketing=self.m.Marketing(str(self.dir / "m"), ("cal.md",), ()),
                   sources=(self.m.Source("finance", str(d / "src" / "a.ts")),))
        self.assertEqual(self.m.verifier(p), [])

    def test_tilde_user_inconnu_ne_leve_pas(self):
        ch = "~zzinconnu-t022/x"
        p = self.p(depots=(self.m.Depot(ch, "main", ("src",)),),
                   site=self.m.Site(ch, "main", (), (), ("c/*",)),
                   marketing=self.m.Marketing(ch, ("cal.md",), ()),
                   sources=(self.m.Source("finance", ch),))
        ko = self.m.verifier(p)
        self.assertEqual(len(ko), 4, ko)
        self.assertTrue(all(k.startswith(f"{ch} : illisible (RuntimeError") for k in ko), ko)

    def test_dossier_sans_git(self):
        d = self.dir / "nu"
        (d / "src").mkdir(parents=True)
        p = self.p(depots=(self.m.Depot(str(d), "main", ("src",)),))
        self.assertEqual(self.m.verifier(p), [f"{d} : pas un dépôt git"])

    def test_branche_absente(self):
        d = self.depot_git(branche="master")
        p = self.p(depots=(self.m.Depot(str(d), "main", ("src",)),))
        self.assertEqual(self.m.verifier(p), [f"{d} : branche main absente"])

    def test_absents(self):
        d = self.depot_git()
        absent = str(self.dir / "zz")
        p = self.p(env="vault/projets/zz-t022/env.md",
                   depots=(self.m.Depot(str(d), "main", ("src", "web")), self.m.Depot(absent, "main", ())),
                   site=self.m.Site(str(d), "main", ("pages/*.tsx",), (), ("src/a.ts",)),
                   marketing=self.m.Marketing(str(d), ("cal.md",), ()),
                   sources=(self.m.Source("finance", absent),))
        self.assertEqual(self.m.verifier(p), [
            "env vault/projets/zz-t022/env.md : absent",
            f"{d}/web : absent",
            f"{absent} : absent",
            f"{d}/pages/*.tsx : aucun fichier",
            f"{d}/cal.md : absent",
            f"{absent} : absent"])


if __name__ == "__main__":
    unittest.main()
