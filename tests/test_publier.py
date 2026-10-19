"""Porte de publication (bin/publier.py, contrat seagle-pilotage §C5 + amendements 2026-10-16).

Chaque test monte un monde jetable dans un dossier temporaire : racine AgentX
copiée (bin/*.py depuis AGENTX_BIN, vault/_templates, roles.json), produits.json
temporaire, dépôts git temporaires datés par GIT_COMMITTER_DATE. publier.py est
lancé en sous-processus depuis cette racine : ROOT, registre et vault sont ceux
du monde jetable — jamais les vrais dépôts, jamais le vrai vault.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

DEPOT = Path(__file__).resolve().parent.parent
BIN = Path(os.environ.get("AGENTX_BIN", DEPOT / "bin"))
ENV = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}


def epoch(iso: str) -> int:
    from datetime import datetime
    return int(datetime.fromisoformat(iso).timestamp())


def git(depot: Path, *argv: str, date: str | None = None, entree: bytes | None = None) -> str:
    env = dict(ENV)
    if date:
        env["GIT_AUTHOR_DATE"] = env["GIT_COMMITTER_DATE"] = date
    r = subprocess.run(["git", "-c", "user.email=t@t", "-c", "user.name=t", "-C", str(depot), *argv],
                       env=env, input=entree, capture_output=True, check=True)
    return r.stdout.decode()


def commit(depot: Path, date: str, sujet: str, fichiers: dict[str, str]) -> str:
    for nom, contenu in fichiers.items():
        f = depot / nom
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(contenu, encoding="utf-8")
    git(depot, "add", "--", *fichiers)
    git(depot, "commit", "-q", "-m", sujet, date=date)
    return git(depot, "rev-parse", "--short", "HEAD").strip()


def rafale(depot: Path, branche: str, commits: list[tuple[str, str]]) -> None:
    """N commits (date iso, sujet) touchant src/a.ts, via git fast-import (rapide)."""
    flux = []
    for k, (date, sujet) in enumerate(commits):
        msg, contenu = sujet.encode(), f"{k}\n".encode()
        flux.append(f"commit refs/heads/{branche}\ncommitter t <t@t> {epoch(date)} +0000\n".encode()
                    + b"data %d\n%s\n" % (len(msg), msg)
                    + (f"from refs/heads/{branche}^0\n".encode() if k == 0 else b"")
                    + b"M 100644 inline src/a.ts\ndata %d\n%s\n" % (len(contenu), contenu))
    git(depot, "fast-import", "--quiet", entree=b"".join(flux))


class Monde(unittest.TestCase):
    """Racine jetable + site S (main) + UI U (master, ui src) + V (ui []) + marketing M."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory(prefix="t022-")
        t = Path(self._tmp.name)
        self.R, self.S, self.U, self.V, self.M = t / "agentx", t / "site", t / "ui", t / "back", t / "mkt"
        (self.R / "bin").mkdir(parents=True)
        for f in BIN.glob("*.py"):
            shutil.copy2(f, self.R / "bin" / f.name)
        shutil.copytree(DEPOT / "vault" / "_templates", self.R / "vault" / "_templates")
        (self.R / "vault" / "projets").mkdir()
        if (DEPOT / "roles.json").exists():
            shutil.copy2(DEPOT / "roles.json", self.R / "roles.json")
        for d, b in ((self.S, "main"), (self.U, "master"), (self.V, "master")):
            d.mkdir()
            git(d, "init", "-q", "-b", b)
        commit(self.U, "2026-01-01T10:00:00+02:00", "init ui", {"src/a.ts": "a"})
        commit(self.V, "2026-03-01T10:00:00+02:00", "feat: back récent", {"api.py": "x"})
        self.M.mkdir()
        self.calendrier("# Calendrier\n- [x] Kora publié\n- [ ] Geolens à faire\n")
        self.ecrire_registre()

    def tearDown(self):
        self._tmp.cleanup()

    # --- monde

    def registre(self) -> dict:
        def p(cle, couleur, **sur):
            d = {"cle": cle, "nom": cle.capitalize(), "sous": "s", "couleur": couleur, "entreprise": False,
                 "etat": "actif", "env": "", "depots": [], "site": None, "marketing": None, "sources": []}
            d.update(sur)
            return d
        site = {"depot": str(self.S), "branche": "main", "pages": ["p/index.tsx"],
                "textes": ["t/*/Kora.ts"], "captures": ["c/*.webp"]}
        return {"version": 1, "produits": [
            p("kora", "#000001", depots=[{"chemin": str(self.U), "branche_publication": "master", "ui": ["src"]},
                                         {"chemin": str(self.V), "branche_publication": "master", "ui": []}],
              site=site, marketing={"vault": str(self.M), "calendriers": ["cal.md"], "motifs": ["Kora", "KoraApp"]}),
            p("agentx", "#000002", depots=[{"chemin": str(self.U), "branche_publication": "master", "ui": ["src"]}]),
            p("casse", "#000003", site=dict(site, depot=str(self.S / "absent"))),
            p("seagle", "#000004", entreprise=True)]}

    def ecrire_registre(self, brut=None) -> None:
        (self.R / "produits.json").write_text(json.dumps(brut or self.registre()), encoding="utf-8")

    def calendrier(self, texte: str) -> None:
        (self.M / "cal.md").write_text(texte, encoding="utf-8")

    def site_complet(self, date="2026-01-05T10:00:00+02:00") -> str:
        return commit(self.S, date, "site", {"p/index.tsx": "p", "t/fr/Kora.ts": "t", "c/k1.webp": "c"})

    def publier(self, *argv: str) -> tuple[int, str, str]:
        r = subprocess.run([sys.executable, str(self.R / "bin" / "publier.py"), *argv], env=ENV,
                           capture_output=True, encoding="utf-8", timeout=60)
        return r.returncode, r.stdout, r.stderr

    def json(self, *argv: str, code: int) -> dict:
        rc, out, err = self.publier("kora", "--json", *argv)
        self.assertEqual(rc, code, err + out)
        return json.loads(out)

    @staticmethod
    def ecart(r: dict, type_: str) -> dict:
        trouves = [e for e in r["ecarts"] if e["type"] == type_]
        assert len(trouves) == 1, r["ecarts"]
        return trouves[0]

    @staticmethod
    def statuts(r: dict) -> dict:
        return {c["id"]: c["statut"] for c in r["controles"]}


