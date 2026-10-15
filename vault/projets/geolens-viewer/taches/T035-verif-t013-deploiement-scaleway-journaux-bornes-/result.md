---
tache: T035
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 KO — 0 `${VAR:?}` dans compose ; variable retirée → config rc=0
- A2 OK — ports publiés : caddy 80/443 seuls ; réseau `default` bridge privé
- A3 OK — api, web, caddy : json-file 10m×5 ; worker ∅ dans compose
- A4 OK — `node -e fetch` ; node22 fetch global ; HOST défaut 0.0.0.0
- A5 KO — HSTS ∅ Caddy ; CSP viewer = frame-ancestors/base-uri/form-action seulement
- A6 KO — seul JWT défaut gardé ; placeholder, pg-mem, seed, storage local passent
- A7 OK partiel — NODE_ENV=production via api/Dockerfile:13 ; GEOLENS_ENV ∅ (worker absent)
- A8 KO — §5 quinquies avant bis/ter/quater ; étapes 2↔3 contradictoires ; S3 ∅
- A9 OK — `caddy validate` → Valid configuration ; 0 directive `log`
## Défauts
- D1 · api/src/config.ts:166 + server.ts:161 — `.env` copié tel quel (`JWT_SECRET=__CHANGER_MOI__`, .env.production.example:19) → API démarre, secret public, sessions/URLs tuiles forgeables ; idem `JWT_SECRET=x` — repro probe loadConfig cas `example_tel_quel` → DEMARRE — refuser placeholder `__CHANGER_MOI__` et longueur < 32 si `!useMemDb||cookieSecure`
- D2 · config.ts:162,175,180 — `.env` sans DATABASE_URL ni USE_MEM_DB → memDb=true seed=true : prod sur pg-mem, comptes démo semés, données perdues au restart, healthcheck vert — cas `sans_DB_ni_USE_MEM_DB` → DEMARRE — compose `${DATABASE_URL:?}` ou refus pg-mem si cookieSecure
- D3 · config.ts:170 — `.env` sans STORAGE_DRIVER → storage=local dans le conteneur, uploads perdus au rebuild, silencieux — cas `sans_STORAGE_DRIVER` → DEMARRE storage=local — `${STORAGE_DRIVER:?}` + S3_* en `:?` dans compose
- D4 · docker-compose.scaleway.yml:20 — `env_file: .env` sans interpolation gardée ; seul `.env` absent échoue (rc=1) ; `.env` vide → rc=0 — `docker compose config --quiet` avec .env vide → rc=0 — `environment: JWT_SECRET: ${JWT_SECRET:?…}` etc. pour DB, S3, JWT
- D5 · Caddyfile:8-13 — `/viewer.html` reçoit CSP sans script-src/connect-src ; ≠ D6 « CSP viewer stricte » — `caddy adapt` → seules 3 directives — ajouter CSP viewer stricte enforce (script-src 'self', connect-src 'self')
- D6 · Caddyfile:8 — Strict-Transport-Security absent sur documents ; seul helmet (server.ts:232, défaut) le pose sur /api/* — `caddy adapt | grep -i strict` → ∅ — `Strict-Transport-Security "max-age=31536000; includeSubDomains"` dans `header @front`
- D7 · DEPLOYMENT.md:86-87 — étape 2 modifie DATABASE_URL, étape 3 remet `.env` identique → écrase la nouvelle URL si restauration sur nouvelle instance — lecture ordre 2→3 — inverser : remettre `.env` puis éditer DATABASE_URL
- D8 · DEPLOYMENT.md:84-89 — restauration objets S3 (versioning) ∅ étape ; `tar xzf` caddy-data sans commande — lecture §5 quinquies.4 — ajouter étape restauration version bucket + commande tar exacte
- D9 · DEPLOYMENT.md:68,100,124,130 — ordre 5, 5 quinquies, 5 bis, 5 ter, 5 quater — `grep -n '^## ' DEPLOYMENT.md` — déplacer 5 quinquies après 5 quater
- D10 · config.ts:155 — `TRUST_PROXY=uniquelocal,10.0.0.0/4` → tp=false silencieux (XFF ignoré, rate-limit par IP Caddy) — cas `TRUST_PROXY_typo` — journaliser/refuser au boot si TRUST_PROXY posé mais invalide
## Vérifié comment
docker compose -f docker-compose.scaleway.yml config --quiet (.env = example) → rc=0
idem .env sans JWT_SECRET → rc=0 · sans DATABASE_URL/S3_*/STORAGE_DRIVER/USE_MEM_DB → rc=0 · .env vide → rc=0
idem .env absent → `env file …/.env not found` rc=1
grep -c ':?' docker-compose.scaleway.yml → 0
esbuild probe(config.ts copie)+garde server.ts:161 → example_tel_quel DEMARRE jwt=__CHANGER_MOI__ · sans_JWT REFUS · JWT_court_x DEMARRE · sans_DB_ni_USE_MEM_DB DEMARRE memDb=true seed=true · sans_STORAGE_DRIVER DEMARRE storage=local · TRUST_PROXY_typo tp=false
docker compose config | grep published → "80", "443" (caddy seul) ; max-size 10m ×3 ; web condition service_healthy
docker run --rm caddy:2-alpine caddy validate → Valid configuration · caddy adapt | grep -iE 'Strict-Transport|"log"' → ∅
docker run --rm --add-host api:127.0.0.1 nginx:1.27-alpine nginx -t → syntax is ok / test is successful ; sans add-host → emerg host not found "api" (attendu hors réseau compose)
nginx:1.27-alpine ls -l /var/log/nginx → access.log -> /dev/stdout (journal borné par json-file)
node v22.22.1 healthcheck cmd port fermé → rc=1 ; serveur 200 → rc=0 · image node:22-slim NV — non tirée
git -C G show HEAD:api/src/server.ts | grep → L161 garde JWT, L174 seed, L233 CSP off (= arbre)
rm -r dossier jetable → absent · git -C G status --short → ` M api/src/server.ts`, `?? api/src/bodyField.ts`, `?? api/test/hardening-t037.test.ts` — écritures T037 parallèle, 0 de T035
restauration réelle Scaleway → NV — humain (D2 pack)
## Écarts
- lecture hors WL: api/src/server.ts L155-176, L228-240, rg helmet — garde prod citée par config.ts:128
- lecture hors WL: rg api/src bootstrap/platform_admin — prérequis A8 admin sans SQL
- outil: image nginx:1.27-alpine tirée (pack : nginx:alpine) — version de web/Dockerfile:9
- DoD « git status → ∅ » non tenable : arbre déjà modifié par T037
## Pour la suite
- compose : bloc `environment:` api avec `${JWT_SECRET:?}` `${DATABASE_URL:?}` `${STORAGE_DRIVER:?}` `${S3_BUCKET:?}` `${S3_ACCESS_KEY:?}` `${S3_SECRET_KEY:?}` `${WEB_ORIGIN:?}`
- server.ts:161 : refuser jwtSecret `__CHANGER_MOI__`/< 32 car. ; refuser useMemDb ou storage local quand cookieSecure
- hypothèse NV : 1er platform_admin sans SEED_DEMO impossible sans SQL — rg bootstrap/ADMIN_EMAIL → ∅ ; is_platform_admin inséré seulement seed.ts:109
- hypothèse : api/Dockerfile sans `USER` → process root dans le conteneur
- Caddyfile : HSTS + CSP viewer enforce ; runbook : S3, ordre .env, numérotation
## Retour sur le pack
- Manquait: server.ts:155-176 (garde réelle hors config.ts) ; result.md T013 absent WL ; tag nginx exact ; état arbre G non propre (T037)
- Inutile: worker/README.md — worker absent du compose
