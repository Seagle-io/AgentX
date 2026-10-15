---
name: conventions-geolens
description: Conventions, commandes, pièges et interdits des dépôts Geolens (geolens-web : api Fastify, web viewer 3D, serveur de test). Charger pour toute tâche touchant un dépôt Geolens ou son serveur de test.
---
# Conventions Geolens

G = `~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` · git local seul.

## Outillage
- node v22.22.1 · 0 remote · 1 commit local/tâche (chef) [[geolens-web-outillage]]
- commit : `git -c user.name=Julien -c user.email=julien@seagle.io commit` (G sans identité) [[geolens-web-outillage]]
- api test : `npm --prefix api test` (vitest + pg-mem, USE_MEM_DB=1) [[geolens-web-outillage]]
- api typecheck : `npm --prefix api run typecheck` (noUnusedLocals) [[geolens-web-outillage]]
- web test : `npm --prefix web test` (vitest env node) ; 0 jsdom → helpers purs seulement [[geolens-web-outillage]]
- web : ne jamais importer `main.ts` / `POIManager.ts` ; logique viewer = module pur `core/*.ts` + test node [[geolens-web-outillage]]
- viewer typecheck : `npx tsc --noEmit -p tsconfig.viewer.json` ; `npm run typecheck` EXCLUT `src/viewer` [[geolens-web-outillage]]
- eslint ignore `src/viewer` → lint non probant [[geolens-web-outillage]]
- web : `npm --prefix web run build` (tsc + vite ≈ 20-35 s) [[geolens-web-outillage]]
- `node scripts/check-viewer-html-sync.mjs` — viewer.html ↔ src/viewer/index.html, meta CSP identique [[geolens-web-outillage]]
- monolithes gelés : `main.ts` 9405 l, `server.ts` ~3390 l → module neuf + simple appel [[geolens-web-outillage]]
- pg-mem : `ON CONFLICT` non fiable, `ROLLBACK` inopérant (db.ts:72), ≠ fake timers → tx/concurrence en Postgres réel [[geolens-web-outillage]]
- dev:api = `tsx watch` → éditer `api/src` redémarre l'API des preuves ; séquencer lots api/ et e2e/ [[geolens-web-outillage]]
- worker : scipy absent → `python3 -m pytest -q --noconftest tests/test_secret.py` [[geolens-web-outillage]]
- e2e : playwright-core 1.61.0 exige `chromium_headless_shell-1228` → `npx playwright-core install chromium` dans `e2e/` [[geolens-web-outillage]]
- e2e : preview web :5180 + `BASE=http://localhost:5180` ; :5173 = Vite OrthoPro intouchable [[geolens-web-outillage]]
- `rg` sans `--hidden` rate `.env*` [[geolens-web-outillage]]
- jeton tuile sign/verify : `api/src/storage.ts:47-68` (≠ auth.ts) [[geolens-web-outillage]]
- fastify ≥ 5.12.5 : `trustProxy: <number>` fail-closed (jamais XFF) → IP/CIDR ou `'loopback'|'linklocal'|'uniquelocal'` [[fastify-trustproxy-5-12]]
- montée de version fastify : vérifier `fastify.d.ts` installé (IP cliente, rate-limit) [[fastify-trustproxy-5-12]]

