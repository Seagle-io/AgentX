---
tache: T025
statut: fait
---
## Livré
- api/src/tilePrefixTag.ts:1-7 — b64url(sha256(prefix)[0..8]), 11 car.
- api/src/config.ts:48-49 — AppConfig.viewerTileCache + doc
- api/src/config.ts:252 — bool(env.VIEWER_TILE_CACHE, false)
- api/src/server.ts:72 — import tilePrefixTag
- api/src/server.ts:657-658 — spread contentTag/viewerUserId sous flag
- .env.production.example:40 — ligne commentée VIEWER_TILE_CACHE=1
- api/test/project-content-tag.test.ts:1-75 — 4 tests : tag, flag on/off, ré-import
## Vérifié comment
`npx vitest run test/project-content-tag.test.ts` → `Test Files 1 passed (1)` · `Tests 4 passed (4)`
`npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · exit=0
`npm --prefix api test` → `Test Files 102 passed (102)` · `Tests 994 passed (994)` (base 101/990 + 1/4)
`git -C G status --short -- api/ .env.production.example` →
```
 M .env.production.example
 M api/src/config.ts
 M api/src/server.ts
?? api/src/tilePrefixTag.ts
?? api/test/project-content-tag.test.ts
```
## Écarts
- lecture hors WL: `rg storage_prefix api/src/tenancy.ts` (1 ligne : ProjectRow.storage_prefix: string) — vérif type, non bloquant
- tests du lecteur : admin DEMO, projet [0] de la liste ; viewerUserId comparé à `(GET /api/auth/me).user.id`
## Pour la suite
- GET /api/projects/:id + `contentTag?: string` (11 car. `[A-Za-z0-9_-]`) et `viewerUserId?: string` seulement si `VIEWER_TILE_CACHE=1`
- flag off → réponse octet pour octet inchangée (champs absents, pas `undefined`)
- clé cache viewer conseillée : `${viewerUserId}:${projectId}:${contentTag}` ; ré-import ⇒ nouveau prefix ⇒ nouveau tag
- storage_prefix absent du JSON (testé sur res.body, flag on et off)
- commit à faire par le chef : 5 fichiers ci-dessus
## Retour sur le pack
- Manquait: type ProjectRow.storage_prefix (string, non nullable) — 1 ligne aurait évité la lecture tenancy.ts
- Inutile: ∅
