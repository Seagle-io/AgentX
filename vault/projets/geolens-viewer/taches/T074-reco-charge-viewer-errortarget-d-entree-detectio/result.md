---
tache: T074
statut: fait
---
G = Geolens/geolens-web-feat-viewer-online · V = G/web/src/viewer · L = V/loaders/TilesRendererLoader.ts
## C2 — LRU et octets
- L:225 — `maxBytes = cacheBudgetBytes(preset)` ; min(preset.cacheBudgetGiB, plafond tier GPU) ; QualityPresets.ts:110-122
- tier cap GiB : integrated 1.0 · discrete 2.5 · inconnu 1.25 ; plancher 0.25 GiB
- cacheBudgetGiB par preset : econome 0.75 · standard 1.25 · haute 1.75 · maximale 2.5 (QualityPresets.ts:56-89)
- maxBytesSizeGiB par preset : 1 / 4 / 8 / 16 — affichage UI seulement (qualityHud.ts:188, splash.ts:183) ; NON appliqué au LRU
- L:226-230 — min(maxBytes, cacheBudgetBytesOverride) (fusion) ; L:235-240 — min(maxBytes, localStorage `glr.tileCacheMB`×MiB)
- L:242 — `minBytes = floor(maxBytes*0.85)`
- L:305-310 — `itemCapByPreset` = {econome:1200, standard:2000, haute:3000, maximale:4000} ; défaut 2000 (L:311)
- L:313-318 — `lruCache.maxSize=itemCap` · `minSize=floor(itemCap*0.9)` · `maxBytesSize=maxBytes` · `minBytesSize=minBytes`
- → 1 seul endroit à éditer pour relever le cap : L:305-310 (valeurs mission 4000/8000/12000/16000, minSize 0.9× déjà en L:315)
- commentaire L:299-304 obsolète après relèvement (« ancien cap 20000 ne se déclenchait jamais ») : à réécrire
- standard 2000 items < 4558 tuiles modèle test → thrash (cohérent mission)
- éviction lib : node_modules/3d-tiles-renderer/src/utilities/LRUCache.js:67-69 `isFull() = itemSet.size>=maxSize || cachedBytes>=maxBytesSize` ; :240-360 `unloadUnusedContent` retire tant que items>minSize ou bytes>minBytes (ET-OU : les deux plafonds actifs, le premier atteint déclenche)
- défauts lib LRUCache.js:38-42 : min/maxSize 6000/8000 · min/maxBytes 0.3/0.4 GiB · unloadPercent 0.05
- → éviction par octets effective SEULEMENT si bytes atteint avant items : standard 1.25 GiB vs 2000 items = ~640 Ko/tuile moyen ; en dessous → l'item-cap gagne (thrash)
- 3d-tiles-renderer : package.json:18 `^0.3.46`-range `^0.3.45` ; installé 0.3.46 (node_modules/3d-tiles-renderer/package.json)
- PIÈGE typage : LRUCache.d.ts (src/utilities/LRUCache.d.ts) déclare SEULEMENT `maxSize, minSize, unloadPercent, unloadPriorityCallback` ; PAS maxBytesSize/minBytesSize/cachedBytes/itemSet (existent dans le .js:40-54) → le loader les écrit malgré tout (L:315-318, L:640 `typeof lru.maxBytesSize`) ; TilesRendererBase.d.ts:17 `lruCache : LRUCache`
- watchdog VRAM L:~636-648 : si geometries>hardGpuCeil ou textures>hardGpuCeil (L:~616 `min(4500, vramTextureBudget)`) → maxBytesSize ×0.8 (plancher 0.5 GiB), minBytes=85% — vérifié tous les 30 frames (L:~625, hors fusion `disableSelfWatchdog`)
- → relever itemCap ne remonte PAS le hardGpuCeil 4500 géométries/textures : plafond dur effectif ≈4500 objets GPU, avant 8000+ items → le watchdog réduira les octets (×0.8 / 0,5 s) ; à prendre en compte pour haute/maximale
- `[tile-mem]` : L:667-679 · bloc `if (tick % 300 === 0)` (~5 s à 60 fps) · pas de flag · dans `scene.onBeforeRender` · émis aussi hors fusion et fusion
- format : `[tile-mem] geom=G tex=T lru=<itemSet.size>/<maxSize> bytes=<cachedBytesMB>/<maxBytesMB>MB`
- aussi : `window.__glrTileMem = {geometries,textures,lruItems,lruMaxItems,cachedBytesMB,maxBytesMB,tick}` + `CustomEvent('glr:tile-mem')` (observable sans logs)
- observer éviction octets : bytes≈maxBytes ET lru < lruMax ; éviction items : lru≈lruMax ET bytes < maxBytes. Levier test : `localStorage.glr.tileCacheMB` (baisse seulement)
## C3 — errorTarget
- L:287-289 — SEUL écrivain à l'init : `errorTarget = fusionMode===true ? preset.errorTarget*errorTargetScale : 0.75` ; const `MONO_WEB_ENTRY_ERROR_TARGET=0.75` L:286
- origine 0.75 : commentaire L:250-285. Mono web = preset 'standard' (errTarget 4) car deviceMemory plafonné 8 Go → modèle incomplet à l'arrêt ; fix = errorTarget fin (d'abord 0.2) ; audit C-01 2026-07-01 : 0.2 sur-raffine (573/2518 tuiles après 150 s, ~1,9 Go, ~2500 req/min près du rate-limit, LRU thrash cap 2000<2518) → 0.75 : 60-85 % d'octets/tuiles en moins à l'entrée
- presets errorTarget : econome 8 · standard 4 · haute 2 · maximale 1 (QualityPresets.ts:56,67,78,89)
- errorTargetScale : L:246-247 · option `errorTargetScale?` (L:58, ~L:58 dans LoadOptions) · défaut 1 · >0 · passé UNIQUEMENT par mergedScene.ts:152 (`homeErrorTargetScale`, curseur accueil fusionné) ; mono (FileManager.ts:231, main.ts) ne le passe pas
- appelants loadTileset : FileManager.ts:231 (MONO web, pas de fusionMode) · main.ts:4485 (`fusionMode:true`, couche d'appoint → errorTarget=preset×1) · mergedScene.ts:162 (fusion, ×scale)
- ⚠ contrat mission « preset à l'entrée dans les 2 cas » = changement : mono passe de 0.75 à preset (standard=4)
- écrivains post-chargement (hors tests) :
- ui/qualityHud.ts:333 · slider HUD `input` (qualityHud.ts:352-361) → `errorTarget = sliderToErrorTarget(pct, preset)` · ABSOLU · 0 %→preset×2 · 50 %→preset · 100 %→0.5 (log) · défaut slider `currentSliderPct=50` (L:340) → ≙ preset
- qualityHud.ts:478 · après reload preset : `setTimeout(applyDetailLevel(currentSliderPct), 200)` → réécrase l'errorTarget à 200 ms après chargement (écrase l'entrée 0.75/preset ; ≠ 50 % si slider bougé)
- qualityHud.ts:323-336 `applyDetailLevel` : cible = tous objets scene `userData.format==='3d-tiles' && userData.tilesetDispose`, lit `userData.tilesRenderer` ; ne tient aucune « base » : valeur absolue ; ne touche pas aux tilesets quand splat actif (L:358-361)
- ui/mergedScene.ts:450-451 · curseur accueil fusion : `errorTarget = presetTarget*homeErrorTargetScale` · ABSOLU, principal+secondary ; fusion seulement
- packs/architecte/index.ts:657-676 · capture/rapport : sauve errorTarget, force `1` si >1, restaure en try/finally · ABSOLU temporaire ; piège : un raffinement auto concurrent serait restauré à l'ancienne valeur (cache de `prevErrTarget`)
- core/vramBackpressure.ts : ∅ écriture errorTarget (maxJobs seulement, L:42-64) ; L:~636 watchdog : ∅ errorTarget
- homeCinematic.ts, boot/splash.ts : ∅ écriture (UI/texte seulement)
- règle qui doit gagner : slider HUD (choix utilisateur) > raffinement auto. Aucun écrivain ne lit une « base » → conflit réel : un abaissement auto doit être calculé depuis une base (`base = valeur slider/preset`) et NE doit PAS écrire quand `currentSliderPct≠50` ; ou le slider doit repositionner la base de l'état auto (hook)
- détection d'immobilité existante :
- ∅ côté code projet : rg `idle|cameraIdle|onCameraChange|controls.addEventListener|lastInteraction|isMoving` dans SceneManager.ts, main.ts, L → seul hit `(idle)` SceneManager.ts:1876 (label perf) ; ∅ listener `controlstart/controlend/rest/sleep/wake` dans tout V
- lib disponible non utilisée : camera-controls 3.x (SceneManager.ts:215 `this.controls = new CameraControls(...)`, `public controls` :35) émet `wake` / `rest` (mouvement < `restThreshold`=0.01, fin visuelle) / `sleep` (en retard de quelques s par damping) / `controlstart` / `controlend` / `update` (types.d.ts:88-106, 1308-1312 de node_modules/camera-controls/dist)
- ⚠ autoRotate (SceneManager.ts:37, L1822 `controls.rotate(...)`) et animateCamera (SceneManager.ts:1059) bougent la caméra : doivent compter comme mouvement (wake/update OK) ; modes fps/avatar (externalCameraControl SceneManager.ts:100, `controls.update` sauté L:1834) → controls n'émet rien : détecter par la pose de la caméra
- accroche la plus robuste en 1 point : dans L `scene.onBeforeRender` (L:~620-709), déjà appelé chaque frame avec `cam` : comparer `cam.matrixWorld` (ou position+quaternion + projection) à la frame précédente → timestamp `lastMoveMs` ; indépendant du type de contrôle (orbite/fps/ortho) ; zéro dépendance SceneManager. Alternative : `sceneManager.controls.addEventListener('rest'|'wake')` mais LoadOptions ne reçoit pas controls (options: camera, renderer, scene — L:~46-50)
- boucle update :
- L:~700-706 (`scene.onBeforeRender`, tick frameTick) : `setResolutionFromRenderer(camera, renderer)` puis `tilesRenderer.update()` à CHAQUE frame où `shouldStream(streamingActive)` et drawing buffer > 0×0 ; commentaire L:~684-693 : « update() chaque frame, même caméra immobile » + e2e/proof-refine.mjs : « baisser errorTarget caméra IMMOBILE charge instantanément le modèle complet »
- → changer errorTarget à l'arrêt : pris en compte au prochain update() (frame suivante), nouvelles requêtes SANS mouvement : OUI (preuve commentaire L:255-256)
- rendu à la demande : ∅ — SceneManager.ts:1809-1856 `animate` = rAF permanent (`requestAnimationFrame(this.animate)` :1811), `renderer.render` chaque frame → onBeforeRender chaque frame ; mode fusion œil coupé : update() sauté (streamingActive=false, L:~694)
- ⚠ onBeforeRender est appelé par three à CHAQUE objet rendu avec onBeforeRender ? ici sur `scene` (1 fois/frame) — NV si composerRender change l'appel (SceneManager.ts:1851-1856)
## Tests existants
- V/__tests__/csp.test.ts, core/viewPresets.test.ts, geoplan/*.test.ts ... : rg `errorTarget|vramBackpressure|QualityPresets|TilesRendererLoader|qualityHud` dans `*.test.*` (hors node_modules) → ∅ aucun test sur loader, presets, HUD ni backpressure
- vitest ^2.1.9 (package.json:53), `npm test` = `vitest run` ; web/vite.config.ts seul (pas de vitest.config) ; env par défaut node (NV : `environment` non trouvé par rg) → pas de DOM/localStorage/WebGL : tests = fonctions pures uniquement ; `localStorage` est dans try/catch au L:235 ; loader non testable sans mock
- tests faisables : extraire en fonction pure (nouveau fichier, ex. core/errorTargetRefine.ts) `nextErrorTarget(base, stillMs)` + `entryErrorTarget(preset, fusion, scale)`
## Contrat proposé C3
```
// core/errorTargetRefine.ts (pur, testable node)
export const REFINE_STILL_MS = 1500;   // immobile -> palier 1 ; 2×1500 -> palier 2
export function entryErrorTarget(presetET: number, fusion: boolean, scale: number): number
  { return fusion ? presetET * scale : presetET; }
export function refinedErrorTarget(base: number, stillMs: number): number
  { return stillMs >= 2*REFINE_STILL_MS ? Math.min(base, 1) : stillMs >= REFINE_STILL_MS ? base/2 : base; }
// base = valeur "voulue" : preset à l'entrée ; slider HUD la redéfinit (source de vérité)
// L (mono seulement, fusionMode!==true) : état { base, lastMoveMs, lastPose, applied }
//  - init L:287 : base = entryErrorTarget(...) ; tilesRenderer.errorTarget = base
//  - dans scene.onBeforeRender, avant update() : comparer cam.matrixWorld/projection à lastPose
//      bougé -> lastMoveMs=now ; stillMs = now-lastMoveMs ; t = refinedErrorTarget(base, stillMs)
//      si t !== applied -> tilesRenderer.errorTarget = t ; applied = t (écriture seulement sur changement)
//  - mouvement -> t=base immédiat (remonte)
// slider HUD (qualityHud.ts:333) : exposer `userData.setErrorTargetBase(v)` (ou tilesRenderer.__errorTargetBase)
//   -> base=v ; slider reste gagnant ; si currentSliderPct!=50, auto-affinage OFF (option : coupe palier 2) 
// vramBackpressure/watchdog : ∅ errorTarget ; stopper l'affinage si vramThrottled ou lru proche du cap
//   (cachedBytes >= 0.9*maxBytesSize) pour ne pas réinjecter du thrash
// architecte capture : écrit 1 puis restaure prev -> prev doit être lu via base ; piège : restore écrase `applied`
// fusion : inchangé (preset×scale, pas d'affinage)
```
## Vérifié comment
- `sed -n 225,330p L` → L:244-318 lu (cap/errorTarget) · `rg errorTarget V --glob '!*.test.ts'` → 42 hits, écrivains : L:287, qualityHud.ts:333, mergedScene.ts:450-451, architecte/index.ts:667,676
- `rg "idle|controls.addEventListener|lastInteraction|isMoving" core/SceneManager.ts main.ts` → seul `SceneManager.ts:1876 activity: '(idle)'`
- `rg "maxBytesSize|cachedBytes" node_modules/3d-tiles-renderer/src/utilities/LRUCache.js` → :40-41,54,69,252-264 ; `LRUCache.d.ts` → seulement maxSize,minSize,unloadPercent,unloadPriorityCallback
- `rg -ln 'errorTarget|vramBackpressure|QualityPresets' --glob '*.test.ts'` → ∅
## Écarts
- ∅ lecture hors WL (lecture de FileManager.ts:228-245 et camera-controls/dist/types.d.ts, LRUCache.js/.d.ts, vite.config.ts via rg/sed : 3 lectures hors WL, justifiées : appelant mono, API événements, sémantique LRU)
- lignes L:~xxx marquées `~` approximatives (sed non re-numéroté après L:660)
## Pour la suite
- C2 : éditer L:305-310 (itemCapByPreset → 4000/8000/12000/16000) + commentaire L:299-304 ; minSize 0.9× déjà L:315 ; aucun autre appelant. Piège : watchdog hardGpuCeil=min(4500, vramTextureBudget) (L:~616) rétrécira maxBytes avant 8000+ items ; LRUCache.d.ts n'a pas maxBytesSize (déjà contourné). Observer via `window.__glrTileMem` / `[tile-mem]` toutes ~5 s.
- C3 : WL = L, QualityPresets.ts (ou nouveau core/errorTargetRefine.ts + test vitest node pur), ui/qualityHud.ts (:333 et :478), packs/architecte/index.ts:657-676. 0 détection d'immobilité existante côté code (camera-controls émet rest/sleep non écoutés) → accrocher dans L `scene.onBeforeRender` (comparer pose caméra/frame, couvre orbite+fps+ortho). Mono = FileManager.ts:231 (sans fusionMode).
- Slider HUD = base absolue (50 %=preset) ; il doit gagner : exposer un setter de base ; qualityHud.ts:478 réécrit à +200 ms. Aucun test existant sur ces modules.
## Retour sur le pack
- Manquait: ∅ numéros de ligne L:620-710 ; chemin FileManager.ts (appelant mono) ; fichier lib LRUCache.js (pack limitait aux d.ts)
- Inutile: homeCinematic.ts / splash.ts (∅ écriture errorTarget)
