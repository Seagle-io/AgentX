---
pack: T005
projet: dashboard-direct
role: implementeur
cree: 2026-10-06
---

# Pack T005 — Chrome de case, catalogue flottant, onglets en place

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Livrer les trois composants de la manipulation directe : `CellChrome` (croix/roue au survol, clavier), `CataloguePanel` (FlyingModal + items draggables HTML5), `DashboardTabBar` en place (onglets gérés sans mode édition, undo/redo, statut de sauvegarde) ; supprimer `edit-cell.tsx` et `edit-header.tsx` après en avoir repris le code utile.

## Definition of Done
- [ ] `components/cell-chrome.tsx` (default export) conforme au contrat ; `ToolButton` repris de `edit-cell.tsx:16-26` ; outils `dash-nodrag` ; testids `dash-cell-remove`, `dash-cell-settings`
- [ ] `components/edit/widget-panels.tsx` : `CataloguePanel` exporté conforme ; `Catalogue` racine `data-testid='dash-catalogue'`, items `dash-catalogue-item[data-widget]` draggables (`setData(DASH_WIDGET_MIME, w.id)`) ; `CellSettings` conservé
- [ ] `components/tab-bar.tsx` : `DashboardTabBar` conforme (rename inline, menu ⋯, couleur `ColorPicker`, DnD onglets mime `application/x-dash-tab`, undo/redo, `dash-save-status[data-status]`, « Ajouter un widget » `dash-add-widget` + `data-tour='dash-customize'`, ⋯ → `dash-reset`) ; `dash-edit` supprimé ; logique onglets reprise de `edit-header.tsx` (TabMenu, rename, palette)
- [ ] `edit-cell.tsx`, `edit-header.tsx` supprimés ; rg `EditCell|EditHeader` src → seulement `dashboard-page.tsx` (T004 s'en charge)
- [ ] kit UI `src/shared/ui` : Button, Icon, Input, ColorPicker, FlyingModal ; ∅ nouvelle dépendance
- [ ] `npx tsc -b` → 0 erreur **dans les fichiers E** (page/grid peuvent casser : signale) ; eslint fichiers E → 0 erreur ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/cell-chrome.tsx` | E | à créer |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | E | Catalogue :51-160, CellSettings :161 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | E | onglets lecture, :64 dash-edit |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | E | reprendre ToolButton :16-26 puis supprimer |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | E | reprendre TabMenu/rename/palette puis supprimer |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | DASH_WIDGET_MIME, écrit par T003 — s'il manque, importe-le quand même depuis ../grid.constants et signale |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | `TAB_NAME_MAX:51`, `widgetById:134`, types |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | `DashboardTab:25` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | `DashboardWidget:77` |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/flying-modal/flying-modal.tsx` | L | props :10-27 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/color-picker/color-picker.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | L | :1452-1535 (classes ; T003 les édite — n'écris pas, signale un besoin CSS dans Pour la suite) |

## Contrats
```ts
// grid.constants.ts (T003)
export const DASH_WIDGET_MIME = 'application/x-dash-widget'
// components/cell-chrome.tsx
export type CellChromeProps = {
  cell: LayoutCell; widget: DashboardWidget
  onSettings?: () => void                         // absent → ∅ roue
  onRemove: () => void
  onNudge?: (dx: number, dy: number) => void      // absent (pile) → flèches inertes
  onResizeBy?: (dw: number, dh: number) => void
  children: ReactNode
}
export default function CellChrome(p: CellChromeProps): JSX.Element
// root div.dash-cell-chrome group relative flex h-full min-h-0 flex-col, tabIndex=0, role='group', aria-label=widget.label
// contenu : div 'min-h-0 flex-1 overflow-auto' (widget VIVANT, pas d'overlay)
// outils : div 'absolute right-2 top-2 z-10 flex gap-1 dash-nodrag opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' ; roue (icon settings, dash-cell-settings) si onSettings ; croix (dash-cell-remove)
// onKeyDown si e.target===e.currentTarget : flèches→onNudge(±1,0 / 0,±1) · Maj+flèches→onResizeBy · Suppr|Backspace→onRemove · Entrée→onSettings · Échap→blur ; preventDefault quand traité
// components/edit/widget-panels.tsx
export type CataloguePanelProps = {
  open: boolean; onClose: () => void
  available: DashboardWidget[]; placed: { cell: LayoutCell; widget: DashboardWidget }[]
  onAdd: (widget: DashboardWidget) => void        // clic/Entrée → en bas
  onDragStart: (widget: DashboardWidget) => void; onDragEnd: () => void
  onSelectCell: (cellId: string) => void
  dragDisabled?: boolean
}
export const CataloguePanel: (p: CataloguePanelProps) => JSX.Element
// = <FlyingModal open onClose title='Ajouter un widget' selfScroll defaultPosition={{ x: window.innerWidth - 384, y: 120 }} className='w-[340px]'><Catalogue …/></FlyingModal>
// item : draggable={!dragDisabled} ; onDragStart : e.dataTransfer.setData(DASH_WIDGET_MIME, w.id) ; setData('text/plain', w.label) ; effectAllowed='copy' ; p.onDragStart(w) ; onDragEnd → p.onDragEnd() ; clic → onAdd(w)
// components/tab-bar.tsx (default)
export type DashboardTabBarProps = {
  tabs: DashboardTab[]; activeId: string; onSelect: (id: string) => void
  onAddTab: () => void
  onRenameTab: (id: string, name: string) => void           // trim, 1..TAB_NAME_MAX ; vide → annulé
  onRecolorTab: (id: string, color: DashboardTab['color']) => void
  onRemoveTab: (id: string) => void                         // masqué si tabs.length ≤ 1
  onMoveTab: (fromId: string, toId: string) => void         // DnD HTML5 mime 'application/x-dash-tab'
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void
  saveStatus: 'idle' | 'pending' | 'saving' | 'error'; onRetrySave: () => void
  catalogueOpen: boolean; onToggleCatalogue: () => void
  onReset: () => void                                       // confirmation côté page
  disabled?: boolean                                        // !layoutReady
}
// double-clic onglet actif → Input inline (Entrée/blur valide, Échap annule) `dash-tab-rename-input` ; ⋯ onglet actif `dash-tab-menu` → Renommer / Couleur (`dash-tab-color[data-color]`) / Supprimer (`dash-tab-remove`)
// ≥2 onglets → role=tablist, `dash-tab[data-tab-id]` ; 1 → seul « + Onglet » `dash-tab-add`
// droite : undo `dash-undo`, redo `dash-redo`, statut `dash-save-status[data-status]` (idle: ∅ texte · pending/saving: « Enregistrement… » · error: « Non enregistré » + bouton Réessayer→onRetrySave), « Ajouter un widget » `dash-add-widget` data-tour='dash-customize' (pressed = catalogueOpen), ⋯ `dash-more` → « Réinitialiser » `dash-reset`
```

## Décisions actées
- outils au survol et au focus, jamais une barre fixe ni une sélection — grille pleine largeur
- catalogue en `FlyingModal`, jamais `Dialog` — l'overlay bloque le dépôt
- glisser plein-carte côté grille : tout contrôle interactif du chrome porte `.dash-nodrag`
- retrait onglet sans confirmation — undo suffit (toast côté page)

## Hors périmètre
- `dashboard-page.tsx` (T004), `grid.tsx`/CSS (T003), e2e (T006). Si un besoin CSS apparaît : note-le dans Pour la suite.
- `use-edit-history.ts`, `edit-history.core.ts`, `layout-ops*.ts` : vivants, ne pas toucher.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git rm:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T005
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
