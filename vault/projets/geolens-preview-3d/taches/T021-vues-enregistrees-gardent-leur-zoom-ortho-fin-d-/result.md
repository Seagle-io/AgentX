---
tache: T021
statut: fait
---
## Fait
V = G/web/src/viewer
- V/ui/savedViewZoom.ts:1-17 — neuf, pur : `isValidZoom` (fini > 0), `flightZoom` (null si !ortho ou zoom absent, sinon start+(saved−start)·e)
- V/ui/savedViewZoom.test.ts:1-38 — neuf, 7 tests (isValidZoom ×3, flightZoom ×4)
- V/ui/savedViews.ts:31 — import flightZoom/isValidZoom
- V/ui/savedViews.ts:66-67 — `SavedView.camera.zoom?: number`
- V/ui/savedViews.ts:101-103 — parse : zoom invalide ⇒ vue gardée, sans zoom ; anciennes vues OK
- V/ui/savedViews.ts:156-157 — flyTo : isOrtho + startZoom au départ du vol
- V/ui/savedViews.ts:181-184 — après setLookAt(…,false) : `void sm.controls.zoomTo(z, false)` si z ≠ null
- V/ui/savedViews.ts:446-449,472 — enregistrement : zoom posé seulement si `isOrthographicCamera === true` (après update(1e3))
- V/core/motionGate.ts:43-52 — `endsOpening(homeOpen) ⇒ !homeOpen` ; doc D7 → document
- V/core/motionGate.test.ts:2,64,87-94 — import, libellé, 2 tests endsOpening
- V/loaders/TilesRendererLoader.ts:41 — import endsOpening
- V/loaders/TilesRendererLoader.ts:655-658 — retrait écouteurs sur document (plus canvas/window)
- V/loaders/TilesRendererLoader.ts:662 — accueil `gx-home-open` ⇒ entrée ignorée, écouteurs gardés
- V/loaders/TilesRendererLoader.ts:669-671 — écoute document (capture, passive) + `publishMotionGate(gateAllowed)` à la création
- inchangé : gateMoveStamp, gateStep, purge, applyDownloadJobs, affinage, SceneManager
## Vérifié comment
```
cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo exit=$?
→ exit=0

npx vitest run src/viewer/core/motionGate.test.ts src/viewer/ui/savedViewZoom.test.ts
→ ✓ src/viewer/ui/savedViewZoom.test.ts (7 tests) 4ms
  ✓ src/viewer/core/motionGate.test.ts (19 tests) 8ms
  Test Files  2 passed (2)
       Tests  26 passed (26)

npm test
→ Test Files  196 passed (196)
       Tests  1847 passed (1847)
```
- navigateur : NV (pas de banc lancé — hors outils autorisés)
## Écarts
- ∅
## Pour la suite
- D1 : `$T/sv.mjs` ⇒ zoom restauré ≈ 44,087, px/m ≈ 128 ; vue perspective inchangée
- D2 : `CASE='view:[data-view="top"]' WAIT=3500 node o3.mjs` ⇒ log `[motion-gate] ouverture terminée (pointerdown)` puis gel pendant l'animation
- D2 : clic « Explorer » (gx-home-open présent) ⇒ PAS de fin d'ouverture ; 1re entrée après dismiss ⇒ fin
- D3 : `__glrMotionGate` défini dès la création du loader, `openingExempt: true`
- zoom interpolé linéairement en `e` (pas en log) — à juger visuellement sur grands écarts
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
