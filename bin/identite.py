#!/usr/bin/env python3
"""identite — préfixe machine, appelant, battement (§2) · propriété des tâches, reprise (§3).

Source unique : vault/chefs/<ABC>.md (1 préfixe par machine) ; battement vault/chefs/<ABC>/<cle>.md.
Chef = "<cle>@<ABC>" ; shell humain (AGENTX_CHEF absent) = Appelant(cle=None). Stdlib seule.
"""

from __future__ import annotations

import os
import re
import socket
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

from frontmatter import Texte, _ecrire_atomique, ecrire_frontmatter, lire_frontmatter, rendre_frontmatter

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)
CHEFS = ROOT / "vault" / "chefs"
BATTEMENT_S = 600
REPRISE_S = 7200
_RE_PREFIXE = re.compile(r"[A-Z]{3}")


class IdentiteErreur(Exception):
    """code : prefixe-invalide · prefixe-pris · prefixe-double · prefixe-requis ; str(exc) == message."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code, self.message = code, message


class ProprieteRefus(Exception):
    """code : chef-proprietaire · reprise-trop-tot · reprise-inutile ; str(exc) == message."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code, self.message = code, message


@dataclass(frozen=True)
class Appelant:
    cle: str | None
    prefixe: str | None

    def chef(self) -> str | None:
        return f"{self.cle or 'defaut'}@{self.prefixe}" if self.prefixe else None

    def libelle(self) -> str:
        if not self.prefixe:
            return f"machine {machine()} sans préfixe"
        return self.chef() if self.cle else f"humain@{self.prefixe}"


# --------------------------------------------------------------------------- #
# §2 préfixe machine, appelant, battement
# --------------------------------------------------------------------------- #

def machine() -> str:
    return os.environ.get("AGENTX_MACHINE") or socket.gethostname()


def registre() -> dict[str, str]:
    """{prefixe: machine} de vault/chefs/<ABC>.md ; copies de conflit de sync ignorées."""
    if not CHEFS.is_dir():
        return {}
    return {f.stem: str(lire_frontmatter(f)[0].get("machine", ""))
            for f in sorted(CHEFS.glob("*.md"))
            if f.is_file() and "conflicted copy" not in f.name and _RE_PREFIXE.fullmatch(f.stem)}


def _requis() -> IdentiteErreur:
    return IdentiteErreur("prefixe-requis", f"refus : machine {machine()} sans préfixe alors que "
                          f"{', '.join(sorted(registre())) or '∅'} en ont un — ./bin/agentx prefixe <ABC>")


def prefixe_machine() -> str | None:
    m = machine()
    siens = [p for p, mp in registre().items() if mp == m]
    if len(siens) >= 2:
        raise IdentiteErreur("prefixe-double", f"refus : la machine {m} a déjà le préfixe {', '.join(siens)}")
    return siens[0] if siens else None


def prefixe_pour_creer() -> str | None:
    """Registre vide ⇒ None + avertissement (mode ancien) ; registre sans cette machine ⇒ prefixe-requis."""
    if not registre():
        print(f"~ machine {machine()} sans préfixe : ID T0xx (collision possible à plusieurs machines) "
              f"— ./bin/agentx prefixe <ABC>", file=sys.stderr)
        return None
    p = prefixe_machine()
    if p is None:
        raise _requis()
    return p


def declarer(prefixe: str) -> Path:
    if not _RE_PREFIXE.fullmatch(prefixe):
        raise IdentiteErreur("prefixe-invalide", f"refus : préfixe {prefixe} invalide (3 lettres A-Z)")
    m, reg = machine(), registre()
    if prefixe in reg and reg[prefixe] != m:
        raise IdentiteErreur("prefixe-pris", f"refus : préfixe {prefixe} déjà pris par la machine {reg[prefixe]}")
    q = prefixe_machine()
    if q:
        raise IdentiteErreur("prefixe-double", f"refus : la machine {m} a déjà le préfixe {q}")
    CHEFS.mkdir(parents=True, exist_ok=True)
    chemin = CHEFS / f"{prefixe}.md"
    try:
        with chemin.open("x", encoding="utf-8") as fh:
            fh.write(rendre_frontmatter({"prefixe": prefixe, "machine": m, "cree": date.today().isoformat(),
                                         "tags": ["chef"]}) + f"\n# {prefixe} — machine {m}\n")
    except FileExistsError:
        raise IdentiteErreur("prefixe-pris", f"refus : préfixe {prefixe} déjà pris par la machine "
                             f"{registre().get(prefixe, '?')}") from None
    return chemin


def appelant() -> Appelant:
    return Appelant(os.environ.get("AGENTX_CHEF") or None, prefixe_machine())


