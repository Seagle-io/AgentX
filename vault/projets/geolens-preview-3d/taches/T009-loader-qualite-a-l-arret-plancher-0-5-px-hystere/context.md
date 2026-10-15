---
pack: T009
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T009 — Loader qualité à l'arrêt (H1, H4, H6, H15)

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Quatre correctifs du loader de tuiles 3D, mesurés comme défauts au banc (T002) : (H6) l'affinage à l'arrêt descend jusqu'à 0,5 px ; (H1) la garde « cache ≥ 90 % » ne fait plus osciller l'errorTarget (hystérésis) ; (H4) anisotropie maximale sur les textures des tuiles ; (H15) une tuile en échec est redemandée avec délai croissant. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer · N = …/web/node_modules/3d-tiles-renderer/src.

## Definition of Done
- [ ] H6 : `errorTargetRefine.ts` : `export const REFINE_FLOOR_PX = 0.5;` ; palier final = `Math.min(base, REFINE_FLOOR_PX)` ; palier 1 = `Math.max(base / 2, floor)` inchangé dans sa forme ; paliers temporels (1,5 s / 3 s) INCHANGÉS (autre tâche) ; tests mis à jour (`refinedErrorTarget(4, 3000) === 0.5`, `refinedErrorTarget(0.25, 3000) === 0.25`)
- [ ] H1 : hystérésis : nouvelle fonction pure `refineGuard(prevBlocked: boolean, cachedBytes: number, maxBytes: number): boolean` (bloque si ≥ 0,90 × max ; débloque seulement si < 0,80 × max ; maxBytes ≤ 0 ⇒ false) ; `shouldAutoRefine` l'utilise via un état `refine.guardBlocked` tenu par le Loader ; tests : séquence 0,85 → 0,91 (bloqué) → 0,85 (toujours bloqué) → 0,79 (débloqué)
- [ ] H4 : handler `load-model` (Loader:560) : pour chaque mesh de `event.scene`, chaque texture de matériau (`map`, `normalMap`, `roughnessMap`, `metalnessMap`, `emissiveMap`, `aoMap` présents) : `anisotropy = renderer.capabilities.getMaxAnisotropy()` (valeur lue 1× à l'init) ; si la texture était déjà différente, `needsUpdate = true` ; logique dans fonction pure-ish `applyAnisotropy(root: THREE.Object3D, level: number): number` (renvoie le nb de textures modifiées) dans `V/core/tileTextureQuality.ts` + test node (objets three construits sans WebGL)
- [ ] H15 : module pur `V/core/failedTileRetry.ts` : `export function nextRetryDelayMs(attempt: number): number` (2000 × 2^attempt, plafond 60 000) et état `{ attempt, nextAt }` ; Loader : si `tilesRenderer.stats.failed > 0` ET téléchargements autorisés (gel D24 levé) ET `now ≥ nextAt` ⇒ `tilesRenderer.resetFailedTiles()`, attempt++ ; attempt remis à 0 quand `stats.failed === 0` ; log `[tile-retry] relance n°<k> (<failed> tuiles)` ; tests du module
- [ ] diag : Loader:806 et :834-848 : constante FAILED de la lib = `-1` (N/base/constants.js:2), pas 4 — corriger le commentaire et le test d'état du diagnostic
- [ ] `poseChanged(prev)` élargi à `ArrayLike<number> | null` (errorTargetRefine.ts) ; retirer le cast `as unknown as Float32Array | null` (Loader ~:727)
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npm test` vert (dernier compte 190 fichiers / 1793 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/TilesRendererLoader.ts` | E | :560-600 load-model, :720-745 garde/affinage, :800-860 diag, hook |
| `V/core/errorTargetRefine.ts` | E | plancher, garde, poseChanged |
| `V/core/errorTargetRefine.test.ts` | E | tests |
| `V/core/tileTextureQuality.ts` | E (neuf) | applyAnisotropy |
| `V/core/tileTextureQuality.test.ts` | E (neuf) | tests |
| `V/core/failedTileRetry.ts` | E (neuf) | délais de relance |
| `V/core/failedTileRetry.test.ts` | E (neuf) | tests |
| `V/core/motionGate.ts` | L | loadsAllowed |
| `N/base/constants.js` | L | FAILED = -1 |
| `N/base/TilesRendererBase.js` | L | :299-330 resetFailedTiles |

## Contrats
errorTargetRefine.ts actuel :
```ts
export const REFINE_STILL_MS = 1500;
export function refinedErrorTarget(base: number, stillMs: number): number {
  const floor = Math.min(base, 1);
  if (stillMs >= 2 * REFINE_STILL_MS) return floor;
  if (stillMs >= REFINE_STILL_MS) return Math.max(base / 2, floor);
  return base;
}
export function poseChanged(prev: Float32Array | number[] | null, next: ArrayLike<number>, eps = 1e-6): boolean
export function shouldAutoRefine(s: { fusion: boolean; userOverride: boolean; cachedBytes: number; maxBytes: number }): boolean {
  return !s.fusion && !s.userOverride && !(s.maxBytes > 0 && s.cachedBytes >= 0.9 * s.maxBytes);
}
```
Loader actuel (hook) : `const t = shouldAutoRefine({ fusion, userOverride: refine.userOverride, cachedBytes: lruB?.cachedBytes ?? 0, maxBytes: lruB?.maxBytesSize ?? 0 }) ? refinedErrorTarget(refine.base, now - refine.lastMoveMs) : refine.base; if (t !== refine.applied) { tilesRenderer.errorTarget = t; refine.applied = t; }`
Gel D24 : `gateAllowed` (Loader ~:619-640) vrai ⇒ téléchargements autorisés ; seul écrivain de maxJobs = `applyDownloadJobs` — ne pas toucher.
lib : `resetFailedTiles(): void` (d.ts:33) remet FAILED → UNLOADED (et rootLoadingState) ; `stats.failed` ; event `load-model` porte `{ scene, tile }`.
Mesures T002 : H1 budget 600 Mo ⇒ ET 1→4→1→4→1 entre 75 et 81 s, tuiles figées 8 s ; H4 355/355 textures anisotropy=1, max GL 16 ; H6 plancher 1 px ; H15 1 seul 503 ⇒ `__loadingState=-1`, 1 seule requête en 21 s, trou visible.

## Décisions actées
- D1 : détail max = erreur ≤ 0,5 px physique
- D24 (charge-3d) : gel conservé ; relance seulement hors mouvement
- paliers temporels de l'affinage : inchangés ici (décision après mesures T003)

## Hors périmètre
- paliers 1,5 s / 3 s, priorité de file, purge (tâche suivante) ; near/far, brouillard
- SceneManager.ts, main.ts, mergedScene.ts, loaders/lcc2/ ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (C3, T032, T005, T007, e2e/bench-*) — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer)
- vitest env node, 0 jsdom ; three importable en test ; règles G : fonction ≤ 60 l, fichier neuf ≤ 400 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T009
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
