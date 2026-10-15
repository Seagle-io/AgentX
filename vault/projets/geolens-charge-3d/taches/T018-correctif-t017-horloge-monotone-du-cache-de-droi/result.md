---
tache: T018
statut: fait
---
## Livré
- G/api/src/tileGrantCache.ts:3-4 — commentaire TTL + 1 load (D17), monotone
- G/api/src/tileGrantCache.ts:19 — `opts.now ?? (() => performance.now())`
- G/api/test/tile-grant-cache.test.ts:92-108 — cas Date.now −600 s → reload après TTL
## Vérifié comment
- `npx vitest run test/tile-grant-cache.test.ts` → `Test Files 1 passed (1)` · `Tests 13 passed (13)`
- contre-épreuve :19 remis à `Date.now` → `× ... sans now injecté : Date.now reculé de 600 s ...` · `Tests 1 failed | 12 passed (13)` ; puis restauré
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · exit=0
- `npm --prefix api test` → `Test Files 100 passed (100)` · `Tests 894 passed (894)` (893 + 1)
- `git -C G diff --stat -- api` → `tileGrantCache.ts | 5 +++--` · `tile-grant-cache.test.ts | 18 +++` · `2 files changed`
- `git -C G diff --stat` global → +web/src/viewer/loaders/TilesRendererLoader.ts, web/src/viewer/ui/qualityHud.ts : sale avant T018, non touchés
## Écarts
- ∅ (lecture W/ verif-t017-cache.test.ts = WL L)
## Pour la suite
- test mocke `performance.now` + `Date.now` via vi.spyOn ; restaurés en finally
- `performance.now()` = ms flottantes ; `at` stocké flottant, `<=` inchangé
- commit à faire par le chef : 2 fichiers api/ seulement (web/ sale hors T018)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
