---
tache: T012
statut: fait
verdict: DÉFAUTS
tags: [result]
---
## Mesures avant/après
AVANT = build T010 (`/tmp/t010-030t/dist-apres`, main-v3466LDa.js : garde isFull, 0 purge) ; APRÈS = arbre de travail (main-DNWeqeOh.js). GPU réel (vulkan), preset forcé, contexte neuf par run, banc 1365 glb DEPTH=6.

| id | métrique | avant | après |
|---|---|---|---|
| D1-600 | ET final · valeurs · nb changements | 4 · {4,2,0.5} · 3 | 0.5 · {4,0.5} · 1 (0.5 dès 4,8 s) |
| D1-600 | ratio max/final · isFull final | 0.863/0.851 · false | 1.002/1.002 · true (567/600 éch.) |
| D1-600 | req /10 s (15 seaux) | [442,0×14] | [580,0×14] |
| D1-600 | req tot / distinctes | 442/442 | 580/580 (0 boucle) |
| D1-600 | histo visible final | {3:63,4:4} | {4:235,5:84} |
| D1-1280 | ET final · changements | 4 · 3 | 0.5 · 3 (entrée 4→0.5→4→0.5, stable dès 4,8 s) |
| D1-1280 | ratio final · isFull | 0.85 · false | 1.001 · true |
| D1-1280 | req /10 s | [826,378,0×13] | [943,273,0×13] |
| D1-1280 | req/distinctes · chargées | 1204/1204 · 797 | 1216/1216 · 938 |
| D1-1280 | histo visible final | {3:63,4:4} | {4:113,5:572} |
| D2 1 échec std | hits 5_10_10 | 1 (+17,7 s seulement après zoom) | 2 : 503 puis +2044 ms 200 |
| D2 1 échec max | hits · état à 14 s | — | +2075 ms · LOADED 3 visible |
| D2 1 échec std | état final 30 s | 0 | 0 (= témoin sans échec : 0, cache plein) ; après zoom 3 visible |
| D2 perm max 200 s | écarts entre hits (ms) | ∅ (1 hit, relance n°1 sans requête, trou parent) | 2057, 4045, 7995, 16014, 32007, 60020, 60012 |
| D2 perm std | écarts | — | 2057 puis arrêt (relance n°2 sans requête : isFull) |
| H9 dolly 5 | inutiles / total | 0/54 (ET 4) · T003 72/512 | 0/317 |
| H9 dolly 5 | file à la reprise · purge | 54 · ∅ | 26 · 24 (0 réutilisée, 0 dans frustum) |
| H9 orbite après dolly | inutiles / total repos 15 s | 0/88 | 0/162 |
| H9 orbite après dolly | purge à la reprise | ∅ | 129 / file 139 — voir défaut D1 |
| H9 pan après dolly | inutiles / total · purge | 0/47 · ∅ | 0/172 · 0 · T003 44/132 |
| H9 | histo repos final dolly / pan | {4:39,5:94} / {4:62,5:86} | {5:243} / {5:321} ; usedInFrustumUnloaded 0 |
| H11 orbite | 1re req après up | 1067 ms | 1044 ms (pan 1186) |
| H11 orbite | ET=0.5 après up | jamais (ET 4) | 1038 ms (pan 1178) |
| H11 orbite | net (dl=pa=q=0, ET 0.5, 3 s) | timeout 45 s | 2560 ms (pan 2320 ; rejoué 1954) |
| gel D24 | drag 6 s à +5 s : maxJobs · req | — | {0} 22/22 · 0 |
| gel D24 | drag 25 s, 503 perm : req · relances | — | 0 · 0 |
| H4 | anisotropie · fps | 223/223 ×16 · 60,1 (T010) | 703/703 ×16 · 60,1 |
| statuts | storage | 200 + 404×6 | 200 + 404×6 + 503 injectés ; 0 pageerror (13 runs) |

