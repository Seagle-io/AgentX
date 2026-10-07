---
tache: T005
statut: fait
---
## Livré
- `api/recherche.ts:12-61` — passe par l'index puis reclasse par distance
- `search/distance.ts:1-38` — Levenshtein borné à 2, sortie anticipée
- `api/recherche.test.ts:1-94` — non-régression exacte + 5 cas de faute

## Vérifié comment
`npm test -- recherche` → 11 passed, 0 failed. p95 mesurée à 61 ms sur 50 k.

## Écarts
Départage à score égal tranché par le chef : nombre de trigrammes communs.

## Pour la suite
« chausure » renvoie bien « chaussure » en tête. La p95 tient avec de la marge.

## Retour sur le pack
- Manquait : la règle de départage — ajoutée après coup.
