---
pack: T010
projet: orthopro
role: architecte
cree: 2026-10-05
---

# Pack T010 — Audit architecture module dashboard

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger la structure de `ortho-front/src/modules/dashboard` (page / catalogue / grille / édition / widgets) et les 4 choix structurants de la vague 2 ci-dessous : rendre pour chacun OK ou KO avec contre-exemple, et produire les contrats de la vague 3.

## Definition of Done
- [ ] carte des dépendances du module en ≤ 12 lignes-faits (`A → B` avec coordonnée), cycles signalés (`layout-ops → dashboard-widgets → widget/* (43 .tsx)` connu)
- [ ] verdict OK/KO + raison ≤ 8 mots + contre-exemple si KO, pour chacun : (1) extraction `dashboard-layout.util.ts` + `layout-ops.core.ts` avec `LayoutCatalog` injecté, ré-export depuis `dashboard-widgets.tsx` ; (2) `widgetState(queries, isEmpty)` copié localement par widget (×7) plutôt que module partagé ; (3) `src/shared/lib/format/date.ts` hors du module dashboard ; (4) `WidgetCard` imposé aux 10 widgets à shell propre (weather, clock, activity, today, forecast, forum, greeting, kpi, mascot, worklists) — y compris greeting/kpi/mascot qui sont peut-être volontairement sans carte
- [ ] contrat vague 3 verbatim : signature finale de `widgetState` partagé (chemin, type `QueryLike`) OU décision « reste local » ; règle écrite « quel widget a droit à un shell sans WidgetCard » (critère binaire)
- [ ] contrat e2e dashboard : liste des `data-testid` à poser (≤ 10, nom + fichier:ligne cible), 3 scénarios Playwright nommés (ajout widget, déplacement, persistance après reload) avec préconditions
- [ ] 3 risques structurels max, chacun : signal + parade (pas de refactor global proposé)
- [ ] `decisions.md` du projet : ajouter UN bloc `## 2026-10-05 — architecture (T010)` ≤ 15 lignes, append-only
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule sur ortho-front. Attention : T004/T005/T007-T009 modifient en ce moment la page, le catalogue, edit/ et 7 dossiers widget — juger la structure cible décrite ici, pas l'instantané du disque.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | orchestration |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | catalogue + parsing L217-343 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | react-grid-layout |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.ts` | L | ops |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | L | panneau ajout |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | contrat widget |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | shell commun |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/dashboard-greeting.tsx` | L | shell propre, cas limite |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/dashboard-kpi.tsx` | L | shell propre, cas limite |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx` | L | plus gros widget |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | API |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/orthopro/decisions.md` | E | append 1 bloc |

## Contrats
```ts
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
export type WidgetContext = { data: DashboardSummary; days: ActivityDay[]; todaySlots: TodaySlot[] | null; firstName: string; displayEuros: (value: number) => string; hideMoney: boolean; toggleHideMoney: () => void; navigate: NavigateFunction; hasModule: (key: string) => boolean; onCustomize: () => void }
export type WidgetInstance = { config: WidgetConfig; setConfig: (patch: WidgetConfig) => void }
export type DashboardWidget = { id: string; label: string; description: string; icon: IconType; emoji?: string; category?: WidgetCategory; grid: WidgetGrid; requires?: string; optional?: boolean; render: (ctx: WidgetContext, instance: WidgetInstance) => ReactNode; settings?: (ctx: WidgetContext, instance: WidgetInstance) => ReactNode }
export type LayoutCell = { i: string; widget: string; x: number; y: number; w: number; h: number; config?: WidgetConfig }
export type DashboardTab = { id: string; name: string; color?: string | null; layout: LayoutCell[] }
export type DashboardLayout = { saved: boolean; tabs: DashboardTabData[] }  // GET/PUT /dashboard/layout ; PATCH /dashboard/cells/:id/config
export const nudge = (layout: LayoutCell[], id: string, dx: number, dy: number): LayoutCell[]
export const resize = (layout: LayoutCell[], id: string, w: number, h: number): LayoutCell[]
export const place = (layout: LayoutCell[], widget: string, at: { x: number; y: number; w: number; h: number }): { layout: LayoutCell[]; cellId: string }
export const WidgetCard = ({ icon, emoji, title, hue, count, actions, footer, children, bodyClassName }: …)
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
// vague 2 — cibles en cours (T005, T007/T008)
export type GridLookup = (widget: string) => WidgetGrid | undefined
export type LayoutCatalog = { gridOf: GridLookup; isAllowed: (widget: string, hasModule: (k: string) => boolean) => boolean; defaultTabs: () => DashboardTab[]; newId: () => string }
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export const widgetState = (queries: QueryLike[], isEmpty: boolean): 'loading' | 'error' | 'empty' | 'ready'  // error > loading > empty > ready
// faits : grille react-grid-layout/core, GRID_COLS 12, ROW_HEIGHT 24, STACK_BELOW 640 (pile, non éditable) ; tests node:test *.test.ts à côté ; hook e2e existant data-tour='dash-grid' (dashboard-page.tsx:329), 0 data-testid ; e2e/ : 0 spec dashboard, pattern e2e/forum/markdown.spec.ts
```

## Décisions actées
- périmètre : qualité existant, HP nouveaux widgets — decisions.md#2026-10-05
- kit UI showcase réutilisé, 0 nouveau composant — RULE.MD
- vague 2 déjà lancée : un KO ne l'arrête pas, il alimente les tâches correctives de la vague 3

## Hors périmètre
- écrire ou modifier du code ; proposer une refonte globale ; back `ortho-back` ; juger le style visuel

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (decisions.md, result.md), Edit (decisions.md append)
- Scan sans Read (rg/ls/wc) autorisé sur src/modules/dashboard et e2e — ne compte pas comme lecture hors WL
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 90 lignes, sections exactes :

```markdown
---
tache: T010
statut: fait | bloque
---
## Dépendances
- A → B — chemin:L
## Verdicts
- (1) OK|KO — raison — contre-exemple
## Contrats vague 3
bloc(s) de code verbatim
## E2E
- data-testid — fichier:L ; scénarios
## Risques
- signal → parade
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
