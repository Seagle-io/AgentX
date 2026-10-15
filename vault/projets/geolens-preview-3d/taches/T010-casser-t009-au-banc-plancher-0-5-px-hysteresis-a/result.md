---
tache: T010
statut: fait
verdict: DÉFAUTS
tags: [result]
---
## Mesures avant/après
Banc : T=/tmp/t010-030t, OUT=$T/out, DEPTH=6 TEX=512 (1365 glb), GPU réel (`GPU=1`, vulkan) — SwiftShader non convergent (load 51-59/16 cœurs, stable > 150 s, 320 tuiles PARSING). AVANT=HEAD, APRÈS=arbre de travail. GPU réel ⇒ tier discrete natif ; preset forcé `glr.settings.v1`.
Pose ≠ : AVANT entrée dist 255,08 → 32,78 après ZOOM=4 ; APRÈS 332,72 → 42,76 (cadrage HEAD ≠ arbre) ⇒ comparer histogrammes, pas pixels.

| id | métrique | avant | après |
|---|---|---|---|
| H6 std z4 | ET final 15 s | 0.75 | **4** (attendu 0.5) |
| H6 std z4 | histo profondeur visibles | {5:379} | {4:83, 5:91} |
| H6 std z4 | ratio cache / max MiB | 0.85 / 1280 | 0.85 / 1280 |
| H6 std z4 | req glb après arrêt (15 s) | 245 | 29 |
| H6 haute (STUB) | ET final / histo | 0.75 / {5:379} | **2** / {4:31, 5:295} |
| H6 haute | ratio · req après arrêt | 0.851 · 98 | 0.851 · 96 |
| H6 maximale (STUB) | ET final / histo | 0.75 / {5:379} | 0.5 / {4:26, 5:920} |
| H6 maximale | ratio · req après arrêt | 0.728 · 56 | 0.728 · 0 |
| H1 600 Mo | changements ET /250 ms, 150 s | 0 (0.75 fixe) | 3 : 4→2 (5,8 s) →0.5 (7,3 s) →4 (13,5 s, r 0.851) puis 4 figé 136 s |
| H1 600 Mo | ratio max · final · tc final | 1.002 · 1.002 · 442 | 0.895 · 0.851 · 397 |
| H1 600 Mo | plus long gel tileCount | 143,7 s (dès 6,2 s) | 136,2 s (dès 13,5 s) |
| H1 1280 (std défaut) | ET | — | 0.5 → 4 à 25,3 s, figé 124,5 s, r 0.85 |
| H4 std z4 rasante | anisotropy textures tuiles | 436/436 = 1 | 223/223 = 16 |
| H4 | max GL · élévation · fps | 16 · 10,5° · 60.1 | 16 · 10,4° · 53.5 |
| H15 1×503 feuille t/5_10_10 | `[tile-retry]` | ∅ | relance n°1 à +2016 ms du 503 |
| H15 | requêtes tuile (route) | 1 | **1** (0 re-requête en 19 s ; 39 s run diag) |
| H15 | `__loadingState` final | -1 (FAILED) | **0** (UNLOADED, attendu 3) |
| H15 | rendu | trou (frères visibles, parent caché) | parent 4_5_5 affiché à la place (damier grossier), feuille jamais rechargée |
| H15 1×503 t/4_5_5 | état final · hits | — | 0 · 1 |
| H15 503 permanent 200 s | relances · hits | — | 1 · 1 (backoff 2/4/8… jamais exercé) |
| gel D24 | drag 6 s pendant chargement | — | maxJobs 0 sur 22/22 éch., 0 req glb |
| gel | drag 25 s, 503 perm actif | — | 0 `[tile-retry]`, 0 hit tuile |
| tous runs | pageerror · statuts /storage/ | 0 · 200 + 404×6 | 0 · 200 + 404×6 (+503 injectés) |

404×6 = JSON optionnels (multi-pack.json ×4, presentation.json, camera_params.json), identiques AVANT/APRÈS, hors tuiles.

