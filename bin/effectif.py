#!/usr/bin/env python3
"""effectif — postes recrutes par etage (cle produit) : run/effectif.json, source unique.

Ecrivain unique : la route POST /api/effectif/{recruter,licencier} de la salle (humain).
Un etage absent = chef seul. Stdlib + agents, produits, roles, frontmatter.
AGENTX_ROOT (env) deplace la racine (via agents.ROOT) — tests sous tmp, jamais le vrai run/.
"""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime

import agents
import frontmatter
import produits
import roles

CHEMIN = agents.ROOT / "run" / "effectif.json"
PLAFOND_ROLE = 4
PLAFOND_ETAGE = 18

_VERROU = threading.Lock()


class Illisible(ValueError):
    pass


def lire() -> dict[str, dict[str, int]]:
    try:
        brut = json.loads(CHEMIN.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except (OSError, ValueError) as e:
        raise Illisible(str(e).splitlines()[0] if str(e) else type(e).__name__) from None
    if not isinstance(brut, dict) or brut.get("version") != 1:
        raise Illisible("version 1 attendue")
    etages = brut.get("etages")
    if not isinstance(etages, dict):
        raise Illisible("etages : objet attendu")
    for etage, postes in etages.items():
        if not isinstance(postes, dict) or any(
                not isinstance(r, str) or type(n) is not int or n < 0 for r, n in postes.items()):
            raise Illisible(f"etages.{etage} : objet {{rôle: entier ≥ 0}} attendu")
    return etages


def ecrire(etages: dict[str, dict[str, int]]) -> None:
    CHEMIN.parent.mkdir(parents=True, exist_ok=True)
    tmp = CHEMIN.with_name(f".effectif.json.{os.getpid()}.tmp")
    tmp.write_text(json.dumps({"version": 1, "maj": datetime.now().isoformat(timespec="seconds"),
                               "etages": etages}, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, CHEMIN)


def etage_de(slug: str) -> str:
    try:
        meta = frontmatter.lire_frontmatter(agents.ROOT / "vault" / "projets" / slug / "brief.md")[0]
    except OSError:
        meta = {}
    return produits.produit_de(meta)[0] or slug


def etages_connus() -> set[str]:
    if produits.erreur():
        return {d.name for d in (agents.ROOT / "vault" / "projets").iterdir() if d.is_dir()}
    return set(produits.tous())


def _muter(etage: str, role: str, delta: int) -> dict[str, int]:
    if etage not in etages_connus():
        raise ValueError(f"étage inconnu : {etage}")
    if role not in roles.tous():
        raise ValueError(f"rôle inconnu : {role}")
    if role not in roles.affectables():
        raise ValueError(f"rôle non affectable : {role}")
    with _VERROU:
        try:
            etages = lire()
        except Illisible as e:
            raise ValueError(f"run/effectif.json illisible : {e} — corriger ou supprimer à la main") from None
        postes = dict(etages.get(etage, {}))
        n = postes.get(role, 0)
        if delta > 0:
            if n == PLAFOND_ROLE:
                raise ValueError(f"plafond atteint : {PLAFOND_ROLE} postes {role} max par étage")
            if sum(postes.values()) == PLAFOND_ETAGE:
                raise ValueError(f"étage plein : {PLAFOND_ETAGE} postes max")
        elif not n:
            raise ValueError(f"aucun poste {role} à licencier sur {etage}")
        if n + delta:
            postes[role] = n + delta
        else:
            del postes[role]
        if postes:
            etages[etage] = postes
        else:
            etages.pop(etage, None)
        ecrire(etages)
        return postes


def recruter(etage: str, role: str) -> dict[str, int]:
    return _muter(etage, role, 1)


def licencier(etage: str, role: str) -> dict[str, int]:
    return _muter(etage, role, -1)


def occupes(etage: str, role: str, sauf: tuple[str, str] | None = None) -> int:
    sess = agents.sessions(0)
    return sum(1 for f in agents.lister()
               if f["role"] == role and etage_de(f["projet"]) == etage
               and (f["projet"], f["tid"]) != sauf
               and agents.vivant(agents.etat(f, sess)) is not False)


def refus(slug: str, tid: str, role: str) -> str | None:
    f = agents.lire(slug, tid)
    if f and agents.vivant(agents.etat(f, agents.sessions(0))) is not False:
        return None
    e = etage_de(slug)
    try:
        p = lire().get(e, {}).get(role, 0)
    except Illisible as err:
        return f"effectif illisible : run/effectif.json ({err}) — corriger depuis la salle"
    if p == 0:
        return f"rôle non recruté : {role} sur l'étage {e} — recruter depuis la salle"
    o = occupes(e, role, sauf=(slug, tid))
    if o >= p:
        return f"0 poste libre : {role} {o}/{p} sur l'étage {e} — attendre une fin ou recruter"
    return None


def vue(etage: str) -> dict:
    try:
        brut, erreur = lire().get(etage, {}), ""
    except Illisible as e:
        brut, erreur = {}, str(e)
    postes = {r: brut[r] for r in roles.affectables() if brut.get(r)}
    return {"postes": postes, "total": sum(postes.values()), "plafond_role": PLAFOND_ROLE,
            "plafond_etage": PLAFOND_ETAGE, "erreur": erreur}
