---
projet: orthopro
titre: OrthoPro — front et back
maj: 2026-10-05 (soir)
---

# Plan — vague « widgets du dashboard » (ortho-front, `Ultime`)

## Découpage
| ID | Rôle | Livrable | Dépend de | Parallélisable avec |
|---|---|---|---|---|
| T001 | eclaireur | carte cœur dashboard | — | T002 |
| T002 | eclaireur | inventaire 42 widgets | — | T001 |
| T003 | implementeur | outillage : node 24, typecheck réel | — | T004-T009 |
| T004 | implementeur | fiabilité page : erreurs layout/summary/migration, memo | — | T003,T005-T009 |
| T005 | implementeur | parsing layout extrait + tests layout-ops/history | — | T003,T004,T006-T009 |
| T006 | implementeur | module format dates partagé + tests | — | T003-T005,T007-T009 |
| T007 | implementeur | états L/E/V quick-reply, kora-news, onboarding | — | … |
| T008 | implementeur | états erreur free-slots, week-grid, tomorrow, useful-links | — | … |
| T009 | implementeur | clock : util extrait, tests, erreurs, WidgetCard | — | … |
| T010+ | verificateur | 1 par lot T003-T009 | lot | entre eux |
| T010 | architecte | audit structure, contrats vague 3 | — | V2 |
| T015/T017 | implementeur | widget-state.ts unique, 7 copies supprimées | T007,T008 | — |
| T019/T021 | implementeur | correctifs page (T013) et clock (T016) | vérifs | — |
| V3-A1 | implementeur | widget-card `tour?` + WidgetCard today, forecast | V2 | A2,B*,D |
| V3-A2 | implementeur | WidgetCard activity (chart+year), worklists | V2 | A1,B*,D |
| V3-B1 | implementeur | tests pomodoro, shortcuts, tongue-twister, useful-links (config/catalog) | V2 | A*,B2,B3,D |
| V3-B2 | implementeur | tests daily-anecdote, daily-quote, word-of-day, contact-code | V2 | … |
| V3-B3 | implementeur | tests storage, kpi, forum, mascot (logique extraite si besoin) | V2 | … |
| V3-D | implementeur | 9 data-testid + data-x/y/w/h (grid, tab-bar, edit-header, widget-panels, edit-cell, page) | V2 | A*,B* |
| V3-E | implementeur | boundsOf unique (layout-ops.core ↔ grid.tsx withBounds, resize clavier) | V2 | A*,B* |
| V3b-C | implementeur | migration dates ×14 → shared/lib/format/date (2 lots) | A*,B* | — |
| V3b-F | implementeur | 3 specs Playwright e2e/dashboard (S1 ajout, S2 déplacement clavier, S3 persistance) | D + stack humaine | — |
| vérifs | verificateur | 1 par lot | lot | entre eux |

## Vagues d'exécution
- **Vague 1** : T001, T002 — fait
- **Vague 2** : T003 … T009 (7 implémenteurs, fichiers disjoints)
- **Vague 2b** : 7 vérificateurs, puis commit par lot par le chef
- **Vague 2b** : fait — T012 OK, T013 DÉFAUTS→T019→T020, T014 OK, T016 DÉFAUTS→T021, T018 OK, T022 en cours
- **Vague 3** : A1, A2, B1, B2, B3, D, E (7 lots disjoints)
- **Vague 3b** : C (dates), F (e2e) — après A/B et confirmation stack

## Points de synchronisation
- Décision humaine : `cleanLayout([])` → `[today]` (onglet serveur vide reçoit une case) — garder ou corriger ?
- Décision humaine : stash@{0} résiduel dans ortho-front — à dropper
- Après 2b : commits locaux, relance des lots KO en tâches neuves
- Avant e2e : confirmer avec l'humain que la stack front+back+`ortho_test` est lançable

## Risques
| Risque | Signal précoce | Parade |
|---|---|---|
| node 22 par défaut dans le shell des agents | `ERR_UNKNOWN_FILE_EXTENSION` | PATH node 24 recopié dans chaque pack |
| layout-ops importe 43 .tsx → intestable | import échoue sous node:test | T005 extrait le module pur |
| 7 agents, même repo, même index git | commits croisés | agents ne committent pas |
| typecheck faux vert | sortie vide en 0,5 s | T003 DoD : erreur injectée détectée |
