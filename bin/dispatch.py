#!/usr/bin/env python3
"""dispatch — `agentx dispatch` : lance un agent AgentX detache (`claude --bg`) par tache.

    agentx dispatch <TID> --projet <slug> [--modele X]
    agentx dispatch --vague <TID> [<TID>...] --projet <slug> [--modele X]
    agentx dispatch --relancer <TID> --projet <slug>
    agentx dispatch --etat [--projet <slug>] [--json]

Un agent detache survit a Echap et a la fermeture de la session chef. Les
refus 1-5 sont ceux de garde_dispatch.verifier (une seule implementation) ;
6-8 sont propres a dispatch : role sans fichier .claude/agents/<role>.md, fiche
vivante (DEJA, idempotent), fiche morte ayant rendu sans --relancer. Fiche
morte sans result.md : relancee, meme en vague active.

Sortie : 1 ligne par TID, dans l'ordre. Codes : 0 tous OK|DEJA ; 1 ≥1 KO ; 2 usage.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

import agents
import contrats
import vx
from garde_dispatch import verifier

ROOT = agents.ROOT
AGENTS_MD = Path(__file__).resolve().parent.parent / ".claude" / "agents"   # roles : depot du code
RE_ID = re.compile(r"\b[0-9a-f]{8}\b")
RE_E = re.compile(r"\|\s*E\s*\|")
ATTENTE_RESPAWN_S = 20                      # respawn : session busy|working sous 20 s, sinon idle ⇒ relance neuve
NOTE_IDLE = "respawn idle ⇒ relance neuve"


def frontmatter_tache(dossier: Path) -> dict[str, str]:
    """`modele:` et `effort:` de task.md ; `inherit`, vide ou absent ⇒ cle absente."""
    out = {}
    try:
        task = (dossier / "task.md").read_text(encoding="utf-8")
    except OSError:
        return out
    for cle in ("modele", "effort"):
        m = re.search(rf"^{cle}:\s*(\S+)", task, re.M)
        if m and m.group(1) not in ("", "inherit", "", '""'):
            out[cle] = m.group(1)
    return out


def frontmatter_role(role: str) -> dict[str, str]:
    """`tools:` et `model:` du frontmatter de .claude/agents/<role>.md ; absent ⇒ {}."""
    texte = (AGENTS_MD / f"{role}.md").read_text(encoding="utf-8")
    if not texte.startswith("---"):
        return {}
    bloc = texte[3:].split("\n---", 1)[0]
    out = {}
    for m in re.finditer(r"^(tools|model):\s*(.*)$", bloc, re.M):
        out[m.group(1)] = m.group(2).strip()
    return out


def mode_de(pack: Path) -> str:
    """auto si un chemin E de la whitelist commence par .claude/ (dontAsk y refuse l'ecriture)."""
    brut = pack.read_text(encoding="utf-8")
    lignes = [l for l in brut.splitlines() if RE_E.search(l)]
    for f in vx.fichiers_whitelist(brut):
        if f.startswith(".claude/") and any(f"`{f}" in l for l in lignes):
            return "auto"
    return "dontAsk"


def _racine_depot(chemin: Path) -> Path:
    """Ancetre le plus proche contenant .git (fichier ou dossier) ; sinon le parent."""
    for p in chemin.parents:
        if (p / ".git").exists():
            return p
    return chemin.parent


def dossiers_externes(pack: Path) -> list[str]:
    """Racines des depots hors ROOT cites en absolu dans la WL : tries, dedoublonnes, sans imbrication."""
    racines = set()
    for f in vx.fichiers_whitelist(pack.read_text(encoding="utf-8")):
        if not f.startswith("/") or Path(f).is_relative_to(ROOT):
            continue
        racines.add(str(_racine_depot(Path(f))))
    out: list[str] = []
    for d in sorted(racines):
        if not any(d == o or d.startswith(o + "/") for o in out):
            out.append(d)
    return out


def argv_de(role: str, slug: str, tid: str, dossier: Path, mode: str, tools: list[str],
            modele: str | None, add_dirs: list[str], effort: str | None = None) -> list[str]:
    prompt = (f"{tid} · projet {slug}\n"
              f"pack: vault/projets/{slug}/taches/{dossier.name}/context.md\n"
              "→ lire en entier · exécuter · result.md même dossier, sections « Format de sortie », dense\n"
              "rien d'autre du vault")
    # --add-dir est variadique : en tête, jamais juste avant le prompt (il l'avalerait)
    return [agents.CLAUDE, *[x for d in add_dirs for x in ("--add-dir", d)],
            "--bg", "--agent", role, "--name", f"agentx-{slug}-{tid}",
            "--permission-mode", mode,
            "--settings", json.dumps({"permissions": {"allow": tools}, "worktree": {"bgIsolation": "none"}}),
            *(["--model", modele] if modele else []),
            *(["--effort", effort] if effort else []),
            prompt]


def _set_vx(tid: str, slug: str) -> tuple[int, str]:
    r = subprocess.run([sys.executable, "bin/vx.py", "set", tid, "--statut", "en-cours", "--projet", slug, "--dispatch"],
                       capture_output=True, text=True, cwd=str(ROOT))
    return r.returncode, r.stdout + r.stderr


def _derniere(texte: str) -> str:
    lignes = [l for l in (texte or "").splitlines() if l.strip()]
    return lignes[-1].strip() if lignes else ""


def _resume(raison: str) -> str:
    lignes = [l for l in raison.splitlines() if l.strip()]
    return lignes[0] if len(lignes) < 2 else f"{lignes[0].strip()} {lignes[-1].strip()}"


def _session_de(id_session: str | None, nom: str) -> dict:
    for s in agents.sessions(0) or []:
        if (id_session and str(s.get("id", "")).startswith(id_session)) or s.get("name") == nom:
            return s
    return {}


def _finir(fiche: agents.Fiche, role: str, set_statut) -> tuple[str, str, str]:
    """pret -> en-cours (vx set --dispatch) + evenement `dispatch` : doctor et la todo du chef
    signalent une tache en-cours qui n'en a pas ; la salle s'en sert pour rafraichir."""
    tid, slug = fiche["tid"], fiche["projet"]
    if agents.statut_tache(slug, tid) != "en-cours":
        rc, sortie = set_statut(tid, slug)
        if rc != 0:
            return tid, "KO", f"set en-cours : {_derniere(sortie)} (agent {fiche['id_session'] or fiche['nom']} vivant)"
    agents._ecrire_evenement({"id": secrets.token_hex(8), "t": datetime.now().strftime("%H:%M:%S"),
                              "quoi": "dispatch", "role": role, "tid": tid, "statut": "en-cours",
                              "verdict": "", "projet": slug})
    return tid, "OK", f"{fiche['id_session'] or fiche['nom']} {role} {fiche['mode']}"


def _relancer(fiche: agents.Fiche, role: str, executer, set_statut, maintenant,
              sommeil) -> tuple[str, str, str] | str | None:
    """`claude respawn <id>` : contexte garde ; None ⇒ lancement neuf ; NOTE_IDLE ⇒ lancement neuf,
    la session revenait idle sans prompt (stop + fiche supprimee)."""
    if not fiche.get("id_session"):
        return None
    r = executer([agents.CLAUDE, "respawn", fiche["id_session"]], cwd=str(ROOT), stdin=subprocess.DEVNULL,
                 capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        return None
    for _ in range(ATTENTE_RESPAWN_S):
        s = _session_de(fiche["id_session"], fiche["nom"])
        if (s.get("state") or s.get("status")) in ("busy", "working"):
            fiche.update(lance=maintenant(), pid=s.get("pid"), mort_signale=False)
            agents.ecrire(fiche)
            return _finir(fiche, role, set_statut)
        sommeil(1)
    executer([agents.CLAUDE, "stop", fiche["id_session"]], cwd=str(ROOT), stdin=subprocess.DEVNULL,
             capture_output=True, text=True, timeout=60)
    agents._chemin(fiche["projet"], fiche["tid"]).unlink(missing_ok=True)
    return NOTE_IDLE


def _lancer_un(tid: str, slug: str, modele: str | None, executer, set_statut, maintenant,
               relancer: bool, sommeil=time.sleep) -> tuple[str, str, str]:
    dossier, role, raison = verifier(slug, tid, None)
    if raison:
        return tid, "KO", _resume(raison)
    if not (AGENTS_MD / f"{role}.md").exists():
        return tid, "KO", f"role sans agent : .claude/agents/{role}.md absent"
    fiche = agents.lire(slug, tid)
    note = None
    if fiche:
        if agents.vivant(agents.etat(fiche, agents.sessions(0))) is not False:
            return tid, "DEJA", f"{fiche.get('id_session') or fiche['nom']} {role}"
        if not relancer and agents.a_rendu(fiche):
            return tid, "KO", f"agent mort, result.md rendu : agentx dispatch --relancer {tid}"
        repris = _relancer(fiche, role, executer, set_statut, maintenant, sommeil)
        if isinstance(repris, tuple):
            return repris
        note = repris
    fm = frontmatter_role(role)
    tm = frontmatter_tache(dossier)          # modele/effort de la tache (vx tache, roles.json)
    mode = mode_de(dossier / "context.md")
    tools = [t.strip() for t in fm.get("tools", "").split(",") if t.strip()] or agents.TOOLS_DEFAUT
    modele = modele or tm.get("modele") or (fm.get("model") if fm.get("model") not in ("", "inherit") else None)
    effort = tm.get("effort")
    add_dirs = dossiers_externes(dossier / "context.md")
    try:
        r = executer(argv_de(role, slug, tid, dossier, mode, tools, modele, add_dirs, effort), cwd=str(ROOT),
                     stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=60,
                     env={**os.environ, "AGENTX_TID": tid, "AGENTX_PROJET": slug})
    except subprocess.TimeoutExpired:
        return tid, "KO", "claude --bg : délai 60 s dépassé"
    if r.returncode != 0:
        return tid, "KO", _derniere(r.stderr) or f"claude --bg rc {r.returncode}"
    nom = f"agentx-{slug}-{tid}"
    m = RE_ID.search(r.stdout or "")
    s = _session_de(m.group(0) if m else None, nom)
    fiche = {"id_session": m.group(0) if m else (str(s["id"]) if s.get("id") else None),
             "nom": nom, "pid": s.get("pid"), "role": role, "tid": tid, "projet": slug,
             "lance": maintenant(), "modele": modele, "effort": effort, "mode": mode, "mort_signale": False}
    agents.ecrire(fiche)
    tid, code, detail = _finir(fiche, role, set_statut)
    return (tid, code, f"{detail} ({note})" if note and code == "OK" else detail)


def _vagues() -> list[dict]:
    return [json.loads(f.read_text(encoding="utf-8")) for f in sorted(contrats.VAGUES.glob("*.json"))]


def _active(vague: dict) -> bool:
    return any(agents.statut_tache(vague["projet"], tid) == "en-cours" for tid in vague["taches"])


def _refus_vague(tid: str, slug: str) -> tuple[str, str, str] | None:
    """--relancer refuse en vague active, sauf fiche morte sans result.md : sinon aucune issue."""
    for v in _vagues():
        if v["projet"] == slug and tid in v["taches"] and _active(v):
            fiche = agents.lire(slug, tid)
            if fiche and agents.vivant(agents.etat(fiche, agents.sessions(0))) is False and not agents.a_rendu(fiche):
                return None
            return tid, "KO", f"dans la vague {v['id']} active : relance réservée à un agent mort sans result.md"
    return None


def _purger_vagues(maintenant: str) -> None:
    """Vagues sans tache en-cours et lancees il y a plus de 30 j."""
    limite = datetime.fromisoformat(maintenant) - timedelta(days=30)
    for v in _vagues():
        if datetime.fromisoformat(v["lance"]) < limite and not _active(v):
            (contrats.VAGUES / f"{v['id']}.json").unlink(missing_ok=True)


def lancer(tids: list[str], slug: str, modele: str | None, *, executer=subprocess.run,
           set_statut=None, maintenant=None, relancer: bool = False,
           sommeil=time.sleep) -> list[tuple[str, str, str]]:
    """(TID, OK|DEJA|KO, detail) par TID, dans l'ordre. Injectable pour les tests."""
    set_statut = set_statut or _set_vx
    maintenant = maintenant or (lambda: datetime.now().isoformat(timespec="seconds"))
    agents.purger()
    _purger_vagues(maintenant())
    if relancer:
        return [_refus_vague(tid, slug) or _lancer_un(tid, slug, modele, executer, set_statut, maintenant, True, sommeil)
                for tid in tids]
    res = [_lancer_un(tid, slug, modele, executer, set_statut, maintenant, False, sommeil) for tid in tids]
    ok = [tid for tid, code, _ in res if code in ("OK", "DEJA")]
    if ok:
        contrats.ecrire_vague(slug, ok, maintenant())
    return res


def etat_fiches(slug: str | None, en_json: bool) -> int:
    sess = agents.sessions(0)
    agents.signaler_morts(sess)
    lignes = []
    for f in agents.lister():
        if slug and f["projet"] != slug:
            continue
        e = agents.etat(f, sess)
        lignes.append({"tid": f["tid"], "projet": f["projet"], "role": f["role"],
                       "vivant": agents.vivant(e), "etat": e, "depuis": f["lance"], "id": f.get("id_session")})
    if en_json:
        print(json.dumps(lignes, ensure_ascii=False, indent=1))
    else:
        for l in lignes:
            print(f"{l['tid']} {l['role']} {l['etat']} {l['depuis']} {l['id'] or '-'}")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="agentx dispatch", description=__doc__.split("\n\n")[1],
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("tids", nargs="*", metavar="TID")
    p.add_argument("--projet", metavar="SLUG")
    p.add_argument("--vague", nargs="+", metavar="TID")
    p.add_argument("--relancer", metavar="TID")
    p.add_argument("--etat", action="store_true")
    p.add_argument("--json", action="store_true")
    p.add_argument("--modele", metavar="X")
    a = p.parse_args(argv)
    if a.etat:
        return etat_fiches(a.projet, a.json)
    formes = [x for x in (a.tids, a.vague, [a.relancer] if a.relancer else []) if x]
    if not a.projet or len(formes) != 1:
        p.print_usage(sys.stderr)
        return 2
    rc = 0
    for tid, code, detail in lancer([t.upper() for t in formes[0]], a.projet, a.modele, relancer=bool(a.relancer)):
        print(f"{tid} {code} {detail}")
        rc = rc or (code == "KO")
    return int(rc)


if __name__ == "__main__":
    sys.exit(main())
