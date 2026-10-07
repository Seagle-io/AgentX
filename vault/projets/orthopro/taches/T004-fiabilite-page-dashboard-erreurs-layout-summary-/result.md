---
tache: T004
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:1` — import `useCallback`
- `:87` — `displayEuros` sous `useCallback([hideMoney])`
- `:105-112` — query layout étendue `isError/refetch/isFetching` ; `layoutReady = saved != null`
- `:117-120` — `tabs = []` si `layoutError` ; 0 repli `readTabs` en erreur
- `:130-133` — `.catch` migration → toast « Reprise de la disposition impossible »
- `:153-162` — `startEditing` garde `layoutReady`, `useCallback([tabs, layoutReady, resetHistory])`
- `:243-247` — `saveLayout.mutationFn` rejette si `!layoutReady` (→ toast « Disposition non enregistrée »)
- `:269-271` — `setCellConfig` : `!saved` → return (saveWhole ne peut écraser la base)
- `:282-286` — `context` sous `useMemo`, 9 deps exhaustives
- `:396` — `DashboardTabBar` masquée si `layoutError`
- `:430-442` — `layoutError` → `EmptyState` « Disposition indisponible » + bouton « Réessayer » → `refetchLayout()` ; remplace la grille
- summary en erreur : `PageError` existant `:405-411` + « Réessayer » conservé ; grille conditionnée à `data` → 0 case muette (inchangé)
## Vérifié comment
- `npx eslint src/modules/dashboard/dashboard-page.tsx` → `lint exit 0` (0 error, 0 warning)
- `npm run typecheck | grep -c dashboard-page.tsx` → `0` ; 2 erreurs TS restantes hors WL : `dashboard-widgets.tsx(73,37) WidgetGrid`, `onboarding-widget.tsx` — fichiers T005 en cours
- `npm run lint` global → `801 problems` (755 `@stylistic/jsx-quotes` etc.) préexistants, 0 dans dashboard-page.tsx
- `npm run test:unit` → `tests 308 pass 306 fail 2` ; échecs `widget/*/*.util.test.ts` (`widgetState` export manquant) — lot T005, hors WL ; baseline avant mes edits (stash) `tests 265 pass 265`
- vérif manuelle NV. Repro pour verificateur : (1) back coupé ou devtools → block `/dashboard/layout` → EmptyState « Disposition indisponible », pas d'onglets, « Réessayer » relance ; (2) block `/dashboard/summary` seul → PageError + onglets visibles, grille vide ; (3) layout OK + prefs legacy non vides + block POST `/dashboard/layout` → toast « Reprise de la disposition impossible »
## Écarts
- lecture hors WL: `components/tab-bar.tsx` (grep props) — vérifier existence prop `disabled` → ∅
- lecture hors WL: `components/edit/use-edit-history.ts` (grep) — stabilité `reset` pour deps useCallback → `useCallback([])` OK
- lecture hors WL: `package.json`/`eslint.config.js` (grep) — version react-hooks plugin (5.1) → pas de règle `refs`
- DoD 2 partielle : « Personnaliser » non désactivé visuellement pendant le chargement (`tab-bar.tsx` sans prop `disabled`, hors WL) ; clic = no-op via garde `startEditing`. En erreur, barre masquée.
- `git stash`/`stash pop` exécuté 1× pour baseline tests — a transité les fichiers des autres lots, restaurés (`git status` identique)
## Pour la suite
- `tab-bar.tsx:14,64` — ajouter prop `disabled?: boolean` sur bouton Personnaliser ; page passe `!layoutReady` (1 fichier, lot vague 3)
- T005 : `dashboard-widgets.tsx:73 WidgetGrid` non défini + `widgetState` non exporté des `*.util.ts` → typecheck/test:unit KO tant que non livré
- `npm run lint` global : 755 erreurs `@stylistic/jsx-quotes` préexistantes, `--fix` possible (tâche dédiée)
- test unitaire possible : `tabs === []` quand `['dashboard-layout']` isError (extraire sélecteur pur)
## Retour sur le pack
- Manquait: props `DashboardTabBar` (pas de `disabled`) ; stabilité `useEditHistory.reset` ; mention que T005 casse typecheck/test:unit en parallèle
- Inutile: `widget-card.tsx` (WidgetNote non utilisé), `types.ts`
