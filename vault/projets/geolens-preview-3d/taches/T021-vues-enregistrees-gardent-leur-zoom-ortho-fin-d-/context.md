---
pack: T021
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T021 — Zoom ortho des vues enregistrées ; fin d'ouverture hors accueil ; sonde du gel

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger D1-D3 du vérificateur T020. (D1) Une vue enregistrée en ortho est restaurée au zoom recalé sur la distance (enveloppe T019) au lieu de son zoom sauvé. (D2) Un clic sur la barre d'outils (ex. `[data-view="top"]`) ne termine pas l'ouverture ⇒ animation programmée sans gel (722 req). (D3) `window.__glrMotionGate` absent pendant l'ouverture. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] D1 : `SavedView.camera` gagne `zoom?: number` (posé à l'enregistrement SEULEMENT si la caméra est ortho : `(sm.camera as { isOrthographicCamera?: boolean }).isOrthographicCamera === true` ⇒ `sm.camera.zoom`) ; `parseSavedViews` accepte les anciennes vues (sans zoom) et ignore un zoom non fini / ≤ 0
- [ ] D1 : `flyTo(view)` : si caméra courante ortho ET `view.camera.zoom` défini ⇒ à chaque pas, APRÈS `sm.controls.setLookAt(..., false)`, `sm.controls.zoomTo(z, false)` avec `z = startZoom + (savedZoom − startZoom)·e` (même easing `e`) ; sinon comportement actuel (l'enveloppe T019 recale sur la distance)
- [ ] D1 : calcul pur extrait `V/ui/savedViewZoom.ts` (0 import three/DOM) : `export function flightZoom(savedZoom: number | undefined, isOrtho: boolean, startZoom: number, e: number): number | null` (null ⇒ ne rien faire) + `export function isValidZoom(z: unknown): z is number` ; tests `savedViewZoom.test.ts`
- [ ] D2 : fin d'ouverture écoutée sur le DOCUMENT de la vue (pas seulement le canvas) : `document.addEventListener(ev, endOpening, { capture: true, passive: true })` pour `OPENING_INPUT_EVENTS` + `keydown` ; un événement ne termine PAS l'ouverture tant que `document.body.classList.contains('gx-home-open')` (accueil cinématique affiché, clic « Explorer » compris) ; décision pure dans motionGate.ts : `export function endsOpening(homeOpen: boolean): boolean` ⇒ `!homeOpen` (+ test) ; retrait des écouteurs au dispose et à la levée (document, plus canvas ni window)
- [ ] D3 : `publishMotionGate(gateAllowed)` appelé une fois à la création du loader (après init des variables) ⇒ `__glrMotionGate = { allowed: true, transitions: 0, purged: 0, openingExempt: true }` dès l'ouverture ; forme inchangée
- [ ] inchangé : gateMoveStamp, gateStep, purge, applyDownloadJobs seul écrivain de maxJobs, affinage, enveloppe setLookAt (SceneManager)
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npx vitest run src/viewer/core/motionGate.test.ts src/viewer/ui/savedViewZoom.test.ts` · `npm test` vert (dernier compte 195 fichiers / 1838 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/ui/savedViews.ts` | E | :57-68 SavedView ; :87-100 parseSavedViews ; :141-175 flyTo ; :425-460 enregistrement (584 l : lire par plages) |
| `V/ui/savedViewZoom.ts` | E (neuf) | calcul pur |
| `V/ui/savedViewZoom.test.ts` | E (neuf) | tests |
| `V/core/motionGate.ts` | E | endsOpening |
| `V/core/motionGate.test.ts` | E | test |
| `V/loaders/TilesRendererLoader.ts` | E | :648-672 ouverture ; :~700 publishMotionGate ; :~835 dispose (lire par plages) |

## Contrats
savedViews.ts actuel :
```ts
export interface SavedView { id: string; name: string; createdAt: string; camera: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }; renderMode: RenderMode; thumbnail: string; }
export function parseSavedViews(raw: string | null): SavedView[]  // filtre id/name string, camera.position/target, position.x number, thumbnail string
// flyTo(view) : token ; startPos = sm.camera.position.clone() ; startTarget = sm.cameraTarget ; endPos/endTarget ; t0 ; step : t = min((now − t0)/VIEW_FLY_MS, 1) ; e = t < 0.5 ? 4t³ : 1 − (−2t+2)³/2 ; lerp ; sm.controls.setLookAt(lerpPos…, lerpTarget…, false) ; rAF si t < 1
// enregistrement (:425-460) : sm.controls.update(1e3) ; pos = sm.camera.position.clone() ; tgt = sm.cameraTarget.clone() ; … view.camera = { position, target }
```
T019 (SceneManager, ne pas modifier) : enveloppe de `controls.setLookAt` : ortho ⇒ bornes recalculées puis `zoomTo(clamp(orthoZoomForDistance(top−bottom, fov, |p−t|), minZoom, maxZoom), enableTransition)` ⇒ un `zoomTo(saved, false)` appelé APRÈS dans le même pas l'emporte. camera-controls 3.1.2 : `zoomTo(zoom: number, enableTransition?: boolean): Promise<void>` (borné par minZoom/maxZoom).
T018 livré (TilesRendererLoader) :
```ts
const endOpening = (e: Event): void => { openingExempt = false; gateLastMoveMs = performance.now(); removeOpeningListeners(); console.log(`[motion-gate] ouverture terminée (${e.type})`); publishMotionGate(gateAllowed); };
for (const ev of OPENING_INPUT_EVENTS) renderer.domElement.addEventListener(ev, endOpening, { capture: true, passive: true });
window.addEventListener('keydown', endOpening, { capture: true, passive: true });
// motionGate.ts : export const OPENING_INPUT_EVENTS = ['pointerdown', 'wheel', 'touchstart'] as const; gateMoveStamp(prevMs, nowMs, moved, openingExempt)
// publishMotionGate(allowed) ⇒ window.__glrMotionGate = { allowed, transitions, purged, openingExempt } ; appelé sur transition et à endOpening seulement
```
Accueil : `document.body.classList` contient `gx-home-open` tant que l'accueil cinématique est affiché ; retiré par main.ts au dismiss (« Explorer en 3D »), le cadrage d'ouverture suit (poll fitToSceneAuthoritative /400 ms).
Défauts T020 ($T = scratchpad/t020.vFMn) :
- D1 : `5` → 12 crans → `#saved-views-add` → `H` → clic `.saved-view-thumb` ⇒ zoom 1,000 (sauvé 44,087), px/m 2,91 ≠ 128,25 ; script `$T/sv.mjs`
- D2 : 0 entrée canvas, clic `[data-view="top"]` à +3,5 s ⇒ 722 req pendant l'animation 2,7 s, maxJobs 12, 0 gel ; `CASE='view:[data-view="top"]' WAIT=3500 node o3.mjs`
- D3 : `__glrMotionGate` undefined sur 138 échantillons pendant l'ouverture

## Décisions actées
- D7 précisé (chef) : « 1re entrée utilisateur » = pointerdown/wheel/touchstart/keydown n'importe où dans la vue, sauf tant que l'accueil est affiché ; un clic toolbar est une entrée (vue choisie = mouvement voulu ⇒ gel D24)
- vue d'accueil (homeView.ts, synchro glrAPI desktop) : zoom NON stocké ici (tâche à part)

## Hors périmètre
- SceneManager.ts, homeView.ts, main.ts, presentationMode.ts, viewMarkers.ts ; format synchro desktop ; commit, push

## Environnement
- node v22.22.1 ; G git local master (HEAD 345a7a0) ; arbre sale attendu (T018, T019 non commités) — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer) ; vitest env node, 0 jsdom (savedViews.ts importe DOM/three : tester le module pur seul) ; fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T021
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
