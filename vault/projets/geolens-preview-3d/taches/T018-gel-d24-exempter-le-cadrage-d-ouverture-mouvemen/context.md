---
pack: T018
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T018 — Gel D24 : exempter le cadrage d'ouverture (D7)

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Le gel des téléchargements (D24) traite l'animation de cadrage à l'ouverture comme un mouvement ⇒ ≈ 4 s sans téléchargement au démarrage. Exempter du GEL tout mouvement caméra survenu avant la 1re entrée utilisateur, sans changer l'affinage ni le gel après cette entrée. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] `V/core/motionGate.ts` : `export const OPENING_INPUT_EVENTS = ['pointerdown', 'wheel', 'touchstart'] as const;` (canvas) + `keydown` (window) ; `export function gateMoveStamp(prevMs: number, nowMs: number, moved: boolean, openingExempt: boolean): number` ⇒ `moved && !openingExempt ? nowMs : prevMs` ; tests (ouverture : pose bouge ⇒ stamp inchangé ⇒ loadsAllowed vrai ; après entrée ⇒ stamp = now ⇒ gel)
- [ ] Loader : horodatage du gel SÉPARÉ de l'affinage : `gateLastMoveMs` initial `-Infinity` (⇒ téléchargements autorisés dès la 1re image, plus de 500 ms de gel initial) ; `updateMotionGate` lit `loadsAllowed(now, gateLastMoveMs)` au lieu de `refine.lastMoveMs`
- [ ] Loader : sur `poseChanged` : `refine.lastMoveMs = now` INCHANGÉ (affinage = base pendant le cadrage) ; `gateLastMoveMs = gateMoveStamp(gateLastMoveMs, now, true, openingExempt)`
- [ ] Loader : `openingExempt = true` à la création ; écouteurs `{ capture: true, passive: true }` sur `renderer.domElement` pour OPENING_INPUT_EVENTS + `keydown` sur window ⇒ `openingExempt = false`, `gateLastMoveMs = now` (l'entrée elle-même compte comme début de mouvement), log unique `[motion-gate] ouverture terminée (<type>)`, retrait des écouteurs ; retrait aussi dans `dispose`
- [ ] `window.__glrMotionGate` gagne `openingExempt: boolean` (forme existante conservée : allowed, transitions, purged) ; écrit aussi à la levée de l'exemption
- [ ] inchangé : gateStep (arm/resume), purge, applyDownloadJobs seul écrivain de maxJobs, relance des tuiles en échec, ordre du hook (pose → updateMotionGate → relance → affinage → update())
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npx vitest run src/viewer/core/motionGate.test.ts` · `npm test` vert (dernier compte 194 fichiers / 1826 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/core/motionGate.ts` | E | gateMoveStamp, OPENING_INPUT_EVENTS |
| `V/core/motionGate.test.ts` | E | tests |
| `V/loaders/TilesRendererLoader.ts` | E | :298-303 refine ; :644-686 gel ; :745-760 pose ; :811-815 dispose (941 l : lire par plages) |

## Contrats
motionGate.ts actuel (verbatim) :
```ts
export const MOTION_STILL_MS = 500;
export function loadsAllowed(nowMs: number, lastMoveMs: number, stillMs = MOTION_STILL_MS): boolean { return nowMs - lastMoveMs >= stillMs; }
export function downloadJobs(s: { moving: boolean; vramThrottled: boolean; streamingActive: boolean; normal: number }): number
export function gateStep(s: { gateAllowed: boolean; resumeArmed: boolean }, allowed: boolean): { gateAllowed: boolean; resumeArmed: boolean; action: 'none' | 'freeze' | 'arm' | 'resume' }
```
Loader actuel :
```ts
// :301
const refine: { base: number; userOverride: boolean; lastPose: Float64Array | null; lastMoveMs: number; applied: number } = { base: base0, userOverride: false, lastPose: null, lastMoveMs: performance.now(), applied: base0 };
// :644-647
let gateAllowed = true; let resumeArmed = false; let gateTransitions = 0; let gatePurged = 0;
// :655 updateMotionGate(now) : const allowed = loadsAllowed(now, refine.lastMoveMs); const step = gateStep({ gateAllowed, resumeArmed }, allowed); … log gel/reprise, purge, applyDownloadJobs, scheduleJobRun ; window.__glrMotionGate = { allowed, transitions: gateTransitions, purged: gatePurged }
// :752-758 hook : pose.set(activeCamera.matrixWorld.elements, 0); pose.set(activeCamera.projectionMatrix.elements, 16);
//   if (poseChanged(refine.lastPose, pose)) { refine.lastMoveMs = now; refine.lastPose = pose.slice(); }
//   updateMotionGate(now); … refinedErrorTarget(refine.base, now - refine.lastMoveMs)
// :811 dispose : window.removeEventListener('glr:active-camera', onActiveCamera); scene.onBeforeRender = origOnBeforeRender; tilesRenderer.dispose()
// options : renderer: THREE.WebGLRenderer (:60) ⇒ renderer.domElement = canvas
```
Sources du cadrage d'ouverture (main.ts, NE PAS modifier) : `glr:tileset-first-tile-loaded` ⇒ forceFitToScene puis +1000 ms ; `glr:home-dismissed` ⇒ poll fitToSceneAuthoritative /400 ms ; `setLookAt(..., true)` smoothTime 0,25 s ; accueil cinématique pilote la caméra avant « Explorer ». Mesure T014 : ouverture gelée 3,9-4,1 s.

## Décisions actées
- D7 (humain) : cadrage d'ouverture exempté du gel ; ouverture = avant la 1re entrée utilisateur ; affinage inchangé ; après l'entrée, D24 intact (animations programmées = mouvement)
- D5/D6, D24 : purge à la reprise, 1 écrivain de maxJobs

## Hors périmètre
- main.ts, SceneManager.ts, errorTargetRefine.ts, staleQueuePurge.ts, failedTileRetry.ts ; Lcc2* ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale possible — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer) ; vitest env node, 0 jsdom ; fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T018
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
