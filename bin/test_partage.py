"""Tests de partage.py (§5) : décisions 1 fichier, todo/journal par machine, générés ; écrivains de vx branchés.

Lancer : python3 -m unittest bin/test_partage.py
Banc jetable .cache/banc-partage/b<pid> : partage.VAULT / identite.CHEFS patchés, vx lancé avec AGENTX_ROOT.
Machines simulées par AGENTX_MACHINE : pc-a = MAR, pc-b = SYL. 0 écriture dans le vrai vault.
"""

import os
import shutil
import subprocess
import sys
import unittest
from datetime import date, datetime
from pathlib import Path
from unittest import mock

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
sys.path.insert(0, str(ICI))

import identite  # noqa: E402
import partage  # noqa: E402
import produits  # noqa: E402

BANC = DEPOT / ".cache" / "banc-partage" / f"b{os.getpid()}"
T0 = datetime(2026, 11, 17, 14, 32)
CHEF_MD = "---\nprefixe: {p}\nmachine: {m}\ncree: 2026-11-17\ntags: [chef]\n---\n"


class Base(unittest.TestCase):
    def setUp(self):
        self.racine = BANC / self._testMethodName
        self.vault = self.racine / "vault"
        self.addCleanup(shutil.rmtree, self.racine, True)
        for p in (mock.patch.object(partage, "ROOT", self.racine), mock.patch.object(partage, "VAULT", self.vault),
                  mock.patch.object(identite, "CHEFS", self.vault / "chefs"),
                  mock.patch.object(produits, "erreur", return_value="registre invalide"),
                  mock.patch.dict(os.environ, AGENTX_MACHINE="pc-a")):
            p.start()
            self.addCleanup(p.stop)

    def poser_prefixes(self):
        (self.vault / "chefs").mkdir(parents=True)
        for p, m in (("MAR", "pc-a"), ("SYL", "pc-b")):
            (self.vault / "chefs" / f"{p}.md").write_text(CHEF_MD.format(p=p, m=m), encoding="utf-8")

    def projet(self, slug: str) -> Path:
        proj = self.vault / "projets" / slug
        proj.mkdir(parents=True)
        return proj


class Decisions(Base):
    def test_ecrire_nom_suffixe_frontmatter(self):
        self.poser_prefixes()
        f1 = partage.ecrire_decision("agentx", "Choix du format : 1 fichier !", "- Choix: 1 fichier",
                                     projet="coord", chef="marianne@MAR", quand=T0, supersede="ancien.md")
        f2 = partage.ecrire_decision("agentx", "Choix du format : 1 fichier !", "x", projet=None, chef=None, quand=T0)
        f3 = partage.ecrire_decision("agentx", "Choix du format : 1 fichier !", "y", projet=None, chef=None, quand=T0)
        dossier = self.vault / "etages" / "agentx" / "decisions"
        self.assertEqual([f1, f2, f3], [dossier / "2026-11-17-MAR-choix-du-format-1-fichier.md",
                                        dossier / "2026-11-17-MAR-choix-du-format-1-fichier-2.md",
                                        dossier / "2026-11-17-MAR-choix-du-format-1-fichier-3.md"])
        self.assertEqual(f1.read_text(encoding="utf-8"),
                         "---\ndate: 2026-11-17 14:32\nchef: marianne@MAR\netage: agentx\nprojet: coord\n"
                         "supersede: ancien.md\ntags: [decision]\n---\n\n# Choix du format : 1 fichier !\n\n"
                         "- Choix: 1 fichier\n")
        self.assertEqual(f2.read_text(encoding="utf-8").split("---\n")[1],
                         "date: 2026-11-17 14:32\netage: agentx\ntags: [decision]\n")

    def test_sujet_tronque_et_mode_ancien(self):
        f = partage.ecrire_decision("e", "a" * 60, "", projet=None, chef=None, quand=T0)
        self.assertEqual(f.name, f"2026-11-17-pc-a-{'a' * 40}.md")

    def test_lire_fusionne_ancien_et_dossier_trie(self):
        self.poser_prefixes()
        (self.projet("coord") / "decisions.md").write_text(
            "# Decisions\n\n## 2026-11-16 09:00 — ancien choix\n- Choix: a\n\n## 2026-11-18 — plus tard\n- b\n",
            encoding="utf-8")
        (self.projet("autre") / "decisions.md").write_text("## 2026-11-15 — pas cet étage\n", encoding="utf-8")
        partage.ecrire_decision("coord", "neuf", "- Choix: n", projet="coord", chef="marianne@MAR", quand=T0)
        partage.ecrire_decision("coord", "tout l'étage", "- c", projet=None, chef=None, quand=T0)
        partage.ecrire_decision("coord", "autre projet", "- d", projet="voisin", chef=None, quand=T0)
        conflit = self.vault / "etages" / "coord" / "decisions" / "x (conflicted copy 2026-11-17).md"
        conflit.write_text("---\ndate: 2026-11-01 00:00\n---\n\n# conflit\n", encoding="utf-8")
        ds = partage.lire_decisions("coord", "coord")
        self.assertEqual([(d["date"], d["heure"], d["titre"], d["projet"]) for d in ds],
                         [("2026-11-16", "09:00", "ancien choix", "coord"),
                          ("2026-11-17", "14:32", "neuf", "coord"),
                          ("2026-11-17", "14:32", "tout l'étage", None),
                          ("2026-11-18", "", "plus tard", "coord")])
        self.assertEqual((ds[0]["source"], ds[0]["chef"], ds[0]["corps"]),
                         ("vault/projets/coord/decisions.md", None, "- Choix: a\n\n"))
        self.assertEqual((ds[1]["chef"], ds[1]["corps"].strip()), ("marianne@MAR", "- Choix: n"))
        self.assertEqual(len(partage.lire_decisions("coord")), 5)   # projet None : tout l'étage, 0 conflit
        self.assertFalse((self.vault / "projets" / "coord" / "decisions.md").read_text(encoding="utf-8")
                         .count("neuf"))

    def test_blocs_anciens(self):
        self.assertEqual(partage.blocs_anciens("# T\n## 2026-11-17 10:05 — titre\ncorps\n## sans date\n"),
                         [("2026-11-17", "10:05", "titre", "corps\n"), ("", "", "sans date", "")])


