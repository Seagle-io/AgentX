---
tache: T055
statut: fait
---
## Livré
- `api/src/userExport.ts:1-101` NEUF — types UserExportV1, buildUserExport, exportFilename
- `api/src/userExport.ts:11` — import `tableExists` de `./projectTeardown.js` (T053, présent)
- `api/src/userExport.ts:32-96` — SELECT colonnes explicites, 0 `SELECT *`, LEFT JOIN org/projet
- `api/test/user-export-unit.test.ts:1-96` NEUF — 6 cas, fixtures SQL `x-*`
- cas 1 avec `USER_LAYERS_ENABLED=1` + 1 couche → couvre branche layers présente
## Vérifié comment
```
npx --prefix api vitest run --root api test/user-export-unit.test.ts
 ✓ test/user-export-unit.test.ts (6 tests) 1082ms
 Test Files  1 passed (1)
      Tests  6 passed (6)
npm --prefix api run typecheck
> tsc -p tsconfig.test.json
exit=0
git -C G status --short api
 M api/src/server.ts
?? api/src/erasure.ts
?? api/src/projectTeardown.ts
?? api/src/userExport.ts
?? api/test/erasure-unit.test.ts
?? api/test/project-teardown.test.ts
?? api/test/user-export-unit.test.ts
```
## Écarts
- 1re version : sonde locale `project_layers` (projectTeardown.ts absent) → remplacée par import `tableExists` dès présence ; tests + typecheck relancés après
- lecture hors WL: `rg "^export" api/src/projectTeardown.ts` — signature `tableExists(db: Db, table: string): Promise<boolean>`
- lecture hors WL: `rg USER_LAYERS_ENABLED api/src/config.ts test/` — défaut OFF confirmé
- test 0 secret : hash argon2 = littéral fixture `$argon2id$…`, pas un hash calculé
## Pour la suite
- `buildUserExport(db, session.id, now)` → null ⇒ 404 ; `exportFilename(now)` pour Content-Disposition
- userExport.ts dépend de `projectTeardown.ts#tableExists` (T053) : ne pas renommer
- tri déterministe : audit/artifacts/layers par created_at,id ; sidecars par project_id,kind,scope
- export non paginé : volume audit_log par user non borné — à surveiller côté route
## Retour sur le pack
- Manquait: signature `tableExists` (fichier T053) ; défaut flag USER_LAYERS_ENABLED dans tests | Inutile: `login` de helpers.ts
