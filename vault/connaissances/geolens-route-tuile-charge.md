---
titre: route tuile GeoLens — coûts CPU, cache de droits, SigV4 direct, cache viewer
resume: 302 tuile 770→223 µs, cache droits 30 s, presign SigV4 maison = SDK, cache viewer par compte
source: geolens-charge-3d T016-T029, D16-D23
cree: 2026-10-13
tags: [note, geolens, tuile, charge, cache]
---

# Route tuile GeoLens : charge et cache

## Coût CPU d'un 302 (T020, avant correctif)
- total 770 µs : `presignGet` SDK 554 µs (72 %) · Fastify 209 µs · jeton HMAC 6,6 µs · cache droits 0,11 µs · rate-limit ≈ 0
- SigV4 direct 7-34 µs/op (clé de signature mémoïsée par jour+région) → route ≈ 223 µs ≈ 4 500 req/s/process
- SDK lent : pile smithy + `import()` dynamiques par appel (`storage.ts:598-599`)
- bench : `npx vitest run test/bench-t020-tile302.test.ts` ; relever `RATE_LIMIT_TILE_MAX` (défaut 5000/min → 429)

## Cache des droits (D16, D17)
- `TILE_GRANT_CACHE_MS` défaut 30000 (0 en pg-mem ; 0 = off) ; positif seul, refus jamais caché
- révocation ≤ TTL + durée d'1 SELECT en vol ; 0 invalidation admin ; cache par process (N instances = N caches, quota rate-limit ×N)
- horloge `performance.now` (monotone), pas `Date.now`
- `PG_POOL_MAX` 2..100 défaut 10 ; à 30 VUs sans cache : sql p50 186-273 ms = attente pool, DB 23 % CPU
- `TILE_GRANT_CACHE_MS=''` → 0 (intIn) ; `inflight` sans plafond (borné par requêtes concurrentes)

## Présignature SigV4 directe (D20, D23)
- `s3Presign.ts` `presignGetV4` : URL = sortie SDK octet pour octet (72 cas, 8 endpoints × 9 clés)
- `S3_PRESIGN_SDK=1` → SDK partout (retour arrière sans code)
- repli SDK (null) : endpoint absent/non http(s)/userinfo/chemin ≠ `/`, credentials absents, `expires` ∉ [1, 604800]
- repli aussi : région `aws-global`, `/fips/` ou ∉ `/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i` ; bucket `xn--`, `--x-s3`, `--xa-s3`, non DNS (`.`, majuscule, `_`)
- repli aussi : port `0` ; année ∉ [1970, 9999] ; `AWS_USE_FIPS_ENDPOINT`/`AWS_USE_DUALSTACK_ENDPOINT` via config.ts
- piège : bucket `--x-s3` → SDK fait un appel réseau (CreateSession), > 120 s
- `ttlSec` < 2 → RangeError (SDK idem)

## Cache tuiles viewer (D22, D23)
- plugin `fetchData` 3d-tiles-renderer ; flag serveur `VIEWER_TILE_CACHE` (défaut off) ; actif si GET projet renvoie `contentTag` + `viewerUserId`
- cache `geolens-tiles-v1/{sha256(userId)[16]}/{projectId}/{contentTag}` ; jamais token/query dans la clé
- purge : logout, idle, flag off ; sélective au login ; TTL 30 j sur âge monotone ; plafond min(1,5 Gio, 0,6 × quota) ; tuile > 64 Mio refusée (Content-Length puis flux)
- ne jamais stocker : 206/Range, opaque, no-store, `project.json`, `multi-pack.json`
- périmé : réécriture en place sous un `storage_prefix` servie ≤ 30 j → interdit sans nouveau contentTag
- Content-Length = taille compressée si gzip ; `writable=false` dure toute la session onglet

## Mesures k6 (serveur test, 4 vCPU, générateur inclus)
| étape | VUs | tuiles/2 min | p95 302 | CPU api |
|---|---|---|---|---|
| M0 sans présign | 10 | 54 600 | 120 ms (tuile) | 103 % |
| M1 présign SDK | 30 | 75 000 | 363 ms | 81 % |
| M3 k6 allégé | 30 | 106 320 | 295 ms | 90-94 % |
| M4 SigV4 direct | 30 | 177 000 | 52,7 ms | 52-59 % |
| M4 | 60 | 172 320 | 111 ms | 44-52 % |
- M4 30 VUs : ≈ 64 000 tuiles/min ; plafond = machine (MinIO ≈ 1,6 cœur + Caddy + k6) ; 60 VUs : S3 p95 378 ms
- 0 erreur 429/5xx sur M0-M4 ; protocole : [[geolens-serveur-test]]

## Pièges
- pool pg 10 en dur avant `PG_POOL_MAX` : file avant handler
- k6 : garder le corps = CPU générateur ×3,8 ; 1 VU/conteneur sature à 30 VUs
- vitest cpu-prof : `--pool=forks --poolOptions.forks.singleFork=true --poolOptions.forks.execArgv=--cpu-prof`
- image k6 en uid ≠ hôte : `--user $(id -u)` pour monter un scratchpad
