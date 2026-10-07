---
tache: T004
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:1-486` — mode édition retiré ; 627→486 l.
- `dashboard-page.tsx:157-186` — history=affiché, echo, autosave, resync, commit, undo/redo
- `dashboard-page.tsx:198-266` — gestes → commit (tabs, cells, addWidget, toasts Annuler)
- `dashboard-page.tsx:269-281` — clavier global Z/Maj+Z/Y/S, skip isTyping|confirmation
- `dashboard-page.tsx:289-293` — onCustomize → setCatalogueOpen(true)
- `dashboard-page.tsx:305-321` — renderCell → CellChrome ; pile → onNudge/onResizeBy undefined
- `dashboard-page.tsx:331-375` — grille interactive, dragging, onDropWidget, EmptyState → catalogue
- `dashboard-page.tsx:382-402` — DashboardTabBar nouveau contrat, disabled=!layoutReady
- `dashboard-page.tsx:438-480` — CataloguePanel, FlyingModal réglages, Dialog dash-confirm (reset)
- `components/autosave.core.ts:1-14` — `sameTabs` pur
- `components/autosave.core.test.ts:1-32` — 4 cas node:test
- `components/use-layout-autosave.ts:1-108` — debounce, 1 PUT, dirty, flush, beforeunload, démontage
## Vérifié comment
- `rg -n "editing|draft|selectedId|dropping|HINTS|useBlocker|saveLayout|saveWhole|saveConfig|updateDashboardCellConfig|EditHeader|EditCell" dashboard-page.tsx` → ∅ (exit 1)
- `npx tsc -b 2>&1 | grep -c "error TS"` → `0` (T003/T005 composants déjà présents)
- `npx eslint <4 fichiers E>` → ∅, exit 0
- `node --test components/autosave.core.test.ts` → `ℹ tests 4 · pass 4 · fail 0`
- `npm run test:unit` (node 24) → `ℹ tests 406 · pass 406 · fail 0`
## Écarts
- contrat `sameTabs` : ∅ `sameLayout` — compare `config` par référence, écho serveur ≠ → undo perdu ; cellules comparées champ à champ + `JSON.stringify(config ?? {})`, `color ?? null` des deux côtés
- `sameTabs` compare `layout.length` + chaque cellule, ∅ dépendance layout-ops.core
- `resizeBy` coalesce `'nudge:'+id` (pack :80) ; onSelectCell catalogue → ferme + focusCell (pack silencieux)
- CataloguePanel `open={catalogueOpen && layoutReady}` — ∅ ajout sans base relue
- lectures hors WL : `components/edit/layout-ops.ts` (via grep, signatures wrapper) · `edit-history.core.ts:1-30` (`RecordOpt`) · `grep export` grid/tab-bar/widget-panels (présence T003/T005)
## Pour la suite
- NV en navigateur : echo `fromServer(next)` doit égaler `history.value` (fitCell/compact/`config` normalisé) sinon `reset` écrase l'historique après chaque PUT → à tester e2e (T006) : geste, attendre 800 ms, Ctrl+Z doit marcher
- `removeTab` sur l'onglet actif + Annuler : `?onglet=` déjà remplacé → onglet restauré non resélectionné
- `edit-cell.tsx`, `edit-header.tsx` encore présents, plus importés par la page (T005 supprime)
- ∅ Échap global : annulation d'un glisser catalogue = `onDragEnd` seul (grid T003)
- `fire()` après démontage appelle `setState` sur hook démonté — silencieux React 18, à surveiller si StrictMode warn
## Retour sur le pack
- Manquait: `sameLayout` compare config par référence (contrat `sameTabs` inapplicable tel quel) · signatures `layout-ops.ts` (wrapper) vs `.core` · `RecordOpt` hors WL · tsc exige T003/T005 présents ou non (ils l'étaient)
- Inutile: `edit-history.core.test.ts` en L (modèle vu en 10 l.)
