---
tache: T054
statut: fait
---
## Livré
- api/src/erasure.ts:1-99 — NEUF, eraseUser 1 tx, contrat verbatim
- api/src/erasure.ts:15 — tableExists importé de projectTeardown.js (T053 commité 082876c)
- api/src/erasure.ts:41-50 — pré-tx : not_found, last_platform_admin, sonde hors tx
- api/src/erasure.ts:52-97 — 8 étapes ordre strict, counts = rowCount
- api/test/erasure-unit.test.ts:1-155 — NEUF, 6 cas du pack
## Vérifié comment
```
npx --prefix api vitest run --root api test/erasure-unit.test.ts
 ✓ test/erasure-unit.test.ts (6 tests) 537ms
 Test Files  1 passed (1)
      Tests  6 passed (6)
npm --prefix api run typecheck → tsc -p tsconfig.test.json ; typecheck exit=0
git status --short api
?? api/src/erasure.ts
?? api/src/userExport.ts
?? api/test/erasure-unit.test.ts
?? api/test/user-export-unit.test.ts
```
- userExport.ts + user-export-unit.test.ts = T055
- cas flag OFF : asserte d'abord `SELECT 1 FROM project_layers` rejeté (table absente prouvée)
- cas complet : counts = {1,1,1,1,1,1,1,auditOwn 2,auditScrubbed 1} ; detail admin cite email 2× → 2 remplacements
## Écarts
- 1re version : sonde tableExists copiée localement (projectTeardown.ts absent) ; remplacée par l'import dès T053 commité — 0 duplication
- lecture hors WL (grep) : server.ts:93-110 — sonde tableExists à copier
- lecture hors WL (grep) : seed.ts / config.ts — DEMO.adminEmail, USER_LAYERS_ENABLED
- lecture hors WL (grep) : projectTeardown.ts:21 — signature export tableExists
- EraseError : super(code) + name='EraseError' — corps non spécifié au contrat
## Pour la suite
- `import { eraseUser, EraseError, ERASED_USER_ID, ERASED_LABEL } from './erasure.js'` ; EraseError.code ∈ not_found | last_platform_admin → 404 / 409
- route DELETE user : appeler eraseUser puis audit() APRÈS (module sans audit) ; audit avec email de M le réintroduirait → ne pas logguer l'email
- pg-mem : ROLLBACK non effectif → atomicité sur échec testable seulement en Postgres réel
- `ERASED_USER_ID='__erased__'` absent de users : tout JOIN users sur owner_user_id de project_layers doit tolérer l'orphelin
## Retour sur le pack
- Manquait: seed.ts (DEMO) en L ; signature de tableExists de projectTeardown.ts | Inutile: helpers.ts login, userLayers.ts (DDL suffisait en contrat)
