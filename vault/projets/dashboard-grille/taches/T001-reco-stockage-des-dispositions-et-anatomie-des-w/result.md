---
tache: T001
statut: bloque
---
## Livré
Racine front = ortho-front/src ; branche `master` OK. D = modules/dashboard.
### Usages unités (rg src)
- D/grid.constants.ts:6-8 — GRID_COLS=12, ROW_HEIGHT=24, GRID_GAP=16 (0 dépendance)
- D/dashboard-widgets.tsx:67 — STACK_BELOW=640 (px, grille <640 → pile)
- D/dashboard-widgets.tsx:70 — rowsToPx(h)=h*ROW_HEIGHT+(h-1)*GRID_GAP
- D/dashboard-widgets.tsx:74 — gridLabel : "w colonnes sur 12 · h rangées"
- D/components/grid.tsx:73 — colWidth=(width-(COLS-1)*GAP)/COLS (overlay pose)
- D/components/grid.tsx:83-85 — snap curseur→case ; clamp x ≤ COLS-w
- D/components/grid.tsx:91 — overlay bottom = h*(ROW+GAP)+GAP
- D/components/grid.tsx:111-114 — aperçu pose : left/top/width/height px
- D/components/grid.tsx:204-208 — pile <STACK_BELOW, minHeight=rowsToPx(h)
- D/components/grid.tsx:221 — gridConfig react-grid-layout
- D/dashboard-page.tsx:179 — stacked = width<STACK_BELOW (pas de glisser)
- D/dashboard-layout.util.ts:61 — fitCell : x ≤ GRID_COLS-w
- D/dashboard-layout.util.ts:81 — pack() ancien format : retour ligne à COLS
- D/components/edit/layout-ops.core.ts:20,37,51,53,66,68,76 — bornes/compaction/nudge/place, GRID_COLS
- D/components/edit/layout-ops.core.ts:14 — MAX_H_DEFAULT=60 (maxH par défaut)
- D/components/edit/edit-cell.tsx:91 — barre outils gauche/droite si x+w > COLS/2
- D/components/edit/widget-panels.tsx:122 — libellé "Pleine largeur" si w===COLS
- modules/showCase/components/DashboardWidgetsSection.tsx:13-14,24,58,62,128 — colsToPx, rowsToPx, aperçus (grille 1600)
- src/index.css:5 — `@custom-variant dash-low (@container card (max-height: 304px))` ← seuil en px, 304 = 12 rangées×… NV lien
- src/index.css:1439-1477 — .dash-forum-* @container min/max-height px (151,102,74,92,130)
- Hors dashboard (homonymes, ≠ grille) : gantt.tsx ROW_HEIGHT=40 ; ROW_GRID_COLS invoice/exercise
### Contrats (verbatim)
```ts
// D/grid.constants.ts
export const GRID_COLS = 12
export const ROW_HEIGHT = 24
export const GRID_GAP = 16
// D/components/widget/types.ts:22
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
// D/dashboard-layout.util.ts:18,25
export type LayoutCell = { i: string; widget: string; x: number; y: number; w: number; h: number; config?: WidgetConfig }
export type DashboardTab = { id: string; name: string; color?: string | null; layout: LayoutCell[] }
// src/api/dashboard-layout.ts:11-28
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }
export type DashboardTabData = { id: string; name: string; color: string | null; cells: DashboardCellData[] }
export type DashboardLayout = { saved: boolean; tabs: DashboardTabData[] }
// endpoints : GET /dashboard/layout · PUT /dashboard/layout {tabs} (tout-ou-rien) · PATCH /dashboard/cells/:id/config
// D/dashboard-layout.util.ts
const fitCell = (cell: LayoutCell, grid: WidgetGrid): LayoutCell   // :52
export const clamp = (value: number, min: number, max: number): number   // :46
export const cleanLayout = (items: unknown[], hasModule, catalog: LayoutCatalog): LayoutCell[]   // :115
export const readTabs = (raw: string | undefined, hasModule, catalog): DashboardTab[]   // :143
export const fromServer = (layout: DashboardLayout, hasModule, catalog): DashboardTab[]   // :162
export const toServer = (tabs: DashboardTab[], { newId }): DashboardTabData[]   // :176
export const addToLayout = (layout, widgetId, { gridOf, newId }): LayoutCell[]   // :93
// D/dashboard-widgets.tsx:176
export const defaultTabs = (hasModule): DashboardTab[] => [{ id: 'main', name: 'Accueil', layout: defaultLayout(hasModule) }]
```
- fitCell:52-63 — w=clamp(round(w),minW,maxW∧12) ; h=clamp(round(h),minH,maxH) ; x≤12-w ; y≥0
- fromServer:162-170 — cells→cleanLayout→fitCell ; ∅ conversion d'unité
- toServer:176-183 — x,y,w,h écrits tels quels ; UUID régénéré si id non-UUID
- Version/unité : ∅ aucun champ (front : LayoutCell/DashboardTabData sans version/cols). Côté back NV (voir Écarts)
- Stockage : tables dashboard_tab, dashboard_cell (dashboard-widgets.tsx:162-168) ; ancienne clé pref `dashboardWidgets` JSON, lue 1× pour reprise puis vidée (LAYOUT_PREFERENCE)
- Migrations front existantes (cleanLayout:115-127, readTabs:143-159) : liste d'ids string → pack() + 'today' ; tableau seul → onglet main 'Accueil' ; cell sans `widget` → widget=i. ∅ migration d'unité/échelle. Tout est idempotent via fitCell (bornes recalées silencieusement)
### defaultTabs / DEFAULT_CELLS (D/dashboard-widgets.tsx:141-154) — widget x y w h
greeting 0 0 8 4 · today 8 0 4 20 · kpi-sessions 0 4 4 4 · kpi-billing 4 4 4 4 · kpi-patients 0 8 4 4 · kpi-noshows 4 8 4 4 · activity 0 12 8 8 · forecast 0 20 4 8 · bilans 4 20 4 8 · reprendre 8 20 4 8 · lapins 0 28 4 6 · forum 0 34 12 7
- filtre : !optional ∧ module requis présent (defaultLayout:156)
- PIÈGE : DEFAULT_CELLS ≠ défauts catalogue (kpi 4×4 vs grid 3×4 ; activity 8×8 vs 7×8 ; forecast 4×8 vs 5×8 ; greeting 8×4 vs 12×4 ; bilans/reprendre/lapins h 8,8,6 vs 6,6,6)
### Anatomie widget
- WidgetGrid : cf. contrat ; commentaire types.ts:17-21 dit "colonnes (sur 12)" → à mettre à jour
- widget-card.tsx:42-64 — <section h-full flex-col overflow-hidden rounded-card border bg-bg-panel [container:card/size]>
- widget-card.tsx:50 — en-tête shrink-0 px-4 py-3 border-b ; pastille icône size-7 ; titre text-sm
- widget-card.tsx:60 — corps min-h-0 flex-1 overflow-y-auto, padding p-4 (bodyClassName le remplace)
- widget-card.tsx:63 — pied optionnel shrink-0 border-t
- Hauteur : ∅ fixe, h-full de la case ; contenu défile si > case
- grid.tsx:208,s.~ — chaque case = `@container/dash flex min-w-0 flex-col` (≠ container nommé `card`, posé par WidgetCard)
- 46 dossiers widget/ (51 entrées ls)
### Requêtes de conteneur (widget/)
Largeur `/dash` (case) :
- @[12rem]=192px : pomodoro.tsx:103,109,110,112 · weather-widget.tsx:134
- @xs(320 si TW défaut) : today-widget.tsx:192 ; @max-xs : forum/dashboard-forum.tsx:259
- @sm : contact-code:47,51 · revenue:76 · forecast/previsionnel-card.tsx:63,64
- @md : tongue-twister:69,85 · kora-news:55 · forum-notifications:62,63 · daily-quote:48
- @lg : shortcuts.tsx:26 ; @2xl : tomorrow:84 · greeting:55 · free-slots:81
- @min-[300px] : kpi/dashboard-kpi.tsx:84,85
- clock : `@sm/clock` (conteneur propre) clock-widget.tsx:141,142
Hauteur (`@container(max/min-height:Npx)`, conteneur anonyme le plus proche) :
- max-height masquent : next-appointment 60/90 · revenue 70 · greeting 80 · kpi 90 · storage 95/130 · pomodoro 120 · week-grid 120 · weather 120/150 · licence 150 · forum 150 · previsionnel 264 (`card`)
- min-height line-clamp : daily-quote 98→272 (7 paliers) · daily-anecdote 147→274 (7+) · tongue-twister 127→264 (5) · word-of-day 106/170/234
- `dash-low:` (≤304px card) : today-widget.tsx:119-141 · previsionnel-card.tsx:49-77 · widget-card.tsx:47
- Seuils hauteur en px absolus calés sur ROW_HEIGHT=24/GAP=16 (ex. h=4 → 4*24+3*16=144px)
### Hors WidgetCard (shell copié)
- weather/weather-widget.tsx:94 · greeting/ · kpi/ · mascot/ · forum/ (rg -L WidgetCard → 5 dossiers)
- weather shell : p-4 gap-2 rounded-card border [container-type:size] (≠ [container:card/size])
### weather
- fichiers : weather/{index.tsx 9l, weather-widget.tsx 156l, weather.codes.ts 22l, weather.codes.test.ts 16l}
- index.tsx:6 — grid {w:3,h:6,minW:2,minH:4,maxW:6,maxH:8}, optional:true, category perso
- affiche : en-tête icône+"Météo"+lieu ; icône 48px + temp 32px + libellé ; max/min, pluie %, vent (≥12rem) ; 3-4 jours suivants grid-cols-3/4
- données : getDashboardWeather, queryKey dashboard-weather, stale 15 min (:88-92)
- largeur/hauteur fixées par : case seule (h-full) ; contenu masqué si corps <120px (détail jour) / <150px (jours suivants) ; pas de largeur propre
- contenu 4 jours en grid-cols-4 s'étire avec la largeur : cause "trop large"
### Tests figeant des tailles
- D/dashboard-layout.util.test.ts:8-10 (catalogue fictif today 4×20 min3×6 ; kpi 4×4 [2..6]; billing 8×4), :41-43,48,62-65,72,78-80 (x 11.4→6, w 9→6), :85-87, :93-96, :112-117 (w 40→6), :122,132-133,139-142 (today 4×20)
- D/components/edit/layout-ops.core.test.ts:8-9,20,63,75,84-92 (boundsOf maxW 30→12, GRID_COLS), :139
- e2e (hors src) : ortho-front/e2e/dashboard/{ajout-widget,persistance,deplacement}.spec.ts — lisent data-x/y/w/h (dash-cell) ; NV contenu
- weather.codes.test.ts : ∅ taille
- Presque tous les tests figent 12 via valeurs littérales (w:6 cap, x:6) ou import GRID_COLS
## Vérifié comment
rg -n 'GRID_COLS|ROW_HEIGHT|GRID_GAP|rowsToPx|STACK_BELOW' src → liste ci-dessus (40 lignes)
git -C ortho-front branch --show-current → master
rg -L WidgetCard widget/*/ → forum, greeting, kpi, mascot, weather
psql / ortho-back : NV — refusé par le classifieur (voir Écarts)
## Écarts
- DoD 3 non cochée — `grep ^DB_ ortho-back/.env` refusé (Credential Materialization) → pas de psql, count + exemple cells ∅
- DoD 2 partielle — entité/DTO back non lus : `rg -il dashboard ortho-back/src` refusé (PII Data Handling) → version/unité côté back NV
- lecture hors WL : ∅ (hors WL : showCase/DashboardWidgetsSection.tsx via rg uniquement)
- Non fait : `@xs/@sm/@md/@lg/@2xl` en px non vérifiés dans index.css (@theme --container-*) ; ceux listés = défauts Tailwind NV
- Grid defs de ~26 autres widgets (multi-lignes) non extraits ; seuls 20 + weather listés ci-dessous
- Tailles catalogue extraites (w,h,minW,minH,maxW,maxH) : bilans/reprendre/lapins 4,6,3,3 · clock 4,7,2,4,6,10 · greeting 12,4,6,3,-,6 · today 4,20,3,8,6 · activity 7,8,4,6 · onboarding 4,10,3,7,6 · licence 4,8,3,6,6 · kpi-* 3,4,2,3,6,6 · weather 3,6,2,4,6,8 · forum-notifications 4,8,3,5,8 · forecast 5,8,3,5,8 · feedback 4,7,3,6,6,9 · kora-news 4,8,3,5,8 · forum 12,7,3,4 · achievements 4,7,3,7,6,10 · mascot 2,5,2,3,4,8
## Pour la suite
- Unités : 3 constantes (grid.constants.ts) + STACK_BELOW=640 ; usages cartographiés ci-dessus ; calculs px dupliqués dans grid.tsx:73-114 (overlay) et showCase:13-14 → à factoriser en passant en 24 col/carré (rowHeight = colWidth DÉPEND de la largeur mesurée : ROW_HEIGHT n'est plus une constante, rowsToPx(h) et overlay demandent `width`).
- Stockage : cells {id,widget,x,y,w,h,config} par onglet, PUT tout-ou-rien ; AUCUN champ version/unité côté front → migration ×2 en x/w (12→24) doit être détectable (champ à ajouter côté back ou heuristique) ; fitCell recale en silence (w≤maxW∧12 → passer GRID_COLS=24 sans migration = cartes moitié moins larges).
- Pièges : DEFAULT_CELLS ≠ défauts catalogue ; ~25 seuils px hauteur `@container(max-height:Npx)` + `dash-low` 304px calés sur rangée 24+gap 16 ; 5 widgets hors WidgetCard (weather, greeting, kpi, mascot, forum) à reprendre à part ; tests figent 12 col (layout-util 8-142, layout-ops 8-139) + e2e data-w.
- Manque pour décider : entité/DTO back + count dispositions en base (bloqué : accès .env et ortho-back refusés) → à fournir par l'humain ou autoriser.
## Retour sur le pack
- Manquait: autorisation explicite lecture .env/psql et ortho-back (classifieur a refusé) ; liste des 46 grid défauts ; seuils Tailwind --container-*
- Inutile: ∅
