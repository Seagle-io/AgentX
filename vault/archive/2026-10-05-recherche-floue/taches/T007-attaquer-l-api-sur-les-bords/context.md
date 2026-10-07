---
pack: T007
projet: recherche-floue
role: verificateur
cree: 2026-10-04
---

# Pack T007 — Attaquer l'API sur les bords

## Mission
Tenter de faire tomber l'API livrée en T005. Reproduis d'abord ses affirmations,
puis attaque. Tu n'as pas le droit de réparer : tu constates.

## Definition of Done
- [ ] chaque ligne du `## Vérifié comment` de T005 est relancée par toi
- [ ] chaque case de la DoD de T005 est cochée avec sa preuve, ou déclarée fausse
- [ ] les bords sont attaqués : requête vide, 1 caractère, 200 caractères, accents, unicode
- [ ] verdict explicite en tête : CONFORME / DÉFAUTS / NON VÉRIFIABLE
- [ ] chaque défaut a une commande de reproduction

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/recherche-floue/taches/T005-brancher-l-api-de-recherche/result.md` | L | ce qu'il prétend |
| `api/recherche.ts` | L | le livrable |
| `search/distance.ts` | L | Levenshtein borné |
| `api/recherche.test.ts` | L | ce qui est déjà couvert |

## Contrats
Le contrat que T005 devait respecter :
```ts
type Reponse = { resultats: { id: string; titre: string; score: number }[] }
// requête vide -> 200 avec [] ; distance max acceptée : 2 ; p95 < 80 ms
```

## Décisions actées
- Départage à score égal : nombre de trigrammes communs — tranché par le chef
  après le blocage de T005, à vérifier.

## Hors périmètre
- Corriger quoi que ce soit.
- `search/index.ts` — c'était T006.
- Les remarques de style.

## Budget
- Lectures hors whitelist : **5 maximum** (marge pour un contre-exemple), à journaliser.
- Outils autorisés : Read, Grep, Glob, `Bash(npm test:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` avec les sections : `## Livré`, `## Vérifié comment`,
`## Écarts`, `## Pour la suite`, `## Retour sur le pack`.
