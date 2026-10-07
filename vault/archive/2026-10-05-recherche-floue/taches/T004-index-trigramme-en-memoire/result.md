---
tache: T004
statut: fait
---
## Livré
- `search/index.ts:1-96` — `construireIndex()` et `candidats()`, conformes au contrat
- `search/normaliser.ts:1-24` — pliage des accents avant découpe
- `search/index.test.ts:1-78` — 7 cas dont titres courts et requête vide

## Vérifié comment
`npm test -- search/index` → 7 passed, 0 failed, 1.9 s. Index construit en 6,2 s.

## Écarts
Aucune lecture hors whitelist.

## Pour la suite
Les titres de moins de 3 caractères sont indexés entiers, sous une clé préfixée
`\x00`. Si T005 itère sur les clés, il doit les ignorer.

## Retour sur le pack
- Manquait : le comportement attendu sur titre < 3 caractères était dans la DoD
  mais pas dans le contrat — j'ai tranché seul.
- Inutile : rien.
