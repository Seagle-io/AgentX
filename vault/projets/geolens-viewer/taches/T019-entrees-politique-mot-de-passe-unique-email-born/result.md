---
tache: T019
statut: bloque
---
## Livré
- api/src/passwordPolicy.ts:L1-L14 — NEUF, contrat verbatim, 0 import
- api/src/emailSchema.ts:L1-L17 — NEUF, contrat verbatim, 0 import
- api/src/server.ts:L42-L43 — imports passwordProblem, normalizeEmail, EMAIL_UNAVAILABLE
- api/src/server.ts:L371-L372 — change-password → passwordProblem
- api/src/server.ts:L404 — contact replyTo → normalizeEmail ?? u.email
- api/src/server.ts:L433-L434 — forgot-password : null → uniform (inchangé)
- api/src/server.ts:L461-L462,L485-L486 — reset / accept-invite → passwordProblem
- api/src/server.ts:L1364-L1374,L1401 — admin/users : 10/h, email+mdp, 409 générique
- api/src/server.ts:L1538-L1554 — invitations : 10/h, normalizeEmail, 409 générique
- api/test/input-policy.test.ts:L1-L110 — NEUF, 7 tests, cas du pack

## Vérifié comment
```
rg -n "existe déjà|length < [68]|/\.\+@\.\+" api/src/server.ts → ∅ (rc=1)
npx --prefix api vitest run --root api test/input-policy.test.ts
 ✓ test/input-policy.test.ts (7 tests) 734ms
 Tests  7 passed (7)
npm --prefix api run typecheck → typecheck_rc=0
npm --prefix api test
 FAIL  test/admin.test.ts > admin org > l'admin crée un user → il peut se connecter mais ne voit AUCUN projet, puis on lui donne accès
 AssertionError: expected 400 to be 201
 ❯ test/admin.test.ts:32:31
 Test Files  1 failed | 70 passed (71)
      Tests  1 failed | 616 passed (617)
api/test/admin.test.ts:30 → payload: { email, password: 'secret9', role: 'member' }   (7 car < 8)
git diff --stat -- api/src/server.ts → 1 file changed, 56 insertions(+), 54 deletions(-)  (inclut T007/T014 non commités)
git status --short api → T019 : ?? emailSchema.ts, passwordPolicy.ts, input-policy.test.ts + M server.ts ; autres M/?? = T007/T014 préexistants
```

## Écarts
- lecture hors WL: api/test/admin.test.ts:L26-L33 — test cassé, BLQ du pack exige nom:ligne
- DoD 8 non cochée — admin.test.ts:32 KO (mdp 7 car)
- code T019 laissé en place ; 0 test existant modifié

## Pour la suite
- BLQ : admin.test.ts:30 `password: 'secret9'` (7) refusé par min 8 → 400
- fix trivial : 'secret9' → 'secret99' dans admin.test.ts:30 (+ login éventuel même test)
- Question : autorises-tu la modification de api/test/admin.test.ts (mot de passe du fixture → ≥ 8 car), via une nouvelle tâche ou un pack T019 amendé ?
- après fix : relancer `npm --prefix api test` → attendu 617/617

## Retour sur le pack
- Manquait: rg des fixtures mdp < 8 dans api/test (rg "password: '[^']{1,7}'") — aurait listé admin.test.ts:30
- Inutile: ∅