class Verdicts(Monde):
    def test_go_site_a_jour(self):
        self.site_complet()
        r = self.json(code=0)
        self.assertEqual(r["verdict"], "GO")
        self.assertEqual(r["ecarts"], [])
        self.assertEqual(self.statuts(r), dict.fromkeys(["P0", "P1", "P2", "P3", "P4", "P5"], "ok"))
        self.assertEqual(r["taches_creees"], [])
        rc, out, _ = self.publier("kora")
        self.assertEqual((rc, out), (0, "GO kora\n"))

    def test_p1_site_hors_branche(self):
        self.site_complet()
        git(self.S, "checkout", "-q", "-b", "travail")
        commit(self.S, "2026-01-06T10:00:00+02:00", "maj texte Kora", {"t/fr/Kora.ts": "t2"})
        head = commit(self.S, "2026-01-07T10:00:00+02:00", "readme", {"README.md": "r"})
        avant = git(self.S, "status", "--porcelain") + git(self.S, "for-each-ref")
        r = self.json(code=1)
        e = self.ecart(r, "site-branche")
        self.assertEqual(e["id"], f"site-branche:kora:{head}")
        self.assertEqual((e["gravite"], e["role"], e["acquitte"]), ("bloquant", "devops", False))
        self.assertEqual(e["titre"], "1 commits du site hors main touchent Kora")
        self.assertEqual(len(e["preuves"]), 1)
        self.assertRegex(e["preuves"][0], r"^[0-9a-f]{7,} 2026-01-06 maj texte Kora$")
        self.assertEqual(self.statuts(r)["P1"], "ecart")
        self.assertEqual(r["verdict"], "NO-GO")
        self.assertEqual(git(self.S, "status", "--porcelain") + git(self.S, "for-each-ref"), avant)
        rc, out, _ = self.publier("kora")
        self.assertEqual(rc, 1)
        self.assertEqual(out.splitlines()[:2], ["NO-GO kora", f"[bloquant] site-branche:kora:{head} — "
                                                              "1 commits du site hors main touchent Kora"])

    def test_p2_captures_absentes(self):
        commit(self.S, "2026-01-05T10:00:00+02:00", "site", {"p/index.tsx": "p", "t/fr/Kora.ts": "t"})
        (self.S / "c").mkdir()
        (self.S / "c" / "k1.webp").write_text("non commitée")
        r = self.json(code=1)
        e = self.ecart(r, "site-branche")
        self.assertEqual(e["titre"], "captures absentes de main")
        self.assertEqual(e["preuves"], ["main T_txt=2026-01-05T10:00:00+02:00 T_cap=∅"])
        self.assertEqual(self.statuts(r)["P2"], "ecart")
        self.assertEqual(self.statuts(r)["P4"], "erreur")

    def test_p2_pages_et_textes_absents(self):
        commit(self.S, "2026-01-05T10:00:00+02:00", "captures", {"c/k1.webp": "c"})
        for f in ("p/index.tsx", "t/fr/Kora.ts"):
            (self.S / f).parent.mkdir(parents=True)
            (self.S / f).write_text("non commité")
        r = self.json(code=1)
        e = self.ecart(r, "site-branche")
        self.assertEqual(e["titre"], "pages et textes absents de main")
        self.assertEqual(self.statuts(r)["P3"], "erreur")

    def test_p3_sans_troncature(self):
        self.site_complet()
        sujets = ["feat: a", "ajout b", "ajoute c", "Feat(ui): d", "nouveau e", "new f", "FEAT g"]
        sujets += [f"fix: correctif {k}" for k in range(243)]
        rafale(self.U, "master", [(f"2026-02-01T{k // 60:02d}:{k % 60:02d}:00+02:00", s)
                                  for k, s in enumerate(sujets)])
        r = self.json(code=1)
        e = self.ecart(r, "textes")
        self.assertEqual(e["titre"], "250 commits de ui dont 7 feat depuis les textes du site (2026-01-05) : "
                                     "à vérifier par un agent")
        self.assertEqual((e["gravite"], e["role"]), ("bloquant", "marketing"))
        self.assertEqual([p.split(" ", 2)[2] for p in e["preuves"]], sujets[6::-1])
        self.assertEqual(e["id"], f"textes:kora:{e['preuves'][0].split()[0]}")
        a = self.ecart(r, "commits")
        self.assertEqual(a["titre"], "243 autres commits UI de ui depuis 2026-01-05")
        self.assertEqual((a["gravite"], a["role"]), ("avertissement", ""))
        self.assertEqual(len(a["preuves"]), 21)
        self.assertEqual(a["preuves"][-1], "… 223 autres")
        self.assertEqual(self.statuts(r)["P3"], "ecart")

    def test_re_feat(self):
        self.site_complet()
        commit(self.U, "2026-01-04T10:00:00+02:00", "feat: avant les textes", {"src/a.ts": "0"})
        sujets = ["feat: a", "ajout b", "ajoute c", "FEAT d", "fix e", "ajouts f", "featuring g", "refeat h",
                  "chore: feat i", "nouveautés j"]
        for k, s in enumerate(sujets):
            commit(self.U, f"2026-01-{10 + k}T10:00:00+02:00", s, {"src/a.ts": f"r{k}"})
        commit(self.U, "2026-01-25T10:00:00+02:00", "feat: hors ui", {"README.md": "r"})
        r = self.json(code=1)
        sujet = lambda l: l.split(" ", 2)[2]
        self.assertEqual([sujet(l) for l in self.ecart(r, "textes")["preuves"]], sujets[3::-1])
        self.assertEqual([sujet(l) for l in self.ecart(r, "commits")["preuves"]], sujets[:3:-1])

    def test_p4_captures_anterieures_ui(self):
        commit(self.S, "2026-01-02T10:00:00+02:00", "captures", {"c/k1.webp": "c"})
        commit(self.U, "2026-01-03T10:00:00+02:00", "fix: bouton", {"src/a.ts": "b"})
        commit(self.S, "2026-01-04T10:00:00+02:00", "textes", {"p/index.tsx": "p", "t/fr/Kora.ts": "t"})
        r = self.json(code=1)
        self.assertEqual([e["type"] for e in r["ecarts"]], ["captures"])
        e = r["ecarts"][0]
        self.assertEqual(e["id"], "captures:kora:2026-01-03")
        self.assertEqual((e["gravite"], e["role"]), ("bloquant", "designer"))
        self.assertEqual(e["titre"], "captures du site (2026-01-02) antérieures à l'UI (2026-01-03)")
        self.assertEqual(e["preuves"], [f"T_cap 2026-01-02T10:00:00+02:00 {self.S} main",
                                        f"T_ui 2026-01-03T10:00:00+02:00 {self.U}"])
        self.assertEqual(self.statuts(r)["P4"], "ecart")

    def test_p5_calendrier_ouvert(self):
        self.site_complet()
        ouvertes = ["- [ ] Post kora", "Relance KoraApp TODO", "Article Kora à relire"]
        self.calendrier("\n".join(["# Cal", "- [x] Kora publié", "- [ ] Geolens à faire", ouvertes[0],
                                   ouvertes[1], ouvertes[0], ouvertes[2]]) + "\n")
        r = self.json(code=1)
        ids = [f"marketing:{hashlib.sha1(('cal.md' + l).encode()).hexdigest()[:8]}" for l in ouvertes]
        self.assertEqual([e["id"] for e in r["ecarts"]], ids)
        self.assertEqual({(e["gravite"], e["role"]) for e in r["ecarts"]}, {("bloquant", "marketing")})
        self.assertEqual(r["ecarts"][0]["titre"], "cal.md:4 ouvert : - [ ] Post kora")
        self.assertEqual(r["ecarts"][0]["preuves"], ["cal.md:4: - [ ] Post kora"])
        self.assertEqual(self.statuts(r)["P5"], "ecart")


