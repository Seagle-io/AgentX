"""terminal — une session Claude Code dans la salle, via un pseudo-terminal.

Pas un shell : le seul programme lancé est `claude`, dans la racine d'AgentX,
pour que /projet, /pack, /dispatch et /clore soient disponibles depuis le
navigateur. Le flux sortant part en SSE, l'entrée arrive en POST.

    - une session par chef, 3 chefs vivants au plus (la salle est un poste, pas un serveur) ;
    - mémoire tampon de 256 Ko pour rejouer l'écran à la reconnexion ;
    - zéro dépendance : pty + threads de la bibliothèque standard.
"""

from __future__ import annotations

import argparse
import contextlib
import fcntl
import os
import re
import signal
import struct
import termios
import threading
import time
from typing import Literal, TypedDict

CLE_MAX = 24  # longueur max d'une clé de chef ; servi au front (motifs.cle_max)
RE_CLE = re.compile(rf"[a-z0-9][a-z0-9-]{{0,{CLE_MAX - 1}}}")
DEFAUT = "defaut"
CHEFS_MAX = 3
VERROU = "agentx-chefs.lock"                       # dans le dossier ETAT, flock exclusif
LIBELLES = "agentx-chefs-libelles.json"            # dossier ETAT, à côté de VERROU : {"version": 1, "libelles": {cle: libellé}}
LIBELLE_MAX = 32
_HTTP_RC = {"plafond": (409, 3), "etage-tenu": (409, 3), "cle-prise": (409, 3), "cle-invalide": (400, 2),
            "etage-inconnu": (400, 2), "chef-inconnu": (404, 2), "compte-invalide": (400, 2),
            "compte-inconnu": (404, 2), "compte-deconnecte": (409, 3), "compte-fige": (409, 3),
            "chef-mort": (409, 3), "compte-connecte": (409, 3), "login-en-cours": (409, 3), "login-absent": (404, 2),
            "libelle-invalide": (400, 2)}


class ChefRefus(Exception):
    """Refus métier (multi-chefs § 2, env-par-compte § 6) ; str(exc) == message."""

    def __init__(self, code: str, http: int, rc: int, message: str):
        super().__init__(message)
        self.code, self.http, self.rc, self.message = code, http, rc, message


def _refus(code: str, message: str) -> ChefRefus:
    return ChefRefus(code, *_HTTP_RC[code], message)


def _verifier_compte(compte: str) -> None:
    import agents                  # import tardif : les bancs de test ne copient pas toujours agents.py
    try:
        agents.verifier_compte(compte)
    except agents.CompteErreur as exc:
        raise _refus(exc.code, str(exc)) from exc


