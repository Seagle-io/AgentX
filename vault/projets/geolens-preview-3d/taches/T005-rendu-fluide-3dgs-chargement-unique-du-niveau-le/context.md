---
pack: T005
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T005 — Rendu fluide 3DGS : chargement unique du niveau le plus fin

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
En lodMode `'fluid'`, `loadLcc2Scene` charge UNE fois le niveau le plus fin du manifest en entier (pleine qualité), sans démarrer de streamer ⇒ 0 chargement, 0 libération, 0 changement de LOD ensuite. Exposer un compteur pour le banc. Modes `'fixed'` et `'stream'` inchangés. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer.

## Definition of Done
- [ ] `effectiveLodMode` / `selectInitialLevel` : `'fluid'` (avec caméra et > 1 niveau) ⇒ `{ level: parsed.levels[parsed.levels.length - 1], overBudget: false, reason: 'fluid : pleine qualité depth=<d>' }` ; aucun appel à `selectLcc2Level` ni au budget pour ce mode
- [ ] `startLiveStreamer` ⇒ `null` pour `'fluid'` ; `Lcc2FluidStreamer` et `clampFluidBudget` plus importés si inutilisés (tsc noUnusedLocals) ; `streamerOwnsBase` faux ⇒ `dispose` libère les handles
- [ ] `'stream'` inchangé (base grossière + Lcc2Streamer) ; `'fixed'` inchangé
- [ ] compteur : `window.__glrSplatStats = { loads, frees, lodChanges }` (garde `typeof window !== 'undefined'`) : `loads++` à chaque `loadSplat` réussi de tuile (hors env), `frees += handles.length` au dispose, `lodChanges` = 0 posé ; remis à zéro au début de chaque `loadLcc2Scene`
- [ ] libellé : `(LOD adaptatif)` → `(pleine qualité, chargé une fois)` dans `G/web/viewer.html:805` ET `V/index.html:802`, rien d'autre ; `node scripts/check-viewer-html-sync.mjs` (depuis G) exit 0
- [ ] `V/loaders/lcc2/Lcc2Loader.test.ts` (neuf, env node, moteur factice) : manifest 3 niveaux ⇒ fluid charge exactement les fichiers du dernier niveau, `result.streamer === null`, `lodDepth` = dernier, 0 `loadSplat` après retour (attendre 2 ticks) ; fixed avec petit budget ⇒ niveau sous budget (non-régression) ; stream ⇒ niveau 0 + streamer non null (si testable sans DOM, sinon noter NV)
- [ ] `cd G/web && npm run typecheck` exit 0 · `npx vitest run src/viewer/loaders/lcc2` vert · `npm test` vert (base 183 fichiers / 1758 tests + nouveaux) — sorties collées
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/lcc2/Lcc2Loader.ts` | E | :88-131 mode/niveau/streamer, :152-171 boucle, :198-209 dispose |
| `V/loaders/lcc2/Lcc2Loader.test.ts` | E (neuf) | tests |
| `G/web/viewer.html` | E | :805 libellé seul |
| `V/index.html` | E | :802 libellé seul |
| `V/services/gaussianSplat/splatEngine.ts` | L | ISplatEngine, SplatHandle |
| `V/loaders/lcc2/Lcc2Manifest.ts` | L | format manifest pour le test, parseLcc2Manifest |
| `V/loaders/lcc2/Lcc2FluidStreamer.test.ts` | L | modèle de moteur factice |
| `G/scripts/check-viewer-html-sync.mjs` | L | garde HTML |

## Contrats
Code actuel (Lcc2Loader.ts:88-98) :
```ts
function effectiveLodMode(ctx: Lcc2LoadContext, parsed: ParsedLcc2): SplatLodMode {
  const mode = ctx.lodMode ?? 'fixed';
  return mode !== 'fixed' && ctx.camera && parsed.levels.length > 1 ? mode : 'fixed';
}
function selectInitialLevel(parsed: ParsedLcc2, mode: SplatLodMode, budget: number): Lcc2LevelSelection {
  if (mode === 'fixed') return selectLcc2Level(parsed, budget);
  return { level: parsed.levels[0], overBudget: false, reason: `${mode} : base depth=${parsed.levels[0].depth}` };
}
```
`startLiveStreamer` (:110-131) : `if (mode === 'fluid') { const fluid = new Lcc2FluidStreamer({...common, budget: clampFluidBudget(ctx.budget), targetPx: ctx.streamTargetPx ?? 1000, initialTiles: i.baseTiles}); fluid.start(); return fluid; }` puis branche stream (`new Lcc2Streamer({...common, baseDepth, budget: 6_000_000, targetPx})`).
Après la boucle (:199-202) : `const streamer = startLiveStreamer({...}); const streamerOwnsBase = mode === 'fluid';` ; dispose : `if (!streamerOwnsBase) for (const h of handles) h.dispose()`.
Boucle (:152-171) : `await ctx.engine.loadSplat({ url: ctx.tileUrl(rel), fileName })` par fichier de `sel.level.files`, `group.add`, `handles.push`, bbox, `numSplats += handle.getStats().numSplats` ; échec ⇒ `console.warn` et on continue.
SplatHandle : `object: THREE.Object3D` · `setVisible(visible: boolean): void` · `getStats(): SplatStats` (`numSplats`, `estimatedBytes`) · `getBoundingBox(): THREE.Box3` · `dispose(): void`.
Retour : `Lcc2LoadResult { group, tilesLoaded, numSplats, lodDepth, totalLevels, …, dispose, streamer }`.
Manifest réel villelaure : 5 niveaux (depth 1→5) ; depth 5 = 14 .sog, 7 388 760 splats ; levels triés grossier→fin (Lcc2Manifest.ts:97).

## Décisions actées
- D3 : fluid = chargement unique pleine qualité, 0 dynamisme (mouvement comme arrêt)
- D4 : niveau `levels.at(-1)` entier ; pas de repli budget ; streamer fluide non instancié mais fichiers conservés ; curseur détail sans effet live en fluid (accepté)

## Hors périmètre
- Lcc2FluidStreamer.ts, lcc2FluidCut.ts, lcc2BudgetGovernor.ts, lcc2TileLru.ts, Lcc2Streamer.ts (ni modif ni suppression)
- main.ts (gelé), qualityHud.ts, splatLodModeControl.ts ; TilesRendererLoader (maillage)
- commit, push ; serveur de test

## Dépendances de comportement
- main.ts:5417 passe `lodMode: readSplatLodMode()` et `camera` ; `currentSplatStreamer` reçoit `result.streamer` (null toléré : déjà le cas en 'fixed')
- vitest env node, 0 jsdom ⇒ moteur factice, pas de Spark

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (C3, T032, e2e/bench-*) — ne rien annuler
- eslint ignore src/viewer ; règles G : fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run typecheck, npm test, npx vitest, node scripts/check-viewer-html-sync.mjs, git diff, rg, sed -n)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T005
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
