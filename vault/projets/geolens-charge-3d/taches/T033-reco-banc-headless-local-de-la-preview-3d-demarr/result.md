---
tache: T033
statut: fait
---
## Démarrage local
G = Geolens/geolens-web-feat-viewer-online
- API · env (config.ts) : `PORT`:231 déf 4000 · `USE_MEM_DB`:227 (déf true si pas DATABASE_URL) · `STORAGE_DRIVER`:237 déf local · `STORAGE_LOCAL_ROOT`:238 déf `../seed-data/storage` (relatif cwd api/) · `SEED_DEMO`:247 déf = useMemDb · `RATE_LIMIT`:242 déf off en memdb · `WEB_ORIGIN`:234 déf http://localhost:5173 · `TILE_PRESIGN_REDIRECT`:251 déf off · `JWT_SECRET`:233 déf dev OK hors prod
- API · commande : `cd G/api && PORT=4010 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=<TMP>/storage WEB_ORIGIN=http://localhost:5180 SEED_DEMO=1 npx tsx src/index.ts` — `npx tsx` (api/node_modules/.bin/tsx ∃) ≠ `npm run dev` (api/package.json:8 `tsx watch` → redémarre sur édition api/src)
- web · build requis : G/web/dist/viewer.html daté 2026-10-08 22:15 ; 5+ fichiers web/src plus récents (viewer/backend/tileCache.ts, ui/qualityHud.ts…) + TilesRendererLoader.ts modifié non commité ⇒ dist PÉRIMÉ. `cd G/web && npm run build` (package.json:9 `tsc --noEmit && vite build`, entrées index.html + viewer.html, vite.config.ts:40-41)
- web · serveur : `cd G/web && VITE_API_TARGET=http://localhost:4010 npx vite preview --port 5180 --host` — vite.config.ts:70-78 `preview.proxy /api → process.env.VITE_API_TARGET || :4000` ; scripts package.json:8 dev=`vite` (port 5173:55, proxy:57-62), :11 preview=`--port 5173` (override CLI --port OK). `preview` sert dist/ (viewer.html inclus) ; dev idem mais HMR inutile
- ports : 4000 + 5173 LISTEN (ss -ltn) ; 4010 / 5180 libres → proposés
- comptes démo (seed.ts:25-31) : admin@demo.geolens.fr / demo1234 · org_admin + is_platform_admin (seed.ts:108-111) · membre@demo.geolens.fr / demo1234 · member (accès arcelor+briancon seulement :126-127) · rival@georival.fr / rival1234 · org_admin org rivale

