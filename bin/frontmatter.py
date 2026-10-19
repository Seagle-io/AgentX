"""Codec frontmatter : source unique (vx, contrats, hooks). Import leger : os, re, pathlib seulement."""
from __future__ import annotations

import os
import re
from pathlib import Path


CLES_LISTE = ("deps", "tags")


class FrontmatterInvalide(ValueError):
    pass


# ⊇ separateurs de str.splitlines() : \n \r \x0b \x0c \x1c \x1d \x1e \x85    
# ∪ C0 sauf \t ∪ DEL + C1 ∪ surrogates ∪ non-caracteres — hors « printable » YAML 1.2
_INTERDIT = re.compile(r"[\x00-\x08\x0a-\x1f\x7f-\x9f  \ud800-\udfff￾￿]")
_CLE = re.compile(r"[A-Za-z0-9_][A-Za-z0-9_-]*")
_GUILLEMETS = re.compile(r'"((?:[^"\\]|\\["\\])*)"')
INDICATEURS = set("-?:,[]{}#&*!|>'\"%@`")
_ITEM_REFUS = set(',[]{}"\'#')


def _nu_possible(v: str) -> bool:
    return (v != "" and v == v.strip()            # str.strip() Python, ≠ espace seul
            and v[0] not in INDICATEURS
            and v[-1] not in "\"':"
            and ": " not in v and " #" not in v and "\t" not in v)


def encoder_scalaire(v: str, quoi: str) -> str:
    if not isinstance(v, str): raise TypeError(f"{quoi} : str attendu, {type(v).__name__}")
    if (m := _INTERDIT.search(v)): raise FrontmatterInvalide(f"{quoi} : caractere interdit U+{ord(m.group()):04X}")
    if _nu_possible(v): return v
    return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'


def encoder_item(x: str, quoi: str) -> str:
    if not isinstance(x, str): raise TypeError(f"{quoi} : str attendu, {type(x).__name__}")
    if (_INTERDIT.search(x) or x != x.strip() or x == "" or _ITEM_REFUS & set(x)
            or ": " in x or "\t" in x):
        raise FrontmatterInvalide(f"{quoi} : element de liste invalide {x!r}")
    return x


def encoder_liste(v: list[str], quoi: str) -> str:
    return "[" + ", ".join(encoder_item(x, quoi) for x in v) + "]"   # [] si vide


def rendre_frontmatter(meta: dict[str, str | list[str]]) -> str:
    """'---\n' + 'cle: enc\n'* + '---\n' ; pur ; leve avant tout I/O."""
    lignes = ["---"]
    for cle, val in meta.items():
        if not _CLE.fullmatch(cle):
            raise FrontmatterInvalide(f"cle invalide {cle!r}")
        lignes.append(_ligne(cle, val))
    return "\n".join(lignes) + "\n---\n"


def _ligne(cle: str, val) -> str:
    """'cle: valeur' ; refuse les controles (encoder_*), cite en YAML fidele (_scalaire)."""
    if isinstance(val, list):
        return f"{cle}: {encoder_liste(val, cle)}"
    encoder_scalaire(str(val), cle)
    return f"{cle}: {_scalaire(val)}" if str(val) else f"{cle}:"


def lire_frontmatter_texte(texte: str) -> tuple[dict, str]:
    """Parseur YAML-frontmatter minimal : scalaires, listes inline [a, b], listes '- x'."""
    meta, corps, _ = _frontmatter(texte)
    return meta, corps


def _frontmatter(texte: str) -> tuple[dict, str, dict]:
    """(meta, corps, ligne brute par cle d'une seule ligne) ; corps = tout apres la ligne `---` fermante."""
    if not texte.startswith("---"):
        return {}, texte, {}
    parts = texte.split("\n---", 1)
    if len(parts) < 2:
        return {}, texte, {}
    bloc, corps = parts[0][3:], parts[1].partition("\n")[2]
    meta: dict = {}
    brut: dict = {}
    avec_items: set[str] = set()   # clés ayant réellement reçu un « - item »
    cle_liste = None
    for ligne in bloc.splitlines():
        if not ligne.strip() or ligne.lstrip().startswith("#"):
            continue
        if ligne.lstrip().startswith("- ") and cle_liste:
            meta[cle_liste].append(_valeur(ligne.lstrip()[2:].strip()))
            avec_items.add(cle_liste)
            brut.pop(cle_liste, None)
            continue
        m = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", ligne)
        if not m:
            continue
        cle, val = m.group(1), m.group(2).strip()
        brut[cle] = ligne
        if val == "":
            # Ambigu : soit une liste « - x » qui suit, soit une valeur vide.
            # Tranché après la boucle selon la présence d'items.
            cle_liste, meta[cle] = cle, []
        elif val.startswith("[") and val.endswith("]"):
            cle_liste = None
            inner = val[1:-1].strip()
            meta[cle] = [_valeur(x.strip()) for x in inner.split(",") if x.strip()] if inner else []
            avec_items.add(cle)
        else:
            cle_liste = None
            meta[cle] = _valeur(val)
    for cle, val in list(meta.items()):
        if val == [] and cle not in avec_items and cle not in CLES_LISTE:
            meta[cle] = ""
    return meta, corps, brut


