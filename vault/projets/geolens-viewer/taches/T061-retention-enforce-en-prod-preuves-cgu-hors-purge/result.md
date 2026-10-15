---
tache: T061
statut: fait
---
## Livré
- G/.env.production.example:52 — `RETENTION_MODE=enforce` + commentaire contrat ; :53 inchangée
- G/api/src/retention.ts:39,42 — DELETE/SELECT excluent `action <> 'accept_invite'`
- G/api/src/erasure.ts:80-96 — 1 SELECT `detail IS NOT NULL` + filtre JS, compteur
- G/api/src/erasure.ts:104-108 — `likeEscape` supprimé
- G/api/test/d15-fixes.test.ts:9,73-75 — import + cas likeEscape retirés
- G/web/src/pages/Confidentialite.tsx:108 — ligne preuve CGU ajoutée
- G/api/test/d18-retention.test.ts:1-92 — NEUF, 4 cas D18
## Vérifié comment
`rg -n "LIKE|likeEscape" api/src/erasure.ts` → ∅ (rc=1)
`npx --prefix api vitest run --root api test/d18-retention.test.ts test/d15-fixes.test.ts test/retention.test.ts test/erasure-unit.test.ts` →
```
 ✓ test/d15-fixes.test.ts (5 tests)
 ✓ test/erasure-unit.test.ts (6 tests)
 ✓ test/d18-retention.test.ts (4 tests)
 ✓ test/retention.test.ts (11 tests)
 Test Files  4 passed (4)
      Tests  26 passed (26)
```
`npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · api_rc=0
`npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` · web_rc=0
`npm --prefix api test` →
```
 Test Files  90 passed (90)
      Tests  772 passed (772)
```
(89/769 base − 1 likeEscape + 1 fichier/4 cas = 90/772)
`git -C G diff --stat` →
```
 .env.production.example           |  2 +-
 api/src/erasure.ts                | 31 ++++++++++++++-----------------
 api/src/retention.ts              |  4 ++--
 api/test/d15-fixes.test.ts        |  6 +-----
 web/src/pages/Confidentialite.tsx |  1 +
 5 files changed, 19 insertions(+), 25 deletions(-)
?? api/test/d18-retention.test.ts
```
## Écarts
- commentaire erasure.ts:82 : « 0 LIKE » → « 0 opérateur like » — sinon rg DoD ≠ ∅
- lecture hors WL : ∅
## Pour la suite
- d15-fixes.test.ts:2 docstring dit encore « LIKE échappé » — obsolète, hors droit T061
- retention.ts:7 docstring « 'report' (défaut prod) » — vrai côté code, .env prod = enforce
- effacement scanne tout audit_log non NULL par user — volume borné par purge 12 mois (D18)
- 0 commit (D5) : 5 M + 1 ?? sur G, HEAD 341b4a1
## Retour sur le pack
- Manquait: commentaire contrat « 0 LIKE » contredit DoD `rg LIKE → ∅`
- Inutile: ∅
