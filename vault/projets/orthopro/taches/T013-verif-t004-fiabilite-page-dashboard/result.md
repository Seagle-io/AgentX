---
tache: T013
statut: fait
verdict: DÉFAUTS
---
## Vérifié comment
- `git diff --stat src/modules/dashboard/dashboard-page.tsx` → `1 file changed, 42 insertions(+), 16 deletions(-)`
- `npx eslint src/modules/dashboard/dashboard-page.tsx; echo $?` → `` (vide) `0` ; `react-hooks/exhaustive-deps` = `[1]` actif
- `rg -n 'saveDashboardLayout|saveLayout\.mutate|updateDashboardCellConfig|saveWhole\.mutate|saveConfig\.mutate'` → L128 L246 L265 L268 L272 L278 L394
- traçage écritures, `saved == null` (chargement OU erreur initiale) :
  - L128 migration — L126 `!saved` return — OK
  - L246 saveLayout — L245 `!layoutReady` reject — OK ; L394 seul appelant, EditHeader ⇐ `editing` ⇐ startEditing L155 garde — OK
  - L268/L272 saveWhole, L278 saveConfig — L270 `!saved` return — OK
  - entrées édition L179 L285 L342 L402 → startEditing L155 `!layoutReady` return — OK (no-op sans crash, bouton non désactivé)
- `tabs=[]` : L118 ; L140 `shownTabs[0]` undefined → L150 `activeTab?.layout ?? []`, L376/L399 `?? ''`, L167 `activeTab?.id`, L270 garde — 0 crash ; L430-441 EmptyState remplace `grid` (0 readTabs) ; L396 TabBar masquée
- Réessayer L436 → `refetchLayout` = refetch de `['dashboard-layout']` L105-107 — OK
- sonde query-core 5.101.2 (`node scratchpad/probe.mjs`, QueryObserver, retry:false) →
```
A1 apres erreur initiale {"status":"error","isError":true,"isLoading":false,"isFetching":false,"layoutReady":false}
A2 pendant Reessayer {"status":"pending","isError":false,"isLoading":true,"isFetching":true,"layoutReady":false}
A3 Reessayer echoue {"status":"error","isError":true,"isLoading":false,"isFetching":false,"layoutReady":false}
B1 succes {"status":"success","isError":false,"isLoading":false,"isFetching":false,"layoutReady":true}
B2 refetch echoue {"status":"error","isError":true,"isLoading":false,"isFetching":false,"layoutReady":true}
```
- cause A2 : `query-core/build/modern/query.js` fetchState → `data === void 0 && { error: null, status: "pending" }`
## Défauts
- 1. dashboard-page.tsx:L112,L245,L373-395,L430 — `layoutReady` ignore `layoutError` : état B2 (données périmées + erreur) = layoutReady vrai — repro : en édition, refetch `['dashboard-layout']` échoue (focus fenêtre, défaut RQ) → EditHeader reste, grille remplacée par « Disposition indisponible… Rien n'est modifié », « Enregistrer » actif → L394 PUT du brouillon fondé sur données périmées ; raccourcis L223-241 (Suppr) modifient une grille invisible. Pas une dispo par défaut, mais promesse affichée fausse + écrasement possible
- 2. dashboard-page.tsx:L118,L396,L430-438 — Réessayer sans données : status→`pending`, `isError` faux (A2) → EmptyState démonté, TabBar + squelette L333-335 de `readTabs(défaut)` réapparaissent ; branche `layoutFetching ? 'Nouvel essai…'` + `disabled` morte dans ce cas. 0 écriture (layoutReady faux). Repro : probe A2
- 3. dashboard-page.tsx:L282-286 — memo inefficace : deps `days`/`todaySlots` recréés à chaque rendu (use-dashboard-activity.ts:L51,L66, 0 useMemo) → `context` recalculé à chaque rendu. Repro : `rg -n useMemo src/modules/dashboard/components/use-dashboard-activity.ts*` → ∅
- 4. dashboard-page.tsx:L129-133 — PUT migration OK puis `updatePreferences` rejette → toast « Reprise de la disposition impossible » alors que reprise faite (setSaved déjà appliqué). Repro : lecture, chaîne `.then(...return updatePreferences)` → `.catch` unique
## Écarts
- lecture hors WL: src/modules/dashboard/components/edit/use-edit-history.ts (rg) — stabilité `reset` (L12 useCallback [] → OK)
- lecture hors WL: src/shared/lib/auth/auth-context.tsx (rg) — stabilité `hasModule` (L208 fonction nue, stable entre rendus page, NV entre rendus provider)
- lecture hors WL: src/modules/dashboard/components/use-dashboard-activity.ts — stabilité `days`/`todaySlots`
- lecture hors WL: node_modules/@tanstack/query-core/build/modern/query.js — transition status au refetch ; dépasse budget pack 3 (4/5 budget rôle)
## Pour la suite
- `layoutReady = saved != null && !layoutError` ; en édition + layoutError : garder la grille ou sortir de l'édition, désactiver « Enregistrer »
- erreur affichée = `layoutError || (layoutFetching && saved == null && query.state.error)` ou garder `failureCount`/état local « a échoué » pour que Réessayer ne réaffiche pas le catalogue
- `useDashboardActivity` : `useMemo` sur `days`/`todaySlots` (deps appointments, isLoading) sinon retirer le useMemo de `context`
- migration : `.catch` séparés PUT vs updatePreferences
- NV : config QueryClient (refetchOnWindowFocus/staleTime) non lue — sévérité défaut 1 en dépend
## Retour sur le pack
- Manquait: use-dashboard-activity.ts + use-edit-history.ts (deps du memo exigés par DoD) ; config QueryClient ; sémantique RQ v5 refetch-sans-données | Inutile: grid.tsx (props non sollicitées)
