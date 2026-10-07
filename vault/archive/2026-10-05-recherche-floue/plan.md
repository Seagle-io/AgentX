---
projet: recherche-floue
titre: Recherche tolérante aux fautes
maj: 2026-10-04
---

# Plan — Recherche tolérante aux fautes

## Découpage

| ID | Rôle | Livrable | Dépend de | Parallélisable avec |
|---|---|---|---|---|
| T001 | eclaireur | carte de la recherche actuelle | — | T002 |
| T002 | eclaireur | volume, forme et distribution du catalogue | — | T001 |
| T003 | architecte | contrat d'index + seuil de distance | T001, T002 | — |
| T004 | implementeur | index trigramme en mémoire | T003 | T005 |
| T005 | implementeur | branchement de l'API | T003 | T004 |
| T006 | verificateur | tentative de casse de l'index | T004 | T007 |
| T007 | verificateur | attaque des bords de l'API | T005 | T006 |
| T008 | implementeur | correction des défauts | T006, T007 | — |
| T009 | scribe | notes + gabarits corrigés | T008 | — |

## Vagues d'exécution
- **Vague 1** : T001, T002 (parallèle)
- **Vague 2** : T003
- **Vague 3** : T004, T005 (parallèle — fichiers disjoints)
- **Vague 4** : T006, T007 (parallèle)
- **Vague 5** : T008
- **Vague 6** : T009

## Points de synchronisation
- Après la vague 2 : le contrat d'index est recopié dans les packs T004 et T005.
  Sans ça les deux implémentations ne s'emboîtent pas.

## Risques
| Risque | Signal précoce | Parade |
|---|---|---|
| index trop lourd en mémoire | > 120 Mo au boot | passer en trigrammes tronqués |
| seuil trop permissif | résultats hors sujet en tête | remonter le seuil, test de non-régression |
