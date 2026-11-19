"""Tests propriété des tâches via le CLI vx (identite §2 §3) : préfixe, chef posé, refus, reprendre.

Lancer : python3 -m unittest bin/test_vx_propriete.py
Banc jetable .cache/banc-propriete/b<pid> (AGENTX_ROOT) : le vrai vault n'est jamais touché.
Machines simulées par AGENTX_MACHINE : pc-a = MAR, pc-b = SYL.
"""

import os
import re
import shutil
import subprocess
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
BANC = DEPOT / ".cache" / "banc-propriete" / f"b{os.getpid()}"
PROJ = BANC / "vault" / "projets" / "banc"
CHEFS = BANC / "vault" / "chefs"


def setUpModule():
    (BANC / "bin").mkdir(parents=True)
    for f in ("vx.py", "roles.py", "environnement.py", "produits.py", "chemins.py", "frontmatter.py", "agents.py", "terminal.py",
              "voix.py", "demandes.py", "tid.py", "identite.py", "partage.py", "personne.py", "trello.py"):
        shutil.copy(ICI / f, BANC / "bin" / f)
    shutil.copy(DEPOT / "roles.json", BANC / "roles.json")
    (BANC / "vault" / "_templates").mkdir(parents=True)
    for f in ("task.md", "context.md"):
        shutil.copy(DEPOT / "vault" / "_templates" / f, BANC / "vault" / "_templates" / f)
    PROJ.mkdir(parents=True)
    CHEFS.mkdir(parents=True)
    (CHEFS / "SYL.md").write_text("---\nprefixe: SYL\nmachine: pc-b\ncree: 2026-11-17\ntags: [chef]\n---\n",
                                  encoding="utf-8")


def tearDownModule():
    shutil.rmtree(BANC)



def lire_journal() -> str:
    """Journal du banc via partage (ancien journal.md + journal/<ABC>.md) ; partage du banc : ROOT = BANC."""
    sys.path.insert(0, str(BANC / "bin"))
    import partage
    return "\n".join(partage.lire_journal(PROJ))

def vx(*args: str, chef: str | None = None, machine: str = "pc-a") -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items() if k not in ("AGENTX_CHEF", "AGENTX_ROOT")}
    env.update(AGENTX_MACHINE=machine, AGENTX_ROOT=str(BANC), **({"AGENTX_CHEF": chef} if chef else {}))
    return subprocess.run([sys.executable, str(BANC / "bin" / "vx.py"), *args],
                          capture_output=True, text=True, cwd=str(BANC), env=env)


def creer(chef: str | None = "marianne", *extra: str) -> str:
    r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", *extra, chef=chef)
    assert r.returncode == 0, r.stderr
    return r.stdout.split()[0]


def dossier(tid: str) -> Path:
    return next((PROJ / "taches").glob(f"{tid}-*"))


def task(tid: str) -> str:
    return (dossier(tid) / "task.md").read_text(encoding="utf-8")


def poser(tid: str, cle: str, val: str):
    f = dossier(tid) / "task.md"
    texte = task(tid)
    texte = re.sub(rf"(?m)^{cle}: .*$", f"{cle}: {val}", texte) if re.search(rf"(?m)^{cle}: ", texte) \
        else texte.replace("\n---\n", f"\n{cle}: {val}\n---\n", 1)
    f.write_text(texte, encoding="utf-8")


def battement(cle: str, vu: datetime, etat: str = "vivant"):
    (CHEFS / "MAR").mkdir(exist_ok=True)
    (CHEFS / "MAR" / f"{cle}.md").write_text(f"---\nchef: {cle}@MAR\nvu: {vu.isoformat(timespec='seconds')}\n"
                                             f"etat: {etat}\n---\n", encoding="utf-8")


