---
tache: T011
statut: fait
---
## Fait
V = …/web/src/viewer · N = …/web/node_modules/3d-tiles-renderer/src
- V/core/errorTargetRefine.ts:10 — import `MOTION_STILL_MS` de motionGate (pur, 0 import)
- V/core/errorTargetRefine.ts:19-21 — H11 : `stillMs >= 500` ⇒ `min(base, 0.5)` ; sinon base
- V/core/errorTargetRefine.ts — `REFINE_STILL_MS` supprimé (rg V → ∅ usage) ; `refineGuard` supprimé (D1)
- V/core/errorTargetRefine.ts:36-39 — `shouldAutoRefine({ fusion, userOverride })`
- V/core/errorTargetRefine.test.ts:19-35 — 499 ⇒ base · 500 ⇒ 0,5 · 3000 ⇒ 0,5 · base 0,25 ⇒ 0,25 ; refineGuard + guardBlocked retirés
- V/core/staleQueuePurge.ts:1-19 (neuf) — `staleQueuedTiles` (signature étendue, cf. Écarts)
- V/core/staleQueuePurge.test.ts:1-39 (neuf) — 7 tests (vide, utilisée, non utilisée, `__used` périmé, champs absents, état ≠ LOADING, ordre)
- V/loaders/TilesRendererLoader.ts:36,43 — imports (refineGuard retiré, staleQueuedTiles ajouté)
- V/loaders/TilesRendererLoader.ts:52-54 — `TILE_FAILED = -1`, `TILE_LOADING = 1` — lib importée dynamiquement (:127)
- V/loaders/TilesRendererLoader.ts:301-303 — `refine.guardBlocked` retiré
- V/loaders/TilesRendererLoader.ts:646,660-674 — reprise : purge → log `[motion-gate] purge <n> tuiles hors vue` si n>0 → `scheduleJobRun()` ; `__glrMotionGate = { allowed, transitions, purged }` (cumulé)
- V/loaders/TilesRendererLoader.ts:761-770 — D2 : traverse → tuiles FAILED → `lruCache.remove` chacune → `resetFailedTiles()` ; échéancier T009 + log inchangés
- V/loaders/TilesRendererLoader.ts:773 — garde cache retirée de l'affinage
- V/loaders/TilesRendererLoader.ts:293-294,743,787 — commentaires « paliers » → plancher ≥ 500 ms
- gel D24, `applyDownloadJobs`, `stepFailedTileRetry` inchangés

Vérifs N :
- items = tuiles : base:719 `downloadQueue.add(tile, …)` → PriorityQueue.js:52 `items.push(item)` ; :91 `items.pop()` au démarrage du job ⇒ items = tuiles en attente non démarrées, état LOADING (base:677 avant add)
- `__used` NE reflète PAS seul la dernière traversée : traverseFunctions.js:17-23 reset `__used` seulement si tuile visitée ; :200-204 parent hors champ ⇒ return sans visiter enfants ; :206-209 parent non traversable ⇒ enfants non visités ⇒ `__used` périmé à true. Prédicat lib = traverseFunctions.js:10-13 `__lastFrameVisited === frameCount && __used` ; frameCount++ base:274 avant markUsedTiles:276
- update() chaque frame pendant le gel : Loader:800 (onBeforeRender, hors œil coupé / canvas 0×0) ; purge à :665 lit `tilesRenderer.frameCount` de l'update() de la frame précédente — cohérent
- callback d'unload sur FAILED : base:629-643 → branche `else` (pas LOADING, pas externe) → plugins `disposeTile` ; three/TilesRenderer.js:809-815 `if (cached.scene)` ⇒ no-op sans contenu ; base:381-395 `__visible`/`__active` gardés ; stats : ni downloading ni parsing décrémentés (base:645-651) ; base:653-658 UNLOADED + retrait files ⇒ OK sans remise UNLOADED préalable
- `stats.failed` non décrémenté par remove ⇒ `resetFailedTiles` (base:299-330) passe le test `failed === 0` et remet à 0 ; tuiles déjà UNLOADED, traverse no-op

## Vérifié comment
```
cd web && npx tsc --noEmit -p tsconfig.viewer.json; echo "exit $?"
→ exit 0

npx vitest run src/viewer/core/errorTargetRefine.test.ts src/viewer/core/staleQueuePurge.test.ts
→ ✓ src/viewer/core/staleQueuePurge.test.ts (7 tests) 7ms
→ ✓ src/viewer/core/errorTargetRefine.test.ts (13 tests) 5ms
→ Test Files  2 passed (2)   Tests  20 passed (20)

npm test
→ Test Files  193 passed (193)
→      Tests  1811 passed (1811)
```
1811 = 1807 − 3 (refineGuard ×2, guardBlocked ×1) + 7 (staleQueuePurge). Banc navigateur : NV (hors outils du pack).

## Écarts
- contrat `staleQueuedTiles(items, loadingState)` étendu à `(items, loadingState, frameCount)` + champ `__lastFrameVisited?: number` — `__used` seul périmé (traverseFunctions.js:17-23) ; contrat verbatim raterait dolly arrière + pan (tuiles non visitées)
```ts
export function staleQueuedTiles<T extends { __used?: boolean; __loadingState?: number; __lastFrameVisited?: number }>(
  items: readonly T[], loadingState: number, frameCount: number): T[]
```
- lecture hors WL: N/base/traverseFunctions.js:1-50,190-260 — vérif `__used` exigée par DoD
- lecture hors WL: N/three/TilesRenderer.js:805-880 — disposeTile sur tuile FAILED sans contenu (DoD D2)
- `__glrMotionGate` désormais écrit après purge (Loader:674) au lieu d'avant `applyDownloadJobs` — besoin de `purged`

## Pour la suite
- banc dolly 5 crans : log `purge n` à la reprise, n attendu ~ part non utilisée de la file (180) ; requêtes non `__used` 72/512 → ~0
- banc pan : 44/132 → ~0 ; `__glrMotionGate.purged` cumulé > 0
- H11 : 1ʳᵉ requête post-orbite attendue ≈ 0,5 s après mouse.up (vs 4,1-8,9 s) ; ET 0,5 dès la reprise
- D1 : `SCEN=h1 PRESET=standard GPU=1` → ET ne doit plus rester figé à 4 ; D2 : `SCEN=h15 FAILTILE=t/5_10_10.glb` → requête relancée à la 1ʳᵉ relance
- onBeforeRender Loader > 60 l (préexistant, +8 l ici) — règle G, à découper hors T011

## Retour sur le pack
- Manquait: prédicat lib « utilisée cette frame » (`__lastFrameVisited`, traverseFunctions.js:10-23) absent ; `traverseFunctions.js` et `three/TilesRenderer.js` disposeTile hors WL alors que la DoD exige leur vérif
- Inutile: N/utilities/LRUCache.js:124-150 déjà recopié dans Contrats
