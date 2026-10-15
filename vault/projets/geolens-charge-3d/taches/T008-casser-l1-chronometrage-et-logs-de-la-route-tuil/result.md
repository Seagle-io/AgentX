---
tache: T008
statut: fait
verdict: DÉFAUTS
---
## Livré
- défaut 1 : client qui abandonne (abort) → Fastify 5.12.5 n'appelle jamais `onResponse` → requête absente de `status`/`total`/`send`/`slow` ; 0 ligne `tile slow` même si lente · `api/src/tileMetrics.ts:170-188` + `api/src/server.ts:741` (hooks onSend/onResponse seuls) · repro `cd W/api && npx vitest run test/verif-t008-core.test.ts -t abort` → `{"responses":0,"snap":null}` ×2 (flux coupé en cours ; client parti pendant un storage de 200 ms, slowMs 50) · gravité moyenne — angle mort du diagnostic de charge : le renderer annule les tuiles hors champ, souvent les plus lentes
- 0 autre défaut ; tests de casse : `W/api/test/verif-t008-core.test.ts` (18 cas, 2 KO = défaut 1), `W/api/test/verif-t008-server.test.ts` (7 cas OK)
## Vérifié comment
- base `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` 0 erreur
- base `npm --prefix api test` → `Test Files 98 passed (98)` `Tests 854 passed (854)`
- avec verif `npm --prefix api test` → `Test Files 1 failed | 99 passed (100)` `Tests 2 failed | 877 passed (879)` — 2 KO = défaut 1 ; typecheck 0 erreur
- fuite : 400 (`..%2F..`), 404, 503, 500 (flux qui casse), 200 lent → toutes les lignes sans valeur du jeton, `token=` seulement en `token=[redacted]` (sérialiseur req de la ligne 500 Fastify) → OK
- lignes `tile *` : champs `reqId,status,ms,project,tile,ip,sql?,storage?,send?` ; `tile` = params['*'] décodé (`../../etc/passwd`), jamais la query → OK
- volume : 200, 206 (`bytes=0-3`), 304 (If-None-Match), HEAD 200 → `raw == []` → OK
- rafale 1 000 × 403 (jeton forgé) → 600 lignes `tile 4xx`, 0 autre ligne ; close → 1 `tile metrics` `{logSuppressed:400,status:{"403":1000}}` → OK
- agrégat (Fastify nu, fake timers) : 60 s sans trafic → 0 ligne ; 1 req → 1 ligne ; +180 s vides → 0 ; close → flush 1 ligne + clearInterval appelé ; +600 s → 0 → OK
- `setInterval(fn, 60000)` → `hasRef() === false` → OK
- justesse 1..100 → `{"p50":53.9,"p95":95.6,"max":100}` ; bimodal 95×1+5×1000 → `{"p50":1.1,"p95":1.1,"max":1000}` (+1×1000 → p95 ≥ 1000) → OK
- balayage 0.11 ms → 200 s (×1.0137, ~900 pts) + 146 bornes exactes `0.1·1.1^i` → estimation ∈ [v−0.05 ; 1.1·v+0.05], 0 sous-estimation → OK
- débordement : `bucketIndex(110000)=146`, `bucketIndex(115000)=147` ; 500 s → p50=p95=max=500000 → OK
- `time()` qui lève (storage, 5 ms) → 503 conservé, ligne `tile 5xx` `storage ≥ 4`, sans `send` → OK
- concurrence : 2 req en parallèle (storage 120 ms / 1 ms) → `storage` ≥ 100 / < 50 sur la bonne ligne → OK
- abort (HTTP réel, route serveur + Fastify nu) → `unhandledRejection`/`uncaughtException` = `[]` → OK ; WeakMap indexée par `req` → GC, fuite NV (structurellement nulle)
- `TILE_SLOW_MS` : '49','60001','abc','','-5','50.5' → 500 ; '50' → 50 ; '60000' → 60000 ; absent → 500 → OK ; '1e3' → 1000, ' 70 ' → 70 (dans [50 ; 60000], toléré)
- `GET /api/projects` → `incoming request` + `request completed` présents → OK
## Écarts
- ∅
## Pour la suite
- corriger défaut 1 : compter les abandons via le hook `onRequestAbort` ou via `reply.raw.on('close')` si `!writableFinished` (statut pseudo 499, total = elapsedTime, send si t0 posé) ; repro = `W/api/test/verif-t008-core.test.ts -t abort` (2 cas doivent passer)
- pendant un abandon, `time()` enregistre déjà sql/storage alors que `total` ne l'est pas → `phases.storage.count > phases.total.count` possible (NV hors abort)
- `intIn` accepte '1e3' et ' 70 ' (Number()) : sans impact sécu, à noter si validation stricte voulue
- les 2 fichiers verif-t008-*.test.ts sont non suivis dans W : à supprimer ou garder comme non-régression après correctif
## Retour sur le pack
- Manquait: comportement de Fastify sur abort (onResponse non émis) — à mettre en Environnement des packs de métrique
- Inutile: ∅
