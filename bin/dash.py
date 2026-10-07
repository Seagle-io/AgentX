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
import re
import secrets
import subprocess
import sys
import time
import webbrowser
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
import supervision  # noqa: E402
import terminal as _terminal  # noqa: E402
from vx import (  # noqa: E402
    ROOT, VAULT, PACK_MAX_FICHIERS, PACK_MAX_LIGNES, PACK_SECTIONS, STATUTS,
    champ, deaccent, lire_frontmatter, lister_projets, lister_taches, _pack_rempli,
)

WEB = ROOT / "dash"
TERM = _terminal.TerminalClient(cwd=str(ROOT))   # demon detache : survit aux relances
BATTEMENT = ROOT / "run" / "salle.alive"
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

# La couleur de chaque rôle vit uniquement dans COULEUR_ROLE (dash.js) :
# la dupliquer ici n'apportait rien et obligeait à l'éditer deux fois.
ROLES_META = [
    ("chef",         "CHEF",         "ne code jamais · découpe",      "packs validés"),
    ("eclaireur",    "ÉCLAIREUR",    "trouve où vivent les choses",   "coordonnées"),
    ("architecte",   "ARCHITECTE",   "tranche, produit un contrat",   "contrats"),
    ("verificateur", "VÉRIFICATEUR", "cherche à casser le livrable",  "défauts"),
    ("implementeur", "IMPLÉMENTEUR", "code en périmètre fermé",       "diff"),
    ("scribe",       "SCRIBE",       "capitalise, corrige les packs", "notes"),
    ("vault",        "VAULT",        "cohérence du dépôt",            "doctor"),
]

ORDRE_PIPELINE = ["a-faire", "pret", "en-cours", "revue", "bloque", "fait"]

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
RE_TID = re.compile(r"^T\d{3}$")
RE_SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,47}$")


def _slugs_connus() -> set[str]:
    return {p.name for p in lister_projets()}


def construire_argv(req: dict) -> list[str]:
    """Traduit une requete validee en argv pour vx.py. Leve ValueError sinon."""
    action = str(req.get("action", ""))

    if action in ACTIONS_LECTURE:
        argv = [action]
        projet = req.get("projet")
        if projet and action in ("board", "ready"):
            if not RE_SLUG.match(str(projet)) or projet not in _slugs_connus():
                raise ValueError(f"projet inconnu : {projet}")
            argv += ["--projet", str(projet)]
        return argv

    if action in ("set", "pack-lint"):
        tid = str(req.get("tid", ""))
        projet = str(req.get("projet", ""))
        if not RE_TID.match(tid):
            raise ValueError(f"identifiant de tache invalide : {tid}")
        if not RE_SLUG.match(projet) or projet not in _slugs_connus():
            raise ValueError(f"projet inconnu : {projet}")
        if action == "pack-lint":
            return ["pack-lint", tid, "--projet", projet]
        statut = str(req.get("statut", ""))
        if statut not in STATUTS:
            raise ValueError(f"statut invalide : {statut}")
        return ["set", tid, "--statut", statut, "--projet", projet]

    raise ValueError(f"action refusee : {action or '(vide)'}")


def executer(req: dict) -> dict:
    argv = construire_argv(req)
    p = subprocess.run([sys.executable, str(ROOT / "bin" / "vx.py"), *argv],
                       capture_output=True, text=True, timeout=25, cwd=str(ROOT))
    return {
        "commande": "vx.py " + " ".join(argv),
        "code": p.returncode,
        "out": p.stdout[-8000:],
        "err": p.stderr[-4000:],
    }


# --------------------------------------------------------------------------- #
# lecture de l'etat reel
# --------------------------------------------------------------------------- #

def _journal(proj: Path, limite: int = 60) -> list[tuple[str, str]]:
    f = proj / "journal.md"
    if not f.exists():
        return []
    out = []
    for ligne in f.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^- `([\d\- :]+)`\s*(.*)$", ligne.strip())
        if m:
            out.append((m.group(1), m.group(2)))
    return out[-limite:]


