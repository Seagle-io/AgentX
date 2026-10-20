#!/usr/bin/env python3
"""verrou — verrou court par fichier (contrat-garde-ecriture) : posé par garde_vault, libéré par le hook
PostToolUse|PostToolUseFailure Write|Edit|MultiEdit. Stdlib + agents (ROOT seul).
"""

import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import TypedDict

import agents

RACINE = agents.ROOT / "run" / "verrous"
EXPIRATION_S = 10.0


class Verrou(TypedDict):
    chemin: str
    tid: str
    projet: str
    session: str
    pose: float


def cle(chemin: Path) -> Path:
    return RACINE / f"{hashlib.sha1(str(chemin.resolve()).encode()).hexdigest()}.json"


def lire(chemin: Path) -> Verrou | None:
    try:
        return json.loads(cle(chemin).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def poser(chemin: Path, fiche: dict, session: str, maintenant: float | None = None) -> Verrou | None:
    """None = acquis. Sinon le Verrou vivant d'une autre session. OSError propagée.
    limite v1 : N poseurs sur un verrou expiré ⇒ N acquis (lecture→replace non atomique)."""
    horloge = maintenant is None
    maintenant = time.time() if horloge else maintenant
    v: Verrou = {"chemin": str(chemin.resolve()), "tid": fiche["tid"], "projet": fiche["projet"],
                 "session": session, "pose": maintenant}
    RACINE.mkdir(parents=True, exist_ok=True)
    k = cle(chemin)
    try:
        fd = os.open(k, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        if horloge:
            maintenant = time.time()
        autre = lire(chemin)
        if autre is not None and not (isinstance(autre, dict) and isinstance(autre.get("pose"), (int, float))):
            autre = None
        if autre is None:
            # vide/illisible : en cours d'écriture par le concurrent s'il est tout frais
            try:
                if abs(maintenant - k.stat().st_mtime) < 1.0:
                    return {"chemin": v["chemin"], "tid": "?", "projet": "?", "session": "", "pose": maintenant}
            except FileNotFoundError:
                try:
                    fd = os.open(k, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                except FileExistsError:
                    pass
                else:
                    with os.fdopen(fd, "w", encoding="utf-8") as f:
                        json.dump(v, f)
                    return None
        elif autre.get("session") != session and abs(maintenant - autre["pose"]) < EXPIRATION_S:
            return autre
        tmp = k.with_suffix(f".{os.getpid()}.tmp")
        tmp.write_text(json.dumps(v), encoding="utf-8")
        os.replace(tmp, k)
        return None
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(v, f)
    return None


def liberer(chemin: Path, session: str) -> bool:
    """Supprime si verrou.session == session ; autre session ou absent ⇒ intact, False."""
    v = lire(chemin)
    if not isinstance(v, dict) or v.get("session") != session:
        return False
    try:
        cle(chemin).unlink()
    except FileNotFoundError:
        return False
    return True


def main() -> None:
    try:
        entree = json.load(sys.stdin)
        liberer(Path(os.path.normpath(agents.ROOT / entree["tool_input"]["file_path"])),
                str(entree.get("session_id") or ""))
    except (ValueError, KeyError, TypeError, OSError):
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
