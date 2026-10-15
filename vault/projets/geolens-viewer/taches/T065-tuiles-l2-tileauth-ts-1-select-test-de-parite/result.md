---
tache: T065
statut: fait
---
## Livré
- G/api/src/tileAuth.ts:L1-L42 — NEUF, TileGrant + TILE_GRANT_SQL verbatim + resolveTileGrant
- G/api/test/tile-auth-parity.test.ts:L1-L102 — NEUF, 13 users × 6 projets + espion
## Vérifié comment
`npx --prefix api vitest run --root api test/tile-auth-parity.test.ts` →
```
 ✓ test/tile-auth-parity.test.ts (15 tests) 1165ms
 Test Files  1 passed (1)
      Tests  15 passed (15)
```
`npm --prefix api run typecheck; echo $?` → `typecheck exit=0`
`git -C G status --short api` →
```
 M api/src/config.ts
 M api/src/logRedact.ts
 M api/src/storage.ts
?? api/src/tileAuth.ts
?? api/src/tileRateKey.ts
?? api/src/tileRedirect.ts
?? api/test/log-redact-s3.test.ts
?? api/test/presign-get.test.ts
?? api/test/tile-auth-parity.test.ts
?? api/test/tile-rate-key.test.ts
```
(2 miens = tileAuth.ts, tile-auth-parity.test.ts ; reste = autres agents)
## Écarts
- lecture hors WL: api/test/erasure-unit.test.ts:1-40 — obtenir Db en test (`app.db`)
- lecture hors WL: `rg "^export" api/src/db.ts` — `Db`, `createDb`
- user org_id NULL : non testé — schema.ts:59 `users.org_id NOT NULL`
- normalisation `'t'` retirée : pg-mem rend `tg_allowed` booléen (test vert sans) — 0 code mort
- SQL = contrat verbatim, 0 divergence avec tenancy.ts révélée
- cas couverts : membre A {PA,∅,PB,PS,PO orphelin} · org_admin A, org_admin B · admin plateforme (PA,PB,PS,PO,PC) · disabled · pending · org C suspendue (membre + org_admin) · user absent · projet absent
- garde anti-« tout null » : table EXPECTED des couples autorisés, comparée en plus de la référence
## Pour la suite
- L4 server.ts : route tuile → `resolveTileGrant(db, payload.u, payload.p)` ; null → 403 ; resolveSignedProject reste pour vignettes/objets
- toute règle d'accès : modifier tenancy.ts:87-121 ET TILE_GRANT_SQL, test parité = garde
- admin plateforme d'une org suspendue : refusé (checkUserAccess) — identique référence, non testé explicitement
## Retour sur le pack
- Manquait: comment obtenir un `Db` en test (`makeTestApp().db`, server.ts:162 decorate) + signature `Db` — 2 lectures hors WL
- Inutile: repo.ts getUserById ; helpers.ts hors makeTestApp
