#!/usr/bin/env python3
"""Contrats versionnes : source unique des regex, versions, citations, gel par vague, escalade.

Stdlib seule. AGENTX_ROOT (env) deplace la racine (banc de tests). Les consommateurs
(vx, dispatch, garde_vault, garde_bash, dash) importent ce module, 0 recopie.
Le parseur de frontmatter est celui de vx, importe paresseusement (evite le cycle vx -> contrats -> vx).
"""

import json
import os
import re
from datetime import date
from pathlib import Path

ROOT = Path(os.environ.get("AGENTX_ROOT") or Path(__file__).resolve().parent.parent)

RE_CONTRAT_CHEMIN = r"(^|/)vault/projets/[^/]+/notes/contrat-[a-z0-9-]+\.md$"
RE_CITE = r"(?:\[\[(contrat-[a-z0-9-]+)(?:\|[^\]\n]*)?\]\]|\b(contrat-[a-z0-9-]+)\.md)(?:@v([0-9]+))?"
RE_AMENDEMENT = r"^## v([0-9]+) — ([0-9]{4}-[0-9]{2}-[0-9]{2}) — (.+)$"      # hors blocs de code
CITATION_STRICTE = date(2027, 1, 14)                             # 2026-10-16 + 90 j
VAGUES = ROOT / "run" / "vagues"


def _amendements(corps: str) -> list[tuple[int, str]]:
    """[(N, date)] des blocs `## vN — date — raison` hors blocs de code, dans l'ordre."""
    from vx import _blocs_code
    lignes = corps.splitlines()
    dedans, _ = _blocs_code(lignes)
    trouves = []
    for ligne, code in zip(lignes, dedans):
        m = re.match(RE_AMENDEMENT, ligne)
        if m and not code:
            trouves.append((int(m.group(1)), m.group(2)))
    return trouves


def _num(brut) -> int:
    """Valeur de `version` : absente -> 1 ; entier ASCII >= 1 sinon ValueError (seul juge de validite)."""
    if brut is None or brut == "":
        return 1
    s = str(brut)
    if not (s.isascii() and s.isdigit()) or int(s) < 1:
        raise ValueError(f"version illisible : {brut!r}")
    return int(s)


def version(chemin: Path) -> int:
    """Frontmatter `version` ; absent -> 1 ; hors entier >= 1 -> ValueError."""
    from vx import lire_frontmatter
    return _num(lire_frontmatter(chemin)[0].get("version"))


def _date_ko(texte: str) -> bool:
    try:
        date.fromisoformat(texte)
    except ValueError:
        return True
    return False


def coherence(chemin: Path) -> list[str]:
    """Incoherences : version != 1 + nb blocs | blocs != 2..N | amende != date du dernier bloc."""
    from vx import lire_frontmatter
    meta, corps = lire_frontmatter(chemin)
    blocs = _amendements(corps)
    erreurs = []
    try:
        v = version(chemin)
    except ValueError:
        return [f"version illisible : {meta.get('version')!r}"]
    if v != 1 + len(blocs):
        erreurs.append(f"version {v} != 1 + {len(blocs)} bloc(s) d'amendement")
    if [n for n, _ in blocs] != list(range(2, 2 + len(blocs))):
        erreurs.append(f"blocs {[n for n, _ in blocs]} non consecutifs depuis v2")
    erreurs += [f"date du bloc v{n} invalide : {d}" for n, d in blocs if _date_ko(d)]
    if str(meta.get("amende", "")) and _date_ko(str(meta["amende"])):
        erreurs.append(f"amende invalide : {meta['amende']!s}")
    if blocs and str(meta.get("amende", "")) != blocs[-1][1]:
        erreurs.append(f"amende {meta.get('amende', '')!s} != date du dernier bloc {blocs[-1][1]}")
    return erreurs


