---
tache: T007
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.ts:1-10` — créé : `QueryLike`, `WidgetState`, `widgetState` (error>loading>empty>ready)
- `…/quick-reply/quick-reply.util.test.ts:1-26` — créé : 4 tests (1 par état)
- `…/quick-reply/quick-reply-widget.tsx:8,13,28-29,40-48` — `state` via util ; error → `WidgetNote tone='error'` « Messagerie indisponible. » + `Button` Réessayer (refetch 2 queries) ; empty seulement 2× isSuccess
- `…/kora-news/kora-news.util.ts:17-26` — ajout `widgetState` (même contrat)
- `…/kora-news/kora-news.util.test.ts:7,25-44` — +4 tests état
- `…/kora-news/kora-news-widget.tsx:7-9,14-16,20-26,36-44` — loading→Spinner ; error→note+Réessayer ; empty si isSuccess ; ready→liste
- `…/onboarding/onboarding.util.ts:21-23,27-28,32,38,42-44,46-55` — `OnboardingStep.done: boolean | null` ; null ≠ non fait ; `progressOf` compte `=== true` ; ajout `widgetState`
- `…/onboarding/onboarding.util.test.ts:5,21-26,32-50` — test null réécrit (done=null, progress 0/6) ; +4 tests état
- `…/onboarding/onboarding-widget.tsx:12-15,28-35,49-57,71-77` — 3 queries nommées ; loading→Spinner ; error→note+Réessayer (refetch 3) ; compteur masqué hors ready ; étape null → « — » (`aria-label`), hint seulement si `done === false`
## Vérifié comment
`npm run test:unit` → `ℹ tests 284 · ℹ pass 284 · ℹ fail 0` (243→284 : +12 T007, reste = tâches voisines en cours dans le WT)
`npm run typecheck` → `tsc --noEmit -p .` exit 0, 0 erreur
`npx eslint src/modules/dashboard/components/widget/{quick-reply,kora-news,onboarding}` → ∅ (0 problème)
`npm run lint` global → `✖ 817 problems (755 errors, 62 warnings)` — tous hors WL (`jsx-quotes` etc., préexistant)
`rg -n "WidgetNote|Spinner" <3 widgets>` → quick-reply:40,43,47 · kora-news:36,39,43 · onboarding:50,53 ; `<Text>` restants onboarding:61-62 = état « tout fait », pas L/E/V
## Écarts
- lecture hors WL : ∅
- `widgetState` dupliqué 3× (10 lignes) — pack impose `<nom>.util.ts` par widget, 0 fichier partagé en WL
- kora-news : repli `latest` ne couvre plus error/loading (DoD prime sur ancien commentaire :13-15) ; reste pour empty
- onboarding `isEmpty=false` toujours — 3 étapes toujours présentes, état empty inatteignable
## Pour la suite
- Factoriser `widgetState`/`QueryLike` dans `widget/widget-state.util.ts` + supprimer les 3 copies (T-neuve, WL 4 fichiers)
- `npm run lint` global rouge (755 err `@stylistic/jsx-quotes` entre autres) hors dashboard — `eslint --fix` candidat, tâche dédiée
- Autres widgets WT modifiés par tâches parallèles (clock, free-slots, tomorrow, useful-links, week-grid) : commit par lot à coordonner
- Étape onboarding `done === null` n'est atteignable que si une query `isSuccess` renvoie `undefined` — vérifier `fetchCabinet` 404 → data undefined ?
## Retour sur le pack
- Manquait : variante `Button` exacte pour « discrète » (choisi `outline` sm, comme onboarding-widget:50 existant) ; politique kora-news repli `latest` vs error
- Inutile : ∅
## Reprise
- constat : `onboarding.util.ts` — `done: boolean | null` + `progressOf (=== true)` intacts ; `widgetState`/`QueryLike`/`WidgetState` absents ; `onboarding.util.test.ts` — 4 tests état absents, import réduit
- rétabli `onboarding.util.ts:46-55` — `QueryLike`, `WidgetState`, `widgetState` (verbatim quick-reply.util.ts:1-10)
- rétabli `onboarding.util.test.ts:5,33-51` — import `widgetState, QueryLike` + 4 tests état
- `npm run test:unit` → `ℹ tests 334 · ℹ pass 334 · ℹ fail 0` (1er run : fail 3 + `dashboard-widgets.tsx(73) TS2304 WidgetGrid` = lot voisin en cours, disparu au 2e run)
- `npm run typecheck` → exit 0 ; `npx eslint …/onboarding` → exit 0
- `rg widgetState onboarding/` → widget:15,34 · util:50 · test:5,38,42,46,50
- 0 stash/checkout/reset ; 3 fichiers onboarding/ seulement
