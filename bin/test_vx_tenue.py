"""Tests tenue CLI (lots A et B) : pack-lint 1 ligne, cache pack_sha, pret auto, enfants au pret.

Lancer : python3 -m unittest bin/test_vx_tenue.py
Banc jetable .cache/banc-T097/b<pid> : le vrai vault n'est jamais touche.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import unittest
import unittest.mock
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
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "frontmatter.py", "agents.py", "terminal.py", "voix.py", "demandes.py"):
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


def _fait(tid: str):
    """Producteur retenu : `set fait` est refuse (retenir), on pose le statut a la main."""
    f = dossier(tid) / "task.md"
    f.write_text(re.sub(r"(?m)^statut: .*$", "statut: fait", f.read_text(encoding="utf-8")), encoding="utf-8")


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
        tid = creer("implementeur", "--verif")
        avant = len(ids())
        r = lint(tid)
        self.assertEqual(len(ids()), avant + 1)
        self.assertRegex(r.stdout, r"\+ T\d+ verificateur")
        self.assertEqual(len(r.stdout.splitlines()), 1)

    def test_lint_vert_sans_flag_0_enfant(self):
        tid = creer()
        avant = len(ids())
        r = lint(tid)
        self.assertIn("a-faire -> pret", r.stdout)
        self.assertEqual(len(ids()), avant)

    def test_critique_opt_in(self):
        tid = creer("implementeur", "--critique")
        avant = len(ids())
        r = lint(tid)
        self.assertEqual(len(ids()), avant + 1)
        self.assertRegex(r.stdout, r"\+ T\d+ critique$")

    def test_sans_verif_sans_objet(self):
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--sans-verif", "trivial")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("~ --sans-verif sans objet : plus d'enfant par défaut", r.stderr)
        tid = r.stdout.split()[0]
        remplir(tid)
        avant = len(ids())
        lint(tid)
        self.assertEqual(len(ids()), avant)

    def test_board_lot_front_sans_critique(self):
        front = PACK.format(tid="x").replace("`bin/vx.py`", "`apps/web/src/x.ts`")
        tid = creer()
        (dossier(tid) / "context.md").write_text(front, encoding="utf-8")
        _fait(tid)
        self.assertRegex(vx("board", "--projet", "banc").stdout.splitlines()[0],
                         rf"^! lot front retenu sans critique : .*{tid}")
        self.assertIn(tid, json.loads(vx("board", "--projet", "banc", "--json").stdout)["sans_critique"])

    def test_board_retouche_jamais_sans_critique(self):
        tid = creer("implementeur", "--retouche")
        (dossier(tid) / "context.md").write_text(
            PACK.format(tid="x").replace("`bin/vx.py`", "`apps/web/src/r.ts`"), encoding="utf-8")
        _fait(tid)
        self.assertNotIn(tid, json.loads(vx("board", "--projet", "banc", "--json").stdout)["sans_critique"])

    def test_tache_pack_fichier_substitue_titre(self):
        pack = BANC / "pack.md"
        pack.write_text("# Pack {{ID}} — {{TITRE}}\n" + PACK, encoding="utf-8")
        r = vx("tache", "titre X", "--projet", "banc", "--role", "implementeur", "--pack", str(pack))
        assert r.returncode == 0, r.stderr
        texte = lire(r.stdout.split()[0], "context.md")
        self.assertIn("titre X", texte)
        self.assertNotIn("TITRE}}", texte)

    def test_board_juge_unique_compte_comme_critique(self):
        front = PACK.format(tid="x").replace("`bin/vx.py`", "`apps/web/src/z.ts`")
        tid = creer()
        (dossier(tid) / "context.md").write_text(front, encoding="utf-8")
        _fait(tid)
        r = vx("tache", "juge", "--projet", "banc", "--role", "evaluateur", "--dep", tid)
        assert r.returncode == 0, r.stderr
        juge = r.stdout.split()[0]
        _fait(juge)
        (dossier(juge) / "result.md").write_text(
            f"---\nstatut: fait\n---\n## Livré\n- VERDICT {tid}: retenir\n", encoding="utf-8")
        self.assertNotIn(tid, json.loads(vx("board", "--projet", "banc", "--json").stdout)["sans_critique"])

    def test_board_contrat_sans_lot(self):
        arch = creer("architecte")
        _fait(arch)
        self.assertRegex(vx("board", "--projet", "banc").stdout, rf"(?m)^! contrat sans lot : .*{arch}")
        r = vx("tache", "lot", "--projet", "banc", "--role", "implementeur", "--dep", arch)
        assert r.returncode == 0, r.stderr
        self.assertNotRegex(vx("board", "--projet", "banc").stdout, rf"(?m)^! contrat sans lot : .*{arch}")

    def test_board_front_avec_critique_ou_renonce_rien(self):
        front = PACK.format(tid="x").replace("`bin/vx.py`", "`apps/web/src/y.ts`")
        a, b = creer("implementeur", "--critique"), creer()
        for t in (a, b):
            (dossier(t) / "context.md").write_text(front, encoding="utf-8")
        lint(a, "--force")
        vx("renoncer", b, "--projet", "banc", "--critique", "--raison", "banc")
        for t in (a, b):
            _fait(t)
        sortie = json.loads(vx("board", "--projet", "banc", "--json").stdout)["sans_critique"]
        self.assertNotIn(a, sortie)
        self.assertNotIn(b, sortie)

    def test_set_pret_refuse(self):
        tid = creer()
        r = vx("set", tid, "--statut", "pret", "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertIn("pret = pack-lint vert", r.stderr)
        self.assertIn("statut: a-faire", lire(tid))

    def test_set_dep(self):
        a, b = creer(), creer()
        self.assertEqual(vx("set", b, "--dep", a, "--projet", "banc").returncode, 0)
        vx("set", b, "--dep", a, "--projet", "banc")
        self.assertEqual(lire(b).count(a), 1)
        r = vx("set", b, "--dep", "T999", "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertIn("dep inconnue: T999", r.stderr)

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

    def test_pack_marqueurs_substitues(self):
        f = BANC / "pack-m.md"
        f.write_text(PACK.format(tid="{{ID}}").replace("# Pack", "---\npack: {{ID}}\nprojet: {{PROJET}}\ncree: {{DATE}}\n---\n# Pack", 1)
                     + "\n.sorties/{{ID}}/{{PROJET}}\n", encoding="utf-8")
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--pack", str(f))
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        pack = lire(tid, "context.md")
        self.assertNotIn("{{", pack)
        self.assertRegex(pack, rf"^---\npack: {tid}\nprojet: banc\ncree: \d{{4}}-\d\d-\d\d\n")
        self.assertIn(f".sorties/{tid}/banc", pack)

    def test_tache_pack_fichier_substitue(self):
        f = BANC / "pack-s.md"
        f.write_text("---\npack: {{ID}}\nprojet: {{PROJET}}\n---\n" + PACK.format(tid="{{ID}}")
                     + "\n{{ID}} dans {{PROJET}} le {{DATE}}\n", encoding="utf-8")
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--pack", str(f))
        self.assertEqual(r.returncode, 0, r.stderr)
        tid = r.stdout.split()[0]
        pack = lire(tid, "context.md")
        self.assertNotIn("{{", pack)
        self.assertIn(f"pack: {tid}\nprojet: banc\n", pack)
        self.assertGreaterEqual(pack.count(tid), 2)

    def test_pack_force_pack_frontmatter(self):
        f = BANC / "pack-f.md"
        f.write_text("---\npack: T999\n---\n" + PACK.format(tid="X"), encoding="utf-8")
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", "--pack", str(f))
        tid = r.stdout.split()[0]
        self.assertTrue(lire(tid, "context.md").startswith(f"---\npack: {tid}\n"))

    def test_lint_marqueur_inconnu(self):
        tid = creer()
        (dossier(tid) / "context.md").write_text(PACK.format(tid=tid) + "\n{{INCONNU}}\n", encoding="utf-8")
        r = lint(tid)
        self.assertEqual(r.returncode, 1)
        self.assertIn("marqueur non substitue : {{INCONNU}}", r.stdout + r.stderr)

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

    def _juge_en_cours(self, statut_result: str, verdict: str = "retenir"):
        tid = creer()
        vx("set", tid, "--statut", "revue", "--projet", "banc", "--force")
        ev = creer("evaluateur", "--dep", tid)
        vx("set", ev, "--statut", "en-cours", "--projet", "banc", "--force")
        (dossier(ev) / "result.md").write_text(
            f"---\ntache: {ev}\nstatut: {statut_result}\nverdict: {verdict}\n---\n## Motif\nok\n", encoding="utf-8")
        return tid, ev, vx("retenir", tid, "--projet", "banc")

    def _juge_multi_dep(self):
        t1, t2 = creer(), creer()
        for t in (t1, t2):
            vx("set", t, "--statut", "revue", "--projet", "banc", "--force")
        ev = creer("evaluateur", "--dep", t1, "--dep", t2)
        vx("set", ev, "--statut", "en-cours", "--projet", "banc", "--force")
        (dossier(ev) / "result.md").write_text(
            f"---\ntache: {ev}\nstatut: fait\nverdict: virer\n---\n## Livré\n"
            f"- VERDICT {t1}: retenir — ok\n- VERDICT {t2}: virer — m\n## Motif\nm\n", encoding="utf-8")
        return t1, t2, ev

    def test_retenir_juge_multi_dep_verdict_par_dep(self):
        t1, t2, _ = self._juge_multi_dep()
        self.assertEqual(vx("retenir", t1, "--projet", "banc").returncode, 0)
        r = vx("retenir", t2, "--projet", "banc")
        self.assertEqual(r.returncode, 1)
        self.assertIn(f"virer {t2} --motif m", r.stderr)

    def test_integrer_juge_multi_dep_une_ligne_par_dep(self):
        t1, t2, ev = self._juge_multi_dep()
        vx("set", ev, "--statut", "revue", "--projet", "banc", "--force")
        r = vx("integrer", "--projet", "banc")
        self.assertIn(f"   -> python3 bin/vx.py retenir {t1} --projet banc", r.stdout)
        self.assertIn(f"   -> python3 bin/vx.py virer {t2} --motif m --projet banc", r.stdout)
        self.assertEqual(r.stdout.count("   -> "), 2)

    def test_retenir_juge_en_cours_result_fait(self):
        tid, ev, r = self._juge_en_cours("fait")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("statut: fait", lire(tid))
        self.assertIn("statut: fait", lire(ev))
        journal = (BANC / "vault" / "projets" / "banc" / "journal.md").read_text(encoding="utf-8")
        self.assertIn(f"{ev} statut en-cours -> fait (result.md, retenir {tid})", journal)

    def test_retenir_juge_en_cours_result_revue(self):
        tid, ev, r = self._juge_en_cours("revue")
        self.assertEqual(r.returncode, 1)
        self.assertIn("pas encore faite", r.stderr)
        self.assertIn("statut: revue", lire(tid))

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


class Demande(unittest.TestCase):
    def setUp(self):
        self.run = BANC / "run"
        shutil.rmtree(self.run, ignore_errors=True)
        self.run.mkdir()
        (self.run / "demandes.jsonl").write_text(
            json.dumps({"id": "D001", "t": "2026-10-20T09:09:21", "texte": "fais ça", "statut": "ouverte",
                        "session": "s1"}) + "\n", encoding="utf-8")
        self.env = unittest.mock.patch.dict(os.environ, {"AGENTX_RUN_DIR": str(self.run)})
        self.env.start()
        self.addCleanup(self.env.stop)

    def test_tache_demande_frontmatter(self):
        self.assertEqual(vx("tache", "x", "--projet", "banc", "--role", "implementeur", "--demande", "d1").returncode, 2)
        r = vx("tache", "x", "--projet", "banc", "--role", "implementeur", "--demande", "D009")
        self.assertEqual((r.returncode, "demande inconnue D009" in r.stderr), (2, True))
        tid = vx("tache", "x", "--projet", "banc", "--role", "implementeur", "--demande", "D001").stdout.split()[0]
        self.assertRegex((dossier(tid) / "task.md").read_text(encoding="utf-8"), r"(?m)^demande: D001$")

    def test_demande_liste_fermer(self):
        tid = vx("tache", "x", "--projet", "banc", "--role", "implementeur", "--demande", "D001").stdout.split()[0]
        self.assertRegex(vx("demande", "liste").stdout, rf"D001  ouverte  2026-10-20T09:09  {tid}  « fais ça »")
        self.assertEqual(json.loads(vx("demande", "liste", "--json").stdout)[0]["taches"], [tid])
        self.assertIn("! demandes ouvertes : D001", vx("board").stdout)
        self.assertEqual(vx("demande", "fermer", "D001").returncode, 0)
        self.assertIn("fermee", vx("demande", "liste").stdout)
        self.assertNotIn("demandes ouvertes", vx("board").stdout)
        self.assertEqual(vx("demande", "fermer", "D009").returncode, 2)


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


FAUX_CLAUDE = """#!/usr/bin/env python3
import json, os, sys
open(os.environ["BANC_JOURNAL"], "a").write(json.dumps(sys.argv[1:]) + "\\n")
if sys.argv[1:2] == ["agents"]:
    print(os.environ["BANC_SESSIONS"])