## Projet et tileset de mesure
- projets semés (seed.ts:122-127, ids stables seed.ts:12-14 `0a1b2c3d-0000-4000-8000-00000000020{1,2,3}`) : arcelor prefix `arcelormittal` · briancon `briancon` · villelaure `villelaure-real` (id …203, nom « Vieux Château de Villelaure ») · rivalProj prefix `secret` ; tous `tileset_path='tileset.json'` ; admin voit tout son org implicitement
- racine configurable : OUI `STORAGE_LOCAL_ROOT` (config.ts:238 → storage.ts:216 `path.resolve(config.storageLocalRoot)`) ⇒ pointer vers `<TMP>/storage`, y écrire `villelaure-real/tileset.json` (+ tuiles) ; `seed-data/` jamais lu ni écrit. Aucun besoin de route de création de projet : le seed pointe sur le prefix, le tileset synthétique remplace villelaure-real côté TMP
- prefixes non peuplés dans TMP (arcelormittal, briancon, secret) → tuile 404 loggé (server.ts:808-812), sans effet ; ne pas les ouvrir
- `project.json` : OPTIONNEL côté API (server.ts:176-200 lecture best-effort, try/catch → meta vide) ; viewer lit `res.manifest` seulement pour fusion ≥2 projets (main.ts:2143). Écrire un `project.json` minimal `{"version":"1.1","project":{"name":"synthetique"}}` par prudence (NV : sans, non testé)
- route tuile : GET `/api/projects/:id/storage/*?token=` (server.ts:739-741) · jeton `?token=` signé (signTileToken, verifyTileToken:749) · `tilesetUrl` = `/api/projects/${id}/storage/${tileset_path}?token=…` (server.ts:618-619, renvoyée par GET /api/projects/:id)
- en-têtes : `Cache-Control: private, max-age=86400, immutable` (IMMUTABLE_CACHE server.ts:523) + `ETag` (storageEtag) ; 304 si If-None-Match (:762) ; `project.json` = `private, no-store` ; `Accept-Ranges: bytes` ; Range → 206
- 302 presign : `shouldRedirectTile` exige `config.tilePresign.enabled` (déf false) ET `app.storage.presignGet` (driver local lève/absent) ⇒ INACTIF en local, pas de 302
- ⚠ cache navigateur : tuiles `immutable` 24 h ⇒ 2e run dans même profil = 0 requête réseau. Banc : `browser.newContext()` neuf par run (cache mémoire isolé, comme e2e actuels)
- ⚠ rate-limit tuile 5000/min (config.ts:243) off en memdb (:242)
- formats chargés (TilesRendererLoader.ts) : 3d-tiles-renderer 0.3.46 (web/node_modules) ; `TilesRenderer.js:607 b3dm · :620 pnts · :630 i3dm · :644 cmpt · :661-662 gltf/glb (3DTILES_content_gltf)` ⇒ **glb natif, pas de b3dm nécessaire**. DRACO (`setDecoderPath('/draco/')` :173-176, type js) + KTX2 (`/basis/` :183) câblés sur `GLTFLoader` enregistré `/\.gltf$/` (:189-194) ; dist/draco + dist/basis ∃. Un glb non compressé (positions+indices) passe sans Draco/KTX2
- tileset.json exigences : `asset.gltfUpAxis` lu par TilesRenderer.js:373 (déf 'y' ; seed utilise "Z") · `asset.geolens_srs`/`geolens_srs_origin{x,y,z}` optionnels (Loader:376-387) · listener `load-tile-set` utilise `root.boundingVolume.box|region|sphere` (:370-374,:419) pour caméra ; heuristique ECEF (:441-470) : |center|>1 000 000 m ⇒ ECEF + alignement ENU ; sinon « local Y-up, aucune rotation » (:500-505) ⇒ **synthétique = box proche de l'origine (|c|<1e6), pas de `transform`** → caméra warpée par main.ts sur `glr:tileset-root-bounds`
- exigences LOD pour mesurer : `geometricError` décroissant parent→enfant ; `refine:"REPLACE"` (seed) ; box enfants ⊂ box parent ; arbre profond (≥3 niveaux, 4-8 enfants/niveau) sinon peu de requêtes ; tuiles feuilles `content.uri` vers .glb (ou sous-tileset.json comme villelaure : `children[].content.uri="Block…/tileset.json"`)
- `errorTarget` par preset puis affinage à l'arrêt (errorTargetRefine ; Loader:280-283, 715-727) ; gel DL pendant mouvement : `downloadQueue.maxJobs=0` (motionGate.ts `downloadJobs`, MOTION_STILL_MS=500 reprise après 500 ms d'immobilité continue ; Loader:627-631)

