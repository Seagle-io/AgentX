---
projet: dashboard-direct
titre: Dashboard : manipulation directe, sans mode édition
maj: 2026-10-06
tags: [plan]
---

# Plan — Dashboard : manipulation directe, sans mode édition

## Découpage
| ID | Rôle | Livrable | Dépend de | Statut |
|---|---|---|---|---|
| T001 | eclaireur | carte du mode édition | — | fait |
| T002 | architecte | contrat props/hook/chrome/catalogue/testids/CSS | T001 | fait |
| T003 | implementeur | `grid.tsx` + CSS | T002 | fait |
| T004 | implementeur | `dashboard-page.tsx`, autosave | T002 | fait |
| T005 | implementeur | `cell-chrome.tsx`, catalogue, `tab-bar.tsx`, suppr. `edit/` | T002 | fait |
| T006 | implementeur | specs e2e | T002 | fait (NV exécution) |
| T007 | verificateur | casser : DÉFAUTS D1-D6 | T003-T006 | fait |
| T008 | scribe | capitalisation | T007 | fait (cette tâche) |
| T009 | implementeur | corriger D2 D3 D4 D5 D6 | T007 | fait |
| T010 | implementeur | spec annulation `exact:true` (D1) | T007 | fait |
| T011 | verificateur | re-vérifier D1-D6 : D1 D2 D3 D5 D6 OK, D4 partiel, D3+ nouveau | T009 T010 | fait |
| T012 | implementeur | restauration widget : refuser doublon (D3+) | T011 | fait |

## Vagues
- V1 : T001 → T002 (fait)
- V2 : T003 T004 T005 T006 parallèles (fait)
- V3 : T007 (fait) ; V4 : T009 T010 ∥ (fait) ; V5 : T011 (fait) ; V6 : T012 (en-cours)
- restant : T012 → re-vérif ; humain : e2e (stack) + validation écran → archivage

## Synchronisations
- après V1 : contrat recopié dans les 4 packs de V2
- après V2 : `npx tsc -b` par le chef avant T007

## Risques
| Risque | Signal | Parade |
|---|---|---|
| T004/T005 s'interfacent sans compiler | tsc KO après V2 | contrat T002 avec signatures exactes, T007 remonte |
| e2e non exécutables (stack) | T006/T007 NV | humain lance `make test-e2e` |
| auto-save en rafale | PUT à chaque frame | debounce + comparaison `sameLayout` |
