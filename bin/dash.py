#!/usr/bin/env python3
"""dash — tableau de bord live du vault AgentX.

Sert une page animee qui lit l'etat reel du vault toutes les 2 s.
Zero dependance (http.server). Si le vault est vide, bascule sur un etat de
DEMO clairement marque, pour que le pilote voie a quoi ressemble la salle.

    python3 bin/dash.py              # http://127.0.0.1:7777
    python3 bin/dash.py --port 8080
    python3 bin/dash.py --json       # imprime l'etat et sort (debug)
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import secrets
import subprocess
import statistics
import sys
import threading
import time
import webbrowser
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agents  # noqa: E402
import produits  # noqa: E402
import rh  # noqa: E402
import roles as _roles  # noqa: E402
import supervision  # noqa: E402
import terminal as _terminal  # noqa: E402
import voix  # noqa: E402
from frontmatter import lire_frontmatter  # noqa: E402
from vx import (  # noqa: E402
    ROOT, VAULT, PACK_MAX_FICHIERS, PACK_MAX_LIGNES, PACK_SECTIONS, PRET_SANS_AGENT_S, STATUTS,
    champ, deaccent, evenements_par_tache, lister_projets, lister_taches,
    sans_agent, _citer_motif,
    a_clore, _depuis_txt, est_front, fichiers_whitelist, controles_manquants,
)

WEB = ROOT / "apps/web/dist"
TERM = _terminal.TerminalClient(cwd=str(ROOT))   # demon detache : survit aux relances
BATTEMENT = ROOT / "run" / "salle.alive"
EVENEMENTS = ROOT / "run" / "evenements.jsonl"   # ecrit par bin/sonnerie.py
EPINGLE = ROOT / "run" / "projet"               # `agentx --projet <slug>` : projet pilote par la salle
_dernier_battement = 0.0


def battre():
    """Trace de vie de la salle, pour qu'une sonde puisse la surveiller.

    Ecrite au plus toutes les 10 s, et jamais bloquante : si le disque refuse,
    le tableau de bord continue de servir.
    """
    global _dernier_battement
    maintenant = time.monotonic()
    if maintenant - _dernier_battement < 10:
        return
    _dernier_battement = maintenant
    try:
        BATTEMENT.parent.mkdir(parents=True, exist_ok=True)
        BATTEMENT.write_text(datetime.now().isoformat(timespec="seconds"), encoding="utf-8")
    except OSError:
        pass

ORDRE_PIPELINE = ["a-faire", "pret", "en-cours", "revue", "bloque", "fait", "rejete"]


def _registre() -> list:
    """Rôles de roles.json, ordre fichier ; [] si invalide (registre_erreur le dit)."""
    try:
        return list(_roles.charger().values())
    except _roles.RegistreInvalide:
        return []


def _carte(r) -> dict:
    """Champs d'un rôle recopiés du registre dans state.json."""
    return {"cle": r.cle, "nom": r.nom, "sous": r.sous, "label": r.livrable,
            "couleur": r.couleur, "modele": r.modele, "affectable": r.affectable,
            "livre_en": r.livre_en, "juge": r.juge, "objet": r.objet}

# --------------------------------------------------------------------------- #
# execution de commandes depuis la page
#
# Une page web qui lance du shell, ca se cadre. Les regles, dans l'ordre :
#   1. liste blanche d'actions — jamais de chaine de commande venue du client ;
#   2. chaque argument est valide (regex, appartenance a un ensemble connu) ;
#   3. pas de shell : on passe un argv a subprocess ;
#   4. jeton par demarrage, exige dans un en-tete -> impossible a forger depuis
#      une autre page (l'en-tete force un preflight CORS qui echouera) ;
#   5. l'hote doit etre local -> bloque le DNS rebinding ;
#   6. rien de destructeur : ni creation, ni suppression, ni archivage. Ce qui
#      engage (ecrire un pack, dispatcher) reste dans Claude Code.
# --------------------------------------------------------------------------- #

JETON = secrets.token_hex(16)
HOTES_OK = ("127.0.0.1", "localhost", "[::1]", "::1")

ACTIONS_LECTURE = ("board", "ready", "doctor", "index")
RE_TID = re.compile(r"T[0-9]{3}")
RE_SLUG = re.compile(r"[a-z0-9][a-z0-9-]{0,47}")


def _slugs_connus() -> set[str]:
    return {p.name for p in lister_projets()}


def _projet_connu(projet: str) -> str:
    if not RE_SLUG.fullmatch(projet) or projet not in _slugs_connus():
        raise ValueError(f"projet inconnu : {projet}")
    return projet


RE_DOC = re.compile(r"vault/[A-Za-z0-9_./-]+\.md")
DOC_MAX = 262_144


def lire_doc(chemin: str) -> tuple[int, dict]:
    """Texte d'un .md du vault, lecture seule."""
    if not RE_DOC.fullmatch(chemin) or ".." in chemin or "//" in chemin:
        return 400, {"erreur": "chemin invalide"}
    f = (ROOT / chemin).resolve()
    if not f.is_file() or not f.is_relative_to((ROOT / "vault").resolve()):
        return 404, {"erreur": "doc introuvable"}
    texte = f.read_text(encoding="utf-8")
    charge = {"chemin": chemin, "texte": texte[:DOC_MAX]}
    if len(texte) > DOC_MAX:
        charge["tronque"] = True
    return 200, charge


def lire_tache(slug: str, tid: str) -> dict | None:
    """Ticket en lecture seule : en-tete de task.md, pack, rendu eventuel."""
    d = agents.dossier_tache(slug, tid)
    if not d:
        return None
    meta, _ = lire_frontmatter(d / "task.md")
    lire = lambda f: (d / f).read_text(encoding="utf-8") if (d / f).exists() else None
    return {"tid": tid, "projet": slug, "titre": str(meta.get("titre", "")),
            "role": str(meta.get("role", "")), "statut": str(meta.get("statut", "")),
            "pack": lire("context.md") or "", "result": lire("result.md")}


def construire_argv(req: dict) -> list[str]:
    """Traduit une requete validee en argv pour vx.py. Leve ValueError sinon.

    `retenir --sans-eval` n'est jamais construit ici : le chef l'assume en CLI.
    """
    action = str(req.get("action", ""))

    if action in ACTIONS_LECTURE:
        argv = [action]
        projet = req.get("projet")
        if projet and action in ("board", "ready"):
            argv += ["--projet", _projet_connu(str(projet))]
        return argv

    if action == "personnel":
        projet = str(req.get("projet") or "")
        return ["personnel"] + (["--projet", _projet_connu(projet)] if projet else [])

    if action == "integrer":
        projet = _projet_connu(str(req.get("projet", "")))
        tid = str(req.get("tid") or "")
        if tid and not RE_TID.fullmatch(tid):
            raise ValueError(f"identifiant de tache invalide : {tid}")
        return ["integrer"] + ([tid] if tid else []) + ["--projet", projet]

    if action in ("set", "virer", "retenir"):
        tid = str(req.get("tid", ""))
        projet = str(req.get("projet", ""))
        if not RE_TID.fullmatch(tid):
            raise ValueError(f"identifiant de tache invalide : {tid}")
        _projet_connu(projet)
        if action == "retenir":
            return ["retenir", tid, "--projet", projet]
        if action == "virer":
            motif = req.get("motif")
            if not isinstance(motif, str):
                raise ValueError("motif invalide : texte attendu")
            motif = motif.strip()
            if not 1 <= len(motif) <= 200 or re.search(r"[\x00-\x1f]", motif):
                raise ValueError("motif invalide : 1 ligne, 1 a 200 caracteres")
            argv = ["virer", tid, "--motif", motif, "--projet", projet]
            role = str(req.get("role") or "")
            if role:
                if role not in _roles.affectables():
                    raise ValueError(f"role invalide : {role}")
                argv += ["--role", role]
            modele = str(req.get("modele") or "")
            if modele:
                if modele not in _roles.MODELES:
                    raise ValueError(f"modele invalide : {modele}")
                argv += ["--modele", modele]
            return argv
        statut = str(req.get("statut", ""))
        if statut not in STATUTS or statut == "rejete":
            raise ValueError(f"statut invalide : {statut}")
        return ["set", tid, "--statut", statut, "--projet", projet]

    raise ValueError(f"action refusee : {action or '(vide)'}")


def _tete(texte: str, n: int) -> str:
    """Garde le debut : l'en-tete de board est l'essentiel."""
    if len(texte) <= n:
        return texte
    return texte[:n] + f"\n… {len(texte) - n} caractères tronqués\n"


_EXECUTION = threading.Lock()   # ThreadingHTTPServer : une commande vx a la fois


def executer(req: dict) -> dict:
    argv = construire_argv(req)
    with _EXECUTION:
        p = subprocess.run([sys.executable, str(ROOT / "bin" / "vx.py"), *argv],
                           capture_output=True, text=True, timeout=25, cwd=str(ROOT))
    return {
        "commande": "vx.py " + " ".join(argv),
        "code": p.returncode,
        "out": _tete(p.stdout, 40000),
        "err": _tete(p.stderr, 4000),
    }


# --------------------------------------------------------------------------- #
# lecture de l'etat reel
# --------------------------------------------------------------------------- #

