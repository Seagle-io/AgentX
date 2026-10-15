---
tache: T026
statut: fait
---
## Livré
- G/web/src/viewer/backend/tileCache.ts:L1-L229 — module neuf, 0 import, contrat verbatim
- tileCache.ts:L9-L17 — constantes, interfaces : verbatim contrat
- tileCache.ts:L56-L82 — scope sha256/16 hex, nom, clé sans query
- tileCache.ts:L84-L100 — purge geolens-tiles-* (+keepScope), oublie LRU
- tileCache.ts:L102-L126 — housekeeping : scopes, tags, éviction LRU
- tileCache.ts:L128-L150 — store non attendu ; quota → writable=false
- tileCache.ts:L152-L195 — plugin fetchData, séquence normative
- tileCache.ts:L197-L229 — installTileCache (fabrique), getTileCacheStats, window.__glrTileCacheStats
- G/web/src/viewer/backend/__tests__/tileCache.test.ts:L1-L387 — 23 tests, globals simulés, env node
## Vérifié comment
npm --prefix web test -- tileCache → `✓ src/viewer/backend/__tests__/tileCache.test.ts (23 tests) 690ms` · `Tests 23 passed (23)`
npm --prefix web run typecheck → `typecheck exit=0`
npm --prefix web test → `Test Files 181 passed (181)` · `Tests 1744 passed (1744)` ; 0 échec préexistant
git -C G status --short -- web/src/viewer/backend/ → `?? web/src/viewer/backend/__tests__/tileCache.test.ts` · `?? web/src/viewer/backend/tileCache.ts`
## Écarts
- store, catch : `signal.aborted` → skipped++ ; sinon writable=false — abort en lecture corps ≠ quota
- installTileCache : `typeof window === 'undefined'` → null — garde env node/SSR
- tileCacheScope : rejet possible si crypto.subtle absent ; 0 throw sync ; rejet capté par install
- writable : global au module, jamais remis à true (nouvelle install incluse)
- lecture hors WL : ∅
## Pour la suite
- Lot C : `const make = installTileCache({ projectId, contentTag, userId, origin: location.origin })` ; `if (make) tiles.registerPlugin(make())` AVANT tout plugin définissant fetchData
- Lot C : logout / idleLogout → `void purgeTileCaches()` ; changement de compte → `purgeTileCaches({ keepScope: await tileCacheScope(newUserId) })`
- `writable=false` dure toute la session onglet (quota, plafond) ; reset non prévu par le contrat
- Estimate = usage de toute l'origine (pas seulement tuiles) → plafond peut couper tôt si IndexedDB lourde
- Clone >64 Mio : corps lu entièrement avant rejet (pic mémoire transitoire) ; Content-Length précoce possible
## Retour sur le pack
- Manquait: sort de `writable` sur nouvelle install ; traitement d'un abort pendant la lecture du corps (catch(*) aurait coupé le cache au 1er pan caméra)
- Inutile: ∅
