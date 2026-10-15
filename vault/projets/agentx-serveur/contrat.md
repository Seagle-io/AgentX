---
projet: agentx-serveur
tache: T002
cree: 2026-10-16
tags: [contrat, agentx-serveur, multi-comptes]
---

# Contrat — AgentX serveur : N comptes, 1 chef par compte, tunnel SSH + GitHub

Contrainte qui décide : un chef = `claude` avec Bash → qui pilote un chef a un shell sous l'uid du chef. Isolation = uid Unix, jamais routage HTTP ni hooks.

## C0 — Options

### Identité
| | coût maintenant | coût à 1 an | rend impossible |
|---|---|---|---|
| I1 oauth2-proxy (GitHub, `--github-org=Seagle-io`) → dash sur socket unix, `SO_PEERCRED` = uid proxy | 1 OAuth App, 1 binaire, 2 secrets, ~40 l. dash | MAJ binaire ; révocation = retrait org (≤ 12 h) | forger l'identité depuis le serveur ; se connecter hors org |
| I2 OAuth GitHub codé dans `dash.py` | ~200 l. sécurité maison (state, CSRF, échange code, `/user`) | audit + maintenance à chaque faille | rester stdlib simple ; 1 secret de plus dans dash |
| I3 utilisateur SSH = identité (`ssh -L 7777:/run/…/salle.sock`, `SO_PEERCRED`) | ~20 l., 0 secret | révocation = admin serveur (clé + compte) | contrôle continu org Seagle-io (cadrage) |

### Isolation des chefs
| | coût maintenant | coût à 1 an | rend impossible |
|---|---|---|---|
| U1 1 utilisateur Unix par compte | 2 users, 1 groupe, setgid, `safe.directory`, 1 unit systemd/compte | +1 compte = 1 ligne config + provisionnement | chef A lit `~/.claude` de B, tue le démon de B, parle au socket de B |
| U2 1 conteneur par compte | images, `claude` en conteneur, bind-mount vault, démon Docker (groupe docker ≈ root) | rebuild à chaque MAJ `claude` | rien de plus que U1 sur le vault partagé (même bind-mount) |
| U3 1 démon par compte, même utilisateur (bêtement) | ~30 l. (socket par compte, `CLAUDE_CONFIG_DIR` NV) | 1 incident = compromission de l'autre | toute isolation : même uid → `cat`, `kill`, `connect` libres |

