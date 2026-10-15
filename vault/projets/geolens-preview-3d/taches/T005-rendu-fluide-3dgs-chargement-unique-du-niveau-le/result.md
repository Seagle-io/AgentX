---
tache: T005
statut: fait
---
## Fait
- V/loaders/lcc2/Lcc2Loader.ts:18-21 — imports Lcc2FluidStreamer, clampFluidBudget retirés
- V/loaders/lcc2/Lcc2Loader.ts:40-42,75,80 — doc lodMode/streamer alignée sur fluid = chargement unique
- V/loaders/lcc2/Lcc2Loader.ts:92-101 — `selectInitialLevel` fluid ⇒ `levels[length-1]`, overBudget false, reason `fluid : pleine qualité depth=<d>` ; 0 appel budget
- V/loaders/lcc2/Lcc2Loader.ts:110-120 — `startLiveStreamer` : `mode !== 'stream'` ⇒ null ; branche stream inchangée
- V/loaders/lcc2/Lcc2Loader.ts:122-130 — `resetSplatStats()` : `{loads,frees,lodChanges}=0` posé sur `window.__glrSplatStats` si window
- V/loaders/lcc2/Lcc2Loader.ts:133 — reset au début de chaque `loadLcc2Scene`
- V/loaders/lcc2/Lcc2Loader.ts:160 — `stats.loads++` après chaque loadSplat tuile réussi (env exclu)
- V/loaders/lcc2/Lcc2Loader.ts:203-209 — `streamerOwnsBase` supprimé (toujours faux) ⇒ dispose libère tous les handles ; `stats.frees += handles.length`
- V/loaders/lcc2/Lcc2Loader.ts — `baseTiles` (champ LiveStreamerInput, Map, set) supprimé — seul consommateur = fluid retiré
- V/loaders/lcc2/Lcc2Loader.test.ts:1-117 — neuf, 4 tests : fluid (fichiers c0..c3, streamer null, lodDepth 3, 0 load après 2 ticks, compteur 4/0/0 → 4/4/0 après dispose) · reset compteur · fixed budget 500 ⇒ depth 2 · stream ⇒ depth 1 + streamer non null (rAF stubbé)
- G/web/viewer.html:805 — `(LOD adaptatif)` → `(pleine qualité, chargé une fois)`
- V/index.html:802 — idem

## Vérifié comment
```
cd G/web && npm run typecheck >/dev/null 2>&1; echo "typecheck exit=$?"
→ typecheck exit=0

npx vitest run src/viewer/loaders/lcc2
→ ✓ src/viewer/loaders/lcc2/Lcc2Loader.test.ts (4 tests) 103ms
→ Test Files  5 passed (5)
→      Tests  28 passed (28)

npm test
→ Test Files  189 passed (189)
→      Tests  1791 passed (1791)
→ test exit=0

cd G && node scripts/check-viewer-html-sync.mjs; echo "exit=$?"
→ [check-viewer-html-sync] OK — 264 IDs JS vérifiés, les 2 entrées HTML sont synchronisées.
→ exit=0

grep -c "LOD adaptatif" web/viewer.html web/src/viewer/index.html
→ web/src/viewer/index.html:0
→ web/viewer.html:0
```
- base pack 183/1758 ≠ 189/1791 : +1 fichier/+4 tests = T005 ; reste = arbre sale préexistant (NV d'origine)

## Écarts
- lecture hors WL: V/core/splatLodMode.ts:1-30 — union SplatLodMode pour `mode !== 'stream'`
- lecture hors WL: grep V/loaders/lcc2/Lcc2Streamer.ts (start/rAF) — test stream sans DOM ⇒ stub rAF
- faute : fichier parasite `/home/jdrac/Documents/AgentX_placeholder_never_used` créé par erreur puis supprimé aussitôt (`ls` → absent) ; 0 effet
- `baseTiles` retiré en plus du DoD — devenu code mort après retrait fluid

## Pour la suite
- banc fluid : `window.__glrSplatStats` doit rester `loads = nb tuiles depth max` (villelaure 14), `frees 0`, `lodChanges 0` pendant tout mouvement
- console attendue : `[3dgs] LCC2 : fluid : pleine qualité depth=5 — 14 tuiles` ; 7 388 760 splats, pas de repli budget (D4)
- V/index.html:805 + G/web/viewer.html:808 : texte d'aide « Affine la scène sous un budget fixe… fondu… cache » désormais faux — hors périmètre, non touché
- Lcc2FluidStreamer.ts, lcc2FluidMetric.clampFluidBudget : plus importés par le loader ; encore utilisés par lcc2FluidCut.ts / lcc2FluidPolicy.test.ts — candidats suppression (décision architecte)
- curseur détail (streamTargetPx) sans effet en fluid : `result.streamer === null` (D4 acté)

## Retour sur le pack
- Manquait: union `SplatLodMode` (1 ligne) ; `Lcc2Streamer.start()` ⇒ `requestAnimationFrame` (bloque test stream en node) ; texte d'aide sous le libellé (:808/:805) à trancher | Inutile: ∅
