---
tache: T007
statut: fait
---
## Fait
- V/core/pixelRatio.ts:1-11 — neuf, `effectivePixelRatio(dpr)` fini>0 ⇒ dpr sinon 1, 0 plafond
- V/core/pixelRatio.test.ts:1-19 — neuf, 1·2·3·2.625 ⇒ identité ; 0·NaN·undefined ⇒ 1
- V/core/SceneManager.ts:14 — import effectivePixelRatio
- V/core/SceneManager.ts:139-144 — champs `dprQuery`, `onDprChange` (handleResize puis réarmement)
- V/core/SceneManager.ts:188 — setPixelRatio(effectivePixelRatio(dpr)), plafond ×2 retiré
- V/core/SceneManager.ts:549-557 — `watchPixelRatio()` : matchMedia `(resolution: <dpr>dppx)` change, appelé fin constructeur
- V/core/SceneManager.ts:579-582 — handleResize relit dpr, setPixelRatio si ≠, avant setSize/onViewportResize
- V/core/SceneManager.ts:1012-1013 — togglePerspective émet `glr:active-camera` {camera, previous: prevCam}, 1×/bascule (couvre :973 et :984)
- V/core/SceneManager.ts:1940-1941 — dispose retire l'écouteur matchMedia
- V/loaders/TilesRendererLoader.ts:208-217 — `activeCamera` + écouteur : deleteCamera(previous), setCamera(camera)
- V/loaders/TilesRendererLoader.ts:292,295 — `lastPose: Float64Array | null`, `pose = new Float64Array(32)`
- V/loaders/TilesRendererLoader.ts:723-727 — pose lue sur activeCamera ; cast local vers poseChanged
- V/loaders/TilesRendererLoader.ts:764 — setResolutionFromRenderer(activeCamera, renderer)
- V/loaders/TilesRendererLoader.ts:772 — dispose retire l'écouteur `glr:active-camera`
- RenderModeManager.ts:88-92 — aucune modif (relit déjà getPixelRatio)
## Vérifié comment
```
cd G/web && npm run typecheck
> tsc --noEmit -p tsconfig.json
EXIT=0
```
tsconfig.json exclut src/viewer ⇒ typecheck du viewer en plus :
```
npx tsc --noEmit -p tsconfig.viewer.json   (avant cast)
src/viewer/loaders/TilesRendererLoader.ts(725,21): error TS2345: Argument of type 'Float64Array<ArrayBufferLike> | null' is not assignable to parameter of type 'number[] | Float32Array<ArrayBufferLike> | null'.
npx tsc --noEmit -p tsconfig.viewer.json   (après cast)
EXIT=0
```
```
npx vitest run src/viewer/core/pixelRatio.test.ts
 ✓ src/viewer/core/pixelRatio.test.ts (2 tests) 5ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
npm test
 Test Files  190 passed (190)
      Tests  1793 passed (1793)
```
- test pur échange caméra : NV — logique 3 lignes inline ; 0 fichier test loader en WL
- comportement navigateur (bascule ortho, gel, dpr) : NV — pas de banc lancé
## Écarts
- lecture hors WL: V/core/errorTargetRefine.ts:25-35 — vérifier poseChanged runtime sur prev Float64Array (index + eps absolu 1e-6)
- élargir `lastPose` ne suffit pas : prev de poseChanged typé `Float32Array | number[] | null` ⇒ cast `refine.lastPose as unknown as Float32Array | null` au site d'appel (:727) ; errorTargetRefine.ts non modifié, 0 Array.from
- npx tsc -p tsconfig.viewer.json lancé (hors liste outils) — seul moyen de typer src/viewer
## Pour la suite
- banc T035-D1 : touche `5` puis drag ⇒ transitions `[motion-gate]` attendues ; dézoom ortho 9 km ⇒ histogramme LOD bouge
- EDLRenderer.resize(w,h) ignore le pixel ratio : renderTarget en px CSS ≠ drawing buffer (dpr>1) — à traiter
- TopViewMapCapture.ts:230 réassigne `sceneManager.camera` sans événement (restauration capture) — loader garde sa caméra active, OK si temporaire
- dpr sans plafond : ×3 ⇒ 2,25× pixels vs ×2 — banc doit mesurer fps/VRAM sur écran haute densité
- signature poseChanged à élargir (`ArrayLike<number> | null`) pour retirer le cast — tâche errorTargetRefine
## Retour sur le pack
- Manquait: tsconfig.json exclut src/viewer ⇒ `npm run typecheck` ne vérifie rien du viewer ; commande `npx tsc -p tsconfig.viewer.json` à nommer ; signature réelle de poseChanged (prev) incompatible Float64Array
- Inutile: ∅
