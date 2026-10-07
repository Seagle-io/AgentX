---
titre: react-grid-layout v2 — API réelle (drag/resize/drop)
resume: RGL ^2.2.4 = props groupées dragConfig/resizeConfig/dropConfig/droppingItem ; isDroppable = legacy
source: dashboard-direct T002 T003
cree: 2026-10-06
tags: [note, rgl, front]
---

# react-grid-layout v2 — API réelle

## Fait
- v2 : `dragConfig {enabled,bounded,handle,cancel,threshold}` · `resizeConfig {enabled,handles}` · `dropConfig {enabled,defaultItem,onDragOver}` · `droppingItem` · `onDrop(layout,item,e)` · `onDropDragOver`
- `isDroppable` = API legacy (legacy.d.ts:32) ; v2 → `dropConfig.enabled`
- `index.d.ts` = 5 lignes de ré-exports ; lire les 2 .d.ts ci-dessous
- `onDrop` : `layout` contient l'item fantôme ; utiliser `item` (x,y,w,h)
- `onLayoutChange` émet aussi l'item `droppingItem.i` → filtrer son id
- drag plein-carte : `cancel` = sélecteur CSS des zones interactives, ∅ `handle`
- NV : RGL 2.2.4 appelle-t-il `onLayoutChange` pendant le glisser ? (impact auto-save > 800 ms)

## Pourquoi ça compte
- code RGL v1 (`isDraggable`, `draggableHandle`, `isDroppable`) ne compile pas / ne fait rien en v2
- `onDragOver` renvoyant `false` refuse le dépôt (filtrer par MIME)

## Où
- `node_modules/react-grid-layout/dist/ResponsiveGridLayout-BrhkSyZk.d.ts:24` — dragConfig
- `…/ResponsiveGridLayout-BrhkSyZk.d.ts:29,34,57,81,83` — resizeConfig, dropConfig, droppingItem, onDrop, onDropDragOver
- `…/dist/types-jd8MiKM1.d.ts:357-372` — DragConfig
- `…/dist/types-jd8MiKM1.d.ts:379-389,396-415` — ResizeConfig, DropConfig
- noms de fichiers hachés : NV après upgrade → `rg dragConfig node_modules/react-grid-layout/dist`

## Voir aussi
- [[ortho-front-dashboard-carte]]
- [[autosave-debounce-historique]]
