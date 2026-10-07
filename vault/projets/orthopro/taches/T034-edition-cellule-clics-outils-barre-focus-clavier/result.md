---
tache: T034
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx:7` — F5 — import `boundsOf`, `MAX_H_DEFAULT` retiré
- `edit-cell.tsx:17` — F1 — ToolButton `onPointerDown={e => e.stopPropagation()}`
- `edit-cell.tsx:37-38` — F6 — prop `stacked?: boolean` (défaut false)
- `edit-cell.tsx:51-59` — F4/F5 — `const b = boundsOf(widget.grid)` ; racine `tabIndex=0 role=button aria-pressed` ; Entrée/Espace → onSelect
- `edit-cell.tsx:66` — F2/F4 — racine sans `cursor-grab` ; `focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`
- `edit-cell.tsx:75-78` — F2 — Grip wrapper `.dash-grip aria-label='Déplacer' cursor-grab`, aria-hidden retiré
- `edit-cell.tsx:89-90` — F3 — barre `right-0` si `cell.x + cell.w > GRID_COLS / 2`, sinon `left-0`
- `edit-cell.tsx:94-106` — F6 — « Colonnes » rendu que si `!stacked` ; min/max = `b.minW/b.maxW`
- `edit-cell.tsx:110-111` — F5 — « Rangées » min/max = `b.minH/b.maxH`
- `data-testid='dash-cell-remove'` conservé L83, L121
## Repro pour vérif
- F1 : carte non sélectionnée, survol, 1 clic sur ✕ → widget retiré (root `onPointerDown` jamais atteint, outils non démontés)
- F2 : DOM carte → `span.dash-grip[aria-label=Déplacer]` ; drag ailleurs que la prise = sélection seule (une fois T033 `draggableHandle='.dash-grip'`)
- F3 : sélectionner une carte x+w > 6 → barre collée à droite (`right-0`) ; x+w ≤ 6 → `left-0`
- F4 : Tab jusqu'à la carte → anneau accent ; Entrée ou Espace → sélectionnée (`aria-pressed=true`)
- F5 : widget maxW absent → max Colonnes 12 ; maxH absent → max Rangées = MAX_H_DEFAULT (via boundsOf)
- F6 : `<EditCell stacked />` → pas de champ « Colonnes », « Rangées » présent
## Vérifié comment
```
npx eslint src/modules/dashboard/components/edit/edit-cell.tsx → (vide) eslint=0
npm run typecheck → tsc -p tsconfig.app.json && tsconfig.e2e.json && tsconfig.node.json → 0 erreur, tc=0
npm run test:unit → ℹ tests 395 · pass 395 · fail 0
```
## Écarts
- lecture hors WL: `src/modules/dashboard/dashboard-page.tsx` — rg « EditCell » seulement (grid.tsx ne rend pas EditCell, le pack disait l'inverse) ; non ouvert
- incident : `npx prettier --write` lancé par erreur sur le fichier WL → reformaté ; restauré via `git show HEAD:… >` puis edits réappliqués ; diff final = edits F1-F6 uniquement (git diff lisible)
- F1 : outils `!selected` toujours conditionnels (démontage évité par le stopPropagation pointerdown, pas par double rendu) — choix minimal
## Pour la suite
- T035 : câbler `stacked` dans `dashboard-page.tsx:327` (pas grid.tsx)
- T033 : `draggableHandle='.dash-grip'` requis sinon la carte entière reste glissable (handle sans cursor sur le reste)
- F3 : seuil `GRID_COLS / 2` ; en pile (1 col) la barre est toujours `left-0` — à vérifier visuellement à 640 px
- Grip `<span>` porte `aria-label` sans rôle : si a11y stricte, ajouter `role='img'` ou laisser T033 décider
## Retour sur le pack
- Manquait: EditCell est rendu par `dashboard-page.tsx:327`, pas `grid.tsx` (ligne WL grid.tsx inutile) ; `cell: LayoutCell` déjà prop (x,w dispo) — le « sinon ajouter cell » était superflu
- Inutile: `grid.tsx` en WL, `input/` (NumberInput est `@/shared/ui/number-input/number-input`)
## Reprise
- `edit-cell.tsx:58-59` — T037 défaut 2 — `onKeyDown` racine : `if (e.target !== e.currentTarget) return` avant traitement ; Entrée/Espace sur ToolButton → click natif conservé
- `edit-cell.tsx:82,91` — `.dash-no-drag` retirée (orpheline, 0 occurrence restante)
- `npx eslint edit-cell.tsx → (vide) eslint=0` · `npm run typecheck → tc=0` · `npm run test:unit → tests 395 pass 395 fail 0`
