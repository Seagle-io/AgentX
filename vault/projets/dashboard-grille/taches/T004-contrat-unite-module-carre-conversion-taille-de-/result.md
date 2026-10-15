---
tache: T004
statut: fait
---
## Livré
Contrainte qui décide : rangée = colonne ⇒ hauteur px ∝ largeur ; contenus en px fixes ⇒ taille de réf. = plus petit module non empilé (24 px, pas 40 = ancien pas de rangée) → h inchangé, aucune carte < contenu au-dessus.
Options : A réf. module 24 + pile < 944 (retenue) · B réf. 1280 + pile 640 (h ×0,74 arrondi, scroll 640–1280) · C bête = garder 12→24 sans réf. ni pile (cartes < contenu sous 944, ×1,6 au-dessus, aucun garde-fou). Détection : marqueur config (retenu) ≠ heuristique x+w≤12 (faux positif) ≠ préf. séparée (non atomique). → decisions.md#2026-10-08
```ts
// ── src/modules/dashboard/grid.constants.ts (remplace ; ROW_HEIGHT SUPPRIMÉ → tout import casse la compilation, voulu)
export const GRID_COLS = 24
export const GRID_GAP = 16                    // px, H et V
export const MODULE_MIN = 24                  // px ; = ancien ROW_HEIGHT ; taille de référence du catalogue
export const MODULE_MAX = 48                  // px
export const GRID_MIN_WIDTH = GRID_COLS * MODULE_MIN + (GRID_COLS - 1) * GRID_GAP   // 944
export const GRID_MAX_WIDTH = GRID_COLS * MODULE_MAX + (GRID_COLS - 1) * GRID_GAP   // 1520
export const STACK_BELOW = GRID_MIN_WIDTH     // 944 (était 640) ; dashboard-widgets.tsx le ré-exporte
export const LEGACY_COLS = 12
export const GRID_MARK_KEY = '_grid'
export const GRID_MARK = 24
export const gridWidthOf = (width: number): number => Math.min(width, GRID_MAX_WIDTH)
/** Côté du module carré, px non arrondi. width < 944 → MODULE_MIN (pile). */
export const moduleOf = (width: number): number =>
  Math.min(MODULE_MAX, Math.max(MODULE_MIN, (width - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS))
export const modulesToPx = (n: number, module: number): number => n * module + (n - 1) * GRID_GAP
export const pxToModules = (px: number, module: number): number => Math.ceil((px + GRID_GAP) / (module + GRID_GAP))

// ── dashboard-widgets.tsx
export { STACK_BELOW } from './grid.constants'
export const rowsToPx = (h: number, module: number = MODULE_MIN): number => modulesToPx(h, module) // pile : défaut = ancien px
export const gridLabel = ({ w, h }: WidgetGrid): string =>
  w === GRID_COLS ? `Pleine largeur · ${h} modules de haut` : `${w} × ${h} modules`
// DEFAULT_CELLS : voir tableau ci-dessous (verbatim)

// ── components/grid.tsx (RGL v2) — un seul `module` par rendu
const gridWidth = gridWidthOf(width); const module = moduleOf(width)
// wrapper : <div className='relative' style={{ maxWidth: GRID_MAX_WIDTH }}> (aligné à gauche, pas mx-auto)
<ReactGridLayout width={gridWidth}
  gridConfig={{ cols: GRID_COLS, rowHeight: module, margin: [GRID_GAP, GRID_GAP], containerPadding: [0, 0], maxRows: Infinity }} … />
// RGL : colWidth = (gridWidth − 23·16)/24 === module ⇒ carré (arrondi RGL ≤ 1 px)
// PlacementOverlay : prop `module: number` ; pitch = module + GRID_GAP sur x ET y ; aperçu = modulesToPx(w|h, module) ;
//   bottom = -(candidate.h * (module + GRID_GAP) + GRID_GAP) ; snap x ∈ [0, GRID_COLS − w]
// pile (width < STACK_BELOW) : minHeight = rowsToPx(cell.h) (module 24 ⇒ px identiques à l'ancien)

// ── dashboard-layout.util.ts — migration (pure, sans throw)
type Box = { x: number; y: number; w: number; h: number }
/** 12 col / rangée 24+16 → 24 col carrées à module 24 : x,w ×2 ; y,h identiques. NON idempotente : 1 fois, derrière isLegacyLayout. */
export const migrateLegacyCells = <C extends Box>(cells: readonly C[]): C[] =>
  cells.map(c => ({ ...c, x: 2 * Math.round(c.x), w: 2 * Math.round(c.w), y: Math.round(c.y), h: Math.round(c.h) }))
/** Ancien format ⇔ aucune case d'aucun onglet ne porte config._grid === 24. Layout vide ⇒ true (no-op). */
export const isLegacyLayout = (layout: DashboardLayout): boolean =>
  !layout.tabs.some(t => t.cells.some(c => c.config?.[GRID_MARK_KEY] === GRID_MARK))
/** Retire le marqueur : le widget ne le voit jamais. */
export const stripMark = (config: Record<string, unknown>): WidgetConfig
export const cleanLayout = (items: unknown[], hasModule, catalog: LayoutCatalog, opts?: { legacy?: boolean }): LayoutCell[]
//   legacy ⇒ migrateLegacyCells sur les cases objet AVANT fitCell ; liste de chaînes ⇒ pack() en unités neuves, jamais migrée
// fromServer : legacy = isLegacyLayout(layout) ; cells → { i:id, …, config: stripMark(config) } → cleanLayout(…, { legacy })
// readTabs (préf. `dashboardWidgets`) : toujours cleanLayout(…, { legacy: true })
// toServer : cells[].config = { ...(config ?? {}), [GRID_MARK_KEY]: GRID_MARK }
// api PATCH /dashboard/cells/:id/config : corps = { ...patch, [GRID_MARK_KEY]: GRID_MARK } (si le back remplace au lieu de fusionner)
// fitCell / pack / layout-ops : inchangés, lisent GRID_COLS (=24)

// Invariants
// I1 carte px = modulesToPx(w, m) × modulesToPx(h, m), m = moduleOf(width) ∈ [24, 48]
// I2 x + w ≤ 24 ; w ∈ [minW, maxW] ; h ∈ [minH, maxH] (fitCell, silencieux ; chevauchements → compaction verticale RGL)
// I3 toute écriture de config (PUT, PATCH) porte _grid: 24 ⇒ migration 1 seule fois par layout
// I4 modulesToPx(h, 24) === ancien rowsToPx(h) ⇒ seuils @container(max-height:Npx) et dash-low (304 = 8 modules) INCHANGÉS, en px
// I5 y jamais modifié par la migration ⇒ contrainte back y ≤ 500 tenue
// I6 x, w pairs après migration ⇒ rollback = x/2, w/2 tant que non édité
// Exemples
migrateLegacyCells([{ x: 8, y: 0, w: 4, h: 20 }])  // → [{ x: 16, y: 0, w: 8, h: 20 }]  today, fit inchangé
migrateLegacyCells([{ x: 0, y: 34, w: 12, h: 7 }]) // → [{ x: 0, y: 34, w: 24, h: 7 }]  forum
migrateLegacyCells([{ x: 9, y: 4, w: 3, h: 6 }])   // → [{ x: 18, y: 4, w: 6, h: 6 }]   weather, fit [5..7] ⇒ inchangé
// weather {x:6,w:6,h:8} → {x:12,w:12,h:8} → fitCell maxW 7 ⇒ w 7, x 12
// word-of-day {x:8,w:4,h:6} → {x:16,w:8} → fitCell minW 13 ⇒ w 13, x 11 (≤ 24−13) ⇒ compaction RGL pousse les voisins
// isLegacyLayout({ saved:true, tabs:[{…, cells:[{…, config:{ _grid: 24 }}]}] }) // → false : aucune migration
```
Tableau 47 widgets (modules ; px à module 24 = 40n−16). Règles : minW=⌈(Lmin+16)/40⌉ (160→5, 240→7, 320→9, 480→13) ; h=⌈(H+16)/40⌉, H = T003 @240 (w≤7) / @320 (w=9) / @480 (w≥13) ; état vide/erreur/NV ⇒ h = ancien h catalogue (pas 40 identique) ; minH=max(min(h,3),⌈h/2⌉) ; F (contenu fixe) : maxW=w+2, maxH=h+2 ; L (liste/graphe) : maxW=24, maxH=max(2h,8).
id | w h | minW minH | maxW maxH | base
---|---|---|---|---
achievements | 7 6 | 7 3 | 9 8 | F 240;195
activity | 9 7 | 9 4 | 24 14 | L 320;264@320
admin-time | 9 3 | 9 3 | 11 5 | F 320;87
age-calculator | 7 7 | 7 4 | 9 9 | F 240;258
bilans | 6 6 | 5 3 | 24 12 | L 160;vide→anc. h6
birthdays | 6 3 | 5 3 | 24 8 | L 160;102
calculator | 6 5 | 5 5 | 8 7 | F 160;178 ; minH=h (clavier indivisible)
clock | 6 4 | 5 3 | 8 6 | F 160;113
contact-code | 7 6 | 7 3 | 9 8 | F NV messagerie ; Lmin 240 famille ; anc. h6
daily-anecdote | 6 5 | 5 3 | 8 7 | F 160;182
daily-game | 9 3 | 9 3 | 11 5 | F 320;89
daily-quote | 6 4 | 5 3 | 8 6 | F 160;121
feedback | 9 6 | 9 3 | 11 8 | F 320;214
forecast | 9 8 | 5 4 | 24 16 | L 160 reflow 123→103 ⇒ w9 ; vide→anc. h8
forum | 24 7 | 13 4 | 24 14 | L 480 ; H NV→anc. h7
forum-notifications | 6 8 | 5 4 | 24 16 | L 160;vide→anc. h8
free-slots | 9 7 | 7 4 | 24 14 | L 240 reflow ⇒ w9 ; 242@320
greeting | 12 3 | 5 3 | 24 5 | bandeau 160;92 ; maxW 24 (anc. pleine largeur)
kora-news | 6 8 | 5 4 | 24 16 | L 160;vide→anc. h8
kpi-billing | 6 3 | 5 3 | 8 5 | F 160;84
kpi-noshows | 7 3 | 7 3 | 9 5 | F 240;84
kpi-patients | 6 3 | 5 3 | 8 5 | F 160;84
kpi-sessions | 6 3 | 5 3 | 8 5 | F 160;84
lapins | 6 6 | 5 3 | 24 12 | L 160;vide→anc. h6
licence | 7 6 | 7 3 | 9 8 | F >480 = `truncate max-w-24` voulu ⇒ Lmin 240 (T002 scroll-x @160 seul) ;197
mascot | 6 5 | 5 3 | 8 7 | F 160;146
month-calendar | 6 7 | 5 7 | 8 9 | F 160;232 ; minH=h (grille 7 col indivisible)
next-appointment | 6 3 | 5 3 | 8 5 | F 160;87
onboarding | 6 10 | 5 5 | 8 12 | F 160 ; erreur→anc. h10
patient-search | 6 5 | 5 3 | 8 7 | F 160;165
pomodoro | 6 5 | 5 3 | 8 7 | F 160;145
quick-reply | 9 12 | 7 6 | 24 24 | L NV messagerie ; anc. h12
recent-documents | 9 8 | 7 4 | 24 16 | L NV documents ; anc. h8
reprendre | 6 6 | 5 3 | 24 12 | L 160;vide→anc. h6
revenue | 9 6 | 7 3 | 24 12 | L NV facturation (graphe @sm) ; anc. h6
shortcuts | 7 5 | 7 3 | 9 7 | F 240;169
storage | 9 5 | 5 3 | 11 7 | F 160 reflow 280→183 ⇒ w9 ; 183@320
today | 8 16 | 8 8 | 24 32 | L rail = anc. 4/12×2 ; Lmin 480 T003 NV toléré (troncature noms) ; h aligné DEFAULT
tomorrow | 9 7 | 9 4 | 24 14 | L 320;247
tongue-twister | 6 4 | 5 3 | 8 6 | F 160;130
transmissions | 9 7 | 7 4 | 24 14 | L NV facturation ; anc. h7
unpaid-invoices | 9 8 | 7 4 | 24 16 | L NV facturation ; anc. h8
unread-messages | 9 7 | 7 4 | 24 14 | L NV messagerie ; anc. h7
useful-links | 9 11 | 9 6 | 24 22 | L 320;406
weather | 5 6 | 5 4 | 7 7 | F 160 ; w=minW (« trop large ») ; H données NV ≈212 (classes) → h6 ; minH 4 = 144 px ≥ 120 (extrêmes visibles) ; maxH 7
week-grid | 9 4 | 9 3 | 24 8 | L 320;128
word-of-day | 13 6 | 13 3 | 15 8 | F 480;209@480

