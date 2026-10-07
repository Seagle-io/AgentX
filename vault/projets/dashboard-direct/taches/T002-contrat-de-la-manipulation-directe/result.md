---
tache: T002
statut: fait
---
## Livré
- contrainte qui décide : 1 vérité locale (historique) + 1 canal d'écriture (PUT débouncé) ; écho serveur n'écrase jamais un geste
- A historique local + PUT entier 800 ms — **retenu** · B bêtement PUT/geste, rendu = cache — écarté : réponses désordonnées rembobinent la grille · C cache react-query optimiste = état — écarté : refetch écrase geste en cours
- point de non-retour : PUT entier par geste ; suppression edit-header/edit-cell/PlacementOverlay ; convention `.dash-nodrag` dans les widgets
- tranchés : glisser plein-carte (≠ `.dash-grip` : mode déguisé) · poignées e/s/se (≠ 6 : nw/ne heurtent croix/roue) · catalogue `FlyingModal` (≠ `Dialog` : overlay bloque le dépôt) · config via PUT (≠ PATCH : courses PUT/PATCH) · retrait onglet = toast Annuler (≠ confirmation : undo suffit) · ∅ champs Colonnes/Rangées (≠ barre : sélection supprimée) · réglages = roue survol → `FlyingModal`+`CellSettings` (≠ panneau fixe : grille pleine largeur)
- historique : 1 session, init = `tabs` ; `reset` seulement sur données serveur étrangères (≠ écho) ET statut `idle` (≠ reset à chaque réception : undo perdu) ; coalesce existants conservés

