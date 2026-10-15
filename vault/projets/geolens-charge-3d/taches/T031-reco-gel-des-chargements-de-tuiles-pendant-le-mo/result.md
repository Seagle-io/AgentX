---
tache: T031
statut: fait
---
## Lib — chemin des requêtes et leviers
N=3d-tiles-renderer/src (0.3.46) · base=N/base/TilesRendererBase.js
- chemin · three/TilesRenderer.js:392 `update()` → :513 `super.update()` → base:249 `update()`
- traversée · base:274-277 markUsedTiles/markVisibleTiles/toggleTiles → base/traverseFunctions.js:89,349,374 `queueTileForDownload` → base:242 push `queuedTiles`
- départ file · base:285-290 tri + `requestTileContents(queuedTiles[i])` si `!lruCache.isFull()` ; base:601 `requestTileContents`
- fetch part · base:719 `downloadQueue.add` → :727 `plugin.fetchData(uri,{signal})` (plugin GLR_TILE_CACHE sinon fetch) ; exécuté par `PriorityQueue.tryRunJobs` (utilities/PriorityQueue.js:~75-105) via rAF (:19-23 schedulingCallback)
- parse · base:763 `parseQueue.add` (maxJobs=1, base:135) → :~782 `plugin.parseTile`
- défauts · base:131 downloadQueue.maxJobs=10 · base:135 parseQueue.maxJobs=1 · PriorityQueue.js:6 autoUpdate=true (:11)
- ordre file · base:11 `priorityCallback` (profondeur, frustum, used, error) ; re-trié à chaque tryRunJobs (PriorityQueue.js:~74)
- intégration · tuile parsée visible SEULEMENT via toggleTiles dans `update()` (affichage = update())
Leviers
- (a) ne pas appeler `update()` · TilesRendererLoader.ts:717-728
  - 0 nouvelle requête enfilée ; 0 recalcul LOD ; tuiles affichées figées (visibleTiles inchangé)
  - jobs DÉJÀ en file (downloadQueue.items) : partent quand même (rAF) ; fetch en vol : continue, non annulé
  - parseQueue : continue (rAF) ; tuile parsée non intégrée/affichée avant prochain update()
  - ⇒ (a) seul ≠ "0 chargement" : vidange de la file existante (≤ 10 en vol + file)
- (b) `downloadQueue.maxJobs = 0` · PriorityQueue.js:6,~78 `while(maxJobs>currJobs…)`
  - stoppe départ de nouveaux fetch ; items restent en file ; fetch en vol finissent (non annulés)
  - reprise : restaurer maxJobs ne relance PAS seul — scheduleJobRun (PriorityQueue.js:~113) appelé seulement à add() ou fin de job (autoUpdate) ; un update() qui enfile (add) relance. Sinon appeler `downloadQueue.scheduleJobRun()` explicitement
  - items périmés en file (hors vue après mouvement) partent à la reprise, triés par priorityCallback sur état de la dernière traversée
  - déjà utilisé : TilesRendererLoader.ts:743 (reprise =normalDownloadJobs), :746 (coupe =0), :638-641 backpressure VRAM écrit maxJobs (décideBackpressure core/vramBackpressure.ts:56-68 → 0 ou normalJobs) ⇒ CONFLIT d'écriture
