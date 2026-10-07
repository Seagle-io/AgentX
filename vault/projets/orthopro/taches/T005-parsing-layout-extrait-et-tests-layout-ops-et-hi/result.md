---
tache: T005
statut: fait
---
## Livré
racine : `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/`
- `dashboard-layout.util.ts:1-180` — créé ; types `LayoutCell`, `DashboardTab`, `GridLookup`, `LayoutCatalog` ; `clamp`, `addToLayout`, `cleanLayout`, `readTabs`, `fromServer`, `toServer`, `TAB_NAME_MAX` ; catalogue injecté ; 0 import `.tsx`
- `dashboard-widgets.tsx:46-51` — importe util, ré-exporte types + `clamp`, `TAB_NAME_MAX`
- `dashboard-widgets.tsx:171-196` — `newId`, `defaultTabs`, `catalog(hasModule)`, wrappers `readTabs/fromServer/toServer/addToLayout` signatures inchangées
- `dashboard-widgets.tsx` — supprimé : `clamp`, `fitCell`, `layoutBottom`, `pack`, `readCell`, `readTab`, `UUID`, corps parsing (348 → 215 lignes)
- `components/edit/layout-ops.core.ts:1-68` — créé ; `nudge`, `resize(…, gridOf)`, `place(…, newId)`, `MAX_H_DEFAULT = 60` ; imports RGL core + util `.ts`
- `components/edit/layout-ops.ts:1-9` — wrapper, injecte `widgetById(id)?.grid` et `newId`
- `components/edit/edit-history.core.ts:1-41` — créé ; `History<T>`, `HistoryAction<T>`, `initialHistory`, `historyReducer` (set/reset/undo/redo, MAX_STEPS 100)
- `components/edit/use-edit-history.ts:1-34` — hook délègue au reducer ; surface `{value,set,reset,undo,redo,canUndo,canRedo,changes}` inchangée
- `components/edit/edit-cell.tsx:7,100` — `maxH ?? 60` → `maxH ?? MAX_H_DEFAULT` importé
- `dashboard-layout.util.test.ts` — 14 cas · `layout-ops.core.test.ts` — 10 cas · `edit-history.core.test.ts` — 6 cas
- `rg -n "readTabs|fromServer|toServer" dashboard-page.tsx` → L29,113,118,128,246,268 ; import L29 inchangé

## Vérifié comment
`export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` · cwd ortho-front
- `npm run test:unit` → `ℹ tests 334 · ℹ pass 334 · ℹ fail 0` (243 → 334 ; +30 T005, le reste = autres tâches en parallèle)
- `npm run typecheck` → exit 0, 0 erreur
- `npx eslint <10 fichiers WL>` → exit 0 ; `dashboard-widgets.tsx` : 16 warnings `react-refresh/only-export-components` (préexistants, fichier n'exporte pas de composant)
- `npm run lint` global → `✖ 816 problems (755 errors, 61 warnings)` ; 0 fichier WL dans les erreurs (tree-view.tsx, toggle-theme.tsx… hors périmètre, préexistant)
- `node -e "import('react-grid-layout/core')"` → `cloneLayout, moveElement, verticalCompactor` chargés sous node 24

## Écarts
- lecture hors WL : ∅
- DoD « clamp 1 fois — edit-cell importe » : edit-cell.tsx:100 n'avait pas de `clamp` mais le littéral `60` (≡ maxH défaut de layout-ops) → exporté `MAX_H_DEFAULT` depuis layout-ops.core, importé. `clamp` défini 1 fois (util.ts:45), utilisé par widgets.tsx (ré-export) et layout-ops.core
- `cleanLayout([])` → `[today]` (`[].every(string)` = true → chemin legacy) ≠ docstring « liste vide respectée ». Iso-fonctionnel conservé, test documente le comportement réel
- `place` sur case occupée : RGL place la nouvelle case sous l'occupante (y=4), pas l'inverse. Test assert positions {0,4} sans chevauchement
- imports runtime internes suffixés `.ts` (`grid.constants.ts`, `dashboard-layout.util.ts`, `edit-history.core.ts`) — requis par node ESM, autorisé par `allowImportingTsExtensions`
- `git stash`/`pop` 1× pour baseline lint — tree restauré, `git status` identique

## Pour la suite
- Bug latent : `cleanLayout([])` ajoute `today` au lieu de respecter la liste vide (`dashboard-layout.util.ts:107`) — décision archi avant correction, test à inverser
- `toServer` : `color` invalide → `null`, `name` vide → `'Onglet'` ; aller-retour `toServer∘fromServer` = identité seulement sur UUID + couleur `#rrggbb` (test L113)
- `dashboard-widgets.tsx` 16 warnings `react-refresh` : fichier sans composant, règle à exclure dans `eslint.config.js` ou déplacer `STACK_BELOW/rowsToPx/gridLabel`
- lint global 755 erreurs hors dashboard (`shared/ui/tree-view`, `shared/ui/ui/toggle-theme`…) : `eslint --fix` 746 auto — tâche dédiée
- `use-edit-history.ts` reste React-only ; tests du hook = ∅ (hors périmètre)

## Retour sur le pack
- Manquait : convention suffixe `.ts` aussi pour les imports **source→source** (pas seulement tests) ; `edit-cell.tsx:100` contient `60`, pas `clamp` ; lint global déjà rouge (755) → préciser « lint sur fichiers WL »
- Inutile : ∅
