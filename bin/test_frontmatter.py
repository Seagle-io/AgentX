"""Tests de frontmatter.py : import leger, bloc de tete seul, aller-retour a l'octet.

Lancer : python3 -m unittest bin/test_frontmatter.py
"""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
import frontmatter   # noqa: E402
from frontmatter import Texte, ecrire_frontmatter, lire_frontmatter, lire_frontmatter_texte   # noqa: E402


class Frontmatter(unittest.TestCase):
    def test_import_sans_vx(self):
        r = subprocess.run([sys.executable, "-c", f"import sys; sys.path.insert(0, {str(ICI)!r}); "
                            "import frontmatter; print('vx' in sys.modules)"],
                           capture_output=True, text=True, check=True)
        self.assertEqual(r.stdout.strip(), "False")

    def test_vx_reexporte(self):
        import vx
        self.assertIs(vx.lire_frontmatter, frontmatter.lire_frontmatter)
        self.assertIs(vx.ecrire_frontmatter, frontmatter.ecrire_frontmatter)

    def test_statut_du_corps_ignore(self):
        self.assertEqual(lire_frontmatter_texte("---\na: 1\n---\nstatut: x\n")[0], {"a": "1"})

    def test_sans_tiret_texte_intact(self):
        self.assertEqual(lire_frontmatter_texte("a: 1\n"), ({}, "a: 1\n"))

    def test_liste_inline(self):
        self.assertEqual(lire_frontmatter_texte("---\nk: [a, b]\n---\n")[0]["k"], ["a", "b"])

    def test_guillemets_donnent_texte(self):
        v = lire_frontmatter_texte('---\nk: "x"\n---\n')[0]["k"]
        self.assertEqual(v, "x")
        self.assertIsInstance(v, Texte)

    def test_absent(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(lire_frontmatter(Path(d) / "nul.md"), ({}, ""))

    def test_aller_retour_octet(self):
        brut = '---\nk:   "x"\nl: [a,b]\n# c\n---\ncorps\n'
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "a.md"
            f.write_text(brut, encoding="utf-8")
            meta, corps = lire_frontmatter(f)
            ecrire_frontmatter(f, meta, corps)
            self.assertEqual(f.read_bytes(), brut.replace("# c\n", "").encode())


if __name__ == "__main__":
    unittest.main()
