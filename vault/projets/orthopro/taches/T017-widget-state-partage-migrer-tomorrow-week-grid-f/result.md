---
tache: T017
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow-widget.tsx:13-14` — import `../widget-state`, util sans state
- `…/tomorrow/tomorrow-widget.tsx:37-46` — `appointmentsEnabled` ; `queries` sans RDV tant que désactivée (I1)
- `…/tomorrow/tomorrow.util.ts:25-33` — copie QueryLike/widgetState supprimée (= HEAD)
- `…/tomorrow/tomorrow.util.test.ts:33-51` — cas état retirés (= HEAD)
- `…/week-grid/week-grid-widget.tsx:12-13` — import `../widget-state`
- `…/week-grid/week-grid.util.ts:93-101` — copie supprimée (= HEAD)
- `…/week-grid/week-grid.util.test.ts:5,69-87` — cas état retirés ; workRanges/fills conservés
- `…/free-slots/free-slots-widget.tsx:12-13` — import `../widget-state`
- `…/free-slots/free-slots.util.ts:102-110` — copie supprimée (= HEAD)
- `…/free-slots/free-slots.util.test.ts:5,70-88` — cas état retirés ; workRanges conservés
- `…/useful-links/useful-links.tsx:9` — import `../widget-state`
- `…/useful-links/useful-links.util.ts` + `useful-links.util.test.ts` — supprimés (étaient untracked)
- `['agenda-event-types']` ∉ widgetState — ne sert qu'à `appointmentColor` (pastille), `types ?? []` ; ne conditionne pas l'affichage

## Vérifié comment
- `rg -n "QueryLike|widgetState|WidgetState" tomorrow week-grid free-slots useful-links` → 4 hits, tous `*.tsx` (import + appel) ; 0 dans `*.util.ts`
- `npm run test:unit` → `ℹ tests 315 · ℹ pass 315 · ℹ fail 0`
- `npm run typecheck` → 0 `error TS`, exit 0
- `npx eslint widget/{tomorrow,week-grid,free-slots,useful-links}` → ∅ sortie, exit 0

## Écarts
- lectures hors WL : ∅
- `git status` : les copies locales n'étaient pas dans HEAD (`git show HEAD:…tomorrow.util.ts | grep -c widgetState` → 0) → util.ts/tests tomorrow + util.ts week-grid/free-slots reviennent = HEAD, n'apparaissent plus en `M`
- `retry` tomorrow ne refetch plus la requête RDV désactivée — cohérent, refetch d'une requête disabled sans effet

## Pour la suite
- tomorrow : `useQuery(['agenda-event-types'])` reste hors widgetState ; erreur sur types → pastilles couleur par défaut, pas d'état `error`
- `git status` WL : 4 `*.tsx` + 2 `*.util.test.ts` M ; `widget-state.ts` + test encore `??` (T015)
- arbre partagé : kora-news, onboarding, quick-reply aussi M (T015) — non touchés ici

## Retour sur le pack
- Manquait : mention que les copies locales étaient du working-tree (pas HEAD) — évite surprise `git status`
- Inutile : ∅
