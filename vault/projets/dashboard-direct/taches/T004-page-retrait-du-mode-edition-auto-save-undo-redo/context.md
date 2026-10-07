---
pack: T004
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T004 — Page : retrait du mode édition, auto-save, undo/redo

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `dashboard-page.tsx`, supprimer le mode édition et câbler la manipulation directe : historique = état affiché, `commit` → auto-save débouncé (`use-layout-autosave.ts` + `autosave.core.ts` à créer), grille `interactive`, `CellChrome`, `CataloguePanel`, `DashboardTabBar` (composants livrés en parallèle par T003/T005 : importe selon les signatures ci-dessous, même si elles n'existent pas encore).

## Definition of Done
- [ ] `dashboard-page.tsx` : plus de `editing`, `draft`, `selectedId`, `dropping`, `HINTS`, `useBlocker`, `saveLayout`, `saveWhole`, `saveConfig`, `updateDashboardCellConfig`, `EditHeader`, `EditCell`, `Dialog` catalogue (rg → 0) ; reprise legacy :149-169 conservée
- [ ] `components/autosave.core.ts` : `sameTabs` pur, + `components/autosave.core.test.ts` (node:test, 4 cas : égal · id ≠ · layout ≠ · config ≠)
- [ ] `components/use-layout-autosave.ts` conforme au contrat (debounce, 1 PUT en vol, dirty, flush, beforeunload)
- [ ] page : `history`, `echo`, `autosave`, effet resync, `commit`, `undo`/`redo` exactement comme ci-dessous ; tous les gestes passent par `commit`
- [ ] clavier global : Ctrl/Cmd+Z undo · Ctrl/Cmd+Maj+Z | Y redo · Ctrl/Cmd+S flush ; skip si `isTyping` ou confirmation ouverte ; ∅ flèches globales (déplacées dans CellChrome)
- [ ] `WidgetContext.onCustomize` → `setCatalogueOpen(true)` ; EmptyState → action ouvre le catalogue
- [ ] `npx tsc -b` → 0 erreur **dans les fichiers E** (les composants T003/T005 peuvent manquer : signale, n'y touche pas) ; `npm run test:unit` (node 24) → autosave.core.test OK ; eslint fichiers E → 0 erreur ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | 627 l. : états :86-98, clavier :326-358, save :362-399, renderCell :408-428, grid :445-489, modales :568-621 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-layout-autosave.ts` | E | à créer |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/autosave.core.ts` | E | à créer, pur |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/autosave.core.test.ts` | E | à créer |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | `useEditHistory` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | `sameLayout`, `place`, `nudge`, `resize` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | `toServer:193 fromServer:190 addToLayout:195 newId:171 widgetById:134 availableWidgets:214` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | `DashboardTab:25` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | `saveDashboardLayout` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | `useToast().addToast` :20-27 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.test.ts` | L | modèle de test node:test |

## Contrats
```ts
// components/autosave.core.ts
export const sameTabs = (a: readonly DashboardTab[], b: readonly DashboardTab[]): boolean
// = longueurs ; ∀k id,name,color === ; sameLayout(a[k].layout, b[k].layout) ; config par i : JSON.stringify ===
// components/use-layout-autosave.ts
export const AUTOSAVE_DELAY_MS = 800
export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'error'
export type UseLayoutAutosaveOptions = {
  value: DashboardTab[]; enabled: boolean                    // enabled = layoutReady
  save: (tabs: DashboardTab[]) => Promise<DashboardLayout>
  onSaved: (next: DashboardLayout, sent: DashboardTab[]) => void
  onError: (error: Error) => void
  delay?: number
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
const commit = (u: (d: DashboardTab[]) => DashboardTab[], record: RecordOpt = true) => { history.set(u, record); if (record !== false) autosave.schedule() }
const undo = () => { history.undo(); autosave.schedule() }  // redo idem
// gestes → commit : grille (next, byUser) → record=byUser · drop → place(layout, id, at, newId) + focusCell · catalogue onAdd → addToLayout + focusCell, catalogue reste ouvert
// retirer case → toast « Widget retiré » action Annuler → undo · retirer onglet → idem, ∅ confirmation · nudge/resizeBy {coalesce:'nudge:'+id} · config {coalesce:'config:'+id} · rename {coalesce:'rename:'+id} · resetAll → Dialog dash-confirm puis record
// focusCell = scrollToCell + `[data-cell-id="ID"] .dash-cell-chrome`.focus()
// états restants : hideMoney, catalogueOpen, dragging: DropCandidate|null, settingsFor, confirmation · EmptyState si layout.length===0 && !dragging
// renderCell → <CellChrome cell widget onSettings? onRemove onNudge? onResizeBy?>{widget.render…}</CellChrome> ; pile (<STACK_BELOW) → onNudge/onResizeBy undefined, CataloguePanel dragDisabled
// ── livrés par T003 (components/grid.tsx, grid.constants.ts) ──
export type DropCandidate = { widget: string; w: number; h: number }
export type DropPlace = { x: number; y: number; w: number; h: number }
export type DashboardGridProps = { layout: LayoutCell[]; width: number; interactive: boolean; onLayoutChange: (layout: LayoutCell[], byUser: boolean) => void; renderCell: (cell: LayoutCell) => ReactNode; dragging?: DropCandidate | null; dragLabel?: string; onDropWidget?: (widget: string, at: DropPlace) => void; className?: string }
// ── livrés par T005 ──
// components/cell-chrome.tsx (default)
export type CellChromeProps = { cell: LayoutCell; widget: DashboardWidget; onSettings?: () => void; onRemove: () => void; onNudge?: (dx: number, dy: number) => void; onResizeBy?: (dw: number, dh: number) => void; children: ReactNode }
// components/edit/widget-panels.tsx
export type CataloguePanelProps = { open: boolean; onClose: () => void; available: DashboardWidget[]; placed: { cell: LayoutCell; widget: DashboardWidget }[]; onAdd: (widget: DashboardWidget) => void; onDragStart: (widget: DashboardWidget) => void; onDragEnd: () => void; onSelectCell: (cellId: string) => void; dragDisabled?: boolean }
export const CataloguePanel: (p: CataloguePanelProps) => JSX.Element     // CellSettings({children}) conservé
// components/tab-bar.tsx (default DashboardTabBar)
export type DashboardTabBarProps = { tabs: DashboardTab[]; activeId: string; onSelect: (id: string) => void; onAddTab: () => void; onRenameTab: (id: string, name: string) => void; onRecolorTab: (id: string, color: DashboardTab['color']) => void; onRemoveTab: (id: string) => void; onMoveTab: (fromId: string, toId: string) => void; canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; saveStatus: AutosaveStatus; onRetrySave: () => void; catalogueOpen: boolean; onToggleCatalogue: () => void; onReset: () => void; disabled?: boolean }
// réglages : settingsFor → <FlyingModal open onClose title={widget.label}><CellSettings>{widget.settings(context, instance)}</CellSettings></FlyingModal> (:568-595 modèle), setCellConfig → commit({coalesce:'config:'+id})
```

## Décisions actées
- historique = état affiché toute la session ; `reset` seulement sur données serveur étrangères ET `idle` — undo jamais perdu par un écho
- 1 seul canal d'écriture : `commit` → `useLayoutAutosave` (PUT entier) ; ∅ PATCH, ∅ `setQueryData` hors `onSaved` — courses PUT/PATCH
- retrait case/onglet = toast Annuler, ∅ confirmation ; reset = confirmation `dash-confirm`
- catalogue en `FlyingModal` (T005), jamais `Dialog` — l'overlay bloque le dépôt

## Hors périmètre
- `grid.tsx`, `index.css` (T003) ; `cell-chrome.tsx`, `widget-panels.tsx`, `tab-bar.tsx`, suppression `edit-cell/edit-header` (T005) ; e2e (T006).
- Widgets, back, onboarding (seul `onCustomize` change de cible, dans la page).

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npm run test:unit:*)`, `Bash(rg:*)`, `Bash(git diff:*)` — `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH` pour test:unit
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T004
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
