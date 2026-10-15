---
tache: T036
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 OK — viewer monté, 7 req /storage/ toutes `token=`, membre 404/refusé
- A2 OK — 0 violation CSP enforce sur 6 preuves ; portail RO simulé : 0
- A3 OK — chargement forcé : /draco/ /basis/ origine, worker blob, 0 unpkg
- A4 KO — upload plante (preuve obsolète) ; interaction 8 FAIL (scène vide)
- A5 OK — 2 rg → rc=1 (∅)
- A6 OK — aucun KO lié aux correctifs T023/T027 ; Admin.tsx inchangé depuis 745d46f
- T027 en place — main.ts:4863 `escapeHTML(String(s.unit))`, :8641 `escapeHTML(metaBits.join(' · '))`
- XSS défense : `<img onerror>` injecté dans viewer → bloqué, `__xss=0`, 1 violation script-src
## Défauts
- D1 · e2e/node_modules/playwright-core/browsers.json — attend chromium 1228, cache = 1234 → 7 preuves plantent au launch — `BASE=http://localhost:5180 node e2e/proof-viewer.mjs` → `Executable doesn't exist at …chromium_headless_shell-1228` — aligner playwright-core sur cache, ou documenter PLAYWRIGHT_BROWSERS_PATH
- D2 · e2e/proof-upload.mjs:75-76 — texte « Import d'un tileset 3D-Tiles » absent de /admin → TimeoutError, exit 1 — `node e2e/proof-upload.mjs` → `locator.fill: Timeout 30000ms … placeholder="Château de Villelaure"` — repointer la preuve sur l'onglet Admin portant « Importer le projet » (Admin.tsx:858)
- D3 · e2e/proof-viewer.mjs:71 — `!!mem` exigé ; `__glrTileMem` null sans tuile → exit 1 malgré D4 — assets absents → `FAIL géométries/textures (geom=undefined)` — conditionner `!!mem` à ASSETS_PRESENT (cause réelle T015 ≠ seuil)
## Vérifié comment
build → `✓ built in 13.32s` ; ss → api pid 2898983 :4000, preview pid 2898890 :5180 ; :5173 = 252705 intact
launch chromium : PLAYWRIGHT_BROWSERS_PATH=scratchpad/pwb (symlinks 1228→1234, Chrome 151.0.7922.34) + NODE_OPTIONS=--import csp-hook.mjs (console/request observés, 0 modif comportement)
proof-viewer → exit=1 `1 ÉCHEC(S)` (L71) ; hook `csp=0 cspRO=0 unpkg=0 draco=0 basis=0 external=0`
proof-persistence → exit=0 `TOUT VERT ✅` ; csp=0
proof-interaction → exit=1 `8 ÉCHEC(S)` : PAN, ROTATE, raycast POI, topo, mesure, vue modale, vue liste 0→0, minicarte ; `mesh détaillé chargé (0 tuiles)` ; csp=0
proof-range → exit=0 `TOUT VERT ✅` (206, Range sans token 403) ; csp=0
proof-ortho → exit=0 `TOUT VERT ✅` (ortho.tif signé 1/1) ; csp=0
proof-upload → exit=1 TimeoutError proof-upload.mjs:76 ; csp=0
proof-export → exit=0 `TOUT VERT ✅` (PNG 24 Ko, HTML 24 Ko) ; csp=0
erreurs console uniques toutes preuves : `404 (Not Found)` ; range + `403 (Forbidden)` (attendu) ; pageerror=0
probe.mjs (viewer direct, meta CSP enforce) → `DECODERS {"draco":"ok","ktx2":"ok"}` ; REQS `/draco/draco_decoder.js,/basis/basis_transcoder.js,/basis/basis_transcoder.wasm` ; `CSP 0`
curl :5180 /draco/draco_decoder.wasm 200 application/wasm · /basis/basis_transcoder.wasm 200 ; rg unpkg web/dist → 0
probe2.mjs (en-têtes Caddyfile:12,18 injectés par route.fulfill) → `ENFORCE 1` (injection volontaire) `REPORT_ONLY 0`
probe3.mjs → saved-views-add 34x34 visible, clic → PROMPT false + `forceFitToScene : no visible mesh` ; btn-minimap display:none
rg "C:/tmp" e2e/proof-*.mjs → rc=1 ; rg ">= 20" e2e/proof-interaction.mjs → rc=1
kill 8 PID lancés → ss :4000/:5180 ∅ ; git status --short → `?? api/test/zz-verif-t033.test.ts`, `?? zz-verif-t034.test.ts` (15:29/15:30, autres vérificateurs, ≠ T036)
captures /tmp/glw-proofs : proof-streamed, proof-ortho, i1-i4, export-view.png, export-report.html, probe-admin, probe2-viewer
## Écarts
- lecture hors WL: e2e/node_modules/playwright-core/browsers.json (rg) — cause échec launch
- lecture hors WL: e2e/proof-upload.mjs:55-80 — attribuer KO upload
- lecture hors WL: Caddyfile (rg CSP) — Report-Only portail absent du preview
- dépassement budget : rg web/pages/Admin.tsx, rg web/dist/assets, git log/diff 745d46f..HEAD — attribution A3/A6
- contournement chromium par symlink scratchpad au lieu de BLQ — 0 installation, 0 écriture G
- proofs d'upload/import échoués : 0 projet créé ; pg-mem en mémoire, état jeté au kill
## Pour la suite
- D1 : `PLAYWRIGHT_BROWSERS_PATH` ou playwright-core aligné ; noter révision attendue dans README preuves
- D2 : proof-upload.mjs:74-76 → naviguer onglet « Projets & accès » avant fill
- D3 : proof-viewer.mjs:71 `(!ASSETS_PRESENT || !!mem && …)`
- interaction 8 FAIL non prouvés « assets » pour vues sauvegardées/minicarte : relancer avec seed-data/storage/villelaure-real (*.b3dm) pour trancher
- e2e/diag-*.mjs gardent `C:/tmp/glw-proofs` (hors proof-*, hors A5)
## Retour sur le pack
- Manquait: révision chromium attendue par playwright-core 1.61.0 (1228 ≠ cache 1234) ; Caddyfile:7-18 (source CSP portail, absente du preview) ; proof-upload/ortho hors WL alors que lancées ; moyen de compter les violations sans éditer les preuves (hook --import)
- Inutile: viewer.html (CSP lisible dans dist/viewer.html)