elif sys.argv[1:2] == ["stop"]:
    open(os.environ["BANC_JOURNAL"], "a").write(json.dumps(["env", os.environ.get("CLAUDE_CONFIG_DIR"), os.environ.get("AGENTX_COMPTE")]) + "\\n")
    print("boum", file=sys.stderr)
    sys.exit(int(os.environ["BANC_STOP_RC"]))
"""


class VirerSession(unittest.TestCase):
    def virer(self, stop_rc: int, compte: str | None = None):
        tid = creer()
        vx("set", tid, "--statut", "en-cours", "--projet", "banc", "--force")
        faux, journal = BANC / "claude", BANC / "claude.argv.jsonl"
        faux.write_text(FAUX_CLAUDE, encoding="utf-8")
        faux.chmod(0o755)
        journal.unlink(missing_ok=True)
        reg = BANC / "run" / "agents"
        reg.mkdir(parents=True, exist_ok=True)
        (reg / f"banc-{tid}.json").write_text(json.dumps(
            {"id_session": "cfd7916e", "nom": "n", "pid": None, "role": "implementeur", "tid": tid, "projet": "banc",
             "lance": "2026-10-16T10:00:00", "mort_signale": False, **({"compte": compte} if compte else {})}),
            encoding="utf-8")
        env = dict(AGENTX_CLAUDE=str(faux), BANC_JOURNAL=str(journal), BANC_STOP_RC=str(stop_rc),
                   BANC_SESSIONS=json.dumps([{"id": "cfd7916e0000", "state": "working"}]))
        with unittest.mock.patch.dict(os.environ, env):
            r = vx("virer", tid, "--motif", "banc", "--projet", "banc")
        appels = [json.loads(l) for l in journal.read_text(encoding="utf-8").splitlines()]
        self.appels = appels
        return tid, r, [a for a in appels if a[0] == "stop"]

    def test_virer_stoppe_par_id(self):
        tid, r, stops = self.virer(0)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(stops, [["stop", "cfd7916e"]])
        self.assertIn(f"{tid} session cfd7916e arretee", r.stdout)
        self.assertIn("statut: rejete", lire(tid))

    def test_virer_stop_env_compte(self):
        comptes = BANC / "comptes"
        (comptes / "second").mkdir(parents=True, exist_ok=True)
        with unittest.mock.patch.dict(os.environ, {"AGENTX_COMPTES_DIR": str(comptes)}):
            tid, r, stops = self.virer(0, "second")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn(["env", str(comptes / "second"), "second"], self.appels)

    def test_virer_stop_ko_rien_vire(self):
        tid, r, stops = self.virer(1)
        self.assertEqual(r.returncode, 1)
        self.assertEqual(stops, [["stop", "cfd7916e"]])
        self.assertIn("claude stop cfd7916e echoue (boum)", r.stderr)
        self.assertIn("statut: en-cours", lire(tid))


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


BANC_GIT = DEPOT / ".cache" / "banc-T100" / f"b{os.getpid()}"


class CommitVague(unittest.TestCase):
    """Depot git jetable par test ; commit-vague n'execute jamais git add/commit."""
    n = 0

    def setUp(self):
        CommitVague.n += 1
        self.p = f"v{CommitVague.n}"
        (BANC / "vault" / "projets" / self.p / "taches").mkdir(parents=True)
        self.depot = BANC_GIT / self.p
        self.depot.mkdir(parents=True)
        self.addCleanup(shutil.rmtree, BANC_GIT, True)
        for fichier in ("a.py", "b.py", "hors.py"):
            (self.depot / fichier).write_text("0\n", encoding="utf-8")
        self.git("init", "-q")
        self.git("add", "--", ".")
        self.git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "base")

    def git(self, *a: str) -> str:
        return subprocess.run(["git", "-C", str(self.depot), *a], capture_output=True, text=True, check=True).stdout

    def retenue(self, titre: str, *wl: str) -> str:
        tid = vx("tache", titre, "--projet", self.p, "--role", "implementeur").stdout.split()[0]
        d = next((BANC / "vault" / "projets" / self.p / "taches").glob(f"{tid}-*"))
        lignes = "\n".join(f"| `{c}` | E | banc |" for c in wl)
        (d / "context.md").write_text(pack_avec(tid, wl=lignes), encoding="utf-8")
        vx("set", tid, "--statut", "revue", "--projet", self.p, "--force")
        (d / "result.md").write_text(f"---\ntache: {tid}\nstatut: revue\n---\n## Livré\n- x\n", encoding="utf-8")
        r = vx("retenir", tid, "--projet", self.p, "--sans-eval")
        self.assertEqual(r.returncode, 0, r.stderr)
        return tid

    def propose(self, *extra: str) -> subprocess.CompletedProcess:
        return vx("commit-vague", "--projet", self.p, "--depot", str(self.depot), *extra)

    def test_commit_vague_suivis_et_neufs(self):
        self.retenue("un", "a.py")
        self.retenue("deux", "b.py", "c.py")
        (self.depot / "a.py").write_text("1\n", encoding="utf-8")
        (self.depot / "b.py").write_text("1\n", encoding="utf-8")
        (self.depot / "c.py").write_text("1\n", encoding="utf-8")
        r = self.propose()
        self.assertEqual(r.returncode, 0, r.stderr)
        lignes = r.stdout.splitlines()
        self.assertRegex(lignes[0], rf"^# commit-vague {self.p} — base [0-9a-f]{{7}} .+ — 2 tâches, 3 fichiers$")
        self.assertIn("git add -- a.py b.py", lignes)
        self.assertLess(lignes.index("# non suivis (??) — vérifier avant d'ajouter :"), lignes.index("git add -- c.py"))
        self.assertTrue(any(l.startswith(f"git commit -m '{self.p} : T") for l in lignes))

    def test_commit_vague_hors_wl_liste(self):
        self.retenue("un", "a.py")
        (self.depot / "a.py").write_text("1\n", encoding="utf-8")
        (self.depot / "hors.py").write_text("1\n", encoding="utf-8")
        lignes = self.propose().stdout.splitlines()
        self.assertIn("# hors WL modifiés (non inclus) : 1", lignes)
        self.assertIn("#   hors.py", lignes)
        self.assertNotIn("hors.py", [l for l in lignes if l.startswith("git add")][0])

    def test_commit_vague_wl_non_modifie_exclu(self):
        self.retenue("un", "a.py", "b.py")
        (self.depot / "a.py").write_text("1\n", encoding="utf-8")
        self.assertIn("git add -- a.py", self.propose().stdout.splitlines())

    def test_commit_vague_rien(self):
        r = self.propose()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("rien à committer", r.stdout)
        self.retenue("un", "a.py")
        r = self.propose()
        self.assertIn("rien à committer (0 fichier modifié)", r.stdout)

    def test_commit_vague_depuis(self):
        self.retenue("un", "a.py")
        (self.depot / "a.py").write_text("1\n", encoding="utf-8")
        sha = self.git("rev-parse", "HEAD").strip()
        self.assertIn(f"base {sha[:7]}", self.propose("--depuis", sha).stdout)

    def test_commit_vague_depuis_inconnu(self):
        r = self.propose("--depuis", "deadbeef")
        self.assertEqual(r.returncode, 1)
        self.assertIn("git show", r.stderr)

    def test_commit_vague_n_execute_pas(self):
        self.retenue("un", "a.py")
        (self.depot / "a.py").write_text("1\n", encoding="utf-8")
        avant = self.git("log", "--format=%H")
        self.assertEqual(self.propose().returncode, 0)
        self.assertEqual(self.git("log", "--format=%H"), avant)
        self.assertEqual(self.git("diff", "--cached"), "")

    def test_message_commit_tronque(self):
        sys.path.insert(0, str(BANC / "bin"))
        import vx as _vx
        msg = _vx.message_commit("agentx", [(f"T{i}", "titre très long " * 5) for i in range(3)])
        self.assertLessEqual(len(msg), 120)
        self.assertTrue(msg.startswith("agentx : T0, T1, T2"))
        self.assertTrue(msg.endswith("…"))

    def test_se_touchent_prefixe_strict(self):
        sys.path.insert(0, str(BANC / "bin"))
        import vx as _vx
        self.assertFalse(_vx.se_touchent("bin/vx.py", "bin/vx.py.bak"))
        self.assertTrue(_vx.se_touchent("bin/", "bin/vx.py"))
        self.assertTrue(_vx.se_touchent("a", "a"))


if __name__ == "__main__":
    unittest.main()
