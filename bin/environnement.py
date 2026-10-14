"""environnement — serveurs de dev declares dans environnement.json.

Le chef les demarre (`agentx env up`), les agents n'en lancent aucun : un pack
nomme ses services dans « ## Environnement », pack-lint verifie l'url,
`env verifier` verifie qu'ils sont vivants avant dispatch.

Chemins : `cwd` relatif = depuis la racine du depot ; `{racine}` dans cmd,
env, prechauffe = cette racine. `{port}` et `{url}` (prechauffe) idem.

pidfile = pid du serveur, chef de son propre groupe (start_new_session), son
heure de depart (/proc/<pid>/stat) et le boot_id : un pid recycle n'est jamais
pris pour le notre.
Chef mort, groupe vivant = « ko » seulement avec preuve : meme boot ET un membre
du groupe parti apres le chef ; sinon le groupe est etranger, jamais tue.
arreter = killpg sur ce groupe, jamais sur un port seul.
up et down prennent le meme verrou par service ; pidfile ecrit par os.replace,
efface seulement sous ce verrou.

Zero dependance externe.
"""

from __future__ import annotations

import fcntl
import json
import os
import re
import signal
import socket
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FICHIER = ROOT / "environnement.json"
ETAT_ENV = Path.home() / ".local" / "state" / "env"    # ETAT de bin/agentx / "env"
RE_SERVICE_PACK = re.compile(r"^- service: ([a-z0-9-]+) → (\S+)\s*$", re.M)

RE_NOM = re.compile(r"^[a-z0-9-]+$")
CLES = {"projets", "port", "cmd", "cwd", "env", "sante", "prechauffe", "memoire_mo"}
CLES_SANTE = {"chemin", "delai_s"}
MARGE_MO = 1024
PRECHAUFFE_S = 180


