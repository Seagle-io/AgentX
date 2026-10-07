---
pack: T004
projet: recherche-floue
role: implementeur
cree: 2026-10-04
---

# Pack T004 — Index trigramme en mémoire

## Mission
Construire l'index trigramme inversé et la fonction de candidats, dans
`search/index.ts`. Ne touche pas à l'API : c'est T005, en parallèle de toi.

## Definition of Base
Remplacé par la section ci-dessous.

## Definition of Done
- [ ] `construireIndex()` indexe 50 000 titres en moins de 10 s
- [ ] `candidats()` renvoie au plus 200 identifiants, triés par nombre de trigrammes communs
- [ ] les accents sont normalisés avant découpe (`é` et `e` donnent le même trigramme)
- [ ] un titre plus court que 3 caractères est indexé entier, sans planter
- [ ] `npm test -- search/index` passe, sortie collée dans `result.md`
- [ ] `git diff --stat` ne touche que les fichiers marqués E

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `search/index.ts` | E | le cœur du changement, fichier à créer |
| `search/index.test.ts` | E | les cas de la DoD |
| `search/normaliser.ts` | E | normalisation des accents |
| `data/catalogue.ts` | L | type `Article`, recopié ci-dessous |

## Contrats
Figé par l'architecte en T003. Respecte-le au caractère près : T005 code contre.
```ts
export type Article = { id: string; titre: string }

export type IndexTrigramme = {
  parTrigramme: Map<string, Set<string>>   // trigramme -> ids
  taille: number
}

export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// max par défaut : 200. Requête vide -> tableau vide, jamais d'exception.
```

## Décisions actées
- Index trigramme en mémoire, pas de Levenshtein sur tout le catalogue — le temps
  est la contrainte qui décide (voir `decisions.md`, 2026-10-04).
- Levenshtein n'est appliqué qu'aux candidats, et c'est le travail de T005.

## Hors périmètre
- `api/recherche.ts` — c'est T005, vous écririez dans le même fichier.
- Le classement final et le scoring commercial.
- Toute dépendance npm nouvelle.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, `Bash(npm test:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` à côté de ce pack, avec exactement ces sections :
```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
