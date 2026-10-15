---
projet: geolens-preview-3d
titre: GeoLens — preview 3D : affichage juste, chargement sobre, pleine résolution à l'arrêt
statut: cadrage
objectif: la preview 3D du viewer s'affiche sans défaut, charge moins (tuiles visibles d'abord, image nette plus tôt) et atteint le détail maximal à l'arrêt, prouvé en headless local avec captures avant/après et compte des requêtes
depot: /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
cree: 2026-10-13
tags: [projet, geolens, viewer, preview-3d]
---

# Brief — GeoLens — preview 3D

Source : demande humaine 2026-10-13 · suite de [[geolens-charge-3d]] D24 (gel des téléchargements en mouvement) · [[geolens-web-outillage]]

## Objectif
Preview 3D du viewer : 0 bug d'affichage connu, moins de requêtes et image nette plus tôt, détail maximal atteint caméra arrêtée, sans perte de qualité.

## Definition of Done du projet
- [ ] 1 bugs d'affichage de la preview 3D recensés, chacun corrigé ou explicitement écarté (raison)
- [ ] 2 chargement : moins de requêtes par scénario, tuiles visibles servies en premier, temps jusqu'à image nette réduit — chiffres avant/après
- [ ] 3 haute résolution à l'arrêt : niveau de détail maximal atteint ; 0 LOD plafonné, 0 texture sous-échantillonnée ou recompressée, erreur d'écran non permissive, devicePixelRatio respecté
- [ ] chaque correctif vérifié en navigateur headless local : captures avant/après + compte des requêtes, sorties collées
- [ ] web typecheck/lint/tests verts, sortie collée ; chaque lot passé au vérificateur

## Contraintes dures
- LOCAL seulement : 0 accès au serveur de test (82.65.97.67) sans accord humain explicite
- règles de G : `main.ts`, `server.ts` gelés → module dédié ; fichier neuf ≤ 400 l, fonction ≤ 60 l ; 0 `any`, 0 `@ts-ignore` ; fix = test de non-régression
- `seed-data/` intouché ; ports 4000 et 5173 = OrthoPro, intouchables
- gel des téléchargements en mouvement (D24 charge-3d) conservé
- agents : 0 commit, 0 push ; commit local par le chef sur décision humaine

## Hors périmètre
- API, base, déploiement ; serveur de test
- montée majeure de 3d-tiles-renderer ou three sans accord

## Hypothèses retenues
- un tileset synthétique local (niveaux et résolutions de texture lisibles à l'image) suffit à prouver 2 et 3 — à invalider si un bug n'apparaît qu'avec le modèle réel (alors demander à l'humain une copie locale du modèle de référence)

## Questions ouvertes
- copie locale d'un modèle réel (4 558 tuiles) pour les bugs d'affichage liés aux données — humain, si le synthétique ne suffit pas

## Carte du terrain
G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

| Quoi | Où | Note |
|---|---|---|
| loader tuiles | `G/web/src/viewer/loaders/TilesRendererLoader.ts` | presets, LRU, hook, C3, gel D24 |
| affinage arrêt | `G/web/src/viewer/core/errorTargetRefine.ts` | paliers 1,5 s / 3 s |
| presets | `G/web/src/viewer/core/QualityPresets.ts` | errorTarget, maxJobs |
| backpressure | `G/web/src/viewer/core/vramBackpressure.ts` | maxJobs 0 |
| HUD qualité | `G/web/src/viewer/ui/qualityHud.ts` | slider = base |
| lib | `G/web/node_modules/3d-tiles-renderer` | 0.3.46 |
