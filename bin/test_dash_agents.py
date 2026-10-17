#!/usr/bin/env python3
"""Tests de dash._agents_etage : fantômes = fiches vivantes + bloquées, jamais le vault seul."""
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

TMP = tempfile.mkdtemp()
os.environ["AGENTX_ROOT"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent))
import agents  # noqa: E402
import dash  # noqa: E402


def fiche(tid, pid):
    agents.REG.mkdir(parents=True, exist_ok=True)
    f = {"id_session": None, "nom": f"x-{tid}", "pid": pid, "role": "implementeur", "tid": tid,
         "projet": "p", "lance": "2026-10-16T10:00:00", "modele": "sonnet", "mode": "bg",
         "mort_signale": False}
    agents.ecrire(f)


def tache(tid, statut):
    d = Path(TMP) / "vault" / "projets" / "p" / "taches" / f"{tid}-x"
    d.mkdir(parents=True, exist_ok=True)
    (d / "result.md").write_text("r")
    return d, {"id": tid, "role": "implementeur", "statut": statut}


class AgentsEtage(unittest.TestCase):
    def test_vivante_bloquee_seulement(self):
        agents._SESSIONS.update(t=1e18, v=None)          # pas d'appel claude : pid seul
        fiche("T1", os.getpid())
        fiche("T2", 999999)
        fiche("T4", 999999)
        bloc = {"slug": "p", "taches": [tache("T1", "en-cours"), tache("T2", "en-cours"),
                                        tache("T3", "en-cours"), tache("T4", "bloque")]}
        infos = [{"tid": t, "projet": "p", "vivant": agents.vivant(agents.etat(agents.lire("p", t), None))}
                 for t in ("T1", "T2", "T4")]
        a = dash._agents_etage([bloc], infos)
        self.assertEqual([(x["tid"], x["bloque"]) for x in a], [("T4", True), ("T1", False)])
        self.assertEqual(a[1]["modele"], "sonnet")

    def test_branche_sans_depot(self):
        self.assertEqual(dash._depots(None, {}), [])

    def test_lire_tache_trouvee(self):
        d, _ = tache("T7", "revue")
        (d / "task.md").write_text("---\nid: T7\ntitre: Un titre\nrole: implementeur\nstatut: revue\n---\n")
        (d / "context.md").write_text("# Pack T7")
        t = dash.lire_tache("p", "T7")
        self.assertEqual((t["titre"], t["role"], t["statut"], t["pack"], t["result"]),
                         ("Un titre", "implementeur", "revue", "# Pack T7", "r"))

    def test_lire_tache_introuvable(self):
        self.assertIsNone(dash.lire_tache("p", "T999"))


if __name__ == "__main__":
    unittest.main()
