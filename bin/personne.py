#!/usr/bin/env python3
"""personne — l'humain qui travaille sur cette machine (vault partage entre plusieurs personnes).

Le vault est synchronise entre machines (dossier d'equipe Nextcloud, docs/vault-partage.md) ;
chaque machine estampille ce qu'elle cree : `porteur:` du brief, `par:` du task.md,
`· @nom` en fin de ligne de journal. Inconnu ("") : rien d'estampille, rien de refuse.

Ordre : $AGENTX_PERSONNE > fichier local (~/.config/agentx/personne, $AGENTX_PERSONNE_FICHIER)
> `git config user.name` (1er mot) > "". Le fichier est local : jamais dans le vault.

Stdlib seule ; n'importe ni vx ni dash.
"""

from __future__ import annotations

import functools
import os
import re
import subprocess
import unicodedata
from pathlib import Path

RE_NOM = re.compile(r"[a-z0-9][a-z0-9-]{0,31}")
SANS = "-"   # `--porteur -` : projets sans porteur


def fichier() -> Path:
    if os.environ.get("AGENTX_PERSONNE_FICHIER"):
        return Path(os.environ["AGENTX_PERSONNE_FICHIER"])
    base = os.environ.get("XDG_CONFIG_HOME") or str(Path.home() / ".config")
    return Path(base) / "agentx" / "personne"


def normaliser(nom: str) -> str:
    """« Julien Drac » -> julien-drac ; invalide (vide, trop long) -> ""."""
    t = unicodedata.normalize("NFKD", str(nom)).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return t if RE_NOM.fullmatch(t) else ""


@functools.lru_cache(maxsize=1)
def _git() -> str:
    """1er mot de `git config user.name` (« Julien DRAC » -> julien) ; lu 1 fois par processus."""
    try:
        r = subprocess.run(["git", "config", "--get", "user.name"], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return ""
    mots = r.stdout.split() if r.returncode == 0 else []
    return normaliser(mots[0]) if mots else ""


def _lire_fichier() -> str:
    try:
        return normaliser(fichier().read_text(encoding="utf-8").strip())
    except OSError:
        return ""


def courante_et_source() -> tuple[str, str]:
    """(nom, source) ; source ∈ env | fichier | git | "" (inconnu)."""
    if "AGENTX_PERSONNE" in os.environ:   # posee vide : inconnu voulu (bancs de test)
        return normaliser(os.environ["AGENTX_PERSONNE"]), "env"
    if nom := _lire_fichier():
        return nom, "fichier"
    if nom := _git():
        return nom, "git"
    return "", ""


def courante() -> str:
    return courante_et_source()[0]


def definir(nom: str) -> str:
    """Ecrit le fichier local (ecriture atomique) ; rend le nom normalise. ValueError si invalide."""
    n = normaliser(nom)
    if not n:
        raise ValueError(f"nom invalide : {nom!r} (attendu : lettres, chiffres, tirets ; 32 max)")
    f = fichier()
    f.parent.mkdir(parents=True, exist_ok=True)
    tmp = f.with_name(f".{f.name}.{os.getpid()}")
    tmp.write_text(n + "\n", encoding="utf-8")
    os.replace(tmp, f)
    return n


def suffixe() -> str:
    """Fin de ligne de journal : « · @julien », "" si inconnu."""
    nom = courante()
    return f" · @{nom}" if nom else ""