def _journal(proj: Path, limite: int | None = 60) -> list[tuple[str, str]]:
    f = proj / "journal.md"
    if not f.exists():
        return []
    out = []
    for ligne in f.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^- `([\d\- :]+)`\s*(.*)$", ligne.strip())
        if m:
            out.append((m.group(1), m.group(2)))
    return out if limite is None else out[-limite:]


OUVERTES = ("a-faire", "pret", "en-cours", "bloque", "revue")
FINS = ("revue", "fait", "bloque")


def _estimation(jr: list[tuple[str, str]], lignes: list[dict]) -> dict:
    """Durée moyenne par rôle (en-cours -> première fin, même TID) et reste estimé en minutes.

    Durées hors [1 min, 24 h] ignorées (relance, pause). Dernier `en-cours` -> première fin suivante.
    """
    debut: dict[str, datetime] = {}
    role_de = {l["id"]: l["role"] for l in lignes}
    mesures: dict[str, list[float]] = {}
    for h, txt in jr:
        m = re.match(r"^(\S+) statut \S+ -> (\S+)", txt)
        if not m:
            continue
        tid, vers = m.groups()
        t = datetime.strptime(h, "%Y-%m-%d %H:%M")
        if vers == "en-cours":
            debut[tid] = t
        elif vers in FINS and tid in debut:
            minutes = (t - debut.pop(tid)).total_seconds() / 60
            if 1 <= minutes <= 1440 and tid in role_de:
                mesures.setdefault(role_de[tid], []).append(minutes)
    ouvertes: dict[str, int] = {}
    for l in lignes:
        if l["statut"] in OUVERTES:
            ouvertes[l["role"]] = ouvertes.get(l["role"], 0) + 1
    moy = {r: sum(v) / len(v) for r, v in mesures.items()}
    sans = [r for r in ouvertes if r not in moy]
    par_role, reste = {}, 0.0
    for r, k in ouvertes.items():
        m = moy.get(r)
        if m is None and moy:
            m = statistics.median(v for q, v in moy.items() if q != r)
        reste += k * (m or 0)
        par_role[r] = {"ouvertes": k, "moy_min": None if m is None else round(m, 1),
                       "n_mesures": len(mesures.get(r, []))}
    total = sum(ouvertes.values())
    if not moy:
        return {"ouvertes": total, "par_role": par_role, "reste_min": None, "fiabilite": "∅"}
    rang = {"basse": 0, "moyenne": 1, "haute": 2}
    niveaux = ["basse" if r in sans else
               "haute" if p["n_mesures"] >= 5 else "moyenne" if p["n_mesures"] >= 2 else "basse"
               for r, p in par_role.items()]
    return {"ouvertes": total, "par_role": par_role,
            "reste_min": round(reste, 1),
            "fiabilite": min(niveaux, key=rang.get, default="haute")}


def _evenements(etage_de: dict[str, str], limite: int = 12) -> list[dict]:
    """Derniers agents a avoir rendu, ecrits par le hook bin/sonnerie.py.

    C'est la source de la sonnerie de la salle : la page compare cette liste a
    ce qu'elle connait deja et joue un bip par nouveaute. Lu par la fin, pour
    que le fichier puisse grossir sans couter.
    """
    try:
        with EVENEMENTS.open("rb") as f:
            f.seek(0, 2)
            f.seek(max(0, f.tell() - 8192))
            lignes = f.read().decode("utf-8", "replace").splitlines()
    except OSError:
        return []
    out = []
    for ligne in lignes:
        try:
            ev = json.loads(ligne)      # 1re ligne tronquee par le seek : ignoree
        except ValueError:
            continue
        # un dispatch n'est pas un rendu : la page le sonnerait « a terminé »
        if isinstance(ev, dict) and ev.get("id") and ev.get("quoi") != "dispatch":
            ev.setdefault("projet", "")     # evenement d'avant l'immeuble : sans etage
            ev.setdefault("etage", etage_de.get(ev["projet"], ""))
            out.append(ev)
    return out[-limite:]


def _analyse_pack(chemin: Path) -> dict:
    """Mesure un pack comme le ferait pack-lint, mais sans faire echouer."""
    if not chemin.exists():
        return {}
    brut = chemin.read_text(encoding="utf-8")
    texte = deaccent(brut)
    fichiers = fichiers_whitelist(brut)
    dod = re.search(r"##\s*Definition of Done(.*?)(?=\n## |\Z)", brut, re.S)
    hors = re.search(r"##\s*Hors p\S*rim\S*tre(.*?)(?=\n## |\Z)", brut, re.S)
    contrats = re.search(r"##\s*Contrats(.*?)(?=\n## |\Z)", brut, re.S)
    return {
        "lignes": len(brut.splitlines()),
        "tokens": int(len(brut) / 3.6),
        "fichiers": len(fichiers),
        "front": any(est_front(f) for f in fichiers),
        "sections": sum(1 for s in PACK_SECTIONS if s in texte),
        "marqueurs": ("<!-- A REMPLIR" in texte) or ("TODO-PACK" in texte),
        "dod_cochable": bool(dod and re.search(r"^\s*-\s*\[ \]", dod.group(1), re.M)),
        "dod_cases": len(re.findall(r"^\s*-\s*\[ \]", dod.group(1), re.M)) if dod else 0,
        "hors_perimetre": bool(hors and len(hors.group(1).strip()) > 12
                               and "A REMPLIR" not in deaccent(hors.group(1))),
        "contrats_recopies": bool(contrats and "```" in contrats.group(1)),
    }


def _etat_role(cle: str, taches: list, packs: list[dict], vivants: set[str]) -> dict:
    """Jauge + etat textuel d'un role, derives des taches reelles.

    Un poste peut etre tenu par PLUSIEURS agents a la fois : deux implementeurs
    sur des fichiers disjoints, c'est le cas normal d'une vague. `actifs` compte
    les instances en cours ; la salle affiche une mascotte par instance.

    `vivants` : TID dont la fiche run/agents/ repond vivante. Le vault dit le
    statut, la fiche dit la vivacite : une tache en-cours sans agent vivant
    n'allume pas la silhouette (elle remonte dans la todo URGENT).

    Le chef fait exception et reste toujours seul : `chef` n'est pas un role de
    tache (voir ROLES dans vx.py), donc aucune tache ne peut lui etre affectee,
    et `vx doctor` signale un `role: chef` ecrit a la main comme role inconnu.
    """
    miennes = [m for _, m in taches if str(m.get("role")) == cle]
    total = len(miennes)
    faites = sum(1 for m in miennes if str(m.get("statut")) == "fait")
    en_cours = [str(m.get("id")) for m in miennes
                if str(m.get("statut")) == "en-cours" and str(m.get("id")) in vivants]
    bloque = any(str(m.get("statut")) == "bloque" for m in miennes)

    if cle == "chef":
        # Mesure sur ses packs, pas sur des taches qu'il executerait.
        total = len(taches)
        faites = sum(1 for p in packs if p.get("sections") == len(PACK_SECTIONS)
                     and not p.get("marqueurs"))
        en_cours = ["pack"] if faites < total else []   # jamais plus d'un
        bloque = False

    actif = bool(en_cours)
    # Un agent qui tourne prime : « bloqué » seul masquerait le travail en cours.
    etat = ("au travail" if actif else "bloqué" if bloque
            else "terminé" if total and faites == total else "en attente")
    return {
        "total": total, "faits": faites, "actif": actif, "bloque": bloque,
        "actifs": len(en_cours), "en_cours": en_cours,
        "jauge": round(faites / total, 3) if total else 0.0, "etat": etat,
    }


# --------------------------------------------------------------------------- #
# immeuble : un etage par produit (ses projets agreges), resume en cache, un seul
# projet detaille ; registre produits invalide -> un etage par projet ouvert
# --------------------------------------------------------------------------- #

DORMANCE_J = 7
PLAFOND_CHEF = 40                              # plafond de `todo` agrégée
ARCHIVE = VAULT / "archive"
_CACHE: dict[str, tuple[tuple, dict]] = {}     # slug -> (signature, bloc)
_CACHE_TOIT: tuple[tuple, dict] | None = None   # (signatures de tous les étages, blocs du toit)
_CACHE_VERROU = threading.Lock()               # ThreadingHTTPServer


def _signature(proj: Path) -> tuple:
    """Empreinte d'un étage : (chemin, mtime_ns, taille) des fichiers qu'il fait lire.

    os.stat seulement : c'est ce qui permet de ne relire un étage que s'il a bougé.
    os.scandir + chemins str plutôt que pathlib : 600 tâches = 1 800 stat par étage.
    """
    racine = str(proj)
    fichiers = [(n, os.path.join(racine, n)) for n in ("brief.md", "journal.md", "todo.md")]
    try:
        with os.scandir(os.path.join(racine, "taches")) as it:
            for d in it:
                fichiers += [(f"taches/{d.name}/{n}", os.path.join(d.path, n))
                             for n in ("task.md", "context.md", "result.md")]
    except OSError:                 # pas de taches/ : même résultat que glob vide
        pass
    out = []
    for rel, chemin in fichiers:
        try:
            st = os.stat(chemin)
        except OSError:
            continue
        out.append((rel, st.st_mtime_ns, st.st_size))
    return tuple(sorted(out))


