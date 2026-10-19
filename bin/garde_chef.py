#!/usr/bin/env python3
"""garde_chef — hook unique de la session chef (contrat-mesures-chef v1, M1 + M3), aiguillé sur hook_event_name.

PreToolUse Bash : refus de tache/dispatch à ≥ SEUIL_REFUS sans passation récente.
PostToolUse Bash|Read|Grep : marqueur de passation, rappel par palier, avertissement diagnostic (additionalContext).
Fail-open : toute exception ⇒ silence, exit 0. Jamais `permissionDecision: "allow"`. Stdlib + agents + garde_vault + garde_bash.
"""

import contextlib
import fcntl
import json
import os
import re
import shlex
import sys
import time
from pathlib import Path

import agents
import garde_bash
import garde_vault
from contrats import ROOT

SEUIL_RAPPEL = 150_000
SEUIL_REFUS = 200_000
PAS_RAPPEL = 25_000
MARGE_PASSATION = 50_000
QUEUE_OCTETS = 65_536
FRAICHEUR_S = 300
ETAT = ROOT / "run" / "passation"
DERNIER = ETAT / "dernier.json"
DIAG = ROOT / "run" / "diagnostic"

RE_SID = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
RE_CMD = re.compile(r"^[\s(]*(?:env\s+)?(?:\S+=\S*\s+)*(?:(?:\S*/)?(?:python3?|bash|sh)\s+)?"
                    r"(?:\S*/)?(?:agentx|vx\.py)\s+(tache|dispatch|passation)\b(.*)")
RE_CITE = re.compile(r"'[^']*'|\"[^\"]*\"")
RE_SEGMENTS = re.compile(r"&&|\|\||[;&|\n]")
NOMS_VAULT = {"result.md", "context.md", "todo.md", "journal.md", "decisions.md"}
RACINES_PERMISES = {"vault", ".claude", "run", ".sorties"}
LECTEURS = {"cat", "head", "tail", "sed", "rg", "grep", "awk", "nl", "less", "bat", "wc"}

REFUS = ("contexte {k}k ≥ 200k : tache/dispatch refusés. ./bin/agentx passation --projet <slug>, "
         "≤ 5 l. à todo.md, puis dis à l'humain « /clear puis /board ».")
RAPPEL = ("contexte {k}k ≥ 150k : passation maintenant (./bin/agentx passation --projet <slug>, "
          "≤ 5 l. à todo.md), puis « /clear puis /board ». Refus de tache/dispatch à 200k.")
DIAGNOSTIC = ("diagnostic : tâche éclaireur ({rel}) — le chef lit board/integrer/result.md, pas le code. "
              "Avertissement unique pour ce fichier.")


