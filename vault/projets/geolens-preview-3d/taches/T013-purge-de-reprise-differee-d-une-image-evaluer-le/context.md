---
pack: T013
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T013 — Purge de reprise différée d'une image (D1 T012)

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
À la reprise du gel D24, la purge des tuiles hors vue doit se faire APRÈS une traversée au seuil affiné (0,5 px), pas sur la traversée précédente au seuil de base : sinon elle retire des tuiles qui seront utilisées et redemandées aussitôt. Reprise en 2 temps sur 2 images consécutives. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] `updateMotionGate(now)` : transition vers autorisé en 2 images : image N (1re fois `allowed` vrai alors que `gateAllowed` faux) ⇒ `resumeArmed = true`, rien d'autre (maxJobs reste 0, gateAllowed reste faux) ; image N+1 (`allowed` toujours vrai et `resumeArmed`) ⇒ `gateAllowed = true`, transitions++, log reprise, purge (`staleQueuedTiles(items, TILE_LOADING, tilesRenderer.frameCount)` = traversée de l'image N au seuil affiné), `applyDownloadJobs()`, `scheduleJobRun()` — dans CET ordre (purge AVANT de rendre maxJobs) ; `allowed` faux ⇒ `resumeArmed = false` (et gel comme avant)
- [ ] la logique de décision extraite en fonction pure `V/core/motionGate.ts` : `export function gateStep(s: { gateAllowed: boolean; resumeArmed: boolean }, allowed: boolean): { gateAllowed: boolean; resumeArmed: boolean; action: 'none' | 'freeze' | 'arm' | 'resume' }` + tests (séquences : mouvement→arrêt→arm→resume ; arm puis mouvement ⇒ pas de resume ; resume unique)
- [ ] ordre du hook inchangé : `updateMotionGate` avant affinage et `update()` ; l'affinage (`refinedErrorTarget`, stillMs ≥ 500 ⇒ 0,5) s'applique dès l'image N (indépendant du gel)
- [ ] `[motion-gate] purge <n>` et `__glrMotionGate.purged` inchangés en forme
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npm test` vert (dernier compte 193 fichiers / 1811 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/TilesRendererLoader.ts` | E | :655-676 updateMotionGate ; hook :750-800 (lecture) |
| `V/core/motionGate.ts` | E | gateStep |
| `V/core/motionGate.test.ts` | E | tests |
| `V/core/staleQueuePurge.ts` | L | staleQueuedTiles |

## Contrats
Code actuel (TilesRendererLoader.ts:655-676) :
```ts
const updateMotionGate = (now: number): void => {
  const allowed = loadsAllowed(now, refine.lastMoveMs);
  if (allowed === gateAllowed) return;
  gateAllowed = allowed;
  gateTransitions += 1;
  console.log(allowed ? `[motion-gate] reprise (immobile ≥ ${MOTION_STILL_MS} ms)` : '[motion-gate] gel');
  applyDownloadJobs();
  if (allowed) {
    const stale = staleQueuedTiles(tilesRenderer.downloadQueue?.items ?? [], TILE_LOADING, tilesRenderer.frameCount);
    for (const t of stale) tilesRenderer.lruCache.remove(t);
    if (stale.length > 0) { gatePurged += stale.length; console.log(`[motion-gate] purge ${stale.length} tuiles hors vue`); }
    tilesRenderer.downloadQueue?.scheduleJobRun();
  }
  try { (window as unknown as { __glrMotionGate?: unknown }).__glrMotionGate = { allowed, transitions: gateTransitions, purged: gatePurged }; } catch { /* noop */ }
};
```
`applyDownloadJobs()` lit `gateAllowed` (moving = !gateAllowed) via `downloadJobs({ moving, vramThrottled, streamingActive, normal })` — seul écrivain runtime de maxJobs.
Hook (ordre) : pose → `updateMotionGate(now)` → relance tuiles en échec (utilise `gateAllowed`) → `refinedErrorTarget(refine.base, now - refine.lastMoveMs)` → `setResolutionFromRenderer` + `update()` (la lib incrémente `frameCount` dans update).
`staleQueuedTiles(items, loadingState, frameCount)` : LOADING et non (`__lastFrameVisited === frameCount && __used`).
Défaut T012-D1 : purge évaluée sur traversée à ET 4 (base) ; ET → 0,5 seulement après ⇒ 128/128 tuiles purgées redemandées +39…506 ms, 128 utilisées au repos ; repro `cd /tmp/t012-4kOe && OUT=out LABEL=x PRESET=standard DOLLY=5 node bench-rm.mjs && node rm.mjs out/t003-x.json` (attendu après : purge ≈ 0 en orbite proche, purge > 0 seulement pour tuiles hors frustum).

## Décisions actées
- D5/D6 : purge à la reprise via lruCache.remove ; plancher dès 500 ms ; D24 gel conservé (1 écrivain de maxJobs)
- reprise retardée d'1 image (~16 ms) acceptée

## Hors périmètre
- errorTargetRefine.ts, failedTileRetry.ts, staleQueuePurge.ts (lecture) ; SceneManager.ts, main.ts, lcc2/ ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` ; vitest env node ; fonction ≤ 60 l, 0 `any`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T013
statut: fait | bloque
---
## Fait
- chemin:L — quoi
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
