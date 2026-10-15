---
tache: T016
statut: fait
---
## Fait
- V/core/navigationScheme.ts:29-34 — `controlsActionFor(a, ortho)` : dolly+ortho ⇒ 'zoom'
- V/core/navigationScheme.test.ts:6,44-71 — 4 tests mode1/mode2 × persp/ortho
- V/core/SceneManager.ts:16 — import controlsActionFor, NavAction
- V/core/SceneManager.ts:526-529 — onContextRestored : resize(taille CSS via getSize)
- V/core/SceneManager.ts:991-992 — P→O : orthoCamera.zoom = 1 avant updateProjectionMatrix
- V/core/SceneManager.ts:997-1007 — O→P : dist = (top−bottom)/zoom / (2·tan(fov/2)), même direction
- V/core/SceneManager.ts:1017-1023 — après rebind+setTarget, ortho : minZoom H/20000, maxZoom H/0,5
- V/core/SceneManager.ts:1062-1066 — touches.two ortho ⇒ TOUCH_ZOOM_TRUCK, sinon TOUCH_DOLLY_TRUCK
- V/core/SceneManager.ts:1081-1087 — applyNavigationScheme : ortho ⇒ ACTION.ZOOM via controlsActionFor
- V/core/edlSize.ts:1-8 (neuf) — `edlTargetSize(cssW, cssH, pr)` = floor(css·pr), ≥ 1
- V/core/edlSize.test.ts:1-24 (neuf) — dpr 1 / 2 / 2,625 / 0×0
- V/core/EDLRenderer.ts:8,111-117,127 — constructeur : RT/depth = css·pr ; resolution = CSS
- V/core/EDLRenderer.ts:185-195 — resize(cssW, cssH) : RT/depth physiques ; resolution CSS
## Vérifié comment
```
npx tsc --noEmit -p tsconfig.viewer.json; echo "exit $?" → exit 0
npx vitest run src/viewer/core →
 ✓ src/viewer/core/edlSize.test.ts (4 tests) 4ms
 Test Files  21 passed (21)
      Tests  141 passed (141)
npm test →
 Test Files  194 passed (194)
      Tests  1826 passed (1826)
```
- 1er tsc → exit 2 : 1 erreur Lcc2Loader.ts:246 (LiveStreamerInput.engine, T015 en cours) ; 0 dans mes fichiers ; relance → exit 0
- ±2 % échelle O→P : NV au banc (formule exacte, 0 test WebGL)
## Écarts
- ∅
## Pour la suite
- banc : ortho, molette/droit/pincement zoome vers curseur, 0 traversée du modèle
- banc : P→O→zoom→P→O : 2e ortho repart à l'échelle persp ; O→P échelle centre identique
- banc : maxZoom = 0,5 m de hauteur visible ; minZoom = 20000 m
- main.ts:2470-2478 boutons +/− `controls.dolly` : sans effet en ortho (main.ts gelé)
- banc dpr 2,625 : EDL net, rayon visuel EDL inchangé ; rebind TopViewMapCapture ne pose pas min/maxZoom
## Retour sur le pack
- Manquait: ∅ | Inutile: index.d.ts :280-290 (bornes déjà dans Contrats)
