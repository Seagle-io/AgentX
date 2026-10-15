---
tache: T014
statut: fait
verdict: OK
tags: [result]
---
## Mesures
Build NEUF `/tmp/t014-9uFn/dist-apres` (bundle contient `action==="arm"`), GPU RTX 4070 Ti, preset standard, API 4018 / web 5188.

| métrique | T012 (avant T013) | après |
|---|---|---|
| D1 reprise balayage : purge n | 128 / 129 | 0 / 0 (q=162 → 162 utilisées) |
| D1 purgées redemandées (≤ 2 s) | 128/128, 129/129 (39–637 ms) | ∅ (0 purgée) |
| D1 purgées `__used` au repos | 128, 129 | ∅ |
| D1 seuil à la purge | et=4 | et=0,5 |
| purge phase dolly : n · inF · redemandées · used repos | 24 · 0 · 0 · 0 | 23 · 0 · 0 · 0 / 24 · 0 · 0 · 0 |
| pan + dolly arrière (4 crans pendant gel) : purge | — | 0 ; q=281 → 281 used repos, 0 inutile |
| H9 inutiles dolly | 0/317 | 0/318, 0/317 |
| H9 inutiles orbite | 0/162 | 0/162, 0/162 |
| H9 inutiles pan | 0/172 | 0/172 |
| H11 ET 0,5 après up | — | 1049 ms, 1071 ms |
| H11 net après up | 2,56 s | 2041 ms, 2032 ms |
| gel D24 maxJobs pendant drag | 0 | {0} 4/4 runs, 0 requête en drag |
| H15 503 : 2e requête | +2 s | +2018 ms |
| pageerror | 0 | 0 (5/5 runs) |

## Défauts
- ∅

## Vérifié comment
- `BASE=http://localhost:5188 OUT=out LABEL=r1 PRESET=standard DOLLY=5 node bench-rm.mjs && node rm.mjs out/t003-r1.json` → `{"atAfterUp":-11833,"m":"purge 23 tuiles hors vue","n":23,"etAtPurge":[0.5],"inF":0,"reRequested":0,...,"usedAtRest":0,"visAtRest":0}` ; seule purge ; gate `1049 reprise q=162 et=0.5`, 0 ligne purge après up
- idem `LABEL=r2` → `{"atAfterUp":-11811,"m":"purge 24 tuiles hors vue","n":24,"etAtPurge":[0.5],"inF":0,"reRequested":0,...,"usedAtRest":0}` ; gate `1072 reprise q=162`
- `node analyse.mjs out/t003-r{1,2}.json storage` → sweep `h9.notUsedRest15:0 of:162`, `h11.netAfterUpMs:2041|2032`, `et:[[-6050,4],[1049,0.5]]`, dolly `notUsedAtNet:0 req:318|317`
- pan (`bench-rm2.mjs` = bench-rm + BACK crans molette +240 après up, souris recentrée) `LABEL=panback BUTTON=left` → `586 reprise q=172`, 0 purge ; analyse `notUsedRest15:0 of:172`
- `LABEL=panback2 BUTTON=left BACK=4` → cam repos `[79.8,99.7,198.8]` (≠ fin drag `[-31.7,19.5,85.6]`) ; `1385 reprise q=281` (q=90 et=4 avant arm → 281 après traversée et=0,5) ; 0 purge ; `notUsedRest15:0 of:281`, `outFrustumRest:0`
- gel : samples `down+600 → up` → `mj set [0]`, `req in drag 0` (r1, r2, panback, panback2)
- `BASE=http://localhost:5188 OUT=out SCEN=h15 LABEL=h15 GPU=1 PRESET=standard node probe.mjs` → `failHits [5943,7961] gaps [2018] pageErrors 0` ; log `[tile-retry] relance n°1 (1 tuiles)` ; tuile finale loadingState 3
- `gateStep` table de vérité (tsx, 8 états) → conforme au contrat ; séquence `T,F,F,T,F,T,T,T,F,T,T` → `none,freeze,none,arm,none,arm,resume,none,freeze,arm,resume`
- relecture `TilesRendererLoader.ts:L656-L680` + `L759-L806` : ordre image = gateStep → errorTarget affiné → `update()` ; arm à N ⇒ traversée N au plancher ; resume N+1 ⇒ `staleQueuedTiles(items, LOADING, frameCount)` sur traversée N
- `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo $?` → `tsc exit=0`
- `npx vitest run src/viewer/core/motionGate.test.ts src/viewer/core/staleQueuePurge.test.ts` → `✓ staleQueuePurge.test.ts (7 tests)` `✓ motionGate.test.ts (13 tests)` `Tests 20 passed (20)`
- `kill 1764386 1764367; ss -ltn | grep -E ':(4018|5188)\b'` → ∅ (exit 1)
- G : `git status --short | wc -l` → 39 ; `git diff --stat` → `9 files changed, 280 insertions(+), 106 deletions(-)` (= état initial)
- JSON : `/tmp/t014-9uFn/out/t003-{r1,r2,dpanback,panback,panback2}.json`, `/tmp/t014-9uFn/out/t010-h15.json`

## Écarts
- ∅ lecture hors WL fichier vault
- G lus hors WL (DoD relecture) : `TilesRendererLoader.ts:L636-L830`, `core/staleQueuePurge.ts` — via sed, lecture seule
- script ajouté `$T/bench-rm2.mjs` (BACK) — pan + dolly arrière pendant le gel

## Pour la suite
- HP : image N sans `update()` (œil coupé, canvas 0×0) ⇒ purge sur traversée périmée ; non reproduit
- banc : à et=0,5 la prof. 5 reste utilisée en vue lointaine (inF 1319) ⇒ dolly arrière ne produit pas de tuile inutile ; tester purge > 0 en reprise exige un jeu plus profond
- banc : `dpanback` (dolly arrière avant pan) = 0 requête, inutile
- 7 × console 404 par run (ressource non identifiée), préexistant, NV
- process étranger API PORT=4014 (pid 1554805, scratchpad t006) laissé vivant

## Retour sur le pack
- Manquait: scénario « pan + dolly arrière » non scripté (bench-rm fait dolly avant puis drag ; molette après drag hors canvas car x0+DX > 1920) ; `TilesRendererLoader.ts` hors WL alors que DoD demande sa relecture
- Inutile: ∅