class ErreurEnv(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class Service:
    nom: str
    projets: tuple[str, ...]
    port: int
    cmd: tuple[str, ...]
    cwd: str
    env: dict[str, str]
    chemin_sante: str
    delai_s: int
    prechauffe: tuple[str, ...] | None
    memoire_mo: int | None

    @property
    def url(self) -> str:
        return f"http://127.0.0.1:{self.port}{self.chemin_sante}"


# --------------------------------------------------------------------------- #
# declaration
# --------------------------------------------------------------------------- #

def _liste_str(val, quoi: str) -> list[str]:
    if not isinstance(val, list) or not all(isinstance(x, str) for x in val) or not val:
        raise ErreurEnv(1, f"{quoi} : liste de chaines non vide attendue")
    return val


def _entier(val, quoi: str) -> int:
    if not isinstance(val, int) or isinstance(val, bool):
        raise ErreurEnv(1, f"{quoi} : entier attendu")
    return val


def _service(nom: str, d) -> Service:
    if not RE_NOM.match(nom):
        raise ErreurEnv(1, f"nom de service invalide : {nom!r} (attendu ^[a-z0-9-]+$)")
    if not isinstance(d, dict):
        raise ErreurEnv(1, f"{nom} : objet attendu")
    inconnues = set(d) - CLES
    if inconnues:
        raise ErreurEnv(1, f"{nom} : cle(s) inconnue(s) {sorted(inconnues)}")
    for cle in ("projets", "port", "cmd", "cwd"):
        if cle not in d:
            raise ErreurEnv(1, f"{nom} : cle requise absente « {cle} »")
    projets = _liste_str(d["projets"], f"{nom}.projets")
    port = _entier(d["port"], f"{nom}.port")
    if not 1024 <= port <= 65535:
        raise ErreurEnv(1, f"{nom}.port : {port} hors 1024-65535")
    cmd = _liste_str(d["cmd"], f"{nom}.cmd")
    cwd = d["cwd"]
    if not isinstance(cwd, str):
        raise ErreurEnv(1, f"{nom}.cwd : chaine attendue")
    cwd = str(ROOT / cwd.replace("{racine}", str(ROOT)))     # relatif → depuis ROOT
    if not os.path.isdir(cwd):
        raise ErreurEnv(1, f"{nom}.cwd : dossier existant attendu ({cwd!r})")
    env = d.get("env", {})
    if not isinstance(env, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in env.items()):
        raise ErreurEnv(1, f"{nom}.env : dict chaine → chaine attendu")
    sante = d.get("sante", {})
    if not isinstance(sante, dict) or set(sante) - CLES_SANTE:
        raise ErreurEnv(1, f"{nom}.sante : dict {sorted(CLES_SANTE)} attendu")
    chemin = sante.get("chemin", "/")
    if not isinstance(chemin, str) or not chemin.startswith("/"):
        raise ErreurEnv(1, f"{nom}.sante.chemin : chaine commencant par / attendue")
    delai_s = _entier(sante.get("delai_s", 60), f"{nom}.sante.delai_s")
    memoire_mo = d.get("memoire_mo")
    if memoire_mo is not None:
        memoire_mo = _entier(memoire_mo, f"{nom}.memoire_mo")

    url = f"http://127.0.0.1:{port}{chemin}"

    def sub(x: str) -> str:
        return x.replace("{port}", str(port)).replace("{url}", url).replace("{racine}", str(ROOT))

    prechauffe = d.get("prechauffe")
    if prechauffe is not None:
        prechauffe = tuple(sub(x) for x in _liste_str(prechauffe, f"{nom}.prechauffe"))
    return Service(
        nom=nom, projets=tuple(projets), port=port,
        cmd=tuple(sub(x) for x in cmd), cwd=cwd,
        env={k: sub(v) for k, v in env.items()},
        chemin_sante=chemin, delai_s=delai_s, prechauffe=prechauffe, memoire_mo=memoire_mo)


def charger(fichier: Path = FICHIER) -> dict[str, Service]:
    if not fichier.exists():
        return {}
    try:
        brut = json.loads(fichier.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ErreurEnv(1, f"{fichier.name} : JSON invalide ({e})")
    if not isinstance(brut, dict) or set(brut) != {"services"} or not isinstance(brut["services"], dict):
        raise ErreurEnv(1, f"{fichier.name} : attendu {{\"services\": {{...}}}} et rien d'autre")
    services = {nom: _service(nom, d) for nom, d in brut["services"].items()}
    ports: dict[int, str] = {}
    for s in services.values():
        if s.port in ports:
            raise ErreurEnv(1, f"port {s.port} declare deux fois : {ports[s.port]}, {s.nom}")
        ports[s.port] = s.nom
    return services


def selection(services, noms: list[str], projet: str | None, tous: bool) -> list[Service]:
    if tous or (not noms and not projet):
        return list(services.values())
    choisis = []
    for nom in noms:
        if nom not in services:
            raise ErreurEnv(1, f"service inconnu : {nom} (declares : {', '.join(services) or 'aucun'})")
        choisis.append(services[nom])
    if projet:
        du_projet = [s for s in services.values() if projet in s.projets]
        if not du_projet:
            raise ErreurEnv(1, f"aucun service declare pour le projet {projet}")
        choisis += [s for s in du_projet if s not in choisis]
    return choisis


def services_du_pack(texte: str) -> list[tuple[str, str]]:
    for ligne in texte.splitlines():
        if ligne.lstrip().lower().startswith("- service") and not RE_SERVICE_PACK.match(ligne):
            raise ErreurEnv(1, f"ligne service mal formee : {ligne.strip()!r} "
                               f"(attendu « - service: nom → url » en debut de ligne)")
    return RE_SERVICE_PACK.findall(texte)


# --------------------------------------------------------------------------- #
# etat
# --------------------------------------------------------------------------- #

def _pidfile(s: Service) -> Path:
    return ETAT_ENV / f"{s.nom}.pid"


def _journal(s: Service) -> Path:
    return ETAT_ENV / f"{s.nom}.log"


def _vivant(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False


def _groupe_vivant(pid: int) -> bool:
    try:
        os.killpg(pid, 0)
        return True
    except ProcessLookupError:
        return False


def _debut(pid: int) -> int | None:
    """Heure de depart du process (tops depuis le boot), None s'il n'existe pas."""
    try:
        return int(Path(f"/proc/{pid}/stat").read_text().rsplit(")", 1)[1].split()[19])
    except OSError:
        return None


def _boot() -> str:
    return Path("/proc/sys/kernel/random/boot_id").read_text().strip()


def _membre_depuis(pgid: int, debut: int) -> bool:
    """Un process du groupe pgid parti a debut ou apres."""
    for d in Path("/proc").iterdir():
        if d.name.isdigit():
            try:
                champs = (d / "stat").read_text().rsplit(")", 1)[1].split()
            except OSError:
                continue                            # process sorti pendant le parcours
            if int(champs[2]) == pgid and int(champs[19]) >= debut:
                return True
    return False


def _notre_pid(s: Service, sous_verrou: bool = False) -> dict | None:
    """Contenu du pidfile si notre groupe vit encore, sinon None.

    Meme boot que note, puis :
    chef vivant : chef de son groupe ET meme heure de depart que notee ;
    chef mort, groupe vivant avec un membre parti apres le chef : note["chef_mort"] = True.
    Pidfile perime efface seulement sous_verrou : hors verrou, lecture seule.
    """
    f = _pidfile(s)
    try:
        note = json.loads(f.read_text(encoding="utf-8"))
        pid = int(note["pid"])
        debut = note["debut"]
        if pid > 0 and debut is not None and note.get("boot") == _boot():
            if _vivant(pid):
                if os.getpgid(pid) == pid and _debut(pid) == debut:
                    return note
            elif _groupe_vivant(pid) and _membre_depuis(pid, int(debut)):
                return note | {"chef_mort": True}
    except FileNotFoundError:
        return None
    except IsADirectoryError:
        if sous_verrou:
            raise ErreurEnv(1, f"pidfile illisible : {f} est un repertoire")
        return None
    except (ValueError, KeyError, TypeError, OverflowError, ProcessLookupError, PermissionError):
        pass
    if sous_verrou:
        f.unlink(missing_ok=True)
    return None


def _port_repond(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            return True
    except OSError:
        return False


_SANS_PROXY = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _sante_ok(s: Service) -> bool:
    try:
        with _SANS_PROXY.open(s.url, timeout=2) as r:
            return r.status < 500
    except urllib.error.HTTPError as e:
        return e.code < 500
    except (urllib.error.URLError, OSError):
        return False


def _rss_mo(pid: int) -> int | None:
    try:
        for ligne in Path(f"/proc/{pid}/status").read_text().splitlines():
            if ligne.startswith("VmRSS:"):
                return int(ligne.split()[1]) // 1024
    except OSError:
        pass
    return None


def etat(s: Service) -> dict:
    e = {"nom": s.nom, "etat": "mort", "pid": None, "port": s.port, "url": s.url,
         "depuis": None, "rss_mo": None, "journal": str(_journal(s))}
    note = _notre_pid(s)
    if note:
        e.update(etat="vivant" if not note.get("chef_mort") and _sante_ok(s) else "ko", pid=note["pid"],
                 depuis=note.get("depuis"), rss_mo=_rss_mo(note["pid"]))
    elif _port_repond(s.port):
        e["etat"] = "etranger"
    return e


def _etranger(s: Service) -> ErreurEnv:
    return ErreurEnv(4, f"port {s.port} occupe par un process etranger, rien tue : "
                        f"ss -ltnp 'sport = :{s.port}'")


def _mem_disponible_mo() -> int:
    for ligne in Path("/proc/meminfo").read_text().splitlines():
        if ligne.startswith("MemAvailable:"):
            return int(ligne.split()[1]) // 1024
    raise ErreurEnv(1, "MemAvailable absent de /proc/meminfo")


# --------------------------------------------------------------------------- #
# demarrer / arreter
# --------------------------------------------------------------------------- #

def demarrer(s: Service) -> dict:
    ETAT_ENV.mkdir(parents=True, exist_ok=True)
    with (ETAT_ENV / f"{s.nom}.verrou").open("a") as verrou:
        fcntl.flock(verrou, fcntl.LOCK_EX)
        _notre_pid(s, sous_verrou=True)             # efface un pidfile perime
        e = etat(s)
        if e["etat"] == "vivant":
            return e
        if e["etat"] == "ko":
            raise ErreurEnv(3, f"ko : env down {s.nom} puis up")
        if e["etat"] == "etranger":
            raise _etranger(s)
        if s.memoire_mo:
            dispo = _mem_disponible_mo()
            if dispo < s.memoire_mo + MARGE_MO:
                raise ErreurEnv(5, f"memoire insuffisante : {dispo} Mo disponibles, "
                                   f"{s.memoire_mo + MARGE_MO} requis ({s.memoire_mo} + {MARGE_MO})")

        with _journal(s).open("a", encoding="utf-8") as log:
            log.write(f"\n===== demarrage {time.strftime('%Y-%m-%d %H:%M:%S')} =====\n")
            log.flush()
            proc = subprocess.Popen(list(s.cmd), cwd=s.cwd, env=os.environ | s.env,
                                    stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                                    start_new_session=True)
        tmp = ETAT_ENV / f"{s.nom}.pid.tmp"
        try:
            tmp.write_text(json.dumps({
                "pid": proc.pid, "port": s.port,
                "depuis": time.strftime("%Y-%m-%dT%H:%M:%S"), "cmd": list(s.cmd),
                "debut": _debut(proc.pid), "boot": _boot()}), encoding="utf-8")
            os.replace(tmp, _pidfile(s))
        except OSError as err:
            os.killpg(proc.pid, signal.SIGKILL)     # sans pidfile, groupe orphelin
            proc.wait()
            limite = time.monotonic() + 2
            while _groupe_vivant(proc.pid) and time.monotonic() < limite:
                time.sleep(0.1)
            tmp.unlink(missing_ok=True)
            raise ErreurEnv(1, f"pidfile non ecrit : {err}")

        limite = time.monotonic() + s.delai_s
        while not _sante_ok(s):
            if proc.poll() is not None:
                _pidfile(s).unlink(missing_ok=True)
                raise ErreurEnv(3, f"sorti au demarrage (rc {proc.returncode})")
            if time.monotonic() > limite:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.wait()
                _pidfile(s).unlink(missing_ok=True)
                raise ErreurEnv(3, f"sante KO apres {s.delai_s} s, tue")
            time.sleep(0.5)

        if s.prechauffe:
            with _journal(s).open("a", encoding="utf-8") as log:
                log.write(f"\n===== prechauffe {time.strftime('%Y-%m-%d %H:%M:%S')} =====\n")
                log.flush()
                try:
                    rc = subprocess.run(list(s.prechauffe), cwd=s.cwd, stdin=subprocess.DEVNULL,
                                        stdout=log, stderr=log, timeout=PRECHAUFFE_S).returncode
                except subprocess.TimeoutExpired:
                    rc = f"timeout {PRECHAUFFE_S} s"
            if rc != 0:
                raise ErreurEnv(6, f"vivant mais prechauffe KO ({rc}) — journal {_journal(s)}")
        return etat(s)


def arreter(s: Service, delai_s: float = 5.0) -> dict:
    ETAT_ENV.mkdir(parents=True, exist_ok=True)
    with (ETAT_ENV / f"{s.nom}.verrou").open("a") as verrou:
        fcntl.flock(verrou, fcntl.LOCK_EX)
        note = _notre_pid(s, sous_verrou=True)
        if note:
            pid = note["pid"]
            try:
                os.killpg(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass                                # groupe mort entre-temps
            limite = time.monotonic() + delai_s
            while _groupe_vivant(pid) and time.monotonic() < limite:
                time.sleep(0.1)
            if _groupe_vivant(pid):
                try:
                    os.killpg(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                while _groupe_vivant(pid) and time.monotonic() < limite + 2:
                    time.sleep(0.1)
            _pidfile(s).unlink(missing_ok=True)
        if _port_repond(s.port):
            raise _etranger(s)
        fin = etat(s)
        fin["arrete"] = note["pid"] if note else None   # pid lu sous verrou
        return fin