def _analyse_pack(chemin: Path) -> dict:
    """Mesure un pack comme le ferait pack-lint, mais sans faire echouer."""
    if not chemin.exists():
        return {}
    brut = chemin.read_text(encoding="utf-8")
    texte = deaccent(brut)
    bloc = ""
    m = re.search(r"##\s*Fichiers autoris\S*s(.*?)(?=\n## |\Z)", brut, re.S)
    if m:
        bloc = m.group(1)
    fichiers = [f.split(":")[0].strip() for f in re.findall(r"`([^`\n]+?)`", bloc)
                if "/" in f or "." in f]
    dod = re.search(r"##\s*Definition of Done(.*?)(?=\n## |\Z)", brut, re.S)
    hors = re.search(r"##\s*Hors p\S*rim\S*tre(.*?)(?=\n## |\Z)", brut, re.S)
    contrats = re.search(r"##\s*Contrats(.*?)(?=\n## |\Z)", brut, re.S)
    return {
        "lignes": len(brut.splitlines()),
        "tokens": int(len(brut) / 3.6),
        "fichiers": len(fichiers),
        "sections": sum(1 for s in PACK_SECTIONS if s in texte),
        "marqueurs": ("<!-- A REMPLIR" in texte) or ("TODO-PACK" in texte),
        "dod_cochable": bool(dod and re.search(r"^\s*-\s*\[ \]", dod.group(1), re.M)),
        "dod_cases": len(re.findall(r"^\s*-\s*\[ \]", dod.group(1), re.M)) if dod else 0,
        "hors_perimetre": bool(hors and len(hors.group(1).strip()) > 12
                               and "A REMPLIR" not in deaccent(hors.group(1))),
        "contrats_recopies": bool(contrats and "```" in contrats.group(1)),
    }


def _etat_role(cle: str, taches: list, packs: list[dict]) -> dict:
    """Jauge + etat textuel d'un role, derives des taches reelles.

    Un poste peut etre tenu par PLUSIEURS agents a la fois : deux implementeurs
    sur des fichiers disjoints, c'est le cas normal d'une vague. `actifs` compte
    les instances en cours ; la salle affiche une mascotte par instance.

    Le chef fait exception et reste toujours seul : `chef` n'est pas un role de
    tache (voir ROLES dans vx.py), donc aucune tache ne peut lui etre affectee,
    et `vx doctor` signale un `role: chef` ecrit a la main comme role inconnu.
    """
    miennes = [m for _, m in taches if str(m.get("role")) == cle]
    total = len(miennes)
    faites = sum(1 for m in miennes if str(m.get("statut")) == "fait")
    en_cours = [str(m.get("id")) for m in miennes if str(m.get("statut")) == "en-cours"]
    bloque = any(str(m.get("statut")) == "bloque" for m in miennes)

    if cle == "chef":
        # Mesure sur ses packs, pas sur des taches qu'il executerait.
        total = len(taches)
        faites = sum(1 for p in packs if p.get("sections") == len(PACK_SECTIONS)
                     and not p.get("marqueurs"))
        en_cours = ["pack"] if faites < total else []   # jamais plus d'un
        bloque = False

    actif = bool(en_cours)
    etat = ("bloqué" if bloque else "au travail" if actif
            else "terminé" if total and faites == total else "en attente")
    return {
        "total": total, "faits": faites, "actif": actif, "bloque": bloque,
        "actifs": len(en_cours), "en_cours": en_cours,
        "jauge": round(faites / total, 3) if total else 0.0, "etat": etat,
    }


def _annoter_flux(etat: dict) -> dict:
    """Complete les relais qui n'ont pas dit ce qu'ils transportent (mode demo)."""
    for f in etat.get("flux", []):
        if "objet" not in f:
            f["objet"], f["objet_nom"] = _objet(f["de"], f["vers"])
    return etat


