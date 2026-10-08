#!/usr/bin/env python3
"""supervision — sante de la prod, erreurs, telemetrie, retours utilisateurs.

Principe tenu sans exception : **aucun chiffre n'est fabrique ici**. Tout vient
de sources que tu declares dans `supervision.json` a la racine du depot. Sans ce
fichier, les quatre panneaux affichent « aucune source » et rappellent quoi
creer. Un tableau de bord qui invente des metriques de prod est pire qu'un
tableau de bord vide : on lui fait confiance.

    {
      "service": "recherche-floue",
      "version": "1.4.2",
      "sondes": [
        {"nom": "api",    "url": "http://127.0.0.1:3000/health", "attendu": 200},
        {"nom": "worker", "fichier": "run/worker.alive", "frais_s": 120}
      ],
      "erreurs":    "logs/erreurs.jsonl",
      "telemetrie": "logs/telemetrie.json",
      "retours":    "logs/retours.jsonl"
    }

Formats attendus (une entree par ligne pour les .jsonl) :
    erreurs    {"ts": "2026-10-04T18:22:11", "niveau": "error",
                "message": "...", "ou": "api/recherche.ts:48"}
    retours    {"ts": "...", "utilisateur": "anon-42", "note": 2, "texte": "..."}
    telemetrie {"maj": "...", "metriques": [{"nom","valeur","unite","delta"}],
                "series": {"p95_ms": [61, 64, ...]}}
"""

from __future__ import annotations

import json
import re
import threading
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
CONFIG = RACINE / "supervision.json"

TTL_SONDES = 20.0          # on ne re-sonde pas a chaque rafraichissement de page
DELAI_SONDE = 2.0          # une prod lente ne doit pas figer le tableau de bord
FENETRE_H = 24             # fenetre d'analyse des erreurs et des retours

_cache: dict = {"t": 0.0, "sondes": []}
_verrou = threading.Lock()


# --------------------------------------------------------------------------- #

def config() -> dict:
    if not CONFIG.exists():
        return {}
    try:
        c = json.loads(CONFIG.read_text(encoding="utf-8"))
        return c if isinstance(c, dict) else {}
    except json.JSONDecodeError as exc:
        return {"_erreur": f"supervision.json illisible : {exc}"}


def _chemin(valeur) -> Path | None:
    if not valeur or not isinstance(valeur, str):
        return None
    p = Path(valeur)
    return p if p.is_absolute() else RACINE / p


def _lignes_json(chemin: Path, limite: int = 5000) -> tuple[list[dict], int]:
    """Lit un .jsonl en tolerant les lignes abimees — et en les comptant."""
    bonnes, mauvaises = [], 0
    for ligne in chemin.read_text(encoding="utf-8", errors="replace").splitlines()[-limite:]:
        ligne = ligne.strip()
        if not ligne:
            continue
        try:
            o = json.loads(ligne)
            bonnes.append(o) if isinstance(o, dict) else None
        except json.JSONDecodeError:
            mauvaises += 1
    return bonnes, mauvaises


def _horodate(o: dict):
    for cle in ("ts", "date", "horodate", "time"):
        v = o.get(cle)
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00").split("+")[0])
            except ValueError:
                pass
    return None


def _recents(objets: list[dict], heures: int):
    """(dans la fenetre, sans horodatage exploitable)"""
    limite = datetime.now() - timedelta(hours=heures)
    dans, sans = [], 0
    for o in objets:
        h = _horodate(o)
        if h is None:
            sans += 1
        elif h >= limite:
            dans.append(o)
    return dans, sans


# --------------------------------------------------------------------------- #
# 1. sante de la prod
# --------------------------------------------------------------------------- #

def _sonde(s: dict) -> dict:
    nom = str(s.get("nom", "?"))
    debut = time.monotonic()
    try:
        if s.get("url"):
            url = str(s["url"])
            if not url.startswith(("http://", "https://")):
                return {"nom": nom, "etat": "config", "detail": "url non http(s)"}
            req = urllib.request.Request(url, method="GET",
                                         headers={"User-Agent": "agentx-supervision"})
            with urllib.request.urlopen(req, timeout=DELAI_SONDE) as r:
                code = r.status
            ms = int((time.monotonic() - debut) * 1000)
            attendu = int(s.get("attendu", 200))
            ok = code == attendu
            return {"nom": nom, "etat": "ok" if ok else "ko", "ms": ms,
                    "detail": f"HTTP {code}" + ("" if ok else f" ≠ {attendu}")}

        if s.get("fichier"):
            f = _chemin(s["fichier"])
            if not f or not f.exists():
                return {"nom": nom, "etat": "ko", "detail": "fichier absent"}
            age = time.time() - f.stat().st_mtime
            frais = float(s.get("frais_s", 300))
            return {"nom": nom, "etat": "ok" if age <= frais else "ko",
                    "detail": f"touché il y a {int(age)} s" + ("" if age <= frais else f" > {int(frais)} s")}

        return {"nom": nom, "etat": "config", "detail": "ni url ni fichier"}

    except urllib.error.HTTPError as exc:
        return {"nom": nom, "etat": "ko", "ms": int((time.monotonic()-debut)*1000),
                "detail": f"HTTP {exc.code}"}
    except Exception as exc:                       # réseau coupé, DNS, timeout…
        return {"nom": nom, "etat": "ko", "detail": type(exc).__name__.lower()}