# La session est le CHEF DE PROJET : elle charge la compétence au démarrage et
# se présente comme tel, sans que l'utilisateur ait à taper /projet.
_IDENT_DEFAUT = (
    "Tu es le CHEF DE PROJET AgentX par défaut : la salle montre un étage par projet ouvert, tu es au dernier étage "
    "et tu pilotes chaque étage qui n'a pas de chef dédié. `./bin/agentx chef liste` dit quels étages sont tenus "
    "par un autre chef : tu n'y dispatches rien et tu n'y écris rien. "
    "Avant toute autre chose, charge la compétence `chef-de-projet` avec l'outil Skill et lis `vault/INDEX.md`, "
    "puis `./bin/agentx chef liste` et l'état de tous les étages (`./bin/agentx board`, sans --projet). "
)
_IDENT_DEDIE = (
    "Tu es le CHEF DE PROJET AgentX « {cle} », seul chef de tes étages : {liste}. D'autres chefs pilotent les autres "
    "étages : tu n'y lis, n'écris ni ne dispatches rien. "
    "Avant toute autre chose, charge la compétence `chef-de-projet` avec l'outil Skill, lis `vault/INDEX.md` "
    "puis l'état de tes étages ({cmds}). "
)
_AFFECTATION = (
    "L'affectation des étages peut changer pendant ta session : `./bin/agentx chef liste` avant chaque dispatch ; "
    "un dispatch sur un étage tenu par un autre chef est refusé."
)
_CORPS = (
    "Présente-toi en une ligne, résume en une ligne les étages actifs (bloqués et revues d'abord). "
    "Lis `vault/projets/<slug>/todo.md` de chaque étage ouvert : exécute d'abord les lignes `URGENT`, puis la vague suivante "
    "inscrite dans la todo ; un étage `A CLORE` sans tâche ouverte se clôt d'office (`/clore <slug>`), en prévenant l'humain en une ligne. "
    "Ne pose jamais de question bloquante : tranche, continue, et mets l'humain en garde en une ligne (« j'ai supposé X, dites-moi si c'est faux »). "
    "Seuls une dépense, une action irréversible ou un choix produit se posent en `- [ ] ? …` dans todo.md, sans arrêter le travail qui n'en dépend pas. "
    "Tu n'écris jamais de code toi-même : "
    "tu cadres, tu découpes, tu rédiges des packs et tu dispatches les agents. "
    "Plusieurs étages vivent en même temps : chaque commande `./bin/agentx` qui vise un projet porte "
    "`--projet <slug>` explicite, et chaque prompt de dispatch nomme le projet. "
    "`./bin/agentx --projet <slug>` n'épingle que l'étage ouvert par défaut dans la salle. "
    "Chaque agent reçoit un pack = le contexte MINIMUM SUFFISANT pour sa tâche, au périmètre "
    "délimité strictement : whitelist ≤ 12 fichiers avec droits E/L, contrats recopiés, hors-périmètre "
    "explicite, DoD vérifiable. Jamais « va lire le brief ». Si un agent devrait ouvrir autre chose, "
    "le pack est raté : tu le corriges. Un pack trop large se découpe en plusieurs tâches. "
    "La salle des agents n'affiche QUE ce qui est dans le vault : avant tout dispatch (`./bin/agentx dispatch`), la tâche "
    "existe (`./bin/agentx tache ...`), son pack context.md est écrit et validé (pack-lint), "
    "`dispatch` la passe en `en-cours`, et à la fin `fait`/`bloque` avec result.md. "
    "Un agent lancé sans tâche dans le vault est invisible et interdit. "
    "Les agents tournent détachés : une interruption ne les coupe pas ; `./bin/agentx dispatch --etat` dit qui vit. "
    "Les producteurs (implementeur, testeur, designer, devops, juriste, tresorier, produit, marketing, rssi) livrent en `revue` : tu crées une tâche "
    "evaluateur (`--dep`), puis `./bin/agentx retenir <TID>` ou `./bin/agentx virer <TID> --motif \"...\"` "
    "(la remplaçante naît ; corrige son pack, motif recopié, avant de redispatcher). "
    "Second renvoi sur la même tâche : `--modele opus`. `./bin/agentx personnel` : taux de renvoi ≥ 50 % "
    "d'un rôle ⇒ revois son pack type. "
    "Reprendre une tâche (DÉFAUTS, BLQ, pack amendé) = `virer` puis remplaçante ; jamais relancer ni re-messager un agent avec un pack modifié en place. "
    "Session courte : une par vague ou par projet ; au-delà de ~150k de contexte ou après une pause > 1 h, "
    "lance toi-même `./bin/agentx passation --projet <slug>` (todo.md + journal.md écrits, chef neuf relancé par la passation auto) ; n'attends rien de l'humain. "
    "Avec l'humain tu parles français courant ; avec les agents (packs, prompts de dispatch) "
    "tu parles le langage dense de vault/_templates/LANGAGE.md. Réponds en français."
)
TAMPON_MAX = 256 * 1024


def consigne_chef(cle: str, etages: dict[str, list[str]]) -> str:
    """Consigne du chef par défaut (cle == DEFAUT) ou d'un chef dédié à `etages` (étage → projets)."""
    if cle == DEFAUT:
        return _IDENT_DEFAUT + _CORPS + " " + _AFFECTATION
    liste = "; ".join(f"{e} ({', '.join(p)})" for e, p in etages.items())
    cmds = ", ".join(f"`./bin/agentx board --projet {p}`" for p in dict.fromkeys(p for ps in etages.values() for p in ps))
    return _IDENT_DEDIE.format(cle=cle, liste=liste, cmds=cmds) + _CORPS + " " + _AFFECTATION


def programme(cle: str, etages: dict[str, list[str]]) -> list[str]:
    if cle == DEFAUT:
        invite = "Bonjour, je suis dans la salle des agents. Présente-toi et fais le point sur les étages de l'immeuble."
    else:
        invite = f"Bonjour, je suis dans la salle des agents. Présente-toi et fais le point sur tes étages : {', '.join(etages)}."
    return ["claude", "--append-system-prompt", consigne_chef(cle, etages), invite]


