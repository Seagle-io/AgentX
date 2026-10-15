---
tache: T001
statut: fait
---
## Livré
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online · api/src/ = A · HEAD da5fced

### Q1 ordre route tuile (A/server.ts)
- :733 — `app.get('/api/projects/:id/storage/*')`
- :739 — rate-limit plugin (config route, 5000/min) ; clé = A/tileRateKey.ts:8-13
- tileRateKey.ts:10 — appelle verifyTileToken → HMAC 1× ici
- :741 — verifyTileToken (HMAC+exp) 2ᵉ fois ; storage.ts:53-63 (exp :63)
- :742-744 — jeton KO ou payload.p ≠ :id → 403
- :749 — resolveTileGrant = SELECT `tile_grant` ; tileAuth.ts:35-43 ; null → 403
- :751 — sanitizeRelPath ; storage.ts:93 ; null → 400
- :758 — isMutableManifest = regex project.json
- :759 — storageEtag(grant.storagePrefix, rel) sha1[0:32] ; défini :524-525 zone
- :760 — replyNotModified → 304 ; défini :526-533 ; sauté si manifeste
- :763-779 — shouldRedirectTile && presignGet → 302 ; échec → warn :775 puis stream
- :782-787 — parse Range `^bytes=(\d+)-(\d*)$`
- :789 — app.storage.get(prefix, rel, range) (S3/local)
- :796 — erreur storage → 503 Retry-After:1 + warn :795
- :803 — obj null → 404 + warn :802
- :809-818 — headers : Content-Type, Cache-Control IMMUTABLE_CACHE, ETag, Accept-Ranges, 206/Content-Range
- :824 — `reply.send(obj.stream)` ; 0 log de succès applicatif
- :1197-1230 — route jumelle `/imported/*` ; même schéma (verify, replyNotModified :1205, 503, 404) ; HORS route tuile

### Q2 304 avant SELECT
- PIÈGE : etag = f(grant.storagePrefix, rel) ; storagePrefix ne vient QUE du SELECT (:749,759) → 304 actuel APRÈS SELECT
- ETag non dérivable sans prefix : sans SELECT, impossible avec ETag actuel
- à garder avant tout 304 : verifyTileToken :741-744 (HMAC, exp, p=:id) ; sanitizeRelPath :751
- 304 sans SELECT = plus de re-vérif disabled/accès (D6 « 0 cache » rompu) → décision D6/D22, pas technique
- saut manifeste : `!isMutableManifest &&` :760 ; project.json jamais 304
- IMMUTABLE_CACHE = 'private, max-age=86400, immutable' (server.ts ≈:523)
- tests 304 existants : tile-route-redirect.test.ts:61

### Q3 journalisation
- A/index.ts:7 — `buildServer({ config, logger: true })` ; opts.logger ?? false
- server.ts:155 — `logger: loggerOptions(opts.logger ?? false)`
- logRedact.ts:39-41 — `{ serializers: { req: serializeReq } }` seul ; ∅ level, ∅ redact, ∅ transport
- → pino défaut level info ; Fastify logge 2 lignes/req (incoming request + request completed), toutes routes
- ∅ `disableRequestLogging`, ∅ `LOG_LEVEL`/logLevel (config.ts, server.ts, index.ts)
- hooks globaux : server.ts:241 onClose ; :2501 onClose ; ∅ onRequest/onResponse global
- hooks route-locaux : :2767 onRequest/onResponse/onRequestAbort (relayGate, route upload, ≠ tuile)
- setErrorHandler :244
- logs applicatifs tuile : :775 warn presign ; :795 warn 503 ; :802 warn 404 (champs tile, project, err)
- logRedact.ts:10 SENSITIVE_QUERY_KEYS masque token + x-amz-* dans req.url
- filtrer 4xx/5xx/lents sur la seule route : ∅ mécanisme existant ; Fastify accepte `disableRequestLogging` (bool|fn) à la construction :155 (NV code lib, connaissance générale)

### Q4 chronométrage agrégé
- SQL : resolveTileGrant tileAuth.ts:35 (1 appel, wrappable) ; db.query opts.name db.ts:44
- S3/local : `app.storage.get` :789 ; StorageDriver.get storage.ts ≈:150 ; presignGet :168 (interface), impl :582
- envoi stream : `reply.send(obj.stream)` :824 ; fin d'envoi ∅ hook existant sur cette route
- hooks fastify existants utilisables : ∅ global ; route-level options (:739 objet config) acceptent onRequest/onResponse (précédent :2767)
- exposition : ∅ route interne métriques, ∅ log périodique, ∅ prom-client (NV : `rg` non lancé sur package.json)
- sweepTimer :2501 = précédent setInterval + onClose clear

