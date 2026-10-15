---
tache: T057
statut: fait
---
## Livré
- api/src/retention.ts:1-154 — NEUF : 3 purges, passe, planificateur (contrat)
- api/src/config.ts:129-141 — AppConfig.retention, type RetentionMode, parseur mode
- api/src/config.ts:197,281-291 — défauts off(pg-mem)/report ; livrables jamais enforce hérité
- api/src/config.ts:320-322 — productionProblems : mode invalide → message contrat
- api/src/server.ts:59 — import startRetentionScheduler
- api/src/server.ts:480 — LEGAL_DOCS_VERSION '2026-10-08'
- api/src/server.ts:2478 — appel planificateur après hook sweepTimer
- .env.production.example:50-54 — bloc RETENTION (contrat verbatim)
- api/test/retention.test.ts:1-187 — NEUF : 11 cas (audit, comptes, livrables, passe)
- api/test/retention-config.test.ts:1-79 — NEUF : 7 cas (défauts, prod, scheduler)
## Vérifié comment
`npm --prefix api run typecheck; echo $?` → `tsc -p tsconfig.test.json` · `typecheck exit=0`
`npx vitest run test/retention.test.ts test/retention-config.test.ts` → `Test Files 2 passed (2) · Tests 18 passed (18)`
`npm --prefix api test` → `Test Files 88 passed (88) · Tests 763 passed (763) · Duration 15.97s`
`git -C G diff --stat -- api .env.production.example` →
```
 .env.production.example |  5 +++++
 api/src/config.ts       | 29 +++++++++++++++++++++++++++++
 api/src/server.ts       |  4 +++-
 3 files changed, 37 insertions(+), 1 deletion(-)
```
`git -C G status --short api` →
```
 M api/src/config.ts
 M api/src/server.ts
?? api/src/retention.ts
?? api/test/retention-config.test.ts
?? api/test/retention.test.ts
```
pg-mem `TIMESTAMPTZ < $1` (ISO) prouvé : audit enforce supprime vieux, garde récent.
## Écarts
- lecture hors WL: api/src/schema.ts:18-150 — colonnes NOT NULL pour fixtures de test
- lecture hors WL: api/src/db.ts:13-23 — interface Db (rowCount, rows)
- ancres décalées : LEGAL_DOCS_VERSION :479 (pack ~:463), sweepTimer :2474-2476 (pack ~:2426)
- mode parsé trim + casse exacte : 'ENFORCE' → invalide → refus prod — fail-closed
- purgeAuditLog enforce : candidates = acted = rowCount — contrat muet
- runRetentionPass : + log.info par purge ; purge en throw → 0 ligne audit
- tests livrables : storage factice (deletePrefix spy) — jamais rm sous seed-data
## Pour la suite
- retention actif seulement si !useMemDb : prod démarre en `report` (journalise, 0 suppression)
- 1er `enforce` (RETENTION_MODE puis RETENTION_DELIVERABLES_MODE) = décision humaine, lire audit `retention_*` d'abord
- timer in-process : > 1 réplique API → passer à un verrou DB ou cron externe
- RetentionMode exporté de config.ts, ré-exporté par retention.ts
- casse exacte des modes : documenter dans DEPLOYMENT.md (hors périmètre ici)
## Retour sur le pack
- Manquait: colonnes schéma users/organizations/projects/audit_log (fixtures) ; interface Db ; numéros de ligne server.ts à jour ; sémantique `candidates` en audit enforce
- Inutile: api/test/prod-guard.test.ts (modèle trivial)
