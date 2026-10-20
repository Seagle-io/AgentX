#!/usr/bin/env python3
"""reprise — bloc de reprise du chef (SessionStart compact|clear) et plan.md généré, depuis le disque seul.

Cahier syndicat T018 (passation zéro perte) : 11 sections dans l'ordre du gabarit, section vide omise,
débordement « … +n (board) », ≤ MAX_LIGNES. Étages du chef : terminal.chemin_chef(<cle>) ; défaut ⇒ projets
ouverts sans chef dédié vivant (terminal.lister_chefs, tenant_de_projet).
"""

import datetime as _dt
import json
import re
from pathlib import Path

import agents
import demandes
import environnement
import terminal
import vx
from contrats import ROOT, VAGUES

ATTENTES = ROOT / "run" / "attentes"
MAX_LIGNES = 60
SOURCES = "## Sources : board · integrer --court · decisions.md (ne pas relire autre chose)"

RE_TID = re.compile(r"\bT\d{3}\b")
RE_DID = re.compile(r"\bD\d{3}\b")
RE_DATE = re.compile(r"(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?")
RE_CONSIGNE = re.compile(r"^- consigne:\s*(.+?)\s*(?:\(jusqu'à:\s*([^)]*)\))?\s*$")
RE_CHOIX = re.compile(r"^- \[ \] \?")
RE_PERIME = re.compile(r"\b(?:URGENT|EN VOL)\b", re.I)
RE_CORRECTION = re.compile(r"^- \[ \] Pack (T\d{3}) :\s*(.+)$")
RE_FRONTMATTER = re.compile(r"^---\n.*?\n---\n", re.S)


def etages(cle: str) -> tuple[dict[str, list[str]], str]:
    """(étage → projets, compte) du chef `cle` ; défaut ou ∅ ⇒ projets ouverts non tenus par un dédié vivant ;
    dédié inconnu ou illisible ⇒ ({}, "")."""
    if not cle or cle == terminal.DEFAUT:
        chefs = terminal.lister_chefs(str(ROOT))
        libres = [p.name for p in vx.lister_projets()
                  if (terminal.tenant_de_projet(chefs, p.name) or {}).get("defaut", True)]
        return {s: [s] for s in libres}, next((str(c["compte"]) for c in chefs if c["defaut"]), "")
    try:
        lu = json.loads(Path(terminal.chemin_chef(cle)).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}, ""
    return {str(e): [str(p) for p in ps] for e, ps in lu.get("etages", {}).items()}, str(lu.get("compte") or "")


def projets(cle: str) -> list[Path]:
    """Dossiers vault des projets tenus par `cle`, dans l'ordre des étages, existants seuls."""
    slugs = dict.fromkeys(p for ps in etages(cle)[0].values() for p in ps)
    return [d for d in (vx.VAULT / "projets" / s for s in slugs) if d.is_dir()]


def _statuts(projs: list[Path]) -> dict[str, str]:
    return {str(m.get("id")): str(m.get("statut")) for p in projs for _, m in vx.lister_taches(p)}


def _todo(proj: Path) -> list[str]:
    todo = proj / "todo.md"
    return [l.rstrip() for l in todo.read_text(encoding="utf-8").splitlines()] if todo.exists() else []


def perimee(ligne: str, statuts: dict[str, str], dem: dict[str, str]) -> bool:
    """Ligne todo périmée : EN VOL/URGENT sur tâche(s) toutes close(s) ; sans tâche citée, demande(s) toutes non
    ouverte(s) ; une demande close ne périme jamais une ligne qui cite une tâche. `- [ ] ?` jamais."""
    if RE_CHOIX.match(ligne) or not ligne.startswith("- [ ] "):
        return False
    tids = RE_TID.findall(ligne)
    if tids:
        return bool(RE_PERIME.search(ligne)) and all(statuts.get(t) in vx.STATUT_FERME for t in tids)
    dids = RE_DID.findall(ligne)
    return bool(dids) and all(dem.get(d, "ouverte") != "ouverte" for d in dids)


def perimees(proj: Path, texte: str) -> list[str]:
    """Lignes (rstrip) de `texte` (todo.md de `proj`) périmées au regard du vault et de run/demandes.jsonl."""
    statuts = _statuts([proj])
    dem = {str(d.get("id")): str(d.get("statut")) for d in demandes.lire()}
    return [l.rstrip() for l in texte.splitlines() if perimee(l.rstrip(), statuts, dem)]


def plan(proj: Path) -> list[str]:
    """Compte par statut puis 1 ligne par tâche ouverte (statut, rôle, titre, deps)."""
    taches = vx.lister_taches(proj)
    compte: dict[str, int] = {}
    for _, m in taches:
        compte[str(m.get("statut"))] = compte.get(str(m.get("statut")), 0) + 1
    lignes = [f"- {len(taches)} tâches : " + " · ".join(f"{s} {compte[s]}" for s in vx.STATUTS if s in compte)]
    for _, m in taches:
        if str(m.get("statut")) not in vx.STATUT_FERME:
            deps = vx._deps(m)
            lignes.append(f"- {m.get('id')} {m.get('statut')} {m.get('role')} — {m.get('titre', '')}"
                          + (f" ← {', '.join(map(str, deps))}" if deps else ""))
    return lignes


