---
pack: T001
projet: dashboard-grille
role: eclaireur
cree: 2026-10-08
---

# Pack T001 — Reco stockage des dispositions et anatomie des widgets

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier, sur la branche `master` d'ortho-front et ortho-back, tout ce qui dépend des unités de la grille du dashboard (12 col fluides, rangée 24 px, gouttière 16 px) → carte collable dans le contrat d'une grille en modules carrés (24 col, rangée = largeur de colonne).

## Definition of Done
- [ ] chaque usage de `GRID_COLS`, `ROW_HEIGHT`, `GRID_GAP`, `rowsToPx`, `STACK_BELOW` listé `chemin:L — rôle` (rg src)
- [ ] stockage : forme exacte d'une disposition sauvegardée (entité back + DTO + `fromServer`/`toServer`/`readTabs`/`defaultTabs`/`fitCell`/`clamp`) — signatures verbatim ; existe-t-il un champ de version/unité ? (oui/non + où)
- [ ] dispositions existantes en base dev : `SELECT count(*)` des dispositions sauvegardées + 1 exemple de `cells` (x,y,w,h) — via `psql` lecture seule (connexion : `grep ^DB_ ortho-back/.env`, ne jamais afficher le mot de passe)
- [ ] `defaultTabs` : disposition livrée complète (widget, x, y, w, h) recopiée
- [ ] anatomie widget : `WidgetGrid` verbatim, `widget-card.tsx` (padding, en-tête, hauteur fixe ?), usage des requêtes de conteneur `@container/dash` (rg `@[a-z0-9]*:` dans components/widget → liste des points de rupture utilisés et par quels widgets)
- [ ] widgets hors `WidgetCard` (shell copié) : liste
- [ ] `weather` : fichiers, ce qui fixe sa largeur/hauteur, ce qu'il affiche
- [ ] pièges : migrations de disposition existantes côté front (`dashboard-layout.util.ts`), tests unitaires qui figent des tailles (rg `w: \d` dans *.test.ts)
- [ ] `result.md` rempli selon « Format de sortie », ≤ 150 lignes

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | unités |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | fromServer/toServer/defaultTabs/rowsToPx |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | fitCell, clamp, migrations legacy |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | gridConfig |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | WidgetGrid |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | habillage commun |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/weather/` | L | cas cité par l'humain |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/` | L | rg seulement (46 dossiers) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | contrat API |
| `~/Documents/Workspace/OrthoPro/ortho-back/src/modules/Dashboard/` | L | entité + DTO de disposition (rg pour trouver le chemin exact si différent) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | L | rg `.dash-` / `@container` seulement |

## Contrats
Actuel (connu) :
```ts
// grid.constants.ts
export const GRID_COLS = 12
export const ROW_HEIGHT = 24
export const GRID_GAP = 16
// widget/types.ts:22
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
// grid.tsx : gridConfig={{ cols: GRID_COLS, rowHeight: ROW_HEIGHT, margin: [GRID_GAP, GRID_GAP], containerPadding: [0, 0] }}
// weather/index.tsx:6 : grid: { w: 3, h: 6, minW: 2, minH: 4, maxW: 6, maxH: 8 }
```

## Décisions actées
- grille cible : modules carrés, 24 colonnes, hauteur de rangée = largeur de colonne — proposition chef, humain n'a pas objecté
- branche `master` — humain 2026-10-08
- chaque carte dimensionnée sur son contenu (météo trop large) — humain

## Hors périmètre
- Proposer le contrat ou les tailles ; écrire hors `result.md` ; écrire en base.

## Environnement
- psql : `localhost`, user/base dans `ortho-back/.env` (`DB_USERNAME`, `DB_DATABASE`) ; mot de passe via `PGPASSWORD="$(grep ^DB_PASSWORD .env | cut -d= -f2-)"` — jamais affiché
- lecture seule en base : `SELECT` uniquement

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, `Bash(rg:*)`, `Bash(ls:*)`, `Bash(wc:*)`, `Bash(psql:*)` (SELECT seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots) ; contrats en bloc de code verbatim
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
