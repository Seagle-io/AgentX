#!/usr/bin/env python3
"""produits — registre unique des produits Seagle (produits.json a la racine du depot).

Seul proprietaire des regles de produit : depots, branche de publication, site,
marketing, sources. vx.py, dash.py et publier.py lisent ici, ne dupliquent rien.
Ordre du fichier = ordre des etages.

Stdlib seule ; n'importe ni vx ni dash.
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FICHIER = ROOT / "produits.json"
ETATS = ("actif", "archive")
DOMAINES = ("finance", "juridique", "marketing", "rssi", "produit")

RE_CLE = re.compile(r"[a-z][a-z0-9]{1,19}")
RE_COULEUR = re.compile(r"#[0-9a-f]{6}")
RE_BRANCHE = re.compile(r"[A-Za-z0-9._/-]{1,64}")
_CACHE: dict = {}


class RegistreInvalide(ValueError):
    pass


@dataclass(frozen=True)
class Depot:
    chemin: str
    branche_publication: str
    ui: tuple[str, ...]


@dataclass(frozen=True)
class Site:
    depot: str
    branche: str
    pages: tuple
    textes: tuple
    captures: tuple


@dataclass(frozen=True)
class Marketing:
    vault: str
    calendriers: tuple
    motifs: tuple


@dataclass(frozen=True)
class Source:
    domaine: str
    chemin: str


@dataclass(frozen=True)
class Produit:
    cle: str
    nom: str
    sous: str
    couleur: str
    entreprise: bool
    etat: str
    env: str
    depots: tuple[Depot, ...]
    site: Site | None
    marketing: Marketing | None
    sources: tuple[Source, ...]


NUL = type(None)
TYPES = {"cle": (str,), "nom": (str,), "sous": (str,), "couleur": (str,), "entreprise": (bool,),
         "etat": (str,), "env": (str,), "depots": (list,), "site": (dict, NUL),
         "marketing": (dict, NUL), "sources": (list,)}
LONGUEURS = {"nom": 24, "sous": 48}


def _types(e, ou: str, types: dict) -> None:
    if not isinstance(e, dict):
        raise RegistreInvalide(f"{ou} : {e!r} invalide (objet attendu)")
    for cle, typ in types.items():
        if cle not in e or type(e[cle]) not in typ:
            noms = "|".join("null" if t is NUL else t.__name__ for t in typ)
            raise RegistreInvalide(f"{ou}.{cle} : {e.get(cle)!r} invalide ({noms} attendu)")


def _absolu(v: str, ou: str) -> None:
    if not v.startswith(("/", "~/")):
        raise RegistreInvalide(f"{ou} : {v!r} invalide (commence par / ou ~/)")


def _branche(v: str, ou: str) -> None:
    if not RE_BRANCHE.fullmatch(v):
        raise RegistreInvalide(f"{ou} : {v!r} invalide ({RE_BRANCHE.pattern})")


def _relatifs(liste, ou: str, non_vide: bool = False) -> tuple[str, ...]:
    if type(liste) is not list or (non_vide and not liste):
        raise RegistreInvalide(f"{ou} : {liste!r} invalide (liste{' non vide' if non_vide else ''} attendue)")
    for k, v in enumerate(liste):
        if type(v) is not str or not v or v.startswith(("/", "~")) or ".." in v:
            raise RegistreInvalide(f"{ou}[{k}] : {v!r} invalide (relatif, sans ..)")
    return tuple(liste)


def _valider(brut) -> dict[str, Produit]:
    if not isinstance(brut, dict):
        raise RegistreInvalide(f"racine : {type(brut).__name__} invalide (objet attendu)")
    if type(brut.get("version")) is not int or brut["version"] != 1:
        raise RegistreInvalide(f"version : {brut.get('version')!r} invalide (attendu 1)")
    liste = brut.get("produits")
    if not isinstance(liste, list) or not liste:
        raise RegistreInvalide(f"produits : {liste!r} invalide (liste non vide attendue)")
    out: dict[str, Produit] = {}
    couleurs: dict[str, int] = {}
    ent = ""
    for i, e in enumerate(liste):
        ou = f"produits[{i}]"
        _types(e, ou, TYPES)
        if not RE_CLE.fullmatch(e["cle"]):
            raise RegistreInvalide(f"{ou}.cle : {e['cle']} invalide ({RE_CLE.pattern})")
        if e["cle"] in out:
            raise RegistreInvalide(f"{ou}.cle : {e['cle']} invalide (en double, déjà produits[{list(out).index(e['cle'])}])")
        for cle, maxi in LONGUEURS.items():
            if not 1 <= len(e[cle]) <= maxi:
                raise RegistreInvalide(f"{ou}.{cle} : {e[cle]!r} invalide (1..{maxi} car.)")
        if not RE_COULEUR.fullmatch(e["couleur"]):
            raise RegistreInvalide(f"{ou}.couleur : {e['couleur']} invalide ({RE_COULEUR.pattern})")
        if e["couleur"] in couleurs:
            raise RegistreInvalide(f"{ou}.couleur : {e['couleur']} invalide (en double, déjà produits[{couleurs[e['couleur']]}])")
        couleurs[e["couleur"]] = i
        if e["etat"] not in ETATS:
            raise RegistreInvalide(f"{ou}.etat : {e['etat']!r} invalide ({'|'.join(ETATS)})")
        if e["entreprise"]:
            if ent:
                raise RegistreInvalide(f"{ou}.entreprise : true invalide (déjà {ent}, exactement 1)")
            if e["etat"] != "actif":
                raise RegistreInvalide(f"{ou}.etat : {e['etat']!r} invalide (entreprise → actif)")
            ent = e["cle"]
        if e["env"] and not (e["env"].startswith("vault/projets/") and e["env"].endswith(".md")):
            raise RegistreInvalide(f"{ou}.env : {e['env']!r} invalide (\"\" ou vault/projets/….md)")

        depots = []
        for j, d in enumerate(e["depots"]):
            od = f"{ou}.depots[{j}]"
            _types(d, od, {"chemin": (str,), "branche_publication": (str,), "ui": (list,)})
            _absolu(d["chemin"], f"{od}.chemin")
            _branche(d["branche_publication"], f"{od}.branche_publication")
            depots.append(Depot(d["chemin"], d["branche_publication"], _relatifs(d["ui"], f"{od}.ui")))

        site = None
        if e["site"] is not None:
            s, os_ = e["site"], f"{ou}.site"
            _types(s, os_, {"depot": (str,), "branche": (str,)})
            _absolu(s["depot"], f"{os_}.depot")
            _branche(s["branche"], f"{os_}.branche")
            site = Site(s["depot"], s["branche"], _relatifs(s.get("pages"), f"{os_}.pages"),
                        _relatifs(s.get("textes"), f"{os_}.textes"),
                        _relatifs(s.get("captures"), f"{os_}.captures", non_vide=True))

        marketing = None
        if e["marketing"] is not None:
            m, om = e["marketing"], f"{ou}.marketing"
            _types(m, om, {"vault": (str,), "motifs": (list,)})
            _absolu(m["vault"], f"{om}.vault")
            for k, v in enumerate(m["motifs"]):
                if type(v) is not str:
                    raise RegistreInvalide(f"{om}.motifs[{k}] : {v!r} invalide (str attendu)")
            marketing = Marketing(m["vault"], _relatifs(m.get("calendriers"), f"{om}.calendriers", non_vide=True),
                                  tuple(m["motifs"]))

        sources = []
        for j, s in enumerate(e["sources"]):
            os_ = f"{ou}.sources[{j}]"
            _types(s, os_, {"domaine": (str,), "chemin": (str,)})
            if s["domaine"] not in DOMAINES:
                raise RegistreInvalide(f"{os_}.domaine : {s['domaine']!r} invalide ({'|'.join(DOMAINES)})")
            _absolu(s["chemin"], f"{os_}.chemin")
            sources.append(Source(s["domaine"], s["chemin"]))

        out[e["cle"]] = Produit(e["cle"], e["nom"], e["sous"], e["couleur"], e["entreprise"], e["etat"],
                                e["env"], tuple(depots), site, marketing, tuple(sources))
    if not ent:
        raise RegistreInvalide("produits : 0 entreprise invalide (exactement 1 entreprise:true)")
    return out


def charger(chemin: Path = FICHIER) -> dict[str, Produit]:
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


def _ou_vide() -> dict[str, Produit]:
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


def produit(cle: str) -> Produit | None:
    return _ou_vide().get(cle)


def entreprise() -> Produit | None:
    return next((p for p in _ou_vide().values() if p.entreprise), None)


def chemin(s: str) -> Path:
    return Path(s).expanduser()


def produit_de(meta_brief: dict) -> tuple[str, str]:
    if erreur():
        return ("", "")
    cle = meta_brief.get("produit", "")
    if cle in tous():
        return (cle, "brief")
    e = entreprise()
    return (e.cle, "defaut") if e else ("", "")


def _depot(s: str, branche: str) -> list[str]:
    d = chemin(s)
    if not d.is_dir():
        return [f"{s} : absent"]
    if not (d / ".git").exists():
        return [f"{s} : pas un dépôt git"]
    try:
        rc = subprocess.run(["git", "-C", str(d), "rev-parse", "--verify", "-q", branche],
                            capture_output=True, timeout=10).returncode
    except (OSError, subprocess.SubprocessError) as e:
        return [f"{s} : git illisible ({e})"]
    return [] if rc == 0 else [f"{s} : branche {branche} absente"]


def _sonde(s: str, verif) -> list[str]:
    try:
        return verif()
    except Exception as e:  # §C1 : verifier jamais levé ; ex. ~user/ inconnu
        return [f"{s} : illisible ({type(e).__name__}: {e})"]


def verifier(p: Produit) -> list[str]:
    ko: list[str] = []
    if p.env:
        ko += _sonde(p.env, lambda: [] if (ROOT / p.env).is_file() else [f"env {p.env} : absent"])
    for d in p.depots:
        ko += _sonde(d.chemin, lambda: _depot(d.chemin, d.branche_publication)
                     + [f"{d.chemin}/{u} : absent" for u in d.ui if not (chemin(d.chemin) / u).exists()])
    if p.site:
        si = p.site
        ko += _sonde(si.depot, lambda: _depot(si.depot, si.branche)
                     + [f"{si.depot}/{m} : aucun fichier" for m in si.pages + si.textes + si.captures
                        if not any(chemin(si.depot).glob(m))])
    if p.marketing:
        mk = p.marketing
        ko += _sonde(mk.vault, lambda: ([] if chemin(mk.vault).is_dir() else [f"{mk.vault} : absent"])
                     + [f"{mk.vault}/{c} : absent" for c in mk.calendriers if not (chemin(mk.vault) / c).is_file()])
    for so in p.sources:
        ko += _sonde(so.chemin, lambda: [] if chemin(so.chemin).exists() else [f"{so.chemin} : absent"])
    return ko
