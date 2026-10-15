---
pack: T019
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T019 — Ortho : vues programmées à l'échelle de leur distance ; bornes de zoom en distance

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger D1 et D3 du vérificateur T017 sur le zoom ortho livré par T016. (D1) En ortho, toute pose programmée (`controls.setLookAt` : Accueil, Recadrer, Dessus/Face/Iso, vues enregistrées, cinématique) garde le zoom courant ⇒ vue ×65 après zoom. (D3) `maxZoom` exprimé en hauteur visible ⇒ bascule O→P à 0,433 m < minDistance 0,5. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] module pur neuf `V/core/orthoScale.ts` (+ `.test.ts`, 0 import three) :
  - `export function orthoZoomForDistance(frustumHeight: number, fovDeg: number, dist: number): number` ⇒ `frustumHeight / (2·tan(fov/2)·dist)` (dist ≤ 0 ou non fini ⇒ 1)
  - `export function orthoZoomBounds(frustumHeight: number, fovDeg: number, minDistance: number, maxDistance: number): { minZoom: number; maxZoom: number }` ⇒ maxZoom = zoom à minDistance, minZoom = zoom à maxDistance
  - `export function perspDistanceForOrtho(visibleHeight: number, fovDeg: number, minDistance: number, maxDistance: number): number` ⇒ `visibleHeight / (2·tan(fov/2))` borné [minDistance, maxDistance]
  - tests : aller-retour zoom↔distance (écart < 1e-9), bornes, clamp D3 (0,433 ⇒ 0,5)
- [ ] D1 : en ortho, `controls.setLookAt(px,py,pz,tx,ty,tz,t)` ⇒ zoom recalé : `zoomTo(clamp(orthoZoomForDistance(top−bottom, perspectiveCamera.fov, |p−t|), minZoom, maxZoom), t)` ; installé par une méthode privée de SceneManager (enveloppe de `setLookAt` de l'instance controls, appelée au constructeur ET dans `rebindControlsToActiveCamera` car l'instance est recréée) ; en perspective : comportement strictement inchangé (appel d'origine seul) ; valeur de retour (Promise) conservée
- [ ] D3 : bornes de zoom posées dans `rebindControlsToActiveCamera()` quand ortho (couvre togglePerspective ET TopViewMapCapture) via `orthoZoomBounds(top−bottom, fov, controls.minDistance, controls.maxDistance)` ; bloc min/maxZoom actuel de togglePerspective (`height / 20000`, `height / 0.5`) supprimé ; recalcul aussi dans l'enveloppe (minDistance change au fitToScene, SceneManager.ts:1443, :1556)
- [ ] D3 : O→P : `perspDist = perspDistanceForOrtho(visibleHeight, fov, controls.minDistance, controls.maxDistance)` (remplace le calcul en ligne)
- [ ] inchangé : molette/droit/pincement = zoom en ortho, dolly en persp ; P→O zoom = 1 ; échelle persp↔ortho conservée hors bornes
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npx vitest run src/viewer/core` · `npm test` vert (dernier compte 194 fichiers / 1826 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/core/orthoScale.ts` | E (neuf) | calculs purs |
| `V/core/orthoScale.test.ts` | E (neuf) | tests |
| `V/core/SceneManager.ts` | E | :222-280 constructeur controls ; :967-1032 togglePerspective ; :1045-1070 rebind ; :1101-1115 animateCamera (lecture) ; :1344-1362 fitToSceneAuthoritative (lecture) — 1971 l, lire par plages |
| `G/web/node_modules/camera-controls/dist/index.d.ts` | L | :686 zoomTo ; :765 setLookAt |

## Contrats
camera-controls 3.1.2 : `setLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition?: boolean): Promise<void>` ; `zoomTo(zoom: number, enableTransition?: boolean): Promise<void>` ; `minZoom`, `maxZoom`, `minDistance`, `maxDistance: number`.
SceneManager actuel (T016, commité 3e24a3e) :
```ts
// togglePerspective P→O : vFov = fov·π/180 ; height = 2·tan(vFov/2)·dist ; ortho left/right/top/bottom ; orthoCamera.zoom = 1 ; updateProjectionMatrix
// O→P : const visibleHeight = (orthoCamera.top − orthoCamera.bottom) / orthoCamera.zoom; const perspDist = visibleHeight / (2·Math.tan(vFov/2)); perspPos = target + normalize(pos − target)·perspDist
// après rebind : if (!this.isPerspective) { const height = top − bottom; this.controls.minZoom = height / 20000; this.controls.maxZoom = height / 0.5; }
// rebindControlsToActiveCamera : prevControls.dispose(); this.controls = new CameraControls(this.camera, this.canvas); recopie dollyToCursor, min/maxDistance, … ; applyNavigationScheme() ; touches
// minDistance dynamique : :258 0.5 initial ; :1443 et :1556 `splat ? 0.1 : Math.max(0.5, maxDim·0.001)` ; maxDistance `Math.max(10000, maxDim·20)`
// isPerspective: boolean (privé) ; orthoCamera, perspectiveCamera publics
```
Appelants de `controls.setLookAt` (NE PAS modifier, couverts par l'enveloppe) : SceneManager animateCamera (setView, raccourcis) et fitToSceneAuthoritative ; ui/savedViews.ts:167,351 ; ui/homeCinematic.ts:480,578 ; ui/presentationMode.ts:131 ; main.ts:5286 ; geoplan/render3d.ts:112 ; packs (risque, architecte, geometre).
Défauts T017 (repro $T = scratchpad/t017.iDDQ, `LABEL=apres-h OUT=$T/out node h.mjs`) :
- D1 : `5`, 12 crans molette (zoom 64,7), puis Accueil/Recadrer/Dessus/Iso ⇒ zoom reste 64,74, fond 4,8-46 % (AVANT 85 %)
- D3 : ortho maxZoom 224,36 puis `5` ⇒ persp à 0,433 m ; 1 cran molette avant ⇒ recul à 0,5 m (zoom inversé −13 %)

## Décisions actées
- D1 dpr ; minDistance 0,5 m (crash ArcelorMittal) = plancher aussi en ortho (équivalent distance)
- EDL (D2 T017 : EDLRenderer jamais appelé) hors sujet ici

## Hors périmètre
- main.ts, savedViews.ts, homeCinematic.ts, presentationMode.ts, packs/, geoplan/ ; TilesRendererLoader.ts et motionGate.ts (T018 en parallèle) ; EDLRenderer ; commit, push

## Environnement
- node v22.22.1 ; G git local master (HEAD 345a7a0) ; T018 édite TilesRendererLoader/motionGate en parallèle — ne pas y toucher, ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer) ; vitest env node, 0 jsdom ; fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T019
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
