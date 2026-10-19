"""pack-lint (bin/vx.py cmd_pack_lint) : colonne Chemin seule, accolades, fichier de types jumeau.

Packs et dépôt factices dans un TemporaryDirectory ; vx.ROOT et vx._trouver_tache sont substitués.
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

DEPOT = Path(__file__).resolve().parent.parent
BIN = Path(os.environ.get("AGENTX_BIN", DEPOT / "bin"))

sys.dont_write_bytecode = True
sys.path.insert(0, str(BIN))  # vx importe produits, roles
spec = importlib.util.spec_from_file_location("vx_sous_test", BIN / "vx.py")
vx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vx)

GABARIT = (DEPOT / "vault/_templates/context.md").read_text(encoding="utf-8").replace("TODO-PACK", "ok")


def pack(wl: str) -> str:
    """Gabarit réel dont la section « Fichiers autorisés » est remplacée par wl."""
    import re
    return re.sub(r"(##\s*Fichiers autoris\S*s).*?(?=\n## )", lambda m: m.group(1) + "\n" + wl + "\n",
                  GABARIT, count=1, flags=re.S)


def lint(racine: Path, contenu: bytes | str) -> tuple[int, str]:
    """(code de sortie, sortie) de pack-lint sur un pack temporaire."""
    d = racine / "vault" / "t"
    d.mkdir(parents=True, exist_ok=True)
    (d / "context.md").write_bytes(contenu if isinstance(contenu, bytes) else contenu.encode())
    vx.ROOT = racine
    vx._trouver_tache = lambda projet, tid: (d.parent, d, {"id": "T001", "statut": "pret"})
    sortie, code = io.StringIO(), 0
    with contextlib.redirect_stdout(sortie):
        try:
            vx.cmd_pack_lint(SimpleNamespace(projet="p", tid="T001"))
        except SystemExit as e:
            code = e.code
    return code, sortie.getvalue()


def tableau(*lignes: str) -> str:
    return "| Chemin | Droit | Pourquoi |\n|---|---|---|\n" + "\n".join(lignes)


class PackLint(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.racine = Path(self._tmp.name)
        self._orig = (vx.ROOT, vx._trouver_tache)
        self.addCleanup(lambda: (setattr(vx, "ROOT", self._orig[0]),
                                 setattr(vx, "_trouver_tache", self._orig[1])))

    def touche(self, *chemins: str):
        for c in chemins:
            f = self.racine / c
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text("x")

    def test_pourquoi_ignore(self):
        self.touche("a.py")
        code, out = lint(self.racine, pack(tableau("| `a.py` | E | voir `zz/inconnu.py` et `y/z.py` |")))
        self.assertIn("1 fichier(s)", out)
        self.assertNotIn("introuvable", out)
        self.assertEqual(code, 0)

    def test_accolades_comptees(self):
        self.touche("a/x.ts", "a/y.ts")
        code, out = lint(self.racine, pack(tableau("| `a/{x,y}.ts` | E | deux |")))
        self.assertIn("2 fichier(s)", out)
        self.assertEqual(code, 0)

    def test_treize_fichiers_erreur(self):
        lignes = [f"| `f{i}.py` | L | - |" for i in range(13)]
        self.touche(*(f"f{i}.py" for i in range(13)))
        code, out = lint(self.racine, pack(tableau(*lignes)))
        self.assertEqual(code, 2)
        self.assertIn("whitelist trop large : 13", out)

    def test_accolades_font_depasser(self):
        self.touche("a.py")
        code, out = lint(self.racine, pack(tableau("| `d/{a,b,c,d,e,f,g,h,i,j,k,l,m}.py` | L | - |")))
        self.assertEqual(code, 2)
        self.assertIn("13 fichiers", out)

    def test_jumeau_manquant_erreur(self):
        self.touche("x.mjs", "x.d.mts")
        code, out = lint(self.racine, pack(tableau("| `x.mjs` | E | - |")))
        self.assertEqual(code, 2)
        self.assertIn("x.d.mts", out)

    def test_jumeau_present_ok(self):
        self.touche("x.mjs", "x.d.mts", "y.js", "y.d.ts")
        code, out = lint(self.racine, pack(tableau("| `x.mjs` | E | - |", "| `x.d.mts` | E | - |",
                                                    "| `y.js` | E | - |", "| `y.d.ts` | E | - |")))
        self.assertEqual(code, 0, out)

    def test_jumeau_inexistant_ou_en_lecture(self):
        self.touche("x.mjs", "y.js", "y.d.ts")
        code, out = lint(self.racine, pack(tableau("| `x.mjs` | E | - |", "| `y.js` | L | - |")))
        self.assertEqual(code, 0, out)

    def test_non_resolubles_sans_avertissement(self):
        code, out = lint(self.racine, pack(tableau("| `<R>/a.py` | L | - |", "| `~/b.py` | L | - |",
                                                    "| `/hors/depot/c.py` | L | - |")))
        self.assertNotIn("introuvable", out)
        self.assertEqual(code, 0)

    def test_sans_tableau(self):
        code, out = lint(self.racine, pack("Aucune liste ici."))
        self.assertIn("aucun fichier en backticks", out)

    def test_hostile_sans_pipe_final(self):
        code, out = lint(self.racine, pack("| Chemin | Droit |\n|---|---|\n| `a.py` | E"))
        self.assertIn(code, (0, 2))
        self.assertIn("1 fichier(s)", out)

    def test_hostile_backticks_non_fermes(self):
        code, out = lint(self.racine, pack("| `a.py | E | - |\n| `b.py` | L | `oups"))
        self.assertIn(code, (0, 2))

    def test_hostile_non_utf8(self):
        code, out = lint(self.racine, b"\xff\xfe## Fichiers autoris\xe9s\n| `a.py` | E | \xe9\xff |")
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()
