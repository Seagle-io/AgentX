---
tache: T001
statut: fait
---
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online

## Carte
- G/web/viewer.html — entrée WEB iframe, charge src/viewer/boot-web.ts
- G/web/src/viewer/index.html — entrée DESKTOP dupliquée ~97 %, hors build web
- G/web/src/viewer/boot-web.ts:11-17 — await installHttpBackend() puis import('./main')
- G/web/src/viewer/backend/install.ts:60 — lit ?project, GET /api/projects/:id, pose glrAPI
- G/web/src/viewer/backend/install.ts:104 — window.__glrSignUrl = makeSignUrl(ctx)
- G/web/src/viewer/backend/HttpBackend.ts:47 — makeSignUrl : ?token= sur URLs storage seulement
- G/web/src/viewer/backend/HttpBackend.ts:82 — createHttpBackend, surface glrAPI (664 l)
- G/web/src/viewer/backend/HttpBackend.ts:356,586,597,612,634 — importedObjects · exportPDF/PNG · COPC · photoInspector
- G/web/src/viewer/loaders/TilesRendererLoader.ts:131-136 — signFn + preprocessURL (édition vendorée)
- G/web/src/viewer/main.ts:1299-1305 — branche contexte WEB sur __glrSignUrl
- G/web/src/pages/Project.tsx:108-110 — iframe /viewer.html?project=<id>
- G/web/src/api.ts:23 — SEUL fetch front, credentials:'include' (cookie session)
- G/web/src/auth.tsx:21 — GET /api/auth/me ; contexte session
- G/api/src/server.ts:603 — GET /api/projects/:id → tilesetUrl signée (L608-609)
- G/api/src/server.ts:725-733 — GET /api/projects/:id/storage/* ; verifyTileToken ; Range→206
- G/api/src/server.ts:1170 — GET route fichier signé (token) ; 1056/1074 sidecars GET/PUT
- G/api/src/storage.ts:47,53 — signTileToken / verifyTileToken (HMAC) ; drivers local+S3
- G/api/src/server.ts:509 — fenêtre exp quantifiée TILE_URL_WINDOW_SEC (24 h)
- G/api/src/tenancy.ts · auth.ts — isolation org · requireAuth/requireAdmin (∅ lus, non requis)
- Iframe : DOM/CSS isolé ; mode CAO plein écran piloté depuis Project.tsx:25

## Santé
- node requis : api CLAUDE.md « Node 20+ » ; `engines` ∅ (api/package.json) ; machine v22.22.1 → OK
- node_modules : ∅ (G, api, web, e2e) ; `.git` : ∅ ; `.env` : ∅ (seulement .env.example, .env.production.example)
- scripts racine : install:all · dev:api · dev:web · test(api) · typecheck · lint · check:viewer-html · build · smoke
- typecheck → `npm --prefix api run typecheck && npm --prefix web run typecheck && npm --prefix web run build:viewer-types`
- api typecheck = `tsc -p tsconfig.test.json` ; web = `tsc --noEmit -p tsconfig.json` ; viewer-types = `-p tsconfig.viewer.json`
- lint = `eslint "src/**/*.{ts,tsx}"` (web seul, api non linté)
- test api = `vitest run` (pg-mem, aucun service) ; test web = `npm --prefix web test` (≠ racine `npm test`)
- build = `tsc --noEmit && vite build` (web) + `tsc -p tsconfig.json` (api)
- check:viewer-html = `node scripts/check-viewer-html-sync.mjs` (lecture seule, zéro dépendance, lançable sans install)
- smoke = `node scripts/smoke.mjs` ; prérequis : API up sur :4000 avec USE_MEM_DB=1 (SMOKE_BASE override)
- prérequis tous : `npm run install:all` (api+web) ; e2e : `npm --prefix e2e install` + Chromium Playwright (NV navigateur présent)
- deps lourdes : three 0.184.0 épinglé, @sparkjsdev/spark 2.1.0, web-ifc, @node-rs/argon2 (binaire natif), optionalDeps @aws-sdk/*
- tests tuiles réelles : `.b3dm` gitignorés (233 Mo) → `node scripts/populate-real-tileset.mjs` (source repo desktop GeoLens_Reality, hors G)
- tailles : main.ts 9404 · workspace.ts 6199 · api/src/server.ts 3387 · web/src/viewer total 128069 l (hors monolithes ≈ 112 k)
- plus gros viewer : SceneManager.ts 1949 · shell.ts 1312 · metre.ts 1293 · render.ts 1283 (packs/risque/doc-engine)
- geoplan/*.ts total 26335 l ; web/src/viewer/ui = 25 fichiers
- violations règles repérées : process.env hors config.ts → server.ts:509 · api/test/seeds/ ∅ (règle 02-tests) · 55 RAPPORT_*.md racine (règle 9 CLAUDE.md)
- `@ts-ignore|@ts-nocheck` : ∅ (rg -c) · `: any|as any` : HttpBackend.ts 18 · reportTemplate.ts 13 · main.ts 9 · TIFFLoader.ts 9 · CogLoader.ts 5
- doublon : 1_SAUVEGARDE_GIT_INIT.bat / 2_PUSH_GITHUB.bat racine (Windows, hors dev)

## Parité
- PORTAGE_WEB.md:146 — COPC/LAS stubbé — HttpBackend.ts:612-622 (lecture header+Range portée depuis, cf. PROGRESS) ; DOC OBSOLÈTE
- PORTAGE_WEB.md:148 — TIFF/COG « non câblés » — OBSOLÈTE : proof-ortho vert (PROGRESS cycle 11) ; loaders/TIFFLoader.ts, services/cog/CogLoader.ts
- PORTAGE_WEB.md:149 — Gaussian Splat no-op — OBSOLÈTE partiel : manifest+tuile signés (cycle 16) ; loaders/lcc2/*, services/gaussianSplat/
- PORTAGE_WEB.md:151 — Photo Inspector absent — OBSOLÈTE : porté cycle 14 ; HttpBackend.ts:634-637, services/photoInspector/
- PORTAGE_WEB.md:152 — exports stubbés — OBSOLÈTE : HttpBackend.ts:586,597 (download navigateur)
- PORTAGE_WEB.md:116 — inspectionTours sidecar non câblé — HttpBackend.ts : ∅ loadInspectionTours/saveInspectionTours ; ui/inspectionTours.ts:59 (NV : dégrade ?)
- PORTAGE_WEB.md:111 — importedObjects binaires différés — HttpBackend.ts:389 writeBinary / 406 deleteBinary (état NV)
- PROGRESS.md:~640 « Reste hors parité » — rendu Spark 14,3 M gaussiennes crash SwiftShader — à valider GPU réel ; loaders/lcc2/Lcc2Loader.ts
- PROGRESS.md:~640 — COPC natif end-to-end non démontré (pas de .copc.laz local) — HttpBackend.ts:612 · backend/copcHeader.ts · e2e/proof-range.mjs
- PROGRESS.md:~640 — export rapport = HTML imprimable, pas PDF serveur — HttpBackend.ts:586 · web/src/viewer/report/
- PROGRESS.md:~640 — reprojection photo-inspector sur poses illustratives — scripts/generate-photo-sample.py · services/photoInspector/
- PORTAGE_WEB.md:127-129 — verifyIntegrity/EULA/crash reporter stubs — HttpBackend.ts:557 (voulu : serveur garantit)
- PORTAGE_WEB.md:5-9 — « renderer vendoré » ≠ divergence tracée desktop (copie ; sync homeScan3d.ts identique à la main)
- PROGRESS.md:1-80 — journal en 1re position = MARATHON 5 ; cycles 7-17 plus bas ; score ≈ 9,4/10 (auto-éval, NV)
- piège : PORTAGE_WEB.md décrit l'état cycle 0 ; PROGRESS.md = vérité ; ne pas se fier au §5 de PORTAGE_WEB

## Tests
- api : 64 fichiers `api/test/*.test.ts` (vitest+pg-mem, helpers.ts) ; `api/test/seeds/` ∅ malgré règle
- web : 172 fichiers `*.test.ts*` sous web/src (dominants : packs/risque/core/__tests__ 56, geoplan 35, packs/shared 24, doc-engine/__tests__ 24)
- backend viewer : 3 tests (web/src/viewer/backend/__tests__ : copcHeader, copcHttpBackend, multiPackCopc)
- main.ts / workspace.ts / SceneManager : tests unitaires ∅ (rg find) ; couverts par proofs seulement
- Playwright : e2e/playwright.config.ts (testDir '.', workers 1, baseURL :5173, SwiftShader) ; `*.spec.ts` dans e2e : ∅ (ls)
- proofs : 52 fichiers `e2e/proof-*.mjs` (≈ 22 geoplan) + 7 `diag-*.mjs` + hammer-s3.mjs ; scripts node + playwright-core, PAS runner Playwright
- lancement proofs : `cd e2e && node proof-<x>.mjs` ; prérequis : API :4000 (USE_MEM_DB=1 STORAGE_DRIVER=local, JWT_SECRET) + `vite preview` :5173 sur build web
- `npm run proofs` (e2e/package.json) enchaîne 13 preuves seulement (viewer…cloudpkg) ; README annonce « 12 » → écart
- captures écrites en `C:/tmp/glw-proofs/` (chemin Windows en dur) → échoue/dérive sous Linux (NV)
- seed demo : admin@demo.geolens.fr / demo1234 (seed.ts, dev local seulement)
- proofs geoplan requièrent worker Python (hors périmètre)

## Règles
- Aucun fichier neuf > 400 l, fonction > 60 l ; ne pas grossir main.ts / workspace.ts / server.ts (extraire seulement)
- schema.ts gelé ; migrations via ORM uniquement ; process.env seulement dans config.ts
- Pas de `any`, `@ts-ignore`, console.log, catch vide, désactivation lint, dépendance ajoutée sans demande
- Routes : requireAuth + tenancy + schéma d'entrée + test nominal/401/autre-org ; seeds dans api/test/seeds/
- Code anglais ; commentaires/commits/UI français ; sans emoji ; pas de .md racine (docs/)
- Avant livraison : `npm run typecheck && npm run lint && npm test` + coller sortie réelle
- Git : agent ne commit/push/merge/rebase jamais ; branche feat/<sujet> après fetch+pull --ff-only ; merge --ff-only
- Three.js : disposer les objets, aucune allocation en boucle de rendu ; 1 tâche/session, pas de refonte multi-fichiers
- Tests front : logique en .ts via Vitest ; composants en e2e uniquement

## Lots candidats
- L1 Doc : réaligner PORTAGE_WEB.md §5/§3 sur PROGRESS ; README « 12 preuves » → liste réelle — PORTAGE_WEB.md, README.md — B
- L2 Chemin captures proofs : remplacer C:/tmp/glw-proofs par dossier configurable — e2e/proof-viewer.mjs, proof-interaction.mjs, proof-package.mjs (rg `glw-proofs` à étendre) — B
- L3 Inspection tours sidecar : câbler load/saveInspectionTours via sidecar API existant — web/src/viewer/backend/HttpBackend.ts, ui/inspectionTours.ts, test backend__tests__ — M
- L4 Hygiène : retirer `any` de HttpBackend.ts (18) + process.env server.ts:509 → config.ts — backend/HttpBackend.ts, api/src/config.ts, server.ts(extraction seule) — M
- L5 Seeds tests : créer api/test/seeds/ (orgs, users, projects) puis migrer 1-2 tests — api/test/helpers.ts, api/test/seeds/*.ts, api/test/isolation.test.ts — M
- L6 Sync entrées HTML : exécuter check:viewer-html, résorber divergences viewer.html↔index.html — web/viewer.html, web/src/viewer/index.html, scripts/check-viewer-html-sync.mjs — M
- Disjoints : L1{PORTAGE_WEB,README} L2{e2e/proof-*} L3{HttpBackend,inspectionTours} ≠ L4{HttpBackend} → L3/L4 CONFLIT HttpBackend.ts : séquencer ou fusionner

## Vérifié comment
- `node -v` → v22.22.1
- `ls -d node_modules */node_modules .git` → « Aucun fichier ou répertoire » ×3
- `wc -l main.ts workspace.ts server.ts` → 9404 / 6199 / 3387
- `find web/src/viewer -name '*.ts' | xargs wc -l | sort -n | tail` → 128069 total ; max hors monolithes SceneManager 1949
- `find api -name '*.test.ts'|wc -l` → 64 ; `find web/src -name '*.test.ts*'|wc -l` → 172 ; `ls e2e/proof-*.mjs|wc -l` → 52
- `rg -n process.env api/src/server.ts` → 509: `Number(process.env.TILE_URL_WINDOW_SEC ?? 86400)`
- `ls api/test/seeds` → ∅ ; `ls RAPPORT_*.md|wc -l` → 55 (lu 55 via ls, `wc` donne 55 fichiers)
- `rg -c "@ts-ignore|@ts-nocheck" web/src api/src` → ∅ (aucune ligne)
- NV : typecheck, lint, vitest, smoke, proofs non lancés (consigne : rien exécuter npm)
- NV : numéros de ligne PROGRESS « ~640 » approximatifs (lu L560-675, section « Reste hors parité » vers fin de plage)

## Écarts
- lecture hors WL : G/api/src/server.ts, G/web/src/pages/Project.tsx, G/web/src/viewer/backend/*.ts, G/scripts/check-viewer-html-sync.mjs, smoke.mjs, e2e/package.json, e2e/*.mjs (ls) — rg/head/sed ciblés autorisés par le Budget (rg/wc/ls/find libres sur G/web/src, api/src, e2e, scripts) ; 0 lecture intégrale
- lecture hors WL : G/CLAUDE.md lu en entier, ARCHITECTURE hors — whitelist OK ; e2e/package.json hors WL stricte (1 lecture, pour scripts proofs)
- PROGRESS.md : plage L560-675 ne contient pas « Reste hors parité » à ligne précise ; coordonnées `~640` NV

## Pour la suite
- Racine G sans node_modules/.git : tout run (typecheck/lint/vitest/proofs) exige `npm run install:all` + `npm --prefix e2e install` (décision humaine) ; seul `node scripts/check-viewer-html-sync.mjs` est lançable à nu.
- Contrat viewer : window.glrAPI = HttpBackend (backend/HttpBackend.ts:82), signé via window.__glrSignUrl (install.ts:104) ; storage route server.ts:725 ; iframe Project.tsx:108 ; ne jamais réécrire data:/blob:.
- Règles dures : monolithes main.ts/workspace.ts/server.ts n'augmentent pas ; pas de `any`/`@ts-ignore` ; fichier neuf ≤ 400 l ; agent ne commit/push pas ; process.env seulement config.ts ; route neuve = test 401 + autre-org.
- Parité : PORTAGE_WEB.md §5 est obsolète (COG/PNTS/photo/export portés) ; reste réel = inspectionTours sidecar, rendu Spark GPU réel, COPC natif, PDF serveur, binaires importedObjects (NV) ; vérité = PROGRESS.md.
- Lots L3 et L4 touchent HttpBackend.ts : séquencer ; proofs écrivent en C:/tmp/glw-proofs (Windows) ; wl ≤ 12 respectée par lot.

## Retour sur le pack
- Manquait: ∅ lecture api/test seeds/package engines (tranché par rg) ; numéro de ligne de « Reste hors parité » ; e2e/package.json absent de WL | Inutile: playwright.config.ts (peu informatif, proofs ≠ playwright test)