class Terminal:
    def __init__(self, cwd: str, cle: str = DEFAUT, etages: dict[str, list[str]] | None = None, compte: str = "defaut"):
        self.cwd = cwd
        self.cle = cle
        self.etages = etages or {}       # étage → projets (chef dédié)
        self.compte = compte
        self.depuis: str | None = None   # ISO s, dernier lancement de la session
        self.fd: int | None = None
        self.pid: int | None = None
        self.code: int | None = None
        self.tampon = bytearray()
        self.decale = 0                  # nb d'octets jetés en tête du tampon
        self.cond = threading.Condition()

    # ── cycle de vie ────────────────────────────────────────────────────
    def vivant(self) -> bool:
        return self.pid is not None and self.code is None

    def demarrer(self, cols: int = 120, rows: int = 32, compte: str | None = None) -> None:
        import agents                  # import tardif : les bancs de test ne copient pas toujours agents.py
        with self.cond:
            if self.vivant():
                if compte is not None and compte != self.compte:
                    raise _refus("compte-fige", f"refus : chef {self.cle} tourne sous le compte {self.compte} "
                                                "— arrête-le pour changer de compte")
                return
            _verifier_compte(compte or self.compte)
            self.compte = compte or self.compte
            self.tampon = bytearray()
            self.decale = 0
            self.code = None
        # la salle est souvent lancée depuis une session Claude Code : on
        # retire ses marqueurs, sinon la session enfant se croit imbriquée.
        base = {k: v for k, v in os.environ.items() if not k.startswith("CLAUDE_CODE_") and k != "CLAUDECODE"}
        env = agents.env_par_compte(self.compte, base) | {
            "TERM": "xterm-256color", "COLORTERM": "truecolor", "LANG": os.environ.get("LANG", "C.UTF-8"),
            "AGENTX_CHEF": self.cle}
        argv = programme(self.cle, self.etages)
        pid, fd = os.forkpty()
        if pid == 0:                       # enfant
            os.chdir(self.cwd)
            try:
                os.execvpe(argv[0], argv, env)
            except OSError as exc:
                os.write(2, f"\r\nimpossible de lancer {argv[0]} : {exc}\r\n".encode())
                os._exit(127)
        self.pid, self.fd = pid, fd
        self.depuis = time.strftime("%Y-%m-%dT%H:%M:%S")
        self.redimensionner(cols, rows)
        threading.Thread(target=self._lire, daemon=True).start()

    def arreter(self) -> None:
        if self.vivant() and self.pid:
            try:
                os.kill(self.pid, signal.SIGHUP)
            except ProcessLookupError:
                pass

    def _lire(self) -> None:
        fd, pid = self.fd, self.pid
        while True:
            try:
                bloc = os.read(fd, 65536)
            except OSError:
                bloc = b""
            if not bloc:
                break
            with self.cond:
                self.tampon += bloc
                if len(self.tampon) > TAMPON_MAX:
                    coupe = len(self.tampon) - TAMPON_MAX
                    del self.tampon[:coupe]
                    self.decale += coupe
                self.cond.notify_all()
        try:
            _, statut = os.waitpid(pid, 0)
            code = os.waitstatus_to_exitcode(statut)
        except ChildProcessError:
            code = -1
        try:
            os.close(fd)
        except OSError:
            pass
        with self.cond:
            self.code = code
            self.cond.notify_all()

    # ── entrées / sorties ───────────────────────────────────────────────
    def ecrire(self, donnees: bytes) -> None:
        if self.vivant() and self.fd is not None:
            os.write(self.fd, donnees)

    def redimensionner(self, cols: int, rows: int) -> None:
        if self.fd is None:
            return
        cols = max(20, min(int(cols), 400))
        rows = max(5, min(int(rows), 200))
        fcntl.ioctl(self.fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))

    def attendre(self, position: int, delai: float = 15.0) -> tuple[int, bytes, int | None]:
        """Rend (nouvelle position, octets depuis `position`, code de sortie ou None).

        `position` est absolue (compte les octets jetés) ; si elle est trop
        ancienne on reprend au début du tampon conservé.
        """
        fin = time.monotonic() + delai
        with self.cond:
            while True:
                debut = max(position, self.decale) - self.decale
                if debut < len(self.tampon) or self.code is not None:
                    bloc = bytes(self.tampon[debut:])
                    return self.decale + len(self.tampon), bloc, self.code
                reste = fin - time.monotonic()
                if reste <= 0:
                    return self.decale + len(self.tampon), b"", None
                self.cond.wait(reste)


# --------------------------------------------------------------------------- #
# demon detache : la session chef survit aux relances de la salle
#
# Le pseudo-terminal vit dans un processus a part (socket unix), que dash.py
# ne fait que piloter. Relancer dash.py ne tue donc plus le chef ni ses agents.
# Protocole : une ligne JSON par requete, une ligne JSON en reponse.
# --------------------------------------------------------------------------- #

import base64
import json
import socket
import subprocess
import sys


def _dossier_etat() -> str:
    etat = os.path.join(os.path.expanduser("~"), ".local", "state")
    os.makedirs(etat, exist_ok=True)
    return etat


def chemin_socket(cle: str = DEFAUT) -> str:
    return os.path.join(_dossier_etat(), "agentx-chef.sock" if cle == DEFAUT else f"agentx-chef-{cle}.sock")


