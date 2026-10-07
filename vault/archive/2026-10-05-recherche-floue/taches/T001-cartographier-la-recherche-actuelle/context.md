---
pack: T001
projet: recherche-floue
role: eclaireur
cree: 2026-10-04
---

# Pack T001 — Cartographier la recherche actuelle

## Mission
Dresser la carte du chemin de recherche existant : qui reçoit la requête, qui
interroge le catalogue, où se décide le classement. Rendre des coordonnées, pas
du code recopié.

## Definition of Done
- [ ] le chemin requête → résultat est décrit en ≤ 8 lignes, avec `fichier:ligne`
- [ ] les signatures publiques du module de recherche sont recopiées
- [ ] les tests existants sont listés avec ce qu'ils couvrent réellement
- [ ] les absences confirmées sont dites (« aucun test sur les accents »)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `api/recherche.ts` | L | point d'entrée, 40 lignes |
| `data/catalogue.ts` | L | chargement du catalogue en mémoire |
| `api/recherche.test.ts` | L | ce qui est couvert aujourd'hui |

## Contrats
Aucun à respecter : ta sortie *est* le contrat pour T003.

## Décisions actées
- Pas de service externe — tranché au cadrage, ne cherche pas d'intégration.
- L'API publique `/api/recherche` ne change pas de forme.

## Hors périmètre
- Proposer un algorithme : c'est le travail de l'architecte en T003.
- Juger la qualité du code existant.
- Toucher au moindre fichier.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash en lecture seule
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` à côté de ce pack, avec exactement ces sections :
```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
