"""Tests de contrats.py : banc AGENTX_ROOT jetable (tmp), jamais le vrai vault ni run/.

Lancer : python3 -m unittest bin/test_contrats.py
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = Path(tempfile.mkdtemp(prefix="agentx-contrats-"))
REEL = DEPOT / "vault" / "projets" / "salle-v2" / "notes" / "contrat-front.md"   # lecture seule

os.environ["AGENTX_ROOT"] = str(BANC)
sys.path.insert(0, str(ICI))
import contrats   # noqa: E402  (ROOT lu de l'env au-dessus)

NOTES = BANC / "vault" / "projets" / "p" / "notes"
CX = NOTES / "contrat-x.md"
JOUR_AVANT, JOUR_APRES = date(2026, 10, 16), date(2027, 1, 14)
V1 = "---\ntags: [note]\nversion: 1\namende: 2026-10-16\n---\n# contrat-x\n- L1 valeur\n"
V2 = ("---\ntags: [note]\nversion: 2\namende: 2026-10-17\n---\n# contrat-x\n- L1 valeur\n"
      "\n## v2 — 2026-10-17 — raison\n- remplace L1 « valeur » : autre\n")


def setUpModule():
    NOTES.mkdir(parents=True)
    shutil.copy(REEL, NOTES / "contrat-front.md")


def tearDownModule():
    shutil.rmtree(BANC)


def contrat(texte: str) -> Path:
    CX.write_text(texte, encoding="utf-8")
    return CX


def tache(tid: str, statut: str, pack: str = "") -> None:
    d = BANC / "vault" / "projets" / "p" / "taches" / f"{tid}-x"
    d.mkdir(parents=True, exist_ok=True)
    (d / "task.md").write_text(f"---\nid: {tid}\nstatut: {statut}\n---\n", encoding="utf-8")
    (d / "context.md").write_text(pack, encoding="utf-8")


class Version(unittest.TestCase):
    def test_absente_vaut_1(self):
        self.assertEqual(contrats.version(NOTES / "contrat-front.md"), 1)

    def test_entier(self):
        self.assertEqual(contrats.version(contrat(V2)), 2)

    def test_non_entier_leve(self):
        with self.assertRaises(ValueError):
            contrats.version(contrat("---\nversion: abc\n---\n"))

    def test_coherence_ok_et_ko(self):
        self.assertEqual(contrats.coherence(contrat(V2)), [])
        self.assertEqual(contrats.coherence(contrat(V2.replace("version: 2", "version: 3"))), [
            "version 3 != 1 + 1 bloc(s) d'amendement"])
        self.assertTrue(any("amende" in e for e in contrats.coherence(contrat(V2.replace("amende: 2026-10-17", "amende: 2026-10-16")))))
        self.assertTrue(any("consecutifs" in e for e in contrats.coherence(contrat(V2.replace("## v2", "## v3")))))

    def test_bloc_en_code_ignore(self):
        self.assertEqual(contrats.coherence(contrat(V1 + "```\n## v2 — 2026-10-17 — x\n```\n")), [])


class Citations(unittest.TestCase):
    def setUp(self):
        contrat(V2)

    def test_trois_formes(self):
        c = contrats.cites("[[contrat-x]] [[contrat-x|alias]]@v2 contrat-x.md@v3:1-2 contrat-y.md", "p")
        self.assertEqual(c, {"contrat-x": {None, 2, 3}, "contrat-y": {None}})

    def test_slug_de_tache_non_capte(self):
        self.assertEqual(contrats.cites("T002-contrat-x-banc/context.md", "p"), {})

    def test_introuvable_averti(self):
        self.assertEqual(contrats.verifier_citations("contrat-zz.md@v1", "p", JOUR_APRES),
                         ([], ["contrat-zz introuvable (notes/ du projet ni ailleurs)"]))

    def test_version_illisible(self):
        contrat("---\nversion: abc\n---\n")
        e, a = contrats.verifier_citations("[[contrat-x]]@v1", "p", JOUR_AVANT)
        self.assertEqual((len(e), a), (1, []))
        self.assertIn("illisible", e[0])

    def test_deux_versions(self):
        e, _ = contrats.verifier_citations("[[contrat-x]]@v1 [[contrat-x]]@v2", "p", JOUR_AVANT)
        self.assertIn("cité en v1 et v2", e[0])

    def test_version_perimee(self):
        e, _ = contrats.verifier_citations("[[contrat-x]]@v1", "p", JOUR_AVANT)
        self.assertEqual(e, ["KO: contrat-x v1 cité, v2 courante — pack à revoir"])

    def test_sans_version_avant_apres(self):
        e, a = contrats.verifier_citations("[[contrat-x]]", "p", JOUR_AVANT)
        self.assertEqual((e, len(a)), ([], 1))
        e, a = contrats.verifier_citations("[[contrat-x]]", "p", JOUR_APRES)
        self.assertEqual((len(e), a), (1, []))
        self.assertIn("ajoute @v2", e[0])

    def test_mention_nue_herite(self):
        self.assertEqual(contrats.verifier_citations("[[contrat-x]]@v2 et contrat-x.md", "p", JOUR_APRES), ([], []))

    def test_resoudre_unique_ailleurs(self):
        self.assertEqual(contrats.resoudre("contrat-x", "autre"), CX)
        self.assertIsNone(contrats.resoudre("contrat-inconnu", "p"))

    def test_contrat_reel_copie(self):
        e, a = contrats.verifier_citations("contrat-front.md", "p", JOUR_AVANT)
        self.assertEqual((e, len(a)), ([], 1))


class AjoutSeul(unittest.TestCase):
    def test_conforme(self):
        self.assertIsNone(contrats.ajout_seul(V1, V2))

    def test_edition_au_dessus(self):
        self.assertIn("au-dessus", contrats.ajout_seul(V1, V2.replace("L1 valeur", "L1 autre")))

    def test_version_non_plus_un(self):
        self.assertIn("version 3", contrats.ajout_seul(V1, V2.replace("version: 2", "version: 3")))

    def test_bloc_manquant(self):
        self.assertIn("bloc", contrats.ajout_seul(V1, V1.replace("version: 1", "version: 2")))

    def test_frontmatter_tiers(self):
        self.assertIn("tags", contrats.ajout_seul(V1, V2.replace("[note]", "[autre]")))

    def test_ligne_hors_bloc(self):   # D1
        apres = V2.replace("\n## v2", "- seuil = 5\n\n## v2")
        self.assertIn("hors bloc", contrats.ajout_seul(V1, apres))

    def test_derniere_ligne_prolongee(self):   # D2
        av, ap = "---\nversion: 1\n---\n- seuil = 3", "---\nversion: 2\namende: 2026-10-17\n---\n"
        self.assertIsNotNone(contrats.ajout_seul(av, ap + "- seuil = 30\n## v2 — 2026-10-17 — r\n"))
        self.assertIsNone(contrats.ajout_seul(av, ap + "- seuil = 3\n## v2 — 2026-10-17 — r\n"))

    def test_version_avant_illisible(self):   # D4
        self.assertIn("illisible", contrats.ajout_seul(V1.replace("version: 1", "version: x"), V2))

    def test_version_invalide(self):   # D5
        for v in ("0", "-1", "١"):
            with self.assertRaises(ValueError):
                contrats.version(contrat(f"---\nversion: {v}\n---\n"))
        contrat(V2)
        self.assertTrue(contrats.verifier_citations("[[contrat-x]]@v0", "p", JOUR_AVANT)[0])

    def test_dates_invalides(self):   # D6
        ko = V2.replace("2026-10-17", "2026-13-45")
        self.assertTrue(any("invalide" in e for e in contrats.coherence(contrat(ko))))

    def test_api_inchangee(self):
        import inspect
        sigs = {n: str(inspect.signature(getattr(contrats, n))) for n in (
            "version", "coherence", "resoudre", "cites", "verifier_citations", "ajout_seul",
            "escalade", "ecrire_vague", "gele_par")}
        self.assertEqual(sigs["ecrire_vague"], "(projet: str, tids: list[str], maintenant: str) -> pathlib.Path | None")
        self.assertEqual(sigs["ajout_seul"], "(avant: str, apres: str) -> str | None")
        self.assertEqual(sigs["version"], "(chemin: pathlib.Path) -> int")


class Gel(unittest.TestCase):
    def setUp(self):
        contrat(V2)
        shutil.rmtree(BANC / "run", ignore_errors=True)
        pack = "## Contrats\n[[contrat-x]]@v2\n"
        tache("T001", "en-cours", pack)
        tache("T002", "revue", pack)

    def test_ecrire_vague(self):
        self.assertIsNone(contrats.ecrire_vague("p", [], "2026-10-16T14:23:05"))
        f = contrats.ecrire_vague("p", ["T001", "T002"], "2026-10-16T14:23:05")
        self.assertEqual(f.name, "p-20261016-142305.json")
        d = json.loads(f.read_text(encoding="utf-8"))
        self.assertEqual(d["taches"], ["T001", "T002"])
        self.assertEqual(d["contrats"], {"vault/projets/p/notes/contrat-x.md": 2})

    def test_meme_seconde_suffixe(self):   # D3
        f1 = contrats.ecrire_vague("p", ["T001"], "2026-10-16T14:23:05")
        f2 = contrats.ecrire_vague("p", ["T001"], "2026-10-16T14:23:05")
        f3 = contrats.ecrire_vague("p", ["T001"], "2026-10-16T14:23:05")
        self.assertEqual([f.name for f in (f1, f2, f3)],
                         ["p-20261016-142305.json", "p-20261016-142305-2.json", "p-20261016-142305-3.json"])
        self.assertEqual(json.loads(f2.read_text(encoding="utf-8"))["id"], "p-20261016-142305-2")

    def test_entrees_invalides(self):   # D7
        d = json.loads(contrats.ecrire_vague("p", ["T001", "T001"], "2026-10-16T14:23:05").read_text(encoding="utf-8"))
        self.assertEqual(d["taches"], ["T001"])
        self.assertIsNone(contrats.ecrire_vague("zz", ["T001"], "2026-10-16T14:23:06"))
        self.assertFalse((BANC / "run" / "vagues" / "zz-20261016-142306.json").exists())
        with self.assertRaises(ValueError):
            contrats.ecrire_vague("p", ["T001"], "hier")

    def test_en_cours_gele(self):
        contrats.ecrire_vague("p", ["T001", "T002"], "2026-10-16T14:23:05")
        self.assertEqual(contrats.gele_par(CX), [("p-20261016-142305", ["T001"])])
        self.assertEqual(contrats.gele_par(Path("vault/projets/p/notes/contrat-x.md")), [("p-20261016-142305", ["T001"])])

    def test_revue_ou_bloque_ne_gele_pas(self):
        contrats.ecrire_vague("p", ["T001", "T002"], "2026-10-16T14:23:05")
        tache("T001", "bloque")
        self.assertEqual(contrats.gele_par(CX), [])

    def test_autre_contrat_non_gele(self):
        contrats.ecrire_vague("p", ["T001"], "2026-10-16T14:23:05")
        self.assertEqual(contrats.gele_par(NOTES / "contrat-front.md"), [])


class Escalade(unittest.TestCase):
    def result(self, fm: str) -> Path:
        p = BANC / "result.md"
        p.write_text(f"---\n{fm}---\n## Livré\n", encoding="utf-8")
        return p

    def test_bloque_contrat(self):
        r = contrats.escalade(self.result('statut: bloque\nescalade: contrat\ncontrat: contrat-x@v2\nquestion: "Quelle ancre ?"\n'))
        self.assertEqual(r, {"escalade": "contrat", "contrat": "contrat-x@v2", "dod": "", "question": "Quelle ancre ?"})

    def test_bloque_sans_escalade(self):
        self.assertIsNone(contrats.escalade(self.result("statut: bloque\nescalade: ∅\n")))

    def test_fait_ou_mal_forme(self):
        self.assertIsNone(contrats.escalade(self.result("statut: fait\nescalade: contrat\n")))
        self.assertIsNone(contrats.escalade(BANC / "absent.md"))
        (BANC / "nu.md").write_text("pas de frontmatter", encoding="utf-8")
        self.assertIsNone(contrats.escalade(BANC / "nu.md"))


if __name__ == "__main__":
    unittest.main()
