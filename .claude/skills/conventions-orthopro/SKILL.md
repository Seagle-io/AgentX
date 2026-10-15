---
name: conventions-orthopro
description: Conventions, outillage et interdits OrthoPro (ortho-back NestJS, ortho-front Vite, dashboard grille RGL, e2e Playwright). À charger pour toute tâche OrthoPro ortho-back/ortho-front.
---
# Conventions OrthoPro

## Dépôts
- Dépôts : ~/Documents/Workspace/OrthoPro/ortho-back (NestJS) · ~/Documents/Workspace/OrthoPro/ortho-front (Vite) ; branche de travail `Ultime` (checkout constaté 2026-10-15 : `master` sur les 2 dépôts → vérifier `git branch --show-current` avant d'écrire) ; pas de prod.
- ortho-front : 178 fichiers non committés → ∅ git destructif, ∅ toucher hors WL [[ortho-front-outillage]]

## Outillage front
- `test:unit` exige node 24 : PATH `~/.nvm/versions/node/v24.15.0/bin` → `ℹ tests 406 · pass 406` [[ortho-front-outillage]]
- typage : `npx tsc -b` ; e2e : `npx tsc -p tsconfig.e2e.json` [[ortho-front-outillage]]
- `npm run lint` rouge repo-wide (760 erreurs préexistantes) → ciblé : `npx eslint src/modules/dashboard e2e/dashboard` [[ortho-front-outillage]]
- `npm run build` → `✓ built`, réécrit `dist/` ; avertissement chunk > 500 kB normal [[ortho-front-outillage]]
- Playwright attend chromium_headless_shell-1243 ; 1234 installé → `npx playwright install chromium` [[ortho-front-outillage]]
- stack e2e `127.0.0.1:5183` (`make test-e2e`) interdite aux agents ; `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` → `000` = e2e NV [[ortho-front-outillage]]

## Dashboard/grille
- R = `ortho-front/src/modules/dashboard` ; ∅ mode édition (editing, EditHeader, PlacementOverlay, useBlocker, `.dash-grip` supprimés) [[ortho-front-dashboard-carte]]
- glisser = toute la carte ; poignées `e/s/se` ; zone interactive non native → `.dash-nodrag` [[ortho-front-dashboard-carte]]
- catalogue = `FlyingModal` non modal (≠ `Dialog`) ; DnD mime `application/x-dash-widget` ; onglets `application/x-dash-tab` [[ortho-front-dashboard-carte]]
- pile mobile `< STACK_BELOW=640` : sans RGL, lecture seule [[ortho-front-dashboard-carte]]
- clavier : Ctrl/Cmd+Z undo · +Maj+Z|Y redo · +S flush ; case : flèches=déplacer, Maj+flèches=redim., Suppr, Entrée=réglages, Échap=blur [[ortho-front-dashboard-carte]]
- RGL ^2.2.4 : `dragConfig{enabled,bounded,handle,cancel,threshold}` · `resizeConfig{enabled,handles}` · `dropConfig{enabled,defaultItem,onDragOver}` · `droppingItem` [[rgl-v2-api-reelle]]
- `isDroppable`/`isDraggable`/`draggableHandle` = legacy v1 → ne fait rien en v2 [[rgl-v2-api-reelle]]
- `onDrop` : `layout` contient l'item fantôme → utiliser `item` ; `onLayoutChange` émet aussi `droppingItem.i` → filtrer [[rgl-v2-api-reelle]]
- drag plein-carte : `cancel` = sélecteur CSS des zones interactives, ∅ `handle` ; `onDragOver` → `false` refuse (filtrer MIME) [[rgl-v2-api-reelle]]
- auto-save : historique local = état affiché ; 1 canal PUT entier débouncé 800 ms, 1 en vol max [[autosave-debounce-historique]]
- écho serveur ignoré : resync `history.reset` seulement si ≠ écho ET statut `idle` [[autosave-debounce-historique]]
- `sameTabs` compare `config` par contenu (`JSON.stringify(config ?? {})`) [[autosave-debounce-historique]]
- `lastSent` init à `value` quand `enabled` passe true (et après `reset`) [[autosave-debounce-historique]]
- coalesce 1000 ms : `'move-tab:'+id`, `'nudge:'+id`, `'config:'+id` [[autosave-debounce-historique]]
- toast « Annuler » ≠ `undo` global → restore = `commit` fonctionnel [[autosave-debounce-historique]]
- interdit : `setQueryData`/PATCH de la disposition hors hook ; `history.reset` hors effet resync [[autosave-debounce-historique]]
- NV : onLayoutChange en glisser > 800 ms avec `record=false` ; restore après re-ajout widget → doublon [[autosave-debounce-historique]]

## Tests e2e
- specs : `npx playwright test e2e/dashboard` (4 fichiers, 6 tests) [[ortho-front-outillage]]
- testids : `dash-grid` `dash-cell`[data-widget|cell-id|x|y|w|h] `dash-cell-remove` `dash-cell-settings` `dash-catalogue` `dash-catalogue-item` `dash-add-widget` `dash-undo` `dash-redo` `dash-save-status`[data-status=idle|pending|saving|error] `dash-tab`[data-tab-id] `dash-tab-add` `dash-tab-menu` `dash-tab-rename-input` `dash-tab-color` `dash-tab-remove` `dash-more` `dash-reset` `dash-confirm` [[ortho-front-dashboard-carte]]
- `dash-tab-color` = conteneur ColorPicker ; Réessayer dans `dash-save-status` [[ortho-front-dashboard-carte]]
- regex : `dash-save\b` matche `dash-save-status` → `dash-save['"\]]` [[ortho-front-dashboard-carte]]
- `getByRole(...,{name:'X'})` = sous-chaîne → `exact: true` ou scoper [[playwright-getbyrole-sous-chaine]]
- `exact` casse avec 2 toasts « Annuler » ; toast ∅ `role=status`/`aria-live` [[playwright-getbyrole-sous-chaine]]

## Interdits
- Jamais de migration ni de `git push` sans accord explicite de l'humain (RULE.MD) : tâche en `bloque` + commande exacte.
- Front : réutiliser le kit UI du showcase, ne pas créer de composant parallèle.
- migration, push, `make deploy` [[ortho-front-outillage]]
- stack e2e 5183 [[ortho-front-outillage]]
