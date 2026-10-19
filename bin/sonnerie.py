#!/usr/bin/env python3
"""sonnerie — hooks SubagentStop et Stop : note qu'un agent AgentX vient de rendre.

N'emet aucun son elle-meme : elle ajoute une ligne a run/evenements.jsonl, que
la salle lit dans state.json et joue cote page (bouton cloche, coupable d'un
clic). Un fichier plutot qu'un `paplay` ici : le pilote regarde la salle dans un
navigateur, et un son qu'on ne peut pas couper est un son qu'on finit par hair.

Les agents hors roles AgentX (Explore, general-purpose : les coups de sonde du
chef) ne sonnent pas. Meme convention que garde_dispatch : seule une tache vault
compte comme un agent. Le chef lui-meme (Stop sans `agent_type`) non plus.

Le texte final d'un executant EST son result.md : son frontmatter donne la tache
et le statut. Rien n'est devine — sans frontmatter, l'evenement dit juste quel
role a rendu. result.md absent et texte a frontmatter ⇒ la sonnerie l'ecrit.

Stop et SubagentStop peuvent tirer tous deux sur un meme agent : un evenement
identique a moins de 60 s n'est pas reecrit. `ecrire_evenement` est le seul
ecrivain du fichier (agents.py l'importe). AGENTX_EVENEMENTS (env) deplace le
fichier, pour les tests.
"""

import json
import os
import re
import secrets
import sys
from datetime import datetime
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parent.parent
EVENEMENTS = Path(os.environ.get("AGENTX_EVENEMENTS") or ROOT / "run" / "evenements.jsonl")
MAX_OCTETS = 262_144          # au-dela, on ne garde que les dernieres lignes
DOUBLON_LIGNES = 20
DOUBLON_SECONDES = 60
CLES_DOUBLON = ("quoi", "role", "tid", "statut")
RE_TID = re.compile(r"^tache:\s*(T\d{3})", re.M)
RE_STATUT = re.compile(r"^statut:\s*([a-z-]+)", re.M)
RE_VERDICT = re.compile(r"^verdict:\s*(retenir|virer)\b", re.M)
RE_PROJET = re.compile(r"^projet:\s*([a-z0-9][a-z0-9-]{0,47})\s*$", re.M)
RE_CHEMIN = re.compile(r"vault/projets/([a-z0-9][a-z0-9-]{0,47})/taches/")
RE_BLOC = re.compile(r"```[a-z]*\n(.*)\n```", re.S)
RE_DISPATCH = re.compile(r"\b(T\d{3}) · projet ([a-z0-9][a-z0-9-]{0,47})")   # 1re ligne du prompt de dispatch


def dispatch_de(entree: dict) -> tuple[str, str]:
    """(tid, projet) lus dans le prompt de dispatch, 1er message du transcript de l'agent.

    Un agent qui rend un résumé en prose n'a pas de frontmatter : sans ça, l'annonce
    ne dit ni la tâche ni le projet. ("", "") si introuvable. Ne lève jamais.
    """
    try:
        chemin = Path(str(entree.get("agent_transcript_path", "")))
        if not chemin.is_file():
            return "", ""
        with chemin.open(encoding="utf-8", errors="replace") as f:
            for _, ligne in zip(range(20), f):
                try:
                    texte = json.dumps(json.loads(ligne), ensure_ascii=False)
                except ValueError:
                    continue
                if m := RE_DISPATCH.search(texte):
                    return m.group(1), m.group(2)
    except Exception:
        pass
    return "", ""


def seule_en_cours(role: str) -> tuple[str, str]:
    """(tid, projet) de l'unique tâche en-cours de ce rôle, tout le vault ; ("", "") si 0 ou plusieurs."""
    try:
        trouves = []
        for t in (ROOT / "vault" / "projets").glob("*/taches/T*/task.md"):
            texte = t.read_text(encoding="utf-8", errors="replace")
            m = frontmatter.lire_frontmatter_texte(texte)[0]
            if str(m.get("role", "")) == role and str(m.get("statut", "")) == "en-cours":
                trouves.append((t.parent.name[:4], t.parent.parent.parent.name))
        return trouves[0] if len(trouves) == 1 else ("", "")
    except Exception:
        return "", ""


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
        garde = [c for c, t in textes.items() if str(frontmatter.lire_frontmatter_texte(t)[0].get("role", "")) == role]
        if len(garde) > 1:
            garde = [c for c in garde if str(frontmatter.lire_frontmatter_texte(textes[c])[0].get("statut", "")) == "en-cours"]
        return garde[0].parent.parent.parent.name if len(garde) == 1 else ""
    except Exception:
        return ""     # une notification sans etage ne doit jamais arreter un agent


