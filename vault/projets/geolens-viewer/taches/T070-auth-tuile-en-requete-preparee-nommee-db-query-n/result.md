---
tache: T070
statut: fait
---
## Livré
- api/src/db.ts:13-19 — `QueryOptions { name? }` + `opts` dans `Db.query`
- api/src/db.ts:30-37 — `pgQueryArgs` pure exportée (config nommée | text,params)
- api/src/db.ts:44-45 — backend pg : `pool.query(...pgQueryArgs(...))`
- api/src/db.ts:83 — pg-mem inchangé, opts ignoré par assignabilité TS
- api/src/tileAuth.ts:36-37 — `{ name: 'tile_grant' }` + commentaire risque `u.*`
- api/src/session.ts:19-24 — `{ name: 'user_access_state' }` + commentaire risque
- api/test/db-prepared.test.ts:1-49 — NEUF, 3 cas pack
- tx.query (pg + pg-mem) inchangés

## Vérifié comment
`npm --prefix api run typecheck >/dev/null; echo $?` → `TYPECHECK_EXIT=0`
`npx vitest run test/db-prepared.test.ts test/tile-auth-parity.test.ts` →
```
 ✓ test/db-prepared.test.ts (3 tests) 421ms
 ✓ test/tile-auth-parity.test.ts (15 tests) 1102ms
 Test Files  2 passed (2)
      Tests  18 passed (18)
```
`npm --prefix api test` →
```
 Test Files  96 passed (96)
      Tests  824 passed (824)
TEST_EXIT=0
```
`git diff --stat -- api` + `git status --short` →
```
 api/src/db.ts       | 20 +++++++++++++++++---
 api/src/session.ts  |  2 ++
 api/src/tileAuth.ts |  3 ++-
 3 files changed, 21 insertions(+), 4 deletions(-)
?? api/test/db-prepared.test.ts
```
Postgres réel → NV — pas de PG dans le périmètre ; branche pg couverte via `pgQueryArgs` seulement

## Écarts
- ∅ (0 lecture hors WL ; base 95/821 → 96/824 = +1 fichier, +3 tests)

## Pour la suite
- `Db.query(text, params, { name })` dispo ; nom ⇔ SQL constant, jamais SQL dynamique sous un même nom
- PgBouncer mode transaction + préparées nommées → NV, à vérifier avant prod (humain)
- `u.*` préparé : toute migration à chaud sans redémarrage → « cached plan must not change result type »
- `pgQueryArgs` exportée (db.ts:31) testable ; mesure PG réel post-T070 (p50 attendu ~0,21 ms) NV

## Retour sur le pack
- Manquait: config/fabrique pg-mem pour test → `makeTestApp` (helpers.js) déduit du test parité ; default `organizations.status='active'` non dit (supposé, confirmé par test vert)
- Inutile: ∅