def ecrire_plan(proj: Path) -> None:
    """plan.md réécrit depuis le vault, frontmatter existant conservé."""
    chemin = proj / "plan.md"
    m = RE_FRONTMATTER.match(chemin.read_text(encoding="utf-8")) if chemin.exists() else None
    horodatage = _dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    chemin.write_text(f"{m.group(0) if m else ''}# Plan — {proj.name} (généré {horodatage})\n\n"
                      + "\n".join(plan(proj)) + "\n", encoding="utf-8")


def passer(cle: str) -> None:
    """PreCompact : par projet du chef, passation (todo + journal « passation (PreCompact) ») et plan.md réécrit."""
    for proj in projets(cle):
        vx.passer(proj, None, "PreCompact")
        ecrire_plan(proj)


def maintenant(proj: Path, todo: list[str]) -> list[str]:
    """Intégrer (statut result) · verdicts proposés · questions agent · Pack (+ correction) · Dispatcher · Répondre/virer · contrats."""
    corrections = {m.group(1): m.group(2) for l in todo if (m := RE_CORRECTION.match(l))}
    integrer, verdicts, questions, packs, prets, bloques = [], [], [], [], [], []
    taches = vx.lister_taches(proj)
    for d, m in taches:
        tid, statut = str(m.get("id")), str(m.get("statut"))
        r = d / "result.md"
        if r.exists() and statut in ("revue", "bloque", "en-cours"):
            texte = r.read_text(encoding="utf-8")
            rmeta, _ = vx.lire_frontmatter(r)
            if statut != "bloque":
                integrer.append(f"- Intégrer {tid} (result: {rmeta.get('statut') or '∅'})")
            proposition = vx.verdict_propose(proj.name, tid, statut, rmeta, texte)
            if proposition:
                commande, raison = proposition.split("   # proposé : ", 1)
                verdicts.append(f"- verdict proposé {tid} ({raison}) : {vx._court(commande)}")
            questions += [f"- question {tid} : {vx._court(l.lstrip('- '))}"
                          for l in vx._section(texte, "Pour la suite").splitlines() if "?" in l]
        elif statut == "revue":
            integrer.append(f"- Intégrer {tid} (result: ∅)")
        if statut == "a-faire" and not vx._pack_rempli(d / "context.md"):
            packs.append(f"- Pack {tid}" + (f" ({corrections[tid]})" if tid in corrections else ""))
        elif statut == "pret":
            prets.append(f"- Dispatcher {tid}")
        elif statut == "bloque":
            bloques.append(f"- Répondre/virer {tid}")
    contrats = [f"- contrat {t} sans lot — créer le lot ou renoncer" for t in vx.contrats_sans_lot(taches)]
    return integrer + verdicts + questions + packs + prets + bloques + contrats


def en_vol(projs: list[Path]) -> list[str]:
    """Agents vivants des projets + attentes de fond (run/vagues/<projet>-*.json, run/attentes/<idem>.log 0 o)."""
    noms = {p.name for p in projs}
    sess = agents.sessions()
    lignes = []
    for f in sorted(agents.lister(), key=lambda f: f["tid"]):
        if f["projet"] in noms:
            e = agents.etat(f, sess)
            if agents.vivant(e):
                lignes.append(f"- {f['tid']} {f.get('role', '')} {e} ({f['projet']})")
    for v in sorted(VAGUES.glob("*.json")) if VAGUES.exists() else ():
        attente = ATTENTES / f"{v.stem}.log"
        if v.stem.rsplit("-", 2)[0] in noms and attente.exists() and attente.stat().st_size == 0:
            taches = json.loads(v.read_text(encoding="utf-8")).get("taches", [])
            lignes.append(f"- attente {v.stem} ({', '.join(map(str, taches))})")
    return lignes


def _blocs(texte: str) -> list[tuple[str, str, str, str]]:
    """[(date, heure, titre, corps)] des blocs « ## … » de decisions.md."""
    blocs = []
    for b in re.split(r"(?m)^## ", texte)[1:]:
        tete, _, corps = b.partition("\n")
        m = RE_DATE.search(tete)
        titre = re.sub(r"^[\s—–:-]+", "", tete[m.end():] if m else tete).strip()
        blocs.append((m.group(1) if m else "", (m.group(2) or "") if m else "", titre, corps))
    return blocs


