---
tache: T001
statut: fait
---
V=Geolens/geolens-web-feat-viewer-online/web/src/viewer · N=…/web/node_modules/3d-tiles-renderer/src (0.3.46)

## A — détail maximal à l'arrêt
- errorTarget preset · V/core/QualityPresets.ts:54,64,74,84 · econome 8 · standard 4 · haute 2 · maximale 1 px · base d'entrée
- preset effectif web = standard · V/core/QualityPresets.ts:226-232 + SettingsManager.ts:95 · deviceMemory plafonné 8 Go, pas d'IPC · errorTarget 4 de base
- clamp GPU · V/core/QualityPresets.ts:299-307 · GPU intégré (regex main.ts:1498 : intel hd/uhd/iris, swiftshader, llvmpipe) ⇒ haute/maximale → standard · headless = SwiftShader ⇒ tier integrated ⇒ standard forcé (banc : localStorage ne contourne pas le clamp GPU)
- plancher affinage · V/core/errorTargetRefine.ts:21-25 · 1,5 s → max(base/2,floor) · 3 s → min(base,1) · plancher auto = 1 px (jamais < 1)
- slider 100 % → 0,5 px · V/ui/qualityHud.ts:306-322 · plus fin que l'auto (1 px) mais userOverride=true ⇒ 0 affinage auto (qualityHud.ts:336)
- shouldAutoRefine · errorTargetRefine.ts:41-45 + Loader:721-731 · faux si fusion, slider≠50 %, ou cachedBytes ≥ 0,9×maxBytesSize ⇒ errorTarget retombe à base IMMÉDIATEMENT (pas d'hystérésis ; minBytes=0,85×max, Loader:249) ⇒ oscillation possible
- fusion · Loader:279-281,713-731 · errorTarget×scale (accueil 1,4 → 0,6, mergedScene.ts:96-98) et 0 affinage
- couche d'appoint hors accueil · main.ts:4490 · fusionMode:true ⇒ 0 affinage, 0 warp (même hors fusion)
- maxDepth=100 · Loader:286 · lib canTraverse base/traverseFunctions.js:127 · non limitant
- errorTargetScale · Loader:253 · 1 en mono ; ≠1 seulement via mergedScene.ts:152
- errorThreshold · ∅ non posé (lib défaut Infinity, base:154) ⇒ meetsSSE toujours vrai (traverseFunctions.js:360) ⇒ parent gardé jusqu'à allChildrenLoaded, jamais remplacé tant qu'un enfant manque
- cache budget · QualityPresets.ts:55-86,113-125 · cacheBudgetGiB 0,75/1,25/1,75/2,5 ; plafond tier integrated 1,0 · discrete 2,5 · unknown 1,25 (défaut realGpuTier='unknown', :150) · Loader:232
- itemCap · Loader:302-315 · 4000/8000/12000/16000 ; minSize=0,9×cap (7200 standard)
- estimation octets · N/three/utilities.js:20-45 · textures comptées RGBA décompressé ×4/3 (KTX2 inclus) ⇒ surestime ⇒ budget atteint tôt
- isFull bloque la file · N/base/TilesRendererBase.js:286 + LRUCache.js:67-69 · itemSet.size≥maxSize OU cachedBytes≥maxBytesSize ⇒ plus aucune requête ; tuiles utilisées non évincées (LRUCache.js:309-353)
- watchdog hardGpuCeil · Loader:619,675-685 · min(4500, budget textures) = 2500/4000/4500/4500 ; test sur mem.geometries OU mem.textures (info.memory compte aussi géométries/textures hors tuiles : POI, grilles, EDL) ; toutes les 30 frames : maxBytesSize ×0,8, plancher 0,5 GiB ; JAMAIS restauré (aucun chemin de remontée) ⇒ cache rétréci définitivement ⇒ shouldAutoRefine faux plus tôt
- watchdog fusion · mergedScene.ts:301-326 · même seuil, plancher 0,25 GiB (fusionBudget.ts:23), idem sans restauration
- backpressure VRAM · vramBackpressure.ts:22-27 + Loader:660-670 · textures>2500/4000/6000/9000 ⇒ downloadQueue.maxJobs=0 jusqu'à retour sous seuil ; retour dépend d'une éviction, or éviction exige cachedBytes>minBytes ET tuiles non utilisées (LRUCache.js:264) ⇒ blocage possible (feuilles jamais chargées) si textures hors tuiles gonflent le compteur
- maxJobs · V/core/motionGate.ts:19-26 · 0 si moving|vram|œil coupé ; Loader:626 seul écrivain
- loadSiblings / stopAtEmptyTiles · N/base/TilesRendererBase.js:90-100 · setters retirés (no-op + warn) ; ∅ dans V
- displayActiveTiles=true · Loader:288 · tuiles « active » hors vue affichées (traverseFunctions.js:441) ; frustumCulled rétabli (autoDisableRendererCulling=false, Loader:287)
- optimizeRaycast · N/three/TilesRenderer.js:81 · défaut true ; V ∅ ne le pose ; sans effet sur détail
- textures : redimensionnement/recompression · rg V loaders+core+ui (resize|downscale|maxTextureSize|minFilter|generateMipmaps|toDataURL) ⇒ ∅ sur chemin tuiles (seuls hits : packs/ rapports/ captures JPEG, TIFFLoader) ; lib ∅ aussi
- GLTFLoader tuiles · Loader:167-198 · DRACO type 'js' (:179, plus lent que wasm), KTX2 transcodeur /basis/ ; handler /\.gltf$/ partagé ; extension CESIUM_RTC de la lib NON enregistrée sur ce loader (N/three/loaders/GLTFExtensionLoader.js:26 ne l'ajoute que sans handler)
- anisotropie · rg anisotropy V ⇒ ∅ (seul disposeUtils.ts:27 liste anisotropyMap) ; GLTFLoader laisse anisotropy=1 ⇒ flou en vue oblique/rasante
- pixelRatio · V/core/SceneManager.ts:181 · setPixelRatio(min(dpr,2)) UNE fois ; handleResize (:541-585) ne le relit pas ⇒ changement de dpr (zoom navigateur, écran) ignoré ; dpr>2 plafonné à 2
- autres écritures résolution · rg setPixelRatio/setSize ⇒ SceneManager.ts:181,187,565 ; RenderModeManager.ts:91,203 (composer = pixelRatio du renderer, setSize w,h) ; N8AO halfRes=true (RenderModeManager.ts, AO seulement) ; ∅ résolution dynamique en mouvement ; ∅ render scale par preset
- setResolutionFromRenderer · N/three/TilesRenderer.js:322-330 · getSize×getPixelRatio ⇒ cohérent avec le buffer ; appelé à chaque frame (Loader:752) ; update() sauté si domElement 0×0 (Loader:749-751)
- caméra figée au chargement · Loader:206 setCamera(options.camera) UNE fois ; rg setCamera ⇒ 1 seul site ; SceneManager.ts:947-985 togglePerspective remplace this.camera par orthoCamera ⇒ tilesRenderer et pose D24 (Loader:713-714) continuent sur l'ancienne caméra perspective ⇒ LOD ne suit plus, gel jamais déclenché

## B — ordre et volume de chargement
- priorityCallback lib non surchargé · V ∅ (rg priorityCallback|unloadPriority) · N/base/TilesRendererBase.js:11-44
- tri téléchargement : profondeur depuis parent rendu (shallower d'abord) > inFrustum > used > error > distance · base:13-40 ⇒ tuile hors vue peu profonde passe avant tuile en vue plus profonde
- file de requêtes triée par lruPriorityCallback (base:285) puis requestTileContents jusqu'à isFull (base:286-290)
- ancêtres toujours chargés : meetsSSE toujours vrai (errorThreshold Infinity) ⇒ chaque tuile utilisée avec contenu est mise en file, parent avant enfants (traverseFunctions.js:369-376) ⇒ requêtes de niveaux intermédiaires inutiles à l'arrêt mais nécessaires anti-trous (REPLACE)
- cascade par couches : niveau d+1 requis seulement quand parent !allChildrenLoaded et niveau d chargé (traverseFunctions.js:402-415) ⇒ temps jusqu'à net ≈ Σ latences des niveaux, siblings tous attendus
- items périmés : requestTileContents fait lruCache.add AVANT downloadQueue.add (base:620,719) ; entrée retirée de la file uniquement par unload LRU (callback base:620-659), qui exige tuile non utilisée ET (cachedBytes>minBytes OU items>minSize) (LRUCache.js:256-265) ⇒ à faible charge (< 7200 items, bytes < minBytes) AUCUNE annulation ⇒ tuiles hors vue continuent à télécharger
- gel D24 : maxJobs=0 en mouvement (Loader:626, motionGate.ts:19) mais update() continue ⇒ requestTileContents continue d'empiler la file pendant le mouvement ; reprise après 500 ms (motionGate.ts:11) + scheduleJobRun (Loader:639) ⇒ rafale de tuiles de poses intermédiaires triées par profondeur, pas par distance
- pose D24 : Float32Array 32 valeurs, eps 1e-6 absolu (errorTargetRefine.ts:28-35) ; caméra avec amortissement (camera-controls smoothTime) ⇒ dérive sub-pixel possible > 1e-6 ⇒ « immobile » tardif (NV)
- escalier d'affinage : 0,5 s reprise (base) → 1,5 s base/2 → 3 s 1 px ⇒ 3 vagues de tuiles ; les vagues 1-2 sont remplacées par la 3 ⇒ requêtes jetables ; temps jusqu'à net ≥ 3 s + cascade
- parseMaxJobs/downloadMaxJobs par preset · QualityPresets.ts:56-86 · 4/2 · 6/4 · 8/6 · 12/8 (Loader:320-325) ; lib défaut 10/1 (base:131,135)
- double chargement : web mono = 1 instance ; fusion = 1 par maquette (mergedScene.ts:148-162) ; main.ts:4485 charge une 2e instance « appoint » ⇒ cache LRU séparé par instance (chaque Loader:310-315), pas de dédup entre instances
- tile cache persistant · V/backend/tileCache.ts:187-232 · fetchData Cache Storage ; clé sans query ; entrée ≤ 64 Mio (:12) ; hits renvoient la Response stockée ; écriture asynchrone ; GET sans Range ; ∅ impact LOD ; stats window.__glrTileCacheStats (:248)
- coût CPU par tuile chargée : (a) Loader:565-576 traverse complet de l'arbre sur CHAQUE load-model ; (b) Loader:601-603 dumpTilesDiagnostic toutes les 5 tuiles (traverse + tri) ; (c) main.ts:3433 `glr:tile-loaded` ⇒ sceneManager.scene.traverse complet par tuile ; (d) estimateBytesUsed N/three/TilesRenderer.js:790 ⇒ O(N tuiles × arbre) ⇒ longues tâches, retarde l'image nette (NV)
- update() par rendu : hook Scene.onBeforeRender (Loader:642) appelé à CHAQUE renderer.render(scene) ; EDLRenderer.ts:155,174 et composer N8AO rendent la scène plusieurs fois par frame ⇒ update() multiple par frame (frameCount de la lib incrémenté à chaque appel) (NV : nb exact)

## C — défauts d'affichage probables
- near/far incohérents · SceneManager.ts:163 (0,1/50000) · :1388 near=max(0,01,dist×0,001) far=max(50000,dist×10) · :1506 idem · main.ts:3366 near=max(0,05,radius×0,005) far=max(5000,radius×20) · mergedScene.ts:348,385,414 (dist×0,01/dist×100) ⇒ 4 formules ; ratio far/near jusqu'à 5e6 (dist=10 m ⇒ 0,01/50000)
- profondeur · rg logarithmicDepth ⇒ ∅ ; WebGLRenderer sans logarithmicDepthBuffer (SceneManager.ts:174-180), antialias true ⇒ z-fighting possible entre tuiles de LOD voisins/superposés et sur ADD
- remplacement LOD sans trou par conception : parent masqué seulement quand allChildrenLoaded (traverseFunctions.js:385) ; en revanche un parent reste visible indéfiniment si un enfant échoue ou est refusé (isFull) ⇒ zones floues persistantes
- tuiles FAILED : base:679-708 passent FAILED + setLoaded ; resetFailedTiles jamais appelé (rg V ⇒ ∅) ⇒ tuile en échec réseau transitoire jamais retentée ⇒ trou/flou permanent
- frustum · Loader:287 autoDisableRendererCulling=false ⇒ culling three actif ; bounding volumes lib à fiabiliser si tileset.transform atypique (NV)
- transformations : Loader:431-505 ENU-align rootGroup si |centre|>1000 km ; sub-tileset sans warp ; extension CESIUM_RTC non enregistrée (cf. A) ⇒ glb avec RTC décalé (NV : dépend du contenu)
- couleur : GLTFLoader gère colorSpace sRGB des baseColor ; V ∅ n'y touche ; renderer outputColorSpace SRGB + ACESFilmic exposure 0,75 (SceneManager.ts:191-193) ⇒ rendu plus sombre/désaturé, pas une perte de détail
- EDL · SceneManager.ts:506-525 ; EDLRenderer.ts:155-178 · actif seulement avec nuage de points (SceneManager.ts:65) ⇒ ∅ sur mesh pur
- material.side=DoubleSide forcé · main.ts:7731 ; loaders/GLTFLoader.ts:51 (loader non-tuiles)
- scintillement à l'affinage : changement d'errorTarget global par paliers (Loader:728-730) + toggles de visibilité ⇒ pop de LOD par vague (NV)

## Instrumentation déjà exposée
- window.__glrTiles = dernier tilesRenderer chargé (Loader:358) ; écrasé à chaque loadTileset ⇒ fusion/appoint : seul le dernier
- tilesRenderer.stats {downloading,parsing,failed,inFrustum,used,active,visible} (base:141-149) ; downloadQueue.items.length ; lruCache.{cachedBytes,maxBytesSize,itemSet.size,isFull()} ; tile.__error/__depth/__loadingState/__used/__inFrustum (cf. dumpTilesDiagnostic Loader:802-867)
- window.__glrTileMem {geometries,textures,lruItems,lruMaxItems,cachedBytesMB,maxBytesMB,tick} toutes les 300 frames (Loader:690-705) + log `[tile-mem]`
- window.__glrMotionGate {allowed,transitions} + logs `[motion-gate] gel|reprise` (Loader:630-640)
- logs `[vram] backpressure ON|OFF`, `[vram-watchdog]`, `[fusion-watchdog]`, `[TilesRenderer] diag (load #n)` (Loader:662,683,862)
- window.__glrDiag() {render.calls/triangles, memory.geometries/textures, pixelRatio, tileMem} (main.ts:2988) ; window.__glrTest.cameraType/camPos/camTarget (main.ts:2916-2925) ; window.__glrTileCacheStats {hits,misses,puts,skipped,writable}
- événements window : glr:tile-loaded, glr:tileset-load-end, glr:vram-backpressure
- MANQUE : journal par requête (url, profondeur, t début/fin, annulée) ; nb d'appels update() par frame ; temps passé dans le handler load-model ; métrique « net atteint » (∀ tuile utilisée : __error ≤ errorTarget ET chargée ET parent masqué) avec horodatage ; compteur de requêtes jamais visibles ; historique de lruCache.maxBytesSize (watchdog) ; valeur de cameras[0]===sceneManager.camera ; écriture de downloadQueue.maxJobs au cours du temps

## Hypothèses priorisées
| id | axe | chemin:L | mesure banc | correctif probable |
|---|---|---|---|---|
| H1 | A | Loader:721-731 + base:286 + utilities.js:20-45 | à l'arrêt 15 s : cachedBytes/maxBytesSize, isFull(), nb tuiles utilisées avec __error>errorTarget ; log transitions errorTarget | estimer octets réels (compressé), budget tier ↑, hystérésis garde 90 % |
| H2 | A | Loader:675-685 | log `[vram-watchdog]` + historique maxBytesSize sur parcours long | restaurer budget quand geom/tex < seuil ; compter seulement les tuiles |
| H3 | A | vramBackpressure.ts:22-27 + Loader:660 | downloadQueue.maxJobs et items.length au repos après charge lourde | seuil sur textures de tuiles ; débrayer si file bloquée sans éviction |
| H4 | A | Loader:167-198 (anisotropy ∅) | captures vue rasante 10° : anisotropy 1 vs getMaxAnisotropy() | fixer texture.anisotropy sur événement load-model |
| H5 | A | Loader:206 + SceneManager.ts:947-985 | cameraType après toggle ; tilesRenderer.cameras[0]===sceneManager.camera ; stats.used avant/après | setCamera/deleteCamera au changement de caméra ; pose D24 sur caméra active |
| H6 | A | errorTargetRefine.ts:21-25 | capture à 1 px vs 0,5 px vs 0,25 px après 10 s ; nb tuiles feuilles | plancher auto 0,5 (ou 0) à l'arrêt si budget OK |
| H7 | A | Loader:279-281 + main.ts:4490 | errorTarget effectif et affinage en appoint/fusion | autoriser affinage en appoint ; fusion : affiner la maquette active seule |
| H8 | A | SceneManager.ts:181,541-585 | deviceScaleFactor 1/2/3 puis changement dpr ; pixelRatio via __glrDiag ; netteté capture | relire dpr au resize/matchMedia ; lever le plafond 2 si budget |
| H9 | B | base:13-40, 256-265, 620-659 | après balayage caméra : requêtes aboutissant à tuile non utilisée au repos / total ; items.length en file | purger la file des tuiles non utilisées à la reprise (gel) ; priorité frustum avant profondeur |
| H10 | B | Loader:626,639 + motionGate.ts | items.length au moment de la reprise ; requêtes lancées dans les 500 ms | vider la file au gel ; trier par distance à la reprise |
| H11 | B | errorTargetRefine.ts:21-25 | requêtes par vague (0,5/1,5/3 s) ; temps jusqu'à net ; sauter à 1 px après 500 ms | saut direct au plancher à la reprise |
| H12 | B | traverseFunctions.js:402-415 | horodatage requêtes par profondeur ; Σ latences par niveau | préchargement parallèle de la prochaine couche (hors lib : plugin/queue custom) |
| H13 | B | Loader:565-576,601 + main.ts:3433 | Long Tasks + durée du handler load-model sur tileset ≥ 4000 tuiles | compter incrémentalement ; retirer traverse() scène ; diag désactivé hors debug |
| H14 | C | SceneManager.ts:163,1388,1506 ; main.ts:3366 ; mergedScene.ts:348-416 | captures à 3 distances, near/far relevés, comparaison logarithmicDepthBuffer on/off | near/far uniques ; logarithmicDepthBuffer ou reversed-z |
| H15 | C | base:679-708 ; resetFailedTiles ∅ | injecter 1 échec 5xx sur une tuile ; état FAILED après 10 s | resetFailedTiles() avec backoff |

## Vérifié comment
- cat -n V/loaders/TilesRendererLoader.ts (1-889) ; cat V/core/{QualityPresets,errorTargetRefine,vramBackpressure,motionGate}.ts → lignes citées relues
- cat -n N/base/{TilesRendererBase,traverseFunctions}.js + N/utilities/{LRUCache,PriorityQueue}.js → ordres de tri/éviction lus
- rg -n "anisotropy|setPixelRatio|logarithmicDepth|setCamera|resetFailedTiles|priorityCallback|unloadPriority|errorThreshold" V → anisotropy : ∅ (hors disposeUtils.ts:27) ; setPixelRatio : SceneManager.ts:181 seul (+composer lecture) ; setCamera : Loader:206 seul ; logarithmicDepth ∅ ; resetFailedTiles ∅ ; errorThreshold ∅
- aucun test exécuté, aucun navigateur lancé (hors périmètre) ⇒ tous les effets = NV tant que non mesurés au banc

## Écarts
- ∅

## Pour la suite
- Banc headless : SwiftShader ⇒ tier 'integrated' ⇒ preset clampé standard (errorTarget 4→1 px, cache 1,0 GiB) ; mesurer ça d'abord, haute/maximale inatteignables sans stub de setRealGpuInfo.
- Mesurer d'abord H1 (isFull/cachedBytes à l'arrêt), H5 (caméra ortho figée), H4 (anisotropie ∅), H9-H11 (volume/ordre de requêtes avec journal par requête) ; instrumenter via window.__glrTiles (stats, downloadQueue.items, lruCache) + page.on('request') côté banc.
- Gel D24 à conserver : aucun constat n'exige de l'enlever ; H10 propose seulement de vider/retrier la file à la reprise.
- Contrats à recopier dans les packs correctifs : Loader:721-731 (garde shouldAutoRefine), Loader:675-685 (watchdog), Loader:626 (seul écrivain de maxJobs), SceneManager.ts:181, base:11-44 (priorité).
- Fichiers hors V à éviter de toucher : N (node_modules) ; priorités lib ne se changent que via downloadQueue.priorityCallback / lruCache.unloadPriorityCallback posés dans Loader.

## Retour sur le pack
- Manquait: chemin d'un banc/e2e existant (aucun e2e/ dans web/) ; fichiers N/utilities/LRUCache.js, PriorityQueue.js, traverseFunctions.js (lus, hors WL de 1 pas chacun : lib N/ en rg libre) ; main.ts:2916-3000, 3433 (rg ciblé)
- Inutile: V/backend/tileCache.ts (aucun lien avec le détail), V/ui/mergedScene.ts hors watchdog/scale
