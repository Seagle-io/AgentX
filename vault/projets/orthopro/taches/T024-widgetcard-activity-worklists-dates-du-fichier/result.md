---
tache: T024
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/activity/activity-year.tsx:7-8,21,46-58,102` — racine `WidgetCard icon='bar-chart'` ; toolbar + total dans `actions` ; sous-titre en tête du body (`bodyClassName='flex flex-col p-5'`) ; 2 pluriels → `plural`
- `ortho-front/src/modules/dashboard/components/widget/worklists/dashboard-worklists.tsx:1,8-9,53-66,82` — `Card` = `WidgetCard hue count` ; icône check-circle si vide ; phrase vide dans `title` (fragment) ; `bodyClassName` `p-0` | `hidden` ; `shortDay` supprimé → `shortDate` (`5 oct.`) ; imports `CSSProperties`, `Text` retirés
- `activity/activity-widget.tsx` — ∅ (ne porte pas le shell)

## Vérifié comment
- `npm run test:unit` → `tests 348 · pass 348 · fail 0`
- `npm run typecheck` → 2 erreurs, **toutes hors WL** : `components/grid.tsx(88,7) TS6133 cellTestAttrs` ; `daily-anecdote/daily-anecdote.util.test.ts(10,49) TS2741 'day' missing` · 0 erreur WL
- `npx eslint activity-year.tsx dashboard-worklists.tsx activity-widget.tsx` → ∅ (0 sortie)
- `rg -n "rounded-card border border-border bg-bg-panel" activity/ worklists/` → 1 hit : `activity/activity-chart.tsx:69` (fichier L, hors E)
- `git diff --stat` → `activity-year.tsx | 34 ++++++++++---------` · `dashboard-worklists.tsx | 38 +++++++++-------------` · `2 files changed, 35 insertions(+), 37 deletions(-)`

## Écarts
- lecture hors WL : ∅
- DoD 2 : hover bordure `hover:border-[color-mix(…var(--hue)_45%…)]` **perdu** — section WidgetCard className fixe, `bodyClassName` = body seul ; décision chef (ajouter hover à WidgetCard = T023/hors WL)
- DoD 4 : hit résiduel `activity-chart.tsx:69` — fichier L seulement, shell identique à activity-year ; non touché
- Worklists vide : perd icône verte `bg-success/10 text-success` + header sans `border-b` (WidgetCard = accent fixe, filet toujours posé) — approximation visuelle
- Worklists : `count` passé à WidgetCard = pastille identique (rendue ssi >0) ; `h-full` déjà présent avant → hauteur inchangée
- DoD 6 typecheck ≠ 0 : 2 KO hors WL (grid.tsx, daily-anecdote.util.test.ts) — listés, non corrigés

## Pour la suite
- `activity-chart.tsx:69` : même shell recopié, hors E ici → tâche de suivi (WidgetCard + plural L78,L89)
- hover bordure hue des worklists perdu : à réintroduire dans `widget-card.tsx` (`hover:border-[color-mix(in_srgb,var(--hue)_45%,var(--color-border))]`) si voulu — 1 ligne
- `grid.tsx:88 cellTestAttrs` inutilisé + `daily-anecdote.util.test.ts:10` schéma `day` manquant → typecheck rouge global
- WidgetCard : état « vide » (icône succès, pas de filet) absent du contrat → option `empty?` à envisager

## Retour sur le pack
- Manquait : statut hover/état vide dans contrat WidgetCard (perte anticipable) ; `activity-chart.tsx` en L alors que DoD 4 cible `activity/` entier
- Inutile : ∅
