---
tache: T064
statut: fait
---
## Livré
- api/src/storage.ts:166-167 — `presignGet?` dans StorageDriver après signUploadPart
- api/src/storage.ts:187-191 — `PresignGetOptions`, `PresignedGet` (contrat verbatim)
- api/src/storage.ts:581-594 — S3 presignGet, signingDate quantifiée ttl/2 ; local ∅
- api/src/storage.ts:672-678 — `s3PublicOrigin` : path-style origin, sinon bucket.host
- api/src/config.ts:31-33 — doc rateLimitTileMax : par compte, IP si invalide
- api/src/config.ts:45-47,223 — `tilePresign {enabled, ttlSec}` ; défaut false/300, [120,3600]
- api/src/logRedact.ts:7 — + x-amz-signature/credential/security-token
- api/src/tileRedirect.ts:1-21 — NEUF : EXT, OBJECT_CACHE, shouldRedirectTile, redirectCacheControl
- api/src/tileRateKey.ts:1-13 — NEUF : `tu:<u>` si jeton valide ∧ p=id, sinon `ti:<ip>`
- api/test/presign-get.test.ts:1-90 — NEUF 10 tests (S3, fenêtre, local, origin, config)
- api/test/log-redact-s3.test.ts:1-21 — NEUF 3 tests
- api/test/tile-rate-key.test.ts:1-69 — NEUF 12 tests
## Vérifié comment
```
npm --prefix api run typecheck → typecheck EXIT=0
npx vitest run test/presign-get.test.ts test/log-redact-s3.test.ts test/tile-rate-key.test.ts
 ✓ test/log-redact-s3.test.ts (3 tests) 3ms
 ✓ test/tile-rate-key.test.ts (12 tests) 7ms
 ✓ test/presign-get.test.ts (10 tests) 110ms
 Test Files  3 passed (3)  Tests  25 passed (25)
npm --prefix api test → test EXIT=0
 Test Files  94 passed (94)
      Tests  812 passed (812)
git -C G diff --stat -- api
 api/src/config.ts    |  9 +++++++--
 api/src/logRedact.ts |  2 +-
 api/src/storage.ts   | 28 ++++++++++++++++++++++++++++
 3 files changed, 36 insertions(+), 3 deletions(-)
git -C G status --short api
 M api/src/config.ts
 M api/src/logRedact.ts
 M api/src/storage.ts
?? api/src/tileAuth.ts            (T065)
?? api/src/tileRateKey.ts
?? api/src/tileRedirect.ts
?? api/test/log-redact-s3.test.ts
?? api/test/presign-get.test.ts
?? api/test/tile-auth-parity.test.ts   (T065)
?? api/test/tile-rate-key.test.ts
```
- 94/812 = base 90/772 + T064 3/25 + T065 1/15 (fichiers tileAuth présents)
## Écarts
- lecture hors WL: api/test/presign-checksum.test.ts:1-30 — modèle env S3 factice (non bloquant, 1/3)
- presignGet utilise `getClient()` direct (contrat) ; voisins utilisent alias `s3Client()` — identique
## Pour la suite
- L4 server.ts : `if (shouldRedirectTile(...) && storage.presignGet)` → `await presignGet(prefix, rel, {ttlSec: config.tilePresign.ttlSec, nowMs: Date.now(), responseCacheControl: TILE_OBJECT_CACHE, responseContentType: contentTypeFor(rel)})` ; null → stream
- 302 : `Cache-Control: redirectCacheControl(expiresAtMs, now)` ; Location jamais loggée (logRedact x-amz OK)
- rate-limit route tuile : `keyGenerator: (req) => tileRateKey(config, req)`
- CSP/connect-src web : `s3PublicOrigin(config)` (null si local/sans endpoint)
- ResponseContentType : CONTENT_TYPES storage.ts:70 ∌ webp → octet-stream ; à ajouter si .webp redirigé
## Retour sur le pack
- Manquait: env S3 factice exact (USE_MEM_DB, clés) — pris dans presign-checksum.test.ts
- Inutile: ∅
