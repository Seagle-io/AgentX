---
pack: T045
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T045 — Contre-vérif finale en conteneurs : T043 + T044 (ready, admin concurrent, garde)

> Seule source de vérité de l'agent T045. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter B1-B7 (correctifs T043 `ea4eded` + T044 `80fe49a`) sur l'image API réelle de G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online avec Postgres + MinIO jetables ; rendre OK ou DÉFAUTS avec repro, sans corriger.

## Definition of Done
- [ ] B1-B7 chacun OK/KO avec sortie collée
- [ ] nettoyage NOMINATIF : `docker rm -fv` de chaque conteneur `glverif-*` créé, `docker network rm glverif-net`, `docker rmi glverif-api` ; preuve : `docker ps -a --filter name=glverif- -q` → ∅ ; `docker volume ls` avant/après collés (seuls les anonymes de tes conteneurs disparaissent)
- [ ] 0 fichier modifié dans G (`git -C G status --short` → ∅) ; fichiers de travail dans `mktemp -d` hors G, supprimés
- [ ] `result.md` ≤ 60 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture + exécution docker.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/health.ts` | L | /api/health, /api/ready |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | probe() :151, s3 :513-517 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | productionProblems |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/scripts/create-platform-admin.ts` | L | transaction |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/Dockerfile` | L | HEALTHCHECK, USER node |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | L | environment, healthcheck |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-upload.mjs` | L | buildTilesetZip :46 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | rg : POST /api/admin/projects :2217 (champ « archive ») · catch :2250 |

## Contrats
```
réseau   : docker network create glverif-net
postgres : docker run -d --name glverif-pg --network glverif-net -e POSTGRES_PASSWORD=<aléa> -e POSTGRES_DB=geolens postgres:16-alpine
minio    : docker run -d --name glverif-minio --network glverif-net -e MINIO_ROOT_USER=<aléa> -e MINIO_ROOT_PASSWORD=<aléa ≥8> bitnamilegacy/minio
           (minio/minio et minio/mc NON pullables ici — T042) ; bucket : docker exec glverif-minio mc mb local/geolens-verif (sinon mc alias set d'abord)
image    : docker build -t glverif-api G/api
api      : docker run -d --name glverif-api --network glverif-net -p 127.0.0.1:4100:4000 --env-file <tmp>/api.env glverif-api
env sain : GEOLENS_ENV=production USE_MEM_DB=0 DATABASE_URL=postgresql://postgres:<p>@glverif-pg:5432/geolens STORAGE_DRIVER=s3
  S3_ENDPOINT=http://glverif-minio:9000 S3_REGION=us-east-1 S3_BUCKET=geolens-verif S3_ACCESS_KEY=<u> S3_SECRET_KEY=<p> S3_FORCE_PATH_STYLE=1
  JWT_SECRET=<openssl rand -hex 48> WEB_ORIGIN=https://verif.local COOKIE_SECURE=1 RATE_LIMIT=1 TRUST_PROXY=uniquelocal
cookie   : COOKIE_SECURE=1 → curl -c ignore le cookie sur http ; utiliser -D - puis -H "Cookie: <nom>=<val>"
/api/ready : 200 { ok: true, db: 'ok', storage: 'ok' } | 503 { ok: false, db, storage } ; sondes bornées 3000 ms ; échec logué 'readiness KO'
upload KO stockage : 502 + log error 'upload : écriture stockage échouée'
admin : node dist/scripts/create-platform-admin.js --email <e> --org "<nom>" ; transaction org+user ; doublon → 'email déjà utilisé'
```
Affirmations à réfuter :
- B1 env sain : `curl 127.0.0.1:4100/api/ready` → 200 ok/ok/ok ; `docker inspect -f '{{.State.Health.Status}}' glverif-api` → healthy (attendre ≤ 60 s)
- B2 2ᵉ conteneur `glverif-api-bads3` (port 4101) avec S3_SECRET_KEY faux : démarre (garde OK) ; /api/ready → 503 storage ko ; health → unhealthy ; upload ZIP (cookie admin) → 502 ET `docker logs` contient « écriture stockage échouée » ; 0 secret S3 dans les logs
- B3 `docker stop glverif-pg` → /api/ready 503 db ko en ≤ 4 s ; `docker start glverif-pg` → 200 en ≤ 30 s
- B4 base vierge : 3 `docker exec … create-platform-admin.js --email race@verif.local --org "Race"` lancés en parallèle → 1 succès, 2 « email déjà utilisé » ; `psql … -c "select count(*) from organizations where name='Race'"` → 1 ; `users` → 1 ligne race@
- B5 garde : `GEOLENS_ENV=Production` + JWT_SECRET `'a'×40` → refus ; DATABASE_URL d'exemple `postgresql://USER:PASSWORD@HOTE:5432/geolens?sslmode=require` → refus ; `S3_BUCKET=__X__` → refus (3 × `docker run --rm … glverif-api`, exit 1 + règle)
- B6 `docker logs glverif-api | rg -c "token=[^\[]"` → 0 après 1 tuile signée servie ; HSTS sur /api/ready
- B7 hors conteneur : `npm --prefix api test` → ≥ 690 verts ; `npm --prefix api run typecheck` exit 0

## Décisions actées
- /api/health vivacité, /api/ready disponibilité — T044 ; garde GEOLENS_ENV normalisée — D12
- nettoyage nominatif seulement — decisions.md D13 (incident T042)

## Hors périmètre
- éditer G ; toute commande docker sur un objet non `glverif-*` ; nettoyage global de volumes ou d'images (bloqué par la garde, D13)
- from-upload HTTP (couvert par hardening-t043.test.ts) ; Caddy, web, worker
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean

## Environnement
- docker 29.6.2 ; postgres:16-alpine, bitnamilegacy/minio, node:22-slim pullables ; build ≈ 1-3 min
- ports hôte : 127.0.0.1:4100 et :4101 seulement ; :5173 (Vite OrthoPro) et conteneur orthopro-postgres intouchables
- G HEAD `80fe49a`, arbre propre ; suite 77 fichiers 690 tests ; aucun autre agent actif

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (result.md + dossier mktemp), Bash(docker build/run/exec/logs/inspect/stop/start/rm -fv/rmi/network sur objets glverif-*, docker volume ls, docker ps, curl 127.0.0.1:4100-4101, openssl rand, node pour le zip, npm --prefix api test, npm --prefix api run typecheck, mktemp, rm -r du dossier jetable, rg, git -C G status)
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom ; jamais de nettoyage global.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T045
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- B<n> OK | KO — preuve ≤ 12 mots
## Défauts
- D<n> · chemin:L — symptôme — repro — correctif ≤ 15 mots | ∅
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
