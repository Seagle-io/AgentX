---
pack: T031
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-13
tags: [pack]
---

# Pack T031 — Reco gel des chargements de tuiles pendant le mouvement caméra

> Seule source de vérité de l'agent T031. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre coordonnées + faits pour écrire sans exploration la règle humaine : « caméra en mouvement ⇒ 0 nouveau chargement de tuile ; reprise seulement après 0,5 s d'immobilité continue ». Viewer 3D, lib 3d-tiles-renderer 0.3.46. 0 modification. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, V = G/web/src/viewer, N = G/web/node_modules/3d-tiles-renderer/src.

## Definition of Done
- [ ] lib · chemin des requêtes : `TilesRendererBase.update()` → traversée → `requestTileContents`/`queueTileForDownload` → `downloadQueue`/`parseQueue` (N/base/TilesRendererBase.js:L, N/utilities/PriorityQueue.js:L) ; lignes exactes où un fetch part
- [ ] lib · leviers de pause, chacun avec chemin:L + effet sur l'affichage : (a) ne pas appeler `update()` ; (b) `downloadQueue.maxJobs = 0` / `autoUpdate` / `scheduleJobRun` ; (c) `priorityCallback`/`removeByFilter` ; (d) autre API publique (d.ts) — pour chacun : les jobs déjà en file partent-ils à la reprise ? les tuiles déjà chargées restent-elles affichées/LOD recalculé ? fetch en vol annulé ?
- [ ] lib · `parseQueue` : un job de parse d'une tuile déjà téléchargée part-il pendant la pause ? (parse = CPU, pas réseau)
- [ ] V · détection d'immobilité existante (correctif C3, non commité) : TilesRendererLoader.ts `scene.onBeforeRender`, `poseChanged`, horodatage du dernier mouvement → chemin:L, variables, réutilisable tel quel pour un seuil 500 ms ?
- [ ] V · où `tilesRenderer.update()` est appelé (chemin:L) ; nb d'instances TilesRenderer (mono, fusion `ui/mergedScene.ts`) ; chacune passe-t-elle par le même point ?
- [ ] V · autres sources de requêtes pilotées par la caméra : `loaders/COPCLoader.ts` (nuage de points, chargement par vue ?), plugin `backend/tileCache.ts` (fetchData : hit Cache Storage = 0 réseau) → chemin:L, se déclenche-t-il au mouvement ?
- [ ] tests existants : `core/errorTargetRefine.test.ts` (env node, pur) ; autres tests touchant TilesRendererLoader (rg `*.test.ts`)
- [ ] proposition de contrat ≤ 25 lignes : module pur (ex. `core/motionGate.ts`) + point d'accroche unique + levier choisi + règle COPC
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. `rg` libre dans V et N.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/web/src/viewer/loaders/TilesRendererLoader.ts` | L | 867 l ; création renderer, onBeforeRender C3, plugins |
| `G/web/src/viewer/core/errorTargetRefine.ts` | L | 45 l ; poseChanged, REFINE_STILL_MS |
| `G/web/src/viewer/core/errorTargetRefine.test.ts` | L | style de test pur |
| `G/web/src/viewer/ui/mergedScene.ts` | L | fusion, rg ciblé |
| `G/web/src/viewer/loaders/COPCLoader.ts` | L | 739 l, rg ciblé |
| `G/web/src/viewer/loaders/FileManager.ts` | L | :228-270 appelant mono |
| `G/web/src/viewer/backend/tileCache.ts` | L | plugin fetchData |
| `G/web/src/viewer/core/SceneManager.ts` | L | rg ciblé seulement (boucle de rendu) |
| `N/base/TilesRendererBase.js` | L | update, file de téléchargement |
| `N/base/TilesRendererBase.d.ts` | L | API publique |
| `N/utilities/PriorityQueue.js` | L | maxJobs, scheduling |
| `N/utilities/PriorityQueue.d.ts` | L | API publique |

## Contrats
```
règle humaine 2026-10-13 : « quand la caméra de la preview bouge, je recharge rien tant que la caméra n'a pas arrêté de bouger pendant 0,5 s d'affilée »
C3 existant (errorTargetRefine.ts) :
export const REFINE_STILL_MS = 1500;
export function refinedErrorTarget(base: number, stillMs: number): number
/** Pose = matrixWorld (16) + projectionMatrix (16) de la caméra. */
export function poseChanged(prev: Float32Array | number[] | null, next: ArrayLike<number>, eps = 1e-6): boolean
```

## Décisions actées
- réutiliser la détection d'immobilité C3 (poseChanged) ; 0 seconde détection
- D22 : cache tuiles viewer = plugin fetchData + Cache Storage
- main.ts, server.ts gelés ; nouveau code en module dédié ≤ 400 l, fonction ≤ 60 l

## Hors périmètre
- modifier un fichier ; lancer navigateur, stack, tests
- commit, push

## Environnement
- node v22.22.1 ; G git local master, HEAD 17d1f85 ; arbre sale : TilesRendererLoader.ts, qualityHud.ts, errorTargetRefine*.ts = C3 non commité (normal)
- G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online ; N = G/web/node_modules/3d-tiles-renderer/src

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T031
statut: fait | bloque
---
## Lib — chemin des requêtes et leviers
- fait · chemin:L · effet
## Viewer — accroches
- immobilité C3 · chemin:L
- update() · chemin:L · instances
- autres sources (COPC, tileCache) · chemin:L
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