class Etage(Base):
    def test_registre_invalide_slug(self):
        (self.projet("coord") / "brief.md").write_text("---\nproduit: agentx\n---\n", encoding="utf-8")
        self.assertEqual(partage.etage_de("coord"), "coord")

    def test_produit_du_brief(self):
        (self.projet("coord") / "brief.md").write_text("---\nproduit: agentx\n---\n", encoding="utf-8")
        with mock.patch.object(produits, "produit_de", return_value=("agentx", "brief")) as pd:
            self.assertEqual(partage.etage_de("coord"), "agentx")
        pd.assert_called_once_with({"produit": "agentx"})


class TodoJournal(Base):
    def test_deux_machines_deux_fichiers_lecture_fusionnee(self):
        self.poser_prefixes()
        proj = self.projet("coord")
        (proj / "todo.md").write_text("- [ ] commune\n- [ ] ancienne  \n", encoding="utf-8")
        (proj / "journal.md").write_text("# Journal\n\n- `2026-11-17 10:00` ancien\n", encoding="utf-8")
        a = partage.fichier_machine(proj, "todo")
        a.write_text("- [ ] commune\n- [ ] de a\n", encoding="utf-8")
        partage.fichier_machine(proj, "journal").write_text("- `2026-11-17 12:00` a\n", encoding="utf-8")
        with mock.patch.dict(os.environ, AGENTX_MACHINE="pc-b"):
            b = partage.fichier_machine(proj, "todo")
            b.write_text("- [ ] de b\n- [ ] ancienne\n", encoding="utf-8")
            partage.fichier_machine(proj, "journal").write_text("- `2026-11-17 11:00` b\n## bloc\n",
                                                                encoding="utf-8")
        (proj / "todo" / "SYL (conflicted copy).md").write_text("- [ ] conflit\n", encoding="utf-8")
        self.assertEqual((a, b), (proj / "todo" / "MAR.md", proj / "todo" / "SYL.md"))
        self.assertEqual(sorted(p.name for p in (proj / "journal").iterdir()), ["MAR.md", "SYL.md"])
        self.assertEqual(partage.lire_todo(proj), ["- [ ] commune", "- [ ] ancienne", "- [ ] de a", "- [ ] de b"])
        self.assertEqual(partage.lire_journal(proj), ["- `2026-11-17 10:00` ancien", "- `2026-11-17 11:00` b",
                                                      "- `2026-11-17 12:00` a"])

    def test_ecrire_si_change_idempotent(self):
        f = self.racine / "INDEX.md"
        self.racine.mkdir(parents=True)
        self.assertTrue(partage.ecrire_si_change(f, "a\n"))
        mtime = f.stat().st_mtime_ns
        self.assertFalse(partage.ecrire_si_change(f, "a\n"))
        self.assertEqual(f.stat().st_mtime_ns, mtime)
        self.assertTrue(partage.ecrire_si_change(f, "b\n"))
        self.assertEqual(f.read_text(encoding="utf-8"), "b\n")


# --------------------------------------------------------------------------- #
# écrivains vx (CLI, banc AGENTX_ROOT)
# --------------------------------------------------------------------------- #

CLI = BANC / "cli"
PROJ = CLI / "vault" / "projets" / "banc"


