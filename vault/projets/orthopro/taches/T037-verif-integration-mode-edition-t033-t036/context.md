---
pack: T037
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T037 — Vérif intégration mode édition

> Seule source de vérité de l'agent T037. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter l'assemblage des 4 lots du mode édition : contrats croisés tenus (`.dash-grip` ↔ `dragConfig.handle`, `onCancelPlacement`, `stacked`, `coalesce`), aucun chemin de perte de travail sans confirmation, raccourcis inoffensifs dans les dialogues, no-op/coalesce prouvés par sonde, aucune régression des `data-testid`.

## Definition of Done
- [ ] `npm run test:unit`, `npm run typecheck`, `npx eslint src/modules/dashboard` (0 erreur ; 16 warnings react-refresh dashboard-widgets.tsx connus) — sorties collées
- [ ] contrats croisés (citer lignes) : `dragConfig={{ handle: '.dash-grip' }}` grid.tsx ↔ `className='dash-grip …'` edit-cell.tsx ; `onCancelPlacement` déclarée grid ↔ fournie page ; `stacked` prop edit-cell ↔ passée page:409 (d'où vient la valeur ? pile réelle ou media query — cohérent avec `STACK_BELOW` de grid.tsx ?) ; `history.set(…, { coalesce })` page ↔ `RecordOpt` core
- [ ] sonde `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/t037.probe.test.ts` (créer, lancer, supprimer, `git status` collé) : `sameLayout` sur 6 paires ; `nudge` contre mur → même ref ; `historyReducer` avec horloge injectée : 3 `set` coalesce 'k' à t=0,300,600 → 1 étape, undo → état initial ; t=0 puis 1500 → 2 étapes ; `set` d'une même ref → 0 étape ; `set(x,false)` rétro-compatible
- [ ] clavier (dashboard-page.tsx onKey) : tableau `touche × contexte (grille | catalogue Dialog | réglages FlyingModal | input onglet | tablist) → action` ; toute flèche/Suppr active dans un contexte non-grille = DÉFAUT ; Ctrl+Z/Y/S et Échap : citer ; `preventDefault` jamais appelé quand la touche est ignorée
- [ ] pertes de travail : énumérer les 5 sorties d'édition (Annuler, Rétablir livré, Supprimer onglet, navigation route, fermeture onglet navigateur) → chacune : garde ou DÉFAUT (citer) ; `useBlocker` : le data router existe (`rg createBrowserRouter src`) ; Dialog `dash-confirm` : les 3 usages passent par le même Dialog
- [ ] grille : `previewPlacement` utilise `place` sur le layout courant ; `handleLayoutChange` ignore un layout égal (`sameCells`) ; `useEdgeScroll` : nettoyage rAF + listener sur `active=false` et démontage (citer) ; `gesturing` repasse à faux sur `onDragStop` ET `onResizeStop`
- [ ] edit-cell : `ToolButton onPointerDown stopPropagation` ; racine `tabIndex=0 role=button` ; Entrée/Espace ; barre `right-0` si `x+w > 6` ; bornes = `boundsOf` (0 littéral 12/60 restant : `rg -n "12|60|MAX_H_DEFAULT" edit-cell.tsx` collé)
- [ ] `rg -n "data-testid='dash-" src/modules/dashboard` → les 9 d'origine + `dash-confirm` ; `.dash-no-drag` encore référencé ? (`rg dash-no-drag src`) — si orphelin : noter, pas défaut
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | T033 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/use-edge-scroll.ts` | L | T033 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | L | L1480-1510 seulement |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | T034 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | T035 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | L | T035 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | T036 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | L | T036 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | T036 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/t037.probe.test.ts` | E | sonde, supprimer |

## Contrats
```ts
// contrats vague 4 (decisions.md) : .dash-grip ; set(update, record: boolean | { coalesce: string } = true), fenêtre COALESCE_WINDOW_MS=1000 glissante ; no-op = même référence ignorée ; aperçu = place() ; useEdgeScroll(active, opts?)
export const sameLayout: (a: readonly LayoutCell[], b: readonly LayoutCell[]) => boolean
historyReducer(h, action, { now = Date.now })  // horloge injectable
// déclaré : grid.tsx:35 prop onCancelPlacement ; :40-57 previewPlacement ; :61-120 overlay+bandeau ; :124-125,146-177 sameCells/useMemo/useCallback ; :198 dragConfig ; :200-204 gesturing
// edit-cell.tsx:17 stopPropagation ; :37-38 stacked ; :51-59 boundsOf+tabIndex ; :75-78 .dash-grip ; :89-90 right-0 ; :94-111 NumberInput
// page : onKey raccourcis, Dialog dash-confirm, useBlocker+beforeunload, focusCell, stacked:409, onCancelPlacement:468 ; edit-header:142,150,158
// souris : NV accepté (pas de navigateur) — la recette humaine suit
/// <reference types="node" /> · node:test · node:assert/strict · imports relatifs .ts
```

## Décisions actées
- rgl conservé, compaction verticale conservée ; toast sans bouton Annuler (API toast sans action) — connu
- lint global rouge hors dashboard — HP

## Hors périmètre
- corriger ; widgets ; rendu navigateur

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git diff, git status, rm sonde), Write (sonde + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T037
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute (sonde : n cas, n OK)
## Clavier
| touche | grille | catalogue | réglages | input onglet | tablist |
## Sorties d'édition
- sortie — garde (fichier:L) | DÉFAUT
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes (dont : ce que l'humain doit tester à la souris, 5 gestes max)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
