#!/usr/bin/env python3
"""garde_vault — hook PreToolUse Write|Edit|MultiEdit : contrat-*.md append-only et gelé par vague ;
rôles AgentX : Write refusé sur fichier existant, verrou court par fichier (contrat-garde-ecriture).

Séquence : contrat-escalade-syndicat §4. Stdlib + contrats + agents + verrou ; écrit seulement via verrou.poser.
Deny = idiome garde_bash (JSON hookSpecificOutput, exit 0) ; chef (fiche absente) ⇒ silence hors règles contrat.
"""

import json
import os
import re
import sys
from pathlib import Path

import agents
import contrats
import verrou
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


def appelant_de(fiche: dict | None) -> dict | None:
    """Pour les règles contrat seules : fiche de la session, sinon fiche de l'env AGENTX_TID+AGENTX_PROJET, sinon None."""
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


def ecriture_propre(fiche: dict, chemin: Path) -> bool:
    """Write sur fichier existant permis : son result.md, ses .sorties/<projet>/<TID>/, un contrat (règles passées)."""
    dossier = agents.dossier_tache(fiche["projet"], fiche["tid"])
    sorties = ROOT / ".sorties" / fiche["projet"] / fiche["tid"]
    return (dossier is not None and chemin == Path(os.path.normpath(dossier / "result.md"))) \
        or chemin.is_relative_to(sorties) \
        or bool(re.search(contrats.RE_CONTRAT_CHEMIN, chemin.as_posix()))


def via_lien(chemin: Path) -> bool:
    """`chemin` ou un de ses parents dans ROOT est un lien symbolique."""
    p = chemin
    while p != ROOT and p.is_relative_to(ROOT):
        if p.is_symlink():
            return True
        p = p.parent
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
    session = str(entree.get("session_id") or "")
    fiche = agents.par_session(session)
    if re.search(contrats.RE_CONTRAT_CHEMIN, chemin.as_posix()):
        if not chemin.resolve().is_relative_to(ROOT.resolve()):
            refuser(f"{chemin} : contrat hors dépôt, écriture refusée.")
        regles_contrat(outil, saisie, chemin, appelant_de(fiche))
    if fiche is None:
        sys.exit(0)
    rel = chemin.relative_to(ROOT).as_posix() if chemin.is_relative_to(ROOT) else chemin.as_posix()
    if via_lien(chemin):
        refuser(f"{rel} : lien symbolique refusé (arbre partagé).")
    if outil == "Write" and chemin.is_file() and not ecriture_propre(fiche, chemin):
        refuser(f"Write refusé sur {rel} : fichier existant, arbre partagé (pas d'écrasement). "
                "Utilise Edit ou MultiEdit sur la zone à changer, après relecture.")
    try:
        v = verrou.poser(chemin, fiche, session)
    except OSError as e:
        print(f"garde_vault: verrou ignoré ({e})", file=sys.stderr)
        sys.exit(0)
    if v and v["tid"] == "?":
        refuser(f"{rel} : écriture en cours par un autre agent (verrou frais), réessaie dans 1 s")
    if v:
        refuser(f"{rel} en cours d'édition par {v['tid']} ({v['projet']}). "
                f"Réessaie dans {verrou.EXPIRATION_S:.0f} s ; relis le fichier avant ton Edit.")


def regles_contrat(outil: str, saisie: dict, chemin: Path, fiche: dict | None) -> None:
    """Règles contrat-*.md (append-only, gel par vague) ; rend la main si l'écriture est permise."""
    nom, projet = chemin.stem, chemin.parent.parent.name
    avant =chemin.read_text(encoding="utf-8") if chemin.is_file() else ""
    apres = apres_de(outil, saisie, avant)
    n = version_de(chemin)
    raison = contrats.ajout_seul(avant, apres) if avant else None
    if raison:
        refuser(f"{nom} : {raison.replace('corps modifié', f'corps v{n} modifié')}. "
                f"Ajoute un bloc « ## v{n + 1} — AAAA-MM-JJ — raison » et version: {n + 1}.")
    gel = contrats.gele_par(chemin)
    if not gel:
        return
    en_cours = [t for _, tids in gel for t in tids]
    autres_meme_vague = [t for _, tids in gel if fiche and fiche["tid"] in tids
                         for t in tids if t != fiche["tid"]]
    if fiche and fiche["role"] == "architecte" and en_e(fiche, chemin) and not autres_meme_vague:
        return
    qui = f"{fiche['role']} {fiche['tid']}" if fiche else "chef"
    refuser(f"{nom} v{n} gelé par la vague {gel[0][0]} (en-cours : {', '.join(en_cours)}) [appelant : {qui}]. "
            f"Amendement = tâche architecte hors vague : python3 bin/vx.py tache \"Amender {nom} v{n + 1}\" "
            f"--projet {projet} --role architecte. Agent : statut bloque + escalade: contrat dans result.md.")


if __name__ == "__main__":
    main()
