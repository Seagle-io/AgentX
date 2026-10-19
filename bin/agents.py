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
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Mapping, TypedDict

import frontmatter

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
REG = ROOT / "run" / "agents"
CLAUDE = os.environ.get("AGENTX_CLAUDE", "claude")
TOOLS_DEFAUT = ["Read", "Edit", "Write", "Grep", "Glob", "Bash", "WebFetch", "WebSearch"]
EVENEMENTS = ROOT / "run" / "evenements.jsonl"
MAX_OCTETS = 262_144
ETATS_VIVANTS = ("working", "busy", "blocked")
DELAI_LISTE_S = 60            # grace apres `lance` : session pas encore listee ≠ morte ; seuil MORT
RE_COMPTE = re.compile(r"[a-z0-9][a-z0-9-]{0,23}")
COMPTE_DEFAUT = "defaut"
COMPTES_DIR = Path(os.environ.get("AGENTX_COMPTES_DIR") or "~/.config/agentx/comptes").expanduser()   # lu a l'import ; tests : patch.object

Fiche = TypedDict("Fiche", {
    "id_session": str | None,
    "nom": str,
    "pid": int | None,
    "role": str, "tid": str, "projet": str,
    "lance": str,
    "modele": str | None,
    "effort": str | None,
    "mode": str,
    "mort_signale": bool,
    "pack_sha": str,
    "session_uuid": str | None,
    "repris": int,
    "compte": str,
})
CompteInfo = TypedDict("CompteInfo", {"nom": str, "dossier": str, "connecte": bool, "login": str})


class CompteErreur(Exception):
    """code : compte-invalide | compte-inconnu | compte-deconnecte ; str(exc) == message."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message

_SESSIONS: dict = {"t": 0.0, "v": None}
_login = lambda c: ("claude auth login" if c == COMPTE_DEFAUT else  # noqa: E731
                    f"mkdir -p {dossier_compte(c)} && CLAUDE_CONFIG_DIR={dossier_compte(c)} claude auth login")


def dossier_compte(compte: str) -> Path:
    """defaut ⇒ ~/.claude ; <nom> ⇒ COMPTES_DIR/<nom> ; n'accede pas au disque."""
    if compte == COMPTE_DEFAUT:
        return Path("~/.claude").expanduser()
    if not RE_COMPTE.fullmatch(compte):
        raise CompteErreur("compte-invalide", f"compte invalide : {compte} (a-z0-9-, ≤ 24)")
    return COMPTES_DIR / compte


def lister_comptes() -> list[CompteInfo]:
    """defaut en tete, puis sous-dossiers de COMPTES_DIR passant RE_COMPTE, tri ↑ ; jamais d'exception."""
    try:
        noms = sorted(p.name for p in COMPTES_DIR.iterdir()
                      if p.is_dir() and p.name != COMPTE_DEFAUT and RE_COMPTE.fullmatch(p.name))
    except OSError:
        noms = []
    return [{"nom": c, "dossier": str(dossier_compte(c)),
             "connecte": (dossier_compte(c) / ".credentials.json").exists(), "login": _login(c)}
            for c in [COMPTE_DEFAUT, *noms]]


def compte_de(f: Fiche) -> str:
    c = f.get("compte")
    return c if c and isinstance(c, str) else COMPTE_DEFAUT


def verifier_compte(compte: str, connecte: bool = True) -> None:
    d = dossier_compte(compte)
    if not d.is_dir():
        raise CompteErreur("compte-inconnu", f"compte inconnu : {compte} — à créer par toi : {_login(compte)}")
    if connecte and not (d / ".credentials.json").exists():
        raise CompteErreur("compte-deconnecte", f"compte {compte} non connecté — dans ton terminal : {_login(compte)}")


def env_par_compte(compte: str, base: Mapping[str, str] | None = None) -> dict[str, str]:
    """Copie de base (defaut os.environ) pour le compte ; ne verifie pas la connexion."""
    verifier_compte(compte, connecte=False)
    env = dict(base if base is not None else os.environ)
    env.pop("CLAUDE_CONFIG_DIR", None)
    if compte != COMPTE_DEFAUT:
        env["CLAUDE_CONFIG_DIR"] = str(dossier_compte(compte))
    env["AGENTX_COMPTE"] = compte
    return env


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


def uuid_fiable(f: Fiche) -> str | None:
    """session_uuid seulement s'il commence par id_session (sinon uuid d'un homonyme)."""
    u = f.get("session_uuid")
    i = f.get("id_session")
    return u if (isinstance(u, str) and i and u.startswith(i)) else None


def nom_session(slug: str, tid: str, lance: datetime) -> str:
    return f"agentx-{slug}-{tid}-{lance:%Y%m%d-%H%M%S}"


