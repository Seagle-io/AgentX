---
pack: T032
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
tags: [pack]
---

# Pack T032 — Gel des téléchargements de tuiles pendant le mouvement caméra

> Seule source de vérité de l'agent T032. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Viewer 3D : caméra en mouvement ⇒ 0 nouveau téléchargement de tuile ; reprise seulement après 500 ms d'immobilité continue. Tuiles déjà chargées restent affichées (update() continue chaque frame). Module pur `core/motionGate.ts` + câblage dans `loaders/TilesRendererLoader.ts`, sans toucher C3 (affinage errorTarget) hors la source de pose. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] `V/core/motionGate.ts` créé, exports exacts du contrat, 0 import, ≤ 60 l
- [ ] `V/core/motionGate.test.ts` : loadsAllowed (499 → false, 500 → true, stillMs custom) ; downloadJobs (moving / vramThrottled / !streamingActive ⇒ 0, sinon normal ; normal=0 ⇒ 0)
- [ ] TilesRendererLoader.ts : `grep -n "downloadQueue.maxJobs =" V/loaders/TilesRendererLoader.ts` → 2 hits max : init :319 + `applyDownloadJobs` (1 seul écrivain runtime)
- [ ] backpressure VRAM (:637-641) et `setStreamingActive` (:736-747) passent par `applyDownloadJobs` ; comportement inchangé hors gel (œil ON pendant throttle VRAM ⇒ reste 0 : correction voulue)
- [ ] pose lue sur `camera` (options, = caméra de `update()`), plus `cam` du hook ; C3 lit le même `refine.lastMoveMs`
- [ ] passage gelé→autorisé ⇒ `tilesRenderer.downloadQueue.scheduleJobRun()` appelé 1 fois
- [ ] `update()` toujours appelé chaque frame pendant le mouvement (condition :717-727 inchangée)
- [ ] journal console 1 ligne par transition : `[motion-gate] gel` / `[motion-gate] reprise (immobile ≥ 500 ms)` — lue par le vérificateur
- [ ] `window.__glrMotionGate = { allowed, transitions }` mis à jour à chaque transition (compteur entier)
- [ ] `cd web && npm run typecheck` exit 0 · `npx eslint <fichiers E>` 0 erreur · `npm test` vert (base 180 fichiers / 1721 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/core/motionGate.ts` | E (neuf) | module pur |
| `V/core/motionGate.test.ts` | E (neuf) | tests vitest node |
| `V/loaders/TilesRendererLoader.ts` | E | :277-283 refine/pose · :603-731 hook · :733-748 setStreamingActive |
| `V/core/errorTargetRefine.ts` | L | poseChanged, style |
| `V/core/errorTargetRefine.test.ts` | L | style de test |
| `V/core/vramBackpressure.ts` | L | :42-68 decideBackpressure |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/node_modules/3d-tiles-renderer/src/utilities/PriorityQueue.d.ts` | L | API file |

## Contrats
```ts
// V/core/motionGate.ts — pur, 0 import (testé env node)
/** Immobilité continue requise avant de relancer les téléchargements (règle humaine D24). */
export const MOTION_STILL_MS = 500;
/** true ⇒ téléchargements autorisés : pose immobile depuis ≥ stillMs. */
export function loadsAllowed(nowMs: number, lastMoveMs: number, stillMs = MOTION_STILL_MS): boolean
/** Seule règle de downloadQueue.maxJobs : 0 si gelé, VRAM saturée ou œil coupé, sinon normal. */
export function downloadJobs(s: { moving: boolean; vramThrottled: boolean; streamingActive: boolean; normal: number }): number
```
Existant à réutiliser (errorTargetRefine.ts) :
```ts
export function poseChanged(prev: Float32Array | number[] | null, next: ArrayLike<number>, eps = 1e-6): boolean
```
PriorityQueue.d.ts (lib 0.3.46) : `maxJobs : number;` · `tryRunJobs() : void;` · `scheduleJobRun() : void;`
Lib (T031) : maxJobs=0 stoppe les départs, items restent en file, fetch en vol finissent ; restaurer maxJobs NE relance PAS seul ⇒ scheduleJobRun() ; tuile parsée affichée seulement via update().
Code actuel, hook C3 (TilesRendererLoader.ts:684-693) :
```ts
const now = performance.now();
pose.set(cam.matrixWorld.elements, 0);
pose.set(cam.projectionMatrix.elements, 16);
if (poseChanged(refine.lastPose, pose)) {
  refine.lastMoveMs = now;
  refine.lastPose = pose.slice();
}
```
Backpressure actuel (:636-640) : `if (d.enteredThrottle || d.exitedThrottle) { tilesRenderer.downloadQueue.maxJobs = d.maxJobs; vramThrottled = d.throttled; …event }`
setStreamingActive actuel : `active ? maxJobs = normalDownloadJobs : maxJobs = 0` (:743, :747).
Câblage attendu : bloc pose déplacé AVANT le bloc VRAM ou laissé en place, puis `const allowed = loadsAllowed(now, refine.lastMoveMs)` ; si `allowed !== gateAllowed` ⇒ maj, log, `__glrMotionGate`, `applyDownloadJobs()`, et si allowed ⇒ `scheduleJobRun()`. 1ʳᵉ frame (lastPose null) = mouvement ⇒ gel 500 ms à l'ouverture (accepté).

## Décisions actées
- D24 : levier = downloadQueue.maxJobs ; parseQueue inchangé ; fetch en vol non annulés ; animations programmées = mouvement
- D24 : pose sur `camera` (options) — passes de capture (orthoSnapshot, rapport) ne gèlent pas
- 1 détection d'immobilité (C3) partagée ; 0 seconde détection
- COPC, tileCache : rien à changer

## Hors périmètre
- parseQueue, lruCache, errorTarget/paliers C3, mergedScene.ts, vramBackpressure.ts (lecture seule)
- purge des items périmés de la file (chantier suivant)
- main.ts, server.ts ; commit, push ; serveur de test

## Dépendances de comportement
- hook `scene.onBeforeRender` appelé à chaque frame (boucle continue SceneManager) ⇒ la transition à 500 ms se produit sans mouvement
- fusion : N instances loadTileset, chacune son hook et son état ⇒ état gel local à loadTileset (pas de global hors `__glrMotionGate`, dernière écriture gagne)
- `disableSelfWatchdog` (fusion) saute le bloc VRAM ⇒ vramThrottled reste false : ok

## Environnement
- node v22.22.1 ; G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, git local master HEAD 17d1f85
- arbre sale attendu : TilesRendererLoader.ts, qualityHud.ts, errorTargetRefine*.ts (C3 non commité) — ne pas annuler
- règles G : fichier neuf ≤ 400 l, fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`
- lint global : 1 warning préexistant Admin.tsx

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run typecheck, npm test, npx eslint, npx vitest, git diff, git status, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T032
statut: fait | bloque
---
## Fait
- chemin:L — quoi
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes (ce que le vérificateur doit observer)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