def chemin_journal(cle: str = DEFAUT) -> str:
    return os.path.join(_dossier_etat(), "agentx-chef.log" if cle == DEFAUT else f"agentx-chef-{cle}.log")


def _chemin_socket(cwd: str) -> str:
    return chemin_socket(DEFAUT)


@contextlib.contextmanager
def _verrou():
    with open(os.path.join(_dossier_etat(), VERROU), "w") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        yield


def _servir(cwd: str, cle: str, etages: dict[str, list[str]], compte: str) -> None:
    term = Terminal(cwd, cle, etages, compte)
    chemin = chemin_socket(cle)
    if os.path.exists(chemin):
        os.unlink(chemin)
    srv = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    srv.bind(chemin)
    os.chmod(chemin, 0o600)
    srv.listen(16)
    inactif_depuis = [time.monotonic()]

    def traiter(req: dict) -> dict:
        op = req.get("op")
        if op == "open":
            term.demarrer(int(req.get("cols", 120)), int(req.get("rows", 32)), req.get("compte"))
            return {"vivant": term.vivant(), "pos": term.decale + len(term.tampon)}
        if op == "in":
            term.ecrire(base64.b64decode(req.get("b64", "")))
            return {"ok": True}
        if op == "resize":
            term.redimensionner(int(req.get("cols", 120)), int(req.get("rows", 32)))
            return {"ok": True}
        if op == "stop":
            term.arreter()
            return {"ok": True}
        if op == "etat":
            return {"vivant": term.vivant(), "code": term.code, "pos": term.decale + len(term.tampon),
                    "cle": cle, "etages": term.etages, "pid": term.pid, "depuis": term.depuis, "compte": term.compte}
        if op == "etages":
            if cle == DEFAUT:
                raise _refus("chef-inconnu", f"chef inconnu : {cle}")
            term.etages = {str(e): [str(p) for p in ps] for e, ps in req["etages"].items()}
            return {"ok": True, "etages": term.etages}
        if op == "attendre":
            pos, bloc, code = term.attendre(int(req.get("pos", 0)), float(req.get("delai", 15)))
            return {"pos": pos, "b64": base64.b64encode(bloc).decode("ascii"), "code": code}
        if op == "quitter":
            return {"ok": True, "_quitter": True}
        return {"erreur": f"op inconnue : {op}"}

    def client(conn: socket.socket) -> None:
        with conn, conn.makefile("rb") as f:
            for ligne in f:
                try:
                    rep = traiter(json.loads(ligne))
                except ChefRefus as exc:
                    rep = {"erreur": exc.message, "code": exc.code}
                except Exception as exc:
                    rep = {"erreur": str(exc)}
                conn.sendall((json.dumps(rep) + "\n").encode())
                if rep.get("_quitter"):
                    os._exit(0)
        inactif_depuis[0] = time.monotonic()

    def veilleur() -> None:
        # defaut : sans session vivante ni client depuis 2 min, le demon se retire ;
        # dedie : session finie (■, /exit, crash) => il sort sous 5 s, ses etages reviennent au defaut
        while True:
            time.sleep(1 if cle != DEFAUT else 30)
            fini = cle != DEFAUT and term.code is not None
            if not fini and (term.vivant() or time.monotonic() - inactif_depuis[0] <= 120):
                continue
            if fini:
                time.sleep(1)               # laisse partir la derniere reponse (code de sortie)
            try:
                os.unlink(chemin)
            except OSError:
                pass
            os._exit(0)

    threading.Thread(target=veilleur, daemon=True).start()
    while True:
        conn, _ = srv.accept()
        inactif_depuis[0] = time.monotonic()
        threading.Thread(target=client, args=(conn,), daemon=True).start()


