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
EFFORTS = ("low", "medium", "high")
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
    effort: str = "medium"
    contrats_libres: bool = False
    code: bool = False
    enquete: bool = False
    sollicitables: tuple[str, ...] = ()


TYPES = {"cle": str, "nom": str, "sous": str, "livrable": str, "couleur": str,
         "modele": str, "affectable": bool, "livre_en": str, "juge": bool, "objet": str}
OPTIONNELS = {"contrats_libres": bool, "code": bool, "enquete": bool, "sollicitables": list}
LONGUEURS = {"nom": 16, "sous": 40, "livrable": 20}


def _optionnels(i: int, e: dict) -> list:
    for cle, typ in OPTIONNELS.items():
        if cle in e and type(e[cle]) is not typ:
            raise RegistreInvalide(f"roles[{i}].{cle} : {e[cle]!r} invalide ({typ.__name__} attendu)")
    soll = e.get("sollicitables", [])
    if not all(isinstance(s, str) for s in soll) or len(set(soll)) != len(soll):
        raise RegistreInvalide(f"roles[{i}].sollicitables : {soll!r} invalide (clés de rôles distinctes)")
    if not e["affectable"]:
        for cle in OPTIONNELS:
            if e.get(cle, OPTIONNELS[cle]()):
                raise RegistreInvalide(f"roles[{i}].{cle} : invalide (non affectable → défaut)")
    if e.get("enquete", False) and not soll:
        raise RegistreInvalide(f"roles[{i}].enquete : true sans sollicitables")
    return soll


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
        effort = e.get("effort", "medium")
        if effort not in EFFORTS:
            raise RegistreInvalide(f"roles[{i}].effort : {effort!r} invalide ({'|'.join(EFFORTS)})")
        soll = _optionnels(i, e)
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
        out[e["cle"]] = Role(**{cle: e[cle] for cle in TYPES}, effort=effort,
                             contrats_libres=e.get("contrats_libres", False), code=e.get("code", False),
                             enquete=e.get("enquete", False), sollicitables=tuple(soll))
    for cle in ("chef", "vault"):
        if cle not in out or out[cle].affectable:
            raise RegistreInvalide(f"roles : « {cle} » absent ou affectable")
    for r in out.values():
        for s in r.sollicitables:
            if s not in out or not out[s].affectable:
                raise RegistreInvalide(f"roles : {r.cle}.sollicitables ∋ {s} inconnu ou non affectable")
    enqueteurs = [c for c, r in out.items() if r.enquete]
    if len(enqueteurs) > 1:
        raise RegistreInvalide(f"roles : enquete sur {enqueteurs[0]}, {enqueteurs[1]} — un seul enquêteur")
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


def contrats_libres() -> tuple[str, ...]:
    return tuple(c for c, r in _ou_vide().items() if r.contrats_libres)


def codeurs() -> tuple[str, ...]:
    return tuple(c for c, r in _ou_vide().items() if r.code)


def enqueteur() -> str | None:
    return next((c for c, r in _ou_vide().items() if r.enquete), None)


def sollicitables(cle: str) -> tuple[str, ...]:
    r = role(cle)
    return r.sollicitables if r else ()


def dep_satisfaite(statut_dep: str, role_tache: str) -> bool:
    return statut_dep == "fait" or (statut_dep == "revue" and role_tache in juges())


def est_role_agentx(nom: str) -> bool:
    if not erreur():
        return nom in affectables()
    return (ROOT / ".claude" / "agents" / f"{nom}.md").exists()
