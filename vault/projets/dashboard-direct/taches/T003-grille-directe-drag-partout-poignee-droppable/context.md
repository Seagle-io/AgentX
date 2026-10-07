---
pack: T003
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T003 — Grille directe : drag partout, poignée, droppable

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réécrire `components/grid.tsx` (+ `grid.constants.ts`, CSS `.dash-grid*`) en manipulation directe RGL v2 : glisser plein-carte, poignées e/s/se, dépôt HTML5 depuis le catalogue ; `editing` → `interactive` ; PlacementOverlay supprimé.

## Definition of Done
- [ ] `grid.tsx` exporte exactement `DashboardGridProps`, `DropCandidate`, `DropPlace` ci-dessous ; `PlacementOverlay`, `previewPlacement`, `PREVIEW_ID`, `useEdgeScroll`, `rootZoom`, `selectedId`, `dropping`, `onDrop`, `onCancelPlacement` : supprimés (rg → 0 dans grid.tsx)
- [ ] `grid.constants.ts` exporte `DASH_WIDGET_MIME = 'application/x-dash-widget'`
- [ ] RGL : `dragConfig`, `resizeConfig`, `dropConfig`, `droppingItem`, `onDrop`, `handleLayoutChange` conformes au contrat (1re ligne : ignorer `DROPPING_ID`)
- [ ] pile `< STACK_BELOW` (:179-189) inchangée ; `cellTestAttrs` inchangé ; `@container/dash` conservé
- [ ] CSS `src/index.css` : `.dash-grid-editing` → `.dash-grid-interactive` ; poignées visibles sur `.react-grid-item:hover` et `:focus-within` (∅ `.dash-selected`) ; `.dash-pushed`, règles nw/ne/sw supprimées ; `.dash-grid-dropping .react-grid-placeholder::after { content: var(--drop-label) }` vivant
- [ ] `npx tsc -b` → 0 erreur **dans grid.tsx/grid.constants.ts** (les autres fichiers de la vague peuvent encore casser : signale, n'y touche pas) ; `npx eslint src/modules/dashboard/components/grid.tsx src/modules/dashboard/grid.constants.ts` → 0 erreur ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | E | le livrable |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | E | + `DASH_WIDGET_MIME` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | E | :1452-1535 seulement |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | `LayoutCell`, `STACK_BELOW`, `readingOrder`, `rowsToPx`, `toCells` |
| `~/Documents/Workspace/OrthoPro/ortho-front/node_modules/react-grid-layout/dist/types-jd8MiKM1.d.ts` | L | :357-372 DragConfig, :379-389 ResizeConfig, :396-415 DropConfig |
| `~/Documents/Workspace/OrthoPro/ortho-front/node_modules/react-grid-layout/dist/ResponsiveGridLayout-BrhkSyZk.d.ts` | L | :24-83 props GridLayout (dropConfig :34, droppingItem :57, onDrop :81) |

## Contrats
```ts
// grid.constants.ts — ajouter
export const DASH_WIDGET_MIME = 'application/x-dash-widget'
// grid.tsx — exports
export type DropCandidate = { widget: string; w: number; h: number }
export type DropPlace = { x: number; y: number; w: number; h: number }
export type DashboardGridProps = {
  layout: LayoutCell[]
  width: number
  interactive: boolean               // false → ∅ drag/resize/drop (squelette)
  onLayoutChange: (layout: LayoutCell[], byUser: boolean) => void   // sémantique actuelle :20-25
  renderCell: (cell: LayoutCell) => ReactNode
  dragging?: DropCandidate | null    // widget tenu depuis le catalogue (HTML5 DnD)
  dragLabel?: string                 // texte du placeholder (--drop-label)
  onDropWidget?: (widget: string, at: DropPlace) => void
  className?: string
}
const DROPPING_ID = '__dash-drop'
const DRAG_CANCEL = 'button, a, input, textarea, select, label, [role=slider], [role=switch], [role=tab], [contenteditable], .dash-nodrag'
// live = interactive ; pile < STACK_BELOW inchangée (∅ RGL)
gridConfig   = inchangé (:196) — { cols: GRID_COLS, rowHeight: ROW_HEIGHT, margin: [GRID_GAP, GRID_GAP], containerPadding: [0, 0] }
dragConfig   = { enabled: live, cancel: DRAG_CANCEL, threshold: 6 }        // ∅ handle
resizeConfig = { enabled: live, handles: ['e', 's', 'se'] }
dropConfig   = { enabled: live && !!onDropWidget, defaultItem: { w: dragging?.w ?? 4, h: dragging?.h ?? 4 },
                 onDragOver: e => dragging && e.dataTransfer?.types.includes(DASH_WIDGET_MIME) ? { w: dragging.w, h: dragging.h } : false }
droppingItem = { i: DROPPING_ID, x: 0, y: 0, w: dragging?.w ?? 4, h: dragging?.h ?? 4 }
onDrop       = (_l, item, e) => { const id = (e as DragEvent).dataTransfer?.getData(DASH_WIDGET_MIME) || dragging?.widget
                 if (item && id) onDropWidget?.(id, { x: item.x, y: item.y, w: item.w, h: item.h }) }
handleLayoutChange : 1re ligne `if (next.some(it => it.i === DROPPING_ID)) return` ; puis :161-176 tel quel, sans `if (!editing)`
onDragStart/onDragStop/onResizeStart/onResizeStop → gesture ref (byUser) conservé ; useEdgeScroll supprimé
className    = cn('dash-grid', live && 'dash-grid-interactive', dragging && 'dash-grid-dropping min-h-80', className)
style        = dragging && dragLabel ? ({ '--drop-label': JSON.stringify(dragLabel) } as CSSProperties) : undefined
item         = <div key={cell.i} {...cellTestAttrs(cell)} className='@container/dash flex min-w-0 flex-col'>{renderCell(cell)}</div>
```
Si une prop RGL du contrat n'existe pas dans le `.d.ts` → `bloque` avec la ligne du `.d.ts`, ne contourne pas.

## Décisions actées
- glisser plein-carte, `cancel` sur contrôles natifs + `.dash-nodrag` — ∅ mode déguisé
- poignées e/s/se — nw/ne heurtent croix/roue
- dépôt = HTML5 DnD + RGL `dropConfig` — l'overlay de pose disparaît
- `interactive` = `layoutReady` côté page ; squelette → false

## Hors périmètre
- `dashboard-page.tsx` (T004), chrome/catalogue/onglets (T005), e2e (T006) : n'y touche pas même si tsc casse.
- Widgets, `.dash-cell-chrome` CSS (T005 si besoin), nouvelles dépendances.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
