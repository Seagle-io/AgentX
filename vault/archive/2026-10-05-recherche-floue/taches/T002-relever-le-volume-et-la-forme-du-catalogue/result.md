---
tache: T002
statut: fait
---
## Livré
```
articles: 50 000
titre_len: 8 / 34 / 72 / 180
charset_hors_ascii: [é è ê à ç ô ü œ]
trigrammes_distincts: ~41 000
memoire_catalogue_mo: 47
```

## Vérifié comment
Script de comptage lancé sur `data/catalogue.seed.json` — sortie collée ci-dessus.

## Écarts
Aucun.

## Pour la suite
L'hypothèse « le catalogue tient en mémoire » tient : 47 Mo. L'index trigramme
ajoutera ~18 Mo. 1,8 % des titres font moins de 3 caractères : il faudra les
indexer entiers sinon ils disparaissent.

## Retour sur le pack
- Manquait : le seuil mémoire acceptable n'était pas donné, j'ai mesuré sans cible.
- Inutile : rien.
