---
pack: T033
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T033 — Édition : grille

> Seule source de vérité de l'agent T033. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre la manipulation à la souris fiable dans `grid.tsx` : drag uniquement par la poignée, poignées de redimensionnement visibles et saisissables, aperçu de dépôt égal au résultat, overlay de pose annulable à la souris, défilement automatique près des bords, et zéro recalcul inutile par rendu.

## Definition of Done
- [ ] F1 drag : `draggableHandle='.dash-grip'` sur ReactGridLayout (L~127) ; un pointerdown ailleurs sur la carte ne déplace jamais (`cancel`/`draggableCancel` inutile si handle) — citer
- [ ] F2 resize : `index.css:1481-1504` → poignées visibles au survol de la carte (`.react-grid-item:hover .react-resizable-handle`) en plus de `.dash-selected` ; zone de saisie ≥ 24×24 px via `::before` transparent, visuel inchangé
- [ ] F3 aperçu de dépôt (L57-79 PlacementOverlay) : la case pointillée affiche le résultat de `place(layout, widget, at, () => '__preview')` (position après compaction), pas le (x,y) visé ; les cartes qui seraient poussées reçoivent une classe `.dash-pushed` (fond atténué) — `index.css` ajoute la classe
- [ ] F4 overlay de pose (L62-68) : bandeau fixe en haut de la grille « Cliquez pour poser · Échap pour annuler » visible à toute largeur + bouton « Annuler » (kit `Button` variant outline sm) qui appelle `onCancelPlacement` (nouvelle prop, câblée par le parent : DÉCLARER la prop, le parent la fournit en T035 — si absente, le bouton n'est pas rendu)
- [ ] F5 autoscroll : `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-edge-scroll.ts` créé : `useEdgeScroll(active: boolean, opts?: { edge?: number; speed?: number })` — rAF, `window.scrollBy` quand le pointeur est à < edge px (défaut 48) du haut/bas du viewport, vitesse ∝ proximité (max speed, défaut 16 px/frame), écoute `pointermove`, nettoyage complet ; branché sur `onDragStart/onDragStop` et `onResizeStart/onResizeStop` (L129-130)
- [ ] F6 perf : `withBounds`, `instanceOf`, `layout.map(withBounds)` (L84-95, L128) sous `useMemo`/`useCallback` avec deps ; `onLayoutChange` (L131-146) : si `toCells(next)` est structurellement égal à `layout` (même ids, x, y, w, h dans le même ordre) → ne pas appeler `onChange` (plus d'étape vide sur micro-drag)
- [ ] 0 régression : pile <640 inchangée ; `data-testid`/`data-*` de `cellTestAttrs` conservés ; `dash-placement` conservé
- [ ] `npm run typecheck` → 0 erreur WL ; `npx eslint` fichiers WL → 0 ; `npm run test:unit` → fail 0 ; sorties collées
- [ ] `result.md` : « Repro pour vérif » 1 ligne par F
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | E | F1 F3 F4 F5 F6 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-edge-scroll.ts` | E | créer F5 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | E | L1481-1504 poignées, .dash-pushed (section .react-grid-* uniquement) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | place, boundsOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | Grip L68 (T034 y pose .dash-grip en parallèle) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/button/bouton.tsx` | L | Button |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/node_modules/react-grid-layout/dist/index.d.ts` | L | props rgl v2 (draggableHandle, compactor, onDragStart…) — 1 fichier, grep ciblé |

## Contrats
```ts
// contrats vague 4 (decisions.md#mode-edition)
// poignée de drag : élément portant la classe .dash-grip (T034 la pose sur le Grip, edit-cell.tsx:68) ; grid.tsx passe draggableHandle=".dash-grip" (T033)
// historique : set(update: T | ((c: T) => T), record: boolean | { coalesce: string } = true) — booléen = comportement actuel ; { coalesce: key } fusionne avec l étape précédente si même key et < 1000 ms (T036 implémente, T035 consomme)
// no-op : nudge/resize/place/settle rendent la MÊME référence si le résultat est structurellement identique ; history.set ignore un update qui rend la même référence (T036)
// layout-ops.core.ts : nudge(layout,id,dx,dy) · resize(layout,id,w,h,gridOf) · place(layout,widget,at,newId) → { layout, cellId } · boundsOf(grid) → {minW,minH,maxW,maxH}
// GRID_COLS 12 · ROW_HEIGHT 24 · GRID_GAP 16 · STACK_BELOW 640 · react-grid-layout ^2.2.4 (import … from "react-grid-layout/core")
// data-testid existants à conserver : dash-grid dash-cell dash-edit dash-add-widget dash-catalogue-item dash-placement dash-cell-remove dash-save dash-cancel
// grid.tsx actuel : PlacementOverlay L40-81 (aperçu (x,y) visé, onClick inconditionnel L68, z-20) ; pile L107-121 ; ReactGridLayout L127-171 ; withBounds L84-95 ; onLayoutChange L131-146 ; handles L132
// nouvelle prop : onCancelPlacement?: () => void
export const useEdgeScroll = (active: boolean, opts?: { edge?: number; speed?: number }) => void
```

## Décisions actées
- rgl conservé ; compaction verticale conservée, l'aperçu s'y conforme — T032 structurant #2
- kit UI, 0 nouveau composant visuel (Button existant) — RULE.MD

## Hors périmètre
- `edit-cell.tsx`, `dashboard-page.tsx`, `edit-header.tsx`, core (lots T034-T036) ; mode pile éditable ; changement de compactor

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
tache: T033
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
