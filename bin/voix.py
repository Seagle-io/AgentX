#!/usr/bin/env python3
"""voix — parle le protocole fichiers/socket des demons `bin/parle` et `bin/dictee`.

Aucun sous-processus vers `bin/parle` : on lit et ecrit les memes fichiers que
lui, dans AGENTX_VOIX_DIR (defaut ~/.cache), relu a chaque appel pour qu'un banc
de test ne touche jamais les demons reels.

    claude-voix-on   flag du mode vocal (voix du chef + annonces des agents)
    parle.sock       socket du demon parle : une ligne JSON par connexion
    dictee.mute      present et recent : parle est en train de parler
    dictee.pid       pid du demon dictee
    dictee.etat      "on" | "off" : micro ouvert ou non
"""

from __future__ import annotations

import json
import os
import re
import signal
import socket
import stat
import subprocess
import time
from pathlib import Path

import roles

RE_TID = re.compile(r"^T\d{3}$")


def _cache() -> Path:
    return Path(os.path.expanduser(os.environ.get("AGENTX_VOIX_DIR") or "~/.cache"))


def _envoyer(msg: dict) -> None:
    """Une ligne JSON sur parle.sock. Leve OSError si le demon ne repond pas."""
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        s.connect(str(_cache() / "parle.sock"))
        s.sendall((json.dumps(msg, ensure_ascii=False) + "\n").encode("utf-8"))


def _lire(p: Path, n: int) -> bytes:
    """Au plus les n derniers octets de p, premiere ligne coupee ecartee.
    Fichier regulier seulement : un lien vers /dev/zero remplirait la RAM, une
    fifo bloquerait le serveur. Leve OSError sinon."""
    st = os.stat(p)
    if not stat.S_ISREG(st.st_mode):
        raise OSError(f"{p} : pas un fichier regulier")
    with open(p, "rb") as f:
        if st.st_size > n:
            f.seek(st.st_size - n)
            f.readline(n)      # ligne coupee par le seek
        return f.read(n)


def _pid_dictee() -> int | None:
    """Pid du demon dictee s'il est vivant, sinon None. Jamais 0, -1 ni 1 :
    os.kill viserait le groupe, tous les processus ou init. Jamais un pid
    recycle : sa ligne de commande doit nommer dictee."""
    try:
        pid = int(_lire(_cache() / "dictee.pid", 32).decode(errors="replace").strip())
        if not 1 < pid <= 4194304:      # pid_max Linux
            return None
        if b"dictee" not in _lire(Path(f"/proc/{pid}/cmdline"), 4096):
            return None
        os.kill(pid, 0)
        return pid
    except Exception:
        return None


def _etat_dictee() -> str | None:
    """"on" | "off", sinon None (absent, illisible, valeur inconnue)."""
    try:
        e = _lire(_cache() / "dictee.etat", 32).decode(errors="replace").strip()
        return e if e in ("on", "off") else None
    except Exception:
        return None


def etat() -> dict:
    """Ne leve jamais : en panne, tout est False."""
    cache = _cache()
    try:
        try:
            _envoyer({"cmd": "ping"})
            parle = True
        except OSError:
            parle = False
        try:
            en_cours = time.time() - (cache / "dictee.mute").stat().st_mtime < 60
        except OSError:
            en_cours = False
        dictee = _pid_dictee() is not None
        return {
            "mode": (cache / "claude-voix-on").exists(),
            "passation_auto": (cache / "claude-passation-auto").exists(),
            "parle": parle,
            "en_cours": en_cours,
            "dictee": dictee,
            "ecoute": dictee and _etat_dictee() == "on",
        }
    except Exception:
        return dict.fromkeys(("mode", "passation_auto", "parle", "en_cours", "dictee", "ecoute"), False)