def _empreinte_evenements() -> tuple:
    """Un dispatch noté change la todo sans toucher l'étage : il entre dans la clé du cache."""
    try:
        st = EVENEMENTS.stat()
    except OSError:
        return ()
    return (st.st_mtime_ns, st.st_size)


def _bloc_projet(proj: Path, sig: tuple | None = None) -> dict:
    """Tout ce qu'un étage coûte à lire, recalculé seulement si sa signature change,
    si un événement arrive, ou quand une tâche prête franchit 15 min sans agent.

    Un bloc stocké est partagé entre requêtes : il n'est jamais muté.
    `sig` : signature déjà calculée par l'appelant (un seul stat par fichier et par tick).
    """
    if sig is None:
        sig = _signature(proj)
    cle = (sig, _empreinte_evenements())
    with _CACHE_VERROU:
        connu = _CACHE.get(proj.name)
    if connu and connu[0] == cle and time.time() < connu[1]["echeance"]:
        return connu[1]

    bmeta, _ = lire_frontmatter(proj / "brief.md")
    taches = lister_taches(proj)
    statuts = {str(m.get("id")): str(m.get("statut", "a-faire")) for _, m in taches}

    # verdict d'évaluation : dernière tâche evaluateur faite qui dépend de la tâche
    resultats = {str(m.get("id")): _analyse_result(d / "result.md") for d, m in taches}
    evals: dict[str, str] = {}
    for _, m in taches:
        if str(m.get("role")) == "evaluateur" and str(m.get("statut")) == "fait":
            deps = m.get("deps") or []
            for dep in (deps if isinstance(deps, list) else [deps]):
                evals[dep] = max(evals.get(dep, ""), str(m.get("id")))

    packs, lignes_taches = [], []
    for d, m in taches:
        a = _analyse_pack(d / "context.md")
        packs.append(a)
        tid, role = str(m.get("id")), str(m.get("role"))
        res = resultats[tid]
        ev = evals.get(tid, "")
        lint = ("—" if not a else
                "FAIL" if (a["marqueurs"] or a["sections"] < len(PACK_SECTIONS)
                           or a["lignes"] > PACK_MAX_LIGNES
                           or a["fichiers"] > PACK_MAX_FICHIERS) else "PASS")
        deps = m.get("deps") or []
        deps = deps if isinstance(deps, list) else [deps]
        ligne = {
            "id": tid, "titre": champ(m, "titre", ""),
            "role": role, "statut": str(m.get("statut", "a-faire")),
            "lint": lint, "tokens": a.get("tokens", 0), "fichiers": a.get("fichiers", 0),
            "bloquee": any(not _roles.dep_satisfaite(statuts.get(x, ""), role) for x in deps),
            "verdict": res.get("verdict", ""),
            "front": a.get("front", False),
            # pack jamais touché (gabarit intact) : à écrire, pas à réparer
            "vierge": bool(a.get("marqueurs", True)) and a.get("fichiers", 0) == 0,
            "modele": champ(m, "modele", ""), "livre_en": _roles.livre_en(role),
            "remplace": champ(m, "remplace", ""), "remplacee_par": champ(m, "remplacee_par", ""),
            "motif": champ(m, "motif", ""),
            "evalue": str(deps[0]) if role == "evaluateur" and deps else "",
            "eval": ev,
            "eval_verdict": resultats[ev].get("decision", "") if ev else "",
            "eval_motif": resultats[ev].get("motif", "") if ev else "",
            "result": (d / "result.md").exists(),
        }
        ligne["actions"] = _actions_tache(ligne, proj.name)
        lignes_taches.append(ligne)

    bloc = {
        "slug": proj.name,
        "activite": max((ns for _, ns, _ in sig), default=0) / 1e9,
        "bmeta": bmeta, "taches": taches, "statuts": statuts, "packs": packs,
        "lignes": lignes_taches,
        "estimation": _estimation(_journal(proj, None), lignes_taches),
        "todo": [{**i, "projet": proj.name} for i in _todo(proj, taches, lignes_taches)],
        "compteurs": {k: sum(1 for _, m in taches if str(m.get("statut", "a-faire")) == k)
                      for k in STATUTS},
        "echeance": min((e for d, m in taches if str(m.get("statut")) == "pret"
                         and (e := (d / "task.md").stat().st_mtime + PRET_SANS_AGENT_S) > time.time()),
                        default=float("inf")),
    }
    with _CACHE_VERROU:
        _CACHE[proj.name] = (cle, bloc)
    return bloc


def _toit(projets: list[Path], sigs: dict[str, tuple]) -> dict:
    """Blocs du toit (RH, doctor, clôtures) : ils relisent tous les étages, on ne les
    recalcule que si l'un a bougé. Jamais mutés une fois stockés.

    Clé : signatures de tous les étages + mtime de vault/archive (RH la lit) + jour
    (« il y a N jours » des clôtures).
    """
    global _CACHE_TOIT
    try:
        archive = ARCHIVE.stat().st_mtime_ns
    except OSError:
        archive = 0
    cle = (tuple(sorted(sigs.items())), archive, datetime.now().strftime("%Y-%m-%d"))
    with _CACHE_VERROU:
        connu = _CACHE_TOIT
    if connu and connu[0] == cle:
        return connu[1]
    bloc = {"personnel": _personnel(), "doctor": _doctor_rapide(projets), "clore": _todo_clore()}
    with _CACHE_VERROU:
        _CACHE_TOIT = (cle, bloc)
    return bloc


def _age_j(bloc: dict, maintenant: float) -> float:
    return max(0.0, round((maintenant - bloc["activite"]) / 86400, 1))


def _dormant(bloc: dict, sel: str, maintenant: float) -> bool:
    """C2 : vieux de plus de DORMANCE_J, rien en vol, et pas l'étage regardé."""
    c = bloc["compteurs"]
    return (_age_j(bloc, maintenant) > DORMANCE_J and bloc["slug"] != sel
            and c["pret"] + c["en-cours"] + c["revue"] + c["bloque"] == 0)


def _ordre(blocs: dict, sel: str, maintenant: float) -> list[str]:
    """Rang des étages : non dormants d'abord, activité décroissante, slug croissant."""
    return sorted(blocs, key=lambda s: (_dormant(blocs[s], sel, maintenant),
                                        -blocs[s]["activite"], s))


def _quand(epoch: float) -> str:
    return datetime.fromtimestamp(epoch).strftime("%Y-%m-%d %H:%M")


def _bloc_produit(prod: "produits.Produit | None", blocs: list[dict], sel: str, maintenant: float) -> dict:
    """Un étage = la somme de ses projets ouverts, lue dans les blocs en cache (0 IO).

    prod None (registre invalide) : `blocs` = le seul projet de l'étage, comme T019.
    sel = projet détaillé. Rend l'étage sans rang ni num ; `todo` = les items, pas leur nombre.
    """
    blocs = sorted(blocs, key=lambda b: (-b["activite"], b["slug"]))
    c = {k: sum(b["compteurs"][k] for b in blocs) for k in STATUTS}
    todo = [i for b in blocs for i in b["todo"]]
    urgent = next((i for i in todo if i["prio"] == 1), None)
    n_choix = sum(1 for i in todo if i["prio"] == 0)
    activite = max((b["activite"] for b in blocs), default=0.0)
    if prod:
        slug, titre, statut = prod.cle, prod.nom, prod.etat
    else:
        slug = blocs[0]["slug"]
        titre, statut = champ(blocs[0]["bmeta"], "titre", slug), champ(blocs[0]["bmeta"], "statut", "?")
    return {
        "slug": slug, "titre": titre, "statut": statut,
        "activite": _quand(activite) if blocs else "",
        "age_j": min((_age_j(b, maintenant) for b in blocs), default=0.0),
        "dormant": all(_dormant(b, sel, maintenant) for b in blocs),     # 0 projet : dormant
        "compteurs": c, "total": sum(len(b["taches"]) for b in blocs),
        "todo": todo,
        "alerte": ({"niveau": "bloque", "texte": f"{c['bloque']} bloquée(s)"} if c["bloque"]
                   else {"niveau": "choix", "texte": f"{n_choix} question(s) pour vous"} if n_choix
                   else {"niveau": "urgent", "texte": urgent["titre"]} if urgent
                   else {"niveau": "", "texte": ""}),
        "produit": {"cle": prod.cle, "couleur": prod.couleur, "entreprise": prod.entreprise} if prod else None,
        "projets": [{"slug": b["slug"], "titre": champ(b["bmeta"], "titre", b["slug"]),
                     "statut": champ(b["bmeta"], "statut", "?"), "activite": _quand(b["activite"]),
                     "encours": b["compteurs"]["en-cours"], "revue": b["compteurs"]["revue"],
                     "bloque": b["compteurs"]["bloque"], "actif": b["slug"] == sel} for b in blocs],
        "selectionnable": bool(blocs),
    }


