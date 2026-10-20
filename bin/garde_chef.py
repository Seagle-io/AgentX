#!/usr/bin/env python3
"""garde_chef — hook unique de la session chef, aiguillé sur hook_event_name. Contexte plein jamais bloquant.

PreCompact : passation sur disque (todo, journal, plan.md) de chaque étage du chef (AGENTX_CHEF), stdout ∅.
SessionStart compact|clear : bloc de reprise (reprise.bloc, disque seul) en additionalContext ; startup|resume ⇒ ∅.
PostToolUse Bash|Read|Grep : avertissement diagnostic (additionalContext).
PostToolUse (tout outil, chef non agent) : tokens du contexte → run/contexte/<cle>.json, lu par la salle (indicateur seul).
Fail-open : toute exception ⇒ silence, exit 0. Stdlib + agents + garde_vault + garde_bash ; reprise importé à la demande.
"""

import contextlib
import fcntl
import json
import os
import re
import shlex
import sys
from datetime import datetime
from pathlib import Path

import agents
import garde_bash
import garde_vault
from contrats import ROOT

QUEUE_OCTETS = 65_536
DIAG = ROOT / "run" / "diagnostic"
CONTEXTE = ROOT / "run" / "contexte"

RE_SID = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
NOMS_VAULT = {"result.md", "context.md", "todo.md", "journal.md", "decisions.md"}
RACINES_PERMISES = {"vault", ".claude", "run", ".sorties"}
LECTEURS = {"cat", "head", "tail", "sed", "rg", "grep", "awk", "nl", "less", "bat", "wc"}

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


def repondre(evt: str, texte: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": evt, "additionalContext": texte}}))


def apres(entree: dict, sid: str) -> None:
    diag = lire_json(DIAG / f"{sid}.json", {"lus": [], "n": 0})
    nouveaux = []
    for c in chemins_lus(entree):
        rel = rel_de(c)
        if not permis(c) and rel not in diag["lus"] and rel not in nouveaux:
            nouveaux.append(rel)
    for rel in nouveaux[:3]:
        diag["lus"].append(rel)
        diag["n"] += 1
    if nouveaux:
        ecrire_json(DIAG / f"{sid}.json", diag)
        repondre("PostToolUse", "\n".join("GARDE AGENTX — " + DIAGNOSTIC.format(rel=rel) for rel in nouveaux[:3]))


def noter_contexte(entree: dict, cle: str) -> None:
    tokens = contexte(entree.get("transcript_path"))
    if tokens is not None:
        ecrire_json(CONTEXTE / f"{cle or 'defaut'}.json",
                    {"tokens": tokens, "t": datetime.now().isoformat(timespec="seconds")})


def main() -> None:
    try:
        entree = json.load(sys.stdin)
        sid = str(entree.get("session_id") or "")
        evt = entree.get("hook_event_name")
        if not RE_SID.match(sid) or garde_vault.appelant_de(agents.par_session(sid)) is not None:
            return
        cle = os.environ.get("AGENTX_CHEF") or ""
        if evt == "PreCompact":
            import reprise
            reprise.passer(cle)
        elif evt == "SessionStart" and entree.get("source") in ("compact", "clear"):
            import reprise
            repondre("SessionStart", reprise.bloc(cle, entree["source"]))
        elif evt == "PostToolUse":
            noter_contexte(entree, cle)
            if os.environ.get("AGENTX_GARDE_CHEF") != "0" and entree.get("tool_name") in ("Bash", "Read", "Grep"):
                with verrou(DIAG / f"{sid}.lock"):
                    apres(entree, sid)
    except Exception as e:
        print(f"garde_chef: ignoré ({e})", file=sys.stderr)


if __name__ == "__main__":
    main()
