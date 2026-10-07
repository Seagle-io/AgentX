---
pack: T030
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T030 — Vérif T028 (grille)

> Seule source de vérité de l'agent T030. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter le lot T028 : `boundsOf` donne les mêmes bornes à la souris (`grid.tsx withBounds`) et au clavier (`resize`), `cleanLayout([])` → `[]` sans casser les autres chemins legacy, les 9 `data-testid` sont présents avec les attributs `data-*` attendus par le contrat e2e.

## Definition of Done
- [ ] `node --test` sur `layout-ops.core.test.ts` + `dashboard-layout.util.test.ts` ; `npx eslint` 10 fichiers ; `npm run typecheck` ; `npm run test:unit` (KO hors WL d'autres lots : lister, HP) — sorties collées
- [ ] sonde `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t030.probe.test.ts` (créer, lancer, supprimer, `git status` collé) : `boundsOf(undefined)` = {1,1,12,60} ; `boundsOf({…maxW:20})`.maxW = 12 ; `boundsOf({…maxH:undefined})`.maxH = 60 ; `resize` avec h=200 sur widget sans maxH → h = 60 ; `cleanLayout([], …)` → [] ; `cleanLayout(['kpi'], …)` → contient kpi ET today (chemin liste d'ids non vide inchangé — recopier l'attendu depuis le test livré) ; `fromServer({saved:true, tabs:[{id,name,color:null,cells:[]}]})` → `layout: []` ; `readTabs('{"tabs":[]}')` → comportement inchangé vs HEAD (`git show HEAD:…/dashboard-layout.util.ts`)
- [ ] `grid.tsx` : `withBounds` importe `boundsOf` (plus de calcul local) — citer ; `cellTestAttrs` posé sur la grille (L~157) ET sur la pile (L~116) avec `data-testid='dash-cell' data-widget data-cell-id data-x data-y data-w data-h` — citer ; `dash-placement` sur l'overlay (L~62)
- [ ] `rg -n "data-testid='dash-" src/modules/dashboard` → exactement : dash-grid, dash-cell, dash-edit, dash-add-widget, dash-catalogue-item, dash-placement, dash-cell-remove, dash-save, dash-cancel ; `dash-catalogue-item` porte `data-widget` ; sortie collée
- [ ] `edit-cell.tsx` : les 2 `ToolButton` « Retirer » (L75, L112) portent le testid ; « Réglages » non
- [ ] régression : `rg -n "maxH" grid.tsx layout-ops.core.ts edit-cell.tsx` — edit-cell.tsx:93,102 calcule encore des bornes à la main (connu, HP) ; toute autre borne locale = DÉFAUT
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | boundsOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.test.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | withBounds, testid |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | cleanLayout |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | dash-grid |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | dash-edit |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | L | 3 testid |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | L | catalogue |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | remove |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t030.probe.test.ts` | E | sonde, supprimer |

## Contrats
```ts
export const boundsOf: (grid: WidgetGrid | undefined) => { minW: number; minH: number; maxW: number; maxH: number }  // défauts 1,1,GRID_COLS=12,MAX_H_DEFAULT=60 ; maxW ≤ 12
// cleanLayout(items, hasModule, catalog) : items.length === 0 → [] ; liste d'ids non vide → addToLayout(pack(ids), 'today') (inchangé) ; sinon flatMap(readCell)
// catalog stub pour la sonde : { gridOf: id => ({kpi:{w:4,h:2,minW:2,minH:2}, today:{w:8,h:4,minW:4,minH:3}})[id], isAllowed: () => true, defaultTabs: () => [], newId: () => 'id' }  — adapter aux signatures réelles lues dans util.ts
// e2e (T010) : dash-grid page:355 · dash-cell+data-widget/cell-id/x/y/w/h grid:157 & :116 · dash-edit tab-bar:64 · dash-add-widget edit-header:146 · dash-catalogue-item+data-widget widget-panels:110 · dash-placement grid:62 · dash-cell-remove edit-cell:75,112 · dash-save/dash-cancel edit-header:158,157
/// <reference types="node" /> · node:test · node:assert/strict · imports relatifs .ts
```

## Décisions actées
- onglet vide reste vide — humain ; liste d'ids legacy non vide garde today — inchangé
- edit-cell.tsx NumberInput bornes manuelles — connu, suivi vague 3b

## Hors périmètre
- corriger ; widgets ; specs Playwright

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git show, git diff, git status, rm sonde), Write (sonde + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T030
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute (sonde : n cas, n OK)
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