def construire_etat() -> dict:
    projets = lister_projets()
    if not projets:
        return _annoter_flux(etat_demo())

    proj = projets[0]
    for p in projets:  # on pilote le projet actif, sinon le premier
        bmeta, _ = lire_frontmatter(p / "brief.md")
        if str(bmeta.get("statut", "")).strip() not in ("clos", "archive", ""):
            proj = p
            break
    bmeta, _ = lire_frontmatter(proj / "brief.md")
    taches = lister_taches(proj)
    statuts = {str(m.get("id")): str(m.get("statut", "a-faire")) for _, m in taches}

    packs, lignes_taches = [], []
    for d, m in taches:
        a = _analyse_pack(d / "context.md")
        packs.append(a)
        res = _analyse_result(d / "result.md")
        lint = ("—" if not a else
                "FAIL" if (a["marqueurs"] or a["sections"] < len(PACK_SECTIONS)
                           or a["lignes"] > PACK_MAX_LIGNES
                           or a["fichiers"] > PACK_MAX_FICHIERS) else "PASS")
        deps = m.get("deps") or []
        deps = deps if isinstance(deps, list) else [deps]
        lignes_taches.append({
            "id": str(m.get("id")), "titre": champ(m, "titre", ""),
            "role": str(m.get("role")), "statut": str(m.get("statut", "a-faire")),
            "lint": lint, "tokens": a.get("tokens", 0), "fichiers": a.get("fichiers", 0),
            "bloquee": any(statuts.get(x) != "fait" for x in deps),
            "verdict": res.get("verdict", ""),
            # pack jamais touché (gabarit intact) : à écrire, pas à réparer
            "vierge": bool(a.get("marqueurs", True)) and a.get("fichiers", 0) == 0,
        })

    roles = []
    for cle, nom, sous, label in ROLES_META:
        if cle == "vault":
            pbs = _doctor_rapide(projets)
            roles.append({
                "cle": cle, "nom": nom, "sous": sous,
                "label": label, "valeur": f"{len(pbs)} pb" if pbs else "sain",
                "jauge": 0.12 if pbs else 1.0, "etat": "incohérent" if pbs else "cohérent",
                "actif": bool(pbs), "actifs": 1 if pbs else 0, "en_cours": [],
                "note": pbs[0] if pbs else "deps, cycles, résultats : ok",
            })
            continue
        e = _etat_role(cle, taches, packs)
        ids = {str(m.get("id")) for _, m in taches if str(m.get("role")) == cle}
        roles.append({
            "cle": cle, "nom": nom, "sous": sous,
            "label": label, "valeur": f"{e['faits']}/{e['total']}",
            "jauge": e["jauge"], "etat": e["etat"],
            "actif": e["actif"], "actifs": e["actifs"], "en_cours": e["en_cours"],
            "note": _derniere_ligne(proj, cle, ids),
        })

    pipeline = [{"k": k, "n": sum(1 for _, m in taches if str(m.get("statut")) == k)}
                for k in ORDRE_PIPELINE]

    jr = _journal(proj)
    serie = _serie_depuis_journal(jr, len(taches),
                                  sum(1 for _, m in taches if str(m.get("statut")) == "fait"))

    # La prod a son mot a dire dans la todo : une sonde au rouge ou une erreur
    # recurrente passe devant les packs a ecrire.
    sup = supervision.etat()
    todo = _todo(proj, taches, lignes_taches)
    todo = sorted(todo + supervision.suggestions(sup, proj.name),
                  key=lambda i: i["prio"])

    dernier = packs[-1] if packs else {}
    return {
        "demo": False,
        "horodate": datetime.now().strftime("%H:%M:%S"),
        "heure": datetime.now().strftime("%H:%M"),
        "projet": {
            "slug": proj.name, "titre": champ(bmeta, "titre", proj.name),
            "statut": champ(bmeta, "statut", "?"), "objectif": champ(bmeta, "objectif", "—"),
            "depot": champ(bmeta, "depot", ""),
        },
        "roles": roles, "pipeline": pipeline, "taches": lignes_taches,
        "serie": serie, "seuils": _seuils(dernier),
        "flux": _flux(taches), "todo": todo,
        "supervision": sup,
        "pilotable": True,
        "ticker": _ticker(proj.name, taches, jr),
        "journal": [f"{h.split(' ')[1]}  {t}" for h, t in jr[-9:]][::-1],
    }


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
    }
    if (de, vers) in exact:
        return exact[(de, vers)]
    if vers == "scribe":
        return ("notes", "à capitaliser")
    return {
        "eclaireur":    ("carte", "coordonnées"),
        "architecte":   ("contrat", "contrat"),
        "implementeur": ("diff", "livrable"),
        "verificateur": ("defauts", "défauts"),
    }.get(de, ("resultat", "compte rendu"))


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
                         else "livre" if statut[dep] == "fait" else "attente"),
            })
    for _, m in taches:
        if str(m.get("statut")) == "pret":
            tid = str(m.get("id"))
            aretes.append({"de": "chef", "vers": role[tid], "de_tid": "pack",
                           "vers_tid": tid, "quoi": titre[tid],
                           "objet": "pack", "objet_nom": "pack", "etat": "livre"})
    return aretes