def _branche(chemin: str) -> str | None:
    """Branche lue dans <chemin>/.git/HEAD (ou `.git` fichier `gitdir: X`) ; None si illisible. 0 sous-processus."""
    try:
        git = Path(chemin) / ".git"
        if git.is_file():
            ref = git.read_text(encoding="utf-8").strip()
            if not ref.startswith("gitdir:"):
                return None
            git = Path(ref[7:].strip())
            if not git.is_absolute():
                git = Path(chemin) / git
        tete = (git / "HEAD").read_text(encoding="utf-8").strip()
    except (OSError, UnicodeDecodeError):
        return None
    if tete.startswith("ref: refs/heads/"):
        return tete[16:]
    return "détachée " + tete[:7] if re.fullmatch(r"[0-9a-f]{40}([0-9a-f]{24})?", tete) else None


def _depots(prod: "produits.Produit | None", bmeta: dict) -> list[dict]:
    """Dépôts d'un étage avec leur branche courante : registre (prod), sinon `depot:` du brief."""
    if prod:
        src = [(d.chemin, d.branche_publication) for d in prod.depots]
    else:
        chemin = champ(bmeta, "depot", "")
        src = [(chemin, "")] if chemin else []
    out = []
    for chemin, pub in src:
        chemin = os.path.expanduser(chemin)
        b = _branche(chemin)
        out.append({"nom": Path(chemin).name, "chemin": chemin, "branche": b or "", "publication": pub,
                    "ecart": bool(pub) and b not in (None, "", pub), "etat": "ok" if b else "ko"})
    return out


def _etage(agg: dict, rang: int, n: int, cle: str, todo_n: int) -> dict:
    """Une entrée etages[] : l'agrégat placé (rang, num) et compté ; l'étage regardé ne dort pas."""
    sel = agg["slug"] == cle
    return {**agg, "dormant": agg["dormant"] and not sel, "todo": todo_n, "selection": sel,
            "rang": rang, "num": n - rang}


def _groupes(ouverts: list[Path], metas: dict[str, dict]) -> dict[str, list[Path]]:
    """cle produit actif → ses projets ouverts, ordre du fichier, entreprise en dernier.

    Registre invalide : slug → [projet] (un étage par projet, T019).
    Projet d'un produit archivé : dans aucun groupe (sous-sol).
    """
    cles = produits.tous()
    if not cles:
        return {p.name: [p] for p in ouverts}
    ent = produits.entreprise().cle
    g = {c: [] for c in cles if c != ent and produits.produit(c).etat == "actif"}
    g[ent] = []
    for p in ouverts:
        c = produits.produit_de(metas[p.name])[0]
        if c in g:
            g[c].append(p)
    return g


def _sous_sol(fermes: list[Path], etage_de: dict[str, str]) -> list[dict]:
    """Projets clos ou archivés, plus vault/archive/* (jamais sélectionnables)."""
    out = []
    for d, source in [(p, "projets") for p in fermes] + \
                     [(d, "archive") for d in sorted(ARCHIVE.glob("*")) if d.is_dir()]:
        brief = d / "brief.md"
        meta, _ = lire_frontmatter(brief)
        maj = (brief if brief.exists() else d).stat().st_mtime
        out.append({"slug": d.name, "titre": champ(meta, "titre", d.name),
                    "statut": champ(meta, "statut", "archive"), "source": source,
                    "maj": datetime.fromtimestamp(maj).strftime("%Y-%m-%d"),
                    "selectionnable": source == "projets",
                    "produit": etage_de.get(d.name, "") if source == "projets" else ""})
    return sorted(out, key=lambda e: e["maj"], reverse=True)


def _epingle(noms: set[str]) -> str:
    """run/projet (`agentx --projet`), relu à chaque état ; "" si absent ou inconnu."""
    try:
        slug = EPINGLE.read_text(encoding="utf-8").strip()
    except OSError:
        return ""
    return slug if slug in noms else ""


def _choisir(projets: list[Path], groupes: dict[str, list[Path]], etage: str | None,
             projet: str | None) -> tuple[Path, str, str, str]:
    """C2 : (sel, cle, source, refus) — requête (projet, étage, ancien lien #/<projet>),
    puis épingle, puis projet le plus actif des étages éveillés, puis défaut.

    `groupes` : listes triées par activité décroissante.
    """
    par_nom = {p.name: p for p in projets}

    def cle_de(p: Path) -> str:
        """Étage d'un projet ; clos : son produit, ou lui-même en mode projets."""
        c = next((c for c, ps in groupes.items() if p in ps), "")
        return c or produits.produit_de(lire_frontmatter(p / "brief.md")[0])[0] or p.name

    if projet and RE_SLUG.fullmatch(projet) and projet in par_nom:
        return par_nom[projet], cle_de(par_nom[projet]), "requete", ""
    if etage and groupes.get(etage):
        epingle = _epingle(set(par_nom))
        ps = groupes[etage]
        return next((p for p in ps if p.name == epingle), ps[0]), etage, "requete", ""
    if etage and RE_SLUG.fullmatch(etage) and etage in par_nom:            # ancien lien #/<projet>
        return par_nom[etage], cle_de(par_nom[etage]), "requete", ""
    demande = projet or etage
    refus = f"slug inconnu : {demande[:48]}" if demande else ""
    epingle = _epingle(set(par_nom))
    if epingle:
        return par_nom[epingle], cle_de(par_nom[epingle]), "epingle", refus
    maintenant = time.time()
    blocs = {p.name: _bloc_projet(p) for ps in groupes.values() for p in ps}     # cache : 0 relecture
    eveilles = [p for ps in groupes.values()
                if not all(_dormant(blocs[q.name], "", maintenant) for q in ps) for p in ps]
    if eveilles:
        p = min(eveilles, key=lambda p: (-blocs[p.name]["activite"], p.name))
        return p, cle_de(p), "activite", refus
    return projets[0], cle_de(projets[0]), "defaut", refus


def _agents_vivacite() -> list[dict]:
    """Fiches run/agents/ des tâches en-cours, confrontées à `claude agents` (1 appel / 5 s).

    Vault = statuts, fiche + sessions = vivacité, jamais l'inverse. Hors cache de
    signature : un agent meurt sans que le vault bouge. Émet `agent-mort` (1× par
    fiche) au passage.
    """
    sess = agents.sessions(5.0)
    agents.signaler_morts(sess)
    out = []
    for f in agents.lister():
        if agents.statut_tache(f["projet"], f["tid"]) != "en-cours":
            continue
        e = agents.etat(f, sess)
        out.append({"tid": f["tid"], "projet": f["projet"], "role": f["role"],
                    "vivant": agents.vivant(e), "etat": e, "depuis": f["lance"],
                    "id": f["id_session"]})
    return sorted(out, key=lambda a: (a["projet"], a["tid"]))


def _agents_etage(blocs: list[dict], infos: list[dict]) -> list[dict]:
    """Fantômes d'un étage : en-cours à fiche vivante + bloquées (fiche vivante ou result < 1 h).

    Le vault dit le statut, la fiche dit la vivacité ; bloqués en tête, 12 au plus.
    """
    vivants = {(a["projet"], a["tid"]) for a in infos if a["vivant"] is True}
    sess = None
    out = []
    for b in blocs:
        for d, m in b["taches"]:
            tid, statut = str(m.get("id")), str(m.get("statut"))
            f = agents.lire(b["slug"], tid) if statut in ("en-cours", "bloque") else None
            if not f:
                continue
            if statut == "en-cours":
                ok = (b["slug"], tid) in vivants
            else:
                sess = sess or agents.sessions(5.0)
                try:
                    recent = time.time() - (d / "result.md").stat().st_mtime < 3600
                except OSError:
                    recent = False
                ok = recent or agents.vivant(agents.etat(f, sess)) is True
            if ok:
                out.append({"role": str(m.get("role")), "tid": tid, "projet": b["slug"],
                            "bloque": statut == "bloque", "modele": f.get("modele"), "depuis": f["lance"]})
    return sorted(out, key=lambda a: (not a["bloque"], a["projet"], a["tid"]))[:12]