DEFAULT_CELLS (i = widget ; x y w h) — 24×31, 0 trou, rangées alignées y=0/3/6/9/16/24/31, chaque case dans ses bornes :
```ts
greeting 0 0 16 3 · today 16 0 8 16 · kpi-sessions 0 3 8 3 · kpi-billing 8 3 8 3 · kpi-patients 0 6 8 3 · kpi-noshows 8 6 8 3
activity 0 9 16 7 · forecast 0 16 8 8 · bilans 8 16 8 8 · reprendre 16 16 8 8 · lapins 0 24 8 7 · forum 8 24 16 7
```
Mise en page hors WidgetCard (weather, greeting, kpi, mascot, forum) :
- R1 racine = `flex h-full flex-col overflow-hidden … [container:card/size]` (nommé `card`, comme widget-card.tsx:48) ⇒ `dash-low:` et `@container(max-height)` anonymes s'appliquent pareil
- R2 contenu fixe centré dans l'excédent : bloc principal `flex-1 items-center justify-center` (kpi valeur, greeting texte, mascot `max-h-full object-contain`)
- R3 forum : corps remis dans le flux `min-h-0 flex-1 overflow-y-auto` (T003 : hors flux, H=19 faux)
- weather (weather-widget.tsx:95,123,139) : shell R1 ; bloc « maintenant » `flex-1` centré V ; jours `grid-cols-3 @[14rem]/card:grid-cols-4`, 4e jour `hidden @[14rem]/card:flex` (14rem=224 ≈ 4×44+gaps) ; `[@container(max-height:120px|150px)]` inchangés (I4)
- widgets WidgetCard : ∅ changement (corps déjà `min-h-0 flex-1 overflow-y-auto`, widget-card.tsx:60)

