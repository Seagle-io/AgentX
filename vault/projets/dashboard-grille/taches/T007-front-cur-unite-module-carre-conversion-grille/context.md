---
pack: T007
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T007 — Front cœur : unité module carré, conversion, grille

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Passer le cœur du dashboard ortho-front (`master`) en grille de 24 colonnes à modules carrés (rangée = largeur de colonne, 24–48 px) : constantes, RGL, disposition livrée, conversion des dispositions 12 col (préférence legacy, back ancien), et `gridCols: 24` au PUT.

## Definition of Done
- [ ] **étape 0 (gate)** : `curl` sur le back (T006 + migration humaine faites) : PUT sans `gridCols` → 400 ; PUT `gridCols:24` avec `{x:0,w:24}` et `{x:23,w:1}` → 200 ; GET → `gridCols:24`. Sinon `bloque`. Session : `auth_token` de `$S/orthopro-session.json` ; remettre ensuite 1 onglet « Accueil » vide
- [ ] **étape 0bis** : Grep `dashboardWidgets` dans `ortho-front/src` : toute **écriture** de cette préférence ⇒ `bloque`
- [ ] `grid.constants.ts` = contrat verbatim (ROW_HEIGHT supprimé ; ∅ `GRID_MARK*`)
- [ ] `grid.tsx` : `gridWidthOf`/`moduleOf` par rendu, `rowHeight: module`, wrapper `maxWidth: GRID_MAX_WIDTH` ; `PlacementOverlay` en pas `module + GRID_GAP` sur x et y ; pile `< STACK_BELOW` : `minHeight = rowsToPx(cell.h)`
- [ ] `dashboard-widgets.tsx` : `rowsToPx(h, module = MODULE_MIN)`, `gridLabel`, ré-export `STACK_BELOW`, `DEFAULT_CELLS` = contrat verbatim
- [ ] `dashboard-layout.util.ts` : `migrateLegacyCells`, `cleanLayout(…, { legacy })` ; `fromServer` legacy ⇔ `gridCols !== GRID_COLS` ; `readTabs` toujours `legacy: true` ; `toServer` inchangé, sans marqueur
- [ ] `src/api/dashboard-layout.ts` : `DashboardLayout.gridCols?: number` ; PUT corps `{ gridCols: GRID_COLS, tabs }`
- [ ] `layout-ops.core.ts` : bornes lues dans GRID_COLS (24) ; `boundsOf` maxW défaut 24
- [ ] tests : `dashboard-layout.util.test.ts` (6 exemples `migrateLegacyCells` ; `fromServer` gridCols 24 → non migré, absent → ×2 ; `toServer` sans `_grid` ; `readTabs` objets migrés / liste de chaînes non migrée) ; `layout-ops.core.test.ts` en unités 24 (catalogue fictif : today 8×16 [8..24])
- [ ] `showCase/components/DashboardWidgetsSection.tsx` : `colsToPx/rowsToPx` → `modulesToPx(n, moduleOf(1600))`
- [ ] Grep `_grid|GRID_MARK|isLegacyLayout|stripMark|ROW_HEIGHT` dans `ortho-front/src` → ∅
- [ ] `npx tsc -b` → 0 ; `npx eslint` fichiers E → 0 erreur ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → vert ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | E | unités |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | E | conversion :52-183 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | E | DEFAULT_CELLS :67-160 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | E | RGL :204-221, overlay :73-114 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.test.ts` | E | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | E | commentaire :17-21 « sur 24 » |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | E | gridCols |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/showCase/components/DashboardWidgetsSection.tsx` | E | |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/orthopro-session.json` | L | `auth_token` compte de test — jamais affiché |

## Contrats
```ts
// grid.constants.ts (remplace ; ROW_HEIGHT SUPPRIMÉ → tout import casse la compilation, voulu)
export const GRID_COLS = 24
export const GRID_GAP = 16                    // px, H et V
export const MODULE_MIN = 24                  // px ; = ancien ROW_HEIGHT ; taille de référence du catalogue
export const MODULE_MAX = 48                  // px
export const GRID_MIN_WIDTH = GRID_COLS * MODULE_MIN + (GRID_COLS - 1) * GRID_GAP   // 944
export const GRID_MAX_WIDTH = GRID_COLS * MODULE_MAX + (GRID_COLS - 1) * GRID_GAP   // 1520
export const STACK_BELOW = GRID_MIN_WIDTH     // 944 (était 640)
export const LEGACY_COLS = 12
export const DASH_WIDGET_MIME = /* conserver si présent */
export const gridWidthOf = (width: number): number => Math.min(width, GRID_MAX_WIDTH)
export const moduleOf = (width: number): number =>
  Math.min(MODULE_MAX, Math.max(MODULE_MIN, (width - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS))
export const modulesToPx = (n: number, module: number): number => n * module + (n - 1) * GRID_GAP
export const pxToModules = (px: number, module: number): number => Math.ceil((px + GRID_GAP) / (module + GRID_GAP))
// dashboard-widgets.tsx
export { STACK_BELOW } from './grid.constants'
export const rowsToPx = (h: number, module: number = MODULE_MIN): number => modulesToPx(h, module)
export const gridLabel = ({ w, h }: WidgetGrid): string => w === GRID_COLS ? `Pleine largeur · ${h} modules de haut` : `${w} × ${h} modules`
// grid.tsx (RGL v2)
const gridWidth = gridWidthOf(width); const module = moduleOf(width)
<div className='relative' style={{ maxWidth: GRID_MAX_WIDTH }}>
<ReactGridLayout width={gridWidth} gridConfig={{ cols: GRID_COLS, rowHeight: module, margin: [GRID_GAP, GRID_GAP], containerPadding: [0, 0], maxRows: Infinity }} … />
// PlacementOverlay : prop module ; pitch = module + GRID_GAP (x et y) ; aperçu = modulesToPx(w|h, module) ; bottom = -(candidate.h * (module + GRID_GAP) + GRID_GAP) ; snap x ∈ [0, GRID_COLS − w]
// dashboard-layout.util.ts
type Box = { x: number; y: number; w: number; h: number }
/** 12 col → 24 col carrées à module 24 : x,w ×2 ; y,h identiques. */
export const migrateLegacyCells = <C extends Box>(cells: readonly C[]): C[] =>
  cells.map(c => ({ ...c, x: 2 * Math.round(c.x), w: 2 * Math.round(c.w), y: Math.round(c.y), h: Math.round(c.h) }))
export const cleanLayout = (items: unknown[], hasModule: (key: string) => boolean, catalog: LayoutCatalog, opts?: { legacy?: boolean }): LayoutCell[]
//   legacy ⇒ migrateLegacyCells sur les cases objet AVANT fitCell ; liste de chaînes ⇒ pack() en unités neuves, jamais migrée
// fromServer : legacy = layout.gridCols !== GRID_COLS ; cells → { i: id, ...cell } → cleanLayout(…, { legacy })
// readTabs : toujours cleanLayout(…, { legacy: true })
// api : export type DashboardLayout = { saved: boolean; gridCols?: number; tabs: … } ; PUT { gridCols: GRID_COLS, tabs }
// exemples
migrateLegacyCells([{ x: 8, y: 0, w: 4, h: 20 }])  // → [{ x: 16, y: 0, w: 8, h: 20 }]
migrateLegacyCells([{ x: 0, y: 34, w: 12, h: 7 }]) // → [{ x: 0, y: 34, w: 24, h: 7 }]
migrateLegacyCells([{ x: 9, y: 4, w: 3, h: 6 }])   // → [{ x: 18, y: 4, w: 6, h: 6 }]
// DEFAULT_CELLS (i = widget ; x y w h) — 24×31, 0 trou
greeting 0 0 16 3 · today 16 0 8 16 · kpi-sessions 0 3 8 3 · kpi-billing 8 3 8 3 · kpi-patients 0 6 8 3 · kpi-noshows 8 6 8 3
activity 0 9 16 7 · forecast 0 16 8 8 · bilans 8 16 8 8 · reprendre 16 16 8 8 · lapins 0 24 8 7 · forum 8 24 16 7
```
Invariants : I1 carte px = modulesToPx(w, m) × modulesToPx(h, m), m = moduleOf(width) · I2 x + w ≤ 24 · I4 modulesToPx(h, 24) === ancien rowsToPx(h) ⇒ seuils `@container(max-height)` / `dash-low` inchangés · J1 aucune lecture serveur migrée si gridCols === 24 · J2 tout PUT porte gridCols: 24 · J3 aucun `_grid`.

## Décisions actées
- 24 col, module carré 24–48 px, grille ≤ 1520 px alignée à gauche, pile < 944 — T004
- version au niveau API `gridCols`, jamais dans `config` — T005 (supersède T004)
- tailles des widgets posées par T008–T011 en parallèle : tu ne touches à aucun `widget/*/index.tsx`

## Hors périmètre
- `widget/*` (sauf `types.ts` commentaire), back, e2e (T012), mode édition (master = mode édition actuel, conservé).

## Environnement
- back `start:dev` avec T006 ; base migrée par l'humain avant ton lancement (gate étape 0)
- node 24 : `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH` ; `rg` absent → Grep
- `$S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npm run test:unit:*)`, `Bash(curl -s:*)`, `Bash(python3 -c:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T007
statut: fait | bloque
---
## Livré
- chemin:L — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
