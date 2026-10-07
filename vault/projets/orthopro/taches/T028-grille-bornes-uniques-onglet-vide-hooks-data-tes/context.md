---
pack: T028
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T028 — Grille : bornes uniques, onglet vide, hooks e2e

> Seule source de vérité de l'agent T028. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trois corrections dans le cœur grille/édition : (1) `boundsOf` unique dans `layout-ops.core.ts` consommé par `grid.tsx` `withBounds` ; (2) `cleanLayout([])` → `[]` (un onglet vide reste vide) ; (3) pose des 9 `data-testid` + `data-x/y/w/h` pour Playwright.

## Definition of Done
- [ ] (1) `layout-ops.core.ts` : `export const boundsOf = (grid: WidgetGrid | undefined) => ({ minW, minH, maxW, maxH })` défauts 1,1,GRID_COLS,MAX_H_DEFAULT ; maxW ≤ GRID_COLS ; `resize` l'utilise ; `grid.tsx:84-95 withBounds` l'importe (plus de maxH manquant côté souris) ; test ≥ 4 cas (grid undefined, maxW > 12, maxH absent, bornes normales)
- [ ] (2) `dashboard-layout.util.ts:113-116` : `items = []` → `[]` (plus de `addToLayout(…, 'today')` sur liste vide) ; le chemin « liste d'ids non vide » inchangé ; test existant qui documentait `[today]` inversé + 1 cas `fromServer` onglet `cells: []` → `layout: []` ; docstring L110-111 fait foi
- [ ] (3) `data-testid` posés : `dash-grid` (dashboard-page.tsx:354, à côté de data-tour) · `dash-cell` + `data-widget` `data-cell-id` `data-x` `data-y` `data-w` `data-h` (grid.tsx:155 grille ET :115 pile) · `dash-edit` (tab-bar.tsx:64, bouton Personnaliser) · `dash-add-widget` (edit-header.tsx:146) · `dash-catalogue-item` + `data-widget` (widget-panels.tsx:109) · `dash-placement` (grid.tsx:61) · `dash-cell-remove` (edit-cell.tsx:75 et :110 ; prop `testid?` sur ToolButton :16) · `dash-save` (edit-header.tsx:158) · `dash-cancel` (edit-header.tsx:157)
- [ ] `rg -c "data-testid" <6 fichiers>` collé ; 0 changement visuel
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` fichiers WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | E | boundsOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.test.ts` | E | +4 cas |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | E | withBounds, testid |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | E | cleanLayout |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts` | E | cas inversé +1 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | dash-grid |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | E | dash-edit |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | E | 3 testid |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | E | dash-catalogue-item |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | E | dash-cell-remove |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | GRID_COLS=12 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | WidgetGrid |

## Contrats
```ts
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
// layout-ops.core.ts actuel : nudge, resize(layout, id, w, h, gridOf), place(…, newId), MAX_H_DEFAULT = 60 ; GRID_COLS = 12
// grid.tsx:84-95 withBounds = ({ i, widget, x, y, w, h }: LayoutCell): LayoutItem => ({ …, minW: grid.minW, minH: grid.minH, ...(grid.maxW != null && { maxW }), ...(grid.maxH != null && { maxH }) })  // ← pas de maxH par défaut : souris ≠ clavier
// CIBLE
export const boundsOf: (grid: WidgetGrid | undefined) => { minW: number; minH: number; maxW: number; maxH: number }
// cleanLayout (util.ts:113-116) : items.every(string) ? addToLayout(pack(items, gridOf), 'today', catalog) : items.flatMap(readCell)  → [] si items.length === 0
// RÈGLE : *.core.ts / *.util.ts n'importent ni .tsx ni dashboard-widgets
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts ; runner : npm run test:unit (node 24, 315 tests verts au départ)
// RÈGLE : un *.util.ts ne doit importer ni .tsx ni dashboard-widgets (rg en DoD)
```

## Décisions actées
- onglet vide reste vide — humain, decisions.md#vague-3
- boundsOf unique — T010 risque 1
- noms des data-testid figés (contrat e2e T010) — ne pas renommer

## Hors périmètre
- widgets ; specs Playwright (lot suivant) ; comportement de nudge/place ; styles

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser dans `## Écarts`.
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, npx eslint, node --test, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d autres agents écrivent en même temps ; KO test/typecheck HORS WL = à lister, pas à corriger
- lint : `npx eslint <fichiers WL>` seulement (lint global rouge préexistant, 755 jsx-quotes hors dashboard)
- Si bloqué : statut `bloque`, une question précise dans `result.md`, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T028
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL)
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
