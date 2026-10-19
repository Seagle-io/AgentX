"""Tests tenue CLI (lots A et B) : pack-lint 1 ligne, cache pack_sha, pret auto, enfants au pret.

Lancer : python3 -m unittest bin/test_vx_tenue.py
Banc jetable .cache/banc-T097/b<pid> : le vrai vault n'est jamais touche.
"""

import os
import re
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = DEPOT / ".cache" / "banc-T097" / f"b{os.getpid()}"
TASK = BANC / "vault" / "projets" / "banc" / "taches"

PACK = """# Pack {tid}
## Mission
banc
## Definition of Done
- [ ] banc
## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | banc |
## Contrats
```
def banc() -> None
```
## Décisions actées
∅
## Hors périmètre
∅
## Environnement
∅
## Budget
∅
## Format de sortie
result.md
"""


def setUpModule():
    (BANC / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "frontmatter.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(DEPOT / "roles.json", BANC / "roles.json")
    (BANC / "vault" / "_templates").mkdir(parents=True)
    for f in ("task.md", "context.md"):
        shutil.copy(DEPOT / "vault" / "_templates" / f, BANC / "vault" / "_templates" / f)
    (BANC / "vault" / "projets" / "banc").mkdir(parents=True)


def tearDownModule():
    shutil.rmtree(BANC)


def vx(*args: str, entree: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(BANC / "bin" / "vx.py"), *args],
                          capture_output=True, text=True, cwd=str(BANC), input=entree)


def creer(role: str = "implementeur", *extra: str) -> str:
    r = vx("tache", "banc", "--projet", "banc", "--role", role, *extra)
    assert r.returncode == 0, r.stderr
    tid = r.stdout.split()[0]
    remplir(tid)
    return tid


def dossier(tid: str) -> Path:
    return next(TASK.glob(f"{tid}-*"))


def remplir(tid: str):
    (dossier(tid) / "context.md").write_text(PACK.format(tid=tid), encoding="utf-8")


def lire(tid: str, fichier: str = "task.md") -> str:
    return (dossier(tid) / fichier).read_text(encoding="utf-8")


def lint(tid: str, *args: str) -> subprocess.CompletedProcess:
    return vx("pack-lint", tid, "--projet", "banc", *args)


def ids() -> list[str]:
    return sorted(p.name.split("-")[0] for p in TASK.iterdir())