### Partagé — T003 écrit `grid.constants.ts`, T005 importe
```ts
export const DASH_WIDGET_MIME = 'application/x-dash-widget'
```
### T003 grille — M `components/grid.tsx`, `grid.constants.ts`, `src/index.css` (.dash-grid*) · C ∅ · S `PlacementOverlay`, `previewPlacement`, `PREVIEW_ID`, `useMemo preview`
```ts
export type DropCandidate = { widget: string; w: number; h: number }          // inchangé
export type DropPlace = { x: number; y: number; w: number; h: number }
export type DashboardGridProps = {
  layout: LayoutCell[]
  width: number
  interactive: boolean               // = layoutReady ; false → ∅ drag/resize/drop (squelette)
  onLayoutChange: (layout: LayoutCell[], byUser: boolean) => void   // sémantique :20-25 inchangée
  renderCell: (cell: LayoutCell) => ReactNode
  dragging?: DropCandidate | null    // widget tenu depuis le catalogue (HTML5 DnD)
  dragLabel?: string                 // texte du placeholder (--drop-label)
  onDropWidget?: (widget: string, at: DropPlace) => void
  className?: string
}
const DROPPING_ID = '__dash-drop'
const DRAG_CANCEL = 'button, a, input, textarea, select, label, [role=slider], [role=switch], [role=tab], [contenteditable], .dash-nodrag'
// live = interactive (branche pile < STACK_BELOW :179-189 inchangée, ∅ RGL)
gridConfig   = inchangé :196
dragConfig   = { enabled: live, cancel: DRAG_CANCEL, threshold: 6 }        // ∅ handle
resizeConfig = { enabled: live, handles: ['e', 's', 'se'] }
dropConfig   = { enabled: live && !!onDropWidget, defaultItem: { w: dragging?.w ?? 4, h: dragging?.h ?? 4 },
                 onDragOver: e => dragging && e.dataTransfer?.types.includes(DASH_WIDGET_MIME) ? { w: dragging.w, h: dragging.h } : false }
droppingItem = { i: DROPPING_ID, x: 0, y: 0, w: dragging?.w ?? 4, h: dragging?.h ?? 4 }
onDrop       = (_l, item, e) => { const id = (e as DragEvent).dataTransfer?.getData(DASH_WIDGET_MIME) || dragging?.widget
                 if (item && id) onDropWidget?.(id, { x: item.x, y: item.y, w: item.w, h: item.h }) }   // _l ignoré
handleLayoutChange : 1re ligne `if (next.some(it => it.i === DROPPING_ID)) return` ; puis :161-176 tel quel, ∅ `if (!editing)`
className    = cn('dash-grid', live && 'dash-grid-interactive', dragging && 'dash-grid-dropping min-h-80', className)
style        = dragging && dragLabel ? ({ '--drop-label': JSON.stringify(dragLabel) } as CSSProperties) : undefined
item         = <div key {...cellTestAttrs(cell)} className='@container/dash flex min-w-0 flex-col'>   // ∅ dash-selected/dash-pushed
```
- CSS : `.dash-grid-editing` → `.dash-grid-interactive` (:1455-1535+) · `.dash-selected > .react-resizable-handle` → `.react-grid-item:focus-within > …` · S `.dash-pushed` :1502-1506 · S règles nw/ne/sw
### T004 page — M `dashboard-page.tsx` · C `components/use-layout-autosave.ts`, `components/autosave.core.ts` · S usages `EditHeader`, `EditCell`, `Dialog` catalogue, `useBlocker`, `HINTS`, `saveLayout`, `saveConfig`, `saveWhole`, import `updateDashboardCellConfig`, états `editing`/`selectedId`/`dropping`
```ts
// autosave.core.ts — pur
export const sameTabs = (a: readonly DashboardTab[], b: readonly DashboardTab[]): boolean
// = longueurs ; ∀k id,name,color === ; sameLayout(a[k].layout, b[k].layout) ; config par i : JSON.stringify ===
// use-layout-autosave.ts
export const AUTOSAVE_DELAY_MS = 800
export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'error'
export type UseLayoutAutosaveOptions = {
  value: DashboardTab[]; enabled: boolean                    // enabled = layoutReady
  save: (tabs: DashboardTab[]) => Promise<DashboardLayout>   // t => saveDashboardLayout(toServer(t))
  onSaved: (next: DashboardLayout, sent: DashboardTab[]) => void
  onError: (error: Error) => void
  delay?: number                                             // défaut AUTOSAVE_DELAY_MS
}
export type LayoutAutosave = { status: AutosaveStatus; error: Error | null; schedule(): void; flush(): void }
export function useLayoutAutosave(o: UseLayoutAutosaveOptions): LayoutAutosave
// value lu via ref AU TIR · schedule : !enabled → no-op ; timer relancé ; 'pending' (si 'saving' : dirty=true)
// tir : 1 PUT en vol max (sinon dirty=true) ; snapshot sameTabs lastSent → 'idle' sans PUT
// succès : lastSent=snapshot ; onSaved ; dirty ? tir immédiat : 'idle' (même tick que onSaved)
// échec : 'error', error=e, onError(e) ; ∅ retry auto ; schedule/flush suivant retente
// flush : timer annulé + tir immédiat · enabled→false : timer annulé, 'idle'
// démontage en 'pending' : tir fire-and-forget · beforeunload preventDefault tant que status ≠ 'idle'
// page
const history = useEditHistory<DashboardTab[]>(tabs)       // tabs = memo :142 inchangé ; shownTabs = history.value
const echo = useRef<DashboardTab[] | null>(null)
const autosave = useLayoutAutosave({ value: history.value, enabled: layoutReady,
  save: t => saveDashboardLayout(toServer(t)),
  onSaved: next => { echo.current = fromServer(next, hasModule); setSaved(next) },
  onError: e => addToast({ variant: 'error', title: 'Disposition non enregistrée', description: e.message,
    action: { label: 'Réessayer', onClick: () => autosave.flush() } }) })
useEffect(() => {
  if (echo.current && sameTabs(tabs, echo.current)) return   // notre écho
  if (autosave.status !== 'idle') return                     // geste local en attente gagne
  if (!sameTabs(tabs, history.value)) history.reset(tabs)
}, [tabs])
const commit = (u: (d: DashboardTab[]) => DashboardTab[], record: RecordOpt = true) => {
  history.set(u, record); if (record !== false) autosave.schedule() }
const undo = () => { history.undo(); autosave.schedule() }  // redo idem
```
- gestes → `commit` : grille `(next, byUser)` → record=byUser · drop → `place(layout,id,at)` + focusCell · catalogue onAdd → `addToLayout` + focusCell, catalogue reste ouvert · retirer case → toast `Widget retiré`/Annuler→undo · retirer onglet → idem, ∅ confirmation · nudge/resizeBy `{coalesce:'nudge:'+id}` · config `{coalesce:'config:'+id}` · rename `{coalesce:'rename:'+id}` · resetAll → `Dialog` dash-confirm puis record
- `WidgetContext.onCustomize` → `setCatalogueOpen(true)` · focusCell = scrollToCell + `.focus()` `[data-cell-id=ID] .dash-cell-chrome`
- états restants : hideMoney, catalogueOpen, dragging, settingsFor, confirmation · EmptyState si `layout.length===0 && !dragging`, action → catalogue
- renderCell → `<CellChrome>` ; pile → onNudge/onResizeBy undefined, CataloguePanel `dragDisabled`
### T005 chrome/catalogue/onglets — C `components/cell-chrome.tsx` · M `components/edit/widget-panels.tsx`, `components/tab-bar.tsx` · S `components/edit/edit-cell.tsx`, `components/edit/edit-header.tsx` (reprendre d'abord son code onglets)
```ts
export type CellChromeProps = {
  cell: LayoutCell; widget: DashboardWidget
  onSettings?: () => void                         // absent → ∅ roue
  onRemove: () => void
  onNudge?: (dx: number, dy: number) => void      // absent (pile) → flèches inertes
  onResizeBy?: (dw: number, dh: number) => void
  children: ReactNode
}
export default function CellChrome(p: CellChromeProps): JSX.Element
// root div.dash-cell-chrome tabIndex=0 role='group' aria-label=widget.label ; contenu 'min-h-0 flex-1 overflow-auto' VIVANT
// outils 'absolute right-2 top-2 z-10 dash-nodrag' opacity 0 → group-hover/focus-within ; ToolButton edit-cell.tsx:16-26 repris
// onKeyDown si e.target===currentTarget : flèches→onNudge · Maj+flèches→onResizeBy · Suppr|Backspace→onRemove · Entrée→onSettings · Échap→blur ; preventDefault
export type CataloguePanelProps = {
  open: boolean; onClose: () => void
  available: DashboardWidget[]; placed: { cell: LayoutCell; widget: DashboardWidget }[]
  onAdd: (widget: DashboardWidget) => void        // clic/Entrée → en bas
  onDragStart: (widget: DashboardWidget) => void; onDragEnd: () => void
  onSelectCell: (cellId: string) => void
  dragDisabled?: boolean
}
export const CataloguePanel: (p: CataloguePanelProps) => JSX.Element
// = FlyingModal(open,onClose,title='Ajouter un widget',selfScroll,defaultPosition {x: innerWidth-384, y:120},className 'w-[340px]') ⊃ Catalogue
// item draggable={!dragDisabled} ; dragstart : setData(DASH_WIDGET_MIME,w.id) ; setData('text/plain',w.label) ; effectAllowed='copy' ; p.onDragStart(w) ; dragend → p.onDragEnd()
export type DashboardTabBarProps = {
  tabs: DashboardTab[]; activeId: string; onSelect: (id: string) => void
  onAddTab: () => void
  onRenameTab: (id: string, name: string) => void           // trim, 1..TAB_NAME_MAX ; vide → annulé
  onRecolorTab: (id: string, color: DashboardTab['color']) => void
  onRemoveTab: (id: string) => void                         // masqué si tabs.length ≤ 1
  onMoveTab: (fromId: string, toId: string) => void         // DnD HTML5 mime 'application/x-dash-tab'
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void
  saveStatus: AutosaveStatus; onRetrySave: () => void
  catalogueOpen: boolean; onToggleCatalogue: () => void
  onReset: () => void                                       // confirmation côté page
  disabled?: boolean                                        // !layoutReady
}
// double-clic onglet actif → Input inline (Entrée/blur valide, Échap annule) ; ⋯ onglet actif → Renommer/Couleur/Supprimer
// ≥2 onglets → tablist ; 1 → seul « + Onglet » ; droite : undo, redo, statut, « Ajouter un widget » (data-tour='dash-customize'), ⋯ → reset
```
### T006 e2e — C/M spec Playwright dashboard (chemin NV) · ∅ écriture src
```ts
// survivants : dash-grid · dash-cell[data-widget|data-cell-id|data-x|data-y|data-w|data-h] · dash-cell-remove · dash-catalogue-item[data-widget] · dash-confirm · data-tour dash-grid, dash-customize
// supprimés  : dash-edit · dash-placement · .dash-grip · .dash-selected · .dash-pushed · .dash-grid-editing
// nouveaux   : dash-cell-settings · dash-catalogue (racine Catalogue) · dash-add-widget · dash-undo · dash-redo
//              dash-save-status[data-status=idle|pending|saving|error] · dash-tab[data-tab-id] · dash-tab-add · dash-tab-menu
//              dash-tab-rename-input · dash-tab-color[data-color] · dash-tab-remove · dash-more · dash-reset
// classes    : .dash-grid · .dash-grid-interactive · .dash-grid-dropping(--drop-label) · .dash-cell-chrome · .dash-nodrag
// clavier    : global (skip isTyping|confirmation) Ctrl/Cmd+Z undo · Ctrl/Cmd+Maj+Z|Y redo · Ctrl/Cmd+S flush
//              case focalisée : flèches déplacer · Maj+flèches redimensionner · Suppr/Backspace retirer · Entrée réglages · Échap blur
// attendre dash-save-status[data-status=idle] avant reload ; erreur : page.route PUT layout → 500 → data-status=error → Réessayer
```
- scénarios : déplacer→reload persiste · redimensionner se · dragTo catalogue→case à x,y · clic catalogue→en bas · retirer+Annuler · Ctrl+Z après move→reload revert · roue→réglage persiste · onglet ajouter/renommer/couleur/retirer+Annuler · reset+dash-confirm · <640 px : ∅ drag
## Vérifié comment
- Read grid.tsx:15-37 props · :196-206 RGL · :159-177 handleLayoutChange · :128-130 cellTestAttrs
- Read dashboard-page.tsx:86-98 états · :238-245 setLayout/coalesce · :328-360 clavier · :388-398 setCellConfig · :404 onCustomize · :570-582 catalogue en Dialog
- Read edit-cell.tsx:16-26 ToolButton · :77 dash-grip · :84,122 dash-cell-remove ; tab-bar.tsx:64 dash-edit + data-tour dash-customize
- Read widget-panels.tsx:51-57 CatalogueProps · :112 dash-catalogue-item · :161 CellSettings ; dashboard-widgets.tsx:193,195,207,214
- Read index.css:1455-1535 `.dash-grid-editing` · :1469 `--drop-label` · :1503 `.dash-pushed`
- grep index.d.ts → 5 lignes, ré-exports seuls (:1-5)
- RGL v2 : ResponsiveGridLayout-BrhkSyZk.d.ts:24 dragConfig · :29 resizeConfig · :34 dropConfig · :57 droppingItem · :81 onDrop(layout,item,e) · :83 onDropDragOver
- RGL v2 : types-jd8MiKM1.d.ts:357-372 DragConfig{enabled,bounded,handle,cancel,threshold} · :379-389 ResizeConfig · :396-415 DropConfig{enabled,defaultItem,onDragOver}
- `isDroppable` → legacy.d.ts:32 seul ; v2 = `dropConfig.enabled`
## Écarts
- lecture hors WL : grep `react-grid-layout/dist/*.d.ts` — index.d.ts ne fait que ré-exporter
- lecture hors WL : types-jd8MiKM1.d.ts:350-419 — DragConfig/DropConfig
- lecture hors WL : ResponsiveGridLayout-BrhkSyZk.d.ts:10-94 — GridLayoutProps
- DoD 4 : `isDroppable` absent RGL v2 → `dropConfig.enabled`
- NV : `sameLayout` compare config ? (sameTabs compare config lui-même) · FlyingModal accepte data-testid ? (testid sur racine Catalogue) · chemin spec e2e · palette couleurs onglet (edit-header.tsx non lu)
## Pour la suite
- choix : historique = état affiché ; `commit` → `autosave.schedule()` ; PUT entier débouncé 800 ms, 1 en vol
- interdit : tout `setQueryData`/PATCH écrivant la disposition hors `useLayoutAutosave` (sauf reprise legacy :149-169)
- interdit : `history.reset` hors effet resync (écho ≠, statut idle)
- interdit : réintroduire `editing`, `.dash-grip`, sélection, `Dialog` catalogue
- widget à zone interactive non native → `.dash-nodrag`, sinon le glisser vole le geste
## Retour sur le pack
- Manquait: WL types-jd8MiKM1.d.ts + ResponsiveGridLayout-BrhkSyZk.d.ts (index.d.ts = ré-exports) · edit-header.tsx (palette, rename) · chemin spec e2e · signature FlyingModal · « isDroppable » = API legacy
- Inutile: CLAUDE.md ortho-front (1 règle utile : kit shared/ui)