def construire_etat(projet: str | None = None, etage: str | None = None) -> dict:
    t0 = time.perf_counter()
    projets = lister_projets()
    if not projets:
        return etat_vide(t0)

    maintenant = time.time()
    produits_erreur = produits.erreur()
    metas = {p.name: lire_frontmatter(p / "brief.md")[0] for p in projets}
    etage_de = {s: produits.produit_de(m)[0] for s, m in metas.items()}    # "" en mode projets
    ouverts, fermes = [], []
    for p in projets:
        statut = str(metas[p.name].get("statut", "")).strip()
        (fermes if statut in ("clos", "archive") else ouverts).append(p)
    sigs = {p.name: _signature(p) for p in projets}
    groupes = _groupes(ouverts, metas)
    ranges = {p for ps in groupes.values() for p in ps}
    fermes += [p for p in ouverts if p not in ranges]               # produit archivé : sous-sol
    blocs = {p.name: _bloc_projet(p, sigs[p.name]) for p in ouverts if p in ranges}
    for ps in groupes.values():
        ps.sort(key=lambda p: (-blocs[p.name]["activite"], p.name))
    proj, cle, source, refus = _choisir(projets, groupes, etage, projet)
    bloc = blocs.get(proj.name) or _bloc_projet(proj, sigs[proj.name])      # clos : lu, jamais étage
    ordre = _ordre(blocs, proj.name, maintenant) if produits_erreur else list(groupes)
    aggs = {c: _bloc_produit(produits.produit(c), [blocs[p.name] for p in groupes[c]], proj.name, maintenant)
            for c in ordre}
    bmeta, taches, packs, lignes_taches = bloc["bmeta"], bloc["taches"], bloc["packs"], bloc["lignes"]
    toit = _toit(projets, sigs)
    infos = _agents_vivacite()
    vivants = {a["tid"] for a in infos if a["vivant"] is True and a["projet"] == proj.name}

    roles = []
    for r in _registre():
        if r.cle == "vault":
            pbs = toit["doctor"]
            roles.append({
                **_carte(r), "valeur": f"{len(pbs)} pb" if pbs else "sain",
                "jauge": 0.12 if pbs else 1.0, "etat": "incohérent" if pbs else "cohérent",
                "actif": bool(pbs), "actifs": 1 if pbs else 0, "en_cours": [],
                "note": pbs[0] if pbs else "deps, cycles, résultats : ok",
            })
            continue
        e = _etat_role(r.cle, taches, packs, vivants)
        ids = {str(m.get("id")) for _, m in taches if str(m.get("role")) == r.cle}
        roles.append({
            **_carte(r), "valeur": f"{e['faits']}/{e['total']}",
            "jauge": e["jauge"], "etat": e["etat"],
            "actif": e["actif"], "actifs": e["actifs"], "en_cours": e["en_cours"],
            "note": _derniere_ligne(proj, r.cle, ids),
        })

    pipeline = [{"k": k, "n": sum(1 for _, m in taches if str(m.get("statut")) == k)}
                for k in ORDRE_PIPELINE]

    jr = _journal(proj)
    serie = _serie_depuis_journal(jr, len(taches),
                                  sum(1 for _, m in taches if str(m.get("statut")) == "fait"))

    # La prod a son mot a dire dans la todo : une sonde au rouge ou une erreur
    # recurrente passe devant les packs a ecrire.
    sup = supervision.etat()
    personnel = toit["personnel"]

    # todo agrégée : le toit (RH, clôtures, prod) passe devant à priorité égale, puis les
    # étages dans leur ordre ; un étage dormant ne remonte que l'urgent.
    sondes = [{**i, "projet": ""} for i in supervision.suggestions(sup, proj.name)]
    cles = [((i["prio"], -1, k), {**i, "etage": ""}) for k, i in enumerate(_todo_rh(personnel) + toit["clore"] + sondes)]
    for rang, c in enumerate(ordre):
        dort = aggs[c]["dormant"] and c != cle
        urgents = [i for p in groupes[c] for i in _todo_agents(p.name, blocs[p.name]["lignes"], infos)]  # hors bloc : la vivacité n'est pas dans la signature
        cles += [((1, rang, k - len(urgents)), {**i, "etage": c}) for k, i in enumerate(urgents)]
        cles += [((i["prio"], rang, k), {**i, "etage": c}) for k, i in enumerate(aggs[c]["todo"])
                 if not dort or i["prio"] <= 1]
    tri = [i for _, i in sorted(cles, key=lambda c: c[0])]

    try:
        vivant = TERM.vivant()
    except Exception:          # démon injoignable : la page dit « injoignable »
        vivant = None
    sonde = next((i for i in sondes if i["prio"] == 1), None)
    etages = []
    for rang, c in enumerate(ordre):
        depots = _depots(produits.produit(c), blocs[groupes[c][0].name]["bmeta"] if groupes[c] else {})
        etages.append({**_etage(aggs[c], rang, len(ordre), cle, sum(1 for i in tri if i["etage"] == c)),
                       "depots": depots, "branche": (depots[0]["branche"] or None) if depots else None,
                       "agents": _agents_etage([blocs[p.name] for p in groupes[c]], infos)})
    immeuble = {
        "mode": "projets" if produits_erreur else "produits",
        "selection": {"slug": cle, "projet": proj.name, "source": source, "refus": refus},
        "epingle": _epingle({p.name for p in projets}),
        "toit": {
            "chef": {"vivant": vivant},
            "todo": len(tri), "urgent": sum(1 for i in tri if i["prio"] == 1),
            "etages": len(etages), "dormants": sum(1 for e in etages if e["dormant"]),
            "alerte": ({"niveau": "sonde", "texte": sonde["titre"]} if sonde
                       else {"niveau": "", "texte": ""}),
        },
        "etages": etages,
        "sous_sol": _sous_sol(fermes, etage_de),
    }

    dernier = packs[-1] if packs else {}
    etat = {
        "registre_erreur": _roles.erreur(),
        "produits_erreur": produits_erreur,
        "statuts": list(STATUTS),
        "personnel": personnel,
        "horodate": datetime.now().strftime("%H:%M:%S"),
        "heure": datetime.now().strftime("%H:%M"),
        "projet": {
            "slug": proj.name, "titre": champ(bmeta, "titre", proj.name),
            "statut": champ(bmeta, "statut", "?"), "objectif": champ(bmeta, "objectif", "—"),
            "depot": champ(bmeta, "depot", ""),
            "estimation": bloc["estimation"],
        },
        "roles": roles, "pipeline": pipeline, "taches": lignes_taches,
        "serie": serie,
        "flux": _flux(taches), "todo": tri[:PLAFOND_CHEF], "todo_total": len(tri),
        "supervision": sup,
        "pilotable": True,
        "ticker": _ticker(proj.name, taches, jr),
        "journal": [f"{h.split(' ')[-1]}  {t}" for h, t in jr[-9:]][::-1],
        "evenements": _evenements(etage_de),
        "immeuble": immeuble,
        "agents": infos,
    }
    immeuble["mesure_ms"] = round((time.perf_counter() - t0) * 1000)
    return etat


def _personnel() -> dict:
    """Dossier RH global ; la salle vit sans lui s'il casse."""
    try:
        return rh.personnel()
    except Exception:
        return {}


def _objet(de: str, vers: str) -> tuple[str, str]:
    """Ce qui transite concretement sur un relais : (icone, libelle).

    Ce n'est pas decoratif — chaque role remet un artefact different, et savoir
    lequel attend au bout du fil change ce que le chef doit faire.
    """
    if de == "chef":
        return ("pack", "pack")
    exact = {
        ("implementeur", "verificateur"): ("diff", "livrable"),
        ("verificateur", "implementeur"): ("defauts", "défauts"),
        ("implementeur", "critique"): ("diff", "livrable"),
        ("critique", "implementeur"): ("defauts", "critiques"),
    }
    if (de, vers) in exact:
        return exact[(de, vers)]
    if vers == "scribe":
        return ("notes", "à capitaliser")
    r = _roles.role(de)
    return (r.objet, r.livrable) if r else ("resultat", "compte rendu")


def _flux(taches) -> list[dict]:
    """Les relais entre agents.

    Dans ce système les agents ne se parlent pas : ils se passent le relais par
    le vault. Une dépendance T_a -> T_b est donc un transfert concret
    role(T_a) -> role(T_b) : le « Pour la suite » de l'un alimente le pack de
    l'autre. Et toute tâche `pret` est un pack que le chef vient de poser.
    """
    role = {str(m.get("id")): str(m.get("role")) for _, m in taches}
    statut = {str(m.get("id")): str(m.get("statut", "a-faire")) for _, m in taches}
    titre = {str(m.get("id")): champ(m, "titre", "") for _, m in taches}
    aretes = []
    for _, m in taches:
        tid = str(m.get("id"))
        deps = m.get("deps") or []
        deps = deps if isinstance(deps, list) else [deps]
        for dep in deps:
            if dep not in role:
                continue
            ico, lib = _objet(role[dep], role[tid])
            aretes.append({
                "de": role[dep], "vers": role[tid],
                "de_tid": dep, "vers_tid": tid, "quoi": titre[tid],
                "objet": ico, "objet_nom": lib,
                "etat": ("actif" if statut[tid] == "en-cours"
                         else "bloque" if statut[tid] == "bloque"
                         else "livre" if _roles.dep_satisfaite(statut[dep], role[tid])
                         else "attente"),
            })
    for _, m in taches:
        if str(m.get("statut")) == "pret":
            tid = str(m.get("id"))
            aretes.append({"de": "chef", "vers": role[tid], "de_tid": "pack",
                           "vers_tid": tid, "quoi": titre[tid],
                           "objet": "pack", "objet_nom": "pack", "etat": "livre"})
    return aretes


ETIQUETTE_TODO = {0: "VOTRE CHOIX", 1: "URGENT", 2: "À FAIRE", 3: "À LANCER", 4: "À DÉCIDER"}


