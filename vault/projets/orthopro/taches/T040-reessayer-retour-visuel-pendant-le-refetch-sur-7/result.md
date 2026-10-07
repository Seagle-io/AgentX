---
tache: T040
statut: fait
---
## Livré
Base `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/`
- useful-links/useful-links.tsx:38-40,52 — `queries`/`retrying`, bouton outline désactivé pendant refetch
- onboarding/onboarding-widget.tsx:35-37,57 — idem, 3 requêtes
- quick-reply/quick-reply-widget.tsx:28-30,46 — idem, `queries` conditionnel thread
- kora-news/kora-news-widget.tsx:27-29,43 — idem
- tomorrow/tomorrow-widget.tsx:7,54,68,84 — `timeLabel` supprimé → `hhmm(apt.startTime)` ; retrying
- week-grid/week-grid-widget.tsx:53,67 — retrying, variant outline
- free-slots/free-slots-widget.tsx:7,55,63,82-84 — `time` supprimé → `hhmm(slot.*)` ; retrying
- WidgetNote error conservée : widget-state.ts `if (queries.some(q => q.isError)) return 'error'` — isError vrai pendant refetch (contrat L41) ; `isFetching` lu sur UseQueryResult, QueryLike inchangé
- hhmm(DateLike) : tomorrow passait `iso: string`, free-slots `Date` — tous deux DateLike ; sortie `HH:MM` ≡ fr-FR 2-digit

## Vérifié comment
`rg -n "Nouvel essai" <7 WL>` → 7 hits (useful-links:52, onboarding:57, kora-news:43, quick-reply:46, week-grid:67, free-slots:63, tomorrow:68)
`npm run typecheck` → tsc app+e2e+node, 0 erreur
`npx eslint <7 WL>` → ∅ sortie, exit 0
`npm run test:unit` → tests 399 · pass 399 · fail 0

## Écarts
- lecture hors WL : ∅
- DoD 3 : coordonnées du pack imprécises — hh:mm réel à tomorrow-widget.tsx:20-21 (`timeLabel`) et free-slots-widget.tsx:23 (`time`) ; L18/L21 = `localDateKey`/`localDateTimeKey` (clés URL, pas formateurs) → laissés
- `git status` : 20+ fichiers M hors WL (vagues parallèles T038…), non touchés

## Pour la suite
- `localDateKey` dupliqué dans tomorrow/week-grid/free-slots (3 copies identiques) — candidat `@/shared/lib/format/date`
- `localDateTimeKey` (free-slots:20-21) pourrait réutiliser `hhmm` : `${localDateKey(d)}T${hhmm(d)}`
- 0 test unitaire sur les .tsx (test:unit = node, util only) : `retrying` NV en rendu

## Retour sur le pack
- Manquait : lignes exactes des helpers hh:mm (noms `timeLabel`/`time`) ; précision « QueryLike n'inclut pas isFetching, lire sur UseQueryResult »
- Inutile : ∅