## Défauts
- D1 (bas) · purge de la reprise retire des tuiles utilisées · `TilesRendererLoader.ts:665` (purge, appelée `:756`) évalue `staleQueuedTiles` contre la traversée faite à ET base 4 ; `:773-776` passe ET à 0,5 après ; `update()` `:800` les re-file aussitôt
  - repro : banc T012, `OUT=out LABEL=x PRESET=standard DOLLY=5 node $T/bench-rm.mjs` puis `node $T/rm.mjs out/t003-x.json` (hook `lruCache.remove` posé depuis le test)
  - attendu (DoD H9) : aucune tuile utilisée purgée ; log `purge <n> tuiles hors vue` = hors vue
  - obtenu (2/2 + 1 run sans hook : purge 129) : `purge 128` → 128 inFrustum, 128 redemandées +39…506 ms, 128 used / 124 visibles au repos ; `purge 129` → 129/129 redemandées +40…637 ms, 129 used / 125 visibles ; etAtPurge [4]
  - impact : 0 octet perdu (file gelée, jobs non démarrés), log + `__glrMotionGate.purged` faux, ré-enfilage jusqu'à 637 ms ; purge dolly (24, hors frustum) correcte

## Vérifié comment
- `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo $?` → `tsc exit=0`
- `npx vitest run src/viewer/core` → `Test Files 20 passed (20) · Tests 128 passed (128)`
- `git -C G diff web/src/viewer/loaders/TilesRendererLoader.ts` lu ; `errorTargetRefine.ts`, `staleQueuePurge.ts` lus en entier ; conformes au contrat
- `SCEN=h1 PRESET=standard TILECACHE={600,1280} GPU=1 node probe.mjs` (×avant/après) → `$T/out/t010-{avant,apres}-h1-{600,1280}.json` + `-final.png`
- `SCEN=h15 FAILTILE=t/5_10_10.glb` std/max, `FAILN=0` témoin, `SCEN=h15perm DUR=200000` std/max → `t010-*-h15*.json`, `*-tuile-zoom.png` (avant perm max : carreau parent grossier ; après h15 max : uniforme)
- `bench-t003.mjs` (GPU, FLOOR=0.5, PRESET) `DOLLY=5` ±`BUTTON=left` → `t003-{avant,apres}-{dolly5,dpan}-std.json` ; `node analyse.mjs`, `dolly.mjs`, `metr.mjs`
- `SCEN=gel STAB=60000`, `SCEN=h4 ZOOM=3` → `t010-apres-gel.json`, `t010-apres-h4.json`, `-rasante.png`
- `ss -ltn | grep -E ':(4017|5187)\b'` → ∅ ; pids 1640179, 1689401, 1727900 tués ; `git -C G status --short | wc -l` → 39 (inchangé, build en `--outDir $T`)
- T = `/tmp/t012-4kOe` ; sorties `/tmp/t012-4kOe/out/`

## Écarts
- lecture hors WL : `/tmp/t010-030t/dist-apres` copié en `$T/dist-avant` — seul build « état T010 » (pré-T011 non commité) ; identifié par grep `tile-retry`=1, `purge`=0
- lecture hors WL : `G/web/src/viewer/core/failedTileRetry.ts` — expliquer relance n°k sans requête + remise à 0
- banc : sans PRESET le GPU réel → maximale 2560 Mo, 1365 tuiles tiennent, 0 req dolly/pan ⇒ H9/H11 à PRESET=standard ; T003 en SwiftShader ⇒ chiffres T003 non comparables 1:1
- `TILECACHE=4000` plafonné à 1280 en standard (maxMiB 1280)

## Pour la suite
- corriger D1 : purger après la pose de l'ET affiné et une traversée à ce seuil (ou ne purger que `!__inFrustum`)
- cache plein (standard 1280) : 426/1365 req d'ouverture téléchargées puis jetées (16,3/52,3 Mo) ; AVANT 388-443 ⇒ non régressif, coût budget
- backoff remis à n°1 dès qu'une fenêtre passe sans échec (relance sans requête si isFull) ⇒ par mouvement : 1 + 2 relances à 2/4 s ; conforme au code, pas de rafale
- DoD D2 « état final LOADED » non mesurable à std 1280 sur 5_10_10 (témoin sans échec = 0) ⇒ prouver en maximale

## Retour sur le pack
- Manquait : `bench-t003.mjs` codé SwiftShader + `FLOOR = 1` (plancher maintenant 0,5 ⇒ waitNet ne conclut jamais) ; preset par défaut GPU réel = maximale (dataset tient en entier) ; chemin du build AVANT ; paramètres exacts des runs T003 (pan = ? `runs.sh` hors WL)
- Inutile : ∅