def journal(n: int = 30) -> list[dict]:
    """Les n dernieres phrases dites (ecrites par le hook voix). Ne leve jamais."""
    try:
        lignes = _lire(_cache() / "claude-voix-journal.jsonl", 64 * 1024).decode("utf-8", errors="replace").splitlines()
    except Exception:      # absent, illisible, pas un fichier regulier
        return []
    sortie = []
    for ligne in lignes:
        try:
            d = json.loads(ligne)
            sortie.append({"t": d["t"], "texte": d["texte"]})
        except Exception:      # ligne invalide, y compris JSON trop imbrique
            continue
    return sortie[-n:] if n > 0 else []


def effacer() -> dict:
    """Tronque le journal a 0 octet (parle_hook le rouvre en a+). Ne leve jamais."""
    try:
        with open(_cache() / "claude-voix-journal.jsonl", "w"):
            pass
    except OSError:      # dossier absent, non inscriptible
        return {**etat(), "journal": journal(30)}
    return {**etat(), "journal": []}


def passation_auto(on: bool) -> dict:
    flag = _cache() / "claude-passation-auto"
    if on:
        flag.parent.mkdir(parents=True, exist_ok=True)
        flag.touch()
    else:
        flag.unlink(missing_ok=True)
    return etat()


def mode(on: bool) -> dict:
    flag = _cache() / "claude-voix-on"
    if on:
        flag.parent.mkdir(parents=True, exist_ok=True)
        flag.touch()
    else:
        flag.unlink(missing_ok=True)
        try:
            _envoyer({"cmd": "stop"})
        except OSError:
            pass      # parle eteint : rien a faire taire
    try:
        subprocess.run(
            ["notify-send", "-a", "Claude", "-i", "audio-speakers" if on else "audio-volume-muted",
             "-t", "1500", "-h", "string:x-canonical-private-synchronous:parle", "Voix de Claude",
             "🔊 Mode vocal activé" if on else "🔇 Mode vocal désactivé"],
            timeout=2, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except (OSError, subprocess.SubprocessError):
        pass      # pas de notify-send : la page affiche deja l'etat
    return etat()


def taire() -> dict:
    try:
        _envoyer({"cmd": "stop"})
    except OSError:
        pass
    return etat()


def micro(on: bool) -> dict:
    pid = _pid_dictee()
    if pid is None:
        raise ValueError("dictee n'est pas lancé")
    actuel = _etat_dictee()
    if not actuel:
        raise ValueError("état inconnu — relance dictee")
    voulu = "on" if on else "off"
    if actuel != voulu:
        os.kill(pid, signal.SIGUSR1)
        for _ in range(6):
            time.sleep(0.05)
            if _etat_dictee() == voulu:
                break
    return etat()


def phrase(ev: dict) -> str:
    cle = str(ev.get("role", ""))
    r = roles.role(cle)
    if r:
        nom = r.nom if len(r.nom) <= 4 else r.nom.capitalize()
    else:
        nom = cle or "Un agent"
    tid = str(ev.get("tid", ""))
    tache = f"tâche {int(tid[1:])}" if RE_TID.match(tid) else ""
    projet = str(ev.get("projet", ""))
    etage = f", projet {projet.replace('-', ' ')}" if projet else ""
    verdict = str(ev.get("verdict", ""))
    if ev.get("quoi") == "agent-bloque":
        return f"Attention : {nom} bloqué" + (f" sur la {tache}" if tache else "") + f"{etage}."
    if verdict:
        return f"{nom} : verdict {verdict}" + (f" sur la {tache}" if tache else "") + f"{etage}."
    if tache:
        return f"{nom} : {tache} livrée{etage}."
    return f"{nom} a terminé{etage}."


def annoncer(ev: dict) -> bool:
    """Fait dire par parle qu'un agent a rendu, si le mode vocal est ON. Ne leve jamais."""
    try:
        if not (_cache() / "claude-voix-on").exists() or not (texte := phrase(ev)):
            return False
        _envoyer({"cmd": "say", "text": texte})
        return True
    except Exception:
        return False      # une annonce perdue ne doit jamais arreter un agent