Lots (racine F = ortho-front/src/modules/dashboard, W = F/components/widget ; `<d>/index.tsx` NV par dossier) — aucun fichier dans 2 lots ; T006–T009 parallèles après T005 ; T010 en dernier ; LIVRER T005–T009 ENSEMBLE (sinon fitCell borne aux anciens maxW 12-col)
- T005 cœur (10) : F/grid.constants.ts · F/dashboard-layout.util.ts · F/dashboard-layout.util.test.ts · F/dashboard-widgets.tsx (DEFAULT_CELLS, rowsToPx, gridLabel, ré-export STACK_BELOW) · F/components/grid.tsx · F/components/edit/layout-ops.core.ts · F/components/edit/layout-ops.core.test.ts · W/types.ts (commentaire :17-21 « sur 24 ») · src/api/dashboard-layout.ts (PATCH marqueur) · src/modules/showCase/components/DashboardWidgetsSection.tsx (colsToPx/rowsToPx → modulesToPx(n, moduleOf(1600)))
  DoD : étape 0 curl PUT `{x:0,w:24}`,`{x:23,w:1}`,`config:{_grid:24}` → 200 + GET renvoie `_grid` (sinon BLQ) ; tests util : 6 exemples migration + isLegacyLayout + toServer marque + fromServer strip/migre + readTabs objets migrés / liste non migrée ; catalogue fictif test en unités 24 (today 8×16 [8..24]) ; layout-ops boundsOf maxW 30→24 ; tsc OK ; sorties collées
