---
tache: T018
statut: fait
---
## Fait
- V/core/motionGate.ts:L42-L52 — `OPENING_INPUT_EVENTS` + `gateMoveStamp` (contrat verbatim)
- V/core/motionGate.test.ts:L2 — import des 2 nouveaux symboles
- V/core/motionGate.test.ts:L62-L85 — 4 tests : liste événements, ouverture ⇒ -Infinity + autorisé, après entrée ⇒ gel 500 ms, immobile ⇒ inchangé
- V/loaders/TilesRendererLoader.ts:L41 — import OPENING_INPUT_EVENTS, gateMoveStamp
- V/loaders/TilesRendererLoader.ts:L648-L667 — `gateLastMoveMs=-Infinity`, `openingExempt=true`, `publishMotionGate`, `endOpening` (exempt=false, stamp=now, retrait écouteurs, log unique, publication)
- V/loaders/TilesRendererLoader.ts:L668-L669 — écouteurs `{capture,passive}` canvas ×3 + window keydown
- V/loaders/TilesRendererLoader.ts:L678 — `loadsAllowed(now, gateLastMoveMs)` remplace `refine.lastMoveMs`
- V/loaders/TilesRendererLoader.ts:L700 — `__glrMotionGate` via publishMotionGate : {allowed, transitions, purged, openingExempt}
- V/loaders/TilesRendererLoader.ts:L780 — sur poseChanged : `gateLastMoveMs = gateMoveStamp(…, true, openingExempt)` ; `refine.lastMoveMs = now` inchangé
- V/loaders/TilesRendererLoader.ts:L835 — dispose : `removeOpeningListeners()`
- inchangés : gateStep, purge, applyDownloadJobs seul écrivain maxJobs, relance échecs, ordre du hook
## Vérifié comment
```
cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo "exit $?" → exit 0
npx vitest run src/viewer/core/motionGate.test.ts →
 ✓ src/viewer/core/motionGate.test.ts (17 tests) 7ms
 Test Files  1 passed (1)
      Tests  17 passed (17)
npm test →
 Test Files  195 passed (195)
      Tests  1838 passed (1838)
```
## Écarts
- ∅ lecture hors WL
- arbre G : `SceneManager.ts` M + `orthoScale.ts`/`orthoScale.test.ts` ?? apparus pendant le run — pas moi (agent parallèle) ; explique 195 fichiers / +8 tests hors des 4 miens
- publication `__glrMotionGate` factorisée en `publishMotionGate` — évite 2 copies de la forme
## Pour la suite
- banc : `[motion-gate] gel` absent avant le log `[motion-gate] ouverture terminée (<type>)`
- banc : `__glrMotionGate.openingExempt === true` et `allowed` vrai pendant fit/accueil cinématique
- banc : 1re entrée ⇒ gel ≥ 500 ms même sans mouvement (entrée = début de mouvement, contrat)
- banc : accueil cinématique « Explorer » = clic canvas ? sinon exemption dure jusqu'au 1er geste 3D
- refine.lastMoveMs initial = performance.now() conservé ⇒ affinage base 500 ms au démarrage (voulu)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
