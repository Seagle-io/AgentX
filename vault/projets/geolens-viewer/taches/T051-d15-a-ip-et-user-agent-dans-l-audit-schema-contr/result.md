---
tache: T051
statut: fait
---
## Livré
- api/src/requestContext.ts:1-29 — NEUF, ALS preValidation, contrat verbatim
- api/src/repo.ts:6 — import currentRequestMeta
- api/src/repo.ts:147-150 — audit() insère ip/user_agent, signature inchangée
- api/src/repo.ts:157-162 — getPlatformOrgIds → Set org_id admins plateforme
- api/src/schema.ts:44-45 — organizations.contract_end_at dans CREATE
- api/src/schema.ts:55 — ALTER organizations contract_end_at
- api/src/schema.ts:143-146,149-152 — audit_log ip/user_agent + 2 ALTER + 2 INDEX
- api/src/server.ts:29,251 — import + registerRequestContext(app) après registerAuth
- api/test/audit-context.test.ts:1-92 — NEUF, 8 cas
## Vérifié comment
base avant modif : `npm --prefix api test` → `Test Files 79 passed (79) · Tests 708 passed (708)`
`npx --prefix api vitest run --root api test/audit-context.test.ts` → `✓ test/audit-context.test.ts (8 tests) 1211ms · Tests 8 passed (8)`
`npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · typecheck_exit=0
`npm --prefix api test` → `Test Files 80 passed (80) · Tests 716 passed (716)`
`git diff --stat -- api` →
```
 api/src/repo.ts   | 12 ++++++++++--
 api/src/schema.ts | 11 +++++++++++
 api/src/server.ts |  2 ++
 3 files changed, 23 insertions(+), 2 deletions(-)
?? api/src/requestContext.ts
?? api/test/audit-context.test.ts
```
`git diff -- api/src/server.ts` → 2 lignes `+`, 0 `-`
`grep -n ";" schema.ts | grep -- "--"` → 0 commentaire SQL avec `;`
## Écarts
- lecture hors WL: api/src/seed.ts (grep `export const DEMO`) — DEMO.adminEmail/adminPassword absents du pack
- cas « migrate() rejoué » KO sous pg-mem, antérieur à D15 : `CREATE TABLE IF NOT EXISTS organizations` sur table existante → `🔨 Not supported 🔨 … parts have not been read by the query planner` (contraintes PK/NOT NULL/DEFAULT) → remplacé par : rejeu des 5 instructions D15 extraites de SCHEMA_SQL, tolérance ALTER identique à migrate(), puis SELECT colonnes OK
- hook preValidation suffit (cas POST JSON change-password vert) → pas de repli preHandler
- pack dit « 7 cas », en liste 8 → 8 écrits
## Pour la suite
- `currentRequestMeta()` dispo pour tout lot D15 : ip/UA sans toucher aux appels audit()
- `getPlatformOrgIds(db): Promise<Set<string>>` dans repo.ts, prêt pour exclusion org plateforme
- `organizations.contract_end_at TIMESTAMPTZ` NULL partout, aucune route ne l'écrit encore
- migrate() n'est PAS rejouable sous pg-mem (CREATE TABLE IF NOT EXISTS) : ne jamais demander ce test, rejouer le DDL ciblé
- index idx_audit_log_created_at / idx_audit_log_user posés pour retention/export
## Retour sur le pack
- Manquait: DEMO (adminEmail, adminPassword) de seed.ts ; limite pg-mem sur rejeu migrate()
- Inutile: ∅