def refus(tid: str, proprio: str, signe: str, action: str, qui: str) -> str:
    return (f"vx: erreur: refus : {tid} appartient au chef {proprio} ({signe}) — {action} refusé depuis {qui} ; "
            f"reprise si arrêté > 2 h : ./bin/agentx reprendre {tid} --projet banc --raison \"<…>\"\n")


class A_Prefixe(unittest.TestCase):
    """Préfixe déclaré par le CLI ; les autres classes en dépendent (ordre alphabétique des classes)."""

    def test_declarer_et_lire(self):
        r = vx("prefixe", "MAR")
        self.assertEqual((r.returncode, r.stdout), (0, "MAR  vault/chefs/MAR.md (machine pc-a)\n"), r.stderr)
        self.assertEqual(vx("prefixe").stdout, "MAR\n")
        self.assertEqual(vx("prefixe", machine="pc-b").stdout, "SYL\n")
        self.assertEqual(vx("prefixe", machine="pc-z").stdout, "∅ (mode ancien)\n")
        r = vx("prefixe", "SYL")
        self.assertEqual((r.returncode, r.stderr), (3, "vx: erreur: refus : préfixe SYL déjà pris par la machine pc-b\n"))
        r = vx("prefixe", "ABC")
        self.assertEqual((r.returncode, r.stderr), (3, "vx: erreur: refus : la machine pc-a a déjà le préfixe MAR\n"))
        r = vx("prefixe", "abc", machine="pc-z")
        self.assertEqual((r.returncode, r.stderr), (3, "vx: erreur: refus : préfixe abc invalide (3 lettres A-Z)\n"))


class B_Creation(unittest.TestCase):
    def test_tid_prefixe_et_chef(self):
        tid = creer("marianne")
        self.assertRegex(tid, r"^MAR-T\d{3}$")
        self.assertIn("\nchef: marianne@MAR\n", task(tid))
        self.assertIn(f"{tid}-banc", dossier(tid).name)

    def test_humain_chef_defaut(self):
        self.assertIn("\nchef: defaut@MAR\n", task(creer(None)))

    def test_premier_id_prefixe_T001(self):
        ids = sorted(d.name.split("-banc")[0] for d in (PROJ / "taches").iterdir() if d.name.startswith("MAR-"))
        self.assertIn("MAR-T001", ids)

    def test_autre_machine_son_prefixe(self):
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", machine="pc-b")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertRegex(r.stdout, r"^SYL-T\d{3} ")

    def test_machine_sans_prefixe_requis(self):
        r = vx("tache", "banc", "--projet", "banc", "--role", "implementeur", machine="pc-z")
        self.assertEqual((r.returncode, r.stderr), (3, "vx: erreur: refus : machine pc-z sans préfixe alors que MAR, "
                                                       "SYL en ont un — ./bin/agentx prefixe <ABC>\n"))

    def test_enfant_chef_du_parent(self):
        tid = creer("marianne", "--verif")
        r = vx("set", tid, "--statut", "pret", "--force", "--projet", "banc")   # humain de la machine
        self.assertEqual(r.returncode, 0, r.stderr)
        cid = re.search(r"\+ (\S+) verificateur", r.stdout)[1]
        self.assertRegex(cid, r"^MAR-T\d{3}$")
        self.assertIn("\nchef: marianne@MAR\n", task(cid))

    def test_enfant_de_tache_libre_libre(self):
        tid = creer("marianne", "--verif")
        f = dossier(tid) / "task.md"
        f.write_text(re.sub(r"(?m)^chef: .*\n", "", task(tid)), encoding="utf-8")
        r = vx("set", tid, "--statut", "pret", "--force", "--projet", "banc", chef="bob")
        self.assertEqual(r.returncode, 0, r.stderr)
        cid = re.search(r"\+ (\S+) verificateur", r.stdout)[1]
        self.assertNotIn("\nchef:", task(cid))


