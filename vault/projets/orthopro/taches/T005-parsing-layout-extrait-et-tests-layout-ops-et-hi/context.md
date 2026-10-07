---
pack: T005
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T005 — Parsing layout extrait + tests layout-ops/history

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Extraire le parsing/sérialisation du layout (`dashboard-widgets.tsx:217-343`) et le cœur pur de `layout-ops.ts` en modules sans import `.tsx`, puis les couvrir en `node:test` ; ré-exporter depuis les chemins actuels pour que `dashboard-page.tsx` ne change pas.

## Definition of Done
- [ ] `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` créé : `readTabs`, `cleanLayout`, `fromServer`, `toServer`, `addToLayout`, `clamp` + types `LayoutCell`, `DashboardTab` ; 0 import de `.tsx` ; la liste des widgets/grids passée en paramètre (voir Contrats)
- [ ] `dashboard-widgets.tsx` ré-exporte les mêmes noms (`export { readTabs, … } from './dashboard-layout.util'`) avec la même signature publique qu'avant (wrapper qui injecte le catalogue) — `rg -n "readTabs|fromServer|toServer" src/modules/dashboard/dashboard-page.tsx` inchangé
- [ ] `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` créé : `nudge`, `resize`, `place` purs, grid lookup injecté ; `layout-ops.ts` = wrapper 10 lignes max qui injecte `widgetById`
- [ ] `clamp` défini 1 fois (actuellement widgets.tsx:143 ≡ layout-ops.ts:11 ≡ edit-cell.tsx:100) — edit-cell importe
- [ ] `use-edit-history.ts` : reducer pur `historyReducer` extrait dans `edit-history.core.ts`, hook inchangé en surface
- [ ] tests : `dashboard-layout.util.test.ts` (≥ 12 cas : 3 formats legacy liste d'ids / tableau / {tabs}, widget inconnu ignoré, requires sans module filtré, aller-retour toServer∘fromServer = identité, clamp bornes), `layout-ops.core.test.ts` (≥ 9 : nudge bords 4 directions, resize min/max/plafond h 60, place sur case occupée → compaction, cellId unique), `edit-history.core.test.ts` (≥ 5 : set/undo/redo/reset/record=false)
- [ ] `npm run test:unit` → `# fail 0`, total ≥ 243+26 ; `npm run typecheck`, `npm run lint` → sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | E | L217-343 → extraire, ré-exporter |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.ts` | E | wrapper |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | E | extraire reducer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | E | L100 : importer clamp |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | GRID_COLS=12, ROW_HEIGHT=24, GRID_GAP=16 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | WidgetGrid, DashboardWidget |

## Contrats
```ts
// existant
export type LayoutCell = { i: string; widget: string; x: number; y: number; w: number; h: number; config?: WidgetConfig }
export type DashboardTab = { id: string; name: string; color?: string | null; layout: LayoutCell[] }
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
export type DashboardLayout = { saved: boolean; tabs: DashboardTabData[] }  // api
export type DashboardTabData = { id: string; name: string; color: string | null; cells: DashboardCellData[] }
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }
// layout-ops.ts actuel
import { cloneLayout, moveElement, verticalCompactor, type LayoutItem } from 'react-grid-layout/core'
export const nudge = (layout: LayoutCell[], id: string, dx: number, dy: number): LayoutCell[]
export const resize = (layout: LayoutCell[], id: string, w: number, h: number): LayoutCell[]
export const place = (layout: LayoutCell[], widget: string, at: { x: number; y: number; w: number; h: number }): { layout: LayoutCell[]; cellId: string }
// internes : clamp, bounds (maxH défaut 60, maxW ≤ GRID_COLS), settle (verticalCompactor.compact), toItems
// use-edit-history.ts
export const useEditHistory = <T>(initial: T) => { value, set(update: T | ((c:T)=>T), record = true), reset(value: T), undo, redo, canUndo, canRedo, changes }
// CIBLE injection (à respecter)
export type GridLookup = (widget: string) => WidgetGrid | undefined
export type LayoutCatalog = { gridOf: GridLookup; isAllowed: (widget: string, hasModule: (k: string) => boolean) => boolean; defaultTabs: () => DashboardTab[]; newId: () => string }
// pattern test existant (revenue.util.test.ts:1-5)
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts obligatoire
// runner : "test:unit": "node --test 'src/**/*.test.ts'"  (node 24 ; 243 tests verts au départ)
```
Si `react-grid-layout/core` ne se charge pas sous node (ESM/CJS) → `result.md` statut `bloque` avec la sortie brute, ne contourne pas.

## Décisions actées
- extraction + ré-export, 0 changement d'import dans dashboard-page.tsx — T004 l'édite en parallèle
- tests node:test, fichier `.test.ts` à côté, import avec suffixe `.ts` — convention repo

## Hors périmètre
- `dashboard-page.tsx`, `grid.tsx`, `widget-panels.tsx`, `edit-header.tsx`
- changer le comportement observable de nudge/resize/place/readTabs — refactor iso-fonctionnel
- tester le hook React lui-même (pas de DOM sous node)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, node, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node` — node 22 système KO sur `.ts`
- Interdit : `git commit`, `git push`, `npm install`, migration — le chef commit par lot
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
commande → sortie brute (test:unit, typecheck, lint) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
