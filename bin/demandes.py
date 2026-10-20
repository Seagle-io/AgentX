#!/usr/bin/env python3
"""Hook Claude Code UserPromptSubmit de la session chef : chaque prompt humain
   ⇒ 1 ligne `run/demandes.jsonl`. Ignorés : agent détaché, relais, `/…`, `!…`.
   Sortie stdout vide, exit 0 toujours."""
import json, os, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

RUN_DIR = Path(os.environ.get("AGENTX_RUN_DIR") or Path(__file__).resolve().parent.parent / "run")
FICHIER = RUN_DIR / "demandes.jsonl"


def prochain_id(lignes):
    ids = [int(l["id"][1:]) for l in lignes if str(l.get("id", "")).startswith("D")]
    return f"D{max(ids, default=0) + 1:03d}"


def lire():
    if not FICHIER.exists():
        return []
    lignes = []
    for l in FICHIER.read_text(encoding="utf-8").splitlines():
        try:
            lignes.append(json.loads(l))
        except ValueError:
            continue
    return lignes


def ecrire(lignes):
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    tmp = FICHIER.with_suffix(".tmp")
    tmp.write_text("".join(json.dumps(l, ensure_ascii=False) + "\n" for l in lignes), encoding="utf-8")
    os.replace(tmp, FICHIER)


def journaliser(prompt, session):
    from parle_hook import est_relais
    if os.environ.get("AGENTX_TID") or not prompt.strip() or est_relais(prompt):
        return None
    if prompt.startswith(("/", "!")):
        return None
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    ligne = {"id": prochain_id(lire()), "t": time.strftime("%Y-%m-%dT%H:%M:%S"),
             "texte": prompt, "statut": "ouverte", "session": session}
    with open(FICHIER, "a", encoding="utf-8") as f:
        f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
    return ligne


def traiter(lignes, session_id):
    """ouverte ∧ (session == session_id ∨ session_id == "") ⇒ traitee ; renvoie n modifiées ; écrit si n > 0."""
    n = 0
    for l in lignes:
        if l.get("statut") == "ouverte" and (not session_id or l.get("session") == session_id):
            l["statut"] = "traitee"
            l["traitee_t"] = time.strftime("%Y-%m-%dT%H:%M:%S")
            n += 1
    if n:
        ecrire(lignes)
    return n


def main():
    try:
        data = json.load(sys.stdin)
        if "--traitees" in sys.argv[1:]:
            if not os.environ.get("AGENTX_TID"):
                traiter(lire(), data.get("session_id") or "")
        else:
            journaliser(data.get("prompt") or "", data.get("session_id") or "")
    except Exception:   # un hook de prompt ne doit jamais gêner l'humain
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