ETIQUETTE_TODO = {
    1: "URGENT", 2: "À FAIRE", 3: "PRÊT", 4: "ENSUITE",
}


def _todo(proj: Path, taches, lignes) -> list[dict]:
    """La todo du chef, déduite de l'état du vault — jamais saisie à la main.

    Chaque entrée est une action que seul le chef peut faire : écrire un pack,
    répondre à un blocage, dispatcher, intégrer, faire vérifier, capitaliser.
    """
    par_id = {l["id"]: l for l in lignes}
    statuts = {l["id"]: l["statut"] for l in lignes}
    slug = proj.name
    items = []

    def add(prio, titre, detail, cmd="", exe=None):
        # « exe » n'est rempli que pour ce que la page a le droit de lancer :
        # un changement de statut. Écrire un pack ou dispatcher reste à la main
        # du chef dans Claude Code — la page propose alors de copier.
        items.append({"prio": prio, "etiquette": ETIQUETTE_TODO[prio],
                      "titre": titre, "detail": detail, "cmd": cmd, "exe": exe})

    bmeta, _ = lire_frontmatter(proj / "brief.md")
    if champ(bmeta, "objectif", "") in ("", "—"):
        add(2, "Compléter le brief", "objectif vide — une section vide est une question à poser",
            f"vault/projets/{slug}/brief.md")

    for l in lignes:
        if l["statut"] == "bloque":
            add(1, f"Débloquer {l['id']}", f"{l['titre']} — réponds, corrige le pack, crée une tâche neuve",
                f"python3 bin/vx.py set {l['id']} --statut a-faire --projet {slug}",
                {"action": "set", "tid": l["id"], "statut": "a-faire", "projet": slug})

    for l in lignes:
        if l["statut"] in ("fait", "abandonne"):
            continue
        if l["lint"] == "—" or l.get("vierge"):
            add(2, f"Écrire le pack de {l['id']}", f"{l['titre']} — rien à dispatcher sans pack",
                f"/pack {l['id']}")
        elif l["lint"] == "FAIL":
            raison = ("whitelist > 12 fichiers — découpe la tâche" if l["fichiers"] > 12
                      else "refusé par pack-lint")
            add(2, f"Corriger le pack de {l['id']}", f"{l['titre']} — {raison}", f"/pack {l['id']}")

    for d, m in taches:
        tid = str(m.get("id"))
        if (d / "result.md").exists() and statuts.get(tid) not in ("fait", "abandonne"):
            r = _analyse_result(d / "result.md")
            soupcon = " — « non vérifié » vaut non fait" if r.get("non_verifie") else ""
            add(2, f"Intégrer {tid}", f"compte rendu rendu, statut encore {statuts.get(tid)}{soupcon}",
                f"python3 bin/vx.py set {tid} --statut fait --projet {slug}",
                {"action": "set", "tid": tid, "statut": "fait", "projet": slug})

    prets = [l["id"] for l in lignes if l["statut"] == "pret" and l["lint"] == "PASS"]
    if prets:
        add(3, f"Dispatcher la vague ({len(prets)})", "un seul message, " + ", ".join(prets),
            "/dispatch " + slug)

    verifiees = {dep for _, m in taches if str(m.get("role")) == "verificateur"
                 for dep in (m.get("deps") if isinstance(m.get("deps"), list) else [m.get("deps")] or [])}
    for l in lignes:
        if l["role"] == "implementeur" and l["statut"] == "fait" and l["id"] not in verifiees:
            add(3, f"Faire vérifier {l['id']}", f"{l['titre']} — livré sans personne pour tenter de le casser",
                f"python3 bin/vx.py tache \"Casser {l['titre'][:28]}\" --projet {slug} "
                f"--role verificateur --dep {l['id']}")

    ouvertes = [l for l in lignes if l["statut"] not in ("fait", "abandonne")]
    a_scribe = any(l["role"] == "scribe" for l in lignes)
    if lignes and not ouvertes and not a_scribe:
        add(4, "Capitaliser", "toutes les tâches sont livrées — le scribe améliore les prochains packs",
            f"/clore {slug}")

    # entrées écrites à la main par le chef dans todo.md
    f = proj / "todo.md"
    if f.exists():
        for ligne in f.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\s*-\s*\[( |x|X)\]\s+(.+)$", ligne)
            if m and m.group(1) == " ":
                add(3, m.group(2).strip(), "noté à la main dans todo.md")

    items.sort(key=lambda i: i["prio"])
    return items