- T006 agenda/patients (12) : W/{activity,forecast,worklists,today,next-appointment,week-grid,free-slots,tomorrow,admin-time,patient-search,birthdays,storage}/index.tsx — grid = tableau verbatim
- T007 facturation/docs/messagerie/forum/compte (12) : W/{revenue,unpaid-invoices,transmissions,recent-documents,unread-messages,quick-reply,contact-code,forum-notifications,achievements,kora-news,licence,onboarding}/index.tsx
- T008 perso/plaisir (12) : W/{feedback,clock,pomodoro,shortcuts,age-calculator,calculator,month-calendar,useful-links,daily-game,daily-quote,word-of-day,daily-anecdote}/index.tsx
- T009 hors WidgetCard (11) : W/weather/{index,weather-widget}.tsx · W/kpi/{index,dashboard-kpi}.tsx · W/forum/{index,dashboard-forum}.tsx · W/greeting/{index, composant NV}.tsx · W/mascot/{index, composant NV}.tsx · W/tongue-twister/index.tsx — R1–R3 + grid tableau ; DoD captures 1024/1280/1920
- T010 e2e (4) : ortho-front/e2e/dashboard/{ajout-widget,persistance,deplacement}.spec.ts (data-x/w attendus ×2, DEFAULT ci-dessus) + migration-grille.spec.ts (PUT ancien sans marqueur → reload → data-w ×2 → geste → GET : toutes cases `_grid:24`)
## Vérifié comment
moduleOf (G=16, 23·16=368) : 944→24,00 (pitch 40) · 1024→27,33 (43,33) · 1280→38,00 (54) · 1440→44,67 (60,67) · 1920→64,67 ⇒ plafond 48, grille 1520 (64)
weather 5×6 : 1024 → 201×244 px · 1280 → 254×308 · 1440 → 287×348 · ≥1520 → 304×368 ; ancien 3/12 @1920 ≈ 468 large
kpi 8×3 (DEFAULT) : 944 → 304×104 · 1280 → 416×146 · 1520 → 496×176 ; contenu 84
I4 : modulesToPx(8,24)=8·24+7·16=304 = dash-low (index.css:5) ; modulesToPx(4,24)=144 = ancien rowsToPx(4)
DEFAULT : col 0-15 rangées 0-3-6-9-16 + col 16-23 0-16 ; 3×8 col sur 16-24 ; 8+16 sur 24-31 ⇒ 24×31 couvert
lu : grid.constants.ts:6-8 · grid.tsx:73-114,204-221 · dashboard-widgets.tsx:67,70,74,141-160 · dashboard-layout.util.ts:52-64,74-87,115-127,143-183 · widget-card.tsx:48,60 · weather-widget.tsx:95,131,139 · types-jd8MiKM1.d.ts:339-350 (GridConfig : cols, rowHeight, margin, containerPadding, maxRows)
NV : acceptation back de x≥12/w>12 et conservation de `config._grid` (gate T005) ; H weather avec données ; noms composants greeting/mascot ; chemins `<d>/index.tsx` hors weather
## Écarts
- lecture hors WL : ∅ (Grep/Glob KO : `rg` absent, aucun contenu lu)
- DoD 4 : 7 non mesurés + weather (données) raisonnés famille/ancien h — NV
- today minW 8 ≠ règle (13) — rail DEFAULT ; licence Lmin 240 ≠ T003 (>480) — troncature voulue
- PNG weather-240/480 = état vide uniquement — inutile pour H données
## Pour la suite
- Module carré clamp((W−368)/24, 24, 48), grille ≤ 1520, pile < 944 ; réf. tailles = module 24 ⇒ h inchangé, x,w ×2
- Format neuf ⇔ ≥1 case avec `config._grid===24` ; INTERDIT : écrire config (PUT/PATCH) sans marqueur, ou exposer `_grid` au widget
- INTERDIT : convertir les seuils `@container(max-height)`/`dash-low` en modules ; ils restent en px
- INTERDIT : réintroduire ROW_HEIGHT constant ; toute hauteur passe par modulesToPx(h, moduleOf(width))
- Changer MODULE_MIN ⇒ recalculer tout le tableau (règles ci-dessus) ; point de non-retour = 1er PUT marqué en prod
## Retour sur le pack
- Manquait: largeur réelle de grille (menu, padding) aux viewports courants — décide la réf. ; signature PATCH config (src/api/dashboard-layout.ts) ; validations DTO back x/w ; noms fichiers composants greeting/mascot ; H weather avec données (adresse cabinet)
- Inutile: PNG weather (état vide) ; T002 en grande partie (T003 suffit, Δ seul utile)
