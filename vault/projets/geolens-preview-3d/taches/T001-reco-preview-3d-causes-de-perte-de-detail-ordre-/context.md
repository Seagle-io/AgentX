---
pack: T001
projet: geolens-preview-3d
role: eclaireur
cree: 2026-10-13
tags: [pack]
---

# Pack T001 — Reco preview 3D : perte de détail, ordre de chargement, défauts suspects

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Recenser dans le code TOUT ce qui empêche la vue 3D (TilesRenderer, 3d-tiles-renderer 0.3.46) d'atteindre le détail maximal caméra arrêtée, ce qui fait charger trop ou dans le mauvais ordre, et les causes probables de défauts d'affichage. Chaque constat = hypothèse testable sur banc headless (quoi mesurer, quelle capture). 0 modification. V = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer · N = …/web/node_modules/3d-tiles-renderer/src.

## Definition of Done
- [ ] A · détail max à l'arrêt — pour chaque frein : chemin:L, valeur, effet, preset concerné : errorTarget par preset (QualityPresets.ts) et plancher `refinedErrorTarget` (min(base,1)) ; `shouldAutoRefine` (fusion ⇒ 0 affinage, slider ≠ 50 %, cache ≥ 90 % octets) ; `maxDepth` ; `errorTargetScale` ; LRU maxBytes/maxSize par preset + watchdog `hardGpuCeil` qui RÉTRÉCIT le cache (éviction de tuiles visibles ?) ; backpressure VRAM (maxJobs 0 ⇒ feuilles jamais chargées ?) ; `loadSiblings`, `stopAtEmptyTiles`, `displayActiveTiles`, `optimizeRaycast`
- [ ] A · textures : sous-échantillonnage / recompression / redimensionnement (rg `resize|downscale|maxTextureSize|ImageBitmap|anisotropy|minFilter|generateMipmaps|KTX2|transcod|toDataURL|quality`) dans loaders + plugins GLTF ; anisotropie appliquée ?
- [ ] A · résolution : `SceneManager.ts:181 setPixelRatio(Math.min(devicePixelRatio, 2))` — autres écritures (résolution dynamique en mouvement, composer/EDL/RenderModeManager à taille réduite, render scale preset) ; `setResolutionFromRenderer` cohérent avec le pixelRatio ?
- [ ] B · ordre/volume de chargement : `priorityCallback` / `lruCache.unloadPriorityCallback` surchargés ? ; `downloadMaxJobs`/`parseMaxJobs` par preset ; items périmés en file (hors vue) — la lib les retire-t-elle ? (N/base/TilesRendererBase.js) ; requêtes de tuiles parentes inutiles (refine REPLACE vs ADD) ; double chargement (2 instances, fusion) ; plugin cache tuiles (`backend/tileCache.ts`)
- [ ] C · défauts d'affichage probables : near/far caméra et précision profondeur (logarithmicDepthBuffer ?), z-fighting, trous entre LOD pendant remplacement, scintillement à l'affinage, frustum culling (`autoDisableRendererCulling=false`), tuiles qui disparaissent, transformations/géoréférencement, matériaux (sRGB/colorSpace des textures), EDL — chacun chemin:L
- [ ] instrumentation déjà exposée (`window.__glr*`, `[tile-mem]`, `[motion-gate]`) et ce qui manque pour mesurer A/B/C au banc
- [ ] liste priorisée ≤ 15 hypothèses : id · axe A/B/C · chemin:L · mesure banc · correctif probable (1 ligne)
- [ ] `result.md` ≤ 180 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule ; `rg` libre dans V et N (hors tests).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `V/loaders/TilesRendererLoader.ts` | L | 880 l ; presets appliqués, LRU, hook, gel D24 |
| `V/core/QualityPresets.ts` | L | errorTarget, jobs, budgets |
| `V/core/errorTargetRefine.ts` | L | paliers, gardes |
| `V/core/vramBackpressure.ts` | L | budget textures |
| `V/core/SceneManager.ts` | L | rg ciblé : renderer, caméra near/far, boucle (1949 l) |
| `V/core/RenderModeManager.ts` | L | composer, taille |
| `V/ui/qualityHud.ts` | L | rg ciblé : slider |
| `V/ui/mergedScene.ts` | L | rg ciblé : fusion, watchdog mutualisé |
| `V/backend/tileCache.ts` | L | plugin fetchData |
| `N/base/TilesRendererBase.js` | L | priorité, file, LRU |
| `N/three/TilesRenderer.js` | L | SSE, résolution, chargement contenu |
| `V/main.ts` | L | rg ciblé seulement (9405 l, gelé) |

## Contrats
```
demande humaine 2026-10-13 : « garantir que la haute résolution s'affiche correctement : on doit atteindre le niveau de détail maximal à l'arrêt de la caméra, sans perte de qualité (pas de LOD plafonné, pas de textures sous-échantillonnées ou recompressées, pas d'erreur d'écran trop permissive, devicePixelRatio respecté) » ; « moins de requêtes, priorité aux tuiles visibles, temps jusqu'à une image nette »
errorTargetRefine.ts : REFINE_STILL_MS = 1500 ; refinedErrorTarget(base, stillMs) : ≥ 3 s → min(base, 1), ≥ 1,5 s → max(base/2, floor), sinon base
shouldAutoRefine(s) = !s.fusion && !s.userOverride && !(s.maxBytes > 0 && s.cachedBytes >= 0.9 * s.maxBytes)
gel D24 (charge-3d, T032) : caméra en mouvement ⇒ downloadQueue.maxJobs = 0 ; reprise après 500 ms immobile (core/motionGate.ts) — à conserver
lib T031 : maxJobs=0 stoppe les départs ; items restent en file ; base:11 priorityCallback (profondeur, frustum, used, error) ; base:131 downloadQueue.maxJobs=10 · base:135 parseQueue.maxJobs=1
```

## Décisions actées
- preuve = banc headless local (captures + compte des requêtes), pas d'avis de code seul
- gel D24 conservé ; serveur de test interdit sans accord

## Hors périmètre
- modifier un fichier ; lancer navigateur, stack
- API, serveur de test ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; arbre sale attendu (C3 + T032 non commités)
- eslint ignore src/viewer (lint non probant sur V)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 180 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## A — détail maximal à l'arrêt
- frein · chemin:L · valeur · effet
## B — ordre et volume de chargement
- fait · chemin:L
## C — défauts d'affichage probables
- fait · chemin:L
## Hypothèses priorisées
| id | axe | chemin:L | mesure banc | correctif probable |
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
