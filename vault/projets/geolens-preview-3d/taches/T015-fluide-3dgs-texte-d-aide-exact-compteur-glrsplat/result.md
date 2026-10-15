---
tache: T015
statut: fait
---
## Fait
- web/viewer.html:808 — texte d'aide fluide remplacé (verbatim DoD)
- V/index.html:805 — idem, identique
- V/core/splatLodMode.ts:5-6 — commentaire 'fluid' : « chargé une fois au niveau le plus fin, rien ne bouge ensuite » ; 0 code
- V/loaders/lcc2/Lcc2Loader.ts:102-108 — `LiveStreamerInput.engine` ; streamer reçoit le moteur compteur (:115)
- V/loaders/lcc2/Lcc2Loader.ts:122-167 — `export Lcc2SplatStats {opens,loads,frees,lodChanges}` ; `sharedSplatStats()` (window réutilisé si forme complète, sinon neuf ; objet module sans window) ; `countingEngine()` : loadSplat résolu ⇒ loads++, `handle.dispose` enveloppé ⇒ frees++ (1 fois/poignée), lodChanges++ si initialDone && !disposed ; init/dispose/getters délégués
- V/loaders/lcc2/Lcc2Loader.ts:171-175 — `opens++`, phase, `engine = countingEngine(ctx.engine, …)` ; tuiles + env + streamer passent par lui
- V/loaders/lcc2/Lcc2Loader.ts:245,249 — `phase.initialDone = true` avant startLiveStreamer ; `phase.disposed = true` en tête de dispose ; `stats.frees += handles.length` supprimé
- V/loaders/lcc2/Lcc2Loader.test.ts:69-141 — attentes `opens` ; 2 ouvertures ⇒ même objet, `{opens:2,loads:6,frees:4,lodChanges:0}` ; forme incomplète remplacée ; stream réel (rAF stub, performance.now=10000) ⇒ b0,b1 chargés après init `{opens:1,loads:3,frees:0,lodChanges:2}` puis dispose ⇒ `{…,frees:3,lodChanges:2}`
## Vérifié comment
```
cd web && npx tsc --noEmit -p tsconfig.viewer.json; echo "tsc exit $?"
→ tsc exit 0
npx vitest run src/viewer/loaders/lcc2
→ ✓ src/viewer/loaders/lcc2/Lcc2Loader.test.ts (6 tests) 59ms
→ Test Files  5 passed (5)
→      Tests  30 passed (30)
npm test
→ Test Files  194 passed (194)
→      Tests  1826 passed (1826)
rg -n "Affine la scène sous un budget fixe" viewer.html src/viewer | wc -l
→ 0
rg -n "Charge une seule fois toute la scène" viewer.html src/viewer
→ viewer.html:808: … · src/viewer/index.html:805: … (2)
```
## Écarts
- lecture hors WL (1/3): `rg envFile Lcc2Manifest.ts` — test env.sog ; abandonné, contrat manifeste absent
- loadLcc2Scene ≈ 115 l > 60 — préexistant (~110 l), +5 l
- Lcc2Streamer réel pilotable en node ⇒ pas de streamer factice
- splatLodMode.ts non suivi par git ⇒ absent de `git diff`
## Pour la suite
- banc fluid : `__glrSplatStats.lodChanges` 0 après parcours, `opens` +1 par ouverture
- banc stream : lodChanges > 0 dès que le streamer charge/décharge au parcours
- compteur cumulé : comparer avant/après parcours (delta), pas valeur absolue
- loads inclut désormais env.sog (si includeEnv) — fluid T006 15 .sog ⇒ attendre loads incluant env
- loadLcc2Scene > 60 l : découpe à planifier (hors périmètre)
## Retour sur le pack
- Manquait: format manifeste env (`envFile` via index) pour tester env compté · Inutile: ∅