def _actions_tache(l: dict, slug: str) -> list[dict]:
    """Ce que la page propose sur une tâche, selon son statut.

    Seul calcul des permissions : le front affiche cette liste, n'en déduit
    rien. `exe` part dans /api/run ; `exe` None = commande à copier.
    """
    t = l["id"]
    vx = "python3 bin/vx.py"

    def act(k, libelle, cmd, exe=None, saisie=""):
        return {"k": k, "libelle": libelle, "exe": exe, "cmd": cmd, "saisie": saisie}

    def statut(k, libelle, s):
        return act(k, libelle, f"{vx} set {t} --statut {s} --projet {slug}",
                   {"action": "set", "tid": t, "statut": s, "projet": slug})

    pack = act("pack", "✎ pack", f"/pack {t}")
    pret = statut("pret", "→ prêt", "pret")
    abandonner = statut("abandonner", "abandonner", "abandonne")
    dispatch = act("dispatch", "⧉ dispatch", f"/dispatch {slug}")
    integrer = act("integrer", "intégrer", f"{vx} integrer {t} --projet {slug}",
                   {"action": "integrer", "tid": t, "projet": slug})
    livrer = statut("livrer", f"→ {l['livre_en']}", l["livre_en"])
    reprendre = statut("reprendre", "↺ reprendre", "a-faire")
    evaluer = act("evaluer", "⧉ évaluer",
                  f'{vx} tache "Evaluer {t}" --projet {slug} --role evaluateur --dep {t}')
    retenir = act("retenir", "✓ retenir", f"{vx} retenir {t} --projet {slug}",
                  {"action": "retenir", "tid": t, "projet": slug})
    motif = l["eval_motif"] if l["eval_verdict"] == "virer" else ""
    virer = act("virer", "✕ virer", f'{vx} virer {t} --motif {_citer_motif(motif)} --projet {slug}',
                {"action": "virer", "tid": t, "projet": slug, "motif": motif}, "motif")

    r = l["result"]
    table = {
        "a-faire":   [pack, pret if l["lint"] == "PASS" else None, abandonner],
        "pret":      [dispatch, abandonner],
        "en-cours":  [integrer if r else None, livrer if r else None, virer],
        "bloque":    [integrer if r else None, reprendre, virer, abandonner],
        "revue":     [integrer, evaluer if not l["eval"] else None,
                      retenir if l["eval_verdict"] == "retenir" else None, virer],
        "fait":      [integrer, virer],
        "rejete":    [integrer],
        "abandonne": [reprendre],
    }
    return [a for a in table.get(l["statut"], []) if a]


def _todo(proj: Path, taches, lignes) -> list[dict]:
    """La todo du chef, déduite de l'état du vault — jamais saisie à la main.

    Chaque entrée est une action que seul le chef peut faire : écrire un pack,
    répondre à un blocage, dispatcher, intégrer, faire évaluer, retenir, virer,
    trancher, capitaliser. Le travail lui-même (vérifier, critiquer) est une
    tâche vault, créée par vx.
    """
    par_id = {l["id"]: l for l in lignes}
    statuts = {l["id"]: l["statut"] for l in lignes}
    parents = {str(m.get("id")): str(m.get("parent") or "") for _, m in taches}
    slug = proj.name
    items = []

    def add(prio, titre, detail, cmd="", exe=None, doc=""):
        # « exe » n'est rempli que pour ce que la page a le droit de lancer :
        # un changement de statut. Écrire un pack ou dispatcher reste à la main
        # du chef dans Claude Code — la page propose alors de copier.
        items.append({"prio": prio, "etiquette": ETIQUETTE_TODO[prio],
                      "titre": titre, "detail": detail, "cmd": cmd, "exe": exe, "doc": doc})

    bmeta, _ = lire_frontmatter(proj / "brief.md")
    if champ(bmeta, "objectif", "") in ("", "—"):
        add(2, "Compléter le brief", "objectif vide — une section vide est une question à poser",
            f"vault/projets/{slug}/brief.md")

    # en-cours sans dispatch, ou prête oubliée : la tâche attend un agent que personne n'a lancé
    evs, maintenant = evenements_par_tache(), time.time()
    for d, m in taches:
        tid = str(m.get("id"))
        if sans_agent(statuts[tid], (d / "task.md").stat().st_mtime, evs.get((slug, tid), []), maintenant):
            add(1, f"{tid} prête mais aucun agent lancé — dispatcher",
                f"{par_id[tid]['titre']} — {statuts[tid]}, aucun dispatch noté", "/dispatch " + slug)

    for l in lignes:
        if l["statut"] == "bloque":
            add(1, f"Débloquer {l['id']}", f"{l['titre']} — réponds, corrige le pack, crée une tâche neuve",
                f"python3 bin/vx.py set {l['id']} --statut a-faire --projet {slug}",
                {"action": "set", "tid": l["id"], "statut": "a-faire", "projet": slug})

    # verdicts d'évaluation : le chef tranche, l'évaluateur n'agit jamais lui-même
    for l in lignes:
        t = l["id"]
        if l["eval_verdict"] == "virer" and l["statut"] not in ("rejete", "abandonne"):
            add(1, f"Virer {t}", f"{l['eval']} conclut virer — {l['eval_motif']}",
                f"python3 bin/vx.py virer {t} --motif {_citer_motif(l['eval_motif'])} --projet {slug}",
                {"action": "virer", "tid": t, "projet": slug, "motif": l["eval_motif"]})
        elif l["eval_verdict"] == "retenir" and l["statut"] == "revue":
            add(2, f"Retenir {t}", f"{l['eval']} conclut retenir — {l['titre']}",
                f"python3 bin/vx.py retenir {t} --projet {slug}",
                {"action": "retenir", "tid": t, "projet": slug})
        if l["statut"] == "revue" and l["livre_en"] == "revue" and not l["eval"]:
            add(2, f"Faire évaluer {t}", f"{l['titre']} — en revue sans évaluation",
                f'python3 bin/vx.py tache "Evaluer {t}" --projet {slug} --role evaluateur --dep {t}')

    for l in lignes:
        if l["statut"] in ("fait", "abandonne", "rejete"):
            continue
        if l["lint"] == "—" or l.get("vierge"):
            # l'enfant (vérif, critique) se packe sur une livraison, pas avant
            parent = parents.get(l["id"])
            if parent and statuts.get(parent) not in ("revue", "fait"):
                continue
            add(2, f"Écrire le pack de {l['id']}", f"{l['titre']} — rien à dispatcher sans pack",
                f"/pack {l['id']}")
        elif l["lint"] == "FAIL" and l["remplace"]:
            r = l["remplace"]
            add(2, f"Corriger le pack de {l['id']} (remplace {r})",
                f"vire : {par_id[r]['motif'] if r in par_id else '?'}", f"/pack {l['id']}")
        elif l["lint"] == "FAIL":
            raison = ("whitelist > 12 fichiers — découpe la tâche" if l["fichiers"] > 12
                      else "refusé par pack-lint")
            add(2, f"Corriger le pack de {l['id']}", f"{l['titre']} — {raison}", f"/pack {l['id']}")

    for d, m in taches:
        tid = str(m.get("id"))
        if (d / "result.md").exists() and statuts.get(tid) in ("a-faire", "pret", "en-cours", "bloque"):
            r = _analyse_result(d / "result.md")
            rs = str(lire_frontmatter(d / "result.md")[0].get("statut", ""))
            soupcon = " — « non vérifié » vaut non fait" if r.get("non_verifie") else ""
            if rs == "bloque":
                if statuts.get(tid) != "bloque":
                    add(2, f"Intégrer {tid}", f"result bloque, statut encore {statuts.get(tid)}{soupcon}",
                        f"python3 bin/vx.py set {tid} --statut bloque --projet {slug}",
                        {"action": "set", "tid": tid, "statut": "bloque", "projet": slug})
            elif rs in ("fait", "revue") and par_id[tid]["livre_en"] == "revue":
                add(2, f"Passer {tid} en revue",
                    f"compte rendu rendu, statut encore {statuts.get(tid)}{soupcon}",
                    f"python3 bin/vx.py set {tid} --statut revue --projet {slug}",
                    {"action": "set", "tid": tid, "statut": "revue", "projet": slug})
            elif rs in ("fait", "revue"):
                add(2, f"Intégrer {tid}", f"compte rendu rendu, statut encore {statuts.get(tid)}{soupcon}",
                    f"python3 bin/vx.py set {tid} --statut fait --projet {slug}",
                    {"action": "set", "tid": tid, "statut": "fait", "projet": slug})
            else:
                add(2, f"Intégrer {tid}", f"statut result illisible{soupcon}",
                    f"python3 bin/vx.py integrer {tid} --projet {slug}")

    prets = [l["id"] for l in lignes if l["statut"] == "pret" and l["lint"] == "PASS"]
    if prets:
        add(3, f"Dispatcher la vague ({len(prets)})", "un seul message, " + ", ".join(prets),
            "/dispatch " + slug)

    # Un contrôle dû sans enfant ni renonciation : au chef de trancher.
    sans_controle = [str(m.get("id")) for d, m in taches if controles_manquants(taches, d, m)]
    if sans_controle:
        add(4, f"Contrôles manquants ({len(sans_controle)})",
            ", ".join(sans_controle[:8]) + (" …" if len(sans_controle) > 8 else ""),
            f'python3 bin/vx.py renoncer --projet {slug} --raison "<raison>"')

    # entrées écrites à la main par le chef dans todo.md
    f = proj / "todo.md"
    if f.exists():
        for ligne in f.read_text(encoding="utf-8").splitlines():
            q = re.match(r"^\s*-\s*\[ \]\s+\?\s*(.+)$", ligne)
            if q:
                titre = q.group(1).strip()
                lien = re.search(r"\s*→\s*(\S+)\s*$", titre)
                if lien:
                    titre = titre[:lien.start()].strip()
                add(0, titre, "question à l'humain — réponds au chef, il tranche et coche",
                    doc=lien.group(1) if lien else "")
                continue
            m = re.match(r"^\s*-\s*\[( |x|X)\]\s+(.+)$", ligne)
            if m and m.group(1) == " ":
                add(4, m.group(2).strip(), "noté à la main dans todo.md")

    items.sort(key=lambda i: i["prio"])
    return items


