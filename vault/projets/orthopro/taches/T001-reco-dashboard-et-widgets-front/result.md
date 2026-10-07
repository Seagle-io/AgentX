---
tache: T001
statut: fait
---
## Livré
Racine `OrthoPro/ortho-front/` ; D = `src/modules/dashboard`.
- D/dashboard-page.tsx:88-91 — useQuery ['dashboard'] getDashboardSummary(30)
- D/dashboard-page.tsx:105-113 — ['dashboard-layout'] → fromServer, sinon readTabs(préf. legacy)
- D/dashboard-page.tsx:231-239 — save: PUT layout entier ; config: PATCH cellule L254-264
- D/dashboard-page.tsx:267-271 — context: WidgetContext, null tant que summary absent
- D/dashboard-page.tsx:277-293 — renderCell: widget.render(context, instance) ; EditCell si édition
- D/dashboard-page.tsx:307-360 — DashboardGrid (squelette L318 | EmptyState L322 | grille)
- D/dashboard-widgets.tsx:84-137 — catalogue DASHBOARD_WIDGETS, 43 fiches (imports L1-42)
- D/dashboard-widgets.tsx:217-343 — parsing/serialisation layout (readTabs, toServer…), ≈125 l.
- D/components/grid.tsx:111-121 — responsive : pile si width<640 (STACK_BELOW), non éditable
- D/components/grid.tsx:107-171 — react-grid-layout ; PlacementOverlay L40-81 ; handles L132
- D/components/edit/edit-cell.tsx:48-118 — sélection pointerdown, NumberInput colonnes/rangées
- Breakpoint unique STACK_BELOW=640 ; ∅ media-query ; cases `@container/dash` (grid.tsx:115,155)
- `console.`/TODO/FIXME/`any` : ∅ réel dans D
- Tests D : 27 `*.test.ts`, tous sous `widget/*/`. Racine D, grid, edit/ : ∅
- Tests par fonction : nudge ∅ · resize ∅ · place ∅ · useEditHistory ∅ · readTabs/cleanLayout/fromServer/toServer ∅ · addToLayout ∅
- e2e : `rg -l dashboard e2e/` → 0 ; dossiers e2e/ : auth exercises forum patients support