def _analyse_result(chemin: Path) -> dict:
    if not chemin.exists():
        return {}
    t = chemin.read_text(encoding="utf-8")
    verdict = ""
    for v in ("CONFORME", "DÉFAUTS", "DEFAUTS", "NON VÉRIFIABLE"):
        if v in t:
            verdict = v
            break
    return {"verdict": verdict, "non_verifie": "non vérifié" in t.lower()}


def _derniere_ligne(proj: Path, cle: str, ids: set[str]) -> str:
    """Dernier événement du journal concernant ce rôle.

    Le journal note les changements par ID de tâche (« T007 statut ... »), pas
    par rôle : on passe donc les IDs du rôle, sinon on ne retrouve que la ligne
    de création et la carte reste figée.
    """
    for _, txt in reversed(_journal(proj)):
        if cle == "chef" or cle in txt or any(t in txt for t in ids):
            return txt
    return "aucune activité"


def _doctor_rapide(projets) -> list[str]:
    pbs = []
    for proj in projets:
        taches = lister_taches(proj)
        ids = {str(m.get("id")) for _, m in taches}
        for d, m in taches:
            deps = m.get("deps") or []
            deps = deps if isinstance(deps, list) else [deps]
            for dep in deps:
                if dep not in ids:
                    pbs.append(f"{m.get('id')} : dépendance fantôme {dep}")
            if str(m.get("statut")) == "fait" and not (d / "result.md").exists():
                pbs.append(f"{m.get('id')} : fait sans result.md")
            if str(m.get("statut")) in ("pret", "en-cours") and not _pack_rempli(d / "context.md"):
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


def _seuils(p: dict) -> dict:
    def l(nom, seuil, val, ok, brut=""):
        return {"nom": nom, "seuil": seuil, "valeur": val, "ok": ok, "brut": brut}

    if not p:
        return {"hard": [], "soft": [], "vide": True}
    return {
        "vide": False,
        "hard": [
            l("sections_obligatoires", f"= {len(PACK_SECTIONS)}", str(p["sections"]),
              p["sections"] == len(PACK_SECTIONS)),
            l("max_lignes_pack", f"max {PACK_MAX_LIGNES}", str(p["lignes"]),
              p["lignes"] <= PACK_MAX_LIGNES),
            l("max_fichiers_whitelist", f"max {PACK_MAX_FICHIERS}", str(p["fichiers"]),
              p["fichiers"] <= PACK_MAX_FICHIERS),
            l("marqueurs_a_remplir", "= 0", "0" if not p["marqueurs"] else "oui",
              not p["marqueurs"]),
            l("dod_cochable", "obligatoire", f"{p['dod_cases']} cases", p["dod_cochable"]),
        ],
        "soft": [
            l("contrats_recopies", "recommandé", "oui" if p["contrats_recopies"] else "non",
              p["contrats_recopies"]),
            l("hors_perimetre_rempli", "recommandé", "oui" if p["hors_perimetre"] else "non",
              p["hors_perimetre"]),
            l("densite_tokens", "600 – 1800", str(p["tokens"]), 600 <= p["tokens"] <= 1800),
            l("whitelist_non_vide", "min 1", str(p["fichiers"]), p["fichiers"] >= 1),
        ],
    }


