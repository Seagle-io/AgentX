---
pack: T039
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T039 — Infra : compose à variables obligatoires, HSTS, image API non root, runbook de restauration

> Seule source de vérité de l'agent T039. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les défauts d'exploitation T035 (D4, D6-D9 + root) dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online : compose Scaleway qui refuse de démarrer sans secret, HSTS frontal, API non root, runbook de restauration exécutable dans l'ordre, sans toucher à `api/src`.

## Definition of Done
- [ ] compose : bloc `environment:` api (Contrats) ; dossier jetable `mktemp -d` + `.env` factice complet → `docker compose -f … config --quiet` rc=0 ; retrait de JWT_SECRET, puis DATABASE_URL, puis S3_SECRET_KEY → rc≠0 avec le message `:?` (3 sorties collées)
- [ ] Caddyfile : HSTS dans `header @front` ; `docker run --rm -v <copie>:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile` → Valid ; `caddy adapt … | rg -c Strict-Transport` ≥ 1
- [ ] api/Dockerfile : `USER node` avant CMD ; `docker build -t glverif-api G/api` puis `docker run --rm glverif-api id -un` → `node` ; image supprimée en fin (`docker rmi glverif-api`)
- [ ] DEPLOYMENT.md : section sauvegarde déplacée après « 5 quater » et renommée « 5 quinquies » à sa place (ordre 5, 5 bis, 5 ter, 5 quater, 5 quinquies) ; étapes de restauration selon Contrats ; `rg -n "^## " DEPLOYMENT.md` collé
- [ ] .env.production.example : commentaire en tête « GEOLENS_ENV, USE_MEM_DB, STORAGE_DRIVER fixés par docker-compose.scaleway.yml » ; 0 vraie valeur secrète
- [ ] `git -C G diff --stat -- docker-compose.scaleway.yml Caddyfile api/Dockerfile DEPLOYMENT.md .env.production.example` collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | E | api :18-33 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | E | header @front :7-12 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/Dockerfile` | E | stage final :11-21 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/DEPLOYMENT.md` | E | §5 quinquies :68-98, ordre des §5 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | en-tête :1-3 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package.json` | L | scripts, pour la commande admin |

## Contrats
```yaml
# docker-compose.scaleway.yml — service api, après env_file (environment l'emporte sur env_file)
    environment:
      GEOLENS_ENV: production            # active la garde de prod de l'API (T040)
      USE_MEM_DB: "0"
      STORAGE_DRIVER: s3
      JWT_SECRET: ${JWT_SECRET:?JWT_SECRET obligatoire (openssl rand -hex 48)}
      DATABASE_URL: ${DATABASE_URL:?DATABASE_URL obligatoire (Postgres managé)}
      WEB_ORIGIN: ${WEB_ORIGIN:?WEB_ORIGIN obligatoire (https://…)}
      S3_BUCKET: ${S3_BUCKET:?S3_BUCKET obligatoire}
      S3_ACCESS_KEY: ${S3_ACCESS_KEY:?S3_ACCESS_KEY obligatoire}
      S3_SECRET_KEY: ${S3_SECRET_KEY:?S3_SECRET_KEY obligatoire}
# compose lit .env du dossier projet pour l'interpolation ; env_file: .env conservé (autres variables)
```
```
# Caddyfile — dans header @front, après Referrer-Policy :
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
# /api/* : HSTS déjà posé par helmet côté API (T035) ; CSP viewer = meta dans viewer.html (D6) → ne pas ajouter de CSP header viewer
```
```dockerfile
# api/Dockerfile stage final : avant EXPOSE/CMD
USER node
```
Runbook — étapes de restauration (remplacent §5 quinquies point 4, garder points 1-3, 5, 6) :
1. Restaurer la base : console Scaleway → point de restauration → noter la NOUVELLE URL de connexion.
2. Remettre le `.env` depuis la copie chiffrée (JWT_SECRET identique), PUIS y remplacer `DATABASE_URL` par l'URL de l'étape 1.
3. Object Storage : restaurer les objets écrasés/supprimés depuis leurs versions (console Scaleway, ou `aws s3api list-object-versions --bucket <b> --endpoint-url <S3_ENDPOINT>` puis `aws s3api copy-object --copy-source "<b>/<clé>?versionId=<id>"`).
4. Restaurer caddy-data : `docker volume create <projet>_caddy-data` puis `docker run --rm -v <projet>_caddy-data:/d -v "$PWD":/b alpine tar xzf /b/caddy-data.tgz -C /d`.
5. `docker compose -f docker-compose.scaleway.yml up -d --build` — l'API refuse de démarrer si la config de prod est incomplète (garde `GEOLENS_ENV=production`).
6. Si aucun admin plateforme n'existe : `docker compose -f docker-compose.scaleway.yml exec api node dist/scripts/create-platform-admin.js --email <email> --org "<organisation>"` → affiche un mot de passe temporaire à changer à la 1ʳᵉ connexion (script livré par T040).
Ajouter sous §5 quinquies une ligne « Garde de production » : refus de démarrer si JWT_SECRET par défaut/factice/< 32 car., base mémoire ou DATABASE_URL absente, STORAGE_DRIVER ≠ s3 ou clés S3 absentes, SEED_DEMO actif, RATE_LIMIT ou COOKIE_SECURE inactif, WEB_ORIGIN non https, TRUST_PROXY invalide.

## Décisions actées
- cible prod = Scaleway managé, 0 pg_dump — decisions.md D2
- CSP viewer en meta, Caddy n'ajoute que frame-ancestors/base-uri/form-action — D6 ; T035 D5 rejeté
- garde de prod activée par GEOLENS_ENV=production (même convention que le worker) — D12

## Hors périmètre
- api/src, web/, worker/, e2e/ ; docker-compose.yml et docker-compose.prod.yml (démo, HP D2) ; nginx.conf
- `docker compose up`, écriture de volume réel, lecture d'un `.env` réel
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean

## Environnement
- docker 29.6.2 ; images caddy:2-alpine, node:22-slim pullables ; build api ≈ npm install complet (lent, OK)
- G git, HEAD `745bc54` ; 1 autre implémenteur (T038) en parallèle sur e2e/ et lance l'API sur :4000 et un preview sur :5180 — ne pas toucher ces ports ; :5173 = Vite OrthoPro intouchable
- `.env` factice : valeurs `x` pour toutes les variables du Contrat, dans le dossier jetable seulement

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Bash(docker compose config --quiet, docker run --rm caddy, docker build, docker run --rm glverif-api, docker rmi glverif-api, mktemp, cp, rm -r du dossier jetable, rg, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T039
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
