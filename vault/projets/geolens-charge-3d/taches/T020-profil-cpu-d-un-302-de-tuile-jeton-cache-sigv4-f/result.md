---
tache: T020
statut: fait
---
## Livré
Bench: `W/api/test/bench-t020-tile302.test.ts` (médiane de 5 séries × 5 000 ops, chauffe 1 000 ; presignGet 2 000 ; shouldRedirect 200 000). Config: s3 factice scaleway, TILE_PRESIGN_REDIRECT=1, TILE_GRANT_CACHE_MS=30000, RATE_LIMIT_TILE_MAX=1e8.
- route complète `app.inject` GET `tiles/0.b3dm` → 302 · 770 µs (RATE_LIMIT=1: 772 · =0: 764) · 100 %
- `presignGet` réel (getSignedUrl SDK) · 554 µs (min 533, max 632) · 72 %
- `verifyTileToken` (HMAC+JSON.parse) · 6,6 µs · 0,9 %
- `tileGrants.get` hit · 0,11 µs · 0,01 %
- `shouldRedirectTile`+`redirectCacheControl` · 0,19 µs · 0,02 %
- reste Fastify (hooks tileMetrics, rate-limit, router, reply 302, inject) · ≈ 209 µs · 27 %
- débit max 1 process = 1e6/770 = 1 300 req/s (inject, sans parse HTTP) vs constat serveur ≈ 670 req/s @ ≈ 100 % cœur → ratio 1,9× ; cohérent avec CPU serveur plus lent + HTTP/TLS réel (NV: non mesuré)
- rate-limit n'apparaît pas: 772 vs 764 µs (≈ 0)
- piège bench: RATE_LIMIT_TILE_MAX=5000 défaut → 429 après 5 000 req → mesure fausse (138 µs) ; fixé à 1e8
## Vérifié comment
- `cd W/api; npx vitest run test/bench-t020-tile302.test.ts` → `BENCH verifyTileToken median_us=6.60` · `tileGrants.get_hit 0.11` · `presignGet_reel 554.26` · `shouldRedirect+cacheControl 0.19` · `route_302_RL1 772.42` · `route_302_RL0 763.71` · `last status 302` ; 3 passed
- uptime avant `load average: 3,61, 2,63, 2,52` · après `3,86, 2,87, 2,61` (machine chargée → absolus ±10 %)
- cpu-prof: `--pool=forks --poolOptions.forks.singleFork=true --poolOptions.forks.execArgv=--cpu-prof` → OK, 19 378 inject en 15 s (profil global 37 s, incl. setup + IPC vitest + 19 % idle ; % sur total)
  top self: (idle) 18,9 · processTicksAndRejections 4,2 · GC 4,0 · getSignedUrl (s3-request-presigner:66) 3,2 · @smithy/core endpoints:203 2,8 · @smithy/core schema:81 2,6 · writeChannelMessage (IPC vitest) 2,5 · @smithy/core retry:151 1,8 · Hmac 1,7 · promiseInitHook 1,6 · parseChannelMessages 1,6 · (program) 1,4 · escapeUri 1,4 · nextTick 1,4 · Hash.digest 1,4
  par paquet: @smithy/core 18,9 · node: internes 30,3 · presigner 4,1 · @aws-sdk/core 3,0 · @smithy/signature-v4 2,8 · light-my-request 3,7 → SDK ≈ 29 % du total profil, ≈ 70 % du CPU hors idle/IPC/vitest
- SigV4 artisanal (scratchpad, hors repo): `node sig.mjs` → `7.06 7.11 7.14 7.19 7.27` µs/op (clé de signature cachée par jour) ; NV: URL non comparée octet à octet au SDK
## Écarts
- ∅ (0 lecture hors WL ; helper test lu : helpers.ts)
## Pour la suite
- coût: presignGet SDK = 554 µs = 72 % d'un 302 (770 µs) ; Fastify 209 µs (27 %) ; jeton 6,6 µs ; cache grant et décisions ≈ 0. Rate-limit ≈ 0.
- chaîne SDK coûteuse: middleware stack smithy (endpoints, schema, retry), `import()` dynamiques à chaque appel (storage.ts:598-599), `new Date`, escapeUri ; 1 HMAC ≈ 1-2 µs seulement.
- piste (c, la meilleure) presign SigV4 artisanal dans `storage.ts:598-612` (clé de signature cachée par jour/région, 8 query params triés) ≈ 7 µs mesuré → route ≈ 770−554+7 ≈ 223 µs → ≈ 4 500 req/s/process (×3,5) ; risque: octet-à-octet = test presign-get.test.ts I1 existant à étendre ; NV.
- piste (a) cache URL par (prefix, rel, fenêtre ttl/2=150 s) : hit ≈ 0,3 µs → route ≈ 215 µs (×3,6) mais SEULEMENT sur hit ; une tuile 3D est demandée ~1 fois/session → hit rate faible hors multi-utilisateur même projet ; mémoire ~300 o × tuiles ; à n'envisager qu'en complément de (c). Gain réel = hit% × 540 µs.
- piste (b) N process: gain ≈ ×N cœurs (1 300→ N×1 300 inject-équivalent ; serveur 670 → N×670), sans toucher le code ; grant cache (Map) et rate-limit mémoire deviennent par process (quota effectif ×N).
- 3ᵉ piste: import dynamique `await import('@aws-sdk/...')` ×2 par appel (storage.ts:598-599) → hisser en cache module (gain NV, petit) ; reste Fastify 209 µs: hooks tileMetrics + rate-limit + onSend, à profiler séparément si (c) livré.
## Retour sur le pack
- Manquait: RATE_LIMIT_TILE_MAX à relever (défaut 5000/min → 429) ; instruction cpu-prof sous vitest
- Inutile: tileMetrics.ts, tile-route-redirect.test.ts lus presque entiers (seul tileBase utile)
