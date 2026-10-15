# Decisions — GeoLens — preview 3D : affichage juste, chargement sobre, pleine résolution à l'arrêt

Une decision = un bloc. Jamais de reecriture, on ajoute.

## D1 — 2026-10-14 — définition du détail maximal et de la densité (humain)
- détail max à l'arrêt = erreur d'écran ≤ 0,5 px PHYSIQUE (setResolutionFromRenderer = drawing buffer ⇒ dpr inclus) ; pas de chargement systématique des feuilles
- devicePixelRatio réel, sans plafond ×2 ; relu au changement (resize, matchMedia resolution)
- supersède le plancher C3 `min(base, 1)` (errorTargetRefine.ts:21-25, [[geolens-viewer]] D24) pour la valeur finale

## D2 — 2026-10-14 — méthode (chef, T001)
- chaque lot : banc headless local AVANT (dist de référence) puis APRÈS, captures + compte des requêtes, sorties collées ; puis vérificateur
- TilesRendererLoader.ts = 1 seul écrivain par vague (lots loader séquentiels) ; SceneManager.ts en parallèle via contrat d'événement
- SwiftShader ⇒ tier GPU « integrated » ⇒ preset standard forcé (main.ts:1498, QualityPresets.ts:299-307) : le banc stubbe le tier pour mesurer haute/maximale
- gel D24 (charge-3d) conservé : purge/retri de la file à la reprise autorisés

## D3 — 2026-10-14 — rendu fluide 3DGS : chargement unique pleine qualité, 0 LOD dynamique (humain, prioritaire)
- constat humain : clignotement persistant dans la preview 3D en « Rendu fluide 3DGS (LOD adaptatif) » (lodMode 'fluid', loaders/lcc2/)
- règle : en mode fluide 3DGS, tout charger UNE fois au démarrage en pleine qualité ; ensuite 0 chargement, 0 déchargement, 0 changement de LOD pendant la navigation (mouvement comme arrêt)
- remplace pour ce mode la logique « reprise après 0,5 s » ([[geolens-charge-3d]] D24, T031-T032) ; le gel D24 reste pour les tuiles 3D maillage
- preuve au banc : après chargement initial, 0 requête et 0 changement de LOD sur un parcours caméra ; captures avant/après
- prioritaire sur les vagues 1-2 du plan

## D4 — 2026-10-14 — mise en œuvre de D3 (chef, T004)
- fluid ⇒ niveau `parsed.levels.at(-1)` entier (villelaure : depth 5, 14 .sog, 7 388 760 splats, 121 Mo), chargé par la boucle du mode 'fixed' (Lcc2Loader.ts:152-171) ; AUCUN Lcc2FluidStreamer (ni coupe, ni LRU, ni régulateur fps, ni fondu)
- pas de repli budget silencieux (pleine qualité exigée) ; seul garde-fou = tuile en échec journalisée (existant)
- libellé `(LOD adaptatif)` → `(pleine qualité, chargé une fois)` dans viewer.html ET src/viewer/index.html
- curseur « Niveau de détail » sans effet en direct en mode fluide (accepté) ; streamer fluide conservé en code (tests purs), non instancié
- compteur banc `window.__glrSplatStats = {loads, frees, lodChanges}`
- à revoir si : crash GPU / onglet tué sur portable avec 7,4 M splats

## D5 — 2026-10-14 — chargement sobre après mesures T003 (chef)
- reprise du gel : les tuiles en file non `__used` sont retirées via `lruCache.remove(tile)` (callback d'unload de la lib : abort + retrait de file + état UNLOADED) ⇒ −14 à −33 % de requêtes après dolly/pan (T003)
- affinage : mouvement → base ; immobile ≥ 500 ms (= reprise du gel) → plancher 0,5 px directement ; escalier 1,5 s / 3 s supprimé (100 % des requêtes post-orbite sont dans la dernière vague, net ≥ 11,7 s après arrêt)
- priorité de file inchangée (tuiles inutiles déjà servies en queue, rang 0,84-0,99)
- H13 (traverse par tuile) : rien à faire à 1365 tuiles (≈ 0,1 s au total)
- en attente : débit de parse ≈ 1 tuile/frame (à mesurer sur GPU réel) ; animation de cadrage à l'ouverture gelée 3,9-4,1 s (règle humaine littérale, question à l'humain)

## D6 — 2026-10-14 — retour T010 : garde cache supprimée, relance par retrait du LRU (chef)
- D1 T010 : garde « cache ≥ 90 % » + hystérésis < 80 % ⇒ bloquée à vie (LRU n'évince pas sous minBytes = 0,85×max, TilesRendererLoader.ts:262, LRUCache.js:342) ⇒ ET figé à base (4 en standard)
- choix : SUPPRIMER la garde de l'affinage ; cache plein ⇒ la lib cesse d'elle-même les requêtes (`isFull`, base:286), tuiles utilisées non évincées ⇒ pas de thrash ; meilleure qualité possible sous budget
- écarté : déblocage < 0,85 (réoscille 0,85↔0,9, le H1 d'origine) ; garde sur isFull (même blocage)
- D2 T010 : `resetFailedTiles()` laisse la tuile dans le LRU ⇒ `lruCache.add` false ⇒ 0 requête ; choix : tuiles FAILED retirées par `lruCache.remove(t)` puis `resetFailedTiles()` (stats, racine)
- à revoir si : mémoire GPU dépasse le budget sur gros modèle (budget ≠ VRAM réelle)

## D7 — 2026-10-14 — cadrage d'ouverture exempté du gel (humain)
- humain : « oui exempte le cadrage d'ouverture » (supersède D24 « animations programmées = mouvement » pour l'ouverture seulement)
- définition retenue (chef) : tout mouvement caméra AVANT la 1re entrée utilisateur sur la vue (pointerdown, wheel, touchstart sur le canvas ; keydown sur window) depuis la création du loader = ouverture ⇒ ne gèle pas les téléchargements ; couvre accueil cinématique, fits 1re tuile (+1 s), polls de cadrage
- l'affinage reste lié au mouvement : pendant le cadrage ⇒ base (pas 0,5 px sur des vues de transition)
- au démarrage : téléchargements autorisés d'emblée (plus de 500 ms de gel initial)
- après la 1re entrée : D24 intact pour tout mouvement, programmé compris (raccourcis de vue, vues enregistrées)
- à revoir si : vue d'accueil animée en boucle longue fait télécharger des tuiles inutiles en masse

## D8 — 2026-10-14 — retour T020 : fin d'ouverture = 1re entrée hors accueil (chef)
- précise D7 : entrée = pointerdown/wheel/touchstart/keydown n'importe où dans la vue (barre d'outils comprise), ignorée tant que `body.gx-home-open` (accueil cinématique, clic « Explorer » compris)
- motif : T020-D2 clic `[data-view="top"]` sans entrée canvas ⇒ animation voulue non gelée (722 req)
- vues enregistrées : zoom ortho stocké et restitué (T020-D1) ; vue d'accueil : pas encore (synchro desktop)
