---
tache: T035
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:3` — F4 — import `useBlocker`
- `dashboard-page.tsx:47-58` — F1 F5 — `INTERACTIVE`/`inInteractive`, `Confirmation`, `scrollToCell` (rAF + `[data-cell-id]`)
- `dashboard-page.tsx:186` — F6 — `stacked = width < STACK_BELOW` (largeur conteneur déjà mesurée L86)
- `dashboard-page.tsx:201-219` — F3 F4 — `cancelEditing` (confirm si changes>0), `useBlocker` (pathname ≠ seulement, `?onglet=` libre), `beforeunload` si `dirty`
- `dashboard-page.tsx:230` — F7 — `setLayout` record `boolean | { coalesce }`
- `dashboard-page.tsx:247-281` — F3 — `removeTab` confirm si layout>0 ; `resetAll` confirm « Revenir à la disposition livrée »
- `dashboard-page.tsx:283-290` — F2 F5 — `removeCell` + toast « Widget retiré » ; `focusCell`
- `dashboard-page.tsx:296-310` — F5 — pile : id ajouté détecté par diff → `focusCell`
- `dashboard-page.tsx:312-347` — F1 F7 — Ctrl/Cmd+Z/Shift+Z/Y/S ; Échap en cascade pose→sélection→Annuler, muet si Dialog/réglages/confirm ouverts ; flèches/Suppr muets si catalogue/réglages/confirm/`inInteractive` ; nudge `coalesce:'nudge:'+id`
- `dashboard-page.tsx:377` — F7 — config `coalesce:'config:'+cellId`
- `dashboard-page.tsx:409` — F6 — `stacked` → EditCell
- `dashboard-page.tsx:464-468` — F5 F6 — `onDrop` → `focusCell` ; `onCancelPlacement`
- `dashboard-page.tsx:488,502,513` — F7 F3 F5 — rename coalesce ; `onCancel={cancelEditing}` ; « Sur la page » → `focusCell`
- `dashboard-page.tsx:585-608` — F3 F4 — Dialog unique confirm/blocker, `data-testid='dash-confirm'`, Button `warning`
- `ortho-front/src/modules/dashboard/components/edit/edit-header.tsx:142` — F8 — hint visible toute largeur (`basis-full xl:basis-0`)
- `edit-header.tsx:150` — F3 — libellé « Revenir à la disposition livrée »
- `edit-header.tsx:158` — F8 — Enregistrer `disabled={saving || changes === 0}`

## Repro pour vérif
- F1 : édition, Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y/Ctrl+S → undo/redo/save, pas d'action navigateur ; focus dans rôle tablist + flèche → onglets inchangés, case non déplacée ; Échap avec widget en main → pose annulée ; Échap sélection → désélection ; Échap sinon → Dialog « Abandonner N… » si changes>0, sortie sinon
- F2 : sélectionner case, Suppr → case retirée + toast « Widget retiré · Ctrl + Z pour le remettre »
- F3 : 2 gestes puis Annuler → « Abandonner 2 modifications ? » ; « Revenir à la disposition livrée » → confirm ; « Supprimer l'onglet » avec widgets → confirm, vide → direct
- F4 : changes>0, cliquer lien sidebar → Dialog « Quitter sans enregistrer… », Quitter → navigue + édition fermée ; Annuler → reste ; F5 navigateur → prompt natif ; changer d'onglet `?onglet=` → pas de Dialog
- F5 : catalogue → widget en pile (<640px) → case ajoutée sélectionnée + centrée ; « Sur la page » → scroll centre ; pose au clic → idem
- F6 : widget en main + Échap ou bouton grille → `dropping=null` ; <640px EditCell reçoit `stacked`
- F7 : taper 5 lettres dans le nom d'onglet → 1 seul undo ; 5 flèches rapides → 1 undo ; réglage curseur → 1 undo
- F8 : entrer en édition sans geste → Enregistrer grisé ; largeur < xl → indice visible

## Vérifié comment
```
npm run typecheck →
src/modules/dashboard/components/grid.tsx(204,5): error TS2322: Type '(next: LayoutItem[]) => void' is not assignable to type '(layout: Layout) => void'.
  (1 erreur, hors WL — T033 ; 0 erreur WL)
npx eslint dashboard-page.tsx edit-header.tsx → (vide, 0)
npm run test:unit → ℹ tests 395 · pass 395 · fail 0
```

## Écarts
- lecture hors WL: `src/app/router.tsx` + `src/app/App.tsx` (grep) — vérifier `createBrowserRouter` → OK, `useBlocker` opérant
- lecture hors WL: `dashboard-widgets.ts` + `layout-ops*.ts` (grep) — signature `addToLayout`/`place` pour l'id en pile
- lecture hors WL: `button/bouton.tsx` (grep) — variant `warning` existe
- F2 : `addToast` sans `action` (`toast.tsx:8-13` = variant/title/description) → description « Ctrl + Z pour le remettre », variant default (`'info'` ∅)
- F1 : Ctrl+S ignoré si `changes === 0` (cohérent F8)
- DoD typecheck 0 WL : OK ; 1 KO hors WL grid.tsx:204 (T033 en vol)

## Pour la suite
- `toast.tsx` : ajouter `action?: { label; onClick }` → toast « Annuler » natif (F2 DoD complète)
- `grid.tsx:204` readonly `Layout` vs `LayoutItem[]` → T033
- Dialog du kit : Échap ferme aussi via son propre listener ; onKey page se tait si `confirmation` → pas de double action, mais 2 listeners window
- `useBlocker` ne bloque pas un changement de `search` même pathname : voulu (`?onglet=`)
- E2E à écrire : `dash-confirm`, Ctrl+S, blocker

## Retour sur le pack
- Manquait: variant Button pour le bouton de confirmation ; signature `addToLayout` (id du nouvel élément) ; routeur de l'app (`router.tsx`) pour confirmer data router
- Inutile: `routes.tsx` (RouteObject, ne dit rien du routeur)

## Reprise
- `dashboard-page.tsx:237-244` — 1 — `setLayout` : `Object.is(layout, tab.layout)` → retourne `d` ; sonde (copie setter + `nudge` mur, scratchpad, supprimée) → `past.length 0` puis `1` après nudge réel · `node --test → ℹ pass 1 · fail 0`
- `dashboard-page.tsx:339-340` — 2 — guard unique avant Échap : `confirmation || blocker.state === 'blocked' || catalogueOpen || settingsFor || inInteractive(target)` → return
- `dashboard-page.tsx:199-205,298` — 3 — `setSettingsFor(null)` dans stopEditing/startEditing/undo/redo (header + Ctrl+Z)/removeCell ; `settingsCellGone` + useEffect → null si case absente du layout courant
- `npm run typecheck` → 0 `error TS` (grid.tsx:204 corrigé entre-temps) · `npx eslint dashboard-page.tsx` → ∅ (0) · `npm run test:unit` → tests 395 · pass 395 · fail 0