## Sécurité
- `api/src/session.ts` — session_version + claim `sv` ; requireAuth relit user+org à chaque requête [[geolens-web-securite-carte]]
- checkUserAccess ordre : user_missing → disabled → pending → org_suspended → session_revoked [[geolens-web-securite-carte]]
- `api/src/tileExp.ts` — jeton tuile exp 8-12 h (T 28800, W 14400) [[geolens-web-securite-carte]]
- `api/src/logRedact.ts` — `redactUrl` : clé query décodée, insensible casse ; chemin/fragment/`;token` non masqués [[geolens-web-securite-carte]]
- `api/src/config.ts` — `posInt(v, def, max)` : TTL ≤ 604800, fenêtre ≤ 86400 [[geolens-web-securite-carte]]
- `api/src/config.ts` — `proxyList` : v6 recouvrant `::ffff:0:0/96` exige ≥ /104 [[geolens-web-securite-carte]]
- garde prod `productionProblems` : actif si GEOLENS_ENV (trim, lower) = production ; refus = exit 1 avant écoute [[geolens-web-securite-carte]]
- garde prod : JWT ≥ 32 car. et ≥ 10 distincts ; valeurs d'exemple refusées [[geolens-web-securite-carte]]
- `web/src/viewer/ui/safeHtml.ts` — escapeHtml, isSafeImageDataUrl (png|jpeg base64), oneOf [[geolens-web-securite-carte]]
- `HttpBackend.ts` makeSignUrl : jeton seulement vers l'origine de apiBase [[geolens-web-securite-carte]]
- CSP viewer stricte : 0 inline script, 0 CDN ; DRACO/Basis dans `web/public/` ; dev : plugin vite `glr-csp-dev` [[geolens-web-securite-carte]]
- `/api/health` vivacité ; `/api/ready` DB + `storage.probe()` (s3:ListBucket) ; 503 sans détail [[geolens-web-securite-carte]]
- 1er admin sans SQL : `api/src/scripts/create-platform-admin.ts` (Postgres déjà migré, API démarrée 1×) [[geolens-web-securite-carte]]
- route tuile : `TILE_GRANT_CACHE_MS` défaut 30000 (0 = off) ; révocation ≤ TTL ; cache par process [[geolens-route-tuile-charge]]
- route tuile : `S3_PRESIGN_SDK=1` → retour SDK sans code ; `presignGetV4` = sortie SDK octet pour octet [[geolens-route-tuile-charge]]
- cache viewer : `VIEWER_TILE_CACHE` défaut off ; jamais token/query dans la clé ; jamais 206/Range, no-store, `project.json` [[geolens-route-tuile-charge]]
- périmé : réécriture sous un `storage_prefix` servi ≤ 30 j interdit sans nouveau contentTag [[geolens-route-tuile-charge]]

## Serveur de test
- `ssh -p 34522 geo-test@82.65.97.67` ; identifiants ∅ → fournis par l'humain [[geolens-serveur-test]]
- 1 connexion, commandes regroupées (port coupé sinon) [[geolens-serveur-test]]
- web : `http://82.65.97.67:34580` ; KVM 4 vCPU / 15 Go [[geolens-serveur-test]]
- `~/geolens-web` = copie SANS git, plus ancienne que G [[geolens-serveur-test]]
- pile : `docker compose -f docker-compose.prod.yml` (api, web, caddy, db, minio) [[geolens-serveur-test]]
- déployer front seul : md5 ↔ dépôt → `patch -p1 --dry-run` → `build web` → `up -d --no-deps web` [[geolens-serveur-test]]
- retour arrière : originaux `~/deploy-c23/backup/` ; même séquence [[geolens-serveur-test]]
- jamais `pull` (minio introuvable) [[geolens-serveur-test]]
- JAMAIS `GEOLENS_ENV=production` sur le serveur test : COOKIE_SECURE=0 + WEB_ORIGIN http → boot refusé, boucle restart [[geolens-serveur-test]]
- Cache Storage inactif en http → cache tuiles viewer = no-op [[geolens-serveur-test]]
- hairpin KO : URL publique injoignable depuis les conteneurs [[geolens-serveur-test]]
- modifier Caddy = humain (exposition MinIO) [[geolens-serveur-test]]
- vérif conteneurs jetables : préfixe `glverif-`, nettoyage `docker rm -fv <nom>` [[verif-conteneurs-jetables]]
- contrôle fin : `docker ps -a --filter name=glverif- -q` → ∅ ; `docker volume ls` avant = après [[verif-conteneurs-jetables]]
- `minio/minio` non pullable → `bitnamilegacy/minio` ; `COOKIE_SECURE=1` : `curl -D -` puis `-H "Cookie: glx_session=…"` [[verif-conteneurs-jetables]]