## Contrats
JSDoc retirés, code verbatim. `D/components/widget/types.ts` :
```ts
import type { ReactNode } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { IconType } from '@/shared/ui/icon/icons'
import type { DashboardSummary } from '@/api/dashboard'
import type { ActivityDay } from '../use-dashboard-activity'
import type { TodaySlot } from './greeting/dashboard-greeting.util'
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }  // 1 prop/ligne en source
export type WidgetContext = {
	data: DashboardSummary
	days: ActivityDay[]
	todaySlots: TodaySlot[] | null
	firstName: string
	displayEuros: (value: number) => string
	hideMoney: boolean
	toggleHideMoney: () => void
	navigate: NavigateFunction
	hasModule: (key: string) => boolean
	onCustomize: () => void
}
export type WidgetConfig = Record<string, unknown>
export type WidgetInstance = { config: WidgetConfig; setConfig: (patch: WidgetConfig) => void }
export const WIDGET_CATEGORIES = {
	journee: 'Journée', agenda: 'Agenda', patients: 'Patients', bilans: 'Bilans',
	facturation: 'Facturation', documents: 'Documents', messagerie: 'Messagerie',
	forum: 'Forum', compte: 'Compte et licence', perso: 'Personnel',
	analyse: 'Analyse', fun: 'Pour le plaisir',
} as const  // 1 entrée/ligne en source
export type WidgetCategory = keyof typeof WIDGET_CATEGORIES
export type DashboardWidget = {
	id: string
	label: string
	description: string
	icon: IconType
	emoji?: string
	category?: WidgetCategory   // sans rayon : « Autres »
	grid: WidgetGrid
	requires?: string           // module requis, sinon ni affiché ni proposé
	optional?: boolean          // proposé à l'ajout, absent du défaut
	render: (ctx: WidgetContext, instance: WidgetInstance) => ReactNode
	settings?: (ctx: WidgetContext, instance: WidgetInstance) => ReactNode
}
```
Dérivés `D/dashboard-widgets.tsx` :
```ts
export type LayoutCell = { i: string; widget: string; x: number; y: number; w: number; h: number; config?: WidgetConfig }
export type DashboardTab = { id: string; name: string; color?: string | null; layout: LayoutCell[] }
export const STACK_BELOW = 640
```
`src/api/dashboard-layout.ts` (corps omis ; tous : fetch + `if (!res.ok) throw await apiError(res, '<nom>')`, base `VITE_API_URL ?? '/api'`) :
```ts
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }  // id = UUID client
export type DashboardTabData = { id: string; name: string; color: string | null; cells: DashboardCellData[] }
export type DashboardLayout = { saved: boolean; tabs: DashboardTabData[] }
export type DashboardLink = { id: string; label: string; url: string; position: number }
export async function getDashboardLayout(): Promise<DashboardLayout>                                  // GET /dashboard/layout
export async function saveDashboardLayout(tabs: DashboardTabData[]): Promise<DashboardLayout>        // PUT /dashboard/layout {tabs}, tout ou rien
export async function updateDashboardCellConfig(cellId: string, config: Record<string, unknown>): Promise<{ id: string; config: Record<string, unknown> }>  // PATCH /dashboard/cells/:id/config {config}, fusion serveur
export async function listDashboardLinks(): Promise<DashboardLink[]>                                  // GET /dashboard/links
export async function createDashboardLink(input: { label: string; url: string }): Promise<DashboardLink>  // POST
export async function deleteDashboardLink(id: string): Promise<void>                                  // DELETE /dashboard/links/:id
```
`D/components/edit/layout-ops.ts` (exports) :
```ts
export const nudge = (layout: LayoutCell[], id: string, dx: number, dy: number): LayoutCell[]
export const resize = (layout: LayoutCell[], id: string, w: number, h: number): LayoutCell[]
export const place = (layout: LayoutCell[], widget: string, at: { x: number; y: number; w: number; h: number }): { layout: LayoutCell[]; cellId: string }
// internes : clamp, bounds (maxH défaut 60, maxW ≤ GRID_COLS), settle (verticalCompactor.compact), toItems
```
`D/grid.constants.ts` :
```ts
export const GRID_COLS = 12
export const ROW_HEIGHT = 24
export const GRID_GAP = 16
```
`D/components/edit/use-edit-history.ts` :
```ts
export const useEditHistory = <T>(initial: T) => { value, set(update: T | ((c:T)=>T), record = true), reset(value: T), undo, redo, canUndo, canRedo, changes }
```
e2e — `e2e/support/session.ts` (verbatim) :
```ts
export type Session = { token: string; patientId: string }
export const readSession = async (): Promise<Session>   // lit e2e/.fixtures/session.json
```
`e2e/support/backend.ts` : exports async (token,…) createPractitioner · createPatient(token, firstName='E2E', lastName='Front'): Promise<string> · createExercise · assignExercise · playTrainingRun · closePool · joinForum · openForumCategory · createForumTopic/Listing/ListingReply · firstForumPost(Content) · setForum*Content (DB directe).
Pattern `e2e/forum/markdown.spec.ts` : `import { test, expect, type Page } from '@playwright/test'` · session lue en sync via `readFileSync(.fixtures/session.json)` (L20-22, ≠ readSession) · `test.describe` + `beforeAll` seed via helpers backend (L63-67) · `beforeEach(({ page }) => …)` · `page.goto(url)` · locators `getByRole/getByLabel/locator('[data-…]')` · `toHaveScreenshot('x.png')` (L93, L169, L204) · restaure les données en fin de test · imports `'../support/backend.js'` (suffixe .js). playwright.config.ts : testMatch `*.spec.ts`, workers 1, retries 0, viewport 1920×1080, storageState `e2e/.auth/user.json`, maxDiffPixelRatio 0.02, front+back lancés hors config (`make test-e2e`). Hook de test présent : `data-tour='dash-grid'` (dashboard-page.tsx:329) ; aucun `data-testid` dans D.

