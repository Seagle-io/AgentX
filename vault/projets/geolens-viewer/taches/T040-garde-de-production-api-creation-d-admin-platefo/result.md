---
tache: T040
statut: fait
---
## Livré
- api/src/config.ts:L257-L294 — productionProblems R1-R8 + loadProductionSafeConfig
- api/src/index.ts:L2,L6 — démarrage via loadProductionSafeConfig()
- api/src/scripts/create-platform-admin.ts:L1-L73 — NEUF, createPlatformAdmin + main argv
- api/package.json:L17-L18 — script `admin:create`
- api/test/prod-guard.test.ts:L1-L149 — NEUF, 27 tests garde + création admin
## Vérifié comment
- `npx --prefix api vitest run --root api test/prod-guard.test.ts` → `Test Files 1 passed (1) · Tests 27 passed (27)`
- `npm --prefix api run typecheck` → `typecheck exit=0`
- `npm --prefix api test` → `Test Files 75 passed (75) · Tests 667 passed (667)`
- `ls api/dist` au départ → `impossible d'accéder à 'api/dist'` (absent)
- `npm --prefix api run build` → `build exit=0` ; `ls api/dist/scripts/create-platform-admin.js` → présent ; `rm -r api/dist` → `ls api/dist` absent
- `node dist/scripts/create-platform-admin.js` → usage, `exit=2`
- `GEOLENS_ENV=production node dist/scripts/create-platform-admin.js --email a@b.fr --org X` → `Configuration de production invalide — démarrage refusé :` + 7 lignes `- …`, `exit=1`
- `node dist/scripts/create-platform-admin.js --email pas-email --org X` → `email invalide`, `exit=1`
- `wc -l api/src/config.ts` → `294 api/src/config.ts`
- `git -C G status --short` → `M api/package.json · M api/src/config.ts · M api/src/index.ts · ?? api/src/scripts/create-platform-admin.ts · ?? api/test/prod-guard.test.ts` — server.ts intact
## Écarts
- lecture hors WL: `rg passwordProblem api/src` → api/src/passwordPolicy.ts:11 — test exige passwordProblem(pw) === null
- lecture hors WL: `rg app.db api/test api/src/server.ts` → server.ts:177 `app.decorate('db', db)` — accès db de test
- lecture hors WL: G/.env.production.example — format KEY=VAL + commentaires `  # …` en fin de ligne
- G HEAD = `d3060e2` (T038), ≠ `745bc54` du pack — sans effet
- test R2 `USE_MEM_DB=1` force `SEED_DEMO=0` — seedDemo défaut = useMemDb, sinon R4 aussi
## Pour la suite
- `createDb` ne migre pas : script utilisable seulement sur Postgres déjà migré (API démarrée 1 fois) ; en dev pg-mem → tables absentes
- `admin:create` en prod passe aussi par la garde : env du conteneur api doit être conforme (GEOLENS_ENV posé par compose T039)
- `.env.production.example` tel quel → 2 problèmes : JWT_SECRET + clés S3 `__…__` ; SMTP `__…__` non contrôlé (hors R1-R8)
- R2 avec USE_MEM_DB=1 déclenche R4 si SEED_DEMO absent — messages cumulés, voulu
- argon2 hash ≈ 100 ms/test ; suite 667 tests (640 + 27)
## Retour sur le pack
- Manquait: passwordProblem → api/src/passwordPolicy.ts ; accès db test = `app.db` (server.ts:177) ; format .env.production.example ; HEAD réel d3060e2
- Inutile: ∅
