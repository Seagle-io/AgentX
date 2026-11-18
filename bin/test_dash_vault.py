#!/usr/bin/env python3
"""Tests dash._vault_maj : banc tempfile, VAULT patche."""
import os
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path

ICI = Path(__file__).resolve().parent
TMP = Path(tempfile.mkdtemp())
sys.path.insert(0, str(ICI))
with unittest.mock.patch.dict(os.environ, {"AGENTX_ROOT": str(TMP), "AGENTX_RUN_DIR": str(TMP / "run")}):
    import dash  # noqa: E402


def poser(vault: Path, rel: str, mtime: float):
    f = vault / rel
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text("x", encoding="utf-8")
    os.utime(f, (mtime, mtime))


class VaultMaj(unittest.TestCase):
    def setUp(self):
        self.vault = Path(tempfile.mkdtemp(dir=TMP))
        p = unittest.mock.patch.object(dash, "VAULT", self.vault)
        p.start()
        self.addCleanup(p.stop)
        dash._VAULT_MAJ.update(t=None, mtime=None)

    def test_plus_recent_gagne(self):
        poser(self.vault, "a.md", 1000)
        poser(self.vault, "p/b.md", 2000)
        r = dash._vault_maj()
        self.assertEqual(r["chemin"], "p/b.md")
        self.assertGreaterEqual(r["age_s"], 0)
        self.assertRegex(r["iso"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$")

    def test_ignores(self):
        poser(self.vault, "a.md", 1000)
        poser(self.vault, ".sync_x.db", 5000)
        poser(self.vault, ".obsidian/c.json", 5000)
        poser(self.vault, "INDEX.md", 5000)
        self.assertEqual(dash._vault_maj()["chemin"], "a.md")

    def test_vide(self):
        self.assertIsNone(dash._vault_maj())

    def test_cache(self):
        poser(self.vault, "a.md", 1000)
        with unittest.mock.patch.object(dash.os, "walk", wraps=os.walk) as w:
            dash._vault_maj()
            dash._vault_maj()
        self.assertEqual(w.call_count, 1)


class VaultSynchro(unittest.TestCase):
    def setUp(self):
        self.vault = Path(tempfile.mkdtemp(dir=TMP))
        self.proc = Path(tempfile.mkdtemp(dir=TMP))
        for p in (unittest.mock.patch.object(dash, "VAULT", self.vault),
                  unittest.mock.patch.object(dash, "_PROC", self.proc)):
            p.start()
            self.addCleanup(p.stop)

    def test_wal_gagne(self):
        poser(self.vault, ".sync_x.db", 1000)
        poser(self.vault, ".sync_x.db-wal", 2000)
        r = dash._vault_synchro()
        self.assertEqual(r["iso"], dash.datetime.fromtimestamp(2000).strftime("%Y-%m-%dT%H:%M:%S"))
        self.assertGreaterEqual(r["age_s"], 0)

    def test_aucun_sync(self):
        poser(self.vault, "a.md", 1000)
        self.assertIsNone(dash._vault_synchro())

    def test_client(self):
        poser(self.vault, ".sync_x.db", 1000)
        (self.proc / "42").mkdir()
        (self.proc / "42" / "cmdline").write_bytes(b"/usr/bin/python3\0nextcloud\0")
        self.assertFalse(dash._vault_synchro()["client"])
        (self.proc / "43").mkdir()
        (self.proc / "43" / "cmdline").write_bytes(b"/usr/bin/nextcloud\0--background\0")
        self.assertTrue(dash._vault_synchro()["client"])


if __name__ == "__main__":
    unittest.main()
