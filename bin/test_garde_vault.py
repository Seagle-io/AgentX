"""Tests de garde_vault : racine de banc sous AGENTX_ROOT (tmp), le vrai vault et run/ ne sont jamais touchés.

Lancer : python3 -m unittest bin/test_garde_vault.py
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
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
SEUL_E = "vault/projets/p/notes/contrat-c.md"
SEUL_L = "vault/projets/p/notes/contrat-d.md"
RESULT_T2 = "vault/projets/p/taches/T2-x/result.md"
RESULT_T1 = "vault/projets/p/taches/T1-x/result.md"
PACK_E ="## Fichiers autorisés\n| Chemin | Droit | Pourquoi |\n|---|---|---|\n| `{f}` | {d} | x |\n"


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
    for nom in ("contrat-a.md", "contrat-b.md", "contrat-c.md", "contrat-d.md"):
        (NOTES / nom).write_text(V1, encoding="utf-8")
    tache("T5", "architecte", "en-cours", PACK_E.format(f=SEUL_E, d="E"))
    tache("T6", "architecte", "en-cours", PACK_E.format(f=SEUL_L, d="L"))
    fiche("T5", "architecte", "eeeeeeee")
    fiche("T6", "architecte", "ffffffff")
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
    for tid, contrat in (("T5", SEUL_E), ("T6", SEUL_L)):
        (BANC / "run" / "vagues" / f"p-{tid}.json").write_text(json.dumps(
            {"id": f"p-{tid}", "projet": "p", "lance": "2026-10-16T12:00:00", "taches": [tid],
             "contrats": {contrat: 1}}), encoding="utf-8")
    for rel, texte in (("code/a.txt", "l1\nl2\n"), (RESULT_T2, "r\n"), (RESULT_T1, "r\n"),
                       (".sorties/p/T2/n.txt", "n\n"), (".sorties/p/T1/n.txt", "n\n")):
        (BANC / rel).parent.mkdir(parents=True, exist_ok=True)
        (BANC / rel).write_text(texte, encoding="utf-8")
    (BANC / "bin").mkdir()
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "frontmatter.py"):
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


def post(evt: str, session: str, chemin: str) -> str:
    """Sortie standard du hook verrou.py (toujours vide, rc 0)."""
    entree = json.dumps({"session_id": session, "hook_event_name": evt, "tool_input": {"file_path": chemin}})
    r = subprocess.run([sys.executable, str(ICI / "verrou.py")], input=entree, capture_output=True,
                       text=True, env=dict(os.environ), cwd=str(BANC))
    assert r.returncode == 0, r.stderr
    return r.stdout


def lire_verrou(chemin: str) -> dict | None:
    sys.path.insert(0, str(ICI))
    import verrou
    return verrou.lire(BANC / chemin)


MSG_WRITE = ("GARDE AGENTX — Write refusé sur {rel} : fichier existant, arbre partagé (pas d'écrasement). "
             "Utilise Edit ou MultiEdit sur la zone à changer, après relecture.")


class TestGardeVault(unittest.TestCase):
    def setUp(self):
        shutil.rmtree(BANC / "run" / "verrous", ignore_errors=True)

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

    def test_architecte_seul_en_cours_de_sa_vague_passe(self):
        self.assertEqual(hook("Write", SEUL_E, "eeeeeeee-1234", content=V2), "")

    def test_architecte_seul_sans_e_deny(self):
        self.assertIn("[appelant : architecte T6]", hook("Write", SEUL_L, "ffffffff-1234", content=V2))

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

    def test_write_agent_existant_deny(self):
        self.assertEqual(hook("Write", "code/a.txt", "bbbbbbbb", content="x"), MSG_WRITE.format(rel="code/a.txt"))

    def test_verrou_vide_frais_message_ecriture_en_cours(self):
        sys.path.insert(0, str(ICI))
        import verrou
        verrou.RACINE.mkdir(parents=True, exist_ok=True)
        verrou.cle(BANC / "code/a.txt").write_text("", encoding="utf-8")
        self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"),
                         "GARDE AGENTX — code/a.txt : écriture en cours par un autre agent (verrou frais), "
                         "réessaie dans 1 s")

    def test_write_agent_absent_passe(self):
        self.assertEqual(hook("Write", "code/neuf.txt", "bbbbbbbb", content="x"), "")

    def test_chef_silence_sans_verrou(self):
        self.assertEqual(hook("Write", "code/a.txt", "zz", content="x"), "")
        self.assertEqual(list((BANC / "run" / "verrous").glob("*")), [])

    def test_write_result_propre_passe(self):
        self.assertEqual(hook("Write", RESULT_T2, "bbbbbbbb", content="x"), "")
        self.assertTrue(hook("Write", RESULT_T2, "aaaaaaaa", content="x").startswith("GARDE AGENTX — Write refusé"))

    def test_write_sorties(self):
        self.assertEqual(hook("Write", ".sorties/p/T2/n.txt", "bbbbbbbb", content="x"), "")
        self.assertTrue(hook("Write", ".sorties/p/T1/n.txt", "bbbbbbbb", content="x")
                        .startswith("GARDE AGENTX — Write refusé"))

    def test_edit_pose_verrou(self):
        self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"), "")
        v = lire_verrou("code/a.txt")
        self.assertEqual((v["tid"], v["projet"], v["session"]), ("T2", "p", "bbbbbbbb"))

    def test_verrou_autre_session_deny(self):
        hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x")
        self.assertEqual(hook("Edit", "code/a.txt", "aaaaaaaa", old_string="l1", new_string="x"),
                         "GARDE AGENTX — code/a.txt en cours d'édition par T2 (p). "
                         "Réessaie dans 10 s ; relis le fichier avant ton Edit.")

    def test_verrou_reentrant(self):
        for _ in range(2):
            self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"), "")

    def test_verrou_expire_repris(self):
        import verrou
        k = verrou.cle(BANC / "code/a.txt")
        k.parent.mkdir(parents=True)
        k.write_text(json.dumps({"chemin": "x", "tid": "T1", "projet": "p", "session": "aaaaaaaa",
                                 "pose": time.time() - 11}), encoding="utf-8")
        self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"), "")
        self.assertEqual(lire_verrou("code/a.txt")["tid"], "T2")

    def test_verrou_illisible_repris(self):
        import verrou
        k = verrou.cle(BANC / "code/a.txt")
        k.parent.mkdir(parents=True)
        k.write_text("pas du json", encoding="utf-8")
        os.utime(k, (time.time() - 2, time.time() - 2))
        self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"), "")

    def test_verrou_non_objet_repris(self):
        import verrou
        k = verrou.cle(BANC / "code/a.txt")
        k.parent.mkdir(parents=True)
        k.write_text("[]", encoding="utf-8")
        os.utime(k, (time.time() - 2, time.time() - 2))
        self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"), "")
        k.write_text('"s"', encoding="utf-8")
        self.assertEqual(post("PostToolUse", "bbbbbbbb", "code/a.txt"), "")

    def test_poser_pose_future_tenu(self):
        import verrou
        f, fi, t = BANC / "code/a.txt", {"tid": "T2", "projet": "p"}, time.time()
        self.assertIsNone(verrou.poser(f, fi, "s1", maintenant=t + 5e-5))
        self.assertEqual(verrou.poser(f, fi, "s2", maintenant=t)["session"], "s1")

    def test_poser_fichier_vide_recent_tenu(self):
        import verrou
        f, fi = BANC / "code/a.txt", {"tid": "T2", "projet": "p"}
        verrou.cle(f).parent.mkdir(parents=True, exist_ok=True)
        verrou.cle(f).write_text("")
        self.assertIsNotNone(verrou.poser(f, fi, "s2"))
        os.utime(verrou.cle(f), (time.time() - 2, time.time() - 2))
        self.assertIsNone(verrou.poser(f, fi, "s2"))

    def test_pose_non_numerique_repris(self):
        import verrou
        k = verrou.cle(BANC / "code/a.txt")
        k.parent.mkdir(parents=True, exist_ok=True)
        k.write_text('{"pose": "x", "session": "aaaaaaaa"}', encoding="utf-8")
        os.utime(k, (time.time() - 2, time.time() - 2))
        self.assertEqual(hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x"), "")
        self.assertEqual(lire_verrou("code/a.txt")["tid"], "T2")

    def test_poser_concurrent_un_seul(self):
        import threading
        import verrou
        f, fi = BANC / "code/a.txt", {"tid": "T2", "projet": "p"}
        for _ in range(50):
            shutil.rmtree(BANC / "run" / "verrous", ignore_errors=True)
            top, res = threading.Barrier(2), {}

            def tenter(s):
                top.wait()
                res[s] = verrou.poser(f, fi, s)
            ths = [threading.Thread(target=tenter, args=(s,)) for s in ("s1", "s2")]
            for th in ths:
                th.start()
            for th in ths:
                th.join()
            self.assertLessEqual(sum(r is None for r in res.values()), 1, res)

    def test_env_sans_fiche_silence(self):
        os.environ.update(AGENTX_TID="T131", AGENTX_PROJET="p")
        try:
            self.assertEqual(hook("Write", "code/a.txt", "inconnue", content="x"), "")
        finally:
            del os.environ["AGENTX_TID"], os.environ["AGENTX_PROJET"]
        self.assertFalse((BANC / "run" / "verrous").exists() and list((BANC / "run" / "verrous").glob("*")))

    def test_symlink_deny(self):
        lien = BANC / "vault/projets/p/taches/T2-x/result.md"
        sauve = lien.read_text(encoding="utf-8")
        lien.unlink()
        lien.symlink_to(BANC / "code/a.txt")
        try:
            self.assertIn("lien symbolique refusé", hook("Write", RESULT_T2, "bbbbbbbb", content="x"))
        finally:
            lien.unlink()
            lien.write_text(sauve, encoding="utf-8")

    def test_contrat_hors_root_deny(self):
        with tempfile.TemporaryDirectory() as d:
            c = Path(d) / "vault/projets/q/notes/contrat-z.md"
            c.parent.mkdir(parents=True)
            c.write_text(V1, encoding="utf-8")
            self.assertEqual(hook("Write", str(c), "bbbbbbbb", content="x"),
                             f"GARDE AGENTX — {c} : contrat hors dépôt, écriture refusée.")

    def _post_libere(self, evt: str):
        hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x")
        self.assertEqual(post(evt, "bbbbbbbb", "code/a.txt"), "")
        self.assertIsNone(lire_verrou("code/a.txt"))
        self.assertEqual(hook("Edit", "code/a.txt", "aaaaaaaa", old_string="l1", new_string="x"), "")

    def test_post_libere(self):
        self._post_libere("PostToolUse")

    def test_post_failure_libere(self):
        self._post_libere("PostToolUseFailure")

    def test_post_autre_session_intact(self):
        hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x")
        post("PostToolUse", "aaaaaaaa", "code/a.txt")
        self.assertEqual(lire_verrou("code/a.txt")["tid"], "T2")

    def test_multiedit_sous_verrou(self):
        hook("Edit", "code/a.txt", "bbbbbbbb", old_string="l1", new_string="x")
        r = hook("MultiEdit", "code/a.txt", "aaaaaaaa", edits=[{"old_string": "l1", "new_string": "x"}])
        self.assertIn("en cours d'édition par T2", r)

    def test_verrou_erreur_disque_fail_open(self):
        (BANC / "run" / "verrous").write_text("fichier ordinaire", encoding="utf-8")
        entree = json.dumps({"session_id": "bbbbbbbb", "tool_name": "Edit",
                             "tool_input": {"file_path": "code/a.txt", "old_string": "l1", "new_string": "x"}})
        r = subprocess.run([sys.executable, str(ICI / "garde_vault.py")], input=entree, capture_output=True,
                           text=True, env=dict(os.environ), cwd=str(BANC))
        self.assertEqual((r.returncode, r.stdout.strip()), (0, ""))
        self.assertIn("verrou ignoré", r.stderr)
        (BANC / "run" / "verrous").unlink()


if __name__ == "__main__":
    unittest.main()
