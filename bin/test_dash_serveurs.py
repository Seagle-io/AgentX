#!/usr/bin/env python3
"""Tests de dash._serveurs : sondes et services d'environnement rattaches a un etage."""
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dash  # noqa: E402
import environnement  # noqa: E402
import supervision  # noqa: E402

CFG = {"sondes": [
    {"nom": "a", "url": "https://a.test/", "etages": ["seagle"], "env": "staging"},
    {"nom": "b", "url": "https://b.test/", "etages": ["seagle-prod"]},
    {"nom": "c", "url": "https://c.test/", "etages": ["kora"]},
    {"nom": "d", "etages": ["seagle"]},
    {"nom": "g", "url": "https://g.test/"},
]}
SUP = {"sondes": [
    {"nom": "a", "etat": "ok", "ms": 42, "detail": ""},
    {"nom": "b", "etat": "ko", "detail": "timeout"},
    {"nom": "c", "etat": "ok", "ms": 7, "detail": ""},
    {"nom": "d", "etat": "config", "detail": "ni url ni fichier"},
    {"nom": "g", "etat": "ok", "ms": 1, "detail": ""},
]}


def svc(nom, projets):
    return mock.Mock(nom=nom, projets=tuple(projets))


def etat_env(s):
    return {"nom": s.nom, "etat": {"v": "vivant", "k": "ko", "m": "mort", "e": "etranger"}[s.nom[0]], "url": f"http://127.0.0.1/{s.nom}"}


class Serveurs(unittest.TestCase):
    def setUp(self):
        dash._cache_env.update(t=0.0, services=[])
        for p in (mock.patch.object(supervision, "config", return_value=CFG),
                  mock.patch.object(environnement, "charger", return_value={})):
            p.start()
            self.addCleanup(p.stop)

    def noms(self, c, projets):
        return {s["nom"]: s for s in dash._serveurs(c, projets, SUP)}

    def test_cle_etage_et_slug_projet(self):
        r = self.noms("seagle", ["seagle-prod"])
        self.assertEqual(set(r), {"a", "b", "d"})
        self.assertEqual(r["a"], {"nom": "a", "env": "staging", "etat": "ok", "latence_ms": 42, "url": "https://a.test/"})
        self.assertEqual((r["b"]["env"], r["b"]["etat"], r["b"]["latence_ms"]), ("prod", "ko", None))

    def test_config_warn_et_url_absente(self):
        r = self.noms("seagle", [])
        self.assertEqual((r["d"]["etat"], r["d"]["url"]), ("warn", None))
        self.assertNotIn("b", r)

    def test_non_rattachee(self):
        self.assertEqual(dash._serveurs("admission", ["admission"], SUP), [])

    def test_services_env(self):
        tous = {"vivant": svc("vivant", ["x"]), "ko": svc("k", ["x"]), "mort": svc("mort", ["x"]),
                "etr": svc("etranger", ["x"]), "autre": svc("vautre", ["y"])}
        with mock.patch.object(environnement, "charger", return_value=tous), \
                mock.patch.object(environnement, "etat", side_effect=etat_env):
            r = {s["nom"]: s for s in dash._serveurs("kora", ["x"], {"sondes": []})}
        self.assertEqual({n: (s["env"], s["etat"], s["latence_ms"]) for n, s in r.items()},
                         {"vivant": ("dev", "ok", None), "k": ("dev", "warn", None),
                          "mort": ("dev", "ko", None), "etranger": ("dev", "ko", None)})
        self.assertEqual(r["vivant"]["url"], "http://127.0.0.1/vivant")

    def test_env_absent_ou_invalide(self):
        self.assertEqual(dash._serveurs("zzz", [], {"sondes": []}), [])
        with mock.patch.object(environnement, "charger", side_effect=environnement.ErreurEnv(1, "JSON invalide")):
            self.assertEqual(dash._serveurs("zzz", [], {"sondes": []}), [])

    def test_cache_une_lecture(self):
        with mock.patch.object(environnement, "charger", return_value={"v": svc("vivant", ["x"])}) as ch, \
                mock.patch.object(environnement, "etat", side_effect=etat_env) as et:
            dash._serveurs("x", [], {"sondes": []})
            dash._serveurs("x", [], {"sondes": []})
        self.assertEqual((ch.call_count, et.call_count), (1, 1))


if __name__ == "__main__":
    unittest.main()
