#!/usr/bin/env python3
"""tid — format d'ID de tâche `<ABC>-T<nnn>` (ancien `T<nnn>` accepté), source unique.

Seule regex de TID de bin/ : regex, tri, numéro, allocation. Stdlib seule.
"""

from __future__ import annotations

import re
from typing import Iterable

MOTIF = r"(?:[A-Z]{3}-)?T\d{3,}"
RE_TID = re.compile(rf"(?<![\w-]){MOTIF}(?!\w)")   # recherche : texte, chemins, prompts
RE_EXACT = re.compile(MOTIF)                         # .fullmatch seulement
_RE_PREFIXE = re.compile(r"[A-Z]{3}")


class TidInvalide(ValueError):
    """tid : la valeur refusée ; str(exc) == message."""

    def __init__(self, tid: str) -> None:
        super().__init__(f"ID de tâche invalide : {tid!r}")
        self.tid = tid


def normaliser(s: str) -> str:
    t = s.strip().upper()
    if not RE_EXACT.fullmatch(t):
        raise TidInvalide(s)
    return t


def est_tid(s: str) -> bool:
    return RE_EXACT.fullmatch(s) is not None


def decomposer(tid: str) -> tuple[str, int]:
    if not est_tid(tid):
        raise TidInvalide(tid)
    prefixe, _, n = tid.rpartition("-T") if "-" in tid else ("", "", tid[1:])
    return prefixe, int(n)


def numero(tid: str) -> int:
    return decomposer(tid)[1]


def cle_tri(tid: str) -> tuple[int, str, int]:
    if not est_tid(tid):
        return (2, tid, 0)
    prefixe, n = decomposer(tid)
    return (1 if prefixe else 0, prefixe, n)


def prochain(ids: Iterable[str], prefixe: str | None) -> str:
    if prefixe is not None and not _RE_PREFIXE.fullmatch(prefixe):
        raise TidInvalide(prefixe)
    nums = [numero(i) for i in ids if est_tid(i) and decomposer(i)[0] in ("", prefixe or "")]
    n = max(nums, default=0) + 1
    return f"{prefixe}-T{n:03d}" if prefixe else f"T{n:03d}"
