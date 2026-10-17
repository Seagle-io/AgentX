#!/usr/bin/env python3
"""garde_vault — hook PreToolUse Write|Edit|MultiEdit : contrat-*.md append-only et gelé par vague.

Séquence : contrat-escalade-syndicat §4. Stdlib + contrats + agents ; ne touche jamais le disque.
Deny = idiome garde_bash (JSON hookSpecificOutput, exit 0) ; chemin non contrat ⇒ silence.
"""

import json
import os
import re
import sys
from pathlib import Path

import agents
import contrats
from contrats import ROOT


def refuser(raison: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                      "permissionDecision": "deny",
                      "permissionDecisionReason": f"GARDE AGENTX — {raison}"}}))
    sys.exit(0)


def apres_de(outil: str, saisie: dict, avant: str) -> str:
    if outil == "Write":
        return saisie["content"]
    edits = saisie["edits"] if outil == "MultiEdit" else [saisie]
    for e in edits:
        avant = avant.replace(e["old_string"], e["new_string"], -1 if e.get("replace_all") else 1)
    return avant


def appelant_de(session_id: str) -> dict | None:
    """Fiche de la session, sinon fiche de l'env AGENTX_TID+AGENTX_PROJET, sinon None (chef)."""
    fiche = agents.par_session(session_id)
    tid, projet = os.environ.get("AGENTX_TID"), os.environ.get("AGENTX_PROJET")
    if fiche is None and tid and projet:
        fiche = agents.lire(projet, tid) or {"role": "", "tid": tid, "projet": projet}
    return fiche


def en_e(fiche: dict, chemin: Path) -> bool:
    """Le pack de la tâche porte `chemin` en droit E."""
    dossier = agents.dossier_tache(fiche["projet"], fiche["tid"])
    if dossier is None or not (dossier / "context.md").is_file():
        return False
    for ligne in (dossier / "context.md").read_text(encoding="utf-8").splitlines():
        if re.search(r"\|\s*E\s*\|", ligne):
            for f in re.findall(r"`([^`\n]+)`", ligne):
                if (ROOT / f.split(":")[0].strip()).resolve() == chemin.resolve():
                    return True
    return False


def version_de(chemin: Path) -> int:
    try:
        return contrats.version(chemin)
    except ValueError:
        return 1


def main() -> None:
    try:
        entree = json.load(sys.stdin)
        outil, saisie = entree["tool_name"], entree["tool_input"]
        chemin = Path(os.path.normpath(ROOT / saisie["file_path"]))
    except (ValueError, KeyError, TypeError):
        refuser("entrée de garde mal formée. Relance l'écriture ; si le refus persiste, "
                "marque la tâche `bloque` dans result.md.")
    if not re.search(contrats.RE_CONTRAT_CHEMIN, chemin.as_posix()) \
            or not chemin.resolve().is_relative_to(ROOT.resolve()):
        sys.exit(0)
    nom, projet = chemin.stem, chemin.parent.parent.name
    fiche = appelant_de(str(entree.get("session_id") or ""))
    avant = chemin.read_text(encoding="utf-8") if chemin.is_file() else ""
    apres = apres_de(outil, saisie, avant)
    n = version_de(chemin)
    raison = contrats.ajout_seul(avant, apres) if avant else None
    if raison:
        refuser(f"{nom} : {raison.replace('corps modifié', f'corps v{n} modifié')}. "
                f"Ajoute un bloc « ## v{n + 1} — AAAA-MM-JJ — raison » et version: {n + 1}.")
    gel = contrats.gele_par(chemin)
    if not gel:
        sys.exit(0)
    en_cours = [t for _, tids in gel for t in tids]
    if fiche and fiche["role"] == "architecte" and fiche["tid"] not in en_cours and en_e(fiche, chemin):
        sys.exit(0)
    qui = f"{fiche['role']} {fiche['tid']}" if fiche else "chef"
    refuser(f"{nom} v{n} gelé par la vague {gel[0][0]} (en-cours : {', '.join(en_cours)}) [appelant : {qui}]. "
            f"Amendement = tâche architecte hors vague : python3 bin/vx.py tache \"Amender {nom} v{n + 1}\" "
            f"--projet {projet} --role architecte. Agent : statut bloque + escalade: contrat dans result.md.")


if __name__ == "__main__":
    main()
