---
pack: T006
projet: recherche-floue
role: verificateur
cree: 2026-10-04
---

# Pack T006 — Casser l'index trigramme

## Mission
Tenter de faire tomber l'index livré en T004. Reproduis d'abord ses affirmations,
puis attaque. Tu n'as pas le droit de réparer : tu constates.

## Definition of Done
- [ ] chaque ligne du `## Vérifié comment` de T004 est relancée par toi
- [ ] chaque case de la DoD de T004 est cochée avec sa preuve, ou déclarée fausse
- [ ] les bords sont attaqués : requête vide, 1 caractère, 200 caractères, accents, unicode
- [ ] verdict explicite en tête : CONFORME / DÉFAUTS / NON VÉRIFIABLE
- [ ] chaque défaut a une commande de reproduction

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/recherche-floue/taches/T004-index-trigramme-en-memoire/result.md` | L | ce qu'il prétend |
| `search/index.ts` | L | le livrable |
| `search/normaliser.ts` | L | le pliage d'accents |
| `search/index.test.ts` | L | ce qui est déjà couvert |

## Contrats
Le contrat que T004 devait respecter :
```ts
export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// max par défaut 200 ; requête vide -> [] ; jamais d'exception
```

## Décisions actées
- Les titres de moins de 3 caractères sont indexés entiers sous une clé `\x00` —
  signalé par T004, à vérifier, pas à rediscuter.

## Hors périmètre
- Corriger quoi que ce soit.
- `api/recherche.ts` — c'est T007.
- Les remarques de style.

## Budget
- Lectures hors whitelist : **5 maximum** (marge pour un contre-exemple), à journaliser.
- Outils autorisés : Read, Grep, Glob, `Bash(npm test:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` avec les sections : `## Livré`, `## Vérifié comment`,
`## Écarts`, `## Pour la suite`, `## Retour sur le pack`.