### Q5 TILE_PRESIGN_REDIRECT
- config.ts:223 — `tilePresign.enabled` (défaut false), ttlSec 300 [120,3600]
- .env.production.example:11-12 — TILE_PRESIGN_REDIRECT=0 ; TTL
- tileRedirect.ts:12-22 — shouldRedirectTile (GET, sans Range, ext binaire) ; :28 redirectCacheControl
- storage.ts:582-593 — presignGet, signature quantifiée ttl/2
- storage.ts:674-678 — s3PublicOrigin(config) : origine bucket (path-style → endpoint.origin, sinon bucket.host)
- web/viewer.html:13 — CSP meta : `https://bucket-a-remplacer.s3.fr-par.scw.cloud` en img-src ET connect-src (placeholder)
- web/src/viewer/index.html:13 — même CSP, même placeholder ; à synchroniser
- manque : vrai nom bucket dans 2 CSP (commentaire viewer.html:12 D21) ; CORS bucket (∅ config dans G : rg CORS → DEPLOYMENT.md:159 = CORS API seulement) ; MinIO joignable par navigateur (config.ts:257 forcePathStyle défaut true → origine = S3_ENDPOINT ; hors Scaleway ≠ origine CSP)
- 302 seulement si presignGet défini (driver s3) ; local → stream (test :43)

### Q6 viewer
- backend/HttpBackend.ts:46-69 — makeSignUrl(ctx) ; ajoute `?token=` (searchParams.set) si chemin ∋ `/api/projects/` et `/storage/`, même origine API, token absent
- backend/install.ts:113 — `window.__glrSignUrl = makeSignUrl(ctx)` ; token lu de l'URL tileset (:99-102)
- loaders/TilesRendererLoader.ts:134-141 — signFn = window.__glrSignUrl ; URL racine signée :138 ; `tilesRenderer.preprocessURL = (uri) => signFn(uri.toString())` :141
- 3d-tiles-renderer 0.3.46 : preprocessURL DÉPRÉCIÉ (warn, base/TilesRendererBase.js:102-105) → plugins
- fetch tuiles : `fetchData(url, options)` → `fetch(url, options)` natif (base/TilesRendererBase.js:369-371) ; surchargeable ; plugin.fetchData(processedUrl, this.fetchOptions) :569, :727 (+signal)
- `fetchOptions` : {} défaut (:121) ; propagé aux loaders three/TilesRenderer.js:596-666
- param : query `token=<body.mac>` base64url ; changer toutes les ~4 h (fenêtre W 14400)
- point d'insertion cache : override fetchData (ou plugin) dans TilesRendererLoader.ts après :141 ; clé = url sans `token` (URL pathname)
- ∅ `caches.`/CacheStorage/serviceWorker dans web/src (hors tests) → rien d'existant
- COPC à exclure : HttpBackend.ts:213-242 readSignedRange, header `Range: bytes=…` :221, :242 ; readCopcBytes :624 ; ≠ pipeline 3d-tiles-renderer
- règle d'exclusion naturelle : requête avec en-tête Range, ou ext ∉ TILE_REDIRECT_EXT (tileRedirect.ts:7)
- backend/HttpBackend.ts:297-411 — autres routes `?token=` (annotations, homeview, objects, imported) ; ≠ tuiles
- TilesRendererLoader.ts modifié non commité (D24) ; lu tel quel, preprocessURL toujours présent

### Q7 tests route tuile (A/../test = api/test)
- rg -l "storage/" → 9 fichiers : scenes-add-scene, log-redact, content-isolation, isolation, hardening-t037, tile-route-redirect, geoplan-compute, auth-and-tiles, artifacts-isolation
- tile-route-redirect.test.ts:43 — sans presignGet → 200 stream
- :50 — .b3dm → 302, sans ETag, no-referrer
- :61 — If-None-Match → 304 avant redirection
- :72 — project.json 200 no-store ; tileset.json jamais redirigé
- :81 — Range → 206 ; HEAD → pas de 302
- :91 — presign lève → 200 stream, pas d'URL loguée
- :104 — flag off → 200 stream
- :117 — user désactivé → 403
- :131 — 429 par compte ×6 ; compte B indépendant ; jeton forgé 403×5 puis 429
- auth-and-tiles.test.ts:72-127 — enfant OK, sans jeton, jeton `abc.def`, traversal `..%2f` (401/403/400 NV)
- rate-limit-proxy.test.ts — 429 (tuile NV)
- ∅ test sur chronométrage, ∅ test filtre de logs tuile
- presign-get.test.ts, presign-checksum.test.ts — storage.presignGet

