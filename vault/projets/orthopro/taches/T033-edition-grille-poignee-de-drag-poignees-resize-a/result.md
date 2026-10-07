---
tache: T033
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/grid.tsx:198` — F1 — `dragConfig={{ enabled, handle: '.dash-grip' }}` (rgl v2 : `handle` ≡ draggableHandle) ; `cancel` retiré
- `grid.tsx:35` — F4 — prop `onCancelPlacement?: () => void` déclarée, transmise L223
- `grid.tsx:40-57` — F3 — `previewPlacement(layout, candidate, at)` → `{ spot, pushed }` via `place(..., () => '__preview')`
- `grid.tsx:61-120` — F3 F4 — PlacementOverlay : `spot` (résultat) en prop, `onAim` remonte la visée ; bandeau sticky top « Cliquez pour poser · Échap pour annuler » + Button outline sm si `onCancel` ; clic/move sur bandeau stoppés
- `grid.tsx:124-125` — F6 — `sameCells(a, b)` égalité structurelle (i x y w h, ordre)
- `grid.tsx:146-177` — F5 F6 — `gesturing` state → `useEdgeScroll` ; `preview`/`items` sous useMemo ; `handleLayoutChange` useCallback, no-op si `sameCells`
- `grid.tsx:200-204` — F5 — onDragStart/Stop, onResizeStart/Stop câblés
- `grid.tsx:209` — F3 — classe `dash-pushed` sur cases déplacées par l'aperçu
- `ortho-front/src/modules/dashboard/components/use-edge-scroll.ts:1-34` — F5 — hook rAF, pointermove window, scrollBy ∝ proximité, cleanup
- `ortho-front/src/index.css:1486-1506` — F2 F3 — poignées `:hover`, `::before` 24×24 transparent, `.dash-pushed` opacity .45
- pile <640 inchangée · `cellTestAttrs` inchangé · `dash-placement` conservé · hooks remontés avant le `return` pile

## Repro pour vérif
- F1 : édition, pointerdown sur le corps d'une carte + glisser → immobile ; sur `.dash-grip` → déplace (requiert T034 : classe absente aujourd'hui, `grep -c dash-grip edit-cell.tsx → 0`)
- F2 : survoler une carte non sélectionnée → 6 poignées visibles ; saisir à 10 px à côté d'une poignée d'angle → resize démarre
- F3 : widget en main, viser une case occupée → pointillé affiché à la place compactée réelle, cartes poussées à 45 % ; cliquer → disposition = aperçu
- F4 : widget en main → bandeau en haut de la grille, suit le scroll ; clic « Annuler » → `onCancelPlacement` appelé, rien posé (bouton absent si prop non fournie)
- F5 : glisser une carte, pointeur à < 48 px du bas du viewport → page défile, plus vite au bord ; relâcher → arrêt
- F6 : glisser 1 px puis relâcher → `onLayoutChange` non appelé (point d'arrêt / compteur dans le parent) ; React DevTools : `layout.map(withBounds)` 1 fois par changement de `layout`

## Vérifié comment
- `npm run typecheck` → exit 0, 0 erreur
- `npx eslint grid.tsx use-edge-scroll.ts` → exit 0, 0 problème
- `npm run test:unit` → `ℹ tests 395 · pass 395 · fail 0`
- comportement souris : NV (pas de navigateur dans le budget)

## Écarts
- lecture hors WL : `node_modules/react-grid-layout/dist/types-jd8MiKM1.d.ts:355-372,167` — `DragConfig`/`EventCallback` absents d'`index.d.ts` (re-export)
- DoD F1 : `draggableHandle` n'existe pas en rgl v2 → `dragConfig.handle` (même sémantique)
- DoD F6 : `instanceOf` ∅ dans grid.tsx ; `withBounds` reste pur module-level (déjà stable), seul `layout.map(withBounds)` mémoïsé
- test:unit ne couvre pas grid.tsx (composant) ; `git status` : 9 fichiers hors WL modifiés par lots voisins, non touchés

## Pour la suite
- T034 doit poser `.dash-grip` sur le Grip (edit-cell.tsx:68) sinon 0 drag souris ; `cursor-grab` sur la carte entière (edit-cell.tsx:58) devient trompeur → `cursor-default` + grab sur la prise
- T035 : fournir `onCancelPlacement` + Échap ; `onPlace` reset `aim` → pas de pointillé fantôme après pose
- `.dash-no-drag` (edit-cell.tsx:72) désormais inutile côté grille (handle exclusif) — à retirer en T034 si plus rien ne le lit

## Retour sur le pack
- Manquait : vrai fichier de types rgl v2 (`types-*.d.ts`) ; précision `handle` vs `draggableHandle` ; dépendance explicite à T034 pour tester F1
- Inutile : `instanceOf` (inexistant) ; WL `grid.constants.ts` (déjà importé, pas relu)
