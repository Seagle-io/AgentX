---
pack: T035
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T035 — Édition : page et barre

> Seule source de vérité de l'agent T035. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `dashboard-page.tsx` et `edit-header.tsx` : raccourcis clavier complets et inoffensifs, gardes de navigation, confirmations avant perte, scroll vers la carte concernée, câblage des nouvelles props (`onCancelPlacement`, `stacked`) et des clés `coalesce`.

## Definition of Done
- [ ] F1 clavier (L254-269 onKey) : Ctrl/Cmd+Z → undo, Ctrl/Cmd+Shift+Z et Ctrl/Cmd+Y → redo, Ctrl/Cmd+S → save (preventDefault) ; flèches/Suppr/Backspace IGNORÉES si `catalogueOpen`, `settingsFor`, ou `e.target` dans `[role=dialog], [role=tablist], [role=slider], [role=radiogroup], [role=menu], input, textarea, select, [contenteditable]` ; Échap : pose en cours → annule la pose ; sinon sélection → désélectionne ; sinon → Annuler (avec F3)
- [ ] F2 Suppr/Backspace (L259) : suppression + toast `{ variant: 'info'|'success', title: 'Widget retiré', action: { label: 'Annuler', onClick: history.undo } }` (adapter à l'API réelle de `addToast` ; si pas d'action possible : noter)
- [ ] F3 confirmations (Dialog du kit déjà importé dans la page ou `@/shared/ui/dialog/dialog`) : Annuler avec `changes > 0` → « Abandonner N modifications ? » ; « Rétablir par défaut » (edit-header L150, page L86-90) → confirm + renommé « Revenir à la disposition livrée » ; « Supprimer l'onglet » (edit-header L130, page L71-77) → confirm si `layout.length > 0`
- [ ] F4 garde : `useBlocker` (react-router) quand `editing && changes > 0` → même Dialog ; `beforeunload` → `e.preventDefault()` dans les mêmes conditions
- [ ] F5 scroll : `pickWidget` en pile (L101-106) → `setSelectedId(newId)` + `scrollIntoView({ block: 'center' })` sur `[data-cell-id="…"]` ; « Sur la page » (L487) idem ; après `place()` idem
- [ ] F6 câblage : `onCancelPlacement={() => setDropping(null)}` vers la grille (prop déclarée par T033) ; `stacked` vers EditCell quand la grille est en pile (T034) — si la grille ne remonte pas « pile », utiliser `useMediaQuery`/largeur conteneur déjà calculée : citer
- [ ] F7 coalesce : renommage d'onglet (L408) → `history.set(…, { coalesce: 'rename:' + tabId })` ; réglage d'un widget (L160) → `{ coalesce: 'config:' + cellId }` ; flèches clavier → `{ coalesce: 'nudge:' + cellId }` (contrat T036 ; si typecheck KO parce que T036 non livré : lister en Écarts, ne pas contourner)
- [ ] F8 edit-header : « Enregistrer » `disabled={saving || changes === 0}` ; indice `HINTS.dropping` (L142) visible à toute largeur (retirer `hidden xl:block`)
- [ ] `npm run typecheck` → 0 erreur WL (hors contrat T036 en vol) ; `npx eslint` → 0 ; `npm run test:unit` → fail 0 ; sorties collées
- [ ] `result.md` : « Repro pour vérif » 1 ligne par F
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | F1-F7 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | E | F3 F8 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | API (T036 l'étend en parallèle) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | props (T033 en parallèle) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | props (T034 en parallèle) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/dialog/dialog.tsx` | L | Dialog |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | addToast, action ? |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/routes.tsx` | L | data router ? (useBlocker exige createBrowserRouter) |

## Contrats
```ts
// contrats vague 4 (decisions.md#mode-edition)
// poignée de drag : élément portant la classe .dash-grip (T034 la pose sur le Grip, edit-cell.tsx:68) ; grid.tsx passe draggableHandle=".dash-grip" (T033)
// historique : set(update: T | ((c: T) => T), record: boolean | { coalesce: string } = true) — booléen = comportement actuel ; { coalesce: key } fusionne avec l étape précédente si même key et < 1000 ms (T036 implémente, T035 consomme)
// no-op : nudge/resize/place/settle rendent la MÊME référence si le résultat est structurellement identique ; history.set ignore un update qui rend la même référence (T036)
// layout-ops.core.ts : nudge(layout,id,dx,dy) · resize(layout,id,w,h,gridOf) · place(layout,widget,at,newId) → { layout, cellId } · boundsOf(grid) → {minW,minH,maxW,maxH}
// GRID_COLS 12 · ROW_HEIGHT 24 · GRID_GAP 16 · STACK_BELOW 640 · react-grid-layout ^2.2.4 (import … from "react-grid-layout/core")
// data-testid existants à conserver : dash-grid dash-cell dash-edit dash-add-widget dash-catalogue-item dash-placement dash-cell-remove dash-save dash-cancel
// page actuel : onKey L253-268 (isTyping L44-45 : INPUT/TEXTAREA/SELECT/contentEditable) ; removeCell L259 ; resetTabs L86-90 ; removeTab L71-77 ; pickWidget L101-106 ; settings set L160 ; rename L408 ; onCancel=stopEditing L422 ; catalogue Dialog L477-481 ; « Sur la page » L487 ; FlyingModal réglages L490-496
// edit-header : Annuler L157 · Enregistrer L158 · Rétablir (redo) L149 · Rétablir par défaut L150 · Supprimer l'onglet L130 · HINTS.dropping L142 hidden xl:block · compteur L152
// useBlocker : import { useBlocker } from 'react-router-dom' — ne fonctionne qu'avec un data router ; sinon F4 = beforeunload seul + noter
```

## Décisions actées
- enregistrer/annuler/undo : pas de plainte humaine, mais pertes de travail H (T032) → confirmations oui, pas de refonte du flux
- kit UI (Dialog, Button, toast) — RULE.MD

## Hors périmètre
- `grid.tsx`, `edit-cell.tsx`, core (autres lots) ; catalogue non modal ; réordonnancement d'onglets ; compteur « N modifications » réel

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
tache: T035
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
