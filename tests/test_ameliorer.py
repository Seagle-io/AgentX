"""Boucle continue L1 (bin/ameliorer.py, contrat T044 §1, §3, §4).

Vues fabriquées ; vault temporaire seulement pour `charger`. Le vrai vault n'est jamais écrit.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

DEPOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(os.environ.get("AGENTX_BIN", DEPOT / "bin"))))
sys.dont_write_bytecode = True

import ameliorer as a  # noqa: E402

S = a.seuils(Path(tempfile.gettempdir()) / "inexistant-agentx")
MAINT = 1_800_000_000.0


def vue(tid="T001", role="implementeur", statut="fait", projet="p", result="", mtime=100.0,
        archive=False, maj="2026-10-16", modele="sonnet", pack=50):
    return a.TacheVue(projet, tid, role, statut, modele, result, mtime if result is not None else None,
                      pack, maj, archive)


def tid(n):
    return f"T{n:03d}"


def faits(n, debut=1, **kw):
    return [vue(tid(debut + i), **kw) for i in range(n)]


def retour(manquait):
    return f"## Retour sur le pack\n- Manquait: {manquait} | Inutile: ∅\n"


class D1(unittest.TestCase):
    def test_vide(self):
        self.assertIsNone(a.d_capitaliser("p", [], S))

    def test_seuil(self):
        ouverte = vue("T099", statut="a-faire", result=None)
        self.assertIsNone(a.d_capitaliser("p", faits(9) + [ouverte], S))
        d = a.d_capitaliser("p", faits(10) + [ouverte], S)
        self.assertEqual(d.raison, "10 fait depuis T000")
        self.assertEqual(d.cle, "capitaliser:p:T010")
        self.assertIsNotNone(a.d_capitaliser("p", faits(11) + [ouverte], S))

    def test_reference_scribe(self):
        ouverte = vue("T099", statut="a-faire", result=None)
        scribe = vue("T005", role="scribe")
        self.assertIsNotNone(a.d_capitaliser("p", [scribe] + faits(10, 6) + [ouverte], S))
        self.assertIsNone(a.d_capitaliser("p", [scribe] + faits(4, 1) + faits(5, 6) + [ouverte], S))
        rejete = vue("T050", role="scribe", statut="rejete")
        self.assertIsNotNone(a.d_capitaliser("p", [rejete] + faits(10) + [ouverte], S))

    def test_scribe_ouvert_muet(self):
        enc = vue("T005", role="scribe", statut="en-cours", result=None)
        self.assertIsNone(a.d_capitaliser("p", [enc] + faits(30, 6), S))

    def test_vague_close(self):
        scribe = vue("T005", role="scribe")
        self.assertEqual(a.d_capitaliser("p", [scribe, vue("T006")], S).raison, "vague close")
        self.assertIsNone(a.d_capitaliser("p", [scribe], S))

    def test_archive_exclue(self):
        self.assertIsNone(a.d_capitaliser("p", faits(10, archive=True), S))

    def test_fait_sans_result(self):
        ouverte = vue("T099", statut="a-faire", result=None)
        self.assertIsNotNone(a.d_capitaliser("p", faits(10, result=None) + [ouverte], S))


class D2(unittest.TestCase):
    def appel(self, vues=(), personnel=None, bloques=(), ref=0.0, ouverte=False):
        return a.d_syndicat(list(vues), personnel or {"roles": []}, list(bloques), ref, MAINT, ouverte, S)

    def test_volume(self):
        self.assertIsNone(self.appel(faits(49, result="x", mtime=200), ref=100))
        d = self.appel(faits(50, result="x", mtime=200), ref=100)
        self.assertEqual((d.regle, d.cle), ("a", "syndicat:volume:100"))
        self.assertIsNotNone(self.appel(faits(51, result="x", mtime=200), ref=100))
        self.assertIsNotNone(self.appel(faits(50, result="x", mtime=1), ref=0))

    def test_volume_sans_result(self):
        self.assertIsNone(self.appel(faits(50, statut="fait", result=None)))
        self.assertIsNotNone(self.appel(faits(50, statut="rejete", result=None, maj="2026-10-16")))

    def test_renvoi(self):
        def pers(liv, vir, taux):
            return {"roles": [{"cle": "testeur", "livrees": liv, "virees": vir, "taux_renvoi": taux}]}
        self.assertIsNone(self.appel(personnel=pers(1, 1, 1.0)))
        self.assertIsNone(self.appel(personnel=pers(0, 0, None)))
        d = self.appel(personnel=pers(2, 1, 0.5))
        self.assertEqual((d.regle, d.cle, d.donnees["perimetre"]), ("b", "syndicat:renvoi:testeur:1", "role:testeur"))

    def test_bloque_fenetre(self):
        h = 3600
        self.assertIsNotNone(self.appel(bloques=[MAINT - 23 * h, MAINT - 2 * h, MAINT]))
        self.assertIsNone(self.appel(bloques=[MAINT - 24 * h - 60, MAINT - 2 * h, MAINT]))
        self.assertIsNone(self.appel(bloques=[MAINT - 24 * h, MAINT - 2 * h, MAINT]))

    def test_priorite_et_raisons(self):
        d = self.appel(faits(50, result="x", mtime=200), ref=100, bloques=[MAINT - 3, MAINT - 2, MAINT - 1])
        self.assertEqual(d.regle, "c")
        self.assertEqual(d.raison.count(";"), 1)
        self.assertEqual(d.projet, "agentx-entreprise")

    def test_ouverte(self):
        self.assertIsNone(self.appel(bloques=[MAINT - 3, MAINT - 2, MAINT - 1], ouverte=True))

    def test_transitions_bloque(self):
        self.assertEqual(len(a.transitions_bloque("- `2026-10-16 00:23` T009 statut pret -> bloque")), 1)
        self.assertEqual(a.transitions_bloque("T009 -> bloque\n- `2026-10-16` T009 -> bloque"), [])


class D3(unittest.TestCase):
    def vues(self, n, cat="contrat", **kw):
        return [vue(tid(i + 1), result=retour(f"{cat} manquant"), mtime=200, **kw) for i in range(n)]

    def test_seuil(self):
        self.assertEqual(a.d_gabarit(self.vues(2), 100, S), [])
        d = a.d_gabarit(self.vues(3), 100, S)
        self.assertEqual([x.cle for x in d], ["gabarit:contrat:100"])
        self.assertEqual(d[0].action, "proposition")
        self.assertEqual(len(a.d_gabarit(self.vues(4), 100, S)), 1)

    def test_lignes_dans_un_result(self):
        r = "## Retour sur le pack\n" + "- Manquait: contrat\n" * 3
        self.assertEqual(a.d_gabarit([vue(result=r, mtime=200)], 100, S), [])

    def test_exclusions(self):
        self.assertEqual(a.d_gabarit(self.vues(3), 300, S), [])
        self.assertEqual(a.d_gabarit(self.vues(5, cat="zzz"), 100, S), [])
        self.assertEqual(a.d_gabarit(self.vues(3, archive=True), 100, S), [])
        self.assertEqual(a.d_gabarit([vue(statut="rejete", result=None)] * 3, 100, S), [])
        self.assertEqual(a.d_gabarit([vue(result=retour("∅"), mtime=200)] * 3, 100, S), [])


class D4(unittest.TestCase):
    def inc(self, n, projet="p", texte="- EADDRINUSE sur 3000", mtime=200, debut=1):
        return [vue(tid(debut + i), projet=projet, result=f"## Écarts\n{texte}\n", mtime=mtime) for i in range(n)]

    def cibles(self, *projets, mtime=100.0):
        return {p: (f"vault/projets/{p}/env.md", mtime) for p in projets}

    def test_seuil(self):
        self.assertEqual(a.d_env(self.inc(1), self.cibles("p"), S), [])
        d = a.d_env(self.inc(2), self.cibles("p"), S)
        self.assertEqual([x.cle for x in d], ["env:p:port_occupe:100"])
        self.assertEqual(len(a.d_env(self.inc(3), self.cibles("p"), S)), 1)

    def test_deux_projets(self):
        c = self.cibles("p", "q")
        self.assertEqual(a.d_env(self.inc(1, "p") + self.inc(1, "q"), c, S), [])
        d = a.d_env(self.inc(2, "p") + self.inc(2, "q"), c, S)
        self.assertEqual(len(d), 3)
        self.assertEqual(d[-1].donnees["cible"], a.SKILL_CHEF)
        self.assertEqual(d[-1].cle, "env:*:port_occupe:0")

    def test_avant_cible_et_cible_absente(self):
        self.assertEqual(a.d_env(self.inc(2), self.cibles("p", mtime=300), S), [])
        self.assertEqual(len(a.d_env(self.inc(2, mtime=1), self.cibles("p", mtime=0), S)), 1)

    def test_compte_une_fois(self):
        v = vue(result="## Écarts\n- EADDRINUSE\n- address already in use\n- port 3000 occupe\n", mtime=200)
        self.assertEqual(a.d_env([v], self.cibles("p"), S), [])
        self.assertEqual(len(a.d_env([v, vue("T002", result=v.result, mtime=200)], self.cibles("p"), S)), 1)

    def test_cible(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            (root / "vault/projets/seagle-x").mkdir(parents=True)
            (root / "vault/projets/seagle-x/brief.md").write_text("---\nconventions: speciale\n---\n")
            (root / ".claude/skills/conventions-seagle").mkdir(parents=True)
            (root / ".claude/skills/conventions-seagle/SKILL.md").write_text("x")
            self.assertEqual(a._cible_env(root, "seagle-x")[0], ".claude/skills/speciale/SKILL.md")
            (root / "vault/projets/seagle-x/brief.md").write_text("---\ntitre: a\n---\n")
            self.assertEqual(a._cible_env(root, "seagle-x")[0], ".claude/skills/conventions-seagle/SKILL.md")
            self.assertEqual(a._cible_env(root, "autre")[0], "vault/projets/autre/env.md")


class Seuils(unittest.TestCase):
    def test_surcharge(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(a.seuils(Path(t)), a.SEUILS)
            (Path(t) / "ameliorations.json").write_text(json.dumps({"env_n": 5}))
            self.assertEqual(a.seuils(Path(t))["env_n"], 5)
            (Path(t) / "ameliorations.json").write_text(json.dumps({"zzz": 1}))
            with self.assertRaises(ValueError):
                a.seuils(Path(t))


class Niveau(unittest.TestCase):
    def test_table(self):
        for cible, attendu in (
            ("vault/connaissances/x/y.md", "auto"), (".claude/skills/conventions-seagle/SKILL.md", "auto"),
            ("vault/projets/p/env.md", "auto"), ("vault/_templates/pack-verificateur.md", "chef"),
            ("budget:implementeur", "chef"), ("vault/_templates/context.md", "humain"),
            (".claude/skills/chef-de-projet/SKILL.md", "humain"), (".claude/agents/x.md", "humain"),
            ("roles.json", "humain"), ("bin/vx.py", "humain"), ("CLAUDE.md", "humain"),
            ("inconnu/x.txt", "humain"), ("", "humain"),
        ):
            self.assertEqual(a.niveau(cible), attendu, cible)


class Indicateurs(unittest.TestCase):
    def test_hors_wl(self):
        def ind(ecarts):
            return a.indicateurs_tache(vue(result=f"## Écarts\n{ecarts}\n## Suite\n"), set())["hors_wl"]
        self.assertEqual(ind("- lecture hors WL: ∅"), 0)
        self.assertEqual(ind("- lecture hors WL: a.md — x\n- lecture hors WL: b.md — y"), 2)

    def test_autres(self):
        self.assertIsNone(a.indicateurs_tache(vue(statut="revue", result=None), set()))
        r = a.indicateurs_tache(vue(statut="rejete", result=None, pack=None), set())
        self.assertEqual((r["renvoi"], r["pack_lignes"], r["manquait"]), (1.0, None, 0.0))
        self.assertEqual(a.indicateurs_tache(vue(result=retour("contrat")), set())["manquait"], 1.0)
        self.assertEqual(a.indicateurs_tache(vue(result=""), {("p", "T001")})["bloque"], 1.0)
        self.assertEqual(a.indicateurs_tache(vue(result="---\nstatut: bloque\n---\nx"), set())["bloque"], 1.0)
        self.assertEqual(a.indicateurs_tache(vue(result="---\nstatut: revue\n---\nx"), set())["bloque"], 0.0)


class Tendances(unittest.TestCase):
    def setUp(self):
        import datetime as d
        self.j1 = d.datetime(2026, 10, 15, 12).timestamp()
        self.j2 = d.datetime(2026, 10, 16, 12).timestamp()
        self.vues = [vue("T001", role="testeur", result="", mtime=self.j1),
                     vue("T002", role="implementeur", result="", mtime=self.j1),
                     vue("T003", role="testeur", result="", mtime=self.j2),
                     vue("T004", role="implementeur", statut="rejete", result="", mtime=self.j2, archive=True)]

    def test_tri_et_groupes(self):
        t = a.tendances(self.vues)
        self.assertEqual([(x["jour"], x["cle"]) for x in t], [
            ("2026-10-15", "implementeur"), ("2026-10-15", "testeur"),
            ("2026-10-16", "implementeur"), ("2026-10-16", "testeur")])
        self.assertEqual(t[2]["renvoi"], 1.0)

    def test_filtres(self):
        self.assertEqual(len(a.tendances(self.vues, depuis="2026-10-16")), 2)
        self.assertEqual(len(a.tendances(self.vues, role="testeur")), 2)
        self.assertEqual(a.tendances(self.vues, par="modele")[0]["cle"], "sonnet")


class Valeur(unittest.TestCase):
    def test_avant_apres(self):
        vues = [vue(tid(i), result="", mtime=float(i * 10), statut="rejete" if i <= 2 else "fait") for i in range(1, 7)]
        self.assertEqual(a.valeur(vues, "renvoi", "tous", avant=55.0, n=3), (0.0, 3))
        self.assertEqual(a.valeur(vues, "renvoi", "tous", avant=25.0, n=10), (1.0, 2))
        self.assertEqual(a.valeur(vues, "renvoi", "tous", apres=45.0, n=1), (0.0, 1))
        self.assertEqual(a.valeur(vues, "renvoi", "role:x", avant=55.0, n=3), (None, 0))


class Charger(unittest.TestCase):
    def tache(self, vault, proj, n, task, result=None, sous="projets"):
        d = vault / sous / proj / "taches" / f"T{n:03d}-x"
        d.mkdir(parents=True)
        (d / "task.md").write_bytes(task if isinstance(task, bytes) else task.encode())
        if result is not None:
            (d / "result.md").write_text(result)
        return d

    def fm(self, n, maj="2026-10-16", extra=""):
        return f"---\nid: T{n:03d}\nrole: scribe\nstatut: fait\nmodele: sonnet\nmaj: {maj}\n{extra}---\n"

    def test_vault(self):
        with tempfile.TemporaryDirectory() as t:
            v = Path(t)
            self.assertEqual(a.charger(v), [])
            (v / "projets/vide").mkdir(parents=True)
            self.tache(v, "p", 1, self.fm(1), result="## Écarts\n- ∅\n")
            self.tache(v, "p", 2, self.fm(2))
            self.tache(v, "vieux", 3, self.fm(3), sous="archive")
            vues = a.charger(v)
            self.assertEqual([(x.projet, x.tid, x.archive) for x in vues],
                             [("p", "T001", False), ("p", "T002", False), ("vieux", "T003", True)])
            self.assertIsNotNone(vues[0].result_mtime)
            self.assertIsNone(vues[1].result)
            self.assertIsNone(vues[1].result_mtime)

    def test_hostiles(self):
        with tempfile.TemporaryDirectory() as t:
            v = Path(t)
            self.tache(v, "p", 1, self.fm(1, extra='titre: "non fermé\n'))
            self.tache(v, "p", 2, self.fm(2, extra='titre: "a\\nb"\n'))
            self.tache(v, "p", 3, b"---\nid: T003\nstatut: fait\nmaj: 2026-10-16\ntitre: \xff\xfe\n---\n")
            self.tache(v, "p", 4, "---\nid: T004\nstatut: fait\nrole: scribe\n---\n")
            self.tache(v, "p", 5, self.fm(5, maj="pas-une-date"))
            ignorees: list[str] = []
            vues = a.charger(v, ignorees)
            self.assertEqual([x.tid for x in vues], ["T001", "T002"])
            self.assertEqual(len(ignorees), 3)
            self.assertEqual(sorted(i.split("/")[1][:4] for i in ignorees), ["T003", "T004", "T005"])

    def test_declencheurs_vault_vide(self):
        with tempfile.TemporaryDirectory() as t:
            (Path(t) / "vault/projets").mkdir(parents=True)
            self.assertEqual(a.declencheurs(Path(t) / "vault", MAINT), [])


if __name__ == "__main__":
    unittest.main()
