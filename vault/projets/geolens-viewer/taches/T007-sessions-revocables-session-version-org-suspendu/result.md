---
tache: T007
statut: fait
---
## Livré
- G/api/src/session.ts:1-63 — NEUF, contrat verbatim 6 fn 4 types
- G/api/src/auth.ts:12 — import validateSession, type SessionClaims
- G/api/src/auth.ts:42 — payload `SessionUser & { sv?: number }`
- G/api/src/auth.ts:80-92 — requireAuth contrat : sv + état DB, cookie effacé
- G/api/src/repo.ts:18-19 — UserRow.session_version: number
- G/api/src/schema.ts:72-74 — colonne CREATE users (avant created_at)
- G/api/src/schema.ts:85 — ALTER idempotent session_version, 0 `;` en commentaire
- G/api/src/server.ts:38 — import session.js
- G/api/src/server.ts:273-282 — resolveSignedProject → resolveActiveUser (org suspendue → 403)
- G/api/src/server.ts:305 — login → signSession (sv dans JWT)
- G/api/src/server.ts:323-336 — /me → validateSession, fresh = c.row
- G/api/src/server.ts:375-376 — change-password : bump + cookie réémis
- G/api/src/server.ts:455,483 — reset self / accept-invite : bump + activate
- G/api/src/server.ts:1455 — admin reset : bump
- G/api/test/session-revocation.test.ts:1-133 — 9 cas A2
- G/api/test/session-unit.test.ts:1-43 — 8 cas checkUserAccess
- G/api/test/org-suspension.test.ts:1-55 — 4 cas PT-3
## Vérifié comment
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · EXIT=0, 0 erreur
- `npx vitest run test/session-revocation.test.ts test/session-unit.test.ts test/org-suspension.test.ts` → `Test Files 3 passed (3)` · `Tests 21 passed (21)`
- `npm --prefix api test` → `Test Files 67 passed (67)` · `Tests 592 passed (592)` · EXIT=0 (571 base + 21)
- `wc -l api/src/server.ts` → 3384 (≤ 3392)
- `git diff --stat -- api` → auth.ts 21 · repo.ts 2 · schema.ts 4 · server.ts 43 (39+ 31−) ; `??` session.ts, 3 tests
- `git diff --stat` global → 33 fichiers dont 29 hors api/ (web/, worker/, e2e/, Caddyfile, DEPLOYMENT.md…) = agents parallèles, 0 de T007
## Écarts
- lecture hors WL: api/src/db.ts (grep rowCount) — sémantique UPDATE rowCount pg-mem
- lecture hors WL: api/src/seed.ts (grep DEMO) — clés DEMO.memberEmail/memberPassword
- lecture hors WL: api/package.json — scripts test/typecheck
- server.ts /me : `const u = c.user` omis — tsc TS6133 u inutilisé (L342+ lit fresh)
- schema.ts : colonne placée après last_login (L71), avant created_at — conforme « après L71 »
## Pour la suite
- requireAuth = 1 SELECT users⋈organizations par requête ; JWT porte `sv`
- toute écriture de password_hash → `setPasswordAndRevoke` (session.ts), jamais UPDATE direct
- jeton tuile (resolveSignedProject) : état user/org vérifié, sv NON comparé — fenêtre = lot A2b
- change-password : seul site qui réémet le cookie ; reset/invite/admin-reset : bump sans cookie
- route PATCH /api/admin/users rôle/disabled : pas de bump, effet via requireAuth (ligne DB)
## Retour sur le pack
- Manquait: `noUnusedLocals` actif → « u = c.user » du contrat /me inutilisable · DEMO.memberEmail/memberPassword non listés · forme du cookie effacé (`glx_session=;`) non donnée
- Inutile: ∅