def contexte(transcript: str | None) -> int | None:
    if not transcript:
        return None
    try:
        with open(transcript, "rb") as f:
            taille = f.seek(0, os.SEEK_END)
            debut = max(0, taille - QUEUE_OCTETS)
            f.seek(debut)
            brut = f.read(QUEUE_OCTETS)
    except OSError:
        return None
    lignes = brut.decode("utf-8", errors="replace").split("\n")
    if debut > 0:
        lignes = lignes[1:]
    for ligne in reversed(lignes):
        try:
            ev = json.loads(ligne)
        except ValueError:
            continue
        if not isinstance(ev, dict) or ev.get("type") != "assistant" or ev.get("isSidechain"):
            continue
        message = ev.get("message")
        usage = message.get("usage") if isinstance(message, dict) else None
        if not isinstance(usage, dict) or message.get("model") == "<synthetic>":
            continue
        valeurs = [usage.get(c) or 0 for c in
                   ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens")]
        if all(type(v) is int for v in valeurs):
            return sum(valeurs)
    return None


def commande_chef(cmd: str) -> str | None:
    texte = RE_CITE.sub("''", garde_bash._sans_heredocs(cmd))
    trouves = []
    for segment in RE_SEGMENTS.split(texte):
        m = RE_CMD.match(segment)
        if m and not (m.group(1) == "dispatch" and re.search(r"--etat\b", m.group(2))):
            trouves.append(m.group(1))
    return "passation" if "passation" in trouves else (trouves[0] if trouves else None)


def lire_json(chemin: Path, defaut: dict) -> dict:
    try:
        v = json.loads(chemin.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return defaut
    return v if isinstance(v, dict) else defaut


def ecrire_json(chemin: Path, valeur: dict) -> None:
    chemin.parent.mkdir(parents=True, exist_ok=True)
    tmp = chemin.with_suffix(f".{os.getpid()}.tmp")
    tmp.write_text(json.dumps(valeur), encoding="utf-8")
    os.replace(tmp, chemin)


@contextlib.contextmanager
def verrou(chemin: Path):
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with open(chemin, "w") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        yield


def marquer_dernier(projet: str, lignes: int) -> None:
    ecrire_json(DERNIER, {"projet": projet, "ts": time.time(), "lignes": lignes})


def permis(chemin: Path) -> bool:
    if chemin.name in NOMS_VAULT:
        return True
    if not chemin.is_relative_to(ROOT):
        return ".claude" in chemin.parts
    parts = chemin.relative_to(ROOT).parts
    return bool(parts) and (parts[0] in RACINES_PERMISES or (len(parts) == 1 and chemin.suffix == ".md"))


def chemins_lus(entree: dict) -> list[Path]:
    outil, saisie = entree["tool_name"], entree["tool_input"]
    cwd = Path(entree.get("cwd") or ROOT)
    if outil == "Read":
        brut = [saisie["file_path"]]
    elif outil == "Grep":
        brut = [saisie.get("path") or "."]
    else:
        try:
            lex = shlex.shlex(garde_bash._sans_heredocs(saisie["command"]), posix=True, punctuation_chars=True)
            lex.whitespace_split = True
            mots = []
            for mot in lex:
                if mot and all(c in lex.punctuation_chars for c in mot):
                    break
                mots.append(mot)
        except ValueError:
            return []
        if not mots or os.path.basename(mots[0]) not in LECTEURS \
                or (mots[0] == "sed" and "-n" not in mots[1:]):
            return []
        brut = [m for m in mots[1:] if not m.startswith("-")]
    chemins = [Path(os.path.normpath(cwd / b)) for b in brut]
    return chemins if outil != "Bash" else [c for c in chemins if c.exists()]


def rel_de(chemin: Path) -> str:
    rel = chemin.relative_to(ROOT).as_posix() if chemin.is_relative_to(ROOT) else chemin.as_posix()
    return rel[:60]


def repondre(texte: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": texte}}))


def avant(entree: dict, sid: str, k: int | None) -> None:
    if entree.get("tool_name") != "Bash" or k is None or k < SEUIL_REFUS:
        return
    if commande_chef(entree["tool_input"].get("command", "")) not in ("tache", "dispatch"):
        return
    p = lire_json(ETAT / f"{sid}.json", {}).get("passation")
    if isinstance(p, dict) and k < max(SEUIL_REFUS, int(p.get("ctx") or 0) + MARGE_PASSATION):
        return
    garde_vault.refuser(REFUS.format(k=k // 1000))


def apres(entree: dict, sid: str, k: int | None) -> None:
    etat = lire_json(ETAT / f"{sid}.json", {"rappel": None, "passation": None})
    avis = []
    if entree["tool_name"] == "Bash" and commande_chef(entree["tool_input"].get("command", "")) == "passation":
        dernier = lire_json(DERNIER, {})
        if dernier.get("ts", 0) >= time.time() - FRAICHEUR_S:
            etat["passation"] = {"ts": dernier["ts"], "ctx": k or 0, "projet": dernier.get("projet", "")}
    if k is not None and k >= SEUIL_RAPPEL and (etat.get("rappel") is None or k >= etat["rappel"] + PAS_RAPPEL):
        etat["rappel"] = k
        avis.append("GARDE AGENTX — " + RAPPEL.format(k=k // 1000))
    diag = lire_json(DIAG / f"{sid}.json", {"lus": [], "n": 0})
    nouveaux = []
    for c in chemins_lus(entree):
        rel = rel_de(c)
        if not permis(c) and rel not in diag["lus"] and rel not in nouveaux:
            nouveaux.append(rel)
    for rel in nouveaux[:3]:
        avis.append("GARDE AGENTX — " + DIAGNOSTIC.format(rel=rel))
        diag["lus"].append(rel)
        diag["n"] += 1
    if nouveaux:
        ecrire_json(DIAG / f"{sid}.json", diag)
    ecrire_json(ETAT / f"{sid}.json", etat)
    if avis:
        repondre("\n".join(avis))


def main() -> None:
    try:
        entree = json.load(sys.stdin)
        sid = str(entree.get("session_id") or "")
        evt = entree.get("hook_event_name")
        if os.environ.get("AGENTX_GARDE_CHEF") == "0" or not RE_SID.match(sid) \
                or evt not in ("PreToolUse", "PostToolUse") \
                or entree.get("tool_name") not in ("Bash", "Read", "Grep") \
                or garde_vault.appelant_de(agents.par_session(sid)) is not None:
            return
        k = contexte(entree.get("transcript_path"))
        if evt == "PreToolUse":
            avant(entree, sid, k)
        else:
            with verrou(ETAT / f"{sid}.lock"):
                apres(entree, sid, k)
    except Exception as e:
        print(f"garde_chef: ignoré ({e})", file=sys.stderr)


if __name__ == "__main__":
    main()
