#!/usr/bin/env python3
"""agents — registre des agents detaches (`claude --bg`), source unique.

Une fiche JSON par agent lance : run/agents/<slug>-<TID>.json. Le vault dit le
statut des taches ; la fiche plus `claude agents --json` disent la vivacite.
Jamais l'inverse.

Stdlib seule ; `claude` est le seul executable appele. AGENTX_ROOT (env)
deplace la racine — tests sous .cache/, jamais le vrai vault.
"""

from __future__ import annotations

import json
import os
import re
import secrets
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import TypedDict

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
REG = ROOT / "run" / "agents"
CLAUDE = os.environ.get("AGENTX_CLAUDE", "claude")
TOOLS_DEFAUT = ["Read", "Edit", "Write", "Grep", "Glob", "Bash", "WebFetch", "WebSearch"]
EVENEMENTS = ROOT / "run" / "evenements.jsonl"
MAX_OCTETS = 262_144
RE_STATUT = re.compile(r"^statut:\s*(\S+)", re.M)
DELAI_LISTE_S = 30            # grace apres `lance` : session pas encore listee ≠ morte

Fiche = TypedDict("Fiche", {
    "id_session": str | None,
    "nom": str,
    "pid": int | None,
    "role": str, "tid": str, "projet": str,
    "lance": str,
    "modele": str | None,
    "mode": str,
    "mort_signale": bool,
})

_SESSIONS: dict = {"t": 0.0, "v": None}


def _chemin(slug: str, tid: str) -> Path:
    return REG / f"{slug}-{tid}.json"


def lire(slug: str, tid: str) -> Fiche | None:
    try:
        return json.loads(_chemin(slug, tid).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def ecrire(f: Fiche) -> None:
    REG.mkdir(parents=True, exist_ok=True)
    cible = _chemin(f["projet"], f["tid"])
    tmp = cible.with_name(f".{cible.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(f, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, cible)


def lister() -> list[Fiche]:
    out = []
    for p in sorted(REG.glob("*.json")) if REG.exists() else []:
        try:
            out.append(json.loads(p.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            continue
    return out


def par_session(session_id: str) -> Fiche | None:
    """Fiche dont id_session et session_id sont préfixes l'un de l'autre ; aucune ⇒ None."""
    for f in lister():
        ids = f.get("id_session")
        if session_id and ids and (session_id.startswith(ids) or ids.startswith(session_id)):
            return f
    return None


def sessions(cache_s: float = 5.0) -> list[dict] | None:
    """`claude agents --json --all --cwd ROOT` ; echec ⇒ None ; resultat cache cache_s."""
    if time.monotonic() - _SESSIONS["t"] < cache_s:
        return _SESSIONS["v"]
    try:
        r = subprocess.run([CLAUDE, "agents", "--json", "--all", "--cwd", str(ROOT)],
                           capture_output=True, text=True, timeout=3, cwd=str(ROOT))
        v = json.loads(r.stdout) if r.returncode == 0 else None
    except (OSError, ValueError, subprocess.TimeoutExpired):
        v = None
    _SESSIONS.update(t=time.monotonic(), v=v if isinstance(v, list) else None)
    return _SESSIONS["v"]


def _pid_vivant(pid: int | None) -> bool:
    if not pid:
        return False
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, PermissionError, OSError):
        return False


def etat(f: Fiche, sess: list[dict] | None) -> str:
    """Etat de la session de la fiche. Absente de `sess` : `stopped`, sauf lancee depuis
    moins de DELAI_LISTE_S (`claude agents` la liste avec retard) ⇒ `inconnu`."""
    if sess is None:
        return "working" if _pid_vivant(f.get("pid")) else "inconnu"
    ids = f.get("id_session")
    for s in sess:
        if (ids and str(s.get("id", "")).startswith(ids)) or s.get("name") == f["nom"]:
            return str(s.get("state") or "inconnu")
    if time.time() - datetime.fromisoformat(f["lance"]).timestamp() < DELAI_LISTE_S:
        return "inconnu"
    return "stopped"


def vivant(e: str) -> bool | None:
    if e in ("working", "blocked"):
        return True
    return None if e == "inconnu" else False


def dossier_tache(slug: str, tid: str) -> Path | None:
    d = sorted((ROOT / "vault" / "projets" / slug / "taches").glob(f"{tid}-*"))
    return d[0] if d else None


def statut_tache(slug: str, tid: str) -> str:
    d = dossier_tache(slug, tid)
    if not d or not (d / "task.md").exists():
        return ""
    m = RE_STATUT.search((d / "task.md").read_text(encoding="utf-8"))
    return m.group(1) if m else ""


def a_rendu(f: Fiche) -> bool:
    d = dossier_tache(f["projet"], f["tid"])
    if not d or not (d / "result.md").exists():
        return False
    lance = datetime.fromisoformat(f["lance"]).timestamp()
    return (d / "result.md").stat().st_mtime >= lance


def _ecrire_evenement(ev: dict) -> None:
    """sonnerie.ecrire_evenement si elle existe et vise la meme racine ; sinon repli local."""
    try:
        import sonnerie
        if sonnerie.ROOT == ROOT:
            sonnerie.ecrire_evenement(ev)
            return
    except (ImportError, AttributeError):
        pass
    EVENEMENTS.parent.mkdir(parents=True, exist_ok=True)
    if EVENEMENTS.exists() and EVENEMENTS.stat().st_size > MAX_OCTETS:
        fin = EVENEMENTS.read_text(encoding="utf-8", errors="replace").splitlines()[-50:]
        EVENEMENTS.write_text("\n".join(fin) + "\n", encoding="utf-8")
    with EVENEMENTS.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(ev, ensure_ascii=False) + "\n")


def signaler_morts(sess: list[dict] | None) -> list[dict]:
    """Un evenement agent-mort par fiche morte sans result.md, une seule fois."""
    out = []
    for f in lister():
        if f.get("mort_signale") or statut_tache(f["projet"], f["tid"]) != "en-cours":
            continue
        e = etat(f, sess)
        if vivant(e) is not False or a_rendu(f):
            continue
        ev = {"id": secrets.token_hex(8), "t": datetime.now().strftime("%H:%M:%S"),
              "quoi": "agent-mort", "role": f["role"], "tid": f["tid"],
              "statut": e, "verdict": "", "projet": f["projet"]}
        _ecrire_evenement(ev)
        f["mort_signale"] = True
        ecrire(f)
        out.append(ev)
    return out


def purger() -> int:
    n = 0
    for f in lister():
        if statut_tache(f["projet"], f["tid"]) in ("fait", "abandonne"):
            _chemin(f["projet"], f["tid"]).unlink(missing_ok=True)
            n += 1
    return n
