---
tache: T009
statut: fait
---
## Fait
- V/core/errorTargetRefine.ts:L14 — `REFINE_FLOOR_PX = 0.5` ; L21 floor = `Math.min(base, REFINE_FLOOR_PX)` ; palier 1 forme inchangée ; paliers 1,5/3 s inchangés
- V/core/errorTargetRefine.ts:L28-L30 — `poseChanged(prev: ArrayLike<number> | null, …)`
- V/core/errorTargetRefine.ts:L40-L49 — `refineGuard` (≥ 0,9 bloque ; bloqué → débloque < 0,8 ; max ≤ 0 ⇒ false) ; `shouldAutoRefine` prend `guardBlocked`
- V/core/errorTargetRefine.test.ts — (4,3000)=0,5 · (0,25,3000)=0,25 · palier 1 (1,5)=0,75 · séquence 0,85→0,91→0,85→0,79 · Float64Array ; 13 → 16 tests
- V/core/tileTextureQuality.ts:L1-L32 (neuf) — `applyAnisotropy(root, level): number` ; 6 slots ; needsUpdate seulement si ≠ ; texture partagée comptée 1×
- V/core/tileTextureQuality.test.ts (neuf) — 4 tests, objets three sans WebGL
- V/core/failedTileRetry.ts:L1-L39 (neuf) — `nextRetryDelayMs` (2000×2^n, ≤ 60 000) ; `FailedTileRetryState { attempt, nextAt }` ; `stepFailedTileRetry(s, failed, loadsAllowed, now) → { state, relaunch }`
- V/core/failedTileRetry.test.ts (neuf) — 7 tests (délais, plafond, armement, gel, 2/4/8 s, reset)
- V/loaders/TilesRendererLoader.ts:L36-L39 — imports refineGuard, applyAnisotropy, stepFailedTileRetry
- V/loaders/TilesRendererLoader.ts:L295-L296 — `refine.guardBlocked` (init false)
- V/loaders/TilesRendererLoader.ts:L563-L567 — `getMaxAnisotropy()` 1× ; load-model → `applyAnisotropy(event.scene, …)` ; `_event` → `event`
- V/loaders/TilesRendererLoader.ts:L640-L641 — état `failedRetry`
- V/loaders/TilesRendererLoader.ts:L733-L734 — cast `as unknown as Float32Array` retiré
- V/loaders/TilesRendererLoader.ts:L740-L752 — relance (gateAllowed) + log `[tile-retry] relance n°<k> (<failed> tuiles)` ; garde hystérésis → shouldAutoRefine
- V/loaders/TilesRendererLoader.ts:L819, L833-L836, L860 — diag : FAILED=-1, UNLOADING retiré (absent de la lib), état absent → OTHER (plus FAILED)
- V/loaders/TilesRendererLoader.ts:L288 — commentaire palier 3 s → min(base, 0,5)

## Vérifié comment
```
cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo "exit=$?" → exit=0
npx vitest run src/viewer/core/{errorTargetRefine,tileTextureQuality,failedTileRetry}.test.ts →
 ✓ src/viewer/core/errorTargetRefine.test.ts (16 tests) 23ms
 ✓ src/viewer/core/tileTextureQuality.test.ts (4 tests) 6ms
 ✓ src/viewer/core/failedTileRetry.test.ts (7 tests) 15ms
 Test Files  3 passed (3)
      Tests  27 passed (27)
npm test →
 Test Files  192 passed (192)
      Tests  1807 passed (1807)
```
1793 + 14 nouveaux = 1807 ; 190 + 2 = 192.

## Écarts
- lecture hors WL : ∅
- H15 : DoD « attempt = 0 quand failed === 0 » appliquée à la lettre → backoff jamais croissant : `resetFailedTiles()` met `stats.failed = 0` tout de suite (N/base/TilesRendererBase.js:325). Choix : attempt = 0 seulement si failed reste 0 jusqu'à `nextAt`
- H15 : 1re relance 2 s après le 1er échec vu (armement `nextAt = now + 2000`), pas immédiate ; `nextAt = 0` = non armée
- H15 : ajout de `stepFailedTileRetry` (pur, testé), hors contrat : garde le Loader mince
- H1 : signature de `shouldAutoRefine` changée : `{ fusion, userOverride, guardBlocked }` au lieu de cachedBytes/maxBytes ; garde recalculée à chaque frame, fusion et override compris
- H15 : condition = `gateAllowed` seul (pas de test vramThrottled / streamingActive), conforme au contrat

## Pour la suite
- banc H1 : à 600 Mo, ET stable (pas de 1→4→1) ; garde débloquée seulement sous 80 % du budget
- banc H4 : textures anisotropy = max GL (16) ; voir le coût de needsUpdate (ré-upload) si texture déjà en GPU
- banc H15 : sur un 503, log `[tile-retry] relance n°1` ~2 s plus tard, puis 4/8/16 s si ça échoue encore ; trou comblé
- H15 limite : si la relance échoue après plus que le délai en cours (timeout réseau > 2 s), attempt retombe à 0 → délai ne croît pas
- rootLoadingState FAILED (tileset racine) : non suivi par `stats.failed` ⇒ pas relancé par ce mécanisme

## Retour sur le pack
- Manquait : le fait que `resetFailedTiles()` remet `stats.failed = 0` d'un coup, ce qui contredit « attempt = 0 quand failed === 0 » ; la forme de `shouldAutoRefine` après la garde (garder les octets ou prendre guardBlocked)
- Inutile : ∅