class TerminalClient:
    """Meme interface que Terminal, mais parle au demon. Le lance au besoin."""

    def __init__(self, cwd: str, cle: str = DEFAUT):
        self.cwd = cwd
        self.cle = cle
        self.chemin = chemin_socket(cle)
        self._pos = 0

    # ── transport ───────────────────────────────────────────────────────
    def _appel(self, req: dict, lancer: bool = True) -> dict:
        try:
            return self._envoyer(req)
        except (FileNotFoundError, ConnectionRefusedError):
            if not lancer:
                return {}
            if self.cle != DEFAUT:             # un dedie ne se lance que par ouvrir_chef
                raise _refus("chef-inconnu", f"chef inconnu : {self.cle}")
            _lancer_demon(self.cwd, DEFAUT, {}, "defaut")
            return self._envoyer(req)

    def _envoyer(self, req: dict, delai: float | None = None) -> dict:
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
            s.settimeout(delai if delai is not None else float(req.get("delai", 15)) + 5)
            s.connect(self.chemin)
            with s.makefile("rb") as f:
                s.sendall((json.dumps(req) + "\n").encode())
                ligne = f.readline()
        return json.loads(ligne or b"{}")

    def _verifier(self, rep: dict) -> dict:
        if rep.get("code"):
            raise _refus(rep["code"], rep["erreur"])
        return rep

    def info(self, delai: float = 1.0) -> dict | None:
        """op etat ; None si le socket est muet. Un demon d'avant le multi-chefs est lu comme le chef par défaut."""
        try:
            rep = self._envoyer({"op": "etat"}, delai)
        except OSError:
            return None
        return {"cle": self.cle, "etages": {}, "compte": "defaut", "pid": None, "depuis": None} | rep

    # ── interface Terminal ──────────────────────────────────────────────
    def vivant(self) -> bool:
        return bool(self._appel({"op": "etat"}, lancer=False).get("vivant"))

    @property
    def code(self):
        return self._appel({"op": "etat"}, lancer=False).get("code")

    def position(self) -> int:
        return int(self._appel({"op": "etat"}, lancer=False).get("pos", 0))

    def _ouvrir(self, cols: int, rows: int, compte: str | None) -> dict:
        return self._verifier(self._appel({"op": "open", "cols": cols, "rows": rows, "compte": compte}))

    def demarrer(self, cols: int = 120, rows: int = 32, compte: str | None = None) -> None:
        self._ouvrir(cols, rows, compte)

    def arreter(self) -> None:
        self._appel({"op": "stop"}, lancer=False)

    def ecrire(self, donnees: bytes) -> None:
        self._appel({"op": "in", "b64": base64.b64encode(donnees).decode("ascii")}, lancer=False)

    def redimensionner(self, cols: int, rows: int) -> None:
        self._appel({"op": "resize", "cols": cols, "rows": rows}, lancer=False)

    def attendre(self, position: int, delai: float = 15.0) -> tuple[int, bytes, int | None]:
        rep = self._appel({"op": "attendre", "pos": position, "delai": delai}, lancer=False)
        if not rep:
            return position, b"", None
        return int(rep["pos"]), base64.b64decode(rep.get("b64", "")), rep.get("code")


LoginIssue = Literal["connecte", "sans-credentials", "echec", "delai", "arrete"]
LoginEtat = TypedDict("LoginEtat", {"compte": str, "vivant": bool, "code": int | None,
                                    "issue": LoginIssue | None, "reste_s": int})