## Défauts
- D1 (BLQ H6/H1) · garde cache bloquée à vie : `TilesRendererLoader.ts:262` `minBytes = maxBytes*0.85` ; lib `LRUCache.js:342` n'évince jamais sous `minBytesSize` ; `errorTargetRefine.ts:43` ne débloque que `< 0.8×max` ⇒ après un passage à ≥ 0,9, cache plancher 0,85 > 0,8 ⇒ `guardBlocked` reste vrai toute la session ⇒ ET = base preset.
  · repro : `SCEN=h1 PRESET=standard GPU=1 DUR=150000 node $T/probe.mjs` (sans TILECACHE) · attendu ET 0.5 à l'arrêt · obtenu ET 0.5→4 à 25,3 s, 4 pendant 124,5 s, r 0.85. Idem `TILECACHE=600` (4 dès 13,5 s), `PRESET=haute` (ET 2, r 0.851).
  · impact : tout tileset > 0,9 × budget ⇒ arrêt plus grossier qu'AVANT (std : {4:83,5:91} vs {5:379} ; ET 4 vs 0.75). Oscillation supprimée par blocage permanent, pas par hystérésis. Tests unitaires ∅ couplage minBytes.
- D2 (BLQ H15) · relance sans effet : `TilesRendererLoader.ts:745` `resetFailedTiles()` remet FAILED→UNLOADED, mais lib `TilesRendererBase.js:708-709` garde la tuile échouée dans le LRU (`setLoaded`) ⇒ `requestTileContents` → `lruCache.add` (`LRUCache.js:88` `itemSet.has` → false) → `TilesRendererBase.js:662` return ⇒ 0 requête.
  · repro : `SCEN=h15 FAILTILE=t/5_10_10.glb GPU=1 DUR=50000 LABEL=diag node $T/probe.mjs` · attendu 2e requête ~+2 s, `__loadingState` 3 · obtenu 1 hit, log `relance n°1`, puis état 0 pendant 39 s avec `__lastFrameVisited == frameCount`, `isFull()` false, maxJobs 12, items 1365/16000.
  · conséquence : trou AVANT remplacé par le parent (allChildrenLoaded faux sur UNLOADED) ; détail feuille perdu ; backoff 2/4/8…/60 s jamais atteint (failed=0 après reset, aucune ré-échec). Correctif probable : `lruCache.remove(tile)` avant/au lieu de reset — NV.
- D3 (mineur, banc) · « même pose » AVANT/APRÈS impossible : HEAD et arbre cadrent l'entrée différemment (dist 255,08 vs 332,72) ⇒ PNG H6/H4 non superposables.