def _todo_agents(slug: str, lignes: list[dict], infos: list[dict]) -> list[dict]:
    """URGENT : agent mort, agent sur un prompt, en-cours sans agent.

    Déduit des fiches run/agents/ (`infos` = state.json.agents), pas du vault :
    calculé à chaque tick, jamais mis en cache avec l'étage. `exe` None : dispatch
    et attach ne se lancent jamais depuis la page.
    """
    par_tid = {a["tid"]: a for a in infos if a["projet"] == slug}
    items: dict[str, tuple[str, str, str]] = {}
    for l in lignes:
        t = l["id"]
        if l["statut"] != "en-cours" or t in items:
            continue
        a = par_tid.get(t)
        if a is None:
            items[t] = (f"{t} en-cours sans agent", f"{l['titre']} — aucune fiche run/agents/",
                        f"./bin/agentx dispatch {t} --projet {slug}")
        elif a["etat"] == "blocked":
            items[t] = (f"{t} attend une réponse", f"{l['titre']} — agent sur un prompt",
                        f"claude attach {a['id']}")
        elif a["vivant"] is False:
            f = agents.lire(slug, t)
            if f and not agents.a_rendu(f):
                items[t] = (f"Relancer {t}", f"{l['titre']} — agent {a['etat']}, aucun result.md",
                            f"./bin/agentx dispatch --relancer {t} --projet {slug}")
    return [{"prio": 1, "etiquette": ETIQUETTE_TODO[1], "titre": ti, "detail": d,
             "cmd": c, "exe": None, "projet": slug} for ti, d, c in items.values()]


def _todo_rh(personnel: dict) -> list[dict]:
    """Un rôle dont la moitié des livrables est virée : c'est son pack type qui pèche.

    Le dossier RH couvre tous les projets : entrées émises une fois, au toit.
    """
    return [{"prio": 4, "etiquette": ETIQUETTE_TODO[4],
             "titre": f"Revoir le pack type de {p['cle']}",
             "detail": f"{p['virees']}/{p['livrees']} livrables virés — corrige le gabarit avant la prochaine vague",
             "cmd": "python3 bin/vx.py personnel", "exe": {"action": "personnel"}, "projet": ""}
            for p in personnel.get("roles", [])
            if p["livrees"] >= 2 and p["taux_renvoi"] >= 0.5]


def _todo_clore() -> list[dict]:
    """Un projet fini se clôt sur demande à l'humain, pas en silence — et pas
    seulement l'étage affiché : celui qu'on a oublié est justement l'autre.

    Tous projets confondus (un étage dormant tait sa todo) : émis une fois, au toit.
    """
    return [{"prio": 4, "etiquette": ETIQUETTE_TODO[4], "titre": f"Clore {c['projet']} ?",
             "detail": f"plus rien d'ouvert ({c['faites']} faites), dernière activité {_depuis_txt(c)} "
                       "— demande à l'humain s'il faut ranger",
             "cmd": f"/clore {c['projet']}", "exe": None, "projet": ""}
            for c in a_clore()]


def _analyse_result(chemin: Path) -> dict:
    if not chemin.exists():
        return {}
    t = chemin.read_text(encoding="utf-8")
    meta, _ = lire_frontmatter(chemin)
    decision = str(meta.get("verdict", "")).strip()
    decision = decision if decision in ("retenir", "virer") else ""
    # verdict d'évaluateur (frontmatter) prioritaire sur le mot-clé du vérificateur
    verdict = decision.upper() or next(
        (v for v in ("CONFORME", "DÉFAUTS", "DEFAUTS", "NON VÉRIFIABLE") if v in t), "")
    motif = ""
    m = re.search(r"^##\s*Motif\s*$(.*?)(?=^## |\Z)", t, re.S | re.M)
    if m:
        motif = next((x.strip() for x in m.group(1).splitlines() if x.strip()), "")
    return {"verdict": verdict, "non_verifie": "non vérifié" in t.lower(),
            "decision": decision, "motif": "" if motif == "∅" else motif}


def _derniere_ligne(proj: Path, cle: str, ids: set[str]) -> str:
    """Dernier événement du journal concernant ce rôle.

    Le journal note les changements par ID de tâche (« T007 statut ... »), pas
    par rôle : on passe donc les IDs du rôle, sinon on ne retrouve que la ligne
    de création et la carte reste figée. Seul l'ID en tête de ligne compte :
    « T012 creee — … de T010 » concerne T012, pas le rôle de T010.
    """
    for _, txt in reversed(_journal(proj)):
        sujet = re.match(r"(T\d+)\b", txt)
        if cle == "chef" or (sujet.group(1) in ids if sujet else cle in txt):
            return txt
    return "aucune activité"


def _doctor_rapide(projets) -> list[str]:
    pbs = []
    for proj in projets:
        bloc = _bloc_projet(proj)       # en cache : 0 relecture d'un etage immobile
        taches = bloc["taches"]
        ids = {str(m.get("id")) for _, m in taches}
        for (d, m), pack in zip(taches, bloc["packs"]):
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            for dep in deps:
                if dep not in ids:
                    pbs.append(f"{m.get('id')} : dépendance fantôme {dep}")
            if str(m.get("statut")) == "fait" and not (d / "result.md").exists():
                pbs.append(f"{m.get('id')} : fait sans result.md")
            # meme critere que vx._pack_rempli, sur l'analyse deja faite
            if str(m.get("statut")) in ("pret", "en-cours") and (not pack or pack["marqueurs"]):
                pbs.append(f"{m.get('id')} : {m.get('statut')} mais pack vide")
    return pbs


def _serie_depuis_journal(jr, total, faits) -> dict:
    """Courbe d'avancement : tâches faites cumulées au fil du journal."""
    pts, barres, cum = [], [], 0
    for _, txt in jr:
        if "-> fait" in txt:
            cum += 1
        pts.append(cum)
        barres.append(2 if "-> fait" in txt else (-1 if "bloque" in txt else 1))
    if len(pts) < 2:
        pts, barres = [0, cum], [1, 1]
    return {
        "points": pts[-60:], "barres": barres[-60:],
        "titre": "AVANCEMENT", "valeur": f"{faits}/{total}",
        "sous": f"{round(100 * faits / total) if total else 0} % des tâches livrées",
    }


def _ticker(slug, taches, jr) -> str:
    faits = sum(1 for _, m in taches if str(m.get("statut")) == "fait")
    bloq = sum(1 for _, m in taches if str(m.get("statut")) == "bloque")
    der = jr[-1][1] if jr else "vault initialisé"
    return (f"PROJET {slug.upper()} · {len(taches)} TÂCHES · {faits} LIVRÉES · "
            f"{bloq} BLOQUÉES · DERNIER ÉVÉNEMENT : {der.upper()}")


# --------------------------------------------------------------------------- #
# vault vide : le meme etat, reduit — toit du chef, aucun etage, roles a zero
# --------------------------------------------------------------------------- #

def etat_vide(t0: float) -> dict:
    """Aucun projet : l'immeuble existe quand meme (toit du chef, sous-sol des
    archives), les roles sont a zero, la todo ne porte que ce qui vient du toit
    (RH, sondes). Meme forme que l'etat reel : le front n'a qu'un seul chemin."""
    now = datetime.now()
    toit = _toit([], {})
    personnel = toit["personnel"]
    roles = []
    for r in _registre():
        if r.cle == "vault":
            roles.append({**_carte(r), "valeur": "sain", "jauge": 1.0, "etat": "cohérent",
                          "actif": False, "actifs": 0, "en_cours": [], "note": "vault vide"})
            continue
        e = _etat_role(r.cle, [], [], set())
        roles.append({**_carte(r), "valeur": "0/0", "jauge": e["jauge"], "etat": e["etat"],
                      "actif": e["actif"], "actifs": e["actifs"], "en_cours": e["en_cours"],
                      "note": "aucune activité"})
    sup = supervision.etat()
    sondes = [{**i, "projet": ""} for i in supervision.suggestions(sup, "")]
    todo = sorted(_todo_rh(personnel) + toit["clore"] + sondes, key=lambda i: i["prio"])
    try:
        vivant = TERM.vivant()
    except Exception:          # démon injoignable : la page dit « injoignable »
        vivant = None
    sonde = next((i for i in sondes if i["prio"] == 1), None)
    produits_erreur = produits.erreur()
    immeuble = {
        "mode": "projets" if produits_erreur else "produits",
        "selection": {"slug": "", "projet": "", "source": "defaut", "refus": ""},
        "epingle": "",
        "toit": {
            "chef": {"vivant": vivant},
            "todo": len(todo), "urgent": sum(1 for i in todo if i["prio"] == 1),
            "etages": 0, "dormants": 0,
            "alerte": ({"niveau": "sonde", "texte": sonde["titre"]} if sonde
                       else {"niveau": "", "texte": ""}),
        },
        "etages": [],
        "sous_sol": _sous_sol([], {}),
        "mesure_ms": round((time.perf_counter() - t0) * 1000),
    }
    return {
        "registre_erreur": _roles.erreur(),
        "produits_erreur": produits_erreur,
        "statuts": list(STATUTS),
        "personnel": personnel,
        "horodate": now.strftime("%H:%M:%S"), "heure": now.strftime("%H:%M"),
        "projet": {"slug": "", "titre": "", "statut": "", "objectif": "", "depot": ""},
        "roles": roles,
        "pipeline": [{"k": k, "n": 0} for k in ORDRE_PIPELINE],
        "taches": [],
        "serie": _serie_depuis_journal([], 0, 0),
        "flux": [], "todo": todo[:PLAFOND_CHEF], "todo_total": len(todo),
        "supervision": sup,
        "pilotable": True,
        "ticker": "VAULT VIDE · AUCUN PROJET · /projet POUR EN OUVRIR UN",
        "journal": [],
        "evenements": _evenements({}),
        "immeuble": immeuble,
        "agents": _agents_vivacite(),
    }


