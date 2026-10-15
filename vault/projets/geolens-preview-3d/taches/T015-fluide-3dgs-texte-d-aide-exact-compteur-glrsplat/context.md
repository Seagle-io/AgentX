---
pack: T015
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T015 — Fluide 3DGS : texte d'aide exact, compteur __glrSplatStats fiable

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger D1/D2 du vérificateur T006 : (D1) le texte d'aide du « Rendu fluide 3DGS » décrit un budget/fondu/cache qui n'existent plus ; (D2) `window.__glrSplatStats` remis à zéro à chaque ouverture et `lodChanges` jamais incrémenté ⇒ preuve banc tautologique. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] D1 : texte sous `#splat-fluid-toggle` remplacé, identique dans `web/viewer.html:~808` et `V/index.html:~805` : « Charge une seule fois toute la scène au niveau le plus fin, puis plus aucun chargement ni changement de détail pendant la navigation : aucun clignotement. Demande plus de mémoire et un chargement initial plus long. Splat LCC2. » ; `rg -n "Affine la scène sous un budget fixe" web/viewer.html web/src/viewer` → 0 (2 sur HEAD de l'arbre)
- [ ] D1 : commentaire `V/core/splatLodMode.ts:5-6` (`'fluid'`) → « chargé une fois au niveau le plus fin, rien ne bouge ensuite » ; 0 changement de code dans ce fichier
- [ ] D2 : compteur cumulatif par page, PAS remis à zéro par `loadLcc2Scene` : `window.__glrSplatStats = { opens, loads, frees, lodChanges }` créé une fois (réutilisé s'il existe) ; `opens++` à chaque `loadLcc2Scene`
- [ ] D2 : `loads` = toute `engine.loadSplat` résolue (tuiles initiales, env, ET streamer du mode 'stream') ; `frees` = tout `SplatHandle.dispose()` (dispose de scène ET streamer) ; via un moteur compteur passé au streamer (contrat ci-dessous), pas en modifiant Lcc2Streamer
- [ ] D2 : `lodChanges` = loads + frees survenus APRÈS la fin du chargement initial et AVANT le dispose de la scène (ce qu'un parcours caméra peut provoquer) ; fluid et fixed ⇒ 0 par construction ; stream ⇒ > 0 dès que le streamer charge
- [ ] tests `Lcc2Loader.test.ts` mis à jour + nouveaux : 2 ouvertures successives ⇒ opens 2, loads cumulés ; stream avec streamer factice qui charge 1 tuile après init ⇒ lodChanges ≥ 1 (ou test du moteur compteur seul si le streamer réel n'est pas pilotable en test node) ; dispose ⇒ frees += handles, lodChanges inchangé
- [ ] `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 · `npx vitest run src/viewer/loaders/lcc2` vert · `npm test` vert (dernier compte 193 fichiers / 1816 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/lcc2/Lcc2Loader.ts` | E | :103-130 streamer + stats ; :132-215 loadLcc2Scene |
| `V/loaders/lcc2/Lcc2Loader.test.ts` | E | :69-96 attentes stats |
| `V/core/splatLodMode.ts` | E | :1-7 commentaire seulement |
| `G/web/viewer.html` | E | :806-809 texte d'aide |
| `V/index.html` | E | :803-806 texte d'aide |
| `V/services/gaussianSplat/splatEngine.ts` | L | ISplatEngine, SplatHandle |
| `V/loaders/lcc2/Lcc2Streamer.ts` | L | options `engine` du constructeur (rg `engine`) |

## Contrats
splatEngine.ts (verbatim, extrait) :
```ts
export interface SplatHandle { readonly object: THREE.Object3D; readonly isReady: boolean; setVisible(visible: boolean): void; setOpacity?(opacity: number): void; getStats(): SplatStats; getBoundingBox(): THREE.Box3; dispose(): void; }
export interface ISplatEngine { init(scene, renderer): void; readonly isInitialized: boolean; loadSplat(source: SplatLoadSource, opts?: SplatLoadOptions): Promise<SplatHandle>; readonly activeSplatCount: number; dispose(): void; }
```
Lcc2Loader.ts actuel :
```ts
interface Lcc2SplatStats { loads: number; frees: number; lodChanges: number }
function resetSplatStats(): Lcc2SplatStats { const stats = { loads: 0, frees: 0, lodChanges: 0 }; window.__glrSplatStats = stats; return stats; }
// loadLcc2Scene : stats = resetSplatStats() ; boucle tuiles ctx.engine.loadSplat → stats.loads++ ; env via ctx.engine.loadSplat (non compté) ;
// startLiveStreamer({ ctx, parsed, mode, group, baseDepth }) → new Lcc2Streamer({ engine: ctx.engine, group, camera, tileUrl, treeRoot, heightPx, baseDepth, budget: 6_000_000, targetPx }) seulement si mode === 'stream'
// dispose : streamer.dispose() ; handles.dispose() ; stats.frees += handles.length ; env.dispose() ; ctx.engine.dispose()
```
Cible :
```ts
export interface Lcc2SplatStats { opens: number; loads: number; frees: number; lodChanges: number }
function sharedSplatStats(): Lcc2SplatStats  // window.__glrSplatStats existant (forme complète) sinon neuf ; objet module si pas de window
function countingEngine(engine: ISplatEngine, stats: Lcc2SplatStats, phase: { initialDone: boolean; disposed: boolean }): ISplatEngine
// loadSplat résolu ⇒ loads++ (+ lodChanges++ si initialDone && !disposed) ; handle.dispose enveloppé ⇒ frees++ (+ lodChanges++ si initialDone && !disposed) ; autres membres délégués (getter isInitialized/activeSplatCount)
```
loadLcc2Scene utilise `countingEngine` pour TOUS les loadSplat (tuiles, env, streamer) ; `phase.initialDone = true` juste avant `startLiveStreamer` ; `phase.disposed = true` en tête de dispose. `stats.frees += handles.length` manuel supprimé (compté par l'enveloppe).
Mesure T006 : fluid 15 req .sog init, 0 parcours ; stream 5 req parcours mais stats `{loads:1,…}` et lodChanges 0 ⇒ défaut.

## Décisions actées
- D3/D4 : fluid = niveau le plus fin entier, 0 streamer, rien après init
- Lcc2FluidStreamer / lcc2FluidCut / FLUID_BUDGET_DROP_EVENT : code mort, laissé tel quel (tâche à part)

## Hors périmètre
- Lcc2Streamer.ts, Lcc2FluidStreamer.ts, splatLodModeControl.ts, SparkAdapter (écriture) ; budget/preset du mode fluid (risque OOM, décision à part) ; main.ts ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (fichiers lcc2 non suivis) — ne rien annuler
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer) ; vitest env node ; fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`
- T016 édite SceneManager/EDLRenderer/navigationScheme en parallèle : ne pas y toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx tsc, npm test, npx vitest, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T015
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