def resoudre(nom: str, projet: str) -> Path | None:
    """projets/<projet>/notes/<nom>.md, sinon l'unique projets/*/notes/<nom>.md, sinon None."""
    base = ROOT / "vault" / "projets"
    propre = base / projet / "notes" / f"{nom}.md"
    if propre.is_file():
        return propre
    autres = sorted(base.glob(f"*/notes/{nom}.md"))
    return autres[0] if len(autres) == 1 else None


def cites(texte: str, projet: str) -> dict[str, set[int | None]]:
    """nom -> versions citees (None = sans @vN), sur le texte entier."""
    out: dict[str, set[int | None]] = {}
    for m in re.finditer(RE_CITE, texte):
        out.setdefault(m.group(1) or m.group(2), set()).add(int(m.group(3)) if m.group(3) else None)
    return out


def verifier_citations(texte: str, projet: str, jour: date) -> tuple[list[str], list[str]]:
    """(erreurs, avertis) des contrats cites par un pack ; `jour` injecte. Par contrat cite :
    1. resoudre -> None                 : averti  « introuvable »
    2. version() leve                   : erreur  « version illisible »
    3. >= 2 versions @vN citees         : erreur  « une seule version par pack »
    4. @vN cite, N != version courante  : erreur  « pack a revoir »
    5. sans @vN, jour < CITATION_STRICTE : averti  « refus des 2027-01-14 »
    6. sans @vN, jour >= CITATION_STRICTE: erreur  « ajoute @vN »
    Une mention sans @vN herite de la version citee ailleurs dans le pack (pas de regle 5/6)."""
    erreurs, avertis = [], []
    for nom, vs in sorted(cites(texte, projet).items()):
        chemin = resoudre(nom, projet)
        if chemin is None:
            avertis.append(f"{nom} introuvable (notes/ du projet ni ailleurs)")
            continue
        try:
            courante = version(chemin)
        except ValueError:
            erreurs.append(f"KO: {nom} version illisible — vx doctor")
            continue
        citees = sorted(v for v in vs if v is not None)
        if len(citees) >= 2:
            erreurs.append(f"KO: {nom} cité en " + " et ".join(f"v{v}" for v in citees) + " — une seule version par pack")
        elif citees and citees[0] != courante:
            erreurs.append(f"KO: {nom} v{citees[0]} cité, v{courante} courante — pack à revoir")
        elif not citees and jour < CITATION_STRICTE:
            avertis.append(f"{nom} cité sans @v{courante} (v{courante} courante) — refus dès {CITATION_STRICTE}")
        elif not citees:
            erreurs.append(f"KO: {nom} cité sans @v{courante} (v{courante} courante) — ajoute @v{courante}")
    return erreurs, avertis


def ajout_seul(avant: str, apres: str) -> str | None:
    """None = amendement conforme (corps(avant) prefixe de corps(apres), + 1 bloc `## v(N+1)`,
    frontmatter : seuls version (+1) et amende changent) ; sinon la raison."""
    from vx import lire_frontmatter_texte
    m_av, c_av = lire_frontmatter_texte(avant)
    m_ap, c_ap = lire_frontmatter_texte(apres)
    if c_av and not c_av.endswith("\n"):
        c_av += "\n"          # derniere ligne sans \n : la prolonger = la modifier
    if not c_ap.startswith(c_av):
        return "corps modifié au-dessus de la fin (append-only)"
    try:
        n, v_ap = _num(m_av.get("version")), _num(m_ap.get("version"))
    except ValueError as e:
        return str(e)
    if v_ap != n + 1:
        return f"version {v_ap} != {n + 1} (v{n} + 1)"
    autres = {k for k in set(m_av) | set(m_ap) if k not in ("version", "amende") and m_av.get(k) != m_ap.get(k)}
    if autres:
        return f"frontmatter modifié : {', '.join(sorted(autres))}"
    reste = c_ap[len(c_av):].lstrip("\n")
    neuf = _amendements(reste)
    if [x for x, _ in neuf] != [n + 1]:
        return f"bloc « ## v{n + 1} — AAAA-MM-JJ — raison » manquant ou multiple en fin de fichier"
    if not re.match(RE_AMENDEMENT, reste.split("\n", 1)[0]):
        return f"ligne hors bloc v{n + 1} (ajout avant « ## v{n + 1} »)"
    if str(m_ap.get("amende", "")) != neuf[0][1]:
        return f"amende {m_ap.get('amende', '')!s} != date du bloc v{n + 1} ({neuf[0][1]})"
    return None


