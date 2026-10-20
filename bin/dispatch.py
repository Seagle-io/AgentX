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
import hashlib
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
import frontmatter
import terminal
import vx
from garde_dispatch import verifier

ROOT = agents.ROOT
BIN = Path(__file__).resolve().parent
ATTENTES = ROOT / "run" / "attentes"
AGENTS_MD = Path(__file__).resolve().parent.parent / ".claude" / "agents"   # roles : depot du code
RE_ID = re.compile(r"\b[0-9a-f]{8}\b")
RE_E = re.compile(r"\|\s*E\s*\|")
ATTENTE_RESPAWN_S = 20                      # respawn : session vivante (agents.ETATS_VIVANTS) sous 20 s, sinon idle ⇒ relance neuve
NOTE_IDLE = "respawn idle ⇒ relance neuve"
RE_REPONSE = re.compile(r"^## Réponse du chef(?: — .*)?\s*$", re.M)
_CHEFS: list[dict] | None = None            # lister_chefs, relu au-dela de _CHEFS_TTL
_CHEFS_T = 0.0                              # time.monotonic() du dernier lister_chefs
_CHEFS_TTL = 2.0


def compte_lancement(slug: str) -> tuple[str, str | None]:
    """(compte, refus) : compte du chef tenant le projet ; refus si la session chef appelante n'est pas ce tenant.
    Aucun chef joignable ou projet sans tenant ⇒ ("defaut", None) : shell humain libre."""
    global _CHEFS, _CHEFS_T
    if _CHEFS is None or time.monotonic() - _CHEFS_T > _CHEFS_TTL:
        try:
            _CHEFS = terminal.lister_chefs(str(ROOT), delai=0.5)
        except Exception:
            _CHEFS = []
        _CHEFS_T = time.monotonic()
    t = terminal.tenant_de_projet(_CHEFS, slug)
    if t is None:
        return "defaut", None
    appelant = os.environ.get("AGENTX_CHEF")
    if appelant and appelant != t["cle"]:
        return t["compte"], f"projet {slug} tenu par le chef {t['cle']} : dispatch refusé depuis le chef {appelant}"
    return t["compte"], None


def frontmatter_tache(dossier: Path) -> dict[str, str]:
    """`modele:` et `effort:` de task.md ; `inherit`, vide ou absent ⇒ cle absente."""
    out = {}
    try:
        meta = frontmatter.lire_frontmatter(dossier / "task.md")[0]
    except OSError:
        return out
    for cle in ("modele", "effort"):
        v = meta.get(cle)
        if isinstance(v, str) and v.strip() not in ("", "inherit"):
            out[cle] = v.strip()
    return out


def frontmatter_role(role: str) -> dict[str, str]:
    """`tools:` et `model:` du frontmatter de .claude/agents/<role>.md ; absent ⇒ {}."""
    meta = frontmatter.lire_frontmatter(AGENTS_MD / f"{role}.md")[0]
    return {k: (", ".join(meta[k]) if isinstance(meta[k], list) else str(meta[k])).strip()
            for k in ("tools", "model") if k in meta}


def mode_de(pack: Path) -> str:
    """auto si un chemin E de la whitelist commence par .claude/ (dontAsk y refuse l'ecriture)."""
    brut = pack.read_text(encoding="utf-8", errors="replace")
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
    for f in vx.fichiers_whitelist(pack.read_text(encoding="utf-8", errors="replace")):
        if not f.startswith("/") or Path(f).is_relative_to(ROOT):
            continue
        racines.add(str(_racine_depot(Path(f))))
    out: list[str] = []
    for d in sorted(racines):
        if not any(d == o or d.startswith(o + "/") for o in out):
            out.append(d)
    return out


