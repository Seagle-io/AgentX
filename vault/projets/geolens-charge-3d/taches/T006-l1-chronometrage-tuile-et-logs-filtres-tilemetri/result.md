---
tache: T006
statut: fait
---
## Livré
- `G/api/src/tileMetrics.ts:1-203` — neuf ; C1 verbatim ; histogramme 148 seaux, log 1/fenêtre
- `G/api/src/config.ts:48-49,226` — `tileSlowMs` + `intIn(TILE_SLOW_MS,500,50,60000)`
- `G/api/src/logRedact.ts:5,39-45` — `loggerOptions(enabled, stream?)` ; sans stream → objet inchangé
- `G/api/src/server.ts:13,97,156,733,741-742,752,792` — points d'appel C1 ; route en logLevel warn
- `G/api/test/tile-metrics.test.ts:1-227` — neuf ; 21 cas (seaux, quantiles, core, ligne, Fastify nu + fake timers)
- `G/api/test/tile-route-logs.test.ts:1-120` — neuf ; 7 cas buildServer+logStream : 200→0 ligne, 403/404/503/lente, tile metrics, jeton ∅
- `G/api/test/log-redact.test.ts:35-43` — +2 cas loggerOptions (toStrictEqual, stream)
## Vérifié comment
- `npm --prefix api run typecheck` → exit=0
- `npm --prefix api test` → `Test Files  98 passed (98)` · `Tests  854 passed (854)`
- `npx vitest run tile-metrics tile-route-logs log-redact tile-route-redirect` → `Test Files 4 passed (4)` · `Tests 46 passed (46)`
- `rg -n "req\.(query|url)" api/src/tileMetrics.ts` → ∅ (exit 1)
- `rg -n "\bany\b|process\.env|ts-ignore" api/src/tileMetrics.ts` → ∅ ; seul import : `import type { FastifyInstance } from 'fastify'`
- `wc -l tileMetrics.ts` → 203 ; plus longue fonction registerTileMetrics :147-203 = 57 l
- `git diff --quiet -- api/test/tile-route-redirect.test.ts` → exit 0 ; vert (9/9)
- mutation `logLevel: 'info'` → tile-route-logs 2 KO (200→0 ligne, `token=[redacted]` présent) ; remis à `'warn'`
- `git -C G diff --stat -- api/src/server.ts` → `api/src/server.ts | 13 ++++++++-----` · `1 file changed, 8 insertions(+), 5 deletions(-)`
- `git -C G status --short -- api/` → M config.ts, logRedact.ts, server.ts, test/log-redact.test.ts ; ?? tileMetrics.ts, tile-metrics.test.ts, tile-route-logs.test.ts
## Écarts
- DoD server.ts : 3 lignes ajoutées + 5 modifiées (≠ 4) — options de route sur 1 ligne `{ config: … }` : y insérer `logLevel…` force à la modifier (`server.ts:741-742`)
- `FastifyLoggerStreamDestination` non exporté par `fastify` (racine) → `import type … from 'fastify/types/logger.js'` (server.ts:13, logRedact.ts:5) ; pas de champ `exports` → OK sous NodeNext
- type importé sur la ligne d'import existante server.ts:13 (pas de +1 ligne)
- lecture hors WL: `api/src/relayGate.ts:1-40` — idiome hooks de route + WeakSet
- lecture hors WL: `api/node_modules/fastify/fastify.d.ts` (grep) — export du type stream
- lecture hors WL: `api/node_modules/fastify/package.json` (exports) + tsconfig*.json — import profond valide
## Pour la suite
- `TILE_SLOW_MS` (déf. 500, [50, 60000]) à documenter dans le .env/DEPLOYMENT (hors WL)
- ligne prod : `{"level":40,"reqId","status","ms","project","tile","ip","sql"?,"storage"?,"send"?,"msg":"tile 4xx"}` ; agrégat : `msg:"tile metrics"`, `tileMetrics.{phases,status,slow,logSuppressed}`
- `slow` compté pour tout statut (304/4xx lents inclus) ; `send` seulement 200|206
- 404/503 → 2 lignes (warn existant + tile 4xx/5xx), accepté D6
- logStream dans BuildOptions réutilisable pour tout test de logs (buildServer({ logger: true, logStream }))
## Retour sur le pack
- Manquait: section « Tests » référencée par la DoD absente du pack ; `FastifyLoggerStreamDestination` non exporté par `fastify` racine (chemin d'import) ; budget server.ts incompatible avec options de route sur 1 ligne
- Inutile: ∅