class C_Refus(unittest.TestCase):
    def setUp(self):
        self.tid = creer("marianne")
        (dossier(self.tid) / "result.md").write_text("---\nstatut: bloque\n---\n", encoding="utf-8")
        self.avant = {f.name: f.read_text(encoding="utf-8") for f in dossier(self.tid).iterdir()}

    def assertIntact(self):
        self.assertEqual({f.name: f.read_text(encoding="utf-8") for f in dossier(self.tid).iterdir()}, self.avant)

    ACTIONS = {"set": ("--statut", "bloque"), "virer": ("--motif", "x"), "retenir": ("--sans-eval",),
               "repondre": ("--texte", "x"), "renoncer": ("--raison", "x")}

    def test_autre_chef_refuse(self):
        for action, extra in self.ACTIONS.items():
            with self.subTest(action):
                r = vx(action, self.tid, "--projet", "banc", *extra, chef="bob")
                self.assertEqual((r.returncode, r.stderr),
                                 (3, refus(self.tid, "marianne@MAR", "jamais vu", action, "bob@MAR")))
                self.assertIntact()

    def test_autre_machine_refuse(self):
        tid = creer("gina")
        battement("gina", datetime(2026, 11, 17, 9, 5), "arrete")
        avant = task(tid)
        r = vx("set", tid, "--statut", "bloque", "--projet", "banc", machine="pc-b")
        self.assertEqual((r.returncode, r.stderr),
                         (3, refus(tid, "gina@MAR", "arrêté 2026-11-17 09:05", "set", "humain@SYL")))
        self.assertEqual(task(tid), avant)

    def test_set_dep_refuse(self):
        r = vx("set", self.tid, "--dep", self.tid, "--projet", "banc", chef="bob")
        self.assertEqual((r.returncode, r.stderr), (3, refus(self.tid, "marianne@MAR", "jamais vu", "set", "bob@MAR")))
        self.assertIntact()

    def test_humain_de_la_machine_autorise(self):
        r = vx("set", self.tid, "--statut", "bloque", "--projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("\nstatut: bloque\n", task(self.tid))

    def test_proprio_autorise(self):
        poser(self.tid, "statut", "en-cours")
        r = vx("repondre", self.tid, "--projet", "banc", "--texte", "oui", chef="marianne")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("\nreponses: 1\n", task(self.tid))

    def test_tache_ancienne_libre(self):
        f = dossier(self.tid) / "task.md"
        f.write_text(re.sub(r"(?m)^chef: .*\n", "", task(self.tid)), encoding="utf-8")
        r = vx("set", self.tid, "--statut", "bloque", "--projet", "banc", chef="bob", machine="pc-b")
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_retenir_evaluateur_d_un_autre_chef_refuse(self):
        poser(self.tid, "statut", "revue")
        r = vx("tache", "eval", "--projet", "banc", "--role", "evaluateur", "--dep", self.tid, chef="bob")
        self.assertEqual(r.returncode, 0, r.stderr)
        e = r.stdout.split()[0]
        poser(e, "statut", "en-cours")
        (dossier(e) / "result.md").write_text("---\nstatut: fait\n---\n", encoding="utf-8")
        eval_avant = task(e)
        r = vx("retenir", self.tid, "--projet", "banc", chef="marianne")
        self.assertEqual((r.returncode, r.stderr), (3, refus(e, "bob@MAR", "jamais vu", "retenir", "marianne@MAR")))
        self.assertEqual(task(e), eval_avant)
        self.assertIn("\nstatut: revue\n", task(self.tid))


class D_Reprendre(unittest.TestCase):
    def reprendre(self, tid: str, chef: str | None = "bob", raison: str = "chef parti"):
        return vx("reprendre", tid, "--projet", "banc", "--raison", raison, chef=chef)

    def test_inutile(self):
        tid = creer("marianne")
        r = self.reprendre(tid, chef="marianne")
        self.assertEqual((r.returncode, r.stderr), (3, f"vx: erreur: {tid} : déjà à marianne@MAR ou libre — rien à reprendre\n"))
        f = dossier(tid) / "task.md"
        f.write_text(re.sub(r"(?m)^chef: .*\n", "", task(tid)), encoding="utf-8")
        self.assertEqual(self.reprendre(tid).stderr, f"vx: erreur: {tid} : déjà à bob@MAR ou libre — rien à reprendre\n")

    def test_trop_tot(self):
        tid = creer("alice")
        vu = datetime.now().replace(microsecond=0) - timedelta(minutes=10)
        battement("alice", vu, "arrete")
        avant = task(tid)
        r = self.reprendre(tid)
        apres = vu + timedelta(hours=2)
        self.assertEqual((r.returncode, r.stderr), (3, f"vx: erreur: refus : chef alice@MAR vu {vu:%H:%M} (< 2 h) — "
                                                       f"reprise de {tid} possible après {apres:%H:%M}\n"))
        self.assertEqual(task(tid), avant)

    def test_ok_trace(self):
        tid = creer("carla")
        vu = datetime.now().replace(microsecond=0) - timedelta(hours=3)
        battement("carla", vu, "arrete")
        r = self.reprendre(tid, raison="carla absente")
        self.assertEqual((r.returncode, r.stdout), (0, f"{tid} : chef carla@MAR → bob@MAR (arrêté {vu:%Y-%m-%d %H:%M})\n"),
                         r.stderr)
        t = task(tid)
        for ligne in ("chef: bob@MAR", "repris_de: carla@MAR", "repris_raison: carla absente"):
            self.assertIn(f"\n{ligne}\n", t)
        self.assertRegex(t, r"\nrepris: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\n")
        self.assertIn(f"{tid} reprise carla@MAR → bob@MAR (carla absente)",
                      lire_journal())
        r = vx("set", tid, "--statut", "bloque", "--projet", "banc", chef="bob")
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_jamais_vu_reprenable(self):
        tid = creer("dora")
        r = self.reprendre(tid)
        self.assertEqual((r.returncode, r.stdout), (0, f"{tid} : chef dora@MAR → bob@MAR (jamais vu)\n"), r.stderr)

    def test_machine_sans_prefixe(self):
        tid = creer("erin")
        r = vx("reprendre", tid, "--projet", "banc", "--raison", "x", chef="bob", machine="pc-z")
        self.assertEqual((r.returncode, r.stderr), (3, "vx: erreur: refus : machine pc-z sans préfixe alors que MAR, "
                                                       "SYL en ont un — ./bin/agentx prefixe <ABC>\n"))

    def test_raison_hors_bornes(self):
        tid = creer("fred")
        for raison in ("   ", "x" * 201):
            with self.subTest(len(raison)):
                self.assertNotEqual(self.reprendre(tid, raison=raison).returncode, 0)
        self.assertIn("\nchef: fred@MAR\n", task(tid))


class E_Virer(unittest.TestCase):
    def test_remplacante_prefixee_chef_appelant(self):
        tid = creer("marianne")
        poser(tid, "statut", "en-cours")
        r = vx("virer", tid, "--motif", "rate", "--projet", "banc")   # humain de la machine
        self.assertEqual(r.returncode, 0, r.stderr)
        n = r.stdout.splitlines()[1].split()[0]
        self.assertRegex(n, r"^MAR-T\d{3}$")
        self.assertIn("\nchef: defaut@MAR\n", task(n))
        self.assertIn(f"\nremplace: {tid}\n", task(n))
        self.assertIn("\nstatut: rejete\n", task(tid))

    def test_board_colonne_chef(self):
        tid = creer("marianne")
        r = vx("board", "--projet", "banc")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertRegex(r.stdout, r"DEPS +CHEF +TITRE")
        self.assertRegex(r.stdout, rf"{tid} .* marianne@MAR +banc")


if __name__ == "__main__":
    unittest.main()
