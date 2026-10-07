---
tache: T015
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/widget-state.ts:L1-13` — créé, 0 import, signature contrat verbatim (`readonly QueryLike[]`), table ∃err→error ; ∃¬success→loading ; isEmpty?empty:ready
- `…/widget/widget-state.test.ts:L1-45` — créé, 8 `test()` / 12 assertions, couvre les 9 cas DoD (inactive→loading, readonly, [] , 1 seul isError)
- `…/widget/quick-reply/quick-reply.util.ts` — supprimé (ne contenait que la copie)
- `…/widget/quick-reply/quick-reply.util.test.ts` — supprimé (ne testait que la copie)
- `…/widget/quick-reply/quick-reply-widget.tsx:L13` — import `'../widget-state'`, JSX intact
- `…/widget/kora-news/kora-news.util.ts:L1-15` — copie L17-26 retirée
- `…/widget/kora-news/kora-news.util.test.ts:L1-23` — cas état L24-44 retirés, import allégé
- `…/widget/kora-news/kora-news-widget.tsx:L9-10` — import `'../widget-state'`, JSX intact
- `…/widget/onboarding/onboarding.util.ts:L1-44` — copie L46-55 retirée
- `…/widget/onboarding/onboarding.util.test.ts:L1-31` — cas état L33-51 retirés, import allégé
- `…/widget/onboarding/onboarding-widget.tsx:L15-16` — import `'../widget-state'`, JSX intact

## Vérifié comment
- `rg -n "QueryLike|widgetState|WidgetState" kora-news/kora-news.util.ts onboarding/onboarding.util.ts kora-news/kora-news.util.test.ts onboarding/onboarding.util.test.ts` → 0 hit (exit 1) ; quick-reply.util.ts ∅ (supprimé)
- `rg -n "widget-state" quick-reply kora-news onboarding` → 3 hits, 1 par `*-widget.tsx`
- `npm run test:unit` →
```
ℹ tests 330
ℹ pass 330
ℹ fail 0
```
- `node --test widget-state.test.ts` → `tests 8 · pass 8 · fail 0`
- `npm run typecheck` → 0 `error TS`, exit 0
- `npx eslint quick-reply kora-news onboarding widget-state.ts widget-state.test.ts` → 0 sortie, exit 0

## Écarts
- lecture hors WL : ∅
- `git status` : `kora-news.util.ts` / `.test.ts` non marqués M → HEAD n'avait déjà pas la copie (copie = modif non commitée d'un autre lot) ; résultat identique
- `kora-news-widget.tsx` diff git = 16+/8- : 15 lignes préexistantes (T007, non commitées), 1 ligne T015

## Pour la suite
- I4 effectif : kora-news/quick-reply requête inactive → loading (contrat T010)
- T017 : tomorrow/week-grid/free-slots/useful-links ont encore leurs copies + `clock.util.ts`, `useful-links.util.ts` apparus en untracked (autre agent) — à vérifier contre I2
- `quick-reply/` ne garde que `index.tsx` + `quick-reply-widget.tsx`
- Arbre partagé : 16 fichiers M hors T015 (clock, free-slots, tomorrow, useful-links, week-grid) — non touchés

## Retour sur le pack
- Manquait: ∅ · Inutile: ∅ (plages L46-55 / L33-51 exactes, gain net)

## Reprise
- `quick-reply/quick-reply-widget.tsx:L28` — `widgetState(conversation ? [practitioners, patients, thread] : [practitioners, patients], !conversation)` (I1 : thread enabled ssi conversation)
- `quick-reply/quick-reply-widget.tsx:L29` — retry → `if (conversation) void thread.refetch()` ajouté
- `npx eslint quick-reply-widget.tsx` → 0 sortie, exit 0 ; `npm run typecheck` → 0 `error TS`, exit 0
- JSX L32-79 inchangé