def argv_de(role: str, slug: str, tid: str, dossier: Path, mode: str, tools: list[str],
            modele: str | None, add_dirs: list[str], effort: str | None = None, nom: str = "") -> list[str]:
    prompt = (f"{tid} · projet {slug}\n"
              f"pack: vault/projets/{slug}/taches/{dossier.name}/context.md\n"
              "→ lire en entier · exécuter · result.md même dossier, sections « Format de sortie », dense\n"
              "rien d'autre du vault")
    # --add-dir est variadique : en tête, jamais juste avant le prompt (il l'avalerait)
    return [agents.CLAUDE, *[x for d in add_dirs for x in ("--add-dir", d)],
            "--bg", "--agent", role, "--name", nom,
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


def _session_de(id_session: str | None) -> dict:
    if not id_session:
        return {}
    for s in agents.sessions(0) or []:
        if str(s.get("id", "")).startswith(id_session):
            return s
    return {}


def _finir(fiche: agents.Fiche, role: str, set_statut) -> tuple[str, str, str]:
    """pret -> en-cours (vx set --dispatch) + evenement `dispatch` : doctor et la todo du chef
    signalent une tache en-cours qui n'en a pas ; la salle s'en sert pour rafraichir."""
    tid, slug = fiche["tid"], fiche["projet"]
    if agents.statut_tache(slug, tid) != "en-cours":
        rc, sortie = set_statut(tid, slug)
        if rc != 0:
            return tid, "KO", f"set en-cours : {_derniere(sortie)} (agent {fiche['id_session']} vivant)"
    agents._ecrire_evenement({"id": secrets.token_hex(8), "t": datetime.now().strftime("%H:%M:%S"),
                              "quoi": "dispatch", "role": role, "tid": tid, "statut": "en-cours",
                              "verdict": "", "projet": slug})
    return tid, "OK", f"{fiche['id_session']} {role} {fiche['mode']}"


def _relancer(fiche: agents.Fiche, role: str, executer, set_statut, maintenant,
              sommeil) -> tuple[str, str, str] | str | None:
    """`claude respawn <id>` : contexte garde ; None ⇒ lancement neuf ; NOTE_IDLE ⇒ lancement neuf,
    la session revenait idle sans prompt (stop + fiche supprimee)."""
    c = agents.compte_de(fiche)
    try:
        agents.verifier_compte(c)
        env = agents.env_par_compte(c)
    except agents.CompteErreur:
        return None
    r = executer([agents.CLAUDE, "respawn", fiche["id_session"]], cwd=str(ROOT), stdin=subprocess.DEVNULL,
                 capture_output=True, text=True, timeout=60, env=env)
    if r.returncode != 0:
        return None
    for _ in range(ATTENTE_RESPAWN_S):
        s = _session_de(fiche["id_session"])
        if agents.vivant(agents.etat_session(s)) is True:
            fiche.update(lance=maintenant(), pid=s.get("pid"), mort_signale=False)
            agents.ecrire(fiche)
            return _finir(fiche, role, set_statut)
        sommeil(1)
    executer([agents.CLAUDE, "stop", fiche["id_session"]], cwd=str(ROOT), stdin=subprocess.DEVNULL,
             capture_output=True, text=True, timeout=60, env=env)
    agents._chemin(fiche["projet"], fiche["tid"]).unlink(missing_ok=True)
    return NOTE_IDLE


def _prompt_reponse(tid: str, slug: str, dossier: Path) -> str:
    return (f"{tid} · projet {slug}\n"
            f"réponse du chef : vault/projets/{slug}/taches/{dossier.name}/result.md § « Réponse du chef »\n"
            "→ lire · reprendre là où tu t'es arrêté · result.md append-only : ajoute « ## Livré (reprise) », "
            "« ## Vérifié comment (reprise) », statut revue | fait | bloque\n"
            "rien d'autre du vault")


def _sha_pack(dossier: Path) -> str:
    return hashlib.sha256((dossier / "context.md").read_bytes()).hexdigest()[:16]


def _reprendre_bloque(tid: str, slug: str, dossier: Path, set_statut, executer,
                      maintenant) -> tuple[str, str, str]:
    """Exception règle 4 : `claude --bg --resume <session>` + prompt vers `## Réponse du chef`, 1 fois, pack inchangé."""
    fiche = agents.lire(slug, tid)
    resultat = dossier / "result.md"
    if not resultat.exists() or not RE_REPONSE.search(resultat.read_text(encoding="utf-8", errors="replace")):
        return tid, "KO", "## Réponse du chef absent de result.md : vx repondre"
    cible = agents.uuid_fiable(fiche) or fiche.get("id_session") if fiche else None
    if not cible:
        return tid, "KO", "fiche ou session introuvable : virer"
    if _sha_pack(dossier) != fiche.get("pack_sha"):
        return tid, "KO", "pack modifié depuis le lancement : virer"
    if fiche.get("repris", 0) >= 1:
        return tid, "KO", "déjà repris 1 fois : virer"
    _, _, raison = verifier(slug, tid, None, relance_bloque=True)
    if raison:
        return tid, "KO", raison
    c = agents.compte_de(fiche)
    try:
        agents.verifier_compte(c)
        env = agents.env_par_compte(c, {**os.environ, "AGENTX_TID": tid, "AGENTX_PROJET": slug})
    except agents.CompteErreur as exc:
        return tid, "KO", str(exc)
    try:
        r = executer([agents.CLAUDE, "--bg", "--resume", cible,
                      _prompt_reponse(tid, slug, dossier)], cwd=str(ROOT), stdin=subprocess.DEVNULL,
                     capture_output=True, text=True, timeout=60, env=env)
    except subprocess.TimeoutExpired:
        return tid, "KO", "claude --bg --resume : délai 60 s dépassé"
    if r.returncode != 0:
        return tid, "KO", _derniere(r.stderr) or f"claude --bg --resume rc {r.returncode}"
    fiche.update(repris=1, lance=maintenant(), mort_signale=False)
    agents.ecrire(fiche)
    rc, sortie = set_statut(tid, slug)
    if rc != 0:
        return tid, "KO", f"set en-cours : {_derniere(sortie)} (agent {fiche['id_session']} repris)"
    agents._ecrire_evenement({"id": secrets.token_hex(8), "t": datetime.now().strftime("%H:%M:%S"),
                              "quoi": "reponse", "role": fiche["role"], "tid": tid, "statut": "en-cours",
                              "verdict": "", "projet": slug})
    return tid, "OK", f"{fiche['id_session']} {fiche['role']} repris"


def _lancer_un(tid: str, slug: str, modele: str | None, executer, set_statut, maintenant,
               relancer: bool, sommeil=time.sleep) -> tuple[str, str, str]:
    compte, refus = compte_lancement(slug)
    if refus:
        return tid, "KO", refus
    if relancer and agents.statut_tache(slug, tid) == "bloque":
        return _reprendre_bloque(tid, slug, agents.dossier_tache(slug, tid), set_statut, executer, maintenant)
    dossier, role, raison = verifier(slug, tid, None)
    if raison:
        return tid, "KO", _resume(raison)
    if not (AGENTS_MD / f"{role}.md").exists():
        return tid, "KO", f"role sans agent : .claude/agents/{role}.md absent"
    fiche = agents.lire(slug, tid)
    note = None
    if fiche:
        e = agents.etat(fiche, agents.sessions(0))
        i = fiche.get("id_session")
        if relancer and agents.vivant(e) is True:
            return tid, "KO", f"agent vivant ({i}) : --relancer refusé ; attendre ou virer (claude logs {i})"
        if relancer and e == "inconnu":
            return tid, "KO", f"état inconnu ({i or 'sans id'}) : réessayer après 60 s ; claude logs {i}" if i \
                else "état inconnu (sans id) : virer"
        if not relancer and agents.vivant(e) is not False:
            return tid, "DEJA", f"{i or fiche['nom']} {role}"
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
    lance = maintenant()
    nom = agents.nom_session(slug, tid, datetime.fromisoformat(lance))
    try:
        agents.verifier_compte(compte)
        env = agents.env_par_compte(compte, {**os.environ, "AGENTX_TID": tid, "AGENTX_PROJET": slug})
    except agents.CompteErreur as exc:
        return tid, "KO", str(exc)
    try:
        r = executer(argv_de(role, slug, tid, dossier, mode, tools, modele, add_dirs, effort, nom), cwd=str(ROOT),
                     stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=60,
                     env=env)
    except subprocess.TimeoutExpired:
        return tid, "KO", "claude --bg : délai 60 s dépassé"
    if r.returncode != 0:
        return tid, "KO", _derniere(r.stderr) or f"claude --bg rc {r.returncode}"
    m = RE_ID.search(r.stdout or "")
    if not m:
        return tid, "KO", f"claude --bg : id de session absent de la sortie (fiche non écrite) : {_derniere(r.stdout)}"
    s = _session_de(m.group(0))
    uuid = s.get("sessionId") if str(s.get("sessionId", "")).startswith(m.group(0)) else None
    fiche = {"id_session": m.group(0),
             "nom": nom, "pid": s.get("pid"), "role": role, "tid": tid, "projet": slug,
             "lance": lance, "modele": modele, "effort": effort, "mode": mode, "mort_signale": False,
             "pack_sha": _sha_pack(dossier), "session_uuid": uuid, "repris": 0, "compte": compte}
    agents.ecrire(fiche)
    tid, code, detail = _finir(fiche, role, set_statut)
    return (tid, code, f"{detail} ({note})" if note and code == "OK" else detail)


def _vagues() -> list[dict]:
    return [json.loads(f.read_text(encoding="utf-8", errors="replace")) for f in sorted(contrats.VAGUES.glob("*.json"))]


def _active(vague: dict) -> bool:
    return any(agents.statut_tache(vague["projet"], tid) == "en-cours" for tid in vague["taches"])


def _refus_vague(tid: str, slug: str) -> tuple[str, str, str] | None:
    """--relancer refuse en vague active, sauf fiche morte sans result.md (sinon aucune issue)
    ou tache bloque : _reprendre_bloque juge elle-meme."""
    for v in _vagues():
        if v["projet"] == slug and tid in v["taches"] and _active(v):
            fiche = agents.lire(slug, tid)
            if agents.statut_tache(slug, tid) == "bloque":
                return None
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


def recouvrements(slug: str, tids: list[str]) -> list[tuple[str, str, str, str]]:
    """(tid_a, tid_b, chemin_a, chemin_b) : paires dont ≥ 1 TID ∈ tids, comparées à tids ∪ TID en-cours des
    vagues actives du projet (_vagues + _active). Chemins = vx.whitelist_droits(context.md) droit "E" ;
    paire retenue si vx.se_touchent(a, b). Pack/dossier absent ⇒ TID ignoré. Ordre : tids puis TID tiers triés."""
    tiers = {t for v in _vagues() if v["projet"] == slug and _active(v)
             for t in v["taches"] if agents.statut_tache(slug, t) == "en-cours"} - set(tids)
    wl = {}
    for tid in [*tids, *sorted(tiers)]:
        d = agents.dossier_tache(slug, tid)
        if d and (d / "context.md").exists():
            wl[tid] = [c for c, droit in vx.whitelist_droits((d / "context.md").read_text(encoding="utf-8", errors="replace"))
                       if droit == "E"]
    ordre = list(wl)
    return [(a, b, ca, cb)
            for i, a in enumerate(ordre) for b in ordre[i + 1:] if a in tids
            for ca in wl[a] for cb in wl[b] if vx.se_touchent(ca, cb)]


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
                       "vivant": agents.vivant(e), "etat": e, "depuis": f["lance"], "id": f.get("id_session"), "nom": f.get("nom")})
    if en_json:
        print(json.dumps(lignes, ensure_ascii=False, indent=1))
    else:
        for l in lignes:
            print(f"{l['tid']} {l['role']} {l['etat']} {l['depuis']} {l['id'] or '-'} {l['nom'] or '-'}")
    return 0


