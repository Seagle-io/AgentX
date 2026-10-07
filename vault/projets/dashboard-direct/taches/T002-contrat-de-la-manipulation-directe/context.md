---
pack: T002
projet: dashboard-direct
role: architecte
cree: 2026-10-06
---

# Pack T002 — Contrat de la manipulation directe

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire le contrat qui permet à 4 implémenteurs parallèles (grille `grid.tsx` · page `dashboard-page.tsx` · chrome/catalogue/onglets · e2e) de livrer un dashboard en manipulation directe façon RGL showcase, sans mode édition, qui compile ensemble du premier coup.

## Definition of Done
- [ ] `## Livré` contient, en blocs de code TS verbatim : (1) `DashboardGridProps` complète, (2) `useLayoutAutosave` signature + sémantique (debounce ms, `sameLayout`, erreurs), (3) `CellChrome` props, (4) `CataloguePanel` props + protocole DnD RGL (`isDroppable`, `onDrop`, `droppingItem`, `dataTransfer` clé), (5) `DashboardTabBar` props en place (ajout/renommer/couleur/retirer sans mode), (6) liste exhaustive des `data-testid` et classes CSS (`.dash-*`) survivantes/nouvelles, (7) raccourcis clavier conservés
- [ ] chaque point tranché avec une option écartée et sa raison ≤ 8 mots
- [ ] réglages widget : où et comment (roue au survol → `FlyingModal` + `CellSettings`) — tranché
- [ ] historique : comment `edit-history.core.ts` est réutilisé hors édition (reset à la réception serveur ? coalesce des gestes ?) — tranché
- [ ] fichiers à supprimer / créer / modifier, par tâche T003-T006, sans chevauchement d'écriture
- [ ] `decisions.md` du projet : 1 entrée append (gabarit ci-dessous)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | props actuelles :16-38, RGL config :197-210 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | états :86-98, setCellConfig :389-399, renderCell :408-428, grid :445-489 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | L | Catalogue :64, CellSettings :161 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | roue/retirer actuels |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | onglets lecture, dash-edit :64 |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | LayoutCell, toServer:193, addToLayout:195, availableWidgets:214 |
| `~/Documents/Workspace/OrthoPro/ortho-front/node_modules/react-grid-layout/dist/index.d.ts` | L | API RGL v2 réelle (isDroppable/onDrop/droppingItem/dragConfig/resizeConfig) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | L | :1452-1535 seulement |
| `~/Documents/Workspace/OrthoPro/ortho-front/CLAUDE.md` | L | règles kit UI |
| `vault/projets/dashboard-direct/decisions.md` | E | ta décision, append |

## Contrats
Existants, recopiés — à conserver tels quels :
```ts
// dashboard-widgets.tsx
export type LayoutCell = { i: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }
export const STACK_BELOW = 640
export const toServer = (tabs: DashboardTab[]) => DashboardTabData[]      // :193
export const addToLayout = (layout: LayoutCell[], widget: string) => LayoutCell[]  // :195, en bas
export const availableWidgets = (placed: string[]) => WidgetDef[]        // :214
// api/dashboard-layout.ts
export async function saveDashboardLayout(tabs: DashboardTabData[]): Promise<DashboardLayout> // PUT
export async function updateDashboardCellConfig(cellId: string, config: Record<string, unknown>) // PATCH
// edit-history.core.ts
export type RecordOpt = boolean | { coalesce: string }
export const historyReducer = <T>(h: History<T>, action: HistoryAction<T>, { now = Date.now } = {}): History<T>
export const useEditHistory = <T>(initial: T) => { value: T; set(update, record?: RecordOpt): void; reset(value: T): void; undo(): void; redo(): void; canUndo: boolean; canRedo: boolean; changes: number }
// layout-ops.core.ts
export const boundsOf = (grid: WidgetGrid | undefined) => ({ minW, minH, maxW, maxH })
export const sameLayout = (a: readonly LayoutCell[], b: readonly LayoutCell[]): boolean
export const place = (layout, widget, at: {x,y,w,h}, newId: () => string): { layout: LayoutCell[]; cellId: string }
// grid.tsx aujourd'hui
gridConfig={{ cols: 12, rowHeight: 24, margin: [16, 16], containerPadding: [0, 0] }}
dragConfig={{ enabled: editing, handle: '.dash-grip' }}
resizeConfig={{ enabled: editing, handles: ['nw','ne','sw','se','e','s'] }}
cellTestAttrs → data-testid='dash-cell' data-widget data-cell-id data-x data-y data-w data-h
```
Gabarit `decisions.md` (append) :
```markdown
## 2026-10-06 — <décision en une phrase>
- **Contexte** : …  - **Choix** : …  - **Écarté** : … parce que …  - **Conséquence** : …  - **À revoir si** : …
```

## Décisions actées
- Plus de mode édition — humain 2026-10-06
- Auto-save après chaque geste, debounce, ∅ bouton — humain
- Catalogue flottant DnD (RGL droppable) + clic = ajout en bas — humain
- Undo/redo conservés, `edit-history.core.ts` réutilisé — brief
- Chrome de case : croix (retirer + toast Annuler) et roue (réglages) au survol — brief, à confirmer
- RGL ^2.2.4 conservé, ∅ nouvelle dépendance ; contrat API inchangé

## Hors périmètre
- Écrire du code de production ou des tests.
- Redessiner les widgets, les onglets au-delà de leur gestion en place.
- Toucher au back.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (decisions.md, result.md), Edit (decisions.md)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
- contrats en blocs de code TS verbatim, groupés par tâche destinataire (T003 grille · T004 page · T005 chrome/catalogue/onglets · T006 e2e) ; fichiers supprimer/créer/modifier par tâche
## Vérifié comment
rg/Read → coordonnées ; API RGL v2 citée avec ligne du .d.ts
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes : le choix et l'interdit qui en découle
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
