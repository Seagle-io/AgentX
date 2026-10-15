---
titre: serveur de test GeoLens — accès, déploiement front seul, mesure de charge
resume: ssh port 34522, front seul via build web + up --no-deps, k6 + headless, 0 écriture BDD
source: geolens-viewer T074-T076, D24-D26
cree: 2026-10-09
tags: [note, geolens, serveur-test, charge]
---

# Serveur de test GeoLens

## Accès
- `ssh -p 34522 geo-test@82.65.97.67` ; identifiants : ∅ → fournis par l'humain
- clé hôte ED25519 `SHA256:IS5Q98L1fJGV2qefKxCD2so4CkMOtGZ1mal2zt+NVx0` (vérifiée humain) ; RSA aussi présentée
- connexions rapprochées → port coupé temporairement → 1 connexion, commandes regroupées
- web : `http://82.65.97.67:34580` (portail, `/viewer.html`) ; KVM 4 vCPU / 15 Go, disque 96 Go

## Pile
- `~/geolens-web` — copie SANS git, plus ancienne que le dépôt de travail
- `docker compose -f docker-compose.prod.yml` : api, web, caddy, db (postgres:16-alpine), minio (≈ 29 Go)
- `.env` présent — jamais écraser ni afficher
- l'API lance `migrate()` au démarrage → redémarrage = accord humain explicite

## Déployer le front seul
- md5 fichiers serveur ↔ dépôt → `patch -p1 --dry-run` → appliquer
- `docker compose -f docker-compose.prod.yml build web`
- `docker compose -f docker-compose.prod.yml up -d --no-deps web` — api, base intactes
- contrôle : `docker exec geolens-web-web-1 grep … /usr/share/nginx/html/assets/*.js`

## Revenir en arrière
- originaux `~/deploy-c23/backup/` · corrigés `~/deploy-c23/patched/` ; même séquence : copie → build web → `up -d --no-deps web`

## Mesurer
- k6 : `~/Makefile` → `make run VUS=N DURATION=2m` · `make report VUS=N` · `make stop`
- k6 : `~/viewer-navigation.js` — téléchargements par zones, sans moteur 3D, sans cache → ≠ mesure du renderer ; identifiants `~/.env.k6` (600)
- réf 09/10 : 5 VUs → 35 640 tuiles / 8,5 Go / médiane 22 ms
- réf 09/10 : 10 VUs → 48 480 tuiles / 11,7 Go / médiane 78 ms ; goulot API ≈ 1,15 cœur
- headless : `measure.mjs` (playwright-core de `G/e2e`, swiftshader, CDP cache désactivé) ; scénarios `open` · `open3d` (clic « Explorer en 3D ») · `nav` 300 s
- caméra par défaut ≈ 90 tuiles (2 % de 4 558) → ≠ cas lourd ; mémoire GPU non représentative

## API redéployée (charge-3d, 13/10)
- API = G `03a7bcb` (`up -d --no-deps --build api`) ; jamais `pull` (minio introuvable)
- `.env` serveur : `RETENTION_MODE=off` (sinon audit_log INSERT ×3/24 h) ; `TILE_PRESIGN_REDIRECT=1` ; `S3_PUBLIC_ENDPOINT` posé
- JAMAIS `GEOLENS_ENV=production` : `COOKIE_SECURE=0` + `WEB_ORIGIN` http → boot refusé (config.ts:342-343), boucle de restart
- `migrate()` à chaque boot : DML (DELETE org_packs, UPDATE projects) + `sweepOrphans` `_ingest-tmp` > 2 h = inchangé
- Cache Storage inactif en http (pas de secure context) → cache tuiles viewer = no-op ; test = Chrome flag secure-origin
- quota tuile : `RATE_LIMIT_TILE_MAX=500000` pendant la mesure (1 compte k6 partagé → 429 dès ~3 VUs), puis restaurer 5000

## Caddy / S3 présigné
- hairpin KO (hôte ET réseau docker) : l'URL publique `82.65.97.67:34580` injoignable depuis les conteneurs
- k6 : `make run SCENARIO=redirect TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580 TILE_ORIGIN_INTERNAL=http://caddy:80` (ou `~/.env.k6`) ; les 2 variables ou aucune (sinon exit 107)
- k6 réécrit l'URL 302 vers l'origine interne + en-tête `Host` public (SigV4 signe Host)
- bloc Caddy `@s3_presigne` : `GET /<bucket>/*` avec `X-Amz-Signature` → `minio:9000`, Host inchangé ; fichier `~/deploy-charge3d/Caddyfile.charge3d`
- vérifié de l'extérieur → 403 : bucket/liste/objet sans signature, PUT, DELETE, signature fausse ; `:9001` injoignable
- modifier Caddy = humain (classifieur refuse l'exposition MinIO à l'agent)
- `/<bucket>/*` réservé sur l'origine test ; PUT non routé → upload direct via URL publique cassé

## Mesurer à 30 VUs
- générateur colocalisé = goulot : 1 VU/conteneur → k6 ≈ 245 % de 400 % CPU, mesure invalide
- `BASE_URL=http://api:4000` ; `make run VUS=30 PER=10` → 3 conteneurs × 10 VUs (VUS % PER = 0 sinon erreur)
- corps de tuile non conservés → sous chunked `tile_bytes` = 0 : Mo/s faussés
- mesures M0-M4 + goulots : [[geolens-route-tuile-charge]]

## Interdits
- BDD : 0 écriture destructive, 0 migration, 0 `down -v`, 0 seed, 0 restauration
- écraser `.env` · afficher un identifiant · push

## Voir aussi
- [[geolens-web-outillage]] · [[geolens-web-securite-carte]] · [[geolens-route-tuile-charge]]
