---
tache: T029
statut: fait
---
## Livré
- api/src/config.ts:32-33 — `trustProxy: string[] | false` + doc
- api/src/config.ts:140-147 — `hops()` → `proxyList()` contrat, fail-closed
- api/src/config.ts:168 — `trustProxy: proxyList(env.TRUST_PROXY)`
- api/src/server.ts:165 — `trustProxy: config.trustProxy`
- .env.production.example:10 — `TRUST_PROXY=uniquelocal` ligne contrat
- api/test/rate-limit-proxy.test.ts:1-61 — réécrit, 5 cas du pack
## Vérifié comment
`npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` ; exit=0
`npx --prefix api vitest run --root api test/rate-limit-proxy.test.ts` → `Test Files 1 passed (1) · Tests 5 passed (5)`
`npm --prefix api test` → `Test Files 72 passed (72) · Tests 622 passed (622)`
`git -C G diff --stat -- api .env.production.example` →
```
 .env.production.example |  1 +
 api/package-lock.json   | 71 ++++++++++++++++++++++++++++++++++++-------------
 api/package.json        |  4 +--
 api/src/config.ts       | 12 +++++++++
 api/src/server.ts       |  2 +-
 5 files changed, 69 insertions(+), 21 deletions(-)
```
`git status --short` → `?? api/test/rate-limit-proxy.test.ts` (non suivi, absent du diff --stat)
## Écarts
- ∅
## Pour la suite
- `TRUST_PROXY` = liste IP/CIDR ou loopback|linklocal|uniquelocal ; 1 entrée invalide → false (XFF ignoré)
- prod : `uniquelocal` sûr seulement si l'API ne publie aucun port (compose à vérifier, hors WL)
- api/test/rate-limit-proxy.test.ts non suivi git → à inclure au commit humain
- diff .env.production.example 1 + / 0 − vs HEAD : TRUST_PROXY ajouté par T024
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
