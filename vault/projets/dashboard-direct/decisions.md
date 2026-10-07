# Decisions — Dashboard : manipulation directe, sans mode édition

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-06 — Une seule vérité locale (historique) et un seul canal d'écriture (PUT entier débouncé 800 ms) ; l'écho serveur n'écrase jamais un geste
- **Contexte** : sans mode édition, chaque geste persiste seul ; undo doit survivre aux sauvegardes ; 4 implémenteurs parallèles.
- **Choix** : `useEditHistory` vit toute la session = état affiché ; `useLayoutAutosave` PUT `toServer(tabs)` 800 ms après le dernier geste enregistré, 1 requête en vol max ; resync serveur→local seulement si statut `idle` et données ≠ dernier écho (`sameTabs`). Config widget passe par le même PUT (PATCH abandonné côté page). Glisser = toute la carte (`cancel` sélecteur, threshold 6) ; catalogue = `FlyingModal` non modal, DnD HTML5 → RGL `dropConfig` ; réglages = roue au survol → `FlyingModal` + `CellSettings`.
- **Écarté** : PUT immédiat par geste, rendu depuis le cache — réponses désordonnées rembobinent la grille ; cache react-query optimiste comme état — refetch écrase un geste en cours ; PATCH config séparé — deux canaux, courses PUT/PATCH ; prise `.dash-grip` — mode édition déguisé ; catalogue en `Dialog` — overlay modal bloque le dépôt.
- **Conséquence** : facile : undo/redo inchangés, coalesce existant réutilisé, une file d'écriture. Difficile : modifications concurrentes multi-poste (dernier PUT gagne) ; tout widget à zone glissable interne doit poser `.dash-nodrag`.
- **À revoir si** : PUT entier > 300 ms p95 ou 413 ; usage multi-poste simultané signalé ; un widget perd ses clics à cause du glisser plein-carte.