### Choix
- **I1 + U1** — I1 = cadrage GitHub, U1 = seule frontière noyau
- I3 = repli si github.com indisponible durablement (voir decisions.md#2026-10-16)
- I2 écarté — sécurité maison sans gain sur I1 · U2 écarté — coût sans isolation vault en plus · U3 écarté — 0 isolation

## C1 — Topologie serveur

```
poste humain                       serveur (Linux)
navigateur http://localhost:7777
  └─ ssh -N -L 7777:127.0.0.1:4180 <unix>@serveur
                                   oauth2-proxy  127.0.0.1:4180  (uid oauth2-proxy)
                                     └─ upstream unix:///run/agentx-salle/salle.sock
                                   dash.py --serveur   (uid agentx-salle)  — peercred: uid oauth2-proxy seul
                                     ├─ /run/agentx-chef-julien/chef.sock   (démon uid julien)  — peercred: uid agentx-salle seul
                                     └─ /run/agentx-chef-sylvain/chef.sock  (démon uid sylvain)
                                   /srv/agentx  dépôt + vault partagé  (groupe agentx, setgid, UMask 0002)
```

- utilisateurs Unix : `julien`, `sylvain`, `agentx-salle`, `oauth2-proxy` ; groupe `agentx` = {julien, sylvain, agentx-salle}
- `julien` ∉ groupe de `sylvain` ; aucun humain ∈ groupe `oauth2-proxy`
- `~/.claude` par utilisateur Unix → login Claude par compte, coût séparé par construction

### Config serveur — `/etc/agentx/serveur.json` (0640 root:agentx)

```json
{
  "mode": "serveur",
  "racine": "/srv/agentx",
  "ecoute": "/run/agentx-salle/salle.sock",
  "unix_salle": "agentx-salle",
  "unix_proxy": "oauth2-proxy",
  "entete_identite": "X-Forwarded-User",
  "org_github": "Seagle-io",
  "comptes": [
    {"cle": "julien",  "github": "LOGIN_GH_JULIEN",  "unix": "julien",  "socket_chef": "/run/agentx-chef-julien/chef.sock"},
    {"cle": "sylvain", "github": "LOGIN_GH_SYLVAIN", "unix": "sylvain", "socket_chef": "/run/agentx-chef-sylvain/chef.sock"}
  ]
}
```
`LOGIN_GH_*` = logins GitHub réels, fournis par l'humain (question ouverte).

## C2 — Module `bin/comptes.py` (neuf, stdlib)

```python
CHEMIN_DEFAUT = Path("/etc/agentx/serveur.json")
RE_CLE = re.compile(r"^[a-z][a-z0-9-]{1,31}$")   # "local" réservé au mode local

@dataclass(frozen=True)
class Compte:
    cle: str            # RE_CLE ; ≠ "local"
    github: str         # login GitHub ; comparaison casse ignorée
    unix: str           # utilisateur Unix du démon chef
    socket_chef: str    # chemin absolu

@dataclass(frozen=True)
class ConfigServeur:
    racine: Path
    ecoute: str
    unix_salle: str
    unix_proxy: str
    entete_identite: str
    org_github: str
    comptes: tuple[Compte, ...]

class ConfigInvalide(Exception): ...   # JSON KO, champ manquant, cle/github/unix/socket en double, cle KO
class CompteInconnu(Exception): ...

def charger(chemin: Path | None = None) -> ConfigServeur | None:
    """Ordre : `chemin` explicite → env AGENTX_SERVEUR → CHEMIN_DEFAUT s'il existe → None (mode local).
    Chemin explicite absent → ConfigInvalide. Jamais de config partielle."""
def par_github(cfg: ConfigServeur, login: str) -> Compte: ...        # raise CompteInconnu
def par_unix(cfg: ConfigServeur, nom: str) -> Compte: ...            # raise CompteInconnu
def uid_de(nom_unix: str) -> int: ...                                # pwd.getpwnam ; raise ConfigInvalide
def compte_courant(cfg: ConfigServeur | None) -> str | None:
    """None en mode local ; sinon par_unix(pwd.getpwuid(os.getuid()).pw_name).cle ; uid hors comptes → None."""
def pair_autorise(conn: socket.socket, uids: set[int]) -> bool:
    """SO_PEERCRED (struct '3i' : pid, uid, gid) ; uid ∈ uids. Linux seul."""
```

## C3 — Identité (`bin/dash.py`)

Séquence : navigateur → tunnel → oauth2-proxy (cookie absent → GitHub OAuth → contrôle org) → pose `X-Forwarded-User: <login>` → socket unix → dash.

```python
# dash.py, mode serveur
CFG: ConfigServeur | None            # comptes.charger(args.serveur)
JETONS: dict[str, str]               # cle → secrets.token_hex(16), tirés au démarrage ; local : {"local": JETON}
TERMS: dict[str, TerminalClient]     # cle → TerminalClient(racine, chemin=c.socket_chef, lancer=False) ; local : {"local": TERM}

class ServeurUnix(ThreadingHTTPServer):   # address_family = AF_UNIX ; refuse la connexion si
    ...                                   # not pair_autorise(conn, {uid_de(CFG.unix_proxy)}) ; client_address = ("unix", 0)

def Handler._compte(self) -> str | None:
    """local : "local". serveur : en-tête CFG.entete_identite → par_github → cle ; absent/inconnu → None."""
```

- vérification identité = 2 portes : org (oauth2-proxy) ∧ `login ∈ comptes` (dash) — membre org hors config → 403
- `_compte()` None → 403 `{"erreur": "identité absente ou inconnue"}` sur TOUTE route, statiques compris
- garde `Host` ∈ `HOTES_OK` conservée (navigateur voit `localhost:7777`) — anti DNS rebinding
- jeton de page : `X-AgentX-Jeton == JETONS[_compte()]` ; jeton d'un autre compte → 403 — anti CSRF (préflight CORS)
- SSE `/api/term/stream?jeton=` : idem, jeton du compte connecté
- `GET /state.json` ajoute :

```json
{"mode": "serveur", "compte": "julien", "jeton": "<JETONS[julien]>",
 "chefs": [{"compte": "julien", "vivant": true}, {"compte": "sylvain", "vivant": false}],
 "voix": null}
```
- sessions : cookie oauth2-proxy `_agentx`, `--cookie-expire=12h`, `--cookie-samesite=strict`, `--cookie-secure=true` (NV : Secure accepté sur `http://localhost`) ; 0 session côté dash
- expiration jeton page = redémarrage de dash ; 401/403 → page recharge `state.json`

### oauth2-proxy — paramètres imposés
```
--provider=github --github-org=Seagle-io --email-domain=*
--http-address=127.0.0.1:4180
--upstream=unix:///run/agentx-salle/salle.sock
--redirect-url=http://localhost:7777/oauth2/callback
--pass-user-headers=true --reverse-proxy=false
--cookie-name=_agentx --cookie-expire=12h --cookie-samesite=strict
0 --skip-auth-route · 0 --skip-auth-regex · secrets en EnvironmentFile 0600 root
```
NV : `X-Forwarded-User` = login GitHub (≠ email) → devops logue l'en-tête reçu avant L4.

## C4 — Terminaux (`bin/terminal.py`)

```python
def _chemin_socket(cwd: str) -> str                 # INCHANGÉ : ~/.local/state/agentx-chef.sock (mode local)
class TerminalClient:
    def __init__(self, cwd: str, chemin: str | None = None, lancer: bool = True): ...
    # chemin None → _chemin_socket(cwd) ; lancer=False → jamais _lancer_demon (serveur : systemd lance)
def consigne_chef(compte: str | None, autres: list[str]) -> str:
    """None → CONSIGNE_CHEF verbatim. Sinon remplace « seul chef de l'immeuble » par
    « chef du compte <compte> ; autres chefs sur le même vault : <autres> ; coordination par le vault seul »."""
# CLI : terminal.py --daemon <cwd> [--socket <chemin>] [--compte <cle>] [--persistant] [--pairs <uid,uid>]
```
- `--persistant` : veilleur désactivé, socket jamais `unlink` à l'arrêt (systemd `RuntimeDirectory` le nettoie)
- `--pairs` : `pair_autorise` à chaque `accept` ; refus → fermeture sans réponse
- `claude` lancé sous l'uid du démon, `HOME` de cet uid, env `AGENTX_COMPTE=<cle>`, `UMask=0002`
- routes `/api/term/{open,in,resize,stop,etat,stream}` → `TERMS[_compte()]` seulement ; 0 paramètre `compte` accepté du client
- `chefs[].vivant` = op `etat` sur chaque socket, `lancer=False` → jamais de démarrage d'un autre chef
- arrêt/relance par compte : `/api/term/stop` (session `claude`) · `systemctl restart agentx-chef@<cle>` (démon, humain)
- unit `agentx-chef@.service` : `User=%i`, `RuntimeDirectory=agentx-chef-%i`, `RuntimeDirectoryMode=0755`, `WorkingDirectory=/srv/agentx`, `ExecStart=… --daemon /srv/agentx --socket /run/agentx-chef-%i/chef.sock --compte %i --persistant --pairs <uid agentx-salle>`
- quota/coût : 1 login Claude par uid (`claude` puis `/login` dans le terminal web, NV) ; AgentX n'affiche 0 coût — aucune source
- NV : plafond de dépense par session dans Claude Code ; Team (sièges) ou clé API par compte → question humaine

## C5 — Coordination des chefs sur 1 vault

Règle : les chefs ne se parlent jamais ; le vault + `vx.py` sous verrou arbitrent.

```python
# bin/vx.py
def journaliser(proj: Path, msg: str) -> None:
    """auteur = comptes.compte_courant(comptes.charger()).
    None → "- `ts` msg" (INCHANGÉ) ; sinon "- `ts` [julien] msg"."""
# cmd_set, cmd_retenir : corps entier sous `with verrou(proj):` (aujourd'hui : tache, virer seuls)
# set : --si <statut>   statut courant ≠ → stderr "T005 : statut en-cours ≠ attendu pret", exit 3
# set --statut en-cours (mode serveur) → frontmatter `chef: <cle>`
# set/retenir/virer sur tâche `chef` ≠ compte_courant ∧ statut ∈ {en-cours, revue} → exit 4, sauf --reprendre
#   --reprendre → journal "[sylvain] T005 reprise (chef julien)"
def conflits_e(proj: Path, tid: str) -> list[tuple[str, str, str]]:
    """(projet, tid, chemin) des tâches en-cours, TOUS projets, dont un chemin E du pack ∩ chemins E de tid."""
# cmd_ready : exclut toute tâche avec conflits_e ≠ [] ; affiche "attend <projet>/<tid> (<chemin>)"
```
- `1 fichier E = 1 tâche en-cours` (seagle §C8) → mécanisé par `conflits_e` dans `ready` + `garde_dispatch` (refus, exit 2)
- NV : §C8 déjà mécanisé ou non → L2 vérifie avant d'écrire
- salle : chaque compte voit TOUT le vault ; terminal = le sien seul ; `chefs[]` = vivant/arrêté des autres, 0 contenu
- `run/evenements.jsonl` (sonnerie) gagne `"compte"` ; `run/projet` (épingle) → `run/<cle>/projet` en serveur, `run/projet` en local
- page `/api/run` mode serveur : `board ready doctor index pack-lint` seuls ; `set` → 403 « passe par ton chef » — auteur non attribuable
- git : `core.sharedRepository=group`, `safe.directory=/srv/agentx` (système) ; 0 push (garde_bash inchangé)

## C6 — Compat locale

- sans `--serveur` ∧ sans `AGENTX_SERVEUR` ∧ sans `/etc/agentx/serveur.json` → mode local, comportement identique au bit près
- local : TCP `127.0.0.1:7777`, `JETON` global, socket `~/.local/state/agentx-chef.sock` 0600, `_lancer_demon` auto, veilleur 120 s, voix active, journal sans auteur
- serveur : `bin/agentx` sans arg / `stop` / `statut` → stderr « mode serveur : systemctl {start,stop,status} agentx-salle », exit 2
- test de non-régression obligatoire : `state.json` local ⊇ clés actuelles ; `mode == "local"`, `compte == "local"`
- `--serveur` + `--host` → ConfigInvalide (serveur = socket unix seul)

## C7 — Exigences de sécurité (invariants)

- S1 toute socket AgentX serveur vérifie `SO_PEERCRED` ; liste d'uid depuis la config
- S2 identité lue d'1 seul en-tête, sur 1 seule socket, d'1 seul uid (proxy)
- S3 0 paramètre client ne choisit un compte, un socket, un chemin de démon
- S4 voix (`/api/voix/*`) → 404 en serveur ; `state.voix = null`
- S5 sshd : `Match Group agentx` → `PermitOpen 127.0.0.1:4180`, `AllowStreamLocalForwarding no`, `X11Forwarding no`, `PasswordAuthentication no`
- S6 0 donnée patient Kora sur le serveur sans décision humaine ; `supervision.json` serveur ne déclare aucun dépôt Kora
- S7 jamais push, jamais migration par un agent (garde_bash, inchangé, s'applique à chaque uid)
- S8 secrets (client OAuth, cookie) : EnvironmentFile 0600 root, hors dépôt, hors vault

Table EX → § : `risques.md` absent à la clôture de T002 → réconciliation en tâche dédiée (voir result.md).

## C8 — Lots (aucun avant fin de Seagle + console vocale — cadrage humain)

| Lot | Rôle | E (disjoints) | L | Dépend | DoD vérifiable |
|---|---|---|---|---|---|
| L1 | implementeur | `bin/comptes.py`, `tests/test_comptes.py` | contrat.md | ∅ | sans fichier → `None` ; 6 cas `ConfigInvalide` ; `pair_autorise` sur socketpair → sortie pytest |
| L2 | implementeur | `bin/vx.py`, `tests/test_vx_coordination.py` | `bin/comptes.py` | L1 | 2 `set` concurrents `--si pret` → 1 exit 0, 1 exit 3 ; journal local inchangé (diff) ; `conflits_e` 3 cas |
| L3 | implementeur | `bin/terminal.py`, `tests/test_terminal_pairs.py` | `bin/comptes.py` | L1 | uid hors `--pairs` → fermé ; `--persistant` ne `unlink` pas ; `consigne_chef(None)` == `CONSIGNE_CHEF` |
| L4 | implementeur | `bin/dash.py`, `bin/agentx`, `tests/test_dash_serveur.py` | comptes, terminal | L1 L3 | sans en-tête → 403 ; jeton autre compte → 403 ; `/api/term/*` → socket du compte ; local : clés `state.json` ⊇ avant |
| L5 | implementeur | `dash/dash.js`, `dash/index.html`, `dash/dash.css` | `bin/dash.py` | L4 | compte affiché ; `chefs[]` rendu ; voix masquée si `voix == null` ; local inchangé (capture) |
| L6 | implementeur | `bin/sonnerie.py`, `bin/garde_dispatch.py`, `CLAUDE.md` | `bin/vx.py` | L2 | évènement porte `compte` ; dispatch en conflit E → refus exit 2 ; CLAUDE.md « un chef par compte » |
| L7 | devops | `deploy/agentx-salle.service`, `deploy/agentx-chef@.service`, `deploy/oauth2-proxy.cfg`, `deploy/sshd-agentx.conf`, `deploy/provisionner.sh`, `deploy/serveur.exemple.json`, `deploy/LISEZMOI.md` | contrat.md | ∅ (recette après L4) | `systemd-analyze verify` OK ; en-tête `X-Forwarded-User` logué = login ; proxy refuse non-membre org |
| L8 | testeur | `tests/recette_serveur.md` | tout | L4 L6 L7 | uid julien `connect` socket sylvain → refus ; `curl --unix-socket salle.sock` uid julien → refus ; 2 navigateurs, 2 terminaux distincts |
| L9 | securite | ∅ (audit) | tout + `risques.md` | L8 | chaque EX bloquante → preuve commande → sortie |

- chemins `tests/` NV (arbo de tests non lue) → chef ajuste au pack
- hébergement, choix machine, DNS : hors contrat → L7 + humain

## C9 — Point de non-retour

- U1 : fichiers du vault/dépôt possédés par 3 uid → revenir à 1 utilisateur = `chown -R` + perte de traçabilité uid
- format journal `[cle]` : append-only → lignes écrites restent, tout parseur futur gère les 2 formats
- callback OAuth figé `localhost:7777` → changer le port = reconfigurer l'OAuth App + chaque tunnel
- frontmatter `chef:` sur les tâches → `doctor` et `ready` en dépendent dès L2

## NV (à lever avant ou pendant le lot indiqué)

- `X-Forwarded-User` = login GitHub chez oauth2-proxy (L7)
- cookie `Secure` accepté sur `http://localhost` par Firefox/Chrome (L7)
- `claude /login` utilisable dans le pty web (L3/L8)
- plafond de coût par session Claude Code ; `CLAUDE_CONFIG_DIR` non documenté → non utilisé
- §C8 seagle déjà mécanisé ou non (L2)