def _ticker(slug, taches, jr) -> str:
    faits = sum(1 for _, m in taches if str(m.get("statut")) == "fait")
    bloq = sum(1 for _, m in taches if str(m.get("statut")) == "bloque")
    der = jr[-1][1] if jr else "vault initialisé"
    return (f"PROJET {slug.upper()} · {len(taches)} TÂCHES · {faits} LIVRÉES · "
            f"{bloq} BLOQUÉES · DERNIER ÉVÉNEMENT : {der.upper()}")


# --------------------------------------------------------------------------- #
# etat de demonstration (vault vide)
# --------------------------------------------------------------------------- #

def etat_demo() -> dict:
    now = datetime.now()
    roles_demo = [
        ("chef", "7/9", 0.78, "écrit un pack", "T008 — pack rédigé, lint en cours"),
        ("eclaireur", "4/4", 1.0, "terminé", "T001 — 137 fichiers balayés, 12 retenus"),
        ("architecte", "2/2", 1.0, "terminé", "T003 — contrat d'export figé"),
        ("verificateur", "1/3", 0.33, "au travail", "T007 — 2 défauts, repro fournie"),
        ("implementeur", "3/5", 0.60, "au travail", "T006 — diff +184 −31 sur 3 fichiers"),
        ("scribe", "0/1", 0.0, "en attente", "attend la fin de la vague 3"),
        ("vault", "sain", 1.0, "cohérent", "deps, cycles, résultats : ok"),
    ]
    roles = []
    for (cle, nom, sous, label), (_, val, jauge, etat, note) in zip(ROLES_META, roles_demo):
        actifs = (2 if cle == "implementeur" and etat == "au travail"
                  else 1 if etat == "au travail" else 0)
        roles.append({"cle": cle, "nom": nom, "sous": sous,
                      "label": label, "valeur": val, "jauge": jauge, "etat": etat,
                      "actif": etat == "au travail", "actifs": actifs,
                      "en_cours": [], "note": note})

    taches = [
        ("T001", "eclaireur", "fait", "Cartographier le module d'export", "PASS", 940, 5, ""),
        ("T002", "eclaireur", "fait", "Relever les formats de date en base", "PASS", 710, 3, ""),
        ("T003", "architecte", "fait", "Trancher le format CSV et l'encodage", "PASS", 1180, 4, ""),
        ("T004", "implementeur", "fait", "Sérialiseur CSV + échappement", "PASS", 1020, 6, ""),
        ("T005", "verificateur", "fait", "Casser le sérialiseur", "PASS", 860, 4, "CONFORME"),
        ("T006", "implementeur", "en-cours", "Filtres par date sur l'export", "PASS", 1240, 5, ""),
        ("T007", "verificateur", "en-cours", "Attaquer les bornes de date", "PASS", 980, 4, "DÉFAUTS"),
        ("T008", "implementeur", "pret", "Corriger les bornes inclusives", "PASS", 1090, 3, ""),
        ("T009", "implementeur", "bloque", "Export > 100k lignes en flux", "FAIL", 2310, 17, ""),
        ("T010", "scribe", "a-faire", "Capitaliser la vague 3", "—", 0, 0, ""),
    ]
    lignes = [{"id": i, "role": r, "statut": s, "titre": t, "lint": l,
               "tokens": tk, "fichiers": f, "bloquee": s == "bloque", "verdict": v}
              for i, r, s, t, l, tk, f, v in taches]

    pts, cum = [], 0
    for i in range(48):
        if i in (6, 11, 17, 26, 33):
            cum += 1
        pts.append(cum)
    barres = [2 if i in (6, 11, 17, 26, 33) else (-1 if i in (21, 38) else 1) for i in range(48)]

    pack_demo = {"lignes": 95, "tokens": 968, "fichiers": 5, "sections": len(PACK_SECTIONS),
                 "marqueurs": False, "dod_cochable": True, "dod_cases": 6,
                 "hors_perimetre": True, "contrats_recopies": True}

    return {
        "demo": True,
        "horodate": now.strftime("%H:%M:%S"), "heure": now.strftime("%H:%M"),
        "projet": {"slug": "export-csv", "titre": "Export CSV avec filtres",
                   "statut": "en cours",
                   "objectif": "un fichier CSV téléchargeable, filtré par plage de dates"},
        "roles": roles,
        "pipeline": [{"k": "a-faire", "n": 1}, {"k": "pret", "n": 1}, {"k": "en-cours", "n": 2},
                     {"k": "revue", "n": 0}, {"k": "bloque", "n": 1}, {"k": "fait", "n": 5}],
        "taches": lignes,
        "serie": {"points": pts, "barres": barres, "titre": "AVANCEMENT",
                  "valeur": "5/10", "sous": "50 % des tâches livrées"},
        "seuils": _seuils(pack_demo),
        "supervision": supervision.etat(),
        "flux": [
            {"de":"eclaireur","vers":"architecte","de_tid":"T001","vers_tid":"T003",
             "quoi":"Trancher le format CSV et l'encodage","etat":"livre"},
            {"de":"eclaireur","vers":"architecte","de_tid":"T002","vers_tid":"T003",
             "quoi":"Trancher le format CSV et l'encodage","etat":"livre"},
            {"de":"architecte","vers":"implementeur","de_tid":"T003","vers_tid":"T004",
             "quoi":"Sérialiseur CSV + échappement","etat":"livre"},
            {"de":"implementeur","vers":"verificateur","de_tid":"T004","vers_tid":"T005",
             "quoi":"Casser le sérialiseur","etat":"livre"},
            {"de":"architecte","vers":"implementeur","de_tid":"T003","vers_tid":"T006",
             "quoi":"Filtres par date sur l'export","etat":"actif"},
            {"de":"implementeur","vers":"verificateur","de_tid":"T006","vers_tid":"T007",
             "quoi":"Attaquer les bornes de date","etat":"actif"},
            {"de":"verificateur","vers":"implementeur","de_tid":"T007","vers_tid":"T008",
             "quoi":"Corriger les bornes inclusives","etat":"livre"},
            {"de":"architecte","vers":"implementeur","de_tid":"T003","vers_tid":"T009",
             "quoi":"Export > 100k lignes en flux","etat":"bloque"},
            {"de":"implementeur","vers":"scribe","de_tid":"T008","vers_tid":"T010",
             "quoi":"Capitaliser la vague 3","etat":"attente"},
            {"de":"chef","vers":"implementeur","de_tid":"pack","vers_tid":"T008",
             "quoi":"Corriger les bornes inclusives","etat":"livre"},
        ],
        "todo": [
            {"prio":1,"etiquette":"URGENT","titre":"Débloquer T009",
             "detail":"Export > 100k lignes — réponds, corrige le pack, crée une tâche neuve",
             "cmd":"python3 bin/vx.py set T009 --statut a-faire --projet export-csv"},
            {"prio":2,"etiquette":"À FAIRE","titre":"Corriger le pack de T009",
             "detail":"whitelist 17 fichiers > 12 — découpe la tâche en deux","cmd":"/pack T009"},
            {"prio":2,"etiquette":"À FAIRE","titre":"Intégrer T007",
             "detail":"le vérificateur rend DÉFAUTS — recopie-les dans le pack de correction",
             "cmd":"python3 bin/vx.py set T007 --statut fait --projet export-csv"},
            {"prio":3,"etiquette":"PRÊT","titre":"Dispatcher la vague (1)",
             "detail":"un seul message, T008","cmd":"/dispatch export-csv"},
            {"prio":3,"etiquette":"PRÊT","titre":"Écrire le pack de T010",
             "detail":"Capitaliser la vague 3 — rien à dispatcher sans pack","cmd":"/pack T010"},
            {"prio":4,"etiquette":"ENSUITE","titre":"Capitaliser",
             "detail":"le scribe agrège les « Retour sur le pack » et corrige les gabarits",
             "cmd":"/clore export-csv"},
        ],
        "ticker": ("DÉMO · PROJET EXPORT-CSV · 10 TÂCHES · 5 LIVRÉES · 1 BLOQUÉE · "
                   "T009 REFUSÉ PAR PACK-LINT : WHITELIST 17 FICHIERS > 12 — TÂCHE À DÉCOUPER"),
        "journal": [
            "14:51  T007 statut pret -> en-cours",
            "14:49  T006 statut pret -> en-cours",
            "14:48  vague 3 dispatchée (2 agents)",
            "14:44  T009 refusé par pack-lint : whitelist 17 fichiers",
            "14:41  T008 créée — Corriger les bornes inclusives [implementeur]",
            "14:39  T005 statut en-cours -> fait",
            "14:33  T004 statut en-cours -> fait",
            "14:28  T003 statut en-cours -> fait",
            "14:12  projet créé (Export CSV avec filtres)",
        ],
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
            try:
                etat = construire_etat()
                etat["jeton"] = JETON
                etat["statuts"] = list(STATUTS)
            except Exception as exc:  # le dashboard ne doit jamais tomber
                etat = {"erreur": str(exc)}
            self._json(200, etat)
            return
        if self.path in ("/", ""):
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        # fichiers statiques jamais mis en cache : une version périmée de
        # dash.js après une mise à jour donnait une page « qui ne marche pas ».
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

    def do_POST(self):
        route = self.path.split("?", 1)[0]
        if route != "/api/run" and not route.startswith("/api/term/"):
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
            self._json(200, executer(req))
        except ValueError as exc:
            self._json(400, {"erreur": str(exc)})
        except subprocess.TimeoutExpired:
            self._json(504, {"erreur": "la commande a dépassé 25 s"})
        except Exception as exc:
            self._json(500, {"erreur": str(exc)})

    def log_message(self, *_a):
        pass


RE_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def changer_couleur(hexa: str) -> int:
    """Lit ou ecrit la couleur d'accent de la salle, en validant la valeur.

    Existe pour qu'on n'ait pas a faire un sed depuis le bon repertoire avec le
    bon motif : la moindre faute laissait une variable CSS invalide, donc une
    page sans fond, sans rien dire.
    """
    css = WEB / "dash.css"
    actuelle = re.search(r"--accent:(#[0-9a-fA-F]{6})", css.read_text(encoding="utf-8"))
    if not hexa:
        print(actuelle.group(1) if actuelle else "— variable --accent introuvable")
        return 0
    if not RE_HEX.match(hexa):
        print(f"dash: couleur invalide : « {hexa} » — attendu #rrggbb, par exemple #3b82f6",
              file=sys.stderr)
        return 1
    texte, n = re.subn(r"--accent:#[0-9a-fA-F]{6}", f"--accent:{hexa}",
                       css.read_text(encoding="utf-8"), count=1)
    if not n:
        print("dash: variable --accent introuvable dans dash.css", file=sys.stderr)
        return 1
    css.write_text(texte, encoding="utf-8")
    print(f"accent : {actuelle.group(1) if actuelle else '?'} -> {hexa}")
    print("recharge la page — inutile de relancer le serveur, la CSS est servie à chaque fois.")
    return 0


def main():
    p = argparse.ArgumentParser(prog="dash.py", description="Tableau de bord live du vault.")
    p.add_argument("--port", type=int, default=7777)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--json", action="store_true", help="imprime l'etat et sort")
    p.add_argument("--no-open", action="store_true")
    p.add_argument("--couleur", nargs="?", const="", metavar="#RRGGBB",
                   help="change la couleur d'accent de la salle (sans valeur : l'affiche)")
    a = p.parse_args()

    if a.couleur is not None:
        sys.exit(changer_couleur(a.couleur))

    if a.json:
        print(json.dumps(construire_etat(), ensure_ascii=False, indent=2))
        return
    if not (WEB / "index.html").exists():
        print(f"dash: fichiers web absents dans {WEB}", file=sys.stderr)
        sys.exit(1)

    srv = ThreadingHTTPServer((a.host, a.port), partial(Handler, directory=str(WEB)))
    url = f"http://{a.host}:{a.port}"
    etat = construire_etat()
    print(f"  ╭────────────────────────────────────────────╮")
    print(f"  │  AGENTX · SALLE DES AGENTS                 │")
    print(f"  │  {url:<42}│")
    print(f"  │  {'mode DÉMO (vault vide)' if etat['demo'] else 'données réelles : ' + etat['projet']['slug']:<41} │")
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
