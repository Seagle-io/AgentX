---
projet: dashboard-direct
titre: Dashboard : manipulation directe, sans mode édition
statut: clos
objectif: le tableau de bord se manipule directement, comme le showcase react-grid-layout — glisser, redimensionner, déposer, sans mode édition
cree: 2026-10-06
tags: [projet]
---

# Brief — Dashboard : manipulation directe, sans mode édition

## Objectif
Le praticien attrape un widget n'importe où et le déplace, le redimensionne par une poignée visible au survol, glisse un widget depuis un catalogue flottant : comme https://react-grid-layout.github.io/react-grid-layout/examples/00-showcase.html. Plus de bouton Modifier / Enregistrer.

## Definition of Done du projet
- [x] `editing`, EditHeader, EditCell, PlacementOverlay, Dialog confirmation, blocker : supprimés — T007 `rg` → 0 réel (1 faux positif `dash-save-status`)
- [ ] drag partout, poignée `se`, cases poussées — code OK (T003, T007 lecture) ; e2e/écran NV (stack 5183 absente)
- [ ] dépôt catalogue `dropConfig` (≠ `isDroppable`, legacy) ; clic = bas — code OK ; `dragTo` e2e NV (fixme si rouge)
- [ ] auto-save 800 ms, toast KO, ∅ bouton — code OK, D2/D5 corrigés T009, T011 harnais OK ; e2e NV ; risque NV : `onLayoutChange` en glisser > 800 ms
- [ ] undo/redo conservés — code OK ; e2e `annulation.spec.ts` NV
- [ ] retrait + toast Annuler (D3/D6 corrigés T011) ; roue ; onglets — D3+ doublon widget restauré → T012 en cours ; D4+ coalesce 1000 ms ouvert
- [ ] e2e réécrites (4 fichiers, 6 tests, tsc e2e OK) ; tsc/build/test:unit OK (T011 : 0 / ✓ 1.56s / 406 pass) ; `npm run lint` global KO préexistant (760 err), dashboard 0 err ; e2e NV
- [ ] validation à l'écran par l'humain — ∅ fait

## Contraintes dures
- Dépôt `~/Documents/Workspace/OrthoPro/ortho-front`, branche courante `master` (178 fichiers non committés : ne jamais toucher hors WL, ∅ commande git destructive)
- Contrat API inchangé : `GET/PUT /dashboard/layout`, `PATCH /dashboard/cells/:id/config` — back hors périmètre
- Kit UI : `src/shared/ui` (Button, Text, Icon, Dialog…) ; pas de nouvelle dépendance ; RGL ^2.2.4 conservé
- Interdits : migration, push, `make deploy` ; node 24 pour `test:unit` (`~/.nvm/versions/node/v24.15.0/bin`)
- Pile mobile (< 640 px) conservée : lecture seule, ordre de lecture

## Hors périmètre
- Widgets eux-mêmes (`components/widget/*`), back, onboarding au-delà du retrait de `onCustomize`
- Nouveaux widgets, nouveaux réglages

## Hypothèses retenues
- Auto-save dernière écriture gagne — conservée ; à invalider si conflit multi-onglets observé
- Réglages widget : roue au survol + `FlyingModal` — confirmée (decisions.md#2026-10-06)

## Hypothèses invalidées
- debounce 600 ms → 800 ms (decisions.md#2026-10-06)
- `isDroppable` RGL → inexistant en v2 : `dropConfig.enabled` ([[rgl-v2-api-reelle]])
- `sameLayout` compare config → par référence : `sameTabs` compare par contenu (T004)
- `edit-header.tsx` source palette couleur onglet → ∅ palette ; `dash-tab-color` = conteneur ColorPicker (T005)
- `getByRole('button',{name:'Annuler'})` unique → sous-chaîne, 2 éléments ([[playwright-getbyrole-sous-chaine]])
- toast Annuler = `undo` global → défait un autre geste (D3, corrigé T009)

## Questions ouvertes
- humain : validation à l'écran (DoD 8)
- e2e : `make test-e2e` + `npx playwright install chromium` (1243) puis `npx playwright test e2e/dashboard` — humain
- D3+ : unicité widget/onglet côté serveur ? NV (T012)

## Questions refermées
- mode édition à retirer ? oui (cadrage 2026-10-06)
- PATCH config conservé ? non, via PUT (decisions.md#2026-10-06)

## Carte du terrain
Voir [[ortho-front-dashboard-carte]] (testids, classes, props), [[autosave-debounce-historique]], [[ortho-front-outillage]]. R = `ortho-front/src/modules/dashboard`.
| Quoi | Où | Note |
|---|---|---|
| Page | `R/dashboard-page.tsx` | 627→486 l. ; history, autosave, commit :157-186 |
| Grille | `R/components/grid.tsx` | 230→139 l. ; RGL v2 dragConfig/dropConfig |
| Chrome case | `R/components/cell-chrome.tsx` | créé T005 |
| Autosave | `R/components/use-layout-autosave.ts`, `autosave.core.ts(+test)` | créés T004 |
| Catalogue | `R/components/edit/widget-panels.tsx` | `CataloguePanel` ; CellSettings conservé |
| Onglets | `R/components/tab-bar.tsx` | réécrit 243 l. |
| Supprimés | `edit/edit-cell.tsx`, `edit/edit-header.tsx`, PlacementOverlay | T003/T005 |
| À vérifier | `components/use-edge-scroll.ts` | probable orphelin (T003) |
| Historique | `R/components/edit/edit-history.core.ts`, `use-edit-history.ts` | coalesce 1000 ms |
| Constantes | `R/grid.constants.ts:10` | `DASH_WIDGET_MIME` |
| CSS | `ortho-front/src/index.css:1452-1539` | `.dash-grid-interactive` ; :1446-1449 commentaire périmé |
| e2e | `ortho-front/e2e/dashboard/*.spec.ts` | 4 specs (annulation créée), 6 tests, NV exécution |
| Onboarding | `widget/onboarding-widget.tsx:26,66` | `onCustomize` → `setCatalogueOpen(true)` |
