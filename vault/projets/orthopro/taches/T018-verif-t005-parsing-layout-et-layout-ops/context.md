---
pack: T018
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T018 — Vérif T005 (parsing layout + layout-ops)

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter le refactor T005 : prouver l'iso-fonctionnalité de `readTabs`/`fromServer`/`toServer`/`nudge`/`resize`/`place` entre `HEAD` (version d'origine, `git show HEAD:<chemin>`) et l'arbre courant, par sonde différentielle sur ≥ 30 entrées, puis chercher les cas limites non testés.

## Definition of Done
- [ ] `npm run test:unit` → ligne pass/fail collée ; `npx eslint` fichiers WL collé ; `npm run typecheck` collé
- [ ] sonde différentielle `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t005.probe.test.ts` (créer, lancer, SUPPRIMER ; `git status src/modules/dashboard` final collé) : extraire les anciennes fonctions pures de `git show HEAD:src/modules/dashboard/dashboard-widgets.tsx` (L217-343) et `HEAD:…/edit/layout-ops.ts` dans un fichier temporaire `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t005.legacy.probe.ts` (sans les imports .tsx : stub `widgetById` avec 3 grids fixes {w,h,minW,minH,maxW?,maxH?}) ; comparer `JSON.stringify` ancien vs nouveau sur : 3 formats legacy (liste d'ids, tableau de cells, {tabs}), id widget inconnu, `requires` sans module, onglet sans nom, 0 onglet, `toServer∘fromServer`, nudge aux 4 bords, resize sous min / sur max / h > 60, place sur case occupée
- [ ] écart déclaré `cleanLayout([])` → `[today]` : confirmer que HEAD faisait pareil (sinon DÉFAUT régression)
- [ ] 0 import de `.tsx` dans `dashboard-layout.util.ts`, `layout-ops.core.ts`, `edit-history.core.ts` (`rg -n "^import" <3 fichiers>` collé) ; `react-grid-layout/core` se charge sous node (le test core passe)
- [ ] `dashboard-page.tsx` : `git diff HEAD -- dashboard-page.tsx | rg "^[-+]import"` → aucun import touché par T005 (ceux de T004 possibles : les lister)
- [ ] `historyReducer` : undo après 3 set → valeur d'il y a 3 ; redo après undo puis set → pile redo vidée ; `record=false` n'empile pas — 3 cas dans la sonde si absents de `edit-history.core.test.ts`
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | livrable |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | wrappers L46-51, L171-196 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | livrable |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.ts` | L | wrapper |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | L | livrable |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.test.ts` | L | tests livrés |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | surface |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | L7, L100 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t005.probe.test.ts` | E | sonde, supprimer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/t005.legacy.probe.ts` | E | ancien code extrait, supprimer |

## Contrats
```ts
// signatures publiques inchangées (déclaré)
export const nudge = (layout: LayoutCell[], id: string, dx: number, dy: number): LayoutCell[]
export const resize = (layout: LayoutCell[], id: string, w: number, h: number): LayoutCell[]
export const place = (layout: LayoutCell[], widget: string, at: { x: number; y: number; w: number; h: number }): { layout: LayoutCell[]; cellId: string }
export type LayoutCell = { i: string; widget: string; x: number; y: number; w: number; h: number; config?: WidgetConfig }
export type DashboardTab = { id: string; name: string; color?: string | null; layout: LayoutCell[] }
export type GridLookup = (widget: string) => WidgetGrid | undefined
export type LayoutCatalog = { gridOf: GridLookup; isAllowed: (widget: string, hasModule: (k: string) => boolean) => boolean; defaultTabs: () => DashboardTab[]; newId: () => string }
// core : resize(…, gridOf) ; place(…, newId) ; MAX_H_DEFAULT = 60 ; GRID_COLS = 12
// ancien code : git show HEAD:src/modules/dashboard/dashboard-widgets.tsx | sed -n '217,343p' ; git show HEAD:src/modules/dashboard/components/edit/layout-ops.ts
// ids aléatoires (newId) : comparer après normalisation des ids (remplacer par index)
/// <reference types="node" />  · import { test } from 'node:test' · import assert from 'node:assert/strict' · imports source suffixés .ts
```

## Décisions actées
- refactor iso-fonctionnel exigé — tout écart de sortie = DÉFAUT sauf `cleanLayout([])` si HEAD identique
- lint global rouge (755, hors dashboard) — HP

## Hors périmètre
- corriger ; `grid.tsx` ; `boundsOf` unique (vague 3) ; dashboard-page.tsx au-delà du grep d'imports

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git show, git diff, git status, rm des 2 sondes), Write (sondes + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T018
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute (dont la sonde : n entrées comparées, n égales)
## Défauts
- ∅ | n. fichier:L — défaut — entrée → ancien / nouveau
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
