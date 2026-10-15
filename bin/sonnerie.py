#!/usr/bin/env python3
"""sonnerie — hook SubagentStop : note qu'un agent AgentX vient de rendre.

N'emet aucun son elle-meme : elle ajoute une ligne a run/evenements.jsonl, que
la salle lit dans state.json et joue cote page (bouton cloche, coupable d'un
clic). Un fichier plutot qu'un `paplay` ici : le pilote regarde la salle dans un
navigateur, et un son qu'on ne peut pas couper est un son qu'on finit par hair.

Les agents hors roles AgentX (Explore, general-purpose : les coups de sonde du
chef) ne sonnent pas. Meme convention que garde_dispatch : seule une tache vault
compte comme un agent.

Le texte final d'un executant EST son result.md : son frontmatter donne la tache
et le statut. Rien n'est devine — sans frontmatter, l'evenement dit juste quel
role a rendu.
"""

import json
import re
import secrets
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVENEMENTS = ROOT / "run" / "evenements.jsonl"
MAX_OCTETS = 262_144          # au-dela, on ne garde que les dernieres lignes
RE_TID = re.compile(r"^tache:\s*(T\d{3})", re.M)
RE_STATUT = re.compile(r"^statut:\s*([a-z-]+)", re.M)
RE_VERDICT = re.compile(r"^verdict:\s*(retenir|virer)\b", re.M)
RE_PROJET = re.compile(r"^projet:\s*([a-z0-9][a-z0-9-]{0,47})\s*$", re.M)
RE_CHEMIN = re.compile(r"vault/projets/([a-z0-9][a-z0-9-]{0,47})/taches/")
RE_ROLE_T = re.compile(r"^role:\s*(\S+)", re.M)
RE_STAT_T = re.compile(r"^statut:\s*([a-z-]+)", re.M)


def est_role_agentx(nom: str) -> bool:
    try:
        import roles
        return roles.est_role_agentx(nom)
    except Exception:
        return (ROOT / ".claude" / "agents" / f"{nom}.md").exists()


def projet_de(tete: str, tid: str, role: str) -> str:
    """Slug du projet de l'agent qui rend ; "" si non déterminable. Ne lève jamais."""
    try:
        projets = ROOT / "vault" / "projets"
        m = RE_PROJET.search(tete)
        if m and (projets / m.group(1)).is_dir():
            return m.group(1)
        for m in RE_CHEMIN.finditer(tete):
            if (projets / m.group(1)).is_dir():
                return m.group(1)
        if not tid:
            return ""
        candidats = list(projets.glob(f"*/taches/{tid}/task.md")) + list(projets.glob(f"*/taches/{tid}-*/task.md"))
        textes = {c: c.read_text(encoding="utf-8", errors="replace") for c in candidats}
        garde = [c for c, t in textes.items() if (r := RE_ROLE_T.search(t)) and r.group(1) == role]
        if len(garde) > 1:
            garde = [c for c in garde if (s := RE_STAT_T.search(textes[c])) and s.group(1) == "en-cours"]
        return garde[0].parent.parent.parent.name if len(garde) == 1 else ""
    except Exception:
        return ""     # une notification sans etage ne doit jamais arreter un agent


def main() -> None:
    try:
        entree = json.load(sys.stdin)
    except Exception:
        return
    role = str(entree.get("agent_type", ""))
    if not est_role_agentx(role):
        return

    tete = str(entree.get("last_assistant_message", ""))[:1000]
    tid = RE_TID.search(tete)
    statut = RE_STATUT.search(tete)
    verdict = RE_VERDICT.search(tete)
    bloque = bool(statut) and statut.group(1) == "bloque"
    tid_str = tid.group(1) if tid else ""

    ev = {
        "id": secrets.token_hex(8),
        "t": datetime.now().strftime("%H:%M:%S"),
        "quoi": "agent-bloque" if bloque else "agent-fini",
        "role": role,
        "tid": tid_str,
        "statut": statut.group(1) if statut else "",
        "verdict": verdict.group(1) if verdict else "",
        "projet": projet_de(tete, tid_str, role),
    }
    try:
        EVENEMENTS.parent.mkdir(parents=True, exist_ok=True)
        if EVENEMENTS.exists() and EVENEMENTS.stat().st_size > MAX_OCTETS:
            fin = EVENEMENTS.read_text(encoding="utf-8", errors="replace").splitlines()[-50:]
            EVENEMENTS.write_text("\n".join(fin) + "\n", encoding="utf-8")
        with EVENEMENTS.open("a", encoding="utf-8") as f:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    except OSError:
        pass      # une notification perdue ne doit jamais arreter un agent
    try:
        import voix
        voix.annoncer(ev)
    except Exception:
        pass      # une annonce perdue ne doit jamais arreter un agent


if __name__ == "__main__":
    main()
