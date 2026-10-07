---
pack: T036
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T036 — Édition : cœur (no-op, coalesce)

> Seule source de vérité de l'agent T036. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `layout-ops.core.ts` et `edit-history.core.ts`/`use-edit-history.ts` : plus aucune étape d'historique vide (geste sans effet) et fusion des étapes rapprochées de même clé (`coalesce`), le tout testé.

## Definition of Done
- [ ] F1 core : `sameLayout(a, b): boolean` (même longueur, mêmes `i,widget,x,y,w,h` dans l'ordre, `config` par référence) exporté ; `settle`, `nudge`, `resize`, `place` rendent la référence d'entrée (`layout`) si le résultat est `sameLayout` ; tests : flèche contre un mur → `Object.is(out, layout)` ; ↓ sur dernière carte → idem ; resize à l'identique → idem ; vrai déplacement → référence différente (≥ 6 cas)
- [ ] F2 history : `set(update, record: boolean | { coalesce: string } = true)` ; si l'update rend `Object.is(next, current)` → aucune étape, aucun changement d'état ; `{ coalesce: key }` : si l'étape précédente a la même key et date de < 1000 ms → remplace la valeur courante sans empiler ; sinon empile ; `undo` après coalescence revient à l'état d'AVANT la première frappe ; horodatage injectable (`now: () => number` en option du reducer) pour les tests ; tests ≥ 8 cas (no-op, coalesce même key, key différente, > 1000 ms, undo après coalesce, redo vidé, record=false, booléen rétro-compatible)
- [ ] `use-edit-history.ts` : surface étendue au même contrat, `changes` inchangé pour l'instant
- [ ] rétro-compatibilité : tous les appels existants (`set(x)`, `set(x, false)`) compilent sans changement
- [ ] 0 import .tsx/react/dashboard-widgets dans les 2 core ; imports relatifs `.ts`
- [ ] `node --test` 2 fichiers → fail 0 ; `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 erreur WL (T035 peut appeler `coalesce` avant ta livraison : si KO hors WL, lister) ; `npx eslint` → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie » (« Repro pour vérif » = cas de test clés)

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | E | sameLayout, no-op |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.test.ts` | E | +6 cas |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.ts` | L | wrapper |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | E | coalesce, no-op |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.test.ts` | E | +8 cas |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | E | surface |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | LayoutCell |

## Contrats
```ts
// contrats vague 4 (decisions.md#mode-edition)
// poignée de drag : élément portant la classe .dash-grip (T034 la pose sur le Grip, edit-cell.tsx:68) ; grid.tsx passe draggableHandle=".dash-grip" (T033)
// historique : set(update: T | ((c: T) => T), record: boolean | { coalesce: string } = true) — booléen = comportement actuel ; { coalesce: key } fusionne avec l étape précédente si même key et < 1000 ms (T036 implémente, T035 consomme)
// no-op : nudge/resize/place/settle rendent la MÊME référence si le résultat est structurellement identique ; history.set ignore un update qui rend la même référence (T036)
// layout-ops.core.ts : nudge(layout,id,dx,dy) · resize(layout,id,w,h,gridOf) · place(layout,widget,at,newId) → { layout, cellId } · boundsOf(grid) → {minW,minH,maxW,maxH}
// GRID_COLS 12 · ROW_HEIGHT 24 · GRID_GAP 16 · STACK_BELOW 640 · react-grid-layout ^2.2.4 (import … from "react-grid-layout/core")
// data-testid existants à conserver : dash-grid dash-cell dash-edit dash-add-widget dash-catalogue-item dash-placement dash-cell-remove dash-save dash-cancel
// edit-history.core.ts actuel : historyReducer + initialHistory ; use-edit-history.ts : { value, set(update, record = true), reset(value), undo, redo, canUndo, canRedo, changes } ; cap 100 étapes ; changes = past.length
// layout-ops.core.ts actuel : settle = verticalCompactor.compact (recrée les objets → Object.is faux)
// CIBLE
export const sameLayout: (a: readonly LayoutCell[], b: readonly LayoutCell[]) => boolean
export type RecordOpt = boolean | { coalesce: string }
set: (update: T | ((current: T) => T), record?: RecordOpt) => void
```

## Décisions actées
- fenêtre de fusion 1000 ms — choix chef, ajustable par constante exportée `COALESCE_WINDOW_MS`
- `changes` reste `past.length` cette vague — compteur réel = plus tard

## Hors périmètre
- `dashboard-page.tsx`, `grid.tsx`, `edit-cell.tsx`, `edit-header.tsx` ; changer le compactor

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
tache: T036
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
