# Decisions — Recherche tolérante aux fautes

Une décision = un bloc. Jamais de réécriture, on ajoute.

## 2026-10-04 — Index trigramme en mémoire plutôt que Levenshtein à la volée
- **Contexte** : 50 000 titres, budget 80 ms p95. Levenshtein sur tout le catalogue
  à chaque requête coûte ~400 ms — la contrainte qui décide est le temps, pas la qualité.
- **Choix** : index trigramme inversé construit au boot, Levenshtein appliqué
  seulement aux 200 meilleurs candidats.
- **Écarté** : Levenshtein pur (trop lent) ; moteur externe (interdit par le brief).
- **Conséquence** : rend le reclassement facile, rend la mise à jour à chaud difficile.
- **À revoir si** : le catalogue dépasse 200 000 articles.
