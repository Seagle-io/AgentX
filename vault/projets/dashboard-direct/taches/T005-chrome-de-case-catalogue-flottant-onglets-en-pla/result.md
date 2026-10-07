---
tache: T005
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/cell-chrome.tsx:1-64` — créé ; CellChrome default, ToolButton repris, clavier, testids
- `ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx:51-69` — CatalogueProps : onAdd/onDragStart/onDragEnd/dragDisabled (onPick supprimé)
- `…/edit/widget-panels.tsx:86,113-128` — racine `dash-catalogue`, items draggables (DASH_WIDGET_MIME + text/plain, copy)
- `…/edit/widget-panels.tsx:170-177` — `CataloguePanel` = FlyingModal 340px + Catalogue ; CellSettings :183 conservé
- `ortho-front/src/modules/dashboard/components/tab-bar.tsx:1-243` — réécrit : DashboardTabBarProps verbatim, RenameInput, TabMenu (⋯, ColorPicker, remove), DnD mime `application/x-dash-tab`, undo/redo, SaveStatus, dash-add-widget (aria-pressed, data-tour), dash-more→dash-reset ; `dash-edit` ∅
- `…/components/edit/edit-cell.tsx` — supprimé
- `…/components/edit/edit-header.tsx` — supprimé
## Vérifié comment
- `rg -n "EditCell|EditHeader|edit-cell|edit-header" src` → 5 occurrences, toutes `dashboard-page.tsx:21,22,418,429,496` (T004)
- `npx eslint cell-chrome.tsx tab-bar.tsx edit/widget-panels.tsx` → `eslint exit 0`
- `npx tsc -b 2>&1 | rg "error TS" | rg -v dashboard-page | wc -l` → `0`
- `npx tsc -b` → 14 erreurs, toutes `dashboard-page.tsx` (:21,22 imports supprimés · :425,455,472,475,501,502,524,579 props obsolètes EditCell/EditHeader/Catalogue onPick/onEdit) — attendu, T004
- `rg DASH_WIDGET_MIME grid.constants.ts` → `:10 export const DASH_WIDGET_MIME = 'application/x-dash-widget'` (T003 livré, import OK)
- tests unitaires/e2e : NV — hors outils autorisés
## Écarts
- lecture hors WL (grep seul, 0 Read) : `shared/ui/icon/icons/index.ts` — noms d'icônes (`more`, `arrow-back`) · `shared/ui/popover/popover.tsx` — `open/onOpenChange/align` · `shared/ui/button/bouton.tsx`, `input/input.tsx` — passage des props HTML
- `dash-tab-color[data-color]` : porté par le conteneur du ColorPicker (data-color = couleur courante ou ''), ∅ palette de pastilles — contrat ne définissait pas la liste de couleurs
- Catalogue vue « Sur la page » : `onSelectCell` conservé (clic → focus/scroll côté page)
- `cell` prop de CellChrome accepté mais non lu (contrat l'impose ; aucun usage interne)
## Pour la suite
- T004 : `Catalogue` → `CataloguePanel {open,onClose,available,placed,onAdd,onDragStart,onDragEnd,onSelectCell,dragDisabled}` ; `DashboardTabBar` nouvelle props (plus `onEdit`) ; `CellChrome` default `../components/cell-chrome`
- CSS (T003) : `.dash-cell-chrome:focus-visible` ring accent souhaité ; `.dash-nodrag` à exclure du draggableCancel de la grille
- Input `ref` passé en prop (React 19, Input sans forwardRef) : OK en tsc, à confirmer au runtime (focus+select au rename)
- e2e T006 : `dash-tab-color` est un conteneur, pas une palette ; cibler le ColorPicker dedans
## Retour sur le pack
- Manquait: noms d'icônes dispo (`more`, `arrow-back`) · API Popover (`open/onOpenChange`) · palette de couleurs onglet (contrat `data-color` sans liste)
- Inutile: `index.css:1452-1535` (lu, aucune classe exploitée)
