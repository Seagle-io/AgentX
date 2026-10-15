---
tache: T010
statut: fait
---
## Livré
- `G/api/src/tileMetrics.ts:6-7,14` — doc abandon 499 ; `TILE_ABORT_STATUS = 499`
- `G/api/src/tileMetrics.ts:108` — 499 → jamais `tile 4xx` ; slow si lent
- `G/api/src/tileMetrics.ts:125-136` — `TileAbortReplyLike`, `onRequest`, `ReqTimes.done`, `OutcomeSink`
- `G/api/src/tileMetrics.ts:152-175` — `recordOutcome` (factorisé) + `watchAbort` ('close' sans 'finish')
- `G/api/src/tileMetrics.ts:197-215` — onRequest → watchAbort ; onResponse no-op si `done`
- `G/api/src/server.ts:741` — `onRequest: tileMetrics.onRequest,` (1 ligne)
- `G/api/test/tile-metrics.test.ts:3-10,108-117,236-320` — 499 tileLogLine ; listenApp ; 3 cas HTTP réels
## Vérifié comment
- `npm --prefix api run typecheck` → exit 0
- `npm --prefix api test` (×2, final) → `Test Files 99 passed (99)` / `Tests 873 passed (873)`
- `npx vitest run test/tile-metrics.test.ts -t abort` → `Tests 3 passed | 22 skipped (25)`
- mutation close→return : `-t abort` → `Tests 2 failed | 1 passed` (les 2 abandons)
- mutation sans garde 'finish' : `tile-route-logs` → `2 failed` (200 inject comptés 499)
- `rg -n "req\.(query|url)" api/src/tileMetrics.ts` → ∅ (exit 1) ; `wc -l` → 231 ; plus longue fn `registerTileMetrics` 54 l
- `git -C G diff --stat -- api/src/server.ts` → `1 file changed, 1 insertion(+), 1 deletion(-)`
- `git -C G status --short -- api/` → `M server.ts` `M tileMetrics.ts` `M test/tile-metrics.test.ts`
## Écarts
- contrat `writableFinished` remplacé par écoute `'finish'` — light-my-request 6.6.0 ne le positionne pas
  - preuve : avec `writableFinished`, `tile-route-logs.test.ts` → `{'499':3}` au lieu de `{'200':3}` (inject : 'close' avant onResponse, writableFinished=false)
  - type : `once(ev: 'close' | 'finish', cb)` au lieu de `once('close') + writableFinished`
- lecture hors WL 1: `api/node_modules/light-my-request/lib/response.js:100-150` — cause du faux 499
- `tileLogLine` 499 → `tile 4xx` attendu à `tile-metrics.test.ts:111` (ancien) : remplacé par 498 + cas 499 dédié
- repro T008 (W/, L) non relancée telle quelle : assertion `responses===1` (onResponse) reste fausse par design ; 2 cas repris en assertions sur snapshot
- flake hors périmètre : `tile-route-logs.test.ts:47` « 200 rapide → 0 ligne » KO 3/9 runs complets (sql 43-54 ms ≥ TILE_SLOW_MS 50, load avg 24-28) ; baseline 3/3 OK, patch 6/9 OK ; chemin 200 inchangé
- lignes `server.ts` voisines / `web/` modifiés par un autre agent : non touchés
## Pour la suite
- `tile-route-logs.test.ts:47` flaky sous charge : seuil 50 ms vs sql pg-mem ~50 ms → relever TILE_SLOW_MS du test ou horloge injectée
- abandon après `res.end()` mais avant flush ('finish' jamais émis, onResponse jamais appelé) → compté 499 ; voulu
- tout hook `onRequest` tile ajouté doit garder `m.onRequest` en tête (listener 'close' de comptage)
- `Outcome`/`recordOutcome` = point unique total/status/slow/log : y brancher tout futur statut pseudo
- vérif possible : `npx vitest run test/tile-metrics.test.ts -t abort` (HTTP réel, ~100 ms, 0 timer)
## Retour sur le pack
- Manquait: light-my-request (inject) ne positionne pas `writableFinished` → contrat imposé faux sous inject ; `tile-route-logs.test.ts` (consommateur de tileMetrics) absent de la WL
- Inutile: `hooks.d.ts:600-660` (onRequestAbort écarté par le pack lui-même)