def setUpModule():
    (CLI / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "frontmatter.py", "agents.py", "terminal.py",
              "voix.py", "demandes.py", "tid.py", "identite.py", "partage.py", "reprise.py", "contrats.py"):
        shutil.copy(ICI / f, CLI / "bin" / f)
    shutil.copy(DEPOT / "roles.json", CLI / "roles.json")
    (CLI / "vault" / "_templates").mkdir(parents=True)
    for f in ("brief.md", "plan.md", "task.md", "context.md"):
        shutil.copy(DEPOT / "vault" / "_templates" / f, CLI / "vault" / "_templates" / f)
    (CLI / "vault" / "chefs").mkdir(parents=True)
    for p, m in (("MAR", "pc-a"), ("SYL", "pc-b")):
        (CLI / "vault" / "chefs" / f"{p}.md").write_text(CHEF_MD.format(p=p, m=m), encoding="utf-8")


def tearDownModule():
    shutil.rmtree(BANC, True)


def vx(*args: str, entree: str = "", machine: str = "pc-a") -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items() if k not in ("AGENTX_CHEF", "AGENTX_ROOT")}
    env.update(AGENTX_MACHINE=machine, AGENTX_ROOT=str(CLI), AGENTX_CHEF="marianne")
    return subprocess.run([sys.executable, str(CLI / "bin" / "vx.py"), *args], input=entree,
                          capture_output=True, text=True, cwd=str(CLI), env=env)


def tache(tid: str, statut: str, chef: str | None):
    d = PROJ / "taches" / f"{tid}-banc"
    d.mkdir(parents=True)
    (d / "task.md").write_text(f"---\nid: {tid}\ntitre: banc\nrole: implementeur\nstatut: {statut}\n"
                               + (f"chef: {chef}\n" if chef else "") + "---\n", encoding="utf-8")


class Vx(unittest.TestCase):
    """Ordre alphabétique : A projet (crée banc), B…, les suivantes en dépendent."""

    def test_a_projet_sans_decisions_md_index_stable(self):
        r = vx("projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertFalse((PROJ / "decisions.md").exists())
        self.assertFalse((PROJ / "journal.md").exists())
        self.assertIn("projet cree", (PROJ / "journal" / "MAR.md").read_text(encoding="utf-8"))
        index = CLI / "vault" / "INDEX.md"
        texte, mtime = index.read_text(encoding="utf-8"), index.stat().st_mtime_ns
        self.assertIn("[decisions](etages/banc/decisions/)", texte)
        self.assertNotRegex(texte, r"\d{4}-\d{2}-\d{2}")
        self.assertEqual(vx("index").returncode, 0)
        self.assertEqual((index.read_text(encoding="utf-8"), index.stat().st_mtime_ns), (texte, mtime))

    def test_b_decision_cli(self):
        r = vx("decision", "--projet", "banc", "--titre", "Format todo", entree="- Choix: 1 fichier/machine\n")
        chemin = f"vault/etages/banc/decisions/{date.today():%Y-%m-%d}-MAR-format-todo.md"
        self.assertEqual((r.returncode, r.stdout), (0, chemin + "\n"), r.stderr)
        texte = (CLI / chemin).read_text(encoding="utf-8")
        self.assertIn("chef: marianne@MAR\netage: banc\nprojet: banc\n", texte)
        self.assertTrue(texte.endswith("# Format todo\n\n- Choix: 1 fichier/machine\n"))
        r = vx("decision", "--projet", "banc", "--titre", "Format todo", "--tout-etage", entree="- c\n")
        self.assertEqual((r.returncode, r.stdout), (0, chemin.replace(".md", "-2.md") + "\n"), r.stderr)
        self.assertNotIn("projet:", (CLI / r.stdout.strip()).read_text(encoding="utf-8"))

    def test_c_passation_migre_todo_lignes_de_mon_prefixe(self):
        tache("T001", "bloque", None)
        tache("T002", "bloque", "zoe@SYL")
        tache("T003", "bloque", "marianne@MAR")
        (PROJ / "todo.md").write_text("- [ ] URGENT relire\n- [ ] ligne manuelle\n- [ ] Répondre/virer T009\n",
                                      encoding="utf-8")
        r = vx("passation", "--projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertFalse((PROJ / "todo.md").exists())
        self.assertEqual((PROJ / "todo" / "MAR.md").read_text(encoding="utf-8"),
                         "- [ ] URGENT relire\n- [ ] ligne manuelle\n- [ ] Répondre/virer T001\n"
                         "- [ ] Répondre/virer T003\n")
        self.assertIn("passation (vx passation)", (PROJ / "journal" / "MAR.md").read_text(encoding="utf-8"))
        r = vx("passation", "--projet", "banc", machine="pc-b")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual((PROJ / "todo" / "SYL.md").read_text(encoding="utf-8"),
                         "- [ ] Répondre/virer T001\n- [ ] Répondre/virer T002\n")

    def test_d_doctor_conflit_sync(self):
        (PROJ / "todo" / "MAR (conflicted copy 2026-11-17).md").write_text("x\n", encoding="utf-8")
        r = vx("doctor")
        self.assertIn("x conflit-sync vault/projets/banc/todo/MAR (conflicted copy 2026-11-17).md\n", r.stdout)


if __name__ == "__main__":
    unittest.main()