## Navigateur et mesures
- Playwright : e2e/node_modules/playwright-core 1.61.0 + playwright 1.61.0 ; e2e/package.json devDep `@playwright/test ^1.49.1` (dep réelle des proofs = `playwright-core`, non déclarée dans package.json — ∃ en node_modules seul) ; yazl dep
- chromium : ~/.cache/ms-playwright/chromium_headless_shell-1228 ∃ (+1234, chromium-1228/1234) ⇒ install non nécessaire (ls → DEPENDENCIES_VALIDATED, INSTALLATION_COMPLETE, chrome-headless-shell-linux64)
- lancement (proof-refine.mjs:50 · diag-stream.mjs:56) : `chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox']})` ; viewport 1920x1200 ; `--enable-precise-memory-info` ∅ dans e2e (rg) → à ajouter si mesure heap
- login : `goto BASE/login` · `#email` · `#pw` · bouton `getByRole('button',{name:/se connecter/i})` · attendre `.gl-project` (20 s)
- projet : `page.evaluate(fetch('/api/projects'))` → `.projects.find(p=>/villelaure/i.test(p.name))` (garder le nom « Villelaure » ou chercher par id …203) · `goto BASE/projects/${id}` · `page.locator('iframe').waitFor` · frame = `page.frames().find(f=>f.url().includes('viewer.html'))`
- entrée 3D : `frame.getByRole('button',{name:/explorer en 3d/i}).click()` (≠ lien carte MapView.tsx:82 « Explorer en 3D » = `<a href="/projects/:id">`)
- comptage tuiles : `ctx.on('response')`/`page.on('request')` filtre `url.includes('/storage/')` (diag-stream.mjs:70-77) ; ajouter filtre `\.glb|\.b3dm|tileset\.json` ; horodater chaque requête (Date.now()) pour séparer mouvement / arrêt
- hooks fenêtre (dans l'iframe → `frame.evaluate`) : `window.__glrTiles` = TilesRenderer (Loader:358 ; `.errorTarget`, `.lruCache.cachedBytes`, `.downloadQueue.maxJobs`, `.traverse(cb)`, tile.__loadingState/__visible/__inFrustum/__depth) · `window.__glrTileMem` (Loader:703, `{...sample,tick}`) · `window.__tileCount` (via addInitScript + event `glr:tile-loaded`) · `window.__glrTest.{camPos(),camTarget(),camLen(),loadedCount(),projectName()}` (main.ts:2916-2924, LECTURE SEULE) · `window.__glrDiag()` (main.ts:2988, draw calls/triangles/heap) · `__glrEnterMs`, `__glrFitState`
- pilotage caméra par API : ∅ — `sceneManager.controls` (camera-controls, SceneManager.ts:35) NON exposé sur window ; `__glrTest` ne fait que lire. ⇒ **souris simulée** : `box = await frame.locator('canvas').first().boundingBox()` (coords page, iframe incluse) puis `page.mouse.move/down/move(steps)/up` pour orbiter (bouton gauche = rotation camera-controls) ; roue `page.mouse.wheel` = dolly. Vérifier le mouvement via `camPos()` avant/après (diff > 0)
- ⚠ proof-refine.mjs affirme « 0 interaction » : le banc doit en avoir ; ne pas réutiliser l'assertion `interactions===1`
- captures : `page.screenshot({path})` (DIR = `$OUT` ou `<tmp>/glw-proofs`, _proofEnv.mjs:11) — la page entière inclut l'iframe ; rendu SwiftShader lent (45 s de stabilisation typiques proof-refine.mjs:81)
- libs PNG/GLB : node v22.22.1 `zlib.crc32` + `zlib.deflateSync` → function/function (node -e) ⇒ PNG sans dépendance OK. pngjs ∅ · gltf-transform ∅ · three ∃ web/node_modules/three (0.184.0) mais exporters via import ESM web/ (hors e2e). GLB = écriture binaire manuelle (12 o header + chunk JSON + chunk BIN, ~40 lignes) : pas de dépendance
- seuil assoupli `_proofEnv.minTiles` : `ASSETS_PRESENT` regarde seed-data/…/villelaure-real (∅ b3dm) ⇒ proofs existants se SKIPpent/assouplissent (décision D4) ; banc ne l'utilise pas

## Contrat proposé du banc
```
fichiers (sous G/e2e/, nouveaux, rien dans seed-data/) :
  bench-tileset.mjs  gen tileset synthétique → $STORE/villelaure-real/{tileset.json,project.json,t/*.glb}
  bench-3d.mjs       scénario playwright-core ; export JSON + PNG dans $OUT
env : STORE=<TMP>/storage  OUT=<TMP>/out  API_PORT=4010  WEB_PORT=5180
démarrage (3 terminaux ou background) :
  node e2e/bench-tileset.mjs                       # STORE
  cd api && PORT=4010 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5180 SEED_DEMO=1 npx tsx src/index.ts
  cd web && npm run build && VITE_API_TARGET=http://localhost:4010 npx vite preview --port 5180 --host
  BASE=http://localhost:5180 node e2e/bench-3d.mjs
tileset : quadtree 4 niveaux (1+4+16+64=85 .glb), box locale |c|<1e5 (pas ECEF), asset.gltfUpAxis "Y",
  geometricError 64→16→4→1→0 (feuilles), refine REPLACE, glb = grille ~2k tri/tuile + couleur unie
  (≥ 85 tuiles, étendue ~200 m ⇒ plusieurs niveaux visibles à l'écran 1920x1200)
scénario : contexte neuf (cache vierge) → login admin → projet villelaure → clic « Explorer en 3D »
  1 attendre stable : __tileCount inchangé 4 relevés × 1,5 s (max 60 s) ; capture AVANT (png)
  2 orbiter : N=6 s, drag souris canvas (±300 px, steps 30, boucle) ; vérifier camPos() ≠ initial
  3 arrêt : mouse.up ; T0=now ; attendre 5 s ; relevés 250 ms
  4 capture APRÈS (png) à T0+5 s
mesures (JSON) : reqMouvement = requêtes /storage/ .glb|.json datées ∈ [début drag, fin drag]
  · reqArret = requêtes ∈ [fin drag, +5 s] · délaiReprise = 1re requête après fin drag − fin drag (attendu ≥ 500 ms)
  · loaded/inFrustum/visible/maxDepth (__glrTiles.traverse) avant, fin mouvement, fin arrêt
  · downloadQueue.maxJobs échantillonné pendant drag (attendu 0) · camPos avant/après · status (200/304/404/5xx)
  · pageerror + console FAILED/error
assertions : fin arrêt loaded > fin mouvement · reqMouvement ≈ 0 (gel D24) · reqArret > 0 · aucun 404/5xx
```

## Vérifié comment
- `ss -ltn | rg ":(4000|5173|5180|4010|4011)\b"` → LISTEN 0.0.0.0:4000 · LISTEN *:5173 (5180/4010/4011 absents)
- `node -e "const z=require('zlib');console.log(typeof z.crc32, typeof z.deflateSync)"` → function function
- `rg '"version"' e2e/node_modules/playwright-core/package.json` → 1.61.0 ; `ls ~/.cache/ms-playwright` → chromium-1228 chromium-1234 chromium_headless_shell-1228 chromium_headless_shell-1234 ffmpeg-1011
- `stat web/dist/viewer.html` → 2026-10-08 22:15:51 ; `find web/src -newer web/dist/viewer.html -name '*.ts'` → api.ts idleLogout.ts viewer/backend/tileCache.ts install.ts ui/qualityHud.ts
- `ls api/node_modules/.bin/tsx` → ∃
- NV : 0 lancement (hors périmètre) — commandes, glb natif et orbite souris non exécutés

## Écarts
- lecture hors WL: G/web/src/viewer/main.ts (rg/sed ciblés 2905-2990) — hooks `__glrTest`/`__glrDiag`, caméra
- lecture hors WL: G/web/node_modules/3d-tiles-renderer/src/three/TilesRenderer.js (rg) — support glb/b3dm/pnts, gltfUpAxis
- lecture hors WL: G/web/src/viewer/core/motionGate.ts (sed 1-60) — gel D24, MOTION_STILL_MS
- rg hors WL: G/web/src (noms __glr*, boutons), G/web/dist, G/web/node_modules listing — localisation

## Pour la suite
- Pack implémenteur banc : API `PORT=4010 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=<TMP>/storage WEB_ORIGIN=http://localhost:5180 npx tsx src/index.ts` (pas `npm run dev` : tsx watch) ; web = `npm run build` OBLIGATOIRE (dist périmé 08/10) puis `VITE_API_TARGET=http://localhost:4010 npx vite preview --port 5180 --host`.
- Tileset synthétique écrit sous `<TMP>/storage/villelaure-real/` (prefix semé, projet id 0a1b2c3d-0000-4000-8000-000000000203, admin@demo.geolens.fr/demo1234) : tileset.json + .glb natifs (pas de b3dm), box locale |c|<1e6 (sinon branche ECEF), gltfUpAxis Y, quadtree ≥85 tuiles, geometricError décroissant ; glb écrit à la main (zlib non requis pour glb ; PNG = zlib.deflateSync+crc32).
- Mesures : `__glrTiles`/`__glrTileMem`/`__tileCount` via frame viewer.html ; caméra = souris simulée sur `canvas` de l'iframe (controls non exposés ; `__glrTest.camPos()` lecture seule) ; contexte neuf par run (tuiles immutable 24 h) ; gel DL attendu pendant mouvement, reprise ≥500 ms après arrêt.
- WL banc ≤ 4 fichiers neufs sous G/e2e/ (bench-tileset.mjs, bench-3d.mjs, README optionnel) ; chromium_headless_shell-1228 déjà installé ; ne pas toucher 4000/5173 (OrthoPro).

## Retour sur le pack
- Manquait: main.ts (hooks __glrTest, caméra) et TilesRenderer.js (formats) en lecture ciblée ; motionGate.ts
- Inutile: docker-compose.yml, e2e/package.json (playwright-core non déclaré, peu utile)
