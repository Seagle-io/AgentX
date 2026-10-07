---
tache: T003
statut: fait
---
## Livré
Décision ajoutée à `decisions.md`. Contrat figé :
```ts
export type IndexTrigramme = { parTrigramme: Map<string, Set<string>>; taille: number }
export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
```
Seuil de distance : 2. Candidats : 200 au plus.

## Vérifié comment
Non vérifié — aucun code produit, c'est un contrat.

## Écarts
Aucun.

## Pour la suite
Le contrat est recopiable tel quel dans T004 et T005 : ils peuvent partir
ensemble sans se parler. Point de non-retour : la mise à jour à chaud de l'index
devient difficile une fois `parTrigramme` figé en `Map`.

## Retour sur le pack
- Manquait : rien.
- Inutile : rien.
