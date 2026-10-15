---
pack: T004
projet: geolens-preview-3d
role: eclaireur
cree: 2026-10-14
tags: [pack]
---

# Pack T004 — Reco rendu fluide 3DGS : chargement unique pleine qualité

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre coordonnées + faits pour qu'un implémenteur, sans exploration, fasse du mode « Rendu fluide 3DGS (LOD adaptatif) » (lodMode `'fluid'`) un chargement UNIQUE pleine qualité au démarrage, puis 0 chargement / 0 déchargement / 0 changement de LOD pendant la navigation ; et qu'un banc headless local le prouve. Lister aussi toutes les sources possibles de clignotement en mode fluide. 0 modification. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer · S = …/seed-data/storage/villelaure-real/3dgs (lecture seule).

## Definition of Done
- [ ] cycle de vie du mode fluide : Lcc2Loader.ts branche `'fluid'` (chemin:L) → Lcc2FluidStreamer (création, boucle `update`, qui l'appelle et à quelle fréquence : chemin:L) ; tuiles de base possédées par le streamer (Loader:200)
- [ ] TOUS les points qui chargent, libèrent, remplacent ou changent l'opacité d'une tuile en mode fluide : coupe (lcc2FluidCut), LRU (lcc2TileLru), régulateur de budget (lcc2BudgetGovernor), fondu (opacité splatEngine.ts:49), curseur `streamTargetPx` en direct, budget preset (clampFluidBudget) — chemin:L + déclencheur (caméra ? fps ? temps ?)
- [ ] sources de clignotement candidates, chacune chemin:L : swap parent/enfants, fondu, oscillation du budget (governor), libération LRU puis rechargement, tri des splats Spark (SparkAdapter), double affichage base + fines, z-order
- [ ] « pleine qualité » : niveaux du manifest S/APT.lcc2 (parseLcc2Manifest / buildLcc2Tree) : nb niveaux, nb tuiles et nb splats par niveau, octets .sog du niveau le plus fin (node -e en lecture sur S) ; mode `'fixed'` : `selectLcc2Level` choisit le niveau le plus fin SOUS budget — chemin:L ; budget preset le plus haut (illimité à 100 % ? lcc2FluidMetric.ts:15,51)
- [ ] sélection du mode : `readSplatLodMode()` (core/splatLodMode.ts, main.ts:5417) — clé de stockage (localStorage ?) et valeurs ; case `index.html:802` ; comment forcer `'fluid'` depuis Playwright
- [ ] observables existants pour le banc : stats du streamer exposées sur window ? événements ? logs console ? (rg `window.__` dans lcc2/ et gaussianSplat/) ; sinon le point unique où ajouter un compteur `{loads, frees, lodChanges}`
- [ ] banc : comment ouvrir la scène 3DGS localement : entrée `deliverables[]` du `project.json` pour un livrable lcc2 (format exact, lu dans S/../project.json en lecture) ; URL tuile (`tileUrl`, glr-file://) ; copie de S vers `$STORE/villelaure-real/3dgs` suffisante ? bouton/flux UI pour afficher le 3DGS
- [ ] proposition de contrat ≤ 25 lignes : où couper le dynamisme (1 point), comment charger tout le niveau le plus fin une fois (réutiliser le chemin `'fixed'` ?), garde mémoire éventuelle, compteur pour le banc
- [ ] `result.md` ≤ 160 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. `rg` libre dans V/loaders/lcc2, V/services/gaussianSplat, V/core.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/lcc2/Lcc2Loader.ts` | L | 238 l, branches de mode |
| `V/loaders/lcc2/Lcc2FluidStreamer.ts` | L | 334 l, streamer fluide |
| `V/loaders/lcc2/lcc2FluidCut.ts` | L | coupe |
| `V/loaders/lcc2/lcc2FluidMetric.ts` | L | budget, erreur écran |
| `V/loaders/lcc2/lcc2BudgetGovernor.ts` | L | régulateur fps |
| `V/loaders/lcc2/Lcc2Manifest.ts` | L | niveaux, selectLcc2Level |
| `V/loaders/lcc2/lcc2FileGroups.ts` | L | groupes .sog |
| `V/core/splatLodMode.ts` | L | modes, lecture |
| `V/services/gaussianSplat/SparkAdapter.ts` | L | tri, opacité, Spark |
| `V/main.ts` | L | rg ciblé seulement (:5400-5430, readSplatLodMode, 9405 l gelé) |
| `S/APT.lcc2` | L | manifest réel |
| `G/e2e/bench-tileset.mjs` | L | project.json du banc (:166-172) |

## Contrats
```
demande humaine 2026-10-14 : « En mode fluide avec LOD 3DGS : NE PAS faire de rechargement dynamique. Tout charger UNE SEULE FOIS au démarrage (pleine qualité), puis plus aucun chargement/déchargement ni changement de LOD pendant la navigation, ni au mouvement ni à l'arrêt de la caméra. Ça doit supprimer le clignotement. »
Lcc2Loader.ts:43-45 : 'stream' (bêta) : base grossière + tuiles fines proches ; 'fluid' : rendu fluide (coupe sous budget, sans trou, fondu, cache). Les deux partent du niveau le plus grossier et requièrent `camera`.
Lcc2Loader.ts:3-6 (V1 'fixed') : on lit le manifest, on choisit le niveau LOD le plus fin qui tient dans le budget du preset, et on charge chaque tuile .sog de ce niveau comme un SplatMesh Spark (URL glr-file://).
banc existant : STORE=$T/storage ; tileset synthétique écrit sous $STORE/villelaure-real/ ; project.json avec `deliverables[]` obligatoire (sinon viewer `TypeError … reading 'filter'`) ; projet Villelaure id 0a1b2c3d-0000-4000-8000-000000000203
```
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online

## Décisions actées
- D3 : mode fluide 3DGS = chargement unique pleine qualité ; 0 LOD dynamique ; remplace la reprise 0,5 s pour ce mode
- gel D24 maintenu pour les tuiles 3D maillage
- seed-data/ intouché (lecture seule ; le banc copie vers $STORE)

## Hors périmètre
- modifier un fichier ; lancer navigateur, stack
- TilesRendererLoader (maillage) ; serveur de test ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (C3, T032, bancs e2e non commités)
- S = 234 Mo, 63 fichiers (APT.lcc2, data/, info/)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls, du, node -e en lecture), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 160 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Cycle de vie du mode fluide
- fait · chemin:L
## Points dynamiques (chargement, libération, LOD, opacité)
- quoi · chemin:L · déclencheur
## Sources de clignotement candidates
- quoi · chemin:L
## Pleine qualité : chiffres du manifest
| niveau | tuiles | splats | octets |
## Banc 3DGS
- fait · chemin:L
## Contrat proposé
```
≤ 25 lignes
```
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
