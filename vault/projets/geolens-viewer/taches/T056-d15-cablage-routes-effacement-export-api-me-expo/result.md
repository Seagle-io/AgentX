---
tache: T056
statut: fait
---
## Livré
- api/src/server.ts:41,58-59 — imports getPlatformOrgIds, erasure, userExport
- api/src/server.ts:275-287 — GET /api/me/export, 5/h, attachment, no-store, audit export_me
- api/src/server.ts:1503-1532 — DELETE user → eraseUser ; 409/404/500 ; audit JSON sans email
- api/src/server.ts:1824,1832,1842 — GET organizations expose contractEndAt (AAAA-MM-JJ|null)
- api/src/server.ts:1891-1914 — PATCH organizations/:id/contract, plateforme seul
- api/test/user-erasure-route.test.ts:1-71 — 4 cas : 200 sans email, 400, 404, 403
- api/test/me-export.test.ts:1-60 — 4 cas : 200 en-têtes/secrets/audit, 401, export_me, 429
- api/test/org-contract.test.ts:1-65 — 6 cas : 200+GET, null, 400, 403, 404, platform_org
## Vérifié comment
`npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` ; TC_EXIT=0
`npx vitest run test/user-erasure-route.test.ts test/me-export.test.ts test/org-contract.test.ts` → `Test Files  3 passed (3)` `Tests  14 passed (14)`
`npm --prefix api test` → TEST_EXIT=0 ; `Test Files  86 passed (86)` `Tests  745 passed (745)`
`git -C G diff --stat -- api` →
```
 api/src/server.ts | 75 ++++++++++++++++++++++++++++++++++++++++++++-----------
 1 file changed, 61 insertions(+), 14 deletions(-)
```
`git -C G status --short api` →
```
 M api/src/server.ts
?? api/test/me-export.test.ts
?? api/test/org-contract.test.ts
?? api/test/user-erasure-route.test.ts
```
hunks server.ts : -40 imports · -56 import · -271 export · -1487/-1506 DELETE user · -1803/-1810/-1819 GET orgs · -1867 route contract → conforme DoD 1
## Écarts
- lecture hors WL : api/src/schema.ts (grep contract_end_at) — type colonne = TIMESTAMPTZ ; 1/3
- contrat C validation : `new Date('2026-13-40T…').toISOString()` lève RangeError → 500 ; garde `Date.parse` + `!Number.isNaN(t)` ajoutée (server.ts:1899-1901) → 400 conforme au cas de test
- cas 409 last_platform_admin : non atteignable par route ; org_admin non plateforme → 403 (resolveTargetUser:anti-élévation) avant eraseUser ; test asserte 403 + compte intact
- import `type EraseCounts` en plus du contrat — typage de `let counts`
- lignes réelles ≠ pack (~:292 → 271 ; ~:1517 → 1487 ; ~:1820 → 1803 ; ~:1873 → 1867)
## Pour la suite
- branches 409 last_platform_admin et 404 not_found de DELETE user = course uniquement ; 0 test route ; couvertes par tests erasure.ts (T054) seulement
- contractEndAt exposé dans GET /api/admin/organizations ; web peut l'afficher/éditer via PATCH …/:id/contract { contractEndAt: 'AAAA-MM-JJ'|null }
- rétention (lot suivant) peut lire organizations.contract_end_at (TIMESTAMPTZ, minuit UTC)
- audit 'delete_user' detail = JSON { userId, orgId, …EraseCounts } — consommateurs UI d'audit affichant detail brut à vérifier
## Retour sur le pack
- Manquait: type colonne contract_end_at (TIMESTAMPTZ) ; formule de validation du contrat C lève sur date impossible ; acteur pour atteindre 409 inexistant (prévu par le pack)
- Inutile: ∅
