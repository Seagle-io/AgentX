---
tache: T001
statut: fait
---
## Livré
Racine R = ortho-front/src/modules/dashboard ; C = R/components ; E = C/edit

### dashboard-page.tsx (627 l.) — états/callbacks `editing`
- :86 editing ; :88-89 history=useEditHistory<DashboardTab[]>([]), draft=history.value
- :91 selectedId · :93 catalogueOpen · :94 dropping(DropCandidate) · :96 settingsFor · :98 confirmation
- :170 shownTabs = editing ? draft : tabs (double source layout)
- :190-200 startEditing(withTabs=tabs) — garde layoutReady, reset historique, setEditing(true)
- :201 stopEditing · :202-203 undo/redo (purgent selectedId/settingsFor)
- :204-205 effet ferme settings si case disparue
- :207-216 cancelEditing — confirmation si history.changes>0
- :218-226 dirty + useBlocker + beforeunload
- :229-235 effet: layoutError en édition → stopEditing + toast erreur
- :239-245 setLayout(update, record) / setTabs → history.set
- :247-261 addTab / addTabFromView (startEditing([...tabs,tab]))
- :262-276 removeTab (confirmation) · :277-284 moveTab · :285-294 resetAll (confirmation)
- :296-300 removeCell (+toast « Annuler » = history.undo)
- :303 focusCell · :309-323 pickWidget (ferme catalogue, setDropping ; pile → addToLayout direct)
- :326-358 effet clavier (sans deps) : Ctrl+Z/Maj+Z/Y/S, Échap, flèches nudge, Maj+flèches resize, Suppr
- :402-405 context.onCustomize = startEditing() (widget onboarding)
- :408-428 renderCell : !editing → div overflow-auto ; sinon <EditCell>
- :434 selectedCell, :436-437 onPage/placed (pour Catalogue)
- :445-450 grid div : `pt-14` si editing ; clic fond → setSelectedId(null)
- :455 skeleton DashboardGrid editing={false}
- :458-464 EmptyState : texte+bouton « Ajouter des widgets » (startEditing) selon editing
- :466-489 <DashboardGrid editing selectedId dropping onDrop(place+focusCell) onCancelPlacement onLayoutChange(setLayout)>
- :495-519 <EditHeader …> si editing ; :520-526 sinon <DashboardTabBar onEdit onAddTab=addTabFromView> (si !layoutError)
- :537 bloc stockage critique masqué si editing
- :568-595 editing: <Dialog catalogue><Catalogue/></Dialog> + <FlyingModal réglages><CellSettings/>
- :598-621 Dialog confirmation/blocker (data-testid='dash-confirm')
- :37-42 HINTS{idle,selected,dropping} ; :44-49 isTyping/inInteractive ; :56 scrollToCell (zoom: NV non lu)

### Persistance
- :121 saved = useQuery(['dashboard-layout'], getDashboardLayout) ; :123 setSaved = queryClient.setQueryData (≠ flag booléen)
- :137 layoutReady = saved!=null && !layoutError ; :142-145 tabs = layoutError?[] : saved.saved ? fromServer : readTabs(legacy)
- :362-373 saveLayout mutation → saveDashboardLayout(toServer(next)) ; onSuccess setSaved+stopEditing+toast « Tableau de bord enregistré »
- appelants saveLayout.mutate : :335 (Ctrl+S, si changes>0) ; :515 EditHeader onSave. ∅ auto-save, ∅ debounce
- :151-169 migration prefs legacy (LAYOUT_PREFERENCE) → saveDashboardLayout, une fois (hors édition)
- :387 saveWhole → saveDashboardLayout (réglage hors édition, tableau jamais enregistré `!saved.saved`)
- :388 saveConfig → updateDashboardCellConfig(cellId,patch) (PATCH)
- :389-399 setCellConfig : editing → history.set coalesce 'config:'+id ; sinon saveWhole | setSaved optimiste + saveConfig
- ⇒ 3 chemins d'écriture : PUT complet (saveLayout, saveWhole, migration), PATCH config

