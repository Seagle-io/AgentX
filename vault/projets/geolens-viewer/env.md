---
projet: geolens-viewer
maj: 2026-10-15
tags: [env]
---

# Environnement — geolens-viewer

Conventions : [[conventions-geolens]] (non recopiées). Même dépôt G que geolens-preview-3d et geolens-charge-3d. Format : `fait — source`.

## Dépôts et branches
- G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` ; git local seul, base `745d46f` — geolens-viewer/T033
- G n'avait pas de `.git` au départ (copie zip), référence `AgentX/.cache/geolens-baseline-2026-10-07` — geolens-viewer/T002
- HEAD change à chaque lot (ex. `ad370d1`, `6e22e8c`, `120d0aa`, `80fe49a`) → `git -C G log --oneline -3` avant de coller un HEAD — geolens-viewer/T032, geolens-viewer/T062
- DoD périmètre : `git -C G diff --stat -- <E>` ; baseline sale (modifs non commitées d'un autre lot) → diff invérifiable : prévoir `sha256sum` — geolens-viewer/T021, geolens-viewer/T023
- `session.ts` non suivi par git → hors `diff --stat` — geolens-viewer/T020
- le chef commite (1 commit/tâche) ; shell humain fish → `bash -c` si syntaxe POSIX — geolens-viewer/T007

## Lancer, tester, linter
- api : `npm --prefix api test` · `npm --prefix api run typecheck` (noUnusedLocals) — geolens-viewer/T051
- web : `npm --prefix web test` · `npm --prefix web run typecheck` · `npm --prefix web run lint` — geolens-viewer/T052
- test ciblé : `npx --prefix api vitest run --root api test/<fichier>.test.ts` — geolens-viewer/T019
- suite complète sans jetables : `npm --prefix api test -- --exclude 'test/zz-verif-*'` — geolens-viewer/T033
- build web : `npm --prefix web run build` ≈ 20-35 s ; `dist/` gitignoré — geolens-viewer/T017, geolens-viewer/T026
- sync CSP : `node scripts/check-viewer-html-sync.mjs` (cwd G, sans deps) — geolens-viewer/T010
- rate-limit actif seulement avec `RATE_LIMIT=1` — geolens-viewer/T028
- `main.ts` (9404 l) jamais importé dans un test : vitest env node, 0 jsdom — geolens-viewer/T008
- e2e : `e2e/node_modules` (playwright-core 1.61.0) ; chromium_headless_shell-1228 installé par le chef — geolens-viewer/T038

## Comptes et données de test
- seed : `api/src/seed.ts:25-125` · objet `DEMO` (adminEmail, adminPassword, memberEmail, memberPassword) ; `ID` non exporté → org via `getUserByEmail(...).org_id` — geolens-viewer/T018, geolens-viewer/T020, geolens-viewer/T051
- cookie de session `glx_session` ; login `POST /api/auth/login` — geolens-viewer/T045
- cookie `Secure` sur http : `curl -c` l'ignore → `-H "Cookie: glx_session=…"` — geolens-viewer/T042
- projet seed à binaire : `villelaure-real` (≠ `villelaure`) ; le membre n'y a pas accès, ni aux projets hors 201/202 — geolens-viewer/T062, geolens-viewer/T067
- `.env` absent de G (gitignoré) → `docker compose config --quiet` échoue : `.env` factice (valeurs `x`) dans un dossier jetable — geolens-viewer/T004, geolens-viewer/T039
- accès DB en test : `app.db` (server.ts:177) ; helpers `api/test/helpers.ts` (`makeTestApp` n'existe pas) — geolens-viewer/T040, geolens-viewer/T053

## Versions
- node v22.22.1 ; fastify 5.12.5 ; nodemailer 9.1.1 ; vitest + pg-mem (`USE_MEM_DB=1`) — geolens-viewer/T029
- three 0.184.0 ; @vitejs/plugin-react 4.7.0 ; 3d-tiles-renderer 0.3.46 — geolens-viewer/T010, geolens-viewer/T022, geolens-viewer/T075
- docker 29.6.2 ; Compose v5.3.1 ; images en cache : `caddy:2-alpine`, `postgres:16-alpine`, `node:22-slim`, `bitnamilegacy/minio` — geolens-viewer/T013, geolens-viewer/T039, geolens-viewer/T068
- `minio/minio` non pullable → `bitnamilegacy/minio` — geolens-viewer/T042

## Ports, URL, fuseau
- API dev `:4000` (`npm run dev:api`, tsx watch) ; web preview/dev `:5180` — geolens-viewer/T049
- `:5173` = Vite OrthoPro (pid 252705 le 2026-10-07), `:5174`, `:5183` : intouchables — geolens-viewer/T036, geolens-viewer/T049, geolens-viewer/T075
- docker de vérif : `127.0.0.1:4100` (et `:4101`) seulement — geolens-viewer/T042, geolens-viewer/T045
- contrôle avant démarrage : `ss -ltnp | rg ':4000|:5180'` ; occupé → BLQ — geolens-viewer/T036
- H: `:4000` « node OrthoPro » — geolens-viewer/T033 (2026-10-07) ; `:4000` = API Geolens dev — geolens-viewer/T049 (le plus récent)

## Rouge d'avance
- base verte 2026-10-07 : typecheck OK · lint 0 err · api 571 tests · web 1665 tests — geolens-viewer/T002
- lint web : 1 warning préexistant `Admin.tsx:368` — geolens-viewer/T049
- vérificateur : `ROLLBACK` pg-mem inopérant (`db.ts:74-75`), `ON CONFLICT` non fiable → tx/concurrence en Postgres réel — geolens-viewer/T053

## Interdits
- `npm install` en vérification ; écriture hors fichiers jetables listés — geolens-viewer/T033
- `GEOLENS_ENV=production` hors vraie prod : ne pas poser — geolens-viewer/T069
- migrations TypeORM/Prisma/Alembic, `docker prune`, `volume rm` : refusés par `garde_bash` ; la garde refuse aussi un heredoc dont le texte les cite → Write/Edit — geolens-viewer/T006, geolens-viewer/T046
- tuer le Vite OrthoPro ou un serveur lancé par le chef — geolens-viewer/T049

## Bancs et scripts de référence
- preuves e2e lisent `process.env.BASE` : `BASE=http://localhost:5180 node e2e/proof-x.mjs` — geolens-viewer/T038