class TenueCli(unittest.TestCase):
    def test_ok_une_ligne(self):
        r = lint(creer())
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(r.stdout.splitlines()), 1)
        self.assertRegex(r.stdout, r"^T\d+ OK \(\d+ l\., ~\d+ tok, 1 WL\)")

    def test_ko_une_ligne_rc1(self):
        tid = creer()
        (dossier(tid) / "context.md").write_text("# vide\n", encoding="utf-8")
        r = lint(tid)
        self.assertEqual(r.returncode, 1)
        self.assertEqual(len(r.stdout.splitlines()), 1)
        self.assertRegex(r.stdout, rf"^{tid} KO: section manquante")
        self.assertNotIn("pack_sha", lire(tid))
        self.assertIn("statut: a-faire", lire(tid))

    def test_cache_saute(self):
        tid = creer()
        lint(tid)
        avant = (dossier(tid) / "task.md").stat().st_mtime_ns
        r = lint(tid)
        self.assertRegex(r.stdout, rf"^{tid} OK \(cache\)")
        self.assertEqual((dossier(tid) / "task.md").stat().st_mtime_ns, avant)

    def test_force_relint(self):
        tid = creer()
        lint(tid)
        self.assertRegex(lint(tid, "--force").stdout, r"OK \(\d+ l\.")

    def test_lint_version_perime(self):
        tid = creer()
        lint(tid)
        vx_py = BANC / "bin" / "vx.py"
        src = vx_py.read_text(encoding="utf-8")
        vx_py.write_text(src.replace('LINT_VERSION = "2"', 'LINT_VERSION = "9"'), encoding="utf-8")
        try:
            self.assertRegex(lint(tid).stdout, r"OK \(\d+ l\.")
        finally:
            vx_py.write_text(src, encoding="utf-8")

    def test_pret_auto_journal(self):
        tid = creer()
        r = lint(tid)
        self.assertIn("a-faire -> pret", r.stdout)
        self.assertIn("statut: pret", lire(tid))
        self.assertRegex(lire(tid), r"pack_sha: [0-9a-f]{16}")
        journal = (BANC / "vault" / "projets" / "banc" / "journal.md").read_text(encoding="utf-8")
        self.assertRegex(journal, rf"{tid} statut a-faire -> pret \[lint\]")

    def test_tache_sans_enfant(self):
        avant = len(ids())
        creer()
        self.assertEqual(len(ids()), avant + 1)

    def test_enfants_au_pret(self):
        tid = creer()
        avant = len(ids())
        r = lint(tid)
        self.assertEqual(len(ids()), avant + 1)
        self.assertRegex(r.stdout, r"\+ T\d+ verificateur")
        self.assertEqual(len(r.stdout.splitlines()), 1)

    def test_sans_verif_respecte(self):
        tid = creer("implementeur", "--sans-verif", "trivial")
        avant = len(ids())
        lint(tid)
        self.assertEqual(len(ids()), avant)

    def test_set_pret_refuse(self):
        tid = creer()
        r = vx("set", tid, "--statut", "pret", "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertIn("pret = pack-lint vert", r.stderr)
        self.assertIn("statut: a-faire", lire(tid))

    def test_set_pret_force(self):
        tid = creer()
        r = vx("set", tid, "--statut", "pret", "--projet", "banc", "--force")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("statut: pret", lire(tid))

    def test_ancien_sans_pack_sha(self):
        tid = creer()
        self.assertNotIn("pack_sha", lire(tid))
        r = lint(tid)
        self.assertNotIn("(cache)", r.stdout)
        self.assertIn("a-faire -> pret", r.stdout)

    def test_avertissements_sous_v(self):
        tid = creer()
        (dossier(tid) / "context.md").write_text(
            PACK.format(tid=tid).replace("`bin/vx.py`", "`bin/inexistant.py`"), encoding="utf-8")
        sans = lint(tid, "--force")
        self.assertRegex(sans.stdout, r"~ 1 avert\. \(--v\)")
        self.assertEqual(len(sans.stdout.splitlines()), 1)
        avec = lint(tid, "--force", "--v")
        self.assertEqual(len(avec.stdout.splitlines()), 2)
        self.assertRegex(avec.stdout, r"\n~ chemin introuvable")


class LotD(unittest.TestCase):
    def _tache_pack(self, entree: str, *pack: str):
        return vx("tache", "banc", "--projet", "banc", "--role", "implementeur", *pack, entree=entree)

    def test_pack_stdin_ok(self):
        corps = PACK.format(tid="X").split("\n", 1)[1]   # sans le H1 : le titre est pose
        r = self._tache_pack(corps, "--pack", "-")
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        self.assertRegex(r.stdout.splitlines()[0], rf"^{tid}  vault/.+/context\.md$")
        self.assertRegex(r.stdout.splitlines()[1], rf"^{tid} OK \(")
        pack = lire(tid, "context.md")
        self.assertRegex(pack, rf"^---\npack: {tid}\nprojet: banc\nrole: implementeur\ncree: \d{{4}}-\d\d-\d\d\n---\n\n# Pack {tid} — banc\n")
        self.assertIn("## Mission\nbanc", pack)
        self.assertIn("statut: pret", lire(tid))

    def test_pack_stdin_ko_reste_a_faire(self):
        r = self._tache_pack("## Mission\nvide\n", "--pack", "-")
        self.assertEqual(r.returncode, 1)
        tid = r.stdout.split()[0]
        self.assertRegex(r.stdout.splitlines()[1], rf"^{tid} KO: ")
        self.assertIn("statut: a-faire", lire(tid))
        self.assertIn("## Mission\nvide", lire(tid, "context.md"))

    def test_pack_fichier(self):
        f = BANC / "pack.md"
        f.write_text(PACK.format(tid="X"), encoding="utf-8")
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--pack", str(f))
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertRegex(r.stdout.splitlines()[1], r"^T\d+ OK \(")
        self.assertTrue(lire(r.stdout.split()[0], "context.md").startswith("---\npack: T"))

    def test_dispatch_sans_pack_usage(self):
        creer()
        avant = len(ids())
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--dispatch")
        self.assertEqual(r.returncode, 1)
        self.assertIn("--dispatch exige --pack", r.stderr)
        self.assertEqual(len(ids()), avant)

    def test_retenir_en_cours_result_revue(self):
        tid = creer()
        vx("set", tid, "--statut", "en-cours", "--projet", "banc", "--force")
        r = vx("retenir", tid, "--projet", "banc", "--sans-eval")
        self.assertEqual(r.returncode, 1)
        self.assertIn("result.md : absent", r.stderr)
        (dossier(tid) / "result.md").write_text(f"---\ntache: {tid}\nstatut: revue\n---\n## Livre\n", encoding="utf-8")
        r = vx("retenir", tid, "--projet", "banc", "--sans-eval")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("statut: fait", lire(tid))
        journal = (BANC / "vault" / "projets" / "banc" / "journal.md").read_text(encoding="utf-8")
        self.assertIn(f"{tid} statut en-cours -> revue (result.md)", journal)
        self.assertIn(f"{tid} statut revue -> fait (retenue, eval chef)", journal)

    def test_integrer_court(self):
        tid = creer()
        vx("set", tid, "--statut", "revue", "--projet", "banc", "--force")
        (dossier(tid) / "result.md").write_text(
            f"---\ntache: {tid}\nstatut: revue\n---\n## Pour la suite\n- suite1\n## Écarts\n- ecart1\n"
            "## Vérifié comment\n- verif1\n## Retour sur le pack\n- retour1\n", encoding="utf-8")
        court = vx("integrer", tid, "--projet", "banc", "--court").stdout
        self.assertIn("suite1", court)
        self.assertIn("ecart1", court)
        self.assertNotIn("verif1", court)
        self.assertNotIn("retour1", court)
        self.assertIn("verif1", vx("integrer", tid, "--projet", "banc").stdout)


class VerdictPropose(unittest.TestCase):
    def setUp(self):
        sys.path.insert(0, str(BANC / "bin"))
        os.environ["AGENTX_ROOT"] = str(BANC)
        import vx as _vx
        self.vx = _vx

    def _verdict(self, statut: str, verifie: str, ecarts: str, rstatut: str = "revue") -> str | None:
        texte = f"## Écarts\n{ecarts}\n## Vérifié comment\n{verifie}\n"
        return self.vx.verdict_propose("banc", "T9", statut, {"statut": rstatut}, texte)

    def test_ecarts_vides(self):
        self.assertTrue(self.vx.ecarts_vides("∅"))
        self.assertTrue(self.vx.ecarts_vides("- lecture hors WL: ∅"))
        self.assertFalse(self.vx.ecarts_vides(""))
        self.assertFalse(self.vx.ecarts_vides("- ∅\n- un vrai écart"))

    def test_retenir(self):
        self.assertEqual(self._verdict("revue", "- make test → OK", "- ∅"),
                         "python3 bin/vx.py retenir T9 --projet banc --sans-eval   # proposé : Vérifié sans NV, Écarts ∅")

    def test_nv(self):
        self.assertTrue(self._verdict("revue", "- NV — testé par l'humain", "∅").endswith("# proposé : NV dans Vérifié comment"))

    def test_ecarts_non_vides(self):
        r = self._verdict("revue", "- ok", "- un écart")
        self.assertIn('--role evaluateur --dep T9', r)
        self.assertTrue(r.endswith("# proposé : Écarts non vides"))

    def test_bloque_motif_cite(self):
        r = self._verdict("bloque", "∅", "- ∅\n- il faut l'accord", rstatut="bloque")
        self.assertEqual(r, "python3 bin/vx.py virer T9 --motif 'il faut l'\"'\"'accord' --projet banc   # proposé : bloque")

    def test_statut_hors_liste_none(self):
        self.assertIsNone(self._verdict("fait", "ok", "∅"))

    def test_integrer_verdict_ligne(self):
        tid = creer()
        vx("set", tid, "--statut", "revue", "--projet", "banc", "--force")
        (dossier(tid) / "result.md").write_text(
            f"---\ntache: {tid}\nstatut: revue\n---\n## Écarts\n- ∅\n## Vérifié comment\n- ok\n", encoding="utf-8")
        avec = vx("integrer", tid, "--projet", "banc", "--court", "--verdict").stdout
        self.assertIn(f"   -> python3 bin/vx.py retenir {tid} --projet banc --sans-eval   # proposé : ", avec)
        self.assertNotIn("   -> ", vx("integrer", tid, "--projet", "banc", "--court").stdout)


def pack_avec(tid: str, dod: str = "- [ ] banc", contrats: str = "```\ndef banc() -> None\n```",
              wl: str = "| `bin/vx.py` | E | banc |") -> str:
    p = PACK.format(tid=tid)
    p = p.replace("- [ ] banc", dod, 1).replace("```\ndef banc() -> None\n```", contrats, 1)
    return p.replace("| `bin/vx.py` | E | banc |", wl, 1)


def ecrire(tid: str, **kw):
    (dossier(tid) / "context.md").write_text(pack_avec(tid, **kw), encoding="utf-8")


class RegleDep(unittest.TestCase):
    def _dependant(self, wl_dep: str, wl_propre: str, role_dep: str = "implementeur") -> str:
        dep = creer(role_dep)
        ecrire(dep, wl=wl_dep)
        tid = creer("implementeur", "--dep", dep)
        ecrire(tid, wl=wl_propre)
        return lint(tid, "--force", "--v").stdout

    def test_dep_inutile_avertit(self):
        sortie = self._dependant("| `bin/a.py` | E | x |", "| `docs/b.md` | E | x |")
        self.assertRegex(sortie, r"\n~ dep T\d+ : 0 fichier commun — inutile \?")
        self.assertIn(" OK ", sortie)

    def test_dep_globs_touchent(self):
        self.assertNotIn("inutile", self._dependant("| `bin/*.py` | E | x |", "| `bin/b.py` | L | x |"))
        self.assertNotIn("inutile", self._dependant("| `apps/web/src/` | E | x |", "| `apps/web/src/x/y.ts` | E | x |"))

    def test_dep_role_hors_code_ignore(self):
        sortie = self._dependant("| `bin/a.py` | E | x |", "| `docs/b.md` | E | x |", "architecte")
        self.assertNotIn("inutile", sortie)


class RegleDod(unittest.TestCase):
    def _lint(self, dod: str) -> str:
        tid = creer()
        ecrire(tid, dod=dod)
        return lint(tid, "--force").stdout

    def test_dod_seuil_sans_head_ko(self):
        self.assertRegex(self._lint("- [ ] ok\n- [ ] latence ≤ 55 ms"), r"KO: DoD 2 sans mesure HEAD")

    def test_dod_head_ok(self):
        self.assertIn(" OK ", self._lint("- [ ] latence ≤ 55 ms — HEAD : 80 ms"))
        self.assertIn(" OK ", self._lint("- [ ] regex (→ 8 sur HEAD)"))

    def test_dod_nouveau_ok(self):
        self.assertIn(" OK ", self._lint("- [ ] ≥ 3 tests — HEAD : ∅ (nouveau)"))

    def test_dod_code_inline_ignore(self):
        self.assertIn(" OK ", self._lint("- [ ] `a <= 3` accepté"))

    def test_dod_exempte_result(self):
        self.assertIn(" OK ", self._lint("- [ ] `result.md` ≤ 50 lignes"))


class RegleContrats(unittest.TestCase):
    def _lint(self, contrats: str, role: str = "implementeur") -> str:
        tid = creer(role)
        ecrire(tid, contrats=contrats)
        return lint(tid, "--force").stdout

    def test_contrats_vide_ko(self):
        self.assertIn("KO: Contrats vide", self._lint("∅"))

    def test_contrats_gabarit_ko(self):
        self.assertIn("KO: Contrats vide", self._lint("recopier\n```\n…\n```"))

    def test_contrats_libres_eclaireur(self):
        self.assertIn(" OK ", self._lint("∅", "eclaireur"))

    def test_contrats_coord_ok(self):
        self.assertIn(" OK ", self._lint("bin/vx.py:L40-70 — voir"))


PACK_RETOUCHE = re.sub(r"## (Décisions actées|Environnement|Budget)\n∅\n", "", PACK)


class Retouche(unittest.TestCase):
    def _retouche(self, *extra: str, pack: str = PACK_RETOUCHE) -> str:
        tid = creer("implementeur", "--retouche", *extra)
        (dossier(tid) / "context.md").write_text(pack.format(tid=tid), encoding="utf-8")
        return tid

    def _rendre(self, tid: str, verifie: str):
        vx("set", tid, "--statut", "revue", "--projet", "banc", "--force")
        (dossier(tid) / "result.md").write_text(
            f"---\ntache: {tid}\nstatut: revue\n---\n## Livré\n- x\n## Vérifié comment\n{verifie}\n"
            "## Écarts\n- ∅\n", encoding="utf-8")

    def test_retouche_sans_enfant(self):
        tid = self._retouche()
        self.assertIn("retouche: true", lire(tid))
        avant = len(ids())
        r = lint(tid)
        self.assertIn(" OK ", r.stdout)
        self.assertEqual(len(ids()), avant)
        journal = (BANC / "vault" / "projets" / "banc" / "journal.md").read_text(encoding="utf-8")
        self.assertIn(f"{tid} retouche : 0 enfant", journal)
        self.assertRegex(vx("board", "--projet", "banc").stdout, rf"{tid} .*\[retouche\] banc")

    def test_retouche_critique_seul(self):
        tid = self._retouche("--critique")
        avant = len(ids())
        r = lint(tid)
        self.assertEqual(len(ids()), avant + 1)
        self.assertRegex(r.stdout, r"\+ T\d+ critique$")

    def test_critique_exige_retouche(self):
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--critique")
        self.assertEqual(r.returncode, 1)
        self.assertIn("--critique exige --retouche", r.stderr)

    def test_lint_sans_head_retouche_ok_sinon_ko(self):
        dod = "- [ ] latence ≤ 55 ms"
        tid = self._retouche(pack=PACK_RETOUCHE.replace("- [ ] banc", dod))
        self.assertIn(" OK ", lint(tid).stdout)
        hors = creer()
        ecrire(hors, dod=dod)
        self.assertRegex(lint(hors, "--force").stdout, r"KO: DoD 1 sans mesure HEAD")
        hors = creer()
        (dossier(hors) / "context.md").write_text(PACK_RETOUCHE.format(tid=hors), encoding="utf-8")
        self.assertIn("KO: section manquante", lint(hors).stdout)

    def test_lint_head_ignore_juge(self):
        tid = creer("evaluateur")
        ecrire(tid, dod="- [ ] latence ≤ 55 ms")
        self.assertIn(" OK ", lint(tid, "--force").stdout)

    def test_retenir_retouche_sans_eval(self):
        tid = self._retouche()
        lint(tid)
        self._rendre(tid, "python3 -m unittest → OK")
        r = vx("retenir", tid, "--projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("evaluation: retouche", lire(tid))
        self.assertIn("statut: fait", lire(tid))

    def test_retenir_retouche_nv_refuse(self):
        tid = self._retouche()
        lint(tid)
        self._rendre(tid, "NV — pas de banc")
        r = vx("retenir", tid, "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertIn("NV présent", r.stderr)
        self.assertIn("statut: revue", lire(tid))

    def test_retenir_retouche_result_absent(self):
        tid = self._retouche()
        vx("set", tid, "--statut", "revue", "--projet", "banc", "--force")
        r = vx("retenir", tid, "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertIn("result absent", r.stderr)

    def test_virer_herite_retouche(self):
        tid = self._retouche()
        vx("set", tid, "--statut", "en-cours", "--projet", "banc", "--force")
        r = vx("virer", tid, "--motif", "banc", "--projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        n = r.stdout.splitlines()[1].split()[0]
        self.assertIn("retouche: true", lire(n))
        self.assertIn("sans_verif: retouche", lire(n))


class Repondre(unittest.TestCase):
    def _bloquee(self, statut: str = "bloque") -> str:
        tid = creer()
        vx("set", tid, "--statut", "en-cours", "--projet", "banc", "--force")
        (dossier(tid) / "result.md").write_text(
            f"---\ntache: {tid}\nprojet: banc\nstatut: {statut}\n---\n## Livré\n- ∅\n", encoding="utf-8")
        return tid

    def test_ok(self):
        tid = self._bloquee()
        r = vx("repondre", tid, "--projet", "banc", "--texte", "oui, option A")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn(f"{tid} : en-cours -> bloque (réponse 1)", r.stdout)
        self.assertRegex(lire(tid, "result.md"), r"\n## Réponse du chef — \d{4}-\d\d-\d\d \d\d:\d\d\noui, option A\n$")
        self.assertIn("statut: bloque", lire(tid))
        self.assertIn("reponses: 1", lire(tid))

    def test_deuxieme_reponse(self):
        tid = self._bloquee()
        vx("repondre", tid, "--projet", "banc", "--texte", "un")
        r = vx("repondre", tid, "--projet", "banc", "--texte", "deux")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("reponses: 2", lire(tid))
        self.assertEqual(lire(tid, "result.md").count("## Réponse du chef"), 2)

    def test_result_pas_bloque(self):
        tid = self._bloquee("revue")
        r = vx("repondre", tid, "--projet", "banc", "--texte", "x")
        self.assertNotEqual(r.returncode, 0)
        self.assertNotIn("Réponse du chef", lire(tid, "result.md"))

    def test_texte_6_lignes(self):
        tid = self._bloquee()
        r = vx("repondre", tid, "--projet", "banc", "--texte", "a\nb\nc\nd\ne\nf")
        self.assertNotEqual(r.returncode, 0)
        self.assertNotIn("reponses:", lire(tid))


if __name__ == "__main__":
    unittest.main()