## Défauts
- D/dashboard-page.tsx:105,128 — erreur layout non gérée : repli silencieux sur défaut — H
- D/dashboard-page.tsx:105-113 — layout KO → readTabs(défaut) ; un save écraserait la vraie disposition — H
- D/dashboard-page.tsx:267,278 — summary KO : context null, cases vides sans message par case — M
- D/dashboard-page.tsx:123 — migration : échec avalé sans toast — M
- D/dashboard-page.tsx:267-276 + grid.tsx:128 — context, instanceOf, withBounds recréés chaque rendu — M
- D/components/edit/edit-cell.tsx:100 ≡ layout-ops.ts:20 ; clamp dupliqué (widgets.tsx:143, ops:11) — B
- D/dashboard-widgets.tsx:217-343 — parsing formats legacy (liste d'ids, tableau, {tabs}) mêlé au catalogue — M
- D/components/edit/layout-ops.ts:36-66 — place/resize/nudge/readTabs/toServer ∅ test, logique critique — H
- package.json typecheck `tsc --noEmit -p .` — tsconfig.json `files: []` + references ; ne vérifie rien (0,555 s) — H
- package.json test:unit — KO sous node 22.22.1 système (PATH par défaut) ; OK sous node 24.15.0 — H
- e2e/ — 0 spec dashboard ; édition/DnD/persistance non couverts — H

## Vérifié comment
- `rg -l dashboard e2e/ | wc -l` → 0
- `npm run test:unit` (node v22.22.1) → `# tests 58 · pass 0 · fail 58 · duration_ms 884` ; `ERR_UNKNOWN_FILE_EXTENSION ".ts"`
- `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → `ℹ tests 243 · suites 24 · pass 243 · fail 0 · duration_ms 892.778542`
- `npm run typecheck` → sortie vide, exit OK, `real 0m0,555s` ; tsconfig.json = `{"files": [], "references": [app, node]}`
- NV : `tsc -b`/`-p tsconfig.app.json` réel — hors outils autorisés
- NV : e2e exécuté — requiert front+back+DB
- `rg "TODO|FIXME|any\b|console\."` D hors tests → 1 faux positif (`many`, age.util.ts:46)

## Écarts
- lecture hors WL : ∅ (scans rg/ls/head autorisés)
- 2e run test:unit avec PATH node 24 (lecture seule)
- DoD flux ≤10 lignes : 11 lignes-faits ; JSDoc retirés des contrats (code identique)

## Pour la suite
- P0 : `npm run test:unit` exige node ≥24 (`~/.nvm/versions/node/v24.15.0/bin`) : 243 OK ; node 22 = 58 KO. `npm run typecheck` ne vérifie rien (`files: []`) → fixer (`tsc -b`) avant tout lot.
- Tests à écrire (∅, `node:test`, `*.test.ts` à côté) : `layout-ops.ts`, `dashboard-widgets.tsx:217-343`, `use-edit-history.ts` ; layout-ops importe dashboard-widgets (43 widgets .tsx) → faisabilité sous Node NV.
- Défaut H : erreur `['dashboard-layout']` ignorée (`dashboard-page.tsx:105,128`) → défaut affiché, save écraserait la base ; ajouter erreur + Réessayer, save bloqué.
- e2e dashboard ∅ : `e2e/dashboard/*.spec.ts` sur pattern forum, hook `data-tour='dash-grid'`, ajouter `data-testid` ; stack front+back+`ortho_test` requise.
- Découpe : lot A fiabilité page (erreurs, memo, tests) · lot B extraire parsing legacy, dédupliquer clamp/60 ; widgets/* = T002.

## Retour sur le pack
- Manquait: version node requise ; droit de lire `tsconfig*.json` ; `backend.ts` hors WL
- Inutile: ∅