def ecrire_result(texte: str, tid: str, projet: str) -> bool:
    """Ecrit le texte final en result.md de la tache s'il est absent et que le texte en est un
    (commence par `---`, porte `tache:` et `statut:`) ; bloc ``` retire s'il l'entoure.
    Ne juge rien : l'agent a rendu sans Write. True si ecrit. Ne leve jamais."""
    try:
        corps = texte.strip()
        if m := RE_BLOC.fullmatch(corps):
            corps = m.group(1).strip()
        if not (tid and projet and corps.startswith("---") and RE_TID.search(corps) and RE_STATUT.search(corps)):
            return False
        import agents
        d = agents.dossier_tache(projet, tid)
        if not d or (d / "result.md").exists():
            return False
        (d / "result.md").write_text(corps + "\n", encoding="utf-8")
        return True
    except Exception:
        return False      # un result non ecrit ne doit jamais arreter un agent


def main() -> None:
    try:
        entree = json.load(sys.stdin)
    except Exception:
        return
    role = str(entree.get("agent_type", ""))
    if not est_role_agentx(role):
        return

    texte = str(entree.get("last_assistant_message", ""))
    tete = texte[:1000]
    tid = RE_TID.search(tete)
    statut = RE_STATUT.search(tete)
    verdict = RE_VERDICT.search(tete)
    bloque = bool(statut) and statut.group(1) == "bloque"
    tid_str = tid.group(1) if tid else ""
    projet = projet_de(tete, tid_str, role)
    if not tid_str or not projet:
        d_tid, d_projet = dispatch_de(entree)
        if not d_tid:
            d_tid, d_projet = seule_en_cours(role)
        tid_str, projet = tid_str or d_tid, projet or d_projet

    ev = {
        "id": secrets.token_hex(8),
        "t": datetime.now().strftime("%H:%M:%S"),
        "quoi": "agent-bloque" if bloque else "agent-fini",
        "role": role,
        "tid": tid_str,
        "statut": statut.group(1) if statut else "",
        "verdict": verdict.group(1) if verdict else "",
        "projet": projet,
    }
    if ecrire_result(texte, tid_str, projet):
        ev["ecrit"] = True
    ecrire_evenement(ev)


def _secondes(t: str) -> int | None:
    try:
        h, m, s = (int(x) for x in t.split(":"))
        return h * 3600 + m * 60 + s
    except ValueError:
        return None


def _doublon(ev: dict) -> bool:
    """Meme (quoi, role, tid, statut) parmi les dernieres lignes, a moins de 60 s. Ne leve jamais."""
    try:
        if not EVENEMENTS.exists() or (t_ev := _secondes(str(ev.get("t", "")))) is None:
            return False
        for ligne in EVENEMENTS.read_text(encoding="utf-8", errors="replace").splitlines()[-DOUBLON_LIGNES:]:
            try:
                ancien = json.loads(ligne)
            except ValueError:
                continue
            if not isinstance(ancien, dict) or any(ancien.get(k) != ev.get(k) for k in CLES_DOUBLON):
                continue
            t_anc = _secondes(str(ancien.get("t", "")))
            if t_anc is not None and min(abs(t_ev - t_anc), 86400 - abs(t_ev - t_anc)) < DOUBLON_SECONDES:
                return True
        return False
    except OSError:
        return False


def ecrire_evenement(ev: dict) -> None:
    """Ajoute `ev` a EVENEMENTS (rotation au-dela de MAX_OCTETS) puis l'annonce. Ne leve jamais."""
    if _doublon(ev):
        return
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
