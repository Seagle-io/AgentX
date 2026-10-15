---
pack: T035
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T035 — Vérif T013 : déploiement Scaleway, journaux bornés, healthcheck, runbook

> Seule source de vérité de l'agent T035. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter que `docker-compose.scaleway.yml` + Caddy + nginx + runbook rendent l'instance exploitable et sûre (secrets obligatoires, API non exposée, journaux bornés, healthchecks, en-têtes, restauration documentée et cohérente), sans corriger.

## Definition of Done
- [ ] A1-A9 chacun OK/KO avec preuve
- [ ] `docker compose config --quiet` joué dans un dossier jetable (`mktemp -d`, hors G) avec `.env` factice ; puis avec 1 variable critique retirée → échec attendu (sortie collée)
- [ ] dossier jetable supprimé ; 0 fichier créé dans G (`git -C G status --short` → ∅)
- [ ] `result.md` ≤ 60 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture + exécution docker limitée ; écriture : `result.md` + dossier jetable hors G.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | L | cible prod (D2) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | en-têtes, frontal |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/nginx.conf` | L | front |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/Dockerfile` | L | user, healthcheck |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/Dockerfile` | L | build |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | variables prod |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/DEPLOYMENT.md` | L | runbook §5 et suivantes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | loadConfig, garde prod |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/worker/README.md` | L | GEOLENS_ENV, secret |

## Contrats
```
D2 : cible prod = docker-compose.scaleway.yml ; sauvegarde = outils managés Scaleway (Postgres + Object Storage) + runbook ; 0 script pg_dump
D10 : TRUST_PROXY=uniquelocal sûr seulement si l'API ne publie aucun port
D6 : CSP viewer stricte ; portail Report-Only ; 0 directive `log` Caddy ; journaux Docker bornés max-size 10m, max-file 5
T013 annoncé : api healthcheck ; web condition: service_healthy ; 3× logging max-size 10m max-file 5 ; nginx.conf +4 l ; DEPLOYMENT.md §5 quinquies runbook (jamais joué)
```
Affirmations à réfuter :
- A1 chaque secret/variable critique du compose (DB, S3, JWT, worker) en `${VAR:?…}` : aucun défaut trivial ; variable retirée → `config` échoue
- A2 api et worker sans `ports:` ; seul Caddy publie 80/443 ; réseau interne ⇒ uniquelocal cohérent
- A3 tout service a `logging` borné (y compris caddy, worker s'il existe)
- A4 healthcheck api : commande présente dans l'image (curl/wget/node ?) — sinon healthcheck toujours rouge → web jamais démarré
- A5 Caddyfile : HSTS présent ? (todo chef : absent) ; frame-ancestors, nosniff, Referrer-Policy ; CSP viewer
- A6 garde prod : config.ts refuse démarrage en prod avec JWT secret défaut, pg-mem, seed démo, rate-limit off ? (`rg -n "production" api/src/config.ts`) — liste de ce qui est gardé et de ce qui ne l'est pas
- A7 GEOLENS_ENV / NODE_ENV=production posé pour api et worker dans le compose (sinon garde inerte)
- A8 runbook : étapes exécutables dans l'ordre, prérequis restaurés (JWT secret identique, .env, création admin plateforme sans SQL ?) ; numérotation §5 cohérente
- A9 `docker run --rm caddy:2-alpine caddy validate` sur copie du Caddyfile → valide

## Décisions actées
- Scaleway managé, pas de pg_dump — D2
- restauration réelle = humain sur Scaleway (NV attendu ici, le dire)

## Hors périmètre
- corriger, éditer src/, un test existant, un fichier de config
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean
- npm install, npm audit fix, montée de dépendance
- `docker compose up`, `docker build`, toute écriture de volume ; lire un `.env` réel (noms seulement)
- api/src hors config.ts, web/src, e2e/

## Environnement
- G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online · git local : base `745d46f`, HEAD `6e22e8c` · arbre propre (`git -C G status --short` → ∅)
- node v22.22.1 ; deps api, web, e2e installées ; vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1
- état connu : typecheck 0 · lint 0 err 1 warn (Admin.tsx:368, préexistant) · api 73 fichiers 629 tests · web 176 fichiers 1691 tests
- 3 autres vérificateurs tournent en parallèle sur G : 0 écriture hors fichiers jetables listés ; ne jamais lancer `npm install`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + dossier mktemp hors G), Bash(docker compose config --quiet, docker run --rm caddy:2-alpine caddy validate, docker run --rm nginx:alpine nginx -t, rg, cp vers dossier jetable, rm -r du dossier jetable, git -C G status)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T035
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A<n> OK | KO — preuve ≤ 12 mots
## Défauts
- D<n> · chemin:L — symptôme — repro (commande ou cas) — correctif ≤ 15 mots | ∅
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
