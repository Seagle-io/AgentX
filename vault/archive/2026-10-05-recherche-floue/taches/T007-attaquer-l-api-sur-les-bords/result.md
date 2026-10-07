---
tache: T007
statut: bloque
---
## Livré
Partiel. 6 cas sur 9 passés, puis arrêt.

## Vérifié comment
`npm test -- recherche` → 11 passed, conforme à ce que T005 annonce.
p95 remesurée : 64 ms (T005 annonçait 61 ms — même ordre, acceptable).

## Écarts
Aucune lecture hors whitelist.

## Pour la suite
**Question bloquante** : la DoD exige « aucune régression sur les requêtes
exactes », mais il n'existe aucun jeu de requêtes de référence dans le dépôt.
Faut-il en capturer un depuis les logs de production, ou la DoD se limite-t-elle
aux 6 cas écrits à la main ?

## Retour sur le pack
- Manquait : d'où vient le corpus de non-régression.
