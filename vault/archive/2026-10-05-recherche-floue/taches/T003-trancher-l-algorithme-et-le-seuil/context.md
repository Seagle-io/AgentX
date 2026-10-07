---
pack: T003
projet: recherche-floue
role: architecte
cree: 2026-10-04
---

# Pack T003 — Trancher l'algorithme et le seuil

## Mission
Choisir la structure d'index et le seuil de tolérance, puis produire le contrat
que deux implémenteurs travaillant en parallèle devront respecter sans se parler.

## Definition of Done
- [ ] une recommandation unique, assumée, avec la contrainte qui décide nommée
- [ ] deux options comparées dont « le faire bêtement », coût à un an inclus
- [ ] le contrat d'index est complet : types, erreurs, invariants, exemple d'appel
- [ ] le point de non-retour est nommé
- [ ] la décision est ajoutée en append à `decisions.md`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/recherche-floue/decisions.md` | E | ta décision, en append |
| `api/recherche.ts` | L | la forme que l'API impose |
| `data/catalogue.ts` | L | la structure des articles |

## Contrats
Mesures du catalogue remontées par T002, à prendre pour acquises :
```
articles: 50 000
titre_len: 8 / 34 / 72 / 180
charset_hors_ascii: [é è ê à ç ô ü œ]
trigrammes_distincts: ~41 000
memoire_catalogue_mo: 47
```
Budget imposé : p95 < 80 ms, index reconstructible à froid en < 10 s.

## Décisions actées
- Pas de service externe, pas de dépendance lourde — tranché au cadrage.
- `/api/recherche` garde sa forme actuelle.

## Hors périmètre
- Écrire du code de production : tu produis des signatures, pas une implémentation.
- Le classement commercial.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` à côté de ce pack, avec exactement ces sections :
```markdown
---
tache: T003
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