def sondes(cfg: dict) -> list[dict]:
    liste = cfg.get("sondes") or []
    if not isinstance(liste, list) or not liste:
        return []
    maintenant = time.monotonic()
    if maintenant - _cache["t"] < TTL_SONDES and _cache["sondes"]:
        return _cache["sondes"]

    # Verrou non reentrant : si une sonde vise ce serveur, la requete imbriquee
    # retombe ici et doit rendre le cache au lieu de relancer un tour de sondes
    # — sinon on recurse jusqu'au timeout. Protege aussi des sondages paralleles.
    if not _verrou.acquire(blocking=False):
        return _cache["sondes"]
    try:
        res = [_sonde(s) for s in liste[:12] if isinstance(s, dict)]
        _cache.update(t=time.monotonic(), sondes=res)
        return res
    finally:
        _verrou.release()


# --------------------------------------------------------------------------- #
# 2. erreurs   3. telemetrie   4. retours
# --------------------------------------------------------------------------- #

def _normaliser(message: str) -> str:
    """Regroupe les occurrences d'une meme erreur : nombres et ids ecrases."""
    m = re.sub(r"\b[0-9a-f]{8,}\b", "<id>", message.lower())
    m = re.sub(r"\b\d+\b", "<n>", m)
    return re.sub(r"\s+", " ", m).strip()[:120]


def erreurs(cfg: dict) -> dict:
    f = _chemin(cfg.get("erreurs"))
    if not f:
        return {"source": None}
    if not f.exists():
        return {"source": str(cfg.get("erreurs")), "absent": True}
    objets, abimees = _lignes_json(f)
    recents, sans_ts = _recents(objets, FENETRE_H)
    niveaux = Counter(str(o.get("niveau", "error")).lower() for o in recents)
    groupes = Counter(_normaliser(str(o.get("message", "?"))) for o in recents)
    exemple = {}
    for o in recents:
        exemple.setdefault(_normaliser(str(o.get("message", "?"))), o)
    top = [{"message": str(exemple[g].get("message", g))[:110],
            "ou": str(exemple[g].get("ou", "")), "n": n}
           for g, n in groupes.most_common(5)]
    dernier = recents[-1] if recents else None
    return {
        "source": str(cfg.get("erreurs")), "absent": False,
        "fenetre_h": FENETRE_H, "total": len(recents),
        "par_heure": round(len(recents) / FENETRE_H, 1),
        "niveaux": dict(niveaux), "top": top,
        "lignes_abimees": abimees, "sans_horodatage": sans_ts,
        "dernier": {"message": str(dernier.get("message", ""))[:110],
                    "ou": str(dernier.get("ou", "")),
                    "quand": str(dernier.get("ts", ""))[:19]} if dernier else None,
    }


def telemetrie(cfg: dict) -> dict:
    f = _chemin(cfg.get("telemetrie"))
    if not f:
        return {"source": None}
    if not f.exists():
        return {"source": str(cfg.get("telemetrie")), "absent": True}
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return {"source": str(cfg.get("telemetrie")), "illisible": str(exc)}
    metriques = [m for m in (d.get("metriques") or []) if isinstance(m, dict)][:6]
    series = {k: [v for v in s if isinstance(v, (int, float))][-60:]
              for k, s in (d.get("series") or {}).items() if isinstance(s, list)}
    return {"source": str(cfg.get("telemetrie")), "absent": False,
            "maj": str(d.get("maj", ""))[:19], "metriques": metriques,
            "series": dict(list(series.items())[:3])}


def retours(cfg: dict) -> dict:
    f = _chemin(cfg.get("retours"))
    if not f:
        return {"source": None}
    if not f.exists():
        return {"source": str(cfg.get("retours")), "absent": True}
    objets, abimees = _lignes_json(f)
    recents, sans_ts = _recents(objets, FENETRE_H * 7)        # une semaine
    notes = [o["note"] for o in recents
             if isinstance(o.get("note"), (int, float)) and 1 <= o["note"] <= 5]
    distrib = Counter(int(n) for n in notes)
    derniers = [{"note": o.get("note"), "texte": str(o.get("texte", ""))[:140],
                 "qui": str(o.get("utilisateur", "anonyme"))[:24],
                 "quand": str(o.get("ts", ""))[:16]}
                for o in recents[-6:]][::-1]
    return {
        "source": str(cfg.get("retours")), "absent": False,
        "total": len(recents), "notes": len(notes),
        "moyenne": round(sum(notes) / len(notes), 2) if notes else None,
        "distribution": {str(k): distrib.get(k, 0) for k in range(1, 6)},
        "mecontents": sum(1 for n in notes if n <= 2),
        "derniers": derniers, "lignes_abimees": abimees, "sans_horodatage": sans_ts,
    }