## Banc / charge
- k6 : `~/Makefile` → `make run VUS=N DURATION=2m` · `make report VUS=N` · `make stop` [[geolens-serveur-test]]
- 30 VUs : `BASE_URL=http://api:4000` ; `make run VUS=30 PER=10` (VUS % PER = 0) ; 1 VU/conteneur sature [[geolens-serveur-test]]
- quota tuile : `RATE_LIMIT_TILE_MAX=500000` pendant mesure, puis restaurer 5000 [[geolens-serveur-test]]
- k6 redirect : `TILE_ORIGIN_PUBLIC` + `TILE_ORIGIN_INTERNAL` ensemble ou aucune (exit 107) [[geolens-serveur-test]]
- bench route tuile : `npx vitest run test/bench-t020-tile302.test.ts` ; relever `RATE_LIMIT_TILE_MAX` [[geolens-route-tuile-charge]]
- k6 : image uid ≠ hôte → `--user $(id -u)` ; garder le corps = CPU générateur ×3,8 [[geolens-route-tuile-charge]]
- banc 3D : ports 4010+n / 5180+n ; 4000, 5173 = OrthoPro intouchables [[geolens-banc-preview-3d]]
- banc 3D : 1 dossier jetable `T` par tâche, kill par PID, jamais `pkill` global [[geolens-banc-preview-3d]]
- `STORE=$T/storage DEPTH=6 TEX=512 node e2e/bench-tileset.mjs` → 1365 glb ; DEPTH=4 = banc inutile [[geolens-banc-preview-3d]]
- build banc : `npx vite build --outDir $T/dist-apres` ; `dist/` du dépôt jamais touché [[geolens-banc-preview-3d]]
- API banc : `npx tsx src/index.ts` avec `USE_MEM_DB=1` ≠ `npm run dev` (tsx watch) [[geolens-banc-preview-3d]]
- headless défaut SwiftShader → preset `standard`, 0,4-3 fps ; GPU : `--enable-gpu --use-angle=vulkan --ignore-gpu-blocklist` [[geolens-banc-preview-3d]]
- GPU réel → preset `maximale` ; forcer `PRESET=standard` pour H9/H11 ; loguer le renderer dans `## Vérifié comment` [[geolens-banc-preview-3d]]
- sondes window : `__glrTiles`, `__glrTileMem`, `__glrMotionGate`, `__glrSplatStats`, `__glrTest`, `__glrDiag` [[geolens-banc-preview-3d]]
- critère « net » : `dl===0 && pa===0 && q===0 && et===1` tenu ≥ 3 s [[geolens-banc-preview-3d]]
- scripts versionnés : `G/e2e/bench-tileset.mjs`, `bench-3d.mjs`, `bench-preview/` ; `BASE` obligatoire [[geolens-banc-preview-3d]]
- scratchpad = éphémère → recopier les scripts utiles dans `G/e2e/` [[geolens-banc-preview-3d]]

## Interdits
- BDD du serveur de test (82.65.97.67:34580) : lecture/exploitation OK ; 0 DELETE/UPDATE/DROP/TRUNCATE, 0 migration, 0 seed, 0 restauration, 0 `docker compose down -v`.
- L'API lance `migrate()` au boot (ALTER TABLE ADD COLUMN) : tout déploiement API sur le serveur de test = analyser l'effet base AVANT ; préférer un déploiement web seul.
- Jamais de `git push`, jamais de migration lancée par un agent : passer la tâche en `bloque` avec la commande exacte.
- jamais `docker prune` / `volume rm` / `compose down -v` (incident T042) [[verif-conteneurs-jetables]]
- jamais écraser `.env` ni afficher un identifiant [[geolens-serveur-test]]
