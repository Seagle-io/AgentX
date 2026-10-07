---
titre: ortho-front dashboard — carte, testids, classes (manipulation directe)
resume: fichiers, contrats, testids, classes CSS du dashboard sans mode édition
source: dashboard-direct T003-T006
cree: 2026-10-06
tags: [note, ortho-front, dashboard]
---

# ortho-front dashboard — carte

## Fait
R = `ortho-front/src/modules/dashboard` · C = R/components
- ∅ mode édition : `editing`, EditHeader, EditCell, PlacementOverlay, `useBlocker`, `.dash-grip` supprimés
- glisser = toute la carte ; poignées `e/s/se` ; cancel = `DRAG_CANCEL` ; widget à zone interactive non native → classe `.dash-nodrag`
- catalogue = `FlyingModal` non modal (≠ `Dialog` : overlay bloque le dépôt) ; DnD HTML5 mime `application/x-dash-widget`
- onglets : mime `application/x-dash-tab` ; undo/redo/statut dans la barre
- pile mobile `< STACK_BELOW=640` : sans RGL, lecture seule
- clavier global : Ctrl/Cmd+Z undo · +Maj+Z|Y redo · +S flush ; case focalisée : flèches=déplacer, Maj+flèches=redim., Suppr=retirer, Entrée=réglages, Échap=blur
- testids : `dash-grid` `dash-cell`[data-widget|cell-id|x|y|w|h] `dash-cell-remove` `dash-cell-settings` `dash-catalogue` `dash-catalogue-item`[data-widget] `dash-add-widget` `dash-undo` `dash-redo` `dash-save-status`[data-status=idle|pending|saving|error] `dash-tab`[data-tab-id] `dash-tab-add` `dash-tab-menu` `dash-tab-rename-input` `dash-tab-color` `dash-tab-remove` `dash-more` `dash-reset` `dash-confirm`
- classes : `.dash-grid` `.dash-grid-interactive` `.dash-grid-dropping`(`--drop-label`) `.dash-cell-chrome` `.dash-nodrag`
- `dash-tab-color` = conteneur du ColorPicker, ∅ palette de pastilles
- bouton Réessayer = dans `dash-save-status` (+ action du toast d'erreur)
- piège regex : `dash-save\b` matche `dash-save-status` → utiliser `dash-save['"\]]`

## Pourquoi ça compte
- évite de rouvrir 6 fichiers pour un sélecteur e2e ou une prop

## Où
- `R/dashboard-page.tsx` — états, commit, gestes (486 l.)
- `R/components/grid.tsx` — RGL ; `R/grid.constants.ts:10` `DASH_WIDGET_MIME`
- `C/cell-chrome.tsx` — outils au survol, clavier
- `C/tab-bar.tsx` — onglets en place, statut
- `C/edit/widget-panels.tsx` — `CataloguePanel`, `CellSettings`
- `C/edit/edit-history.core.ts` + `use-edit-history.ts` — historique, coalesce 1000 ms
- `ortho-front/src/index.css:1452-1539` — `.dash-grid-*` ; `ortho-front/e2e/dashboard/*.spec.ts` (4)

## Voir aussi
- [[autosave-debounce-historique]]
- [[rgl-v2-api-reelle]]
- [[playwright-getbyrole-sous-chaine]]