# --------------------------------------------------------------------------- #
# serveur
# --------------------------------------------------------------------------- #

class Handler(SimpleHTTPRequestHandler):

    def _json(self, code: int, charge: dict):
        corps = json.dumps(charge, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def _hote_local(self) -> bool:
        hote = (self.headers.get("Host") or "").rsplit(":", 1)[0]
        return hote in HOTES_OK

    def _jeton_ok(self) -> bool:
        if self.headers.get("X-AgentX-Jeton") == JETON:
            return True
        return parse_qs(urlsplit(self.path).query).get("jeton", [""])[0] == JETON

    def _sse_terminal(self):
        """Flux du pseudo-terminal. EventSource ne pose pas d'en-tete : le jeton
        passe en parametre, sur l'hote local uniquement."""
        if not self._hote_local() or not self._jeton_ok():
            self._json(403, {"erreur": "jeton invalide — recharge la page"})
            return
        q = parse_qs(urlsplit(self.path).query)
        try:
            pos = int(q.get("depuis", ["0"])[0])
        except ValueError:
            pos = 0
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            if not TERM.vivant():           # session absente (serveur relancé) : le dire tout de suite
                self.wfile.write(f"data: {json.dumps({'mort': True})}\n\n".encode())
                self.wfile.flush()
                return
            while True:
                pos, bloc, code = TERM.attendre(pos, 15.0)
                if bloc:
                    charge = json.dumps({"o": base64.b64encode(bloc).decode("ascii"), "pos": pos})
                    self.wfile.write(f"data: {charge}\n\n".encode())
                elif code is None:
                    self.wfile.write(b": vivant\n\n")
                if code is not None:
                    self.wfile.write(f"data: {json.dumps({'fin': code, 'pos': pos})}\n\n".encode())
                    self.wfile.flush()
                    return
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            return

    def do_GET(self):
        if self.path.startswith("/api/term/stream"):
            self._sse_terminal()
            return
        if self.path.startswith("/state.json"):
            battre()
            q = parse_qs(urlsplit(self.path).query)
            etage, projet = q.get("etage", [""])[0], q.get("projet", [""])[0]
            try:
                etat = construire_etat(projet or None, etage or None)
                etat["jeton"] = JETON
            except Exception as exc:  # le dashboard ne doit jamais tomber
                etat = {"erreur": str(exc)}
            try:
                etat["voix"] = {**voix.etat(), "journal": voix.journal(30)}
            except Exception:  # panne voix : le reste de l'état tient
                etat["voix"] = None
            self._json(200, etat)
            return
        if self.path.startswith("/api/doc"):
            q = parse_qs(urlsplit(self.path).query)
            code, charge = lire_doc(q.get("chemin", [""])[0])
            self._json(code, charge)
            return
        if self.path.startswith("/api/tache"):
            q = parse_qs(urlsplit(self.path).query)
            tid = q.get("tid", [""])[0]
            try:
                slug = _projet_connu(q.get("projet", [""])[0])
            except ValueError as exc:
                self._json(400, {"erreur": str(exc)})
                return
            if not RE_TID.fullmatch(tid):
                self._json(400, {"erreur": "tid invalide"})
                return
            tache = lire_tache(slug, tid)
            if tache is None:
                self._json(404, {"erreur": "tache introuvable"})
            else:
                self._json(200, tache)
            return
        if self.path in ("/", ""):
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        # fichiers statiques jamais mis en cache : un front périmé
        # après une mise à jour donnait une page « qui ne marche pas ».
        if not self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def _terminal(self, route: str, req: dict) -> dict:
        """Les seules actions sur le pseudo-terminal. Le programme est fixe
        (`claude` dans la racine d'AgentX) : rien ici ne lance une commande
        venue du client, on ne fait que lui parler."""
        if route == "open":
            TERM.demarrer(int(req.get("cols", 120)), int(req.get("rows", 32)))
            return {"vivant": TERM.vivant(), "pos": TERM.position()}
        if route == "in":
            donnees = str(req.get("data", ""))
            if len(donnees) > 60000:
                raise ValueError("entree trop grosse")
            if not TERM.vivant():
                return {"ok": False, "mort": True}
            TERM.ecrire(donnees.encode("utf-8"))
            return {"ok": True}
        if route == "resize":
            TERM.redimensionner(int(req.get("cols", 120)), int(req.get("rows", 32)))
            return {"ok": True}
        if route == "stop":
            TERM.arreter()
            return {"ok": True}
        if route == "etat":
            return {"vivant": TERM.vivant(), "code": TERM.code}
        raise ValueError(f"route inconnue : {route}")

    def _voix(self, action: str, req: dict) -> dict:
        """Mode vocal, silence, effacer le journal, micro : jamais de texte libre envoye a parle."""
        if action == "stop":
            return {"ok": True, "voix": voix.taire()}
        if action == "effacer":
            return {"ok": True, "voix": voix.effacer()}
        if action not in ("mode", "micro"):
            raise ValueError(f"route inconnue : {action}")
        if not isinstance(req.get("on"), bool):
            raise ValueError("on attendu : true|false")
        fait = voix.mode if action == "mode" else voix.micro
        return {"ok": True, "voix": fait(req["on"])}

    def do_POST(self):
        route = self.path.split("?", 1)[0]
        if route != "/api/run" and not route.startswith(("/api/term/", "/api/voix/")):
            self._json(404, {"erreur": "inconnu"})
            return
        if not self._hote_local():
            self._json(403, {"erreur": "hote non local"})
            return
        if self.headers.get("X-AgentX-Jeton") != JETON:
            self._json(403, {"erreur": "jeton invalide — recharge la page"})
            return
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 65536:
                raise ValueError("requete trop grosse")
            req = json.loads(self.rfile.read(n) or b"{}")
            if not isinstance(req, dict):
                raise ValueError("charge invalide")
            if route.startswith("/api/term/"):
                self._json(200, self._terminal(route.rsplit("/", 1)[1], req))
                return
            if route.startswith("/api/voix/"):
                self._json(200, self._voix(route[len("/api/voix/"):], req))
                return
            self._json(200, executer(req))
        except ValueError as exc:
            self._json(400, {"erreur": str(exc)})
        except subprocess.TimeoutExpired:
            self._json(504, {"erreur": "la commande a dépassé 25 s"})
        except Exception as exc:
            self._json(500, {"erreur": str(exc)})

    def log_message(self, *_a):
        pass


def main():
    p = argparse.ArgumentParser(prog="dash.py", description="Tableau de bord live du vault.")
    p.add_argument("--port", type=int, default=7777)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--json", action="store_true", help="imprime l'etat et sort")
    p.add_argument("--no-open", action="store_true")
    p.add_argument("--projet", default="", help="avec --json : projet detaille")
    p.add_argument("--etage", default="", help="avec --json : etage (cle produit) selectionne")
    p.add_argument("--web", default="apps/web/dist", metavar="DIR",
                   help="dossier web servi (relatif a la racine) ; defaut : apps/web/dist")
    a = p.parse_args()
    web = Path(a.web)
    if not web.is_absolute():             # --web relatif : resolu sur ROOT
        web = ROOT / web

    if a.json:
        print(json.dumps(construire_etat(a.projet or None, a.etage or None), ensure_ascii=False, indent=2))
        return
    if not (web / "index.html").exists():
        print(f"dash: fichiers web absents dans {web}", file=sys.stderr)
        sys.exit(1)

    srv = ThreadingHTTPServer((a.host, a.port), partial(Handler, directory=str(web)))
    url = f"http://{a.host}:{a.port}"
    etat = construire_etat()
    print(f"  ╭────────────────────────────────────────────╮")
    print(f"  │  AGENTX · SALLE DES AGENTS                 │")
    print(f"  │  {url:<42}│")
    print(f"  │  {'projet : ' + etat['projet']['slug'] if etat['projet']['slug'] else 'vault vide':<41} │")
    print(f"  ╰────────────────────────────────────────────╯")
    # flush explicite : lance en detache, stdout est un fichier, donc bufferise
    # — sans ca un demarrage rate ne laisse aucune trace dans le journal.
    print("  Ctrl-C pour arrêter.", flush=True)
    if not a.no_open:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  salle fermée.", flush=True)


if __name__ == "__main__":
    main()
