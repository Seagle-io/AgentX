---
pack: T023
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T023 — Vues enregistrées ortho : hauteur visible stockée, zoom lié à la caméra de départ

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 2 défauts du vérificateur T022 sur T021. (frustum) Le zoom ortho brut stocké ne restitue pas l'échelle quand le frustum ortho a changé (frustum = f(distance à la bascule P→O)) ⇒ px/m ×0,553. (bascule) Le vol fige `isOrtho` au départ et applique `zoomTo` à la caméra ACTIVE ⇒ bascule `5` pendant le vol ⇒ caméra perspective à zoom 44 jusqu'au rechargement. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] format : `SavedView.camera.zoom?` REMPLACÉ par `orthoHeight?: number` = hauteur visible en unités monde = `(orthoCamera.top − orthoCamera.bottom) / orthoCamera.zoom`, stockée seulement si caméra ortho à l'enregistrement (T021 non commité, non publié : 0 compat `zoom` requise) ; `parseSavedViews` : `orthoHeight` invalide (non fini / ≤ 0) ⇒ vue gardée sans ; un champ `zoom` résiduel est ignoré (retiré)
- [ ] `V/ui/savedViewZoom.ts` réécrit, pur : `export function isValidHeight(h: unknown): h is number` ; `export function flightZoom(savedHeight: number | undefined, isOrtho: boolean, frustumHeight: number, startHeight: number, e: number): number | null` ⇒ null si !isOrtho ou savedHeight absent ; sinon `frustumHeight / (startHeight + (savedHeight − startHeight)·e)` (interpolation linéaire en hauteur visible) ; tests mis à jour : frustum différent de l'enregistrement ⇒ même hauteur visible (repro T022 : sauvé 294,5/44,073 = 6,682 ; frustum 532,3 ⇒ zoom 79,66) ; e = 0 ⇒ zoom de départ ; e = 1 ⇒ hauteur sauvée
- [ ] `flyTo` : au départ `startCam = sm.camera`, `startHeight` = hauteur visible courante si ortho ; à chaque pas : si `sm.camera !== startCam` ⇒ plus aucun `zoomTo` pour ce vol (position/cible continuent comme avant) ; sinon `zoomTo(flightZoom(...), false)` APRÈS `setLookAt(..., false)` ; frustumHeight relu à chaque pas sur `sm.camera` (ortho)
- [ ] enregistrement (`saveCurrentView`) : `orthoHeight` calculé après `sm.controls.update(1e3)`
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npx vitest run src/viewer/ui/savedViewZoom.test.ts` · `npm test` vert (dernier compte 196 fichiers / 1847 tests ± tests remplacés) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/ui/savedViews.ts` | E | :30-31 import ; :63-68 SavedView ; :94-104 parseSavedViews ; :150-188 flyTo ; :440-475 saveCurrentView (lire par plages) |
| `V/ui/savedViewZoom.ts` | E | réécriture |
| `V/ui/savedViewZoom.test.ts` | E | tests |

## Contrats
Code T021 actuel (diff) :
```ts
// savedViewZoom.ts
export function isValidZoom(z: unknown): z is number { return typeof z === 'number' && Number.isFinite(z) && z > 0; }
export function flightZoom(savedZoom: number | undefined, isOrtho: boolean, startZoom: number, e: number): number | null { if (!isOrtho || savedZoom === undefined) return null; return startZoom + (savedZoom - startZoom) * e; }
// savedViews.ts
camera: { position; target; /** T021-D1 */ zoom?: number };
// parseSavedViews : .map((v) => (v.camera.zoom === undefined || isValidZoom(v.camera.zoom) ? v : { ...v, camera: { position: v.camera.position, target: v.camera.target } }))
// flyTo : const isOrtho = (sm.camera as { isOrthographicCamera?: boolean }).isOrthographicCamera === true; const startZoom = sm.camera.zoom;
//   step : … sm.controls.setLookAt(lerpPos…, lerpTarget…, false); const z = flightZoom(view.camera.zoom, isOrtho, startZoom, e); if (z !== null) void sm.controls.zoomTo(z, false);
// saveCurrentView : sm.controls.update(1e3); … const orthoZoom = isOrtho ? sm.camera.zoom : undefined; … camera: { position, target, ...(orthoZoom !== undefined ? { zoom: orthoZoom } : {}) }
```
SceneManager (ne pas modifier) : `public camera: PerspectiveCamera | OrthographicCamera` (change à la bascule `togglePerspective`, controls recréés) ; `orthoCamera` public ; enveloppe `setLookAt` ortho ⇒ zoom recalé sur la distance, puis le `zoomTo` du vol l'emporte ; `zoomTo` borné par minZoom/maxZoom.
Repro T022 ($T = scratchpad/t022.hMQF) : `BASE=http://localhost:5183 CASE=frustum node sv2.mjs` (sauvé zoom 44,073 frustum 294,5 px/m 128,233 ; restauré frustum 532,3 ⇒ px/m 70,951) ; `CASE=midtoggle DT=300 node sv2.mjs` (⇒ PerspectiveCamera zoom 44,080).

## Décisions actées
- D8 ; vue d'accueil 🏠 hors tâche ; SceneManager inchangé

## Hors périmètre
- SceneManager.ts, homeView.ts, TilesRendererLoader.ts, motionGate.ts, main.ts ; commit, push

## Environnement
- node v22.22.1 ; G git local master (HEAD 345a7a0) ; arbre sale attendu (T018, T019, T021) — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` ; vitest env node, 0 jsdom ; fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T023
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
