---
tache: T001
statut: fait
---
## Livré
Chemin complet requête → résultat, en coordonnées :
- `api/recherche.ts:12-48` — handler, filtre par `includes()` sur le titre
- `data/catalogue.ts:9` — catalogue chargé au boot, tableau simple, aucun index
- `api/recherche.test.ts:1-61` — 6 cas, **tous en correspondance exacte**

## Vérifié comment
`rg -n "recherche" --type ts` puis lecture des 3 fichiers. Aucun test lancé.

## Écarts
Aucun. Whitelist suffisante.

## Pour la suite
Il n'existe aucun index : la recherche est un `filter` linéaire sur 50 k titres.
Aucun test ne couvre les accents ni les fautes de frappe — tout est à écrire.
L'API renvoie déjà `{resultats: [{id, titre, score}]}`, le score est constant à 1.

## Retour sur le pack
- Manquait : rien.
- Inutile : la mention du classement commercial, hors sujet ici.
