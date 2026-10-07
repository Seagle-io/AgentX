---
tache: T036
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts:24-29` — `sameLayout` — exporté, compare i/widget/x/y/w/h, config par ref
- `layout-ops.core.ts:31-43` — `settle` — rend `source` si `sameLayout` → nudge/resize no-op = `Object.is(out, layout)` ; place = tableau neuf toujours
- `layout-ops.core.test.ts:100-142` — +6 tests (sameLayout, mur, ↓ dernière, resize identique, vrai déplacement, place)
- `edit-history.core.ts:1-4` — `History.last?` + `RecordOpt` exporté
- `edit-history.core.ts:16` — `COALESCE_WINDOW_MS = 1000` exporté
- `edit-history.core.ts:28-40` — `historyReducer(h, action, { now = Date.now })` — no-op ref, booléen inchangé, coalesce même key < 1000 ms remplace sans empiler
- `edit-history.core.test.ts:49-145` — +9 tests, horloge injectée
- `use-edit-history.ts:2,14` — `set(update, record: RecordOpt = true)` ; `changes` inchangé
## Repro pour vérif
- F1 : `nudge([a@0,0], 'a', -1, 0)` → `Object.is(out, layout)` true ; `nudge([a@0,0; b@0,4], 'b', 0, 1)` → true ; `resize([a 6×8], 'a', 6, 8)` → true ; `nudge([a,b@4,0], 'a', 1, 0)` → ref ≠, config conservée par ref
- F2 : 3 × `set(v, {coalesce:'k'})` à t=0,300,600 → `past=[0]`, `present=3` ; undo → `present=0`, `future=[3]` ; même key à +1000 ms → nouvelle étape ; key ≠ → nouvelle étape ; `set(v, true/false)` → forme `{past,present,future}` sans `last` (deepEqual existants OK)
- rupture de fusion : `set` booléen ou `undo` entre deux frappes → `last` effacé → prochaine frappe empile
## Vérifié comment
- `node --test layout-ops.core.test.ts edit-history.core.test.ts` → `tests 35 · pass 35 · fail 0`
- `npm run test:unit` → `tests 395 · pass 395 · fail 0`
- `npm run typecheck` → exit 0, 0 erreur (WL et hors WL)
- `npx eslint <5 fichiers WL>` → exit 0, 0 sortie
## Écarts
- ∅ lecture hors WL
- `git status` : `edit-cell.tsx` modifié par lot voisin (T034), non touché ici
- fusion : horodatage rafraîchi à chaque frappe fusionnée (fenêtre glissante) — contrat dit « étape précédente < 1000 ms », lu comme la frappe précédente
## Pour la suite
- T035 : `set(next, { coalesce: \`nudge:${id}\` })` ; aucun garde no-op côté appelant nécessaire (ref identique → reducer ignore)
- `History.last` fuit dans l'état mais pas dans la surface du hook ; `changes` = `past.length` → compte 1 par rafale fusionnée
- `place` ne rend jamais `layout` (ajoute toujours une case) : no-op sans objet
## Retour sur le pack
- Manquait: choix fenêtre glissante vs fixe (tranché, voir Écarts) · Inutile: ∅
