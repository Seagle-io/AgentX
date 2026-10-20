#!/usr/bin/env python3
"""Tests HTTP du login compte : /api/login/{open,in,stop,etat,stream}. Faux `claude` (sh), 0 vrai login."""
import http.client
import json
import os
import shutil
import sys
import tempfile
import threading
import time
import unittest
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

TMP = tempfile.mkdtemp()
os.environ["AGENTX_ROOT"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent))
import agents  # noqa: E402
import dash  # noqa: E402
import terminal  # noqa: E402

BANC = Path(__file__).resolve().parent.parent / ".sorties" / "agentx" / "T159"


class Login(unittest.TestCase):
    def setUp(self):
        BANC.mkdir(parents=True, exist_ok=True)
        self.tmp = Path(tempfile.mkdtemp(dir=BANC))
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.bin = self.tmp / "bin"
        self.bin.mkdir()
        self.comptes = self.tmp / "comptes"
        self.comptes.mkdir()
        self.journal: list = []
        for p in (mock.patch.dict(os.environ, {"PATH": f"{self.bin}:{os.environ['PATH']}"}),
                  mock.patch.object(agents, "COMPTES_DIR", self.comptes),
                  mock.patch.object(terminal, "_COURANT", []),
                  mock.patch.object(dash.Handler, "log_message", lambda _s, *a: self.journal.append(a))):
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.tuer)
        self.srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(dash.Handler, directory=str(self.tmp)))
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.addCleanup(self.srv.server_close)
        self.addCleanup(self.srv.shutdown)
        self.port = self.srv.server_address[1]

    def tuer(self):
        for lg in terminal._COURANT:
            lg.arreter()

    def faux(self, corps: str) -> None:
        f = self.bin / "claude"
        f.write_text("#!/bin/sh\n" + corps + "\n")
        f.chmod(0o755)

    def req(self, methode, chemin, corps=None, jeton=True, hote=None):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        h = {"Host": hote or f"127.0.0.1:{self.port}", "Content-Type": "application/json"}
        if jeton:
            h["X-AgentX-Jeton"] = dash.JETON
        c.request(methode, chemin, json.dumps(corps if corps is not None else {}), h)
        r = c.getresponse()
        data = json.loads(r.read() or b"{}")
        c.close()
        return r.status, data

    def attendre_fin(self, compte, delai=10.0):
        t = time.monotonic() + delai
        while time.monotonic() < t:
            lg = terminal._COURANT[0] if terminal._COURANT else None
            if lg is not None and lg.code is not None:
                return lg
            time.sleep(0.05)
        self.fail("login non terminé")

    def test_open_jeton_hote(self):
        self.faux("sleep 5")
        self.assertEqual(self.req("POST", "/api/login/open?compte=un", jeton=False)[0], 403)
        self.assertEqual(self.req("POST", "/api/login/open?compte=un", hote="evil.example")[0], 403)
        self.assertEqual(self.req("POST", "/api/login/open")[0], 400)
        self.assertEqual(self.req("POST", "/api/login/open?compte=")[0], 400)
        self.assertEqual(terminal._COURANT, [])

    def test_open_ignore_corps(self):
        self.faux('printf "%s|" "$@" > "' + str(self.tmp / "argv") + '"\nsleep 5')
        st, rep = self.req("POST", "/api/login/open?compte=un", {"argv": ["sh"], "cmd": "rm"})
        self.assertEqual((st, rep["vivant"], rep["compte"]), (200, True, "un"))
        t = time.monotonic() + 5
        while not (self.tmp / "argv").exists() and time.monotonic() < t:
            time.sleep(0.05)
        self.assertEqual((self.tmp / "argv").read_text(), "auth|login|")
        self.assertEqual(terminal._COURANT[0].argv, ["claude", "auth", "login"])

    def lire_sse(self, compte):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        c.request("GET", f"/api/login/stream?compte={compte}&jeton={dash.JETON}&depuis=0",
                  headers={"Host": f"127.0.0.1:{self.port}"})
        r = c.getresponse()
        self.assertEqual(r.status, 200)
        evts = []
        while True:
            ligne = r.fp.readline()
            if not ligne:
                break
            ligne = ligne.decode().strip()
            if ligne.startswith("data: "):
                evts.append(json.loads(ligne[6:]))
                if "fin" in evts[-1] or "mort" in evts[-1]:
                    break
        c.close()
        return evts

    def test_stream_o_puis_fin(self):
        self.faux('echo "https://exemple.test/auth"\nsleep 1\nexit 0')
        self.assertEqual(self.req("POST", "/api/login/open?compte=un")[0], 200)
        import base64
        evts = self.lire_sse("un")
        sortie = b"".join(base64.b64decode(e["o"]) for e in evts if "o" in e)
        self.assertIn(b"https://exemple.test/auth", sortie)
        self.assertEqual(evts[-1]["fin"], 0)
        self.assertTrue(all("o" in e for e in evts[:-1]))

    def test_in_mort_et_absent(self):
        self.faux("exit 0")
        self.assertEqual(self.req("POST", "/api/login/open?compte=un")[0], 200)
        self.attendre_fin("un")
        self.assertEqual(self.req("POST", "/api/login/in?compte=un", {"data": "x"}), (200, {"ok": False, "mort": True}))
        st, rep = self.req("POST", "/api/login/in?compte=autre", {"data": "x"})
        self.assertEqual((st, rep["code"]), (404, "login-absent"))

    def test_state_connecte_2s(self):
        self.faux('echo "{}" > "$CLAUDE_CONFIG_DIR/.credentials.json"\nexit 0')
        self.assertEqual(self.req("POST", "/api/login/open?compte=un")[0], 200)
        t0 = time.monotonic()
        while time.monotonic() - t0 < 2:
            for essai in range(3):
                try:
                    etat = self.req("GET", "/state.json")[1]
                    break
                except ConnectionResetError:
                    if essai == 2:
                        raise
                    time.sleep(0.1)
            cs ={c["nom"]: c for c in etat["immeuble"]["comptes"]}
            if cs.get("un", {}).get("connecte"):
                break
            time.sleep(0.1)
        self.assertTrue(cs["un"]["connecte"], cs)
        self.assertLessEqual(time.monotonic() - t0, 2)

    def test_route_inconnue(self):
        secret = "SECRET-PTY-9f3a"
        self.faux(f'echo {secret}\nsleep 5')
        self.assertEqual(self.req("POST", "/api/login/open?compte=un")[0], 200)
        time.sleep(0.3)
        st, rep = self.req("POST", "/api/login/xyz?compte=un")
        self.assertEqual(st, 400)
        self.assertNotIn(secret, json.dumps(rep))
        self.assertNotIn(secret, json.dumps(self.journal, default=str))


if __name__ == "__main__":
    unittest.main()
