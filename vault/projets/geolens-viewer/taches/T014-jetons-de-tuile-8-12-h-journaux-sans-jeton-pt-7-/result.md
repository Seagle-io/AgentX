---
tache: T014
statut: fait
---
## Livré
- api/src/tileExp.ts:1-15 — NEUF, tileTokenExp pur, contrat verbatim
- api/src/logRedact.ts:1-34 — NEUF, redactUrl/serializeReq/loggerOptions, contrat verbatim
- api/src/config.ts:21-24 — AppConfig + tileUrlWindowSec, doc TTL = MIN
- api/src/config.ts:132-136 — posInt local (≥ 60, sinon défaut)
- api/src/config.ts:152-153 — TTL 28800 / fenêtre 14400 via posInt
- api/src/server.ts:12-13 — imports tileTokenExp, loggerOptions
- api/src/server.ts:163 — Fastify({ logger: loggerOptions(...) })
- api/src/server.ts:497-500 — commentaire C-02 : fenêtre W 4 h, (T, T+W]
- api/src/server.ts:506 — quantizedTileExp → tileTokenExp(config, Date.now())
- api/test/tile-window.test.ts:1-49 — NEUF, 7 cas
- api/test/log-redact.test.ts:1-38 — NEUF, 7 cas
## Vérifié comment
- `rg -n "process\.env" api/src --glob '!config.ts'` → (vide), rg exit=1
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · exit=0
- `npm --prefix api test` → `✓ test/log-redact.test.ts (7 tests)` · `✓ test/tile-window.test.ts (7 tests)` · `✓ test/boot.test.ts (4 tests)` · `Test Files  69 passed (69)` · `Tests  606 passed (606)`
- `npx --prefix api vitest run --root api test/auth-and-tiles.test.ts` → `Tests  10 passed (10)`
- `git -C G diff --stat -- api` →
```
 api/src/auth.ts   | 21 ++++++++++++--------
 api/src/config.ts | 13 +++++++++++--
 api/src/repo.ts   |  2 ++
 api/src/schema.ts |  4 ++++
 api/src/server.ts | 58 +++++++++++++++++++++++++------------------------------
```
- untracked api (git status) : tileExp.ts, logRedact.ts, tile-window.test.ts, log-redact.test.ts (T014) ; session.ts, org-suspension/session-revocation/session-unit.test.ts (T007)
- auth/repo/schema = T007, non touchés ; server.ts diff inclut T007
- NV — log réel `logger: true` (pino) non observé ; couvert par typecheck + tests unitaires
## Écarts
- server.ts:12-13 — 2 imports ajoutés, hors « 0 autre ligne » — requis par contrat
- lecture hors WL : ∅
## Pour la suite
- server.ts IMMUTABLE_CACHE `max-age=86400` (+ commentaire :779 « 24 h ») > validité jeton 8-12 h → aligner sur T+W ?
- `.env*` / docker-compose peuvent encore fixer TILE_TOKEN_TTL_SEC=3600 / TILE_URL_WINDOW_SEC=86400 → écrase défauts, non vérifié (hors WL)
- TILE_URL_WINDOW_SEC < TILE_TOKEN_TTL_SEC désormais accepté (ancien Math.max retiré) — validité reste (T, T+W]
- logRedact : seul `req.url` masqué ; `res`/erreurs loguant l'URL brute ∅ vérifié
- DEPLOYMENT.md : documenter TTL 28800 / fenêtre 14400
## Retour sur le pack
- Manquait: type `opts.logger` (boolean, server.ts:81) utile ; mention « imports autorisés » dans DoD server.ts
- Inutile: boot.test.ts en L (loadConfig({}) suffisait)