# --------------------------------------------------------------------------- #

def depots(cfg: dict) -> list[dict]:
    """Etat git reel des depots declares (`"depots": ["~/chemin", ...]`).
    Rien n'est invente : chemin absent ou pas un depot -> dit tel quel."""
    import os
    import subprocess
    out = []
    for brut in cfg.get("depots") or []:
        chemin = os.path.expanduser(str(brut))
        d = {"nom": os.path.basename(chemin.rstrip("/")), "chemin": chemin}
        if not os.path.isdir(os.path.join(chemin, ".git")):
            d.update(etat="ko", detail="pas un dépôt git (ou chemin absent)")
            out.append(d)
            continue

        def git(*args: str) -> str:
            try:
                return subprocess.run(["git", "-C", chemin, *args], capture_output=True,
                                      text=True, timeout=4).stdout.strip()
            except Exception:
                return ""

        branche = git("rev-parse", "--abbrev-ref", "HEAD")
        statut = git("status", "--porcelain")
        modifies = len([l for l in statut.splitlines() if l.strip()])
        ab = git("rev-list", "--left-right", "--count", "HEAD...@{upstream}")
        avance, retard = (ab.split() + ["?", "?"])[:2] if ab else ("?", "?")
        dernier = git("log", "-1", "--format=%h %cr · %s")
        d.update(branche=branche, modifies=modifies, avance=avance, retard=retard,
                 dernier=dernier[:90],
                 etat=("ko" if retard not in ("0", "?") else "warn" if modifies else "ok"))
        out.append(d)
    return out


def etat() -> dict:
    cfg = config()
    if not cfg:
        return {"configure": False, "fichier": str(CONFIG.relative_to(RACINE))}
    if cfg.get("_erreur"):
        return {"configure": False, "fichier": str(CONFIG.relative_to(RACINE)),
                "erreur": cfg["_erreur"]}
    liste = sondes(cfg)
    ko = [s for s in liste if s["etat"] == "ko"]
    return {
        "configure": True,
        "service": str(cfg.get("service", "—")),
        "version": str(cfg.get("version", "—")),
        "sondes": liste,
        "verdict": ("—" if not liste else "ko" if ko else "ok"),
        "ko": len(ko),
        "erreurs": erreurs(cfg),
        "telemetrie": telemetrie(cfg),
        "retours": retours(cfg),
        "depots": depots(cfg),
    }


def suggestions(sup: dict, slug: str) -> list[dict]:
    """Ce que la prod reclame au chef : erreurs recurrentes, clients mecontents.

    Rendu comme des entrees de todo a copier — ouvrir une tache engage un
    jugement, la page ne le fait pas a ta place.
    """
    out = []
    if not sup.get("configure"):
        return out

    for s in sup.get("sondes", []):
        if s["etat"] == "ko":
            out.append({"prio": 1, "etiquette": "URGENT",
                        "titre": f"Prod : {s['nom']} ne répond pas",
                        "detail": f"{s.get('detail', '')} — avant toute nouvelle vague",
                        "cmd": f"agentx tache \"Rétablir {s['nom']}\" --projet {slug} "
                               f"--role eclaireur", "exe": None})

    err = sup.get("erreurs") or {}
    for e in (err.get("top") or [])[:2]:
        if e["n"] >= 3:
            out.append({"prio": 2, "etiquette": "À FAIRE",
                        "titre": f"Erreur récurrente ×{e['n']}",
                        "detail": (e["message"] + (f" — {e['ou']}" if e["ou"] else ""))[:100],
                        "cmd": f"agentx tache \"Corriger : {e['message'][:40]}\" "
                               f"--projet {slug} --role eclaireur", "exe": None})

    ret = sup.get("retours") or {}
    if ret.get("mecontents"):
        out.append({"prio": 3, "etiquette": "PRÊT",
                    "titre": f"{ret['mecontents']} retour(s) à 1 ou 2 étoiles",
                    "detail": "lis-les avant de planifier la suite — ils disent où ça coince",
                    "cmd": f"agentx tache \"Dépouiller les retours négatifs\" "
                           f"--projet {slug} --role eclaireur", "exe": None})
    return out


if __name__ == "__main__":
    print(json.dumps(etat(), ensure_ascii=False, indent=2))
