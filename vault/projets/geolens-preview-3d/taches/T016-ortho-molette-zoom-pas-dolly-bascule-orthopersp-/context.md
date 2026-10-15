---
pack: T016
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T016 — Ortho : molette = zoom ; bascule ortho↔persp à échelle conservée ; EDL à la densité réelle

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Deux bugs d'affichage de la preview 3D. (A) En vue ortho, la molette et le bouton droit font un DOLLY (déplacement caméra) alors que l'échelle ortho ne dépend que de `camera.zoom` (figé à 1) ⇒ le zoom ne zoome pas, et la caméra traverse le modèle (coupe near). Corriger : en ortho, ces actions = ZOOM camera-controls ; la bascule conserve l'échelle visible dans les deux sens. (B) `EDLRenderer` rend sa cible en px CSS ⇒ nuages de points EDL flous si dpr > 1. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] `V/core/navigationScheme.ts` : fonction pure `export function controlsActionFor(a: NavAction, ortho: boolean): 'truck' | 'rotate' | 'dolly' | 'zoom'` — `'dolly'` + ortho ⇒ `'zoom'`, sinon `a` ; tests dans `navigationScheme.test.ts` (2 modes × ortho/persp)
- [ ] `SceneManager.applyNavigationScheme()` (rg `private applyNavigationScheme`) : ortho = `(this.camera as { isOrthographicCamera?: boolean }).isOrthographicCamera === true` ; map via `controlsActionFor` ; `'zoom'` ⇒ `CameraControls.ACTION.ZOOM`
- [ ] `rebindControlsToActiveCamera()` (rg `public rebindControlsToActiveCamera`) : `touches.two` = ortho ? `ACTION.TOUCH_ZOOM_TRUCK` : `ACTION.TOUCH_DOLLY_TRUCK`
- [ ] `togglePerspective()` P→O (rg `PERSPECTIVE → ORTHOGRAPHIC`) : `orthoCamera.zoom = 1` avant `updateProjectionMatrix` (une 2e entrée en ortho repart à l'échelle de la persp, pas du zoom précédent) ; après rebind : `controls.minZoom = H / 20000`, `controls.maxZoom = H / 0.5` avec H = hauteur visible (`height` calculée) — mêmes bornes que minDistance 0,5 / far
- [ ] `togglePerspective()` O→P : distance = `((top − bottom) / zoom) / (2·tan(fov/2))` ; position persp = `target + normalize(pos − target) × distance` (même direction de vue) ; ⇒ même échelle visible à ±2 % au centre ; `controls.setTarget` inchangé
- [ ] (B) `EDLRenderer.resize(cssW, cssH)` : `pr = this.renderer.getPixelRatio()` ; renderTarget + depthTexture = `floor(css × pr)` ; uniform `resolution` = taille CSS (texelSize = edlRadius / resolution reste en espace UV ⇒ rayon visuel EDL inchangé) ; constructeur idem (`renderer.getSize` = CSS) ; SceneManager onContextRestored (rg `onContextRestored`) passe la taille CSS (`renderer.getSize(new THREE.Vector2())`) au lieu de `domElement.width/height` (physique ⇒ double compte)
- [ ] test pur si extractible (ex. `edlTargetSize(cssW, cssH, pr) → { w, h }` exporté d'EDLRenderer.ts ou d'un module `V/core/edlSize.ts`) : dpr 1/2/2,625 ; ≥ 1
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npx vitest run src/viewer/core` vert · `npm test` vert (dernier compte 193 fichiers / 1816 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/core/navigationScheme.ts` | E | controlsActionFor |
| `V/core/navigationScheme.test.ts` | E | tests |
| `V/core/SceneManager.ts` | E | :505-530 onContextRestored ; :965-1015 togglePerspective ; :1025-1070 rebind + applyNavigationScheme |
| `V/core/EDLRenderer.ts` | E | :105-135 constructeur ; :181-190 resize |
| `V/core/edlSize.ts` + `.test.ts` | E (neuf, optionnel) | taille cible pure |
| `G/web/node_modules/camera-controls/dist/index.d.ts` | L | :20-60 ACTION ; :280-290 minZoom/maxZoom ; :355-380 tableau mouseButtons |

## Contrats
camera-controls 3.1.2 (index.d.ts) : `ACTION.DOLLY`, `ACTION.ZOOM: 32`, `ACTION.TOUCH_ZOOM_TRUCK: 65536`, `ACTION.TOUCH_DOLLY_TRUCK` ; `minZoom: number; maxZoom: number; dollyToCursor: boolean` ; doc :370 « `ZOOM` for Orthographic camera, and can't set `DOLLY` » ; `dollyToCursor = true` (SceneManager:252) s'applique aussi au zoom.
navigationScheme.ts actuel :
```ts
export type NavAction = 'truck' | 'rotate' | 'dolly';
export interface NavMouseButtons { left: NavAction; middle: NavAction; right: NavAction; wheel: NavAction }
export function navigationSchemeButtons(scheme): NavMouseButtons  // mode1 { left:'truck', middle:'rotate', right:'dolly', wheel:'dolly' } ; mode2 { left:'rotate', middle:'truck', right:'dolly', wheel:'dolly' }
```
SceneManager actuel :
```ts
private applyNavigationScheme(): void { const table = navigationSchemeButtons(this.navigationScheme); const A = CameraControls.ACTION;
  const toAction = (a: 'truck' | 'rotate' | 'dolly') => a === 'truck' ? A.TRUCK : a === 'rotate' ? A.ROTATE : A.DOLLY;
  this.controls.mouseButtons.left = toAction(table.left); /* middle, right, wheel idem */ }
// rebindControlsToActiveCamera : dispose ; new CameraControls(this.camera, this.canvas) ; recopie draggingSmoothTime, smoothTime, dollyToCursor, min/maxDistance, maxPolarAngle, vitesses ; applyNavigationScheme() ; touches.one = TOUCH_ROTATE ; touches.two = TOUCH_DOLLY_TRUCK
// togglePerspective : aspect = canvas.clientWidth/clientHeight ; pos = prevCam.position ; target = this.cameraTarget ; dist = pos.distanceTo(target)
//   P→O : vFov = fov·π/180 ; height = 2·tan(vFov/2)·dist ; width = height·aspect ; ortho left/right/top/bottom ; near 0.1 far 50000 ; position.copy(pos) ; lookAt(target) ; updateProjectionMatrix
//   O→P : persp aspect, near 0.1, far 50000, position.copy(pos), lookAt(target), updateProjectionMatrix
//   puis rebindControlsToActiveCamera() ; controls.setTarget(target, false) ; edlRenderer.camera = camera ; dispatch 'glr:active-camera'
// handleResize ortho : frustum = |top − bottom| conservé, left/right = ±frustum·aspect/2 (zoom intact : OK)
```
EDLRenderer actuel : constructeur `size = renderer.getSize(new THREE.Vector2())` (CSS) ⇒ initW/H ⇒ DepthTexture, WebGLRenderTarget, uniform `resolution` ; shader `vec2 texelSize = edlRadius / resolution;` ; `resize(width, height)` : RT.setSize, depthTexture.image.width/height, needsUpdate, `resolution.set(w, h)`. Appels : SceneManager handleResize `edlRenderer.resize(w, h)` (w,h = parent.clientWidth/Height, CSS ; setPixelRatio(dpr) fait AVANT) ; onContextRestored `resize(domElement.width, domElement.height)` (physique).
Mouvement : la pose du gel = matrixWorld + projectionMatrix ⇒ un zoom ortho compte comme mouvement (rien à faire).

## Décisions actées
- D1 dpr réel sans plafond ; minDistance 0,5 m (crash ArcelorMittal) ⇒ maxZoom équivalent 0,5 m de hauteur visible
- boutons +/− de la barre (main.ts:2470-2478 `controls.dolly`) : hors périmètre, main.ts gelé (noté pour la suite)

## Hors périmètre
- main.ts, TilesRendererLoader.ts, Lcc2*, viewer.html (T015 en parallèle) ; near/brouillard (H14, décision humaine) ; TopViewMapCapture.ts ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (T007 a modifié SceneManager : pixelRatio, glr:active-camera) — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer) ; vitest env node, 0 jsdom ; fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`
- SceneManager.ts = 1971 l : lire par plages (sed -n), pas en entier

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T016
statut: fait | bloque
---
## Fait
- chemin:L — quoi
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes (ce que le banc doit observer)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
