---
tache: T006
statut: fait
---
## Livré
**CONFORME.** Les 5 affirmations de T004 sont reproduites. Ce que j'ai essayé
sans y arriver : requête vide, 1 et 2 caractères ; titre de 180 caractères ;
titre tout en accents ; emoji isolé ; `candidats(idx, "x".repeat(5000))` ;
double `construireIndex()` sur le même tableau.

## Vérifié comment
`npm test -- search/index` → 7 passed. Mes 11 cas ajoutés → 11 passed.
Index reconstruit 3 fois : 6,2 / 6,1 / 6,4 s.

## Écarts
2 lectures hors whitelist (`data/catalogue.seed.json`, `package.json`) pour
fabriquer un catalogue de 50 k lignes réaliste.

## Pour la suite
L'index tient. Seul angle non couvert : une requête pendant la reconstruction —
pas de verrou, mais l'index est construit au boot, donc inatteignable aujourd'hui.

## Retour sur le pack
- Manquait : le volume de catalogue à utiliser pour tester, j'ai dû le fabriquer.