class Login:
    """pty éphémère `claude auth login` ; même sous-interface que TerminalClient pour le flux SSE.
    Sortie du pty : tampon mémoire seul (jamais log, journal ni state.json), libéré LIBERE_S après la fin."""
    DELAI_S = 600
    COLS, ROWS = 1000, 40
    TAMPON_MAX = 65_536
    LIBERE_S = 300

    def __init__(self, compte: str, argv: list[str], env: dict[str, str], cwd: str, cree: bool) -> None:
        self.compte, self.argv, self.env, self.cwd, self.cree = compte, argv, env, cwd, cree
        self.fd: int | None = None
        self.proc: subprocess.Popen | None = None
        self._code: int | None = None
        self.issue: LoginIssue | None = None
        self.debut = 0.0
        self.fin: float | None = None
        self.tampon = bytearray()
        self.decale = 0
        self.cond = threading.Condition()
        self._arret = False
        self._delai = False

    def demarrer(self) -> None:
        maitre, esclave = os.openpty()
        fcntl.ioctl(maitre, termios.TIOCSWINSZ, struct.pack("HHHH", self.ROWS, self.COLS, 0, 0))
        base = {k: v for k, v in self.env.items() if not k.startswith("CLAUDE_CODE_") and k != "CLAUDECODE"}
        env = base | {"TERM": "xterm-256color", "LANG": os.environ.get("LANG", "C.UTF-8")}
        try:
            self.proc = subprocess.Popen(self.argv, env=env, cwd=self.cwd, stdin=esclave, stdout=esclave,
                                         stderr=esclave, start_new_session=True)
        except FileNotFoundError as exc:
            os.close(maitre)
            self.issue = "echec"
            self._nettoyer()
            raise RuntimeError("claude introuvable") from exc
        finally:
            os.close(esclave)
        self.fd = maitre
        self.debut = time.monotonic()
        lecteur = threading.Thread(target=self._lire, daemon=True)
        lecteur.start()
        threading.Thread(target=self._faucher, args=(lecteur,), daemon=True).start()

    def vivant(self) -> bool:
        return self.proc is not None and self._code is None

    @property
    def code(self) -> int | None:
        return self._code

    def position(self) -> int:
        with self.cond:
            return self.decale + len(self.tampon)

    def _lire(self) -> None:
        while True:
            try:
                bloc = os.read(self.fd, 65536)
            except OSError:
                return
            if not bloc:
                return
            with self.cond:
                self.tampon += bloc
                if len(self.tampon) > self.TAMPON_MAX:
                    coupe = len(self.tampon) - self.TAMPON_MAX
                    del self.tampon[:coupe]
                    self.decale += coupe
                self.cond.notify_all()

    def _tuer(self) -> None:
        try:
            os.killpg(self.proc.pid, signal.SIGTERM)
            self.proc.wait(2)
        except ProcessLookupError:
            pass
        except subprocess.TimeoutExpired:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(self.proc.pid, signal.SIGKILL)

    def _faucher(self, lecteur: threading.Thread) -> None:
        import agents                  # import tardif : les bancs de test ne copient pas toujours agents.py
        try:
            self.proc.wait(self.DELAI_S)
        except subprocess.TimeoutExpired:
            self._delai = True
            self._tuer()
        code = self.proc.wait()
        lecteur.join(2)
        os.close(self.fd)
        if self._arret:
            issue = "arrete"
        elif self._delai:
            issue = "delai"
        elif code != 0:
            issue = "echec"
        elif (agents.dossier_compte(self.compte) / ".credentials.json").exists():
            issue = "connecte"
        else:
            issue = "sans-credentials"
        with self.cond:
            self.issue = issue
            self.fin = time.monotonic()
        self._nettoyer()
        with self.cond:
            self._code = code
            self.cond.notify_all()

    def _nettoyer(self) -> None:
        """Dossier créé par ce login, resté vide après un échec ⇒ rmdir (jamais de suppression récursive)."""
        import agents
        if self.cree and self.issue != "connecte":
            with contextlib.suppress(OSError):
                os.rmdir(agents.dossier_compte(self.compte))

    def ecrire(self, donnees: bytes) -> None:
        if self.vivant() and self.fd is not None:
            with contextlib.suppress(OSError):         # fd fermé entre vivant() et write : session finie
                os.write(self.fd, donnees)

    def arreter(self) -> None:
        if self.vivant():
            self._arret = True
            self._tuer()

    def _liberer(self) -> None:
        if self.fin is not None and time.monotonic() - self.fin > self.LIBERE_S and self.tampon:
            self.decale += len(self.tampon)
            self.tampon.clear()

    def attendre(self, position: int, delai: float = 15.0) -> tuple[int, bytes, int | None]:
        fin = time.monotonic() + delai
        with self.cond:
            while True:
                self._liberer()
                debut = max(position, self.decale) - self.decale
                if debut < len(self.tampon) or self._code is not None:
                    return self.decale + len(self.tampon), bytes(self.tampon[debut:]), self._code
                reste = fin - time.monotonic()
                if reste <= 0:
                    return self.decale + len(self.tampon), b"", None
                self.cond.wait(reste)

    def etat(self) -> LoginEtat:
        vivant = self.vivant()
        reste = max(0, self.DELAI_S - int(time.monotonic() - self.debut)) if vivant else 0
        return {"compte": self.compte, "vivant": vivant, "code": self._code, "issue": self.issue, "reste_s": reste}


_VERROU_LOGIN = threading.Lock()
_COURANT: list[Login] = []                  # 0 ou 1 : le dernier login, vivant ou fini


def ouvrir_login(cwd: str, compte: str) -> Login:
    import agents                  # import tardif : les bancs de test ne copient pas toujours agents.py
    with _VERROU_LOGIN:
        if _COURANT and _COURANT[0].vivant():
            raise _refus("login-en-cours", f"connexion déjà en cours : {_COURANT[0].compte}")
        try:
            argv, env, cree = agents.preparer_login(compte)
        except agents.CompteErreur as exc:
            raise _refus(exc.code, str(exc)) from exc
        login = Login(compte, argv, env, cwd, cree)
        login.demarrer()
        _COURANT[:] = [login]
        return login


def login_courant(compte: str) -> Login:
    if not _COURANT or _COURANT[0].compte != compte:
        raise _refus("login-absent", f"aucune connexion en cours pour {compte}")
    return _COURANT[0]