### Q8 k6
- `rg -l "k6/http" G` → ∅ ; `rg -il k6` → RAPPORT_CHARGE_CORRECTIFS.md + lockfiles/snapshots seulement
- `viewer-navigation.js` : introuvable (find /) ; `make run VUS=N DURATION=2m` cité mais ∅ Makefile k6 dans G → scripts hors G
- RAPPORT_CHARGE_CORRECTIFS.md:73-84 — modèle 4 558 tuiles, preset standard, serveur de test
- 5 VUs avant : 35 640 tuiles, 8 507 Mo, médiane 22 ms, p95 59 ms, 0 429/5xx, CPU api 117 %
- 5 VUs après : 34 920 tuiles, 23 ms, p95 63 ms, CPU 121 %
- 10 VUs avant : 48 480 tuiles, 11 651 Mo, 78 ms, p95 147 ms, CPU 113 %
- 10 VUs après : 47 520 tuiles, 81 ms, p95 154 ms, CPU 114 %
- débit 216 → 294 tuiles/s (52 → 71 Mo/s) ; goulot API ≈ 1,15 cœur mono-thread ; VM 4 vCPU/15 Go ; db <60 %, minio <60 %
- :101 — cas réel 17 680 req pour 4 558 tuiles (ratio 3,9) non reproduit par k6

## Vérifié comment
- `rg -n` ancres server.ts → :733 :739 :741 :749 :751 :758-760 :763 :775 :782 :789 :796 :803 :824 (cohérent avec Read)
- `rg -l "storage/" api/test` → 9 fichiers (liste Q7)
- `rg -l "k6/http" . --hidden` → ∅
- `find / -name viewer-navigation.js` → ∅
- NV — option Fastify `disableRequestLogging` en fonction : non lu dans la lib
- NV — absence prom-client / métriques : package.json non grep
- NV — numéros storage.ts get() ≈:150, IMMUTABLE_CACHE ≈:523 : approximatifs

## Écarts
- lecture hors WL: web/node_modules/3d-tiles-renderer/src/base/TilesRendererBase.js + three/TilesRenderer.js — rg seul, fetchData/preprocessURL (Q6)
- lecture hors WL: api/src/tileRateKey.ts — rg -A12, clé rate-limit (Q1)
- lecture hors WL: api/test/*.test.ts — rg -n d'intitulés (Q7), autorisé en rg
- lecture hors WL: web/src/viewer/loaders/copcGetter.ts, COPCLoader.ts — rg, exclusion COPC (Q6)

## Pour la suite
- 304 avant SELECT ≠ possible tel quel : ETag = sha1(grant.storagePrefix/rel), prefix vient du SELECT `tile_grant` (server.ts:749,759) ; il faut d'abord trancher D6 (0 cache) ou ETag sans prefix ; HMAC+exp (:741) restent avant.
- Logs : pino défaut info, 2 lignes/req toutes routes (index.ts:7, logRedact.ts:39) ; ∅ level/disableRequestLogging/hook global ; point d'accroche = construction Fastify server.ts:155 (gelé → module dédié).
- Chrono : points wrappables resolveTileGrant (tileAuth.ts:35), storage.get (server.ts:789), send stream (:824) ; ∅ métriques/route interne existantes ; précédent hooks route-level server.ts:2767.
- Viewer : cache Cache Storage = override `fetchData` (3d-tiles-renderer 0.3.46, fetch natif) dans TilesRendererLoader.ts après :141 ; clé = URL sans `token` ; exclure Range/COPC (HttpBackend.ts:221) ; ∅ cache existant ; preprocessURL déprécié.
- Presign : 2 CSP (viewer.html:13, src/viewer/index.html:13) = placeholder `bucket-a-remplacer` ; CORS bucket ∅ ; k6 absents de G (rapport seul : 10 VUs p95 154 ms, API ≈1,15 cœur).

## Retour sur le pack
- Manquait: l'info que l'ETag dépend du prefix du SELECT (Q2) ; emplacement des scripts k6 ; autorisation rg sur node_modules 3d-tiles-renderer
- Inutile: db.ts, config.ts hors TILE_*, web/viewer.html :1-20 (déjà donné par contrat)
