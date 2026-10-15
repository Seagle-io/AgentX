---
pack: T074
projet: geolens-viewer
role: eclaireur
cree: 2026-10-09
---

# Pack T074 — Reco charge viewer : errorTarget d'entrée, détection caméra immobile existante, slider HUD, éviction par octets

> Seule source de vérité de l'agent T074. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre les coordonnées et faits nécessaires pour écrire 2 correctifs du viewer sans exploration : (C2) relever le plafond d'items du LRU 3d-tiles-renderer, en s'assurant que l'éviction par OCTETS fonctionne ; (C3) appliquer l'errorTarget du preset à l'entrée en mode mono web, puis l'abaisser progressivement quand la caméra est immobile ~1,5 s et le remonter au mouvement, en RÉUTILISANT une détection caméra existante et sans casser le slider HUD de précision ; 0 modification. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, V = G/web/src/viewer.

## Definition of Done
- [ ] C3 · TilesRendererLoader.ts:250-292 : intention d'origine du 0,75 px (commentaire, chiffres mesurés cités) ; `preset.errorTarget` par preset (QualityPresets.ts : valeurs econome/standard/haute/maximale) ; `errorTargetScale` : origine et valeur
- [ ] C3 · TOUS les écrivains de `errorTarget` après le chargement (rg `errorTarget` dans V hors tests) : fichier:ligne, déclencheur (slider HUD qualityHud.ts, vramBackpressure.ts, mergedScene.ts, homeCinematic.ts, splash.ts, packs/architecte, autres) et règle (valeur absolue ? multiplicateur ?) — conflit potentiel avec un raffinement automatique à l'arrêt : lequel doit gagner
- [ ] C3 · détection de mouvement/immobilité caméra EXISTANTE : rg `idle|Idle|cameraIdle|onCameraChange|controls.addEventListener|'change'|'start'|'end'|lastInteraction|isMoving|dirty` dans SceneManager.ts et main.ts (et contrôles caméra) → fichier:ligne, API (événement ? booléen ? timestamp ?), utilisable depuis TilesRendererLoader (accès à la caméra / aux contrôles ?) ; si aucune : où l'accrocher en 1 point
- [ ] C3 · boucle de rendu : où `tilesRenderer.update()` est appelé (fichier:ligne) ; le changement d'errorTarget à l'arrêt déclenche-t-il de nouvelles requêtes sans mouvement (le renderer ré-évalue-t-il à chaque update ?) ; rendu à la demande (render on demand) qui stopperait update à l'arrêt ?
- [ ] C2 · TilesRendererLoader.ts:240-320 : calcul `maxBytes`/`minBytes` (:242), `itemCapByPreset` (:305-310), `maxBytesSizeGiB` par preset ; log `[tile-mem]` (:677) : condition d'émission (flag ? intervalle ?), champs ; comment observer l'éviction par octets (lruItems vs bytes) ; version de 3d-tiles-renderer (package.json) et sémantique LRU maxSize/minSize vs maxBytesSize/minBytesSize (d.ts de la lib : chemin + signatures)
- [ ] tests existants couvrant TilesRendererLoader / presets / HUD (rg dans V `*.test.ts`) ; contraintes vitest env node
- [ ] proposition de contrat C3 (≤ 25 lignes) : où mettre l'état « entrée/arrêt », séquence preset → preset/2 → 1 px (paliers, délais), priorité vis-à-vis du slider HUD et de vramBackpressure
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. rg libre dans web/src/viewer et web/node_modules/3d-tiles-renderer (d.ts seulement).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | :230-330, :650-700 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/QualityPresets.ts` | L | presets (309 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/qualityHud.ts` | L | slider précision |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/vramBackpressure.ts` | L | écrit errorTarget |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/SceneManager.ts` | L | boucle de rendu, caméra (rg ciblé, 1949 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | L | rg ciblé seulement (9405 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/package.json` | L | version 3d-tiles-renderer |

## Contrats
```
mission humaine (D24), extrait :
- C2 : itemCapByPreset econome 1200 / standard 2000 / haute 3000 / maximale 4000 → ex. 4000 / 8000 / 12000 / 16000, minSize = 0,9 × max ; modèle de test 4 558 tuiles → 17 680 requêtes en Standard (thrash) ; ancien cap 20 000 ≈ crash ~6 600 tuiles AVANT l'éviction par octets
- C3 : `const MONO_WEB_ENTRY_ERROR_TARGET = 0.75;` ; `tilesRenderer.errorTarget = options.fusionMode === true ? preset.errorTarget * errorTargetScale : MONO_WEB_ENTRY_ERROR_TARGET;` → preset à l'entrée dans les 2 cas ; à l'arrêt ~1,5 s : preset → preset/2 → 1 ; remonte au mouvement ; slider HUD doit continuer à marcher ; réutiliser la détection d'immobilité existante si elle existe
- mesures k6 : ouverture = ~2 500 tuiles / 600 Mo ; cible après C3 : < 800 tuiles et < 100 Mo avant « première vue nette », puis affinage continu à l'arrêt
```

## Décisions actées
- D24 : périmètre strict, pas de commit ; réutiliser l'existant, 0 seconde détection d'immobilité

## Hors périmètre
- modifier un fichier ; lancer un navigateur ou la stack
- push, remote, PR, commit

## Environnement
- node v22.22.1 ; web/node_modules ; G HEAD da5fced, arbre propre

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T074
statut: fait | bloque
---
## C2 — LRU et octets
- fait · chemin:L
## C3 — errorTarget
- écrivains · chemin:L · règle
- détection d'immobilité existante · chemin:L · API
- boucle update · chemin:L
## Contrat proposé C3
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