def escalade(result: Path) -> dict | None:
    """{escalade, contrat, dod, question} si statut bloque et escalade in {contrat, dod}, sinon None."""
    from vx import lire_frontmatter
    try:
        meta = lire_frontmatter(result)[0]
    except (OSError, UnicodeDecodeError):
        return None
    if meta.get("statut") != "bloque" or meta.get("escalade") not in ("contrat", "dod"):
        return None
    return {k: str(meta.get(k) or "") for k in ("escalade", "contrat", "dod", "question")}


def _rel(chemin: Path) -> str:
    """Chemin relatif a ROOT, separateurs POSIX (cle de `contrats` dans une vague)."""
    p = Path(chemin)
    if p.is_absolute():
        p = p.resolve().relative_to(ROOT.resolve())
    return p.as_posix()


def _dossier_tache(projet: str, tid: str) -> Path | None:
    trouves = sorted((ROOT / "vault" / "projets" / projet / "taches").glob(f"{tid}-*"))
    return trouves[0] if trouves else None


def ecrire_vague(projet: str, tids: list[str], maintenant: str) -> Path | None:
    """Ecrit run/vagues/<projet>-AAAAMMJJ-HHMMSS.json (ecrit une fois) ; `maintenant` = AAAA-MM-JJTHH:MM:SS.
    `contrats` = union des contrats cites (resolus) par les packs des tids, version au dispatch."""
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}", maintenant):
        raise ValueError(f"maintenant {maintenant!r} != AAAA-MM-JJTHH:MM:SS")
    tids = list(dict.fromkeys(tids))
    if not tids or not (ROOT / "vault" / "projets" / projet).is_dir():
        return None
    contrats: dict[str, int] = {}
    for tid in tids:
        dossier = _dossier_tache(projet, tid)
        if dossier is None or not (dossier / "context.md").is_file():
            continue
        for nom in cites((dossier / "context.md").read_text(encoding="utf-8"), projet):
            chemin = resoudre(nom, projet)
            if chemin is not None:
                contrats[_rel(chemin)] = version(chemin)
    base = f"{projet}-{maintenant[:10].replace('-', '')}-{maintenant[11:19].replace(':', '')}"
    VAGUES.mkdir(parents=True, exist_ok=True)
    for k in range(1, 10_000):
        vague_id = base if k == 1 else f"{base}-{k}"
        cible = VAGUES / f"{vague_id}.json"
        tmp = cible.with_name(f".{cible.name}.{os.getpid()}.tmp")
        tmp.write_text(json.dumps({"id": vague_id, "projet": projet, "lance": maintenant, "taches": tids,
                                   "contrats": contrats}, ensure_ascii=False), encoding="utf-8")
        try:
            os.link(tmp, cible)      # atomique, refuse d'ecraser une vague existante
        except FileExistsError:
            continue
        finally:
            tmp.unlink()
        return cible
    raise OSError(f"plus de suffixe libre pour {base}")


def gele_par(chemin: Path) -> list[tuple[str, list[str]]]:
    """(vague_id, TID en-cours) des vagues dont `contrats` contient chemin et ayant >= 1 tache en-cours."""
    from vx import lire_frontmatter
    cle = _rel(chemin)
    gel = []
    for f in sorted(VAGUES.glob("*.json")):
        vague = json.loads(f.read_text(encoding="utf-8"))
        if cle not in vague["contrats"]:
            continue
        en_cours = []
        for tid in dict.fromkeys(vague["taches"]):
            dossier = _dossier_tache(vague["projet"], tid)
            if dossier and lire_frontmatter(dossier / "task.md")[0].get("statut") == "en-cours":
                en_cours.append(tid)
        if en_cours:
            gel.append((vague["id"], en_cours))
    return gel
