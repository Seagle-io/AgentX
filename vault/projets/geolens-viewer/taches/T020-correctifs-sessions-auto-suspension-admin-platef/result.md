---
tache: T020
statut: fait
---
## Livré
- `G/api/src/session.ts:54-68` — setPasswordAndRevoke : expectedSv, UPDATE…RETURNING, session_conflict
- `G/api/src/server.ts:377-385` — change-password : expectedSv=fresh.sv, 409 session_conflict
- `G/api/src/server.ts:1872` — PATCH org : self_suspend 400 avant SELECT/UPDATE
- `G/api/test/session-fixes.test.ts:1-69` — NEUF, 4 cas du pack

## Vérifié comment
```
npx --prefix api vitest run --root api test/session-fixes.test.ts  (x5 → 5/5 identiques)
 ✓ test/session-fixes.test.ts (4 tests) 953ms
      Tests  4 passed (4)
npm --prefix api run typecheck → tsc -p tsconfig.test.json ; exit=0
npm --prefix api test
 Test Files  70 passed (70)
      Tests  610 passed (610)
test exit=0
git -C G diff --stat -- api/src/session.ts api/src/server.ts api/test/session-fixes.test.ts
 api/src/server.ts | 67 +++++++++++++++++++++++++++++--------------------------
 1 file changed, 35 insertions(+), 32 deletions(-)
git -C G status --short -- api/src/session.ts api/test/session-fixes.test.ts
?? api/src/session.ts
?? api/test/session-fixes.test.ts
```

## Écarts
- ∅ lecture hors WL
- diff --stat server.ts = cumul T018 + T020 vs 745d46f ; part T020 ≈ +10/-1
- session.ts non suivi (??) → absent du diff --stat
- pg-mem accepte UPDATE…RETURNING → 0 fallback

## Pour la suite
- `setPasswordAndRevoke(db, id, hash, { activate?, expectedSv? })` ; expectedSv → throw 'session_conflict' si sv changé
- 409 `{error:'session_conflict'}` sur change-password : le front doit proposer de se reconnecter
- 400 `{error:'self_suspend'}` sur PATCH /api/admin/organizations/:id (sa propre org)
- reset-password / accept-invite / admin reset (server.ts:465,493,1460) : 0 expectedSv, inchangés
- base tests api : 70 fichiers / 610 tests

## Retour sur le pack
- Manquait: `ID` de seed.ts non exporté → org via `getUserByEmail(...).org_id` ; session.ts non suivi git → hors diff --stat
- Inutile: seed.ts:95-115 (ligne 25 DEMO suffisait)