def battre(cle: str, etat: str = "vivant", maintenant: datetime | None = None) -> None:
    """Écrit vault/chefs/<ABC>/<cle>.md (tmp + rename) ; machine sans préfixe ⇒ rien."""
    p = prefixe_machine()
    if p is None:
        return
    (CHEFS / p).mkdir(parents=True, exist_ok=True)
    vu = (maintenant or datetime.now()).isoformat(timespec="seconds")
    _ecrire_atomique(CHEFS / p / f"{cle}.md", rendre_frontmatter({"chef": f"{cle}@{p}", "vu": vu, "etat": etat}))


def dernier_signe(chef: str) -> tuple[datetime | None, str]:
    cle, _, p = chef.rpartition("@")
    f = CHEFS / p / f"{cle}.md"
    if not (cle and _RE_PREFIXE.fullmatch(p) and f.is_file()):
        return None, "inconnu"
    meta, _ = lire_frontmatter(f)
    try:
        vu = datetime.fromisoformat(str(meta.get("vu", "")))
    except ValueError:   # battement abîmé : traité comme jamais vu
        vu = None
    return vu, str(meta.get("etat") or "inconnu")


def signe(chef: str) -> str:
    """« vu AAAA-MM-JJ HH:MM » | « arrêté AAAA-MM-JJ HH:MM » | « jamais vu »."""
    vu, etat = dernier_signe(chef)
    if vu is None:
        return "jamais vu"
    return f"{'arrêté' if etat == 'arrete' else 'vu'} {vu:%Y-%m-%d %H:%M}"


# --------------------------------------------------------------------------- #
# §3 propriété des tâches
# --------------------------------------------------------------------------- #

def proprietaire(meta: dict) -> str | None:
    return str(meta.get("chef") or "").strip() or None


def autorise(meta: dict, qui: Appelant) -> bool:
    proprio = proprietaire(meta)
    if proprio is None:
        return True
    cle, _, p = proprio.rpartition("@")
    if p != qui.prefixe:
        return False
    return qui.cle is None or cle == qui.cle


def exiger_proprio(meta: dict, action: str, slug: str, qui: Appelant | None = None) -> None:
    proprio = proprietaire(meta)
    if proprio is None:
        return
    qui = qui or appelant()
    if autorise(meta, qui):
        return
    tid = meta.get("id")
    raise ProprieteRefus("chef-proprietaire",
                         f"refus : {tid} appartient au chef {proprio} ({signe(proprio)}) — {action} refusé depuis "
                         f"{qui.libelle()} ; reprise si arrêté > 2 h : ./bin/agentx reprendre {tid} --projet {slug} "
                         f"--raison \"<…>\"")


def reprendre(proj: Path, d: Path, raison: str, qui: Appelant | None = None,
              maintenant: datetime | None = None) -> tuple[str, str]:
    """Passe la tâche au chef appelant si son proprio n'a pas battu depuis > REPRISE_S ; (ancien, nouveau)."""
    import partage, vx   # vx et partage importent identite : import différé
    qui = qui or appelant()
    maintenant = maintenant or datetime.now()
    with vx.verrou_projet(proj):
        meta, corps = lire_frontmatter(d / "task.md")
        tid, ancien = meta.get("id"), proprietaire(meta)
        if ancien is None or ancien == qui.chef():
            raise ProprieteRefus("reprise-inutile", f"{tid} : déjà à {qui.chef() or qui.libelle()} ou libre "
                                 f"— rien à reprendre")
        if qui.prefixe is None:
            raise _requis()
        vu, _ = dernier_signe(ancien)
        if vu is not None and (maintenant - vu).total_seconds() <= REPRISE_S:
            raise ProprieteRefus("reprise-trop-tot", f"refus : chef {ancien} vu {vu:%H:%M} (< 2 h) — reprise de "
                                 f"{tid} possible après {vu + timedelta(seconds=REPRISE_S):%H:%M}")
        nouveau = qui.chef()
        meta.update(chef=nouveau, repris_de=ancien, repris=maintenant.isoformat(timespec="seconds"),
                    repris_raison=Texte(raison), maj=date.today().isoformat())
        ecrire_frontmatter(d / "task.md", meta, corps)
    vx.journaliser(proj, f"{tid} reprise {ancien} → {nouveau} ({raison})")
    partage.ecrire_decision(partage.etage_de(proj.name), f"reprise {tid} : {ancien} → {nouveau}",
                            f"- Contexte: chef {ancien} silencieux ({signe(ancien)})\n- Choix: {raison}",
                            projet=proj.name, chef=nouveau, quand=maintenant)
    return ancien, nouveau