def par_session(session_id: str) -> Fiche | None:
    """Fiche dont id_session et session_id sont préfixes l'un de l'autre, ou dont l'uuid fiable égale session_id ; aucune ⇒ None."""
    for f in lister():
        ids = f.get("id_session")
        if session_id and ids and (session_id.startswith(ids) or ids.startswith(session_id)):
            return f
        if session_id and uuid_fiable(f) == session_id:
            return f
    return None


def sessions(cache_s: float = 5.0) -> list[dict] | None:
    """`claude agents --json --all --cwd ROOT` par compte connecte (+ defaut), fusion par id ; 1 echec ⇒ None ; cache cache_s."""
    if time.monotonic() - _SESSIONS["t"] < cache_s:
        return _SESSIONS["v"]

    def un(c: str) -> list[dict] | None:
        try:
            r = subprocess.run([CLAUDE, "agents", "--json", "--all", "--cwd", str(ROOT)],
                               capture_output=True, text=True, timeout=3, cwd=str(ROOT),
                               env=env_par_compte(c))
            v = json.loads(r.stdout) if r.returncode == 0 else None
        except (OSError, ValueError, subprocess.TimeoutExpired, CompteErreur):
            return None
        if not isinstance(v, list):
            return None
        for s in v:
            if isinstance(s, dict):
                s["compte"] = c
        return v

    comptes = [COMPTE_DEFAUT, *(i["nom"] for i in lister_comptes() if i["connecte"] and i["nom"] != COMPTE_DEFAUT)]
    with ThreadPoolExecutor(max_workers=len(comptes)) as ex:
        parts = list(ex.map(un, comptes))
    v = None
    if all(p is not None for p in parts):
        v, vus = [], set()
        for s in (s for p in parts for s in p):
            i = s.get("id") if isinstance(s, dict) else None
            if isinstance(i, str) and i:
                if i in vus:
                    continue
                vus.add(i)
            v.append(s)
    _SESSIONS.update(t=time.monotonic(), v=v)
    return _SESSIONS["v"]


def _pid_vivant(pid: int | None) -> bool:
    if not pid:
        return False
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, PermissionError, OSError):
        return False


def session_de(f: Fiche, sess: list[dict]) -> dict | None:
    """Session de la fiche par id (ou uuid fiable) ; jamais par nom."""
    i, u = f.get("id_session"), uuid_fiable(f)
    for s in sess:
        if (i and str(s.get("id", "")).startswith(i)) or (u and s.get("sessionId") == u):
            return s
    return None


def etat(f: Fiche, sess: list[dict] | None) -> str:
    """Etat de la session de la fiche, apparie par id. Sans id_session : `inconnu`. Absente de
    `sess` : `stopped`, sauf lancee depuis moins de DELAI_LISTE_S (`claude agents` la liste
    avec retard) ⇒ `inconnu`."""
    if sess is None:
        return "working" if _pid_vivant(f.get("pid")) else "inconnu"
    if not f.get("id_session"):
        return "inconnu"
    s = session_de(f, sess)
    if s:
        return etat_session(s)
    if time.time() - datetime.fromisoformat(f["lance"]).timestamp() < DELAI_LISTE_S:
        return "inconnu"
    return "stopped"


def etat_session(s: dict) -> str:
    """`state` d'une entrée de `claude agents --json`, sinon `status`, sinon "inconnu"."""
    return str(s.get("state") or s.get("status") or "inconnu")


def vivant(e: str) -> bool | None:
    if e in ETATS_VIVANTS:
        return True
    return None if e == "inconnu" else False


def dossier_tache(slug: str, tid: str) -> Path | None:
    d = sorted((ROOT / "vault" / "projets" / slug / "taches").glob(f"{tid}-*"))
    return d[0] if d else None


def statut_tache(slug: str, tid: str) -> str:
    d = dossier_tache(slug, tid)
    if not d or not (d / "task.md").exists():
        return ""
    return str(frontmatter.lire_frontmatter(d / "task.md")[0].get("statut", ""))


def a_rendu(f: Fiche) -> bool:
    d = dossier_tache(f["projet"], f["tid"])
    if not d or not (d / "result.md").exists():
        return False
    lance = datetime.fromisoformat(f["lance"]).timestamp()
    return (d / "result.md").stat().st_mtime >= lance


def mort(f: Fiche, sess: list[dict] | None, maintenant: float | None = None) -> bool:
    """Session non vivante par id, sans result.md, lancee depuis ≥ DELAI_LISTE_S."""
    age = (maintenant or time.time()) - datetime.fromisoformat(f["lance"]).timestamp()
    return vivant(etat(f, sess)) is False and not a_rendu(f) and age >= DELAI_LISTE_S


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
        if not mort(f, sess):
            continue
        e = etat(f, sess)
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
