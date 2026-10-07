---
pack: T034
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T034 — Édition : cellule

> Seule source de vérité de l'agent T034. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `edit-cell.tsx` : clics sur Réglages/Retirer jamais perdus, poignée de drag identifiée `.dash-grip`, barre d'outils qui ne déborde pas, carte focalisable au clavier, bornes du NumberInput via `boundsOf`, « Colonnes » masqué en pile.

## Definition of Done
- [ ] F1 clics perdus (L49-55, L72-77) : `ToolButton` (L16) reçoit `onPointerDown={e => e.stopPropagation()}` ; le bloc outils rendu que la carte soit sélectionnée ou non ne se démonte plus au pointerdown (ou outils rendus dans les deux états) — un clic sur Retirer d'une carte non sélectionnée retire en 1 clic
- [ ] F2 `.dash-grip` : classe posée sur l'élément poignée (Grip L68) ; `aria-hidden` retiré, `aria-label='Déplacer'`, `cursor-grab` ; le reste de la carte = sélection seule (contrat T033 draggableHandle)
- [ ] F3 barre flottante (L81) : ancrée `right-0` quand `x + w > 6` (prop ou calcul depuis la cellule), `left-0` sinon ; jamais hors de la grille
- [ ] F4 focus : racine carte `tabIndex={0} role='button' aria-pressed={selected}` ; Entrée/Espace → `onSelect` ; `focus-visible:ring-2 ring-accent` ; ordre de tabulation = ordre du layout
- [ ] F5 bornes (L87-105) : `const b = boundsOf(widget.grid)` → NumberInput min/max = `b.minW/b.maxW/b.minH/b.maxH` ; plus aucun `?? 12`, `?? MAX_H_DEFAULT` local
- [ ] F6 pile : nouvelle prop `stacked?: boolean` ; si vrai, le NumberInput « Colonnes » n'est pas rendu (prop câblée par T035 ; défaut false)
- [ ] `data-testid='dash-cell-remove'` conservé (L75, L110) ; `npm run typecheck` → 0 erreur WL ; `npx eslint` → 0 ; `npm run test:unit` → fail 0 ; sorties collées
- [ ] `result.md` : « Repro pour vérif » 1 ligne par F
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | E | tout le lot |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | boundsOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | WidgetGrid, DashboardWidget |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/input/` | L | NumberInput (rg le fichier) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | props passées à EditCell (T033 l'édite en parallèle : lecture seule) |

## Contrats
```ts
// contrats vague 4 (decisions.md#mode-edition)
// poignée de drag : élément portant la classe .dash-grip (T034 la pose sur le Grip, edit-cell.tsx:68) ; grid.tsx passe draggableHandle=".dash-grip" (T033)
// historique : set(update: T | ((c: T) => T), record: boolean | { coalesce: string } = true) — booléen = comportement actuel ; { coalesce: key } fusionne avec l étape précédente si même key et < 1000 ms (T036 implémente, T035 consomme)
// no-op : nudge/resize/place/settle rendent la MÊME référence si le résultat est structurellement identique ; history.set ignore un update qui rend la même référence (T036)
// layout-ops.core.ts : nudge(layout,id,dx,dy) · resize(layout,id,w,h,gridOf) · place(layout,widget,at,newId) → { layout, cellId } · boundsOf(grid) → {minW,minH,maxW,maxH}
// GRID_COLS 12 · ROW_HEIGHT 24 · GRID_GAP 16 · STACK_BELOW 640 · react-grid-layout ^2.2.4 (import … from "react-grid-layout/core")
// data-testid existants à conserver : dash-grid dash-cell dash-edit dash-add-widget dash-catalogue-item dash-placement dash-cell-remove dash-save dash-cancel
// edit-cell.tsx actuel : ToolButton L16-17 ({ label, icon, onClick, danger, onDark }) ; racine L49-55 onPointerDown → onSelect ; outils L72-77 (si !selected) et L109-110 (barre) ; Grip L68 aria-hidden ; barre L81 -top-14 left-0 whitespace-nowrap ; NumberInput L87-105
// nouvelles props EditCell : stacked?: boolean ; (position x,w déjà disponibles via la cellule rendue — sinon ajouter cell: LayoutCell)
```

## Décisions actées
- drag par poignée seulement — T032 structurant #1
- kit UI — RULE.MD

## Hors périmètre
- `grid.tsx`, `dashboard-page.tsx`, `edit-header.tsx`, core ; confirmations ; raccourcis globaux

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser dans `## Écarts`.
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, npx eslint, node --test, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` ; KO typecheck HORS WL = à lister (un lot voisin livre un contrat en parallèle), pas à corriger
- lint : `npx eslint <fichiers WL>` seulement
- Si bloqué : statut `bloque`, une question précise dans `result.md`, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T034
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — Fn — fait (≤ 8 mots)
## Repro pour vérif
- Fn : geste → attendu
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL)
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
