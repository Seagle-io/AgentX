#!/usr/bin/env python3
"""roles — registre unique des roles AgentX (roles.json a la racine du depot).

Seul proprietaire des regles de role : qui est affectable, ou il livre (revue
ou fait), qui juge. vx.py, dash.py et les hooks lisent ici, ne dupliquent rien.

Stdlib seule ; n'importe pas vx.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FICHIER = ROOT / "roles.json"
MODELES = ("inherit", "opus", "sonnet", "haiku")
LIVRE_EN = ("revue", "fait")

RE_CLE = re.compile(r"[a-z]{2,20}")
RE_COULEUR = re.compile(r"#[0-9a-f]{6}")
_CACHE: dict = {}


class RegistreInvalide(ValueError):
    pass


@dataclass(frozen=True)
class Role:
    cle: str
    nom: str
    sous: str
    livrable: str
    couleur: str
    modele: str
    affectable: bool
    livre_en: str
    juge: bool
    objet: str


TYPES = {"cle": str, "nom": str, "sous": str, "livrable": str, "couleur": str,
         "modele": str, "affectable": bool, "livre_en": str, "juge": bool, "objet": str}
LONGUEURS = {"nom": 16, "sous": 40, "livrable": 20}


def _valider(brut) -> dict[str, Role]:
    if not isinstance(brut, dict):
        raise RegistreInvalide("racine : objet attendu")
    if type(brut.get("version")) is not int or brut["version"] != 1:
        raise RegistreInvalide(f"version : {brut.get('version')!r} invalide (attendu 1)")
    liste = brut.get("roles")
    if not isinstance(liste, list) or not liste:
        raise RegistreInvalide("roles : liste non vide attendue")
    out: dict[str, Role] = {}
    couleurs: set[str] = set()
    for i, e in enumerate(liste):
        if not isinstance(e, dict):
            raise RegistreInvalide(f"roles[{i}] : objet attendu")
        for cle, typ in TYPES.items():
            if type(e.get(cle)) is not typ:
                raise RegistreInvalide(f"roles[{i}].{cle} : {e.get(cle)!r} invalide ({typ.__name__} attendu)")
        for cle in ("cle", "objet"):
            if not RE_CLE.fullmatch(e[cle]):
                raise RegistreInvalide(f"roles[{i}].{cle} : {e[cle]} invalide")
        if e["cle"] in out:
            raise RegistreInvalide(f"roles[{i}].cle : {e['cle']} en double")
        for cle, maxi in LONGUEURS.items():
            if not 1 <= len(e[cle]) <= maxi:
                raise RegistreInvalide(f"roles[{i}].{cle} : {e[cle]!r} hors 1..{maxi} car.")
        if not RE_COULEUR.fullmatch(e["couleur"]):
            raise RegistreInvalide(f"roles[{i}].couleur : {e['couleur']} invalide")
        if e["couleur"] in couleurs:
            raise RegistreInvalide(f"roles[{i}].couleur : {e['couleur']} en double")
        couleurs.add(e["couleur"])
        if e["affectable"]:
            if e["modele"] not in MODELES:
                raise RegistreInvalide(f"roles[{i}].modele : {e['modele']!r} invalide ({'|'.join(MODELES)})")
            if e["livre_en"] not in LIVRE_EN:
                raise RegistreInvalide(f"roles[{i}].livre_en : {e['livre_en']!r} invalide ({'|'.join(LIVRE_EN)})")
        else:
            for cle in ("modele", "livre_en"):
                if e[cle] != "":
                    raise RegistreInvalide(f"roles[{i}].{cle} : {e[cle]!r} invalide (non affectable → \"\")")
            if e["juge"]:
                raise RegistreInvalide(f"roles[{i}].juge : true invalide (non affectable → false)")
        out[e["cle"]] = Role(**{cle: e[cle] for cle in TYPES})
    for cle in ("chef", "vault"):
        if cle not in out or out[cle].affectable:
            raise RegistreInvalide(f"roles : « {cle} » absent ou affectable")
    if not any(r.affectable for r in out.values()):
        raise RegistreInvalide("roles : aucun role affectable")
    return out


def charger(chemin: Path = FICHIER) -> dict[str, Role]:
    try:
        cle_cache = (str(chemin), chemin.stat().st_mtime_ns)
    except OSError:
        raise RegistreInvalide(f"{chemin.name} absent") from None
    if cle_cache not in _CACHE:
        try:
            brut = json.loads(chemin.read_text(encoding="utf-8"))
        except (OSError, ValueError) as e:
            raise RegistreInvalide(f"{chemin.name} illisible : {e}") from None
        _CACHE.clear()
        _CACHE[cle_cache] = _valider(brut)
    return _CACHE[cle_cache]


def _ou_vide() -> dict[str, Role]:
    try:
        return charger()
    except RegistreInvalide:
        return {}


def erreur() -> str:
    try:
        charger()
    except RegistreInvalide as e:
        return str(e)
    return ""


def tous() -> tuple[str, ...]:
    return tuple(_ou_vide())


def affectables() -> tuple[str, ...]:
    return tuple(c for c, r in _ou_vide().items() if r.affectable)


def role(cle: str) -> Role | None:
    return _ou_vide().get(cle)


def livre_en(cle: str) -> str:
    r = role(cle)
    return r.livre_en if r and r.livre_en else "fait"


def juges() -> tuple[str, ...]:
    return tuple(c for c, r in _ou_vide().items() if r.juge)


def dep_satisfaite(statut_dep: str, role_tache: str) -> bool:
    return statut_dep == "fait" or (statut_dep == "revue" and role_tache in juges())


def est_role_agentx(nom: str) -> bool:
    if not erreur():
        return nom in affectables()
    return (ROOT / ".claude" / "agents" / f"{nom}.md").exists()
