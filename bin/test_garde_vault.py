"""Tests de garde_vault : racine de banc sous AGENTX_ROOT (tmp), le vrai vault et run/ ne sont jamais touchés.

Lancer : python3 -m unittest bin/test_garde_vault.py
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ICI = Path(__file__).resolve().parent
BANC = Path(tempfile.mkdtemp(prefix="agentx-gv-"))
os.environ["AGENTX_ROOT"] = str(BANC)
for var in ("AGENTX_TID", "AGENTX_PROJET"):
    os.environ.pop(var, None)

NOTES = BANC / "vault" / "projets" / "p" / "notes"
GELE = "vault/projets/p/notes/contrat-a.md"
LIBRE = "vault/projets/p/notes/contrat-b.md"
V1 = "---\nversion: 1\n---\ncorps\n"
V2 = "---\nversion: 2\namende: 2026-10-16\n---\ncorps\n\n## v2 — 2026-10-16 — raison\nx\n"
PACK_E = "## Fichiers autorisés\n| Chemin | Droit | Pourquoi |\n|---|---|---|\n| `{f}` | {d} | x |\n"


def tache(tid: str, role: str, statut: str, pack: str = "") -> None:
    d = BANC / "vault" / "projets" / "p" / "taches" / f"{tid}-x"
    d.mkdir(parents=True, exist_ok=True)
    (d / "task.md").write_text(f"---\nid: {tid}\nrole: {role}\nstatut: {statut}\n---\n", encoding="utf-8")
    (d / "context.md").write_text(pack, encoding="utf-8")


def fiche(tid: str, role: str, sid: str) -> None:
    reg = BANC / "run" / "agents"
    reg.mkdir(parents=True, exist_ok=True)
    (reg / f"p-{tid}.json").write_text(json.dumps({"id_session": sid, "nom": f"agentx-p-{tid}", "pid": None,
                                                    "role": role, "tid": tid, "projet": "p"}), encoding="utf-8")


def setUpModule():
    NOTES.mkdir(parents=True)
    for nom in ("contrat-a.md", "contrat-b.md"):
        (NOTES / nom).write_text(V1, encoding="utf-8")
    tache("T1", "architecte", "en-cours")
    tache("T2", "implementeur", "en-cours")
    tache("T3", "architecte", "pret", PACK_E.format(f=GELE, d="E"))
    tache("T4", "architecte", "pret", PACK_E.format(f=GELE, d="L"))
    for tid, role, sid in (("T1", "architecte", "aaaaaaaa"), ("T2", "implementeur", "bbbbbbbb"),
                           ("T3", "architecte", "cccccccc"), ("T4", "architecte", "dddddddd")):
        fiche(tid, role, sid)
    (BANC / "run" / "vagues").mkdir(parents=True)
    (BANC / "run" / "vagues" / "p-20261016-120000.json").write_text(json.dumps(
        {"id": "p-20261016-120000", "projet": "p", "lance": "2026-10-16T12:00:00", "taches": ["T1", "T2"],
         "contrats": {GELE: 1}}), encoding="utf-8")
    (BANC / "bin").mkdir()
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(ICI.parent / "roles.json", BANC / "roles.json")


def tearDownModule():
    shutil.rmtree(BANC)


def hook(outil: str, chemin: str, session: str = "zz", brut: str | None = None, **saisie) -> str:
    """'' si silence, sinon la raison du deny."""
    entree = brut if brut is not None else json.dumps(
        {"session_id": session, "tool_name": outil, "tool_input": {"file_path": chemin, **saisie}})
    r = subprocess.run([sys.executable, str(ICI / "garde_vault.py")], input=entree, capture_output=True,
                       text=True, env=dict(os.environ), cwd=str(BANC))
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)["hookSpecificOutput"]["permissionDecisionReason"] if r.stdout.strip() else ""


class TestGardeVault(unittest.TestCase):
    def test_chemin_non_contrat_silence(self):
        self.assertEqual(hook("Write", "apps/web/README.md", content="x"), "")
        self.assertEqual(hook("Write", "vault/projets/p/notes/autre.md", content="x"), "")

    def test_stdin_illisible_deny(self):
        self.assertIn("mal formée", hook("Write", "", brut="pas du json"))

    def test_chef_gele_deny_message_1(self):
        r = hook("Write", GELE, content=V2)
        self.assertEqual(r, "GARDE AGENTX — contrat-a v1 gelé par la vague p-20261016-120000 (en-cours : T1, T2) "
                            "[appelant : chef]. Amendement = tâche architecte hors vague : python3 bin/vx.py tache "
                            "\"Amender contrat-a v2\" --projet p --role architecte. "
                            "Agent : statut bloque + escalade: contrat dans result.md.")

    def test_implementeur_gele_deny(self):
        self.assertIn("[appelant : implementeur T2]", hook("Write", GELE, "bbbbbbbb-1234", content=V2))

    def test_architecte_dans_la_vague_deny(self):
        self.assertIn("[appelant : architecte T1]", hook("Write", GELE, "aaaaaaaa-1234", content=V2))

    def test_architecte_hors_vague_avec_e_passe(self):
        self.assertEqual(hook("Write", GELE, "cccccccc-1234", content=V2), "")

    def test_architecte_hors_vague_sans_e_deny(self):
        self.assertIn("[appelant : architecte T4]", hook("Write", GELE, "dddddddd-1234", content=V2))

    def test_repli_env_posee_par_dispatch(self):
        os.environ.update(AGENTX_TID="T3", AGENTX_PROJET="p")
        try:
            self.assertEqual(hook("Write", GELE, "inconnue", content=V2), "")
        finally:
            del os.environ["AGENTX_TID"], os.environ["AGENTX_PROJET"]

    def test_edit_gele_deny(self):
        r = hook("Edit", GELE, "bbbbbbbb", old_string="corps", new_string="autre", replace_all=True)
        self.assertTrue(r.startswith("GARDE AGENTX — contrat-a : corps v1 modifié"), r)

    def test_append_conforme_hors_gel_silence(self):
        self.assertEqual(hook("Write", LIBRE, content=V2), "")
        self.assertEqual(hook("Write", str(BANC / "vault/projets/p/notes/contrat-neuf.md"), content=V1), "")

    def test_multiedit_conforme_hors_gel_silence(self):
        edits = [{"old_string": "version: 1", "new_string": "version: 2\namende: 2026-10-16"},
                 {"old_string": "corps\n", "new_string": "corps\n\n## v2 — 2026-10-16 — raison\nx\n"}]
        self.assertEqual(hook("MultiEdit", LIBRE, edits=edits), "")

    def test_corps_modifie_deny_message_2(self):
        r = hook("Write", LIBRE, content=V2.replace("corps\n", "autre\n", 1))
        self.assertEqual(r, "GARDE AGENTX — contrat-b : corps v1 modifié au-dessus de la fin (append-only). "
                            "Ajoute un bloc « ## v2 — AAAA-MM-JJ — raison » et version: 2.")
        self.assertIn("corps v1 modifié", hook("Edit", LIBRE, old_string="corps", new_string="autre"))


if __name__ == "__main__":
    unittest.main()
