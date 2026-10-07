---
tache: T010
statut: fait
---
## Dépendances
- dashboard-page → dashboard-widgets (catalogue + wrappers layout) — dashboard-page.tsx:29
- dashboard-page → layout-ops / grid / widget-panels / api — dashboard-page.tsx:27,19,25,12
- grid → dashboard-widgets valeur (widgetById, STACK_BELOW, toCells) — grid.tsx:7
- layout-ops → dashboard-widgets valeur (newId, widgetById) → 43 imports widget — layout-ops.ts:3, dashboard-widgets.tsx:1-42
- edit-header → dashboard-widgets valeur (TAB_NAME_MAX) — edit-header.tsx:9
- tab-bar, edit-cell, widget-panels → dashboard-widgets type-only — tab-bar.tsx:5, edit-cell.tsx:4, widget-panels.tsx:9
- dashboard-widgets → dashboard-layout.util (LayoutCatalog injecté) — dashboard-widgets.tsx:46-51
- dashboard-layout.util → types (type), api (type), grid.constants ; 0 widget — dashboard-layout.util.ts:1-3
- widget/types.ts → greeting/dashboard-greeting.util (TodaySlot) : contrat dépend d'un widget — types.ts:6
- widget/* → agenda.dates ×6, agenda.utils ×2, messaging ×5, forum ×6, patients ×2 — rg `@/modules/`
- page → summary : 0 widget rendu sans `data` — dashboard-page.tsx:293,344
- cycles : 0 cycle d'import réel (widget/* → dashboard-widgets|grid|edit = ∅) ; « cycle » connu = couplage test layout-ops.ts:3 → 43 .tsx ; layout-ops.core.ts ∅ sur disque
## Verdicts
- (1) OK — util pur, 0 widget importé — condition : core n'importe que util/grid.constants/rgl-core ; `clamp` dupliqué layout-ops.ts:11 ≠ util:45 → importer util
- (2) KO — copies déjà divergentes, tests le prouvent — `widgetState([ok,{isLoading:false,isError:false,isSuccess:false}], true)` → `'loading'` tomorrow.util.ts:31 / week-grid:99 / free-slots:108 / useful-links:12 ; `'ready'` kora-news.util.ts:23-25 / quick-reply.util.ts:7-9 ; onboarding-widget.tsx:15 importe un `widgetState` absent de onboarding.util.ts
- (3) OK — formatage date inline 27× / 22 fichiers module — condition : affichage fr-FR seul, arithmétique reste `agenda.dates`, 0 import `@/modules`
- (4) KO — kpi/greeting/mascot cassent sous WidgetCard — kpi : bouton étiré inset-0 + action z-10 dashboard-kpi.tsx:44-57, WidgetCard <section> sans cible pleine surface → bouton dans bouton ou navigation perdue ; greeting : h2 salutation ≠ titre dashboard-greeting.tsx:37 ; mascot : surface = bouton mascot.tsx:29 ; today : migration perd `data-tour='dash-today'` today-widget.tsx:108 (WidgetCard sans passthrough)
## Contrats vague 3
```ts
// src/modules/dashboard/components/widget/widget-state.ts — 0 import (node:test, pas d'alias @/)
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export type WidgetState = 'loading' | 'error' | 'empty' | 'ready'
export const widgetState: (queries: readonly QueryLike[], isEmpty: boolean) => WidgetState
// table : ∃ isError → 'error' ; sinon ∃ ¬isSuccess → 'loading' ; sinon isEmpty ? 'empty' : 'ready' ; [] → isEmpty ? 'empty' : 'ready'
// I1 n'y passer que des requêtes enabled (désactivée ⇒ 'loading' perpétuel)
// I2 supprimer QueryLike/widgetState de tomorrow, week-grid, free-slots, useful-links, kora-news, quick-reply .util.ts ; onboarding importe ../widget-state ; 0 ré-export local
// I3 tests : widget-state.test.ts (import './widget-state.ts') = union des cas des 6 *.util.test.ts + cas inactif→'loading' + [] ; cas retirés des tests locaux
// I4 kora-news, quick-reply : comportement inactif change 'ready'→'loading' (voulu)
```
```ts
// widget-card.tsx — seul ajout autorisé
type Props = { icon: IconType; emoji?: string; title: ReactNode; hue?: string; count?: number; actions?: ReactNode; footer?: ReactNode; children: ReactNode; bodyClassName?: string; tour?: string } // tour → data-tour sur <section>
// RÈGLE shell : SHELL_PROPRE(w) ⇔ A ∨ B
//   A : aucun titre fixe nommant le widget (salutation, illustration, mosaïque de cartes)
//   B : surface entière = 1 cible de clic (bouton étiré inset-0)
//   ¬SHELL_PROPRE ⇒ WidgetCard + WidgetNote/Spinner pour états ; shell propre réutilise classes widget-card.tsx:32, 0 composant neuf
// application : greeting A · kpi B · mascot A∧B · weather A (autorisé, migration permise) · forum A si DashboardForum:63 sans titre (NV)
//               today, activity (chart+year), forecast, worklists, clock → WidgetCard ; today passe tour='dash-today'
```
```ts
// layout-ops.core.ts — bornes uniques (risque 1)
export const boundsOf: (grid: WidgetGrid | undefined) => { minW: number; minH: number; maxW: number; maxH: number } // défauts 1,1,GRID_COLS,60 ; maxW ≤ GRID_COLS
// grid.tsx withBounds (:84-95) et resize clavier consomment boundsOf
```
## E2E
- `dash-grid` — dashboard-page.tsx:325 (à côté de data-tour)
- `dash-cell` + `data-widget` `data-cell-id` `data-x` `data-y` `data-w` `data-h` — grid.tsx:155 (grille) et grid.tsx:115 (pile)
- `dash-edit` — tab-bar.tsx:64
- `dash-add-widget` — edit-header.tsx:146
- `dash-catalogue-item` + `data-widget` — widget-panels.tsx:109
- `dash-placement` — grid.tsx:61
- `dash-cell-remove` — edit-cell.tsx:75 (prop testid sur ToolButton :17)
- `dash-save` — edit-header.tsx:158 · `dash-cancel` — edit-header.tsx:157
- précond. communes : session e2e (e2e/support/session.ts) ; viewport 1440×900 (≥ STACK_BELOW 640) ; PUT /dashboard/layout via e2e/support/backend.ts avant chaque test ; GET summary 200 (sinon 0 case, dashboard-page.tsx:344)
- S1 `ajout-widget` : seed 1 onglet, 1 case greeting(0,0,8,4) ; dash-edit → dash-add-widget → dash-catalogue-item[data-widget=W sans `requires`] → clic dash-placement → expect dash-cell[data-widget=W] ×1 → dash-save → toast « Tableau de bord enregistré »
- S2 `deplacement` : seed case A(0,0,4,4) ; dash-edit → clic dash-cell A → ArrowRight ×2 → expect A data-x=2 → dash-save ; clavier, pas de drag souris (rgl instable)
- S3 `persistance-reload` : après S2 → page.reload() → expect A data-x=2 ; request GET /dashboard/layout → cells A.x === 2
- pattern : e2e/forum/markdown.spec.ts
## Risques
- bornes en 3 lieux (grid.tsx:84-95 sans maxH, layout-ops.ts:14-22 maxH 60) → souris ≠ clavier au-delà de 60 rangées → parade : boundsOf unique
- barrel valeur importé par module pur → un *.test.ts charge 43 .tsx → signal `rg "dashboard-widgets'" src/modules/dashboard --glob '*.{util,core}.ts' --glob 'widget-state.ts'` ≠ ∅ → parade : règle d'import dans chaque pack, rg en DoD
- WidgetContext grossit pour widgets à source propre → signal : nouveau champ dans types.ts:32-44 → parade : widget à source propre fait sa query (today-widget.tsx:59) ; WidgetContext gelé
## Vérifié comment
- Grep `export const widgetState` -A6 widget/ → 6 défs : 4× `!queries.every(q => q.isSuccess)) return 'loading'`, 2× `queries.every(q => q.isSuccess) && isEmpty) return 'empty'` + `return 'ready'`
- Grep `widgetState` onboarding/ → seul onboarding-widget.tsx:15 import + :34 usage ; onboarding.util.ts 0 match
- Grep widget/ `from '(\.\./)+(dashboard-widgets|dashboard-page|grid|edit/…|dashboard-layout\.util)'` → No matches found
- Grep `toLocaleDateString|toLocaleTimeString|Intl\.DateTimeFormat` dashboard/ → 27 occurrences / 22 fichiers
- Grep `data-testid|data-tour` dashboard/ → dashboard-page.tsx:326, tab-bar.tsx:64, today-widget.tsx:108 ; 0 data-testid
- Glob dashboard/*.ts → dashboard-layout.util.ts présent ; layout-ops.core.ts absent
- Grep `enabled:` {quick-reply,kora-news,onboarding}/*.tsx → No matches found
- NV : forum titre (DashboardForum:63 non lu) ; acceptation serveur d'un onglet seedé 1 case
## Écarts
- ∅ lecture hors WL ; scans rg/glob sur src/modules/dashboard et e2e seulement
## Pour la suite
- widgetState partagé `components/widget/widget-state.ts`, 0 import ; copies locales ×6 + test local interdits ; requête désactivée interdite en argument
- WidgetCard sauf A (sans titre) ∨ B (carte = 1 cible) : greeting, kpi, mascot gardent leur shell ; today passe `tour='dash-today'`
- modules purs (*.util.ts, *.core.ts, widget-state.ts) n'importent jamais dashboard-widgets ; bornes via boundsOf unique
- e2e : 9 data-testid listés + data-x/y/w/h sur case ; déplacement testé au clavier ; seed par PUT /dashboard/layout
- date.ts = affichage seul ; arithmétique reste agenda.dates ; WidgetContext gelé
## Retour sur le pack
- Manquait : état disque réel (layout-ops.core.ts ∅, onboarding.util sans widgetState) ; lignes edit-header/edit-cell/tab-bar hors WL pour cibler les testid (obtenues par rg)
- Inutile : api/dashboard-layout.ts (contrat déjà dans le pack)
