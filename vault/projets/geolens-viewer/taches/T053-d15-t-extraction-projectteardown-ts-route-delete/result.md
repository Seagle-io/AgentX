---
tache: T053
statut: fait
---
## Livré
- G/api/src/projectTeardown.ts:1-97 — NEUF : isMissingRelation, tableExists, teardownProject (verbatim)
- G/api/src/server.ts:56 — import teardownProject, type TeardownResult
- G/api/src/server.ts:93-111(ancien) — 2 helpers supprimés
- G/api/src/server.ts:2920-2931 — route DELETE → teardownProject, guardNote/audit identiques
- G/api/test/project-teardown.test.ts:1-78 — NEUF : 3 cas (uploadé, partagé, sans project_layers)
## Vérifié comment
- `npm --prefix api run typecheck` → `typecheck exit=0`
- `npx --prefix api vitest run --root api test/project-teardown.test.ts test/delete.test.ts test/delete-user-layers.test.ts test/scenes-shared-prefix.test.ts` →
```
 ✓ test/project-teardown.test.ts (3 tests) 670ms
 ✓ test/scenes-shared-prefix.test.ts (4 tests) 744ms
 ✓ test/delete-user-layers.test.ts (3 tests) 843ms
 ✓ test/delete.test.ts (6 tests) 854ms
 Test Files  4 passed (4)
      Tests  16 passed (16)
```
- `npm --prefix api test` → `test exit=0` · `Test Files  83 passed (83)` · `Tests  731 passed (731)`
- `git -C G diff --stat -- api/src/server.ts` → `api/src/server.ts | 87 ++++---------------------------------------------------` · `1 file changed, 6 insertions(+), 81 deletions(-)`
- `git -C G status --short api` →
```
 M api/src/server.ts
?? api/src/erasure.ts
?? api/src/projectTeardown.ts
?? api/src/userExport.ts
?? api/test/erasure-unit.test.ts
?? api/test/project-teardown.test.ts
?? api/test/user-export-unit.test.ts
```
(erasure*/userExport*/user-export* = T054/T055, non touchés)
## Écarts
- isMissingRelation/tableExists NON importés dans server.ts — 0 appelant restant (rg), noUnusedLocals
- erreur isPrefixShared : avant → 500 handler fastify par défaut ; maintenant → 500 `delete_failed` (try du contrat englobe teardownProject)
- `makeTestApp` inexistant dans modèles WL → `buildServer` + `loadConfig` (modèle delete.test.ts)
- commentaires de la route déplacés dans projectTeardown.ts ; en-tête route :2905-2909 conservé
- 0 lecture hors WL
## Pour la suite
- `import { teardownProject, tableExists, isMissingRelation, type ProjectRef, type TeardownResult } from './projectTeardown.js'` — G/api/src/projectTeardown.ts
- `teardownProject(db, storage, log, {id, org_id, storage_prefix})` : throw = DB intacte + 0 fichier ; audit à faire par l'appelant
- log : `Pick<FastifyBaseLogger,'warn'|'error'>` → `app.log` direct
- test helper : pas de `makeTestApp` ; patron = buildServer({config: loadConfig({USE_MEM_DB:'1',STORAGE_DRIVER:'local',STORAGE_LOCAL_ROOT})})
## Retour sur le pack
- Manquait: `makeTestApp` nommé mais inexistant ; DoD « importées » contredite par noUnusedLocals si 0 appelant restant
- Inutile: storage.ts (L) — signature deletePrefix suffisait dans le contrat
