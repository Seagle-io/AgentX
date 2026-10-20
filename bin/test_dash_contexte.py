#!/usr/bin/env python3
"""Tests dash._contexte_chef / _immeuble_chefs : racine de banc sous AGENTX_ROOT (tmp), le vrai run/ n'est jamais touché."""
import json
import os
import sys
import tempfile
import unittest
import unittest.mock
from datetime import datetime, timedelta
from pathlib import Path

ICI = Path(__file__).resolve().parent
BANC = Path(tempfile.mkdtemp(prefix="banc-T020-"))
sys.path.insert(0, str(ICI))
with unittest.mock.patch.dict(os.environ, {"AGENTX_ROOT": str(BANC)}):    # import seul : les autres modules gardent leur env
    import dash  # noqa: E402

PATCHS = [unittest.mock.patch.dict(os.environ, {"AGENTX_ROOT": str(BANC)}),
          unittest.mock.patch.object(dash, "ROOT", BANC)]


def setUpModule():
    for p in PATCHS:
        p.start()


def tearDownModule():
    for p in PATCHS:
        p.stop()


def noter(cle: str, tokens: int, age_h: float = 0) -> None:
    d = BANC / "run" / "contexte"
    d.mkdir(parents=True, exist_ok=True)
    t = (datetime.now() - timedelta(hours=age_h)).isoformat(timespec="seconds")
    (d / f"{cle}.json").write_text(json.dumps({"tokens": tokens, "t": t}), encoding="utf-8")


class Contexte(unittest.TestCase):
    def tearDown(self):
        (BANC / "contexte.json").unlink(missing_ok=True)

    def test_ajoute_defauts(self):
        noter("defaut", 850_000)
        r = dash._immeuble_chefs([{"cle": "defaut", "defaut": True, "projets": ["x"]}])["chefs"][0]
        self.assertNotIn("projets", r)
        self.assertEqual((r["contexte"]["tokens"], r["contexte"]["pct"], r["contexte"]["alerte"]), (850_000, 85.0, True))

    def test_sous_seuil_et_config(self):
        noter("a", 300_000)
        self.assertFalse(dash._contexte_chef("a")["alerte"])
        (BANC / "contexte.json").write_text('{"fenetre": 400000, "alerte": 0.5}', encoding="utf-8")
        c = dash._contexte_chef("a")
        self.assertEqual((c["pct"], c["alerte"]), (75.0, True))

    def test_perime_ou_absent_none(self):
        noter("vieux", 10, age_h=7)
        self.assertIsNone(dash._contexte_chef("vieux"))
        self.assertIsNone(dash._contexte_chef("nul"))


if __name__ == "__main__":
    unittest.main()
