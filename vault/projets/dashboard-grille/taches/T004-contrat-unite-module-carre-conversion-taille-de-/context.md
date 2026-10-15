---
pack: T004
projet: dashboard-grille
role: architecte
cree: 2026-10-08
---

# Pack T004 — Contrat : unité module carré, conversion, taille de chaque carte

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire le contrat d'une grille de dashboard (ortho-front, `master`) en **modules carrés** — 24 colonnes, hauteur de rangée = largeur de colonne — avec : la conversion sans perte des dispositions déjà enregistrées (12 col / rangée 24 px), la taille `{w,h,minW,minH,maxW,maxH}` en modules de **chaque** widget d'après les mesures T003, et le découpage en lots d'implémentation ≤ 12 fichiers sans chevauchement.

## Definition of Done
- [ ] unité : `GRID_COLS=24`, gouttière (px, tranchée), formule `module(width)` ; RGL v2 : comment obtenir rangée = colonne (rowHeight calculé depuis la largeur mesurée) ; borne mini/maxi de module (px) et comportement < `STACK_BELOW`
- [ ] `rowsToPx` et seuils `@container(max-height:…)` / `dash-low:` (calés sur 24 px) : règle de remplacement (en modules ? en px conservés ?) — tranchée
- [ ] conversion : détection ancien/nouveau format **sans lire le back** (connu : aucun champ version côté front ; `config` d'une case = `Record<string, unknown>` libre, persisté par PUT) — option retenue + écartée ; fonction pure `migrateLegacyCells` signature + règles (x,w ×2 ; h px → modules à une largeur de référence tranchée) + exemples chiffrés
- [ ] tableau **par widget** (47 ids, dont les 7 non mesurés : taille raisonnée depuis leur famille) : `id | w h | minW minH | maxW maxH` en modules, justifié par larg. min / haut. @240-480 de T003 ; `weather` explicitement
- [ ] `DEFAULT_CELLS` (disposition livrée) recalculée en modules, sans trou, alignée
- [ ] widgets hors `WidgetCard` (weather, greeting, kpi, mascot, forum) et `weather` (jours en `grid-cols-4` étiré) : règle de mise en page pour que le contenu suive la carte
- [ ] lots T005+ : fichiers E par lot (≤ 12, aucun fichier dans 2 lots), tests à mettre à jour (`dashboard-layout.util.test.ts`, `layout-ops.core.test.ts`, specs e2e `data-w`), `showCase/components/DashboardWidgetsSection.tsx`
- [ ] `decisions.md` du projet : 1 entrée append
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/dashboard-grille/taches/T001-reco-stockage-des-dispositions-et-anatomie-des-w/result.md` | L | carte du code (front) |
| `vault/projets/dashboard-grille/taches/T003-remesurer-les-widgets-avec-donnees-de-demo/result.md` | L | mesures avec données |
| `vault/projets/dashboard-grille/taches/T002-mesurer-le-contenu-reel-de-chaque-widget-au-navi/result.md` | L | mesures à vide (Δ) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | gridConfig, pile |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | DEFAULT_CELLS, rowsToPx, fromServer |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | fitCell, clamp, readTabs |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/weather/weather-widget.tsx` | L | cas cité |
| `~/Documents/Workspace/OrthoPro/ortho-front/node_modules/react-grid-layout/dist/types-jd8MiKM1.d.ts` | L | GridConfig (rowHeight, margin) |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure2/png/` | L | captures (weather-240/320/480) |
| `vault/projets/dashboard-grille/decisions.md` | E | décision, append |

## Contrats
```ts
// actuel
export const GRID_COLS = 12; export const ROW_HEIGHT = 24; export const GRID_GAP = 16
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }
// PUT /api/dashboard/layout { tabs } ; y ≤ 500 (contrainte back observée T002) ; ids UUID ; ≥ 1 onglet
// weather/index.tsx:6 grid: { w: 3, h: 6, minW: 2, minH: 4, maxW: 6, maxH: 8 } — lisible dès 160 px (T002/T003)
```

## Décisions actées
- 24 colonnes, rangée = largeur de colonne (module carré) — chef, humain sans objection 2026-10-08
- chaque carte à la taille de son contenu ; météo trop large — humain
- branche `master` ; contrat API inchangé si possible (back non lu : accès refusé, en attente humain)
- manipulation directe sans mode édition, auto-save, RGL v2 (`dragConfig`/`resizeConfig`/`dropConfig`) — projet dashboard-direct, déjà en place

## Hors périmètre
- Code de production, tests ; lire le back ; changer le contrat API sans option « sans back » documentée.

## Environnement
- back non lisible pour cette tâche (refus du classifieur) : raisonne sur le contrat API ci-dessus
- forum H mesurée non fiable (corps hors flux) ; 7 widgets non mesurés (modules messaging/documents/billing)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (decisions.md, result.md), Edit (decisions.md)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 180 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
- contrats TS verbatim ; tableau des 47 widgets ; DEFAULT_CELLS ; lots T005+ (fichiers E, DoD)
## Vérifié comment
calculs chiffrés (module à 1024/1280/1440/1920 px) ; coordonnées lues
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes : le choix et l'interdit qui en découle
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