def lire_frontmatter(chemin: Path) -> tuple[dict, str]:
    if not chemin.exists():
        return {}, ""
    return lire_frontmatter_texte(chemin.read_text(encoding="utf-8"))


def _ecrire_atomique(chemin: Path, texte: str):
    tmp = chemin.with_name(f".{chemin.name}.{os.getpid()}.tmp")
    tmp.write_text(texte, encoding="utf-8")
    os.replace(tmp, chemin)


class Texte(str):
    """Chaine qui doit rester chaine en YAML : lue entre guillemets, ou saisie (titre, note, motif)."""


# lu par YAML comme booleen, null, nombre ou date si non quote
_AUTRE_TYPE = re.compile(
    r"(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF"
    r"|<<|=|[-+]?\.?[0-9][0-9a-fA-F_.:xXoObBeE+-]*|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN)"
    r"|\d{4}-\d\d?-\d\d?(?:[Tt\s].*)?)", re.S)

# sauts de ligne, tabulation, controles C0/DEL/C1 : cassent la ligne (vx) ou le YAML -> echappes entre "…"
_CONTROLE = r"\x00-\x1f\x7f-\x9f\u2028\u2029"
_ECHAPPE = {"\\": "\\\\", '"': '\\"', "\n": "\\n", "\r": "\\r", "\t": "\\t"}
_DE_ECHAPPE = {v[1]: k for k, v in _ECHAPPE.items()}


def _valeur(val: str) -> str:
    """Valeur lue : seule une paire "…" (\\" \\\\ \\n \\r \\t \\xHH \\uHHHH) ou '…' ('' -> ') est retiree, sinon brute."""
    if m := re.fullmatch(r'"((?:[^"\\]|\\.)*)"', val, re.S):
        return Texte(re.sub(r"\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)", lambda e: chr(int(e.group(1)[1:], 16))
                            if len(e.group(1)) > 1 else _DE_ECHAPPE.get(e.group(1), e.group(0)), m.group(1)))
    if m := re.fullmatch(r"'((?:[^']|'')*)'", val, re.S):
        return Texte(m.group(1).replace("''", "'"))
    return val


def _scalaire(val) -> str:
    """Valeur YAML relue a l'identique par vx et par YAML : guillemets doubles si besoin."""
    s = str(val)
    if (s != s.strip() or re.search(rf"\s#|:(?:\s|$)|[{_CONTROLE}]", s) or s.startswith(tuple("-?:,[]{}#&*!|>'\"%@`"))
            or (isinstance(val, Texte) and _AUTRE_TYPE.fullmatch(s))):
        return '"' + re.sub(rf'[\\"{_CONTROLE}]', lambda e: _ECHAPPE.get(e.group()) or (
            f"\\x{ord(e.group()):02x}" if ord(e.group()) < 0x100 else f"\\u{ord(e.group()):04x}"), s) + '"'
    return s


def ecrire_frontmatter(chemin: Path, meta: dict, corps: str):
    """Cle de valeur inchangee : ligne d'origine recopiee telle quelle (aller-retour a l'octet) ; atomique."""
    ancien, _, brut = _frontmatter(chemin.read_text(encoding="utf-8")) if chemin.exists() else ({}, "", {})
    lignes = ["---"]
    for cle, val in meta.items():
        if not _CLE.fullmatch(cle):
            raise FrontmatterInvalide(f"cle invalide {cle!r}")
        lignes.append(brut[cle] if cle in brut and ancien.get(cle) == val else _ligne(cle, val))
    lignes.append("---")
    _ecrire_atomique(chemin, "\n".join(lignes) + "\n" + corps)