def _lancer_demon(cwd: str, cle: str, etages: dict[str, list[str]], compte: str) -> None:
    argv = [sys.executable, os.path.abspath(__file__), "--daemon", cwd]
    if cle != DEFAUT:
        argv += ["--chef", cle, "--etages", json.dumps(etages)]
    if compte != "defaut":
        argv += ["--compte", compte]
    journal = chemin_journal(cle)
    with open(journal, "a") as log:
        subprocess.Popen(argv, stdout=log, stderr=log, stdin=subprocess.DEVNULL, cwd=cwd, start_new_session=True)
    client = TerminalClient(cwd, cle)
    for _ in range(50):
        if os.path.exists(client.chemin):
            try:
                client._envoyer({"op": "etat"})
                return
            except OSError:
                pass
        time.sleep(0.1)
    raise RuntimeError("le demon du terminal ne repond pas — voir " + journal)


# --------------------------------------------------------------------------- #
# plusieurs chefs : decouverte par les sockets, ouverture, affectation des etages
# --------------------------------------------------------------------------- #

def _cle_valide(cle: str, dedie: bool = False) -> str:
    if not RE_CLE.fullmatch(cle) or (dedie and cle == DEFAUT):
        raise _refus("cle-invalide", f"clé invalide : {cle} (a-z0-9-, ≤ 24, ≠ defaut)")
    return cle


def _chef_info(info: dict) -> dict:
    return {"cle": info["cle"], "defaut": info["cle"] == DEFAUT, "vivant": info.get("vivant"),
            "etages": list(info["etages"]), "projets": {e: list(p) for e, p in info["etages"].items()},
            "pid": info["pid"], "depuis": info["depuis"], "compte": info["compte"]}


def libelles() -> dict[str, str]:
    """Libellés d'affichage {cle: libellé}, sans verrou ; absent ou illisible ⇒ {}."""
    try:
        with open(os.path.join(_dossier_etat(), LIBELLES), encoding="utf-8") as f:
            table = json.load(f)["libelles"]
        return {c: l for c, l in table.items() if isinstance(c, str) and isinstance(l, str)}
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        return {}


def _libelle_valide(libelle: str) -> str:
    s = libelle.strip()
    if not 1 <= len(s) <= LIBELLE_MAX or not s.isprintable():
        raise _refus("libelle-invalide", f"libellé invalide : {libelle!r} (1-{LIBELLE_MAX} caractères imprimables)")
    return s