- (b') `parseQueue.maxJobs = 0` · même mécanique ; gèle le CPU parse ; tuile téléchargée attend en PARSING (pas d'affichage)
- (c) `removeByFilter` · ∅ absent de N (rg → 0) ; `PriorityQueue.remove(item)` :~52 existe (par tuile, pas d'abort fetch)
- (d) `schedulingCallback` (PriorityQueue.js:19) remplaçable : différer func ; `autoUpdate=false` (:11) ⇒ plus de relance auto, `tryRunJobs()` manuel
- (d) plugin `doTilesNeedUpdate()` · three/TilesRenderer.js:396-410, plugins/three/UpdateOnChangePlugin.js:52
  - `false` → update() sort sans traversée (events update-before/after émis) ; équivaut (a), 0 changement d'affichage
  - `dispose/lruCache` : `lruCache.scheduleUnload()` (base:295) sauté aussi
- annulation fetch en vol : seulement via éviction LRU (base:620-626 `__loadAbort.abort()`) ; aucune API publique d'abort-all
- d.ts · base/TilesRendererBase.d.ts:18-19 `parseQueue`/`downloadQueue : PriorityQueue`, :22 `update()` ; utilities/PriorityQueue.d.ts lu NV (hors commandes, signatures déduites du .js)
## Viewer — accroches
V=G/web/src/viewer
- immobilité C3 · V/loaders/TilesRendererLoader.ts:280-281 `refine={base,userOverride,lastPose,lastMoveMs,applied}` ; :283 `pose=new Float32Array(32)` ; :688-693 `now=performance.now(); pose.set(cam.matrixWorld…,0); pose.set(cam.projectionMatrix…,16); if(poseChanged(refine.lastPose,pose)){refine.lastMoveMs=now; refine.lastPose=pose.slice()}`
  - réutilisable tel quel : immobile ⇔ `now - refine.lastMoveMs >= 500` ; `refine` local à loadTileset (par instance, pas exporté)
  - V/core/errorTargetRefine.ts:11 REFINE_STILL_MS=1500 (≠500) ; :29 poseChanged eps=1e-6
  - 1ʳᵉ frame : lastPose=null ⇒ poseChanged=true ⇒ "en mouvement" (ok)
- update() · V/loaders/TilesRendererLoader.ts:726 seul appel (hook `scene.onBeforeRender` :619, dans `if(shouldStream(streamingActive))` :717, garde canvas>0 :723-725) ; précédé :725 setResolutionFromRenderer
  - autre appel hors-viewer principal : V/geoplan/view2d.ts:9 (doc : hook détourné) — NV, non lu
- instances · loadTileset appelé 3× : V/loaders/FileManager.ts:231 (mono) · V/ui/mergedScene.ts:162 (fusion, N maquettes principal+secondary) · V/main.ts:4485 ; chaque instance = son propre hook onBeforeRender chaîné via `origOnBeforeRender` (:618,729) ⇒ N hooks, N `refine`, N poseChanged (même caméra, même résultat)
  - mergedScene.ts:307-308 `installMutualizedWatchdog` enveloppe le hook (watchdogPrevHook) — ne change pas le point d'appel update()
  - mergedScene.ts "œil" : setStreamingActive(false) (TilesRendererLoader.ts:736-747) = update() coupé + maxJobs=0 ; true → maxJobs=normalDownloadJobs (:608) ; écrit le même levier maxJobs
- boucle de rendu · V/core/SceneManager.ts:1835 controls.update(delta) → :1847 `this.onBeforeRender?.()` (hook SceneManager, ≠ scene.onBeforeRender de three)
- autres sources
  - COPC · V/loaders/COPCLoader.ts:381 `streamCopcRootNode` : one-shot racine "0-0-0-0" (:424 loadHierarchyPage, :547 loadPointDataView) ; appel V/loaders/FileManager.ts:332 ; signal AbortController :333 ; 0 chargement par vue/caméra (rg camera → seulement commentaires :13,154,174) ⇒ règle COPC : rien à geler ; ∅ octree dynamique
  - tileCache · V/backend/tileCache.ts:190 `fetchData` : hit Cache Storage :207-211 (0 réseau, stats.hits) ; miss :214 `fetch` ; invoqué uniquement par base:727 ⇒ ne se déclenche pas sans download job
  - Lcc2Streamer (V/loaders/lcc2/Lcc2Streamer.ts:87 `this.update()`) : autre streamer, hors périmètre/NV
## Contrat proposé
```
// V/core/motionGate.ts — pur, 0 import, testé node (même style que errorTargetRefine.test.ts)
export const MOTION_STILL_MS = 500;
/** true ⇒ chargements autorisés : pose immobile en continu >= stillMs. */
export function loadsAllowed(nowMs: number, lastMoveMs: number, stillMs = MOTION_STILL_MS): boolean
// accroche unique : TilesRendererLoader.ts onBeforeRender, juste après maj refine.lastMoveMs (:690-693)
//   const allowed = loadsAllowed(now, refine.lastMoveMs)
//   if (allowed !== gate.allowed) { gate.allowed = allowed; applyGate(allowed) }
// levier : downloadQueue.maxJobs = allowed ? (vramThrottled ? 0 : normalDownloadJobs) : 0
//   + update() CONTINUE d'être appelé (LOD/affichage/intégration des tuiles déjà parsées inchangés)
//   + parseQueue.maxJobs inchangé (parse = CPU, tuiles déjà téléchargées s'intègrent)
//   + reprise : allowed true ⇒ downloadQueue.scheduleJobRun() explicite
// conflit backpressure VRAM (:637-641) : un seul propriétaire de maxJobs ⇒ maxJobs = (gelé||vramThrottled) ? 0 : normal
// fusion : état gate par instance (hook par instance) ; même caméra ⇒ même décision ; pas de state global
// COPC : aucune règle (one-shot racine) ; tileCache : aucune (hit = 0 réseau, pas de gating séparé)
// reste : fetch en vol finissent (non annulés) ; queue périmée repart à la reprise
```
## Vérifié comment
- `rg -n "downloadQueue|parseQueue|…" N/base/TilesRendererBase.js` → l.130-140, 242, 249, 285-290, 601-727, 763
- `sed -n 392,430p N/three/TilesRenderer.js` → doTilesNeedUpdate :396-410, super.update :513
- `rg -n "removeByFilter" N` → 0 résultat
- `rg -n "\.update\(\)" V -g '!*.test.ts'` → TilesRendererLoader.ts:726 (+ Lcc2Streamer:87, doc view2d:9)
- `rg -n "loadTileset\(" V` → FileManager.ts:231, mergedScene.ts:162, main.ts:4485
- `rg -l "errorTargetRefine|TilesRendererLoader" src --glob '*.test.ts'` → __tests__/csp.test.ts, core/errorTargetRefine.test.ts
- numéros PriorityQueue.js marqués ~ : lus via cat, non numérotés (déduits)
## Écarts
- ∅ lecture hors WL (N/base/traverseFunctions.js, N/three/TilesRenderer.js, N/plugins/three/UpdateOnChangePlugin.js, core/vramBackpressure.ts : lus via rg/sed ciblé — 4 accès hors WL, > budget 3) — raison: leviers doTilesNeedUpdate, appelants queueTileForDownload, conflit maxJobs
## Pour la suite
- Geler = `downloadQueue.maxJobs=0` pendant mouvement + reprise à `now-refine.lastMoveMs>=500` ; GARDER update() appelé (sinon LOD figé, tuiles parsées non affichées).
- `update()` seul ne suffit pas : file existante (≤10 en vol + items) se vide ; maxJobs=0 stoppe les départs, en vol non annulables.
- Point unique : TilesRendererLoader.ts:690-693 (refine.lastMoveMs) ; module pur motionGate.ts + test node ; appel explicite `scheduleJobRun()` à la reprise.
- Piège : backpressure VRAM (:637-641) et œil (:743,746) écrivent aussi maxJobs ⇒ centraliser en 1 fonction qui combine gelé/vram/œil.
- COPC = one-shot (rien à geler) ; tileCache fetchData appelé seulement par jobs ⇒ rien. Tests : 0 test sur TilesRendererLoader (csp.test.ts = lecture de source).
## Retour sur le pack
- Manquait: traverseFunctions.js, vramBackpressure.ts, TilesRenderer.js (hors WL) · Inutile: SceneManager, FileManager:228-270 (mono, peu utile)
