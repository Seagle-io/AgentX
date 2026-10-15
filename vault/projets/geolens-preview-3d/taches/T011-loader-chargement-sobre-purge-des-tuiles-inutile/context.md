---
pack: T011
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T011 — Loader chargement sobre : purge à la reprise, plancher dès 500 ms

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Quatre correctifs : D1 et D2 du vérificateur T010 (ci-dessous) puis deux correctifs mesurés au banc (T003) : (H9) à la reprise du gel D24, retirer de la file de téléchargement les tuiles qui ne sont plus utilisées par la vue courante, pour ne plus télécharger de tuiles qui ne s'afficheront jamais ; (H11) l'affinage passe directement au plancher (0,5 px) dès 500 ms d'immobilité, au lieu de l'escalier 1,5 s / 3 s. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer · N = …/web/node_modules/3d-tiles-renderer/src.

## Definition of Done
- [ ] H11 : `errorTargetRefine.ts` : `refinedErrorTarget(base, stillMs)` : `stillMs >= MOTION_STILL_MS` (500, importé de `motionGate.ts`) ⇒ `Math.min(base, REFINE_FLOOR_PX)` ; sinon `base` ; `REFINE_STILL_MS` supprimé s'il n'a plus d'usage (rg dans V hors tests) ; tests mis à jour (499 ⇒ base, 500 ⇒ 0,5, base 0,25 ⇒ 0,25)
- [ ] H9 : fonction pure `V/core/staleQueuePurge.ts` : `export function staleQueuedTiles<T extends { __used?: boolean; __loadingState?: number }>(items: readonly T[], loadingState: number): T[]` — renvoie les items avec `__loadingState === loadingState` (LOADING de la lib = 1) ET `__used !== true` ; test node
- [ ] Loader : sur la transition gel → reprise (dans `updateMotionGate`, branche `allowed` vrai, AVANT `scheduleJobRun()`) : `for (const t of staleQueuedTiles(downloadQueue.items, LOADING)) lruCache.remove(t)` (la callback d'unload de la lib fait abort + retrait de file + état UNLOADED) ; log `[motion-gate] purge <n> tuiles hors vue` si n > 0 ; compteur `window.__glrMotionGate.purged` cumulé
- [ ] vérifier dans N que les items de `downloadQueue.items` sont les tuiles (sinon adapter la projection) et que `__used` reflète la dernière traversée (update() appelé chaque frame pendant le gel) — chemin:L dans result.md
- [ ] D1 T010 : garde cache SUPPRIMÉE de l'affinage : `refineGuard` et `guardBlocked` retirés (errorTargetRefine.ts + Loader) ; `shouldAutoRefine({ fusion, userOverride })` ; tests mis à jour
- [ ] D2 T010 : relance des tuiles en échec : collecter les tuiles `__loadingState === FAILED (-1)` (traverse), `lruCache.remove(t)` pour chacune, PUIS `resetFailedTiles()` ; vérifier dans N (base:299-330, :620-659, :660-710) que la callback d'unload accepte une tuile FAILED (disposeTile sans contenu) — chemin:L dans result.md ; sinon remettre `__loadingState = UNLOADED` avant remove et le justifier
- [ ] gel D24 et `applyDownloadJobs` inchangés ; relance des tuiles en échec (T009) inchangée
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npm test` vert (dernier compte 192 fichiers / 1807 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/TilesRendererLoader.ts` | E | `updateMotionGate` (~:625-645), hook affinage (~:735-755) |
| `V/core/errorTargetRefine.ts` | E | refinedErrorTarget |
| `V/core/errorTargetRefine.test.ts` | E | tests |
| `V/core/staleQueuePurge.ts` | E (neuf) | sélection pure |
| `V/core/staleQueuePurge.test.ts` | E (neuf) | tests |
| `V/core/motionGate.ts` | L | MOTION_STILL_MS |
| `N/base/TilesRendererBase.js` | L | :601-730 requestTileContents, callback d'unload :620-659 |
| `N/utilities/PriorityQueue.js` | L | items, remove |
| `N/utilities/LRUCache.js` | L | :124-150 remove |
| `N/base/constants.js` | L | LOADING = 1, FAILED = -1 |

## Contrats
errorTargetRefine.ts après T009 :
```ts
export const REFINE_STILL_MS = 1500;
export const REFINE_FLOOR_PX = 0.5;
export function refinedErrorTarget(base: number, stillMs: number): number  // ≥ 3 s → min(base, 0.5) ; ≥ 1,5 s → max(base/2, floor) ; sinon base
export function refineGuard(prevBlocked: boolean, cachedBytes: number, maxBytes: number): boolean
export function shouldAutoRefine(s: { fusion: boolean; userOverride: boolean; guardBlocked: boolean }): boolean
```
motionGate.ts : `export const MOTION_STILL_MS = 500;` · `loadsAllowed(nowMs, lastMoveMs, stillMs = MOTION_STILL_MS)` · `downloadJobs({moving, vramThrottled, streamingActive, normal})`.
Loader (T032) : `updateMotionGate(now)` sur transition : log `[motion-gate] gel` | `[motion-gate] reprise (immobile ≥ 500 ms)`, `window.__glrMotionGate = { allowed, transitions }`, `applyDownloadJobs()`, si allowed ⇒ `downloadQueue?.scheduleJobRun()`.
Lib (callback d'unload enregistrée par `lruCache.add(tile, cb)`, base:620-659) : si `LOADING` ⇒ `__loadAbort.abort()` ; stats décrémentées ; `__loadingState = UNLOADED` ; `__loadIndex++` ; `parseQueue.remove(t)` ; `downloadQueue.remove(t)`. `LRUCache.remove(item)` appelle la callback (LRUCache.js:124-140).
Défauts T010 (repro dans /tmp/t010-030t/probe.mjs) :
- D1 : `SCEN=h1 PRESET=standard GPU=1` ⇒ ET 4 figé, ratio 0,85 ; minBytes = 0,85×max (Loader:262) ; LRUCache.js:342 n'évince pas sous minBytes ; déblocage < 0,8 jamais atteint
- D2 : `SCEN=h15 FAILTILE=t/5_10_10.glb` ⇒ resetFailedTiles (Loader:745) FAILED → UNLOADED mais tuile gardée dans le LRU (base:708-709) ; `lruCache.add` rend false (LRUCache.js:88) ⇒ return base:662 ⇒ 0 requête ; état 0 pendant 39 s
Relance actuelle (T009) : `failedTileRetry.ts` `stepFailedTileRetry(s, failed, loadsAllowed, now) → { state, relaunch }` ; Loader : si relaunch ⇒ `resetFailedTiles()` + log `[tile-retry] relance n°<k> (<failed> tuiles)`.
Constantes lib : FAILED -1 · UNLOADED 0 · LOADING 1 · PARSING 2 · LOADED 3.
Mesures T003 : dolly 5 crans : 72/512 requêtes non `__used`, file à la reprise = 180 (3/3 runs) ; pan : 44/132 ; tuiles inutiles servies en queue (rang 0,84-0,99) ; 100 % des requêtes post-orbite dans la vague errorTarget=1, atteinte 4,1-8,9 s après mouse.up, net ≥ 11,7 s.

## Décisions actées
- D6 : garde cache supprimée (cache plein ⇒ la lib bloque d'elle-même) ; relance = retrait du LRU puis resetFailedTiles
- D5 : purge via `lruCache.remove` à la reprise ; plancher dès 500 ms ; priorité de file inchangée
- D1 : plancher 0,5 px ; D24 gel conservé (1 écrivain de maxJobs)

## Hors périmètre
- priorityCallback, parseQueue, débit de parse ; animation de cadrage à l'ouverture
- SceneManager.ts, main.ts, mergedScene.ts, loaders/lcc2/ ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (C3, T032, T005, T007, T009, e2e/bench-*) — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer)
- vitest env node, 0 jsdom ; règles G : fonction ≤ 60 l, fichier neuf ≤ 400 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T011
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
