---
projet: geolens-charge-3d
maj: 2026-10-15
tags: [env]
---

# Environnement — geolens-charge-3d

Conventions : [[conventions-geolens]], [[geolens-serveur-test]], [[geolens-route-tuile-charge]] (non recopiées). Format : `fait — source`.

## Dépôts et branches
- G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` ; git local, branche `master` — geolens-charge-3d/T032
- HEAD varie par tâche (`da5fced` T001 … `03a7bcb` T026 … `17d1f85` T032) → `git -C G log --oneline -1` — geolens-charge-3d/T001, geolens-charge-3d/T031
- arbre G sale hors `api/` et `tools/load` : `web/…`, `RAPPORT_*`, et mission C3/D24 non commitée (`TilesRendererLoader.ts`, `qualityHud.ts`, `errorTargetRefine*.ts`) → ne jamais modifier/annuler — geolens-charge-3d/T026, geolens-charge-3d/T031
- DoD périmètre : `git -C G status --short -- api/ .env.production.example` (ou `-- tools/load`) — geolens-charge-3d/T007, geolens-charge-3d/T005
- worktree de vérif : `AgentX/.cache/wt-charge3d-T<NNN>` (W) ; un vérificateur y travaille → ne pas y toucher ; tests dans W : `npx vitest run <fichier>` depuis `W/api` ou `W/web` — geolens-charge-3d/T007, geolens-charge-3d/T017
- serveur `~/geolens-web` (S) = copie sans git (22/09), plus ancienne que G — geolens-charge-3d/T003, geolens-charge-3d/T014

## Lancer, tester, linter
- api : `npm --prefix api test` · `npm --prefix api run typecheck` (tsc -p tsconfig.test.json, noUnusedLocals) — geolens-charge-3d/T006
- web : `npm --prefix web test` (vitest env node) · `npm --prefix web run typecheck` · `build:viewer-types` (tsconfig.viewer.json) — geolens-charge-3d/T027
- `node scripts/check-viewer-html-sync.mjs` : CSP identique `viewer.html` ↔ `src/viewer/index.html` — geolens-charge-3d/T004
- fake timers incompatibles avec la db pg-mem → seulement sur Fastify nu ; sinon horloge injectée (`now`) — geolens-charge-3d/T006, geolens-charge-3d/T017
- tests HTTP réels : `app.listen({ port: 0 })` + `http.get` + `req.destroy()` ; Fastify : abort client → `onResponse` jamais émis — geolens-charge-3d/T010
- boot en test : `buildServer({ config, logger: true, logStream })` (server.ts:90-100) ; modèle `api/test/tile-route-logs.test.ts:31-40` — geolens-charge-3d/T012
- web : globals simulés via `vi.stubGlobal` (caches, window, localStorage, isSecureContext, fetch) — modèle `tileCache.test.ts` — geolens-charge-3d/T028
- k6 : image Docker `grafana/k6:0.54.0` (pas de binaire), goja ES2015+, pas de `URL` global ; `--user $(id -u)` — geolens-charge-3d/T015, geolens-charge-3d/T019
- `make -n` n'exécute pas `check` — geolens-charge-3d/T019

## Comptes et données de test
- comptes DEMO (admin/member/rival) : `api/src/seed.ts` · DEMO — geolens-charge-3d/T028
- `.env` serveur : valeurs secrètes jamais copiées en S ; `.env.k6` hors dépôt, `.gitignore` de G à vérifier — geolens-charge-3d/T013, geolens-charge-3d/T015
- SSH : hôte déjà dans `known_hosts` ; 1 seule tentative `-o BatchMode=yes -o ConnectTimeout=15` (connexions rapprochées → port coupé) — geolens-charge-3d/T003
- mots de passe SSH : fournis par l'humain, jamais dans le vault — conventions-geolens:L51

## Versions
- node v22.22.1 ; fastify 5.12.5 ; vitest 2.1.8 ; @aws-sdk/client-s3 + s3-request-presigner (import dynamique `storage.ts:576,584`) — geolens-charge-3d/T007
- 3d-tiles-renderer 0.3.46 (fetch natif, `registerPlugin`, le 1er plugin avec `fetchData` gagne) ; three r184 — geolens-charge-3d/T024, geolens-charge-3d/T026
- serveur : Postgres 16, MinIO, node 22 ; version PG exacte NV — geolens-charge-3d/T013, geolens-charge-3d/T019
- Node 22 : `ReadableStream`, `Response.body.getReader()` natifs — geolens-charge-3d/T029

## Ports, URL, fuseau
- API de test S : `http://82.65.97.67:34580` (front servi par nginx) — geolens-charge-3d/T014
- bancs locaux : API `:4010`, web `:5180` ; occupés/intouchables : `:4000`, `:5173` (OrthoPro) — geolens-charge-3d/T034
- bancs parallèles : `:4012`/`:5182`, `:4013`/`:5183` — geolens-charge-3d/T035
- machine locale chargée (load avg 24-28) : médiane de séries, relever `uptime` avant/après ; instabilité 3/9 runs à 50 ms — geolens-charge-3d/T011, geolens-charge-3d/T020

## Rouge d'avance
- bases api : 98 fichiers / 854 tests (T007) → 101 / 990 (T025) — geolens-charge-3d/T025
- lint global : 1 warning préexistant `Admin.tsx` — geolens-charge-3d/T032
- pg-mem : `ON CONFLICT` / `ROLLBACK` non fiables — geolens-charge-3d/T002

## Interdits
- BDD du serveur de test : 0 DELETE/UPDATE/DROP/TRUNCATE, 0 migration, 0 seed, 0 `down -v` ; `migrate()` au boot de l'API → déploiement API = analyse base avant — conventions-geolens:L87
- toucher `web/` sale d'un autre lot quand la tâche vise `api/` — geolens-charge-3d/T006
- `fish` : rediriger les process d'arrière-plan vers un fichier dans `$TMP` — geolens-charge-3d/T034

## Bancs et scripts de référence
- k6 : `S/viewer-navigation.js`, `tools/load/` ; `docker run … grafana/k6:0.54.0 inspect` OK (jslib k6-summary téléchargé : réseau requis) — geolens-charge-3d/T005
- scratchpad éphémère → recopier les scripts utiles dans `G/e2e/` ou `G/tools/load/` — [[geolens-banc-preview-3d]]