### C/grid.tsx (230 l.) — branches `editing`
- :20-22 prop editing:boolean (+selectedId,dropping,onDrop,onCancelPlacement) ; :146 signature
- :42-52 previewPlacement (place+pushed) ; :60-109 PlacementOverlay (data-testid='dash-placement', rootZoom :74-80)
- :153-157 preview memo (editing&&dropping&&aim)
- :163 handleLayoutChange : `if (!editing) return` ; garde cases manquantes :169-170 ; sameCells :177
- :183 pile (<STACK_BELOW=640) : gap-6 pt-3 si editing, sinon gap-4
- :201 dragConfig {enabled: editing, handle: '.dash-grip'} ; :202 resizeConfig {enabled: editing, handles nw ne sw se e s}
- :203-206 onDragStart/Stop, onResizeStart/Stop → gesture ref (byUser) + useEdgeScroll(gesturing)
- :210 className 'dash-grid' + editing&&'dash-grid-editing min-h-80'
- :214 cell className dash-selected (editing&&selected), dash-pushed (preview)
- :221-229 PlacementOverlay rendu si editing&&dropping&&onDrop
- survit hors édition : cellTestAttrs :74-77 (data-testid dash-cell, data-widget/-cell-id/-x/-y/-w/-h), withBounds :67, @container/dash, pile, ROW_HEIGHT/GRID_GAP

### E/ composants
- edit-cell.tsx:1-134 — habillage case : prise .dash-grip :88, roue/retirer, barre flottante Colonnes/Rangées (NumberInput), badge w×h ; pointerdown=onSelect. Meurt avec édition (testid dash-cell-remove)
- edit-header.tsx:1-164 — barre : onglets (rename/color/remove/move via TabMenu), hint, Ajouter widget (dash-add-widget :146), undo/redo, reset, Annuler (dash-cancel :157), Enregistrer (dash-save :158). Onglets d'édition meurent ; onglets lecture = C/tab-bar.tsx
- widget-panels.tsx:64 Catalogue(available,placed,onPick,onSelectCell) (testid dash-catalogue-item :112) ; :161 CellSettings({children}) — wrapper scroll. Catalogue = ajout ; CellSettings = réglages (widget.settings(context,instance))
- survit sans mode : widget.settings/setCellConfig (page:389, écriture immédiate hors édition) ; tab-bar.tsx:64 bouton dash-edit (hors WL, rg seul)

### Historique (E/use-edit-history.ts, E/edit-history.core.ts)
```ts
export const useEditHistory = <T>(initial: T) => {...} // retourne
{ value: T; set(update: T | ((current:T)=>T), record?: RecordOpt): void; reset(value:T): void; undo(): void; redo(): void; canUndo: boolean; canRedo: boolean; changes: number /* past.length */ }
export type History<T> = { past: T[]; present: T; future: T[]; last?: { key: string; at: number } }
export type RecordOpt = boolean | { coalesce: string }
export type HistoryAction<T> =
	| { type: 'set'; value: T; record: RecordOpt }
	| { type: 'reset'; value: T }
	| { type: 'undo' }
	| { type: 'redo' }
export const COALESCE_WINDOW_MS = 1000  // MAX_STEPS=100 (non exporté)
export const initialHistory = <T>(present: T): History<T>
export const historyReducer = <T>(h: History<T>, action: HistoryAction<T>, { now = Date.now }: { now?: () => number } = {}): History<T>
```
- tests unitaires : E/edit-history.core.test.ts (145 l.), E/layout-ops.core.test.ts (142 l.)

### layout-ops (E/layout-ops.core.ts, 77 l.)
```ts
export const MAX_H_DEFAULT = 60
export const boundsOf = (grid: WidgetGrid | undefined) => ({ minW, minH, maxW, maxH })  // défauts 1,1,GRID_COLS,60
export const sameLayout = (a: readonly LayoutCell[], b: readonly LayoutCell[]): boolean
export const nudge = (layout: LayoutCell[], id: string, dx: number, dy: number): LayoutCell[]
export const resize = (layout: LayoutCell[], id: string, w: number, h: number, gridOf: GridLookup): LayoutCell[]
export const place = (layout: LayoutCell[], widget: string, at: { x: number; y: number; w: number; h: number }, newId: () => string): { layout: LayoutCell[]; cellId: string }
```
- wrapper E/layout-ops.ts (9 l.) : nudge=core.nudge ; resize sans gridOf ; place sans newId (injecte widgetById/newId)
- grid.tsx importe boundsOf+place depuis .core ; edit-cell importe boundsOf ; page importe nudge/place/resize depuis wrapper

### Contrat API (src/api/dashboard-layout.ts)
```ts
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }
export type DashboardTabData = { id: string; name: string; color: string | null; cells: DashboardCellData[] }
export type DashboardLayout = { saved: boolean; tabs: DashboardTabData[] }
export async function getDashboardLayout(): Promise<DashboardLayout>            // GET /dashboard/layout
export async function saveDashboardLayout(tabs: DashboardTabData[]): Promise<DashboardLayout> // PUT /dashboard/layout {tabs}
export async function updateDashboardCellConfig(cellId: string, config: Record<string, unknown>) // PATCH /dashboard/cells/:id/config
```
- dashboard-widgets.tsx : STACK_BELOW:67 · toServer:193 · fromServer:190 · toCells:203 · patchCellConfig:207 · availableWidgets:214 · addToLayout:195 · readingOrder:199 · defaultTabs:176 · readTabs:187