def libeller_chef(cwd: str, cle: str, libelle: str | None) -> dict[str, str]:
    """Pose (ou retire si None) le libellé d'affichage de `cle` ; la clé technique ne change pas."""
    _cle_valide(cle)
    with _verrou():
        table = libelles()
        if libelle is None:
            table.pop(cle, None)
        else:
            if cle != DEFAUT and cle not in {c["cle"] for c in lister_chefs(cwd)}:
                raise _refus("chef-inconnu", f"chef inconnu : {cle}")
            table[cle] = _libelle_valide(libelle)
        chemin = os.path.join(_dossier_etat(), LIBELLES)
        fd = os.open(chemin + ".tmp", os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump({"version": 1, "libelles": table}, f, ensure_ascii=False)
        os.replace(chemin + ".tmp", chemin)
        return table


def lister_chefs(cwd: str, delai: float = 1.0) -> list[dict]:
    """ChefInfo[] : le défaut en tête (vivant None si muet), puis les dédiés qui répondent, clé ↑."""
    table = libelles()
    dossier = _dossier_etat()
    dedies = sorted(n[len("agentx-chef-"):-len(".sock")] for n in os.listdir(dossier)
                    if n.startswith("agentx-chef-") and n.endswith(".sock"))
    chefs = []
    for cle in [DEFAUT, *(c for c in dedies if RE_CLE.fullmatch(c))]:
        info = TerminalClient(cwd, cle).info(delai)
        if info is not None:
            chefs.append(_chef_info(info))
        elif cle == DEFAUT:
            chefs.append({"cle": DEFAUT, "defaut": True, "vivant": None, "etages": [], "projets": {},
                          "pid": None, "depuis": None, "compte": "defaut"})
    for c in chefs:
        if c["cle"] in table:
            c["libelle"] = table[c["cle"]]
    return chefs


def tenant_de_projet(chefs: list[dict], slug: str) -> dict | None:
    """Le chef dédié qui tient un étage contenant `slug`, sinon le défaut s'il est listé."""
    for c in chefs:
        if not c["defaut"] and slug in (p for ps in c["projets"].values() for p in ps):
            return c
    return next((c for c in chefs if c["defaut"]), None)


def _verifier_plafond(chefs: list[dict]) -> None:
    if sum(c["vivant"] is True for c in chefs) >= CHEFS_MAX:
        raise _refus("plafond", f"refus : {CHEFS_MAX} chefs vivants (plafond) — arrête-en un : agentx chef arreter <cle>")


def ouvrir_chef(cwd: str, etages: dict[str, list[str]], cle: str | None = None,
                cols: int = 120, rows: int = 32, compte: str = "defaut") -> dict:
    """Lance un démon dédié à `etages` (étage → projets) et ouvre sa session ; rend son ChefInfo."""
    _verifier_compte(compte)
    if not etages:
        raise _refus("etage-inconnu", "étage inconnu : (aucun)")
    cle = _cle_valide(cle or next(iter(etages))[:24].rstrip("-"), dedie=True)
    with _verrou():
        chefs = lister_chefs(cwd)
        if any(c["cle"] == cle for c in chefs):
            raise _refus("cle-prise", f"refus : chef {cle} existe déjà")
        for e in etages:
            for c in chefs:
                if not c["defaut"] and e in c["etages"]:
                    raise _refus("etage-tenu", f"refus : étage {e} déjà tenu par le chef {c['cle']}")
        _verifier_plafond(chefs)
        if os.path.exists(chemin_socket(cle)):       # orphelin : fichier présent, connexion refusée
            os.unlink(chemin_socket(cle))
        _lancer_demon(cwd, cle, etages, compte)
        client = TerminalClient(cwd, cle)
        client._ouvrir(cols, rows, compte)
        return _chef_info(client.info())


def demarrer_chef(cwd: str, cle: str, cols: int, rows: int, compte: str | None = None) -> dict:
    """Ouvre (ou rattache) la session de `cle` ; une session à lancer passe sous verrou par le plafond."""
    client = TerminalClient(cwd, _cle_valide(cle))
    info = client.info()
    if info is None and cle != DEFAUT:
        raise _refus("chef-inconnu", f"chef inconnu : {cle}")
    if info is None or not info["vivant"]:
        with _verrou():
            _verifier_plafond(lister_chefs(cwd))
            return client._ouvrir(cols, rows, compte)
    return client._ouvrir(cols, rows, compte)


def arreter_chef(cwd: str, cle: str) -> None:
    client = TerminalClient(cwd, _cle_valide(cle))
    if cle != DEFAUT and client.info() is None:
        raise _refus("chef-inconnu", f"chef inconnu : {cle}")
    client.arreter()


def _poser_etages(cwd: str, cle: str, etages: dict[str, list[str]]) -> None:
    client = TerminalClient(cwd, cle)
    rep = client._verifier(client._appel({"op": "etages", "etages": etages}, lancer=False))
    if not rep.get("ok"):
        raise RuntimeError(f"le chef {cle} n'a pas pris les étages")


def reaffecter_etage(cwd: str, etage: str, projets: list[str], vers: str) -> list[dict]:
    """Passe `etage` de son tenant à `vers` (chef vivant, défaut compris) : retrait puis ajout, jamais 2 tenants."""
    _cle_valide(vers)
    with _verrou():
        chefs = lister_chefs(cwd)
        cible = next((c for c in chefs if c["cle"] == vers), None)
        if cible is None:
            raise _refus("chef-inconnu", f"chef inconnu : {vers}")
        if cible["vivant"] is not True:
            raise _refus("chef-mort", f"refus : chef {vers} non vivant — réaffectation impossible")
        tenant = next((c for c in chefs if not c["defaut"] and etage in c["etages"]), chefs[0])   # chefs[0] = défaut
        if tenant["cle"] == vers:
            return chefs
        if not tenant["defaut"]:
            _poser_etages(cwd, tenant["cle"], {e: p for e, p in tenant["projets"].items() if e != etage})
        if not cible["defaut"]:
            try:
                _poser_etages(cwd, vers, cible["projets"] | {etage: projets})
            except (OSError, RuntimeError) as exc:
                if not tenant["defaut"]:
                    _poser_etages(cwd, tenant["cle"], tenant["projets"])
                raise RuntimeError(f"réaffectation de {etage} vers {vers} échouée — étage rendu à {tenant['cle']}") from exc
        return lister_chefs(cwd)


def _main_demon(args: list[str]) -> None:
    import agents
    p = argparse.ArgumentParser(prog="terminal.py --daemon")
    p.add_argument("cwd")
    p.add_argument("--chef", default=DEFAUT)
    p.add_argument("--etages", default="{}")
    p.add_argument("--compte", default=agents.COMPTE_DEFAUT)
    ns = p.parse_args(args)                       # argument invalide : exit 2
    if ns.chef != DEFAUT and not RE_CLE.fullmatch(ns.chef):
        p.error(f"clé invalide : {ns.chef}")
    if not agents.RE_COMPTE.fullmatch(ns.compte):
        p.error(f"compte invalide : {ns.compte}")
    try:
        etages = json.loads(ns.etages)
    except ValueError:
        p.error("--etages : JSON invalide")
    _servir(ns.cwd, ns.chef, etages, ns.compte)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--daemon":
        _main_demon(sys.argv[2:])