def decisions(projs: list[Path], aujourdhui: str) -> tuple[list[str], list[str]]:
    """(consignes actives ≤ récentes d'abord, décisions du jour sans Txxx) depuis decisions.md."""
    statuts = _statuts(projs)
    consignes, sans_tache = [], []
    for p in projs:
        f = p / "decisions.md"
        for jour, heure, titre, corps in _blocs(f.read_text(encoding="utf-8")) if f.exists() else ():
            for l in corps.splitlines():
                m = RE_CONSIGNE.match(l.strip())
                if not m:
                    continue
                jusqu = (m.group(2) or "").strip()
                if (RE_TID.fullmatch(jusqu) and statuts.get(jusqu) in vx.STATUT_FERME) \
                        or (RE_DATE.fullmatch(jusqu) and jusqu < aujourdhui):
                    continue
                consignes.append((jour, heure, f"- {heure or jour} {m.group(1)}"
                                  + (f" (jusqu'à: {jusqu})" if jusqu and jusqu != "∅" else "")))
            if jour == aujourdhui and not RE_TID.search(titre + corps):
                sans_tache.append(f"- {heure or jour} {titre}")
    return [c for *_, c in sorted(consignes, reverse=True)], sans_tache


def lignes_demandes(projs: list[Path]) -> list[str]:
    """Ouvertes non liées à une tâche d'un autre projet + dernier message humain."""
    liees: dict[str, set[str]] = {}
    for p in vx.lister_projets():
        for _, m in vx.lister_taches(p):
            if m.get("demande"):
                liees.setdefault(str(m["demande"]), set()).add(p.name)
    noms = {p.name for p in projs}
    lues = demandes.lire()
    lignes = [f"- {d['id']} ouverte « {vx._court(d.get('texte', ''))} » {str(d.get('t', ''))[11:16]}"
              for d in lues if d.get("statut") == "ouverte" and "id" in d
              and (not liees.get(d["id"]) or liees[d["id"]] & noms)]
    if lues:
        der = lues[-1]
        lignes.append(f"- dernier message : {der.get('id')} {str(der.get('t', ''))[11:16]} "
                      f"« {vx._court(der.get('texte', ''))} » — {der.get('statut')}")
    return lignes


def services() -> list[str]:
    """Services env vivants (environnement.json)."""
    try:
        declares = environnement.charger()
    except environnement.ErreurEnv as e:
        return [f"- environnement.json illisible : {e}"]
    etats = [environnement.etat(s) for s in declares.values()]
    return [f"- {e['nom']} vivant {e['url']} depuis {(e['depuis'] or '?')[11:16]}" for e in etats if e["etat"] == "vivant"]


def _section(titre: str, lignes: list[str], cap: int) -> list[str]:
    if not lignes:
        return []
    reste = len(lignes) - cap
    return [f"## {titre}"] + lignes[:cap] + ([f"… +{reste} (board)"] if reste > 0 else [])


def bloc(cle: str, source: str) -> str:
    """Bloc de reprise ≤ MAX_LIGNES, lu sur disque seul ; sans étage tenu ⇒ « Étages : non tenus », 0 todo d'étage."""
    tenus, compte = etages(cle)
    projs = projets(cle)
    instant = _dt.datetime.now()
    todos = {p.name: _todo(p) for p in projs}
    statuts = _statuts(projs)
    dem = {str(d.get("id")): str(d.get("statut")) for d in demandes.lire()}
    consignes, sans_tache = decisions(projs, instant.strftime("%Y-%m-%d"))
    choix = [l for t in todos.values() for l in t if RE_CHOIX.match(l)]
    notes = [l for t in todos.values() for l in t
             if l.startswith("- [ ] ") and not RE_CHOIX.match(l) and not vx.RE_BLOC.match(l)
             and not RE_CORRECTION.match(l) and not perimee(l, statuts, dem)]
    lignes = [f"# Reprise chef {cle or terminal.DEFAUT} — {instant.strftime('%Y-%m-%d %H:%M')} ({source})"]
    if tenus:
        lignes += ["## Étages", f"- {', '.join(tenus)}" + (f" · compte {compte}" if compte else "")]
    else:
        lignes.append("## Étages : non tenus")
    lignes += _section("Consignes actives", consignes, 6)
    lignes += _section("Vos choix ouverts", choix, 6)
    for p in projs:
        lignes += _section(f"Maintenant — {p.name}", maintenant(p, todos[p.name]), 10)
    lignes += _section("En vol / attentes", en_vol(projs), 6)
    lignes += _section("Décisions sans tâche", sans_tache, 6)
    lignes += _section("Demandes", lignes_demandes(projs), 5)
    lignes += _section("Services", services(), 4)
    lignes += _section("Plan", [l for p in projs for l in plan(p)], 15)
    lignes += _section("Notes", notes, 10)
    if len(lignes) + 1 > MAX_LIGNES:
        garde = MAX_LIGNES - 2
        lignes = lignes[:garde] + [f"… +{len(lignes) - garde} (board)"]
    return "\n".join(lignes + [SOURCES])