### e2e (ortho-front/e2e/dashboard/, 3 specs, viewport 1440×900, seedDashboardLayout/getDashboardLayout via ../support/backend.js)
- ajout-widget.spec.ts:30-40 — dash-edit → dash-add-widget → dash-catalogue-item[data-widget=clock] → dash-placement click → dash-cell[data-widget=clock] → dash-save → texte « Tableau de bord enregistré »
- deplacement.spec.ts:28-38 — dash-edit → cell.click() (sélection) → 2×ArrowRight → data-x=2 → dash-save → toast
- persistance.spec.ts:28-45 — idem + page.reload() → data-x=2 ; API getDashboardLayout saved=true, x=2
- survit : dash-cell + data-* (grid.tsx cellTestAttrs) ; meurt : dash-edit, dash-add-widget, dash-catalogue-item, dash-placement, dash-save, clavier flèches
- ∅ autre spec e2e dashboard ; ∅ spec lecture seule ; ∅ test e2e dash-confirm/dash-cancel/dash-cell-remove (testids utilisés seulement en src)

### CSS (src/index.css seul fichier)
- :1452 .dash-grid .react-grid-item · :1463 .react-grid-placeholder
- :1455-1459 .dash-grid-editing .react-grid-item (+dragging/.resizing)
- :1469 .dash-grid-dropping …placeholder::after — classe jamais posée (grid.tsx ∅) = code mort
- :1481-1535 .dash-grid-editing … .react-resizable-handle (+::before/::after, -nw/ne/sw/se/e/s)
- :1486 .dash-selected ; :1503 .dash-pushed ; .dash-grip ∅ en CSS (seulement edit-cell.tsx:88 + grid.tsx:201)
- grid.tsx:3 importe 'react-grid-layout/css/styles.css'

## Vérifié comment
rg+Read des fichiers WL → coordonnées ci-dessus. Aucun test/tsc lancé : NV.
rg "dash-edit|dash-grid-dropping" src e2e → dash-edit : 3 specs + tab-bar.tsx:64 ; dash-grid-dropping : index.css:1469 seul.
rg "onCustomize" src → types.ts:43, onboarding-widget.tsx:26/66, onboarding/index.tsx:9.

## Écarts
- ∅ lecture hors WL (rg seul sur tab-bar.tsx/onboarding/types)
- rootZoom/scrollToCell page:56 non lus en détail (grid.tsx:74-80 seul lu)
- DoD « saved flag » : ∅ flag ; `saved` = donnée query, `saved.saved` = booléen serveur

## Pour la suite
- Supprimer édition = retirer dans dashboard-page.tsx : editing/draft/history/selectedId/dropping/settingsFor/catalogueOpen/confirmation, effet clavier :326-358, blocker :218-226, saveLayout, EditHeader/Dialog/FlyingModal (:495-519, :568-621). Garder setCellConfig hors édition (:389-399) : seul chemin réglage widget ; réglages widget ≠ plus accessibles (CellSettings/FlyingModal liés à la roue en édition) → décider où.
- grid.tsx : retirer PlacementOverlay/previewPlacement/dropping/aim/gesture/useEdgeScroll, dragConfig+resizeConfig enabled:false, handleLayoutChange `!editing` ; garder cellTestAttrs, withBounds→inutile, pile, @container/dash. Supprimer dossier E/ (+ tests core, layout-ops) ; Catalogue/CellSettings à réaffecter si ajout/réglage restent.
- Écriture directe (sans brouillon) : si on garde déplacement, saveDashboardLayout(toServer(...)) sans debounce existant (∅ auto-save aujourd'hui) ; contrat API inchangé.
- e2e : 3 specs dépendent toutes de dash-edit+dash-save+dash-cell(data-x) ; à réécrire ; testids vivants : dash-cell + data-* ; toast « Tableau de bord enregistré » = onSuccess saveLayout.
- Pièges : index.css:1452-1535 (classes edit + .dash-grid-dropping mort) ; onboarding `onCustomize` (types.ts:43) appelle startEditing ; tab-bar.tsx:64 bouton dash-edit + onAddTab=addTabFromView ; layout-ops wrapper≠core (signature resize/place différente) ; zoom : rootZoom seulement dans PlacementOverlay.

## Retour sur le pack
- Manquait: tab-bar.tsx (dash-edit, onEdit/onAddTab) et onboarding-widget (onCustomize) hors WL ; useEdgeScroll ; support/backend.js
- Inutile: ∅
