---
tache: T027
statut: fait
---
## Livré
Racine : `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/`
- `forum/forum.util.ts:1-16` — créé ; `since(iso, now=Date.now())` + `tint` ; L14 → `shortDate`
- `forum/forum.util.test.ts:1-38` — 6 tests (aujourd'hui, futur, hier, N j, ≥30 j shortDate, tint)
- `forum/dashboard-forum.tsx:7-8` — import util ; since/tint locaux supprimés ; JSX inchangé
- `kpi/kpi.util.ts:1-21` — créé ; `trendBadge`, `patientsSub`, `noShowsSub` (via `plural`), `noShowsTone`
- `kpi/kpi.util.test.ts:1-40` — 6 tests
- `kpi/index.tsx:5,43-44,51,53` — pluriels inline → util ; shell inchangé
- `kpi/dashboard-kpi.tsx:5,30` — trend → `trendBadge` ; bouton étiré L42-44 conservé
- `storage/storage.util.ts:1-9` — créé ; `storageRatio(used, quota)` (null/0 → 0), `isSaturated(ratio)` (STORAGE_WARN_RATIO)
- `storage/storage.util.test.ts:1-32` — 4 tests (0, quota null/0/absent, seuil 89/90 %, 120 %)
- `storage/storage-widget.tsx:4,10,22,32` — ratio/seuil → util ; JSX inchangé
- `mascot/mascot.util.ts:1-5` — créé ; `otherFace(current, total, rand=Math.random())` (logique ex-mascot.tsx L13-16)
- `mascot/mascot.util.test.ts:1-26` — 3 tests (≠ courant, saut, bornes)
- `mascot/mascot.tsx:4,25` — `setFace(f => otherFace(f, FACES.length))` ; shell A∧B conservé, 0 WidgetCard
## Vérifié comment
- `rg -n "from '.*\.tsx'|dashboard-widgets|from 'react'" <4 util.ts>` → 0 hit (exit 1)
- `node --test <4 tests WL>` → `tests 19 · pass 19 · fail 0`
- `npm run test:unit` → `tests 354 · pass 353 · fail 1` ; seul KO : `pomodoro/pomodoro.util.test.ts` — `ERR_MODULE_NOT_FOUND pomodoro.config` (hors WL, chantier concurrent)
- `npm run typecheck` → 0 `error TS` (run final ; run précédent : 2 erreurs transitoires hors WL `grid.tsx:88`, `daily-anecdote.util.test.ts:10`, disparues au run suivant)
- `npx eslint <13 fichiers WL + tests>` → ∅, exit 0
## Écarts
- lecture hors WL: `src/modules/dashboard/dashboard-layout.util.test.ts` (head -30) — style des tests voisins
- `mascot/mascot.util.ts` créé hors WL explicite — DoD 4 option « util + test ≥ 3 » l'implique
- forum : ∅ tri/filtre dans dashboard-forum.tsx (topics rendus tels quels) → logique extraite = since + tint
## Pour la suite
- pomodoro.util.ts importe `./pomodoro.config` inexistant → test:unit rouge tant que non livré (hors WL)
- `since` prend `now` optionnel : prêt pour un test de borne 30 j côté index.tsx si besoin
- 4 util.ts importent format/date ou licence-quota en relatif suffixé `.ts` — à aligner si convention alias arrive sous node
## Retour sur le pack
- Manquait: `mascot/mascot.util.ts` dans la WL ; mention que forum n'a ∅ tri/filtre
- Inutile: ∅
