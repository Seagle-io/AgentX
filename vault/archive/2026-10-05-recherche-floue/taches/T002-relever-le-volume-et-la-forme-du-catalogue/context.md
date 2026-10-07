---
pack: T002
projet: recherche-floue
role: eclaireur
cree: 2026-10-04
---

# Pack T002 — Relever le volume et la forme du catalogue

## Mission
Mesurer ce sur quoi l'index va tourner : nombre d'articles, longueur des titres,
caractères réellement présents, poids mémoire. Des chiffres, pas des impressions.

## Definition of Done
- [ ] nombre d'articles et poids mémoire du catalogue chargé, mesurés
- [ ] distribution des longueurs de titre (min, médiane, p95, max)
- [ ] inventaire des caractères hors `[a-z0-9 ]` réellement rencontrés
- [ ] estimation du nombre de trigrammes distincts
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `data/catalogue.ts` | L | structure et chargement |
| `data/catalogue.seed.json` | L | le jeu de données réel |
| `scripts/stats.ts` | L | s'il existe déjà, le réutiliser |

## Contrats
Rends tes mesures sous cette forme, elle sera recopiée telle quelle dans T003 :
```
articles: N
titre_len: min/med/p95/max
charset_hors_ascii: [...]
trigrammes_distincts: ~N
memoire_catalogue_mo: N
```

## Décisions actées
- Le catalogue est supposé tenir en mémoire — ta mesure confirme ou casse cette
  hypothèse. Si elle la casse, dis-le en tête de `## Pour la suite`.

## Hors périmètre
- Optimiser quoi que ce soit.
- Proposer une structure d'index.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash en lecture seule
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` à côté de ce pack, avec exactement ces sections :
```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
