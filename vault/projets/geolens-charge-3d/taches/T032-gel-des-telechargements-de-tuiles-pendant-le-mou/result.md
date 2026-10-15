---
tache: T032
statut: fait
---
## Fait
- V/core/motionGate.ts:1-26 — neuf, 0 import, MOTION_STILL_MS/loadsAllowed/downloadJobs verbatim contrat
- V/core/motionGate.test.ts:1-35 — 8 tests : 499/500/stillMs custom ; moving/vram/œil ⇒ 0, normal, normal=0
- V/loaders/TilesRendererLoader.ts:37-38 — import motionGate
- V/loaders/TilesRendererLoader.ts:619-640 — `gateAllowed=true`, `gateTransitions`, `applyDownloadJobs` (seul écrivain runtime), `updateMotionGate(now)`
- `updateMotionGate` : transition ⇒ log `[motion-gate] gel` | `[motion-gate] reprise (immobile ≥ 500 ms)`, `window.__glrMotionGate={allowed,transitions}`, applyDownloadJobs, allowed ⇒ `downloadQueue?.scheduleJobRun()` 1×
- V/loaders/TilesRendererLoader.ts:661-664 — VRAM : `vramThrottled=d.throttled; applyDownloadJobs()` ; log maxJobs = valeur réelle file
- V/loaders/TilesRendererLoader.ts:708-720 — pose lue sur `camera` (options), plus `cam` ; `updateMotionGate(now)` après bloc pose (C3 inchangé, même refine.lastMoveMs)
- V/loaders/TilesRendererLoader.ts:767-770 — setStreamingActive → applyDownloadJobs() (2 branches if supprimées)
- condition update() (shouldStream + bw/bh) inchangée ⇒ update() chaque frame en mouvement
- 1ʳᵉ frame : lastPose null ⇒ transition gel (gateAllowed init true) ⇒ gel 500 ms ouverture
## Vérifié comment
```
grep -n "downloadQueue.maxJobs =" V/loaders/TilesRendererLoader.ts
321:    tilesRenderer.downloadQueue.maxJobs = preset.downloadMaxJobs;
626:    tilesRenderer.downloadQueue.maxJobs = downloadJobs({
```
```
npm run typecheck >/dev/null 2>&1; echo "typecheck exit=$?"
typecheck exit=0
```
```
npx eslint src/viewer/core/motionGate.ts src/viewer/core/motionGate.test.ts src/viewer/loaders/TilesRendererLoader.ts
  0:0  warning  File ignored because of a matching ignore pattern. (×3)
✖ 3 problems (0 errors, 3 warnings)
eslint exit=0
```
```
npx vitest run src/viewer/core/motionGate.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
npm test
 Test Files  183 passed (183)
      Tests  1758 passed (1758)
```
## Écarts
- ∅ lecture hors WL
- eslint : src/viewer ignoré par config ⇒ 0 règle réellement appliquée aux 3 fichiers
- base tests 183/1758 ≠ 180+1/1721+8 annoncés — autres fichiers ajoutés hors T032 (NV lesquels)
- log VRAM : `maxJobs=${d.maxJobs}` → `maxJobs=${downloadQueue.maxJobs}` — sinon faux pendant gel
## Pour la suite
- console : orbit ⇒ `[motion-gate] gel` 1×, lâcher ⇒ `reprise (immobile ≥ 500 ms)` ~500 ms après
- `__glrTiles.downloadQueue.maxJobs` = 0 en mouvement, = preset.downloadMaxJobs à l'arrêt (hors VRAM/œil off)
- `__glrMotionGate.transitions` pair à l'arrêt, +2 par geste ; fusion : dernière instance gagne
- 0 requête tuile neuve pendant mouvement (onglet Network) ; fetch en vol finissent (accepté D24)
- eslint ignore src/viewer : lint non probant, à signaler au chef
## Retour sur le pack
- Manquait: config eslint ignore src/viewer (DoD lint non vérifiable) ; base tests à jour (183 fichiers)
- Inutile: PriorityQueue.d.ts (API déjà recopiée dans Contrats)
