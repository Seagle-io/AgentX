---
tache: T019
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:105-122` — D1 D2 — `isSuccess` lu ; `layoutFailed` useState + effet (vrai sur isError, faux sur isSuccess) ; `layoutError = layoutFailed || isError` ; `layoutReady = saved != null && !layoutError`
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:137-152` — D4 — `.then(ok, ko)` : PUT KO → toast error + `migrated.current = false` ; prefs KO → `.catch` interne, toast `warning` « Disposition reprise, ancienne préférence non vidée », `setSaved(next)` gardé, 0 réessai
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:181-190` — D1 — effet `editing && layoutError` → `stopEditing()` + toast error « Disposition indisponible, modifications abandonnées »
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:418` — D1 — `saving={saveLayout.isPending || !layoutReady}` → Enregistrer/Annuler disabled si `layoutError`
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:~126,~419,~455` — D2 — `tabs=[]`, TabBar masquée, EmptyState + Réessayer (`disabled={layoutFetching}`, « Nouvel essai… ») pilotés par `layoutError` collant — inchangés textuellement, sémantique via L117
- `ortho-front/src/modules/dashboard/components/use-dashboard-activity.ts:1,16,43-75` — D3 — `NO_APPOINTMENTS` constant stable ; `days` et `todaySlots` sous `useMemo` deps `[appointments, todayIso]`
- `variant: 'warning'` existe (`toast.tsx:6`) → utilisé

## Repro pour vérif
- D1 : layout chargé → entrer en édition → faire échouer GET /dashboard-layout (devtools offline) → blur/focus fenêtre → sortie d'édition + toast « Disposition indisponible, modifications abandonnées », EditHeader démonté ; EmptyState « Disposition indisponible »
- D2 : GET layout KO au 1er chargement → EmptyState → « Réessayer » (serveur toujours KO) → bouton « Nouvel essai… » disabled, EmptyState reste, 0 TabBar, 0 squelette défaut ; quand GET OK → EmptyState disparaît, onglets du serveur
- D3 : React DevTools profiler sur DashboardPage → rendu sans changement de données (ex. setHideMoney) → widgets reçoivent même `context.days`/`todaySlots` (référence stable) ; `npx eslint` react-hooks silencieux (sortie ci-dessous)
- D4 : user avec `preferences.dashboard-layout` legacy, base sans layout → (a) PUT KO → toast error « Reprise de la disposition impossible », réessai au prochain `saved` ; (b) PUT OK + PATCH prefs KO → toast warning « Disposition reprise, ancienne préférence non vidée », disposition serveur affichée, 0 second PUT

## Vérifié comment
`npx eslint src/modules/dashboard/dashboard-page.tsx src/modules/dashboard/components/use-dashboard-activity.ts` → (vide) `eslint exit 0`
`npm run typecheck` → `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.e2e.json --noEmit && tsc -p tsconfig.node.json --noEmit` → 0 erreur
`npm run test:unit` → `ℹ tests 356 · pass 354 · fail 2` : `✖ P11 alarmProblem 25:00 → attendu non-null` · `✖ P12 alarmProblem 9:00 non paddé, once aujourd hui 12:00 → attendu past|incomplete` — fichier clock (hors WL, préexistant, 0 lien avec T019 ; cf. Pour la suite)

## Écarts
- lecture hors WL: `src/shared/ui/toast/toast.tsx` (grep `ToastVariant`) — vérifier existence 'warning', demandé par Contrats
- D1 : effet `editing && layoutError` porte `eslint-disable react-hooks/exhaustive-deps` (idiome voisin L153) — `stopEditing` non mémoïsé
- D1 : `saving` réutilisé pour désactiver Enregistrer → libellé « Enregistrement… » 1 rendu avant que l'effet démonte EditHeader ; `edit-header.tsx` L, pas de prop dédiée
- `git diff --stat` inclut les modifs T004 non commitées (arbre partagé) — mes lignes : celles listées dans Livré

## Pour la suite
- `test:unit` fail 2 préexistants : `clock.probe.test.ts` P11/P12 (`alarmProblem`) — tâche clock, hors T019
- D1 propre : prop `canSave`/`disabled` dans `edit-header.tsx` pour éviter le libellé « Enregistrement… » transitoire
- `stopEditing` en `useCallback` → lever le `eslint-disable` de l'effet D1
- Arbre `ortho-front` : ~24 fichiers M + ~17 ?? non commités (T004/T005 probes) — à trier avant commit

## Retour sur le pack
- Manquait: type `ToastVariant` verbatim (évite 1 lecture hors WL) · état attendu de `test:unit` avant tâche (fails préexistants) · signature `updatePreferences` (retourne Promise — NV avant typecheck)
- Inutile: ∅

## Reprise 2
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:136` — garde migration `|| layoutError` — 0 PUT legacy sous « Disposition indisponible »
- `dashboard-page.tsx:154` — deps `[saved, legacy, layoutError]`
- `npx eslint src/modules/dashboard/dashboard-page.tsx` → vide, exit 0
- `npm run typecheck` → 3 tsc OK, exit 0
- Écarts: ∅ · 0 git stash/checkout/reset/commit