## Vérifié comment
```
cd G/web && npx tsc --noEmit -p tsconfig.viewer.json → tsc_exit=0
cd G/web && npx vitest run src/viewer/core → Test Files 19 passed (19) · Tests 124 passed (124)
git -C G diff errorTargetRefine.ts / failedTileRetry.ts / tileTextureQuality.ts → ∅ (fichiers non suivis, lus en entier)
git -C G diff TilesRendererLoader.ts → 297 lignes relues (import, refine, applyAnisotropy load-model, stepFailedTileRetry, refineGuard)
h1-apres-std600 → changementsET 3, etValeurs [4,2,0.5], ratioMax 0.895, etFinal 4, rFinal 0.851, figeMaxMs 136248
h1-apres-std → changes [{5794,4→2},{7290,2→0.5},{25272,0.5→4,r 0.85}], figeMaxMs 124500
h1-avant-std600 → changementsET 0, etValeurs [0.75], ratioMax 1.002, figeMaxMs 143743
h6-apres-std-z4 → entree ET 4 r 0.85 min 1088 max 1280 ; final ET 4 histo {4:83,5:91}
h4-apres-std → {'texturesTuiles': 223, 'histoAnisotropy': {'16': 223}, 'maxAnisotropyGL': 16} fps 53.5
h4-avant-std → {'texturesTuiles': 436, 'histoAnisotropy': {'1': 436}, 'maxAnisotropyGL': 16} fps 60.1
h15-apres-leaf3 → hits [9029] ; [(11057,'[tile-retry] relance n°1 (1 tuiles)')] ; tuileZoom {loadingState 0, parentVisible True, sibVisible [F,F,F,F]}
h15-avant-leaf3 → hits [10443] ; tuileZoom {loadingState -1, parentVisible False, sibVisible [F,T,T,T]}
h15-apres-leaf-diag → dt 12090..50259 : st 0, lfv==fc, full False, items 1365, jobs 12, failed 0
gel-apres → drag1 {req 0, jobsVals [0], jobsZero 22, jobsN 22} ; drag2 {ms 25493, req 0, failHits [], retryLogs []}
kill 1542578 1605182 ; ss -ltn | grep -E ':(4016|5186)\b' → ∅ (exit 1)
git -C G status --short web/dist | wc -l → 0
```
Sonde : `/tmp/t010-030t/probe.mjs` (SCEN h6|h1|h4|h15|h15perm|gel ; GPU=1).
JSON/PNG `/tmp/t010-030t/out/` :
- H6 : `t010-h6-{apres,avant}-{std-z4,haute,max}.json` + `-arret15s.png`, `-arret15s-crop.png` ; `t010-h6-apres-std-zout.json`
- H1 : `t010-h1-apres-std600.json`, `t010-h1-apres-std.json`, `t010-h1-avant-std600.json`
- H4 : `t010-h4-{apres,avant}-std.json`, `-rasante.png`, `-rasante-crop.png`
- H15 : `t010-h15-avant-leaf3-final.png` (trou visible ~1099,574), `t010-h15-apres-leaf3-tuile-zoom.png` (parent grossier au centre), `t010-h15-apres-leaf-diag.json`, `t010-h15-apres.json` (4_5_5), `t010-h15perm-apres-leaf.json`
- gel : `t010-gel-apres.json`

## Écarts
- lecture hors WL : `G/web/node_modules/3d-tiles-renderer/src/utilities/LRUCache.js` (L60-100, L240-372) — prouver plancher minBytes et add dupliqué
- lecture hors WL : `G/web/node_modules/3d-tiles-renderer/src/base/TilesRendererBase.js` (L236-325, L601-712) — resetFailedTiles, requestTileContents
- lecture hors WL : `G/web/node_modules/3d-tiles-renderer/src/base/traverseFunctions.js` (L1-92, L290-380) — conditions de mise en file
- lecture G hors table : `TilesRendererLoader.ts` L250-330, diffs SceneManager/main/qualityHud — DoD relecture diff
- banc GPU réel au lieu de SwiftShader — charge machine 51-59, SwiftShader non stable en 150 s
- H15 tuile feuille t/5_10_10 en plus de 4_5_5 — 4_5_5 non affichée en maximale (feuilles chargées)

## Pour la suite
- D1 : aligner seuil de déblocage sur LRU (débloquer < minBytes ratio, ou garde sur `isFull()`/octets utilisés) + test liant 0.85 et 0.8
- D2 : `lruCache.remove(tile)` pour les tuiles FAILED avant relance, test e2e « 2e requête après 503 »
- bench-tileset : couleur 5 ≠ 4 (violet partagé) pour lire le LOD 5 sur capture
- probe : pose caméra imposée (setter `__glrTest`) pour PNG AVANT/APRÈS superposables
## Retour sur le pack
- Manquait : `git diff` vide sur les 3 modules (non suivis) ⇒ préciser « lire en entier » ; lib 3d-tiles-renderer 0.3.46 (LRU minBytes, resetFailedTiles) absente de la WL alors que H1/H15 en dépendent ; cadrage d'entrée HEAD ≠ arbre (pose non comparable) ; banc GPU comme défaut vu la charge
- Inutile : ∅
