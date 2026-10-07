"""terminal — une session Claude Code dans la salle, via un pseudo-terminal.

Pas un shell : le seul programme lancé est `claude`, dans la racine d'AgentX,
pour que /projet, /pack, /dispatch et /clore soient disponibles depuis le
navigateur. Le flux sortant part en SSE, l'entrée arrive en POST.

    - une seule session à la fois (la salle est un poste, pas un serveur) ;
    - mémoire tampon de 256 Ko pour rejouer l'écran à la reconnexion ;
    - zéro dépendance : pty + threads de la bibliothèque standard.
"""

from __future__ import annotations

import fcntl
import os
import signal
import struct
import termios
import threading
import time

# La session est le CHEF DE PROJET : elle charge la compétence au démarrage et
# se présente comme tel, sans que l'utilisateur ait à taper /projet.
CONSIGNE_CHEF = (
    "Tu es le CHEF DE PROJET AgentX, ouvert depuis la salle des agents. "
    "Avant toute autre chose, charge la compétence `chef-de-projet` avec l'outil Skill "
    "et lis `vault/INDEX.md` puis le brief du projet courant (`./bin/agentx board`). "
    "Présente-toi en deux lignes comme chef de projet, résume l'état du projet courant, "
    "et demande à l'utilisateur ce qu'il veut faire. Tu n'écris jamais de code toi-même : "
    "tu cadres, tu découpes, tu rédiges des packs et tu dispatches les agents. "
    "Chaque agent reçoit un pack = le contexte MINIMUM SUFFISANT pour sa tâche, au périmètre "
    "délimité strictement : whitelist ≤ 12 fichiers avec droits E/L, contrats recopiés, hors-périmètre "
    "explicite, DoD vérifiable. Jamais « va lire le brief ». Si un agent devrait ouvrir autre chose, "
    "le pack est raté : tu le corriges. Un pack trop large se découpe en plusieurs tâches. "
    "La salle des agents n'affiche QUE ce qui est dans le vault : avant tout appel Agent, la tâche "
    "existe (`./bin/agentx tache ...`), son pack context.md est écrit et validé (pack-lint), "
    "son statut est `en-cours` (`./bin/agentx set`), et à la fin `fait`/`bloque` avec result.md. "
    "Un agent lancé sans tâche dans le vault est invisible et interdit. "
    "Avec l'humain tu parles français courant ; avec les agents (packs, prompts de dispatch) "
    "tu parles le langage dense de vault/_templates/LANGAGE.md. Réponds en français."
)
PROGRAMME = ["claude", "--append-system-prompt", CONSIGNE_CHEF,
             "Bonjour, je suis dans la salle des agents. Présente-toi et fais le point sur le projet courant."]
TAMPON_MAX = 256 * 1024


class Terminal:
    def __init__(self, cwd: str):
        self.cwd = cwd
        self.fd: int | None = None
        self.pid: int | None = None
        self.code: int | None = None
        self.tampon = bytearray()
        self.decale = 0                  # nb d'octets jetés en tête du tampon
        self.cond = threading.Condition()

    # ── cycle de vie ────────────────────────────────────────────────────
    def vivant(self) -> bool:
        return self.pid is not None and self.code is None

    def demarrer(self, cols: int = 120, rows: int = 32) -> None:
        with self.cond:
            if self.vivant():
                return
            self.tampon = bytearray()
            self.decale = 0
            self.code = None
        # la salle est souvent lancée depuis une session Claude Code : on
        # retire ses marqueurs, sinon la session enfant se croit imbriquée.
        env = {k: v for k, v in os.environ.items() if not k.startswith("CLAUDE_CODE_") and k != "CLAUDECODE"}
        env = dict(env, TERM="xterm-256color", COLORTERM="truecolor", LANG=os.environ.get("LANG", "C.UTF-8"))
        pid, fd = os.forkpty()
        if pid == 0:                       # enfant
            os.chdir(self.cwd)
            try:
                os.execvpe(PROGRAMME[0], PROGRAMME, env)
            except OSError as exc:
                os.write(2, f"\r\nimpossible de lancer {PROGRAMME[0]} : {exc}\r\n".encode())
                os._exit(127)
        self.pid, self.fd = pid, fd
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


def _chemin_socket(cwd: str) -> str:
    etat = os.path.join(os.path.expanduser("~"), ".local", "state")
    os.makedirs(etat, exist_ok=True)
    return os.path.join(etat, "agentx-chef.sock")


def _servir(cwd: str, chemin: str) -> None:
    term = Terminal(cwd)
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
            term.demarrer(int(req.get("cols", 120)), int(req.get("rows", 32)))
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
            return {"vivant": term.vivant(), "code": term.code, "pos": term.decale + len(term.tampon)}
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
                except Exception as exc:
                    rep = {"erreur": str(exc)}
                conn.sendall((json.dumps(rep) + "\n").encode())
                if rep.get("_quitter"):
                    os._exit(0)
        inactif_depuis[0] = time.monotonic()

    def veilleur() -> None:
        # sans session vivante ni client depuis 2 min, le demon se retire
        while True:
            time.sleep(30)
            if not term.vivant() and time.monotonic() - inactif_depuis[0] > 120:
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

    def __init__(self, cwd: str):
        self.cwd = cwd
        self.chemin = _chemin_socket(cwd)
        self._pos = 0

    # ── transport ───────────────────────────────────────────────────────
    def _appel(self, req: dict, lancer: bool = True) -> dict:
        try:
            return self._envoyer(req)
        except (FileNotFoundError, ConnectionRefusedError):
            if not lancer:
                return {}
            self._lancer_demon()
            return self._envoyer(req)

    def _envoyer(self, req: dict) -> dict:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(float(req.get("delai", 15)) + 5)
        s.connect(self.chemin)
        with s, s.makefile("rb") as f:
            s.sendall((json.dumps(req) + "\n").encode())
            ligne = f.readline()
        return json.loads(ligne or b"{}")

    def _lancer_demon(self) -> None:
        journal = os.path.join(os.path.dirname(self.chemin), "agentx-chef.log")
        with open(journal, "a") as log:
            subprocess.Popen([sys.executable, os.path.abspath(__file__), "--daemon", self.cwd],
                             stdout=log, stderr=log, stdin=subprocess.DEVNULL,
                             cwd=self.cwd, start_new_session=True)
        for _ in range(50):
            if os.path.exists(self.chemin):
                try:
                    self._envoyer({"op": "etat"})
                    return
                except OSError:
                    pass
            time.sleep(0.1)
        raise RuntimeError("le demon du terminal ne repond pas — voir " + journal)

    # ── interface Terminal ──────────────────────────────────────────────
    def vivant(self) -> bool:
        return bool(self._appel({"op": "etat"}, lancer=False).get("vivant"))

    @property
    def code(self):
        return self._appel({"op": "etat"}, lancer=False).get("code")

    def position(self) -> int:
        return int(self._appel({"op": "etat"}, lancer=False).get("pos", 0))

    def demarrer(self, cols: int = 120, rows: int = 32) -> None:
        self._appel({"op": "open", "cols": cols, "rows": rows})

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


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--daemon":
        cwd = sys.argv[2]
        _servir(cwd, _chemin_socket(cwd))