def attendre_en_fond(tids: list[str], slug: str, popen=subprocess.Popen, maintenant=None) -> Path | None:
    """Lance `attendre <tids> --projet slug --tout --integrer` détaché ; sortie dans ATTENTES/<slug>-<horodatage>.log.
    None si tids vide ou AGENTX_SANS_ATTENTE."""
    if not tids or os.environ.get("AGENTX_SANS_ATTENTE"):
        return None
    ATTENTES.mkdir(parents=True, exist_ok=True)
    log = ATTENTES / f"{slug}-{(maintenant or datetime.now)().strftime('%Y%m%d-%H%M%S')}.log"
    with log.open("a", encoding="utf-8") as sortie:
        popen([sys.executable, str(BIN / "attendre.py"), *tids, "--projet", slug, "--tout", "--integrer"],
              cwd=str(ROOT), env={**os.environ}, start_new_session=True,
              stdin=subprocess.DEVNULL, stdout=sortie, stderr=sortie)
    return log


LIGNE_REVEIL = "réveil chef : ./bin/agentx attendre {tids} --projet {slug} --tout --integrer --sans-relance  (Bash run_in_background)"


def ligne_reveil(tids: list[str], slug: str) -> str:
    return LIGNE_REVEIL.format(tids=" ".join(tids), slug=slug)


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
    tids = [t.upper() for t in formes[0]]
    r = recouvrements(a.projet, tids) if a.vague else []
    rc = 0
    res = lancer(tids, a.projet, a.modele, relancer=bool(a.relancer))
    for tid, code, detail in res:
        print(f"{tid} {code} {detail}")
        rc = rc or (code == "KO")
    ok = [tid for tid, code, _ in res if code in ("OK", "DEJA")]
    log = attendre_en_fond(ok, a.projet)
    if log:
        print(f"attente en fond : {log.relative_to(ROOT)}")
        print(ligne_reveil(ok, a.projet))
    for ta, tb, ca, cb in r:
        print(f"~ {ta} ∩ {tb} : {ca if ca == cb else f'{ca} ↔ {cb}'}")
    if r:
        print(f"dispatch: {len(r)} recouvrement(s) de WL E — Write refusé, Edit sous verrou ; vérifie le découpage",
              file=sys.stderr)
    return int(rc)


if __name__ == "__main__":
    sys.exit(main())
