---
titre: geolens-web — commandes, versions et pièges d'environnement
resume: node 22, vitest api/web, build ≈ 30 s, 0 jsdom, scipy absent, docker présent, monolithes gelés
source: geolens-viewer T001-T045 · geolens-preview-3d
cree: 2026-10-07
tags: [note, geolens-web, outillage]
---

# geolens-web — outillage

## Fait
- dépôt `~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` ; git local seul (0 remote, 0 push) ; commit local par tâche (chef)
- node v22.22.1
- api : `npm --prefix api test` (vitest + pg-mem, USE_MEM_DB=1) ; base 72 fichiers / ≥ 622 tests
- api : `npm --prefix api run typecheck` (tsc -p tsconfig.test.json, noUnusedLocals)
- web : `npm --prefix web test` (vitest env node) ; 196 fichiers / 1849 tests (preview-3d T023)
- web : 0 jsdom → helpers purs seulement ; ne jamais importer `main.ts` / `POIManager.ts` ; logique viewer = module pur `core/*.ts` + test node (ex. `motionGate`, `staleQueuePurge`, `failedTileRetry`)
- web viewer : `npx tsc --noEmit -p tsconfig.viewer.json` ; `npm run typecheck` EXCLUT `src/viewer` (0 vérification) ; eslint ignore `src/viewer` (lint non probant)
- web : `npm --prefix web run typecheck` · `build:viewer-types` · `build` (tsc + vite ≈ 20-35 s)
- `node scripts/check-viewer-html-sync.mjs` — synchro viewer.html ↔ src/viewer/index.html ; meta CSP identique dans les 2
- worker : scipy absent → app.py non importable ; `python3 -m pytest -q --noconftest tests/test_secret.py`
- e2e : `node proof-*.mjs` (playwright-core) ; e2e/node_modules absent
- `_proofEnv.mjs` : DIR, ASSETS_PRESENT, minTiles, skipIfMissing ; assets 3D absents de seed-data
- docker + compose v5 : `docker compose -f <tmp>/docker-compose.scaleway.yml config --quiet` avec .env factice hors dépôt
- `docker run caddy:2-alpine caddy validate` ; nginx : `-t` avec `--add-host api:127.0.0.1`
- e2e : playwright-core 1.61.0 exige `chromium_headless_shell-1228` → `npx playwright-core install chromium` dans `e2e/`
- e2e : preview web :5180 + `BASE=http://localhost:5180` ; :5173 = Vite OrthoPro, intouchable
- e2e Admin : onglets (« Projets & accès » avant tout formulaire projet), groupes d'org repliés (`aria-expanded`), `confirmDialog` in-app → `page.on('dialog')` inopérant
- dev:api = `tsx watch` → toute édition de `api/src` redémarre l'API des preuves → séquencer lots api/ et e2e/
- pg-mem : `ON CONFLICT` non fiable ; `ROLLBACK` inopérant (db.ts:72) ; incompatible fake timers → tx/concurrence prouvées en Postgres réel seulement
- G sans identité git : `git -c user.name=Julien -c user.email=julien@seagle.io commit` ; 1 commit/tâche, 0 push
- api : 77 fichiers / 690 tests (T045) ; `api/test/helpers.ts` : makeTestApp, login, multipartBody ; accès db de test `app.db` (server.ts:177)
- sign/verify jeton tuile : `api/src/storage.ts:47-68` (≠ auth.ts)
- `rg` sans `--hidden` rate `.env*`
- monolithes gelés : `main.ts` 9405 l, `server.ts` ~3390 l → logique en module neuf + simple appel

## Pourquoi ça compte
- sans ça : tests DOM écrits en env node, worker déclaré cassé, CSP désynchronisée

## Voir aussi
- [[geolens-banc-preview-3d]]
- [[geolens-web-securite-carte]]
- [[fastify-trustproxy-5-12]]
- [[verif-conteneurs-jetables]]
