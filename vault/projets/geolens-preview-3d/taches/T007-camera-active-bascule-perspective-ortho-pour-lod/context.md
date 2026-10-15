---
pack: T007
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T007 — Caméra active pour LOD et gel + densité d'écran réelle

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
(1) Après bascule perspective ↔ ortho, le TilesRenderer (LOD, résolution) et la détection de mouvement du gel D24 suivent la caméra ACTIVE, plus la caméra perspective figée au chargement. (2) Le rendu utilise le devicePixelRatio réel (sans plafond ×2) et le relit quand il change. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] SceneManager émet `window.dispatchEvent(new CustomEvent('glr:active-camera', { detail: { camera, previous } }))` à CHAQUE changement de `this.camera` après construction (togglePerspective :973 et :984) — pas à :168 (construction)
- [ ] TilesRendererLoader écoute `glr:active-camera` : `tilesRenderer.deleteCamera(previous)` si présent, `tilesRenderer.setCamera(camera)`, variable locale `activeCamera` utilisée par la pose (:713-714), `setResolutionFromRenderer` (:752) ; écouteur retiré dans `dispose`
- [ ] pose du gel en `Float64Array(32)` (:285) — précision en coordonnées étendues
- [ ] dpr : helper pur `V/core/pixelRatio.ts` `export function effectivePixelRatio(dpr: number | undefined): number` (dpr fini > 0 ⇒ dpr, sinon 1 ; AUCUN plafond) + test node ; SceneManager.ts:181 l'utilise ; `handleResize` relit `effectivePixelRatio(window.devicePixelRatio)` et `setPixelRatio` si différent, AVANT `setSize` et `onViewportResize` ; écoute `matchMedia('(resolution: <dpr>dppx)')` `change` ⇒ `handleResize()` puis réarme sur la nouvelle valeur
- [ ] composer : RenderModeManager.ts:88-92 relit déjà `getPixelRatio()` dans `onViewportResize` ⇒ aucune modif ; EDLRenderer : si `resize(w,h)` ignore le pixel ratio, le noter dans Pour la suite (pas de modif)
- [ ] tests : `V/core/pixelRatio.test.ts` (1, 2, 3, 2.625, 0, NaN, undefined) ; test pur de la logique d'échange de caméra si extractible en fonction (sinon NV justifié)
- [ ] `cd G/web && npm run typecheck` exit 0 · `npm test` vert (dernier compte connu 189 fichiers / 1791 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/core/SceneManager.ts` | E | :174-181 renderer, :541-585 handleResize, :947-990 togglePerspective |
| `V/loaders/TilesRendererLoader.ts` | E | :206-207 setCamera, :285 pose, :708-720 pose/gel, :745-753 update, dispose |
| `V/core/pixelRatio.ts` | E (neuf) | helper pur |
| `V/core/pixelRatio.test.ts` | E (neuf) | tests |
| `V/core/RenderModeManager.ts` | L | :85-93, :196-204 composer |
| `V/core/EDLRenderer.ts` | L | resize |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/node_modules/3d-tiles-renderer/src/three/TilesRenderer.d.ts` | L | setCamera / deleteCamera |

## Contrats
SceneManager actuel :
```ts
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));   // :181, une seule fois
public togglePerspective(): boolean { … const prevCam = this.camera; … this.camera = this.orthoCamera; /* :973 */ … this.camera = this.perspectiveCamera; /* :984 */ … this.rebindControlsToActiveCamera(); … }
private handleResize(): void { … this.renderer.setSize(w, h, true); … this.onViewportResize?.(w, h); }
```
Loader actuel : `tilesRenderer.setCamera(camera); tilesRenderer.setResolutionFromRenderer(camera, renderer);` (:206-207, `camera` = options) ; `const pose = new Float32Array(32);` (:285) ; hook : `pose.set(camera.matrixWorld.elements, 0); pose.set(camera.projectionMatrix.elements, 16); if (poseChanged(refine.lastPose, pose)) { refine.lastMoveMs = now; refine.lastPose = pose.slice(); } updateMotionGate(now);` ; `tilesRenderer.setResolutionFromRenderer(camera, renderer); tilesRenderer.update();` (:752-753).
`poseChanged(prev: Float32Array | number[] | null, next: ArrayLike<number>, eps = 1e-6)` (errorTargetRefine.ts) : accepte Float64Array via `next` ; `refine.lastPose` typé `Float32Array | null` ⇒ élargir le type à `Float64Array | null` dans le Loader seulement si tsc l'exige (ne pas modifier errorTargetRefine.ts : passer `Array.from` interdit en boucle chaude ; préférer adapter le type local).
Défaut T035-D1 (repro) : vue ortho (touche `5`) puis drag 7,4 s ⇒ 0 transition `[motion-gate]`, maxJobs 6 ×55, 216 requêtes ; attendu gel. T035 : après dézoom ortho à 9 km, histogramme visible inchangé (LOD figé).
lib 3d-tiles-renderer 0.3.46 : `setCamera(camera): boolean` · `deleteCamera(camera): boolean` · `setResolutionFromRenderer(camera, renderer)`.

## Décisions actées
- D1 : dpr réel sans plafond, relu au changement
- D24 (charge-3d) : gel conservé ; 1 seul écrivain de maxJobs (`applyDownloadJobs`) — ne pas toucher
- fusion : N instances loadTileset écoutent chacune l'événement (OK)

## Hors périmètre
- main.ts (gelé), mergedScene.ts, qualityHud.ts, RenderModeManager.ts, EDLRenderer.ts (lecture seule)
- near/far, anisotropie, presets, errorTarget (autres tâches)
- loaders/lcc2/ (T005 en cours dessus) ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (C3, T032, T005, e2e/bench-*) — ne rien annuler
- eslint ignore src/viewer ; règles G : fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore` ; vitest env node, 0 jsdom

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run typecheck, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T007
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
