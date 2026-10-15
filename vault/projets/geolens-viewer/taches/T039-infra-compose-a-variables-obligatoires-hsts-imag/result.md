---
tache: T039
statut: fait
---
## Livré
- G/docker-compose.scaleway.yml:L21-L30 — bloc environment api, 6 variables `:?`
- G/Caddyfile:L12 — HSTS 1 an dans header @front
- G/api/Dockerfile:L19 — `USER node` avant EXPOSE/CMD
- G/DEPLOYMENT.md:L119-L153 — §5 quinquies déplacé après 5 quater
- G/DEPLOYMENT.md:L123 — ligne « Garde de production » ajoutée
- G/DEPLOYMENT.md:L137-L143 — restauration en 6 étapes selon contrat
- G/.env.production.example:L3 — en-tête variables fixées par compose
## Vérifié comment
mktemp -d + .env factice 6×`x` ; `docker compose -f docker-compose.scaleway.yml config --quiet` → rc=0
sans JWT_SECRET → `error while interpolating services.api.environment.JWT_SECRET: required variable JWT_SECRET is missing a value: JWT_SECRET obligatoire (openssl rand -hex 48)` rc=1
sans DATABASE_URL → `error while interpolating services.api.environment.DATABASE_URL: required variable DATABASE_URL is missing a value: DATABASE_URL obligatoire (Postgres managé)` rc=1
sans S3_SECRET_KEY → `error while interpolating services.api.environment.S3_SECRET_KEY: required variable S3_SECRET_KEY is missing a value: S3_SECRET_KEY obligatoire` rc=1
`docker run --rm -v <copie>:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile` → `Valid configuration` rc=0
`caddy adapt --config /etc/caddy/Caddyfile | rg -c Strict-Transport` → `1`
`docker build -q -t glverif-api G/api` → `sha256:9b583a21…` rc=0 ; `docker run --rm glverif-api id -un` → `node`
`docker rmi glverif-api` → `Untagged: glverif-api:latest` ; dossier jetable `rm -r` OK
```
rg -n "^## " DEPLOYMENT.md
6:## 1. Architecture de prod
20:## 2. Choix hébergeur (souveraineté)
28:## 3. Prérequis
35:## 4. Déploiement (self-hosted, tout-en-un)
59:## 5. Variante « services managés » (recommandée à l'échelle)
68:## 5 bis. Emails (mot de passe oublié + invitations) — SMTP
92:## 5 ter. Fond satellite de la carte (souverain, sans token)
98:## 5 quater. Console d'administration & rôles (P3-Bloc 5)
119:## 5 quinquies. Sauvegarde & restauration (managé)
154:## 6. Sécurité & RGPD (déjà en place / à finaliser)
165:## 7. Ingestion des vraies maquettes (remplacer les triangles de démo)
173:## 8. Limites connues (état actuel)
```
```
git -C G diff --stat -- docker-compose.scaleway.yml Caddyfile api/Dockerfile DEPLOYMENT.md .env.production.example
 .env.production.example     |  1 +
 Caddyfile                   |  1 +
 DEPLOYMENT.md               | 67 +++++++++++++++++++++++----------------------
 api/Dockerfile              |  1 +
 docker-compose.scaleway.yml | 10 +++++++
 5 files changed, 48 insertions(+), 32 deletions(-)
```
`git -C G status --short` → 5 fichiers T039 + 8 `e2e/*.mjs` (T038, non touchés) ; HEAD `745bc54`
`.env.production.example` → valeurs restantes = gabarits (`__CHANGER_MOI__`, `__CLE_SECRETE__`…), 0 secret réel
## Écarts
- ∅ lecture hors WL
- runtime API sous `USER node` NV — 0 démarrage (`up` HP) ; /app root, lecture seule pour node
## Pour la suite
- `dist/scripts/create-platform-admin.js` cité au runbook §5 quinquies L143 : existe seulement après T040
- G/api/Dockerfile : si l'API écrit sous /app (driver local, tmp upload) → EACCES sous node ; vérifier en T040/T041
- G/docker-compose.scaleway.yml:L8-L14 en-tête liste encore USE_MEM_DB/STORAGE_DRIVER à mettre dans .env (redondant, inoffensif)
- DEPLOYMENT.md §5 quinquies vérif L5 : `grep -ciE` ne compte pas `strict-transport` ; ajouter au motif
- garde de prod (T040) doit lire GEOLENS_ENV=production injecté par compose
## Retour sur le pack
- Manquait: ∅ | Inutile: api/package.json (L) — script admin absent, chemin fourni par contrat