class Acquits(Monde):
    def hors_branche(self, date: str) -> str:
        return commit(self.S, date, f"maj {date}", {"t/fr/Kora.ts": date})

    def test_acquit_rend_go_puis_expire(self):
        self.site_complet()
        git(self.S, "checkout", "-q", "-b", "travail")
        h1 = self.hors_branche("2026-01-06T10:00:00+02:00")
        r = self.json("--acquitter", f"site-branche:kora:{h1}", "--motif", "vu en revue", code=0)
        self.assertEqual(r["verdict"], "GO")
        self.assertTrue(self.ecart(r, "site-branche")["acquitte"])
        acquits = (self.R / "vault" / "projets" / "publication-kora" / "acquits.md").read_text()
        self.assertRegex(acquits, rf"(?m)^- \d{{4}}-\d{{2}}-\d{{2}} `site-branche:kora:{h1}` — vu en revue$")
        h2 = self.hors_branche("2026-01-07T10:00:00+02:00")
        r = self.json(code=1)
        e = self.ecart(r, "site-branche")
        self.assertEqual((e["id"], e["acquitte"]), (f"site-branche:kora:{h2}", False))

    def test_controle_en_erreur_nogo_meme_tout_acquitte(self):
        commit(self.S, "2026-01-05T10:00:00+02:00", "captures", {"c/k1.webp": "c"})
        for f in ("p/index.tsx", "t/fr/Kora.ts"):
            (self.S / f).parent.mkdir(parents=True)
            (self.S / f).write_text("non commité")
        id_ = self.ecart(self.json(code=1), "site-branche")["id"]
        r = self.json("--acquitter", id_, "--motif", "vu", code=1)
        self.assertEqual(r["verdict"], "NO-GO")
        self.assertTrue(all(e["acquitte"] for e in r["ecarts"] if e["gravite"] == "bloquant"), r["ecarts"])
        self.assertIn("erreur", self.statuts(r).values())


