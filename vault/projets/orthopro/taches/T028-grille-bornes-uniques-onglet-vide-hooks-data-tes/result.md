---
tache: T028
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts:4,15-21,49` — `boundsOf(grid)` exporté, `resize` l'utilise
- `…/components/edit/layout-ops.core.test.ts:4,84-98` — +4 cas boundsOf (undefined, maxW>12, maxH absent, normales)
- `…/components/grid.tsx:8,84-90,62,116,157` — `withBounds` = `boundsOf` (maxH souris = clavier) ; `cellTestAttrs` ; `dash-placement`
- `…/dashboard-layout.util.ts:113-116` — `items.length === 0 → []` ; chemin ids non vide inchangé
- `…/dashboard-layout.util.test.ts:93-101` — cas `[]→[]` inversé + `['kpi']→[kpi,today]` + `fromServer cells:[] → layout:[]`
- `…/dashboard-page.tsx:355` — `data-testid='dash-grid'`
- `…/components/tab-bar.tsx:64` — `dash-edit`
- `…/components/edit/edit-header.tsx:146,157,158` — `dash-add-widget` `dash-cancel` `dash-save`
- `…/components/edit/widget-panels.tsx:110-111` — `dash-catalogue-item` + `data-widget={w.id}`
- `…/components/edit/edit-cell.tsx:16-17,75,112` — prop `testid?` ToolButton ; `dash-cell-remove` ×2
## Vérifié comment
- `rg -c "data-testid" <6 fichiers>` → grid.tsx:2 tab-bar.tsx:1 dashboard-page.tsx:1 edit-header.tsx:3 widget-panels.tsx:1 edit-cell.tsx:1 (+ grille/pile via `{...cellTestAttrs(cell)}` : `dash-cell` compte 1 dans la const)
- `rg -n "from '.*\.tsx'|dashboard-widgets" layout-ops.core.ts dashboard-layout.util.ts` → ∅
- `npm run test:unit` → `pass 353 · fail 1` — fail = `widget/pomodoro/pomodoro.util.test.ts` `ERR_MODULE_NOT_FOUND pomodoro.config` (hors WL, chantier parallèle)
- `node --test layout-ops.core.test.ts dashboard-layout.util.test.ts` → `pass 29 · fail 0`
- `npm run typecheck` → 3 tsc, 0 erreur
- `npx eslint <10 fichiers WL>` → exit 0, 0 sortie
## Écarts
- lecture hors WL : ∅
- DoD « test:unit fail 0 » KO : 1 fail hors WL (pomodoro.config manquant, fichiers `widget/*` modifiés par un autre agent) — non corrigé
- `boundsOf` typé par inférence (retour `{minW,minH,maxW,maxH}` number) ≠ annotation explicite du contrat — même forme
## Pour la suite
- `pomodoro.util.ts` importe `./pomodoro.config` absent → test:unit rouge tant que le lot widgets n'a pas livré
- `edit-cell.tsx:93,102` : `NumberInput max=` recalcule les bornes à la main → candidat `boundsOf(widget.grid)` (hors DoD, non touché)
- `grid.tsx:84` `widgetById` importe `dashboard-widgets` (déjà le cas) — OK pour un .tsx
## Retour sur le pack
- Manquait: avertir que `test:unit` serait rouge hors WL pendant la vague (pomodoro) ; indentation réelle de `grid.tsx:61` (2 tabs) pour viser au sed
- Inutile: ∅
