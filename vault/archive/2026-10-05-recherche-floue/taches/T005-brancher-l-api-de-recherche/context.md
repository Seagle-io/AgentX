---
pack: T005
projet: recherche-floue
role: implementeur
cree: 2026-10-04
---

# Pack T005 — Brancher l'API de recherche

## Mission
Faire passer `/api/recherche` par l'index trigramme puis reclasser les candidats
par distance de Levenshtein. Ne crée pas l'index : c'est T004, en parallèle de toi.

## Definition of Done
- [ ] `/api/recherche?q=chausure` renvoie « chaussure » en première position
- [ ] une requête exacte garde exactement ses résultats d'avant (non-régression)
- [ ] une requête vide renvoie `[]` avec un 200, pas une erreur
- [ ] p95 mesurée sous 80 ms sur le catalogue complet, chiffre collé dans `result.md`
- [ ] `npm test -- recherche` passe, sortie collée dans `result.md`

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `api/recherche.ts` | E | le handler, lignes 12-48 |
| `api/recherche.test.ts` | E | non-régression + nouveaux cas |
| `search/distance.ts` | E | Levenshtein borné, fichier à créer |

## Contrats
`search/index.ts` est écrit par T004 **en parallèle**. Il n'existe peut-être pas
encore sur le disque : code contre cette signature, ne l'ouvre pas, ne l'écris pas.
```ts
export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// requête vide -> [] ; jamais d'exception
```
Forme de réponse de l'API, inchangée :
```ts
type Reponse = { resultats: { id: string; titre: string; score: number }[] }
```

## Décisions actées
- Levenshtein uniquement sur les candidats renvoyés par l'index — jamais sur le
  catalogue entier (`decisions.md`, 2026-10-04).
- Distance maximale acceptée : 2. Au-delà, l'article est écarté.

## Hors périmètre
- `search/index.ts` et `search/normaliser.ts` — propriété de T004.
- Le cache de réponses.
- La pagination.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, `Bash(npm test:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` à côté de ce pack, avec exactement ces sections :
```markdown
---
tache: T005
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