class Taches(Monde):
    def test_taches_idempotent(self):
        self.site_complet()
        git(self.S, "checkout", "-q", "-b", "travail")
        commit(self.S, "2026-01-06T10:00:00+02:00", "maj", {"t/fr/Kora.ts": "t2"})
        self.calendrier("- [ ] Post Kora\n")
        r1 = self.json("--taches", code=1)
        self.assertEqual(len(r1["taches_creees"]), 2, r1)
        self.assertEqual([e["tache"] for e in r1["ecarts"]], r1["taches_creees"])
        proj = self.R / "vault" / "projets" / "publication-kora"
        packs = sorted(proj.glob("taches/*/context.md"))
        self.assertEqual(len(packs), 2)
        ids = sorted(e["id"] for e in r1["ecarts"])
        self.assertEqual(sorted(i for i in ids if any(f"`{i}`" in p.read_text() for p in packs)), ids)
        r2 = self.json("--taches", code=1)
        self.assertEqual(r2["taches_creees"], [])
        self.assertEqual([e["tache"] for e in r2["ecarts"]], r1["taches_creees"])
        self.assertEqual(len(list(proj.glob("taches/*/context.md"))), 2)

    def test_taches_sans_bloquant_rien(self):
        self.site_complet()
        r = self.json("--taches", code=0)
        self.assertEqual(r["taches_creees"], [])
        self.assertFalse((self.R / "vault" / "projets" / "publication-kora").exists())


class Codes(Monde):
    def code(self, *argv: str) -> int:
        rc, out, err = self.publier(*argv)
        if rc in (2, 3):
            self.assertEqual(out, "")
            self.assertTrue(err.startswith("publier: erreur: "), err)
        return rc

    def test_usage_2(self):
        self.site_complet()
        self.assertEqual(self.code("zz"), 2)
        self.assertEqual(self.code("seagle"), 2)
        self.assertEqual(self.code("agentx"), 2)
        self.assertEqual(self.code("kora", "--motif", "x"), 2)
        self.assertEqual(self.code("kora", "--acquitter", "site-branche:kora:0000000", "--motif", "x"), 2)
        self.assertEqual(self.code("kora", "--acquitter", "x", "--motif", ""), 2)
        self.assertFalse((self.R / "vault" / "projets" / "publication-kora").exists())

    def test_registre_3(self):
        self.site_complet()
        self.assertEqual(self.code("casse"), 3)
        self.ecrire_registre({"version": 1, "produits": []})
        self.assertEqual(self.code("kora"), 3)
        (self.R / "produits.json").unlink()
        self.assertEqual(self.code("kora"), 3)

    def test_go_0_nogo_1(self):
        self.site_complet()
        self.assertEqual(self.code("kora"), 0)
        self.calendrier("TODO Kora\n")
        self.assertEqual(self.code("kora"), 1)


if __name__ == "__main__":
    unittest.main()
