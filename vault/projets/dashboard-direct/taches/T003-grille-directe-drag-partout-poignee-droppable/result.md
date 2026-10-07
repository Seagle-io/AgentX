---
tache: T003
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/grid.tsx:1-139` — réécrit : drag plein-carte, poignées e/s/se, dropConfig HTML5
- `grid.tsx:9-34` — exports `DropCandidate`, `DropPlace`, `DashboardGridProps`
- `grid.tsx:36-39` — `DROPPING_ID`, `DRAG_CANCEL` verbatim contrat
- `grid.tsx:72-90` — `handleLayoutChange` : 1re ligne ignore `DROPPING_ID`, ∅ `if (!editing)`
- `grid.tsx:92-102` — pile `< STACK_BELOW` inchangée (`editing` → `live`)
- `grid.tsx:105-137` — RGL : gridConfig/dragConfig/resizeConfig/dropConfig/droppingItem/onDrop/style/className conformes
- `grid.tsx` — supprimés : PlacementOverlay, previewPlacement, PREVIEW_ID, useEdgeScroll, rootZoom, selectedId, dropping, onCancelPlacement, imports `place`, `Button`, `useState`
- `ortho-front/src/modules/dashboard/grid.constants.ts:9-10` — `DASH_WIDGET_MIME` ajouté
- `ortho-front/src/index.css:1452-1535` — `.dash-grid-editing` → `.dash-grid-interactive` ; poignées sur `:hover`/`:focus-within` ; `.dash-selected`, `.dash-pushed`, nw/ne/sw supprimés ; `.dash-grid-dropping … ::after { content: var(--drop-label) }` conservé
## Vérifié comment
- `npx tsc -b 2>&1 | grep -E "grid\.(tsx|constants)"` → ∅ (0 erreur dans les 2 fichiers)
- `npx tsc -b 2>&1 | grep "error TS"` → 5 erreurs, toutes hors WL :
  - `dashboard-page.tsx(455,50)` TS2322 props `editing` ≠ `DashboardGridProps`
  - `dashboard-page.tsx(472,6)` TS2322 props `editing/selectedId/dropping/onDrop/onCancelPlacement`
  - `dashboard-page.tsx(475,15)` `(475,26)` TS7006 `candidate`, `at` implicit any
  - `dashboard-page.tsx(579,9)` TS2322 `CatalogueProps` (`onSelectCell`) — préexistant T005
- `npx eslint src/modules/dashboard/components/grid.tsx src/modules/dashboard/grid.constants.ts` → ∅ sortie, exit 0
- `rg -n "PlacementOverlay|previewPlacement|PREVIEW_ID|useEdgeScroll|rootZoom|selectedId|dropping\b|onCancelPlacement|editing" grid.tsx` → 0 ligne (hors `onDrop=` prop RGL :119 et `dash-grid-dropping` :127, exigés par le contrat)
- `rg -n "dash-grid-editing|dash-selected|dash-pushed|handle-nw|handle-ne|handle-sw" src/index.css` → exit 1 (0 match)
- contrat RGL : `cancel`/`threshold` :364-372, `handles` :383, `dropConfig` :34, `droppingItem` :57, `onDrop` :81 du `.d.ts` — tous présents
## Écarts
- CSS : plage réelle éditée 1452-1539 (le bloc `handle-s` fermait :1539, pack disait 1535) ; rien d'autre touché
- `onDragStop`/`onResizeStop` supprimés : ne servaient qu'à `useEdgeScroll` (`setGesturing`) ; `gesture` ref posé par `onDragStart`/`onResizeStart` conservé
- lecture hors WL : ∅
## Pour la suite
- T004 `dashboard-page.tsx:455,472-475` : remplacer `editing`→`interactive`, `dropping`→`dragging`, `onDrop(candidate, at)`→`onDropWidget(widget: string, at: DropPlace)`, retirer `selectedId`/`onCancelPlacement`
- T005 catalogue : `draggable` + `e.dataTransfer.setData(DASH_WIDGET_MIME, widget.id)` (import `grid.constants`) ; `dashboard-page.tsx:579` `onSelectCell` ≠ `CatalogueProps`
- `components/use-edge-scroll.ts` : plus importé par grid.tsx → vérifier orphelin, supprimer si ∅ autre usage
- `index.css:1446-1449` (hors plage) : commentaire parle encore de « case sélectionnée », « quatre angles »
- e2e T006 : `data-testid='dash-placement'` n'existe plus ; `.dash-grip` plus requis pour glisser
## Retour sur le pack
- Manquait: ligne de fin exacte du bloc CSS (1539, pas 1535) ; sort de `onDragStop/onResizeStop` non dit
- Inutile: ∅
