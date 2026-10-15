---
tache: T063
statut: fait
---
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online · contrainte qui décide : chaque tuile reste ré-autorisée en base (D6) → l'API ne lâche que les OCTETS (B) ; on réduit clé de quota (D) et coût DB (Q).
## Décisions
- B 302 si GET + sans `Range` + ext ∈ {b3dm,pnts,i3dm,cmpt,glb,bin,ktx2,jpg,jpeg,png,webp} — rayon CORS/credentials minimal — écarté : tout `/storage/*` (`.json` relatif, Range=préflight, loaders `.sog`/COPC NV)
- B après 304 (ETag conservé) ; échec presign → stream actuel — 0 régression — écarté : suppression ETag, 503
- B TTL 300 s, `signingDate` quantifié fenêtre ttl/2 — URL identique entre comptes/rechargements — écarté : URL fraîche/requête
- B 302 `private, max-age=reste−30` — rechargement sans retour API — écarté : `no-store`
- B flag `TILE_PRESIGN_REDIRECT` défaut 0 — CORS d'abord, bascule réversible — écarté : actif d'office
- D clé `tu:<u>` après HMAC, sinon `ti:<ip>` ; 5000/min/compte ; 302+304 comptés — chaque requête coûte 1 SELECT — écarté : exempter 304
- C `encode` à `match` Content-Type explicite — tileset.json reste compressé — écarté : exclure `/api/projects/*/storage/*` (perd gzip JSON) ; doc Caddy : défaut n'encode pas octet-stream/model/* → T062 goulot 4 ≈ faux, on le fige
- Q 1 SELECT (5 jointures sur PK) + `checkUserAccess` réutilisé — −1 aller-retour DB/tuile, D6 intact — écarté : statu quo 2 SELECT (T062 : 0 ms/SELECT mesuré ; coût S + parité testée) ; LRU d'auth (contredit D6)
- web : fetch storage HttpBackend `credentials:'same-origin'` — ACAC Scaleway NV — écarté : CORS avec credentials
- CSP origine bucket exacte — wildcard = exfiltration vers tout bucket — écarté : `*.s3.fr-par.scw.cloud`
## Contrats
```
── B · api/src/storage.ts — interface StorageDriver (après signUploadPart :165)
export interface PresignGetOptions { ttlSec: number /* validité max URL = borne lecture post-révocation */; nowMs: number /* injecté */;
  responseCacheControl: string /* → response-cache-control */; responseContentType: string /* → response-content-type */ }
export interface PresignedGet { url: string; expiresAtMs: number }
/** GET présigné. Absent ou null ⇒ l'appelant streame. Calcul local : 0 I/O, 0 test d'existence. Lève StorageError('invalid_path') hors préfixe. */
presignGet?(prefix: string, relPath: string, opts: PresignGetOptions): Promise<PresignedGet | null>;
local : absent. S3 (client = getClient() :392) :
  Bms = Math.floor(ttlSec / 2) * 1000 ; signedAtMs = Math.floor(nowMs / Bms) * Bms
  url = await getSignedUrl(client, new GetObjectCommand({ Bucket: config.s3.bucket, Key: scopedKey(prefix, relPath),
    ResponseCacheControl, ResponseContentType }), { expiresIn: ttlSec, signingDate: new Date(signedAtMs) })
  return { url, expiresAtMs: signedAtMs + ttlSec * 1000 }
invariants : même (clé, fenêtre) ⇒ URL identique ; expiresAtMs−nowMs ∈ (ttl/2, ttl] s ; 0 x-amz-checksum ; 0 jeton portail
export function s3PublicOrigin(config: AppConfig): string | null  // non-s3 ou !endpoint → null ; forcePathStyle ? endpoint.origin : `${proto}//${bucket}.${host}`
── B · api/src/config.ts : AppConfig.tilePresign: { enabled: boolean; ttlSec: number } ; loadConfig : { enabled: bool(env.TILE_PRESIGN_REDIRECT, false), ttlSec: intIn(env.TILE_PRESIGN_TTL_SEC, 300, 120, 3600) }
── B · api/src/tileRedirect.ts (neuf, pur)
export const TILE_REDIRECT_EXT = /\.(b3dm|pnts|i3dm|cmpt|glb|bin|ktx2|jpe?g|png|webp)$/i;
export const TILE_OBJECT_CACHE = 'private, max-age=86400, immutable'; // = IMMUTABLE_CACHE server.ts:516
export function shouldRedirectTile(i: { enabled: boolean; method: string; hasRange: boolean; rel: string }): boolean; // enabled && GET && !hasRange && EXT
export function redirectCacheControl(expiresAtMs: number, nowMs: number): string; // s=floor((exp−now)/1000)−30 ; s>0 ? `private, max-age=${s}` : 'no-store'
── B · api/src/logRedact.ts:7
export const SENSITIVE_QUERY_KEYS = ['token', 'x-amz-signature', 'x-amz-credential', 'x-amz-security-token'];
── B · route server.ts:728-802 — ordre exact
onRequest  rate-limit, key = tileRateKey(config, req)                                     [D]
1 payload = verifyTileToken(config, req.query.token) ; !payload || payload.p ≠ :id → 403 (inchangé)
2 grant = await resolveTileGrant(db, payload.u, payload.p) ; null → 403 'Accès au projet refusé.'     [Q]
3 rel = sanitizeRelPath(*) ; null → 400
4 isMutableManifest (:752) ; etag = storageEtag(grant.storagePrefix, rel) ; !isMutableManifest && replyNotModified → 304
5 if (shouldRedirectTile({ enabled: config.tilePresign.enabled, method: req.method, hasRange: typeof req.headers.range === 'string', rel })
      && app.storage.presignGet) { const now = Date.now();
    try { const pg = await app.storage.presignGet(grant.storagePrefix, rel, { ttlSec: config.tilePresign.ttlSec, nowMs: now,
            responseCacheControl: TILE_OBJECT_CACHE, responseContentType: contentTypeFor(rel) });
          if (pg) return reply.code(302).header('Location', pg.url).header('Cache-Control', redirectCacheControl(pg.expiresAtMs, now))
            .header('Referrer-Policy', 'no-referrer').send(); }
    catch (e) { app.log.warn({ tile: rel, project: req.params.id, err: (e as Error).name }, 'tile presign failed → stream'); } }
6 :755-801 inchangé (Range, get, 503/404, en-têtes, stream), project.storage_prefix → grant.storagePrefix
interdits : loguer pg.url/Location ; ETag sur 302 ; 302 pour HEAD, Range, .json
boot : if (config.tilePresign.enabled) app.log.info({ origin: s3PublicOrigin(config) }, 'tile presign ON — origine requise CSP viewer + CORS bucket')
── D · api/src/tileRateKey.ts (neuf, pur, 0 DB)
export function tileRateKey(config: AppConfig, req: { params: unknown; query: unknown; ip: string }): string;
  // p = verifyTileToken(config, typeof query.token === 'string' ? query.token : undefined) ; p && p.p === params.id ? `tu:${p.u}` : `ti:${req.ip}`
server.ts:734 → { config: { rateLimit: { max: config.rateLimitTileMax, timeWindow: '1 minute', keyGenerator: (req) => tileRateKey(config, req) } } }
config.ts:31 doc → « req/min PAR COMPTE (jeton vérifié) ; par IP si jeton invalide »
── Q · api/src/tileAuth.ts (neuf)
export interface TileGrant { projectId: string; storagePrefix: string }
export const TILE_GRANT_SQL = `
SELECT u.*, uo.status AS org_status,
       p.id AS tg_project_id, p.storage_prefix AS tg_storage_prefix,
       COALESCE(u.is_platform_admin, false)
       OR ((p.org_id = u.org_id OR pog.project_id IS NOT NULL)
           AND (u.role = 'org_admin' OR pa.user_id IS NOT NULL)) AS tg_allowed
  FROM users u
  LEFT JOIN organizations uo ON uo.id = u.org_id
  LEFT JOIN projects p ON p.id = $2
  LEFT JOIN project_orgs pog ON pog.project_id = p.id AND pog.org_id = u.org_id
  LEFT JOIN project_access pa ON pa.project_id = p.id AND pa.user_id = u.id
 WHERE u.id = $1`;   // ≤1 ligne : PK users, projects, project_orgs(project_id,org_id), project_access(user_id,project_id)
export async function resolveTileGrant(db: Db, userId: string, projectId: string): Promise<TileGrant | null>;
  // row = rows[0] ; { org_status, tg_project_id, tg_storage_prefix, tg_allowed, ...userRow } = row ?? {}
  // !checkUserAccess(row ? { row: userRow as UserRow, orgStatus: org_status ?? null } : null).ok → null   (session.ts:30, sans sv)
  // tg_project_id == null || tg_allowed !== true → null ; sinon { projectId: tg_project_id, storagePrefix: tg_storage_prefix }
≡ resolveSignedProject (server.ts:270) : absent/disabled/pending/org suspendue → null ; platform admin → tout projet existant (orphelin compris) ;
  org_admin → p.org_id = u.org_id OU project_orgs ; autre rôle → (org OU project_orgs) ET project_access ; u.org_id NULL → admin plateforme seul ; resolveSignedProject inchangé ailleurs (:669, :842)
── CSP · web/viewer.html:12 ET web/src/viewer/index.html:12 (S3 = https://geolens-tuiles.s3.fr-par.scw.cloud, bucket prod NV)
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://geolens-tuiles.s3.fr-par.scw.cloud; font-src 'self' data:; connect-src 'self' blob: data: https://geolens-tuiles.s3.fr-par.scw.cloud; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'" />
Caddyfile:19 Report-Only : img-src 'self' data: blob: https://geolens-tuiles.s3.fr-par.scw.cloud   (images rapport via storage :842)
web/src/viewer/backend/HttpBackend.ts:114,126,220,241 : credentials 'include' → 'same-origin' (jeton en query suffit ; API même origine)
── C · Caddyfile:5 remplacé par
    encode {
        zstd
        gzip
        match {
            header Content-Type text/*
            header Content-Type application/json*
            header Content-Type application/javascript*
            header Content-Type application/wasm*
            header Content-Type application/xml*
            header Content-Type image/svg+xml*
        }
    }
── .env.production.example (remplace :10)
RATE_LIMIT_TILE_MAX=5000                   # plafond/min PAR COMPTE (jeton vérifié) ; par IP si jeton invalide
TILE_PRESIGN_REDIRECT=0                    # 1 = tuiles binaires en 302 → GET S3 présigné (APRÈS CORS bucket + CSP viewer)
TILE_PRESIGN_TTL_SEC=300                   # validité max URL S3 = lecture possible après révocation (120..3600)
── CORS bucket (HUMAIN ; put-bucket-cors REMPLACE tout → get puis fusion)
aws s3api get-bucket-cors --bucket geolens-tuiles --endpoint-url https://s3.fr-par.scw.cloud
cors.json : {"CORSRules":[{"ID":"geolens-viewer-get","AllowedOrigins":["https://portail.geolens.fr"],"AllowedMethods":["GET","HEAD"],
  "AllowedHeaders":["Range"],"ExposeHeaders":["ETag","Content-Length","Content-Range","Accept-Ranges"],"MaxAgeSeconds":3600}]}
aws s3api put-bucket-cors --bucket geolens-tuiles --endpoint-url https://s3.fr-par.scw.cloud --cors-configuration file://cors.json
curl -si -X OPTIONS https://geolens-tuiles.s3.fr-par.scw.cloud/<prefix>/<x>.b3dm -H 'Origin: https://portail.geolens.fr' -H 'Access-Control-Request-Method: GET' | grep -i '^access-control-allow-origin'
navigateur : fetch même-origine → 302 cross-origin : Origin = portail (non tainted), credentials same-origin ⇒ ACAO exact suffit, ACAC inutile
```
## Ordre et lots
| lot | fichiers | dépend de | parallèle avec |
|---|---|---|---|
| L1 B-stockage | api/src/storage.ts, config.ts, logRedact.ts | ∅ | L2 L3 L5 L6 |
| L2 Q | api/src/tileAuth.ts | ∅ | L1 L3 L5 L6 |
| L3 D+pur | api/src/tileRateKey.ts, tileRedirect.ts | ∅ | L1 L2 L5 L6 |
| L4 route | api/src/server.ts (:734, :735-802, boot log) — seul éditeur | L1 L2 L3 | L5 L6 |
| L5 web | web/viewer.html, web/src/viewer/index.html, HttpBackend.ts (+ packs/shared/pvPanels.ts:208 si URL storage, NV) | ∅ | tous |
| L6 infra | Caddyfile, .env.production.example | ∅ | tous |
| H humain | CORS bucket, puis TILE_PRESIGN_REDIRECT=1 | L4 L5 L6 déployés | ∅ |
## Tests par lot
- L1 · api/test/presign-get.test.ts · creds factices, endpoint fr-par vhost : host `geolens-tuiles.s3.fr-par.scw.cloud` ; `X-Amz-Expires=300` ; `response-cache-control` ; URL(now)=URL(now+Bms−1) ; URL(now+Bms)≠ ; 0 `checksum` ; `..` → StorageError ; s3PublicOrigin path/vhost/local ; config ttl 60→300, 5000→300, 600→600, flag défaut false ; api/test/log-redact-s3.test.ts · `X-Amz-Signature`, `x-amz-credential` → `[redacted]`
- L2 · api/test/tile-auth-parity.test.ts · pg-mem, produit croisé users×projets, `resolveTileGrant` ≡ `resolveSignedProject` (storage_prefix|null) : member+access ; member sans access ; member+access autre org non partagé ; member+access partagé project_orgs ; org_admin propre org / autre org / partagé ; platform admin cross-org / orphelin ; disabled ; pending ; org suspendue ; user absent ; projet absent ; u.org_id NULL ; spy db.query = 1
- L3 · api/test/tile-rate-key.test.ts · jeton valide → `tu:<u>` ; HMAC faux/expiré/p≠id/absent → `ti:<ip>` ; shouldRedirectTile (GET/HEAD × Range × .b3dm/.json/project.json/.sog) ; redirectCacheControl (reste 300→270, 20→no-store)
- L4 · api/test/tile-route-redirect.test.ts · stub presignGet : .b3dm → 302 Location=stub, `private, max-age=`, 0 ETag, body vide ; If-None-Match → 304 ; project.json → 200 no-store ; tileset.json → 200 ; Range → 206 ; HEAD → 0 302 ; flag off → 200 ; sans presignGet → 200 ; throw → 200 + logs sans `X-Amz` ; user désactivé après jeton → 403 ; RATE_LIMIT=1 max=5 : A ×6 → 6e 429, B même IP → 0×429, jeton faux ×6 → 403×5 puis 429
- L5 · web/src/viewer/__tests__/csp-s3.test.ts · 2 html : connect-src et img-src contiennent l'origine S3 exacte, 0 `*.` ; HttpBackend storage : 0 `credentials: 'include'`
- L6 · `caddy validate --config Caddyfile --adapter caddyfile` → `Valid configuration`
## Mesure de contrôle
- M1 local (régression + Q) : API :4100 pg-mem, stockage local, RATE_LIMIT off, mix T062 (villelaure-real), `node $W/bench.mjs {1,10,50} 20` → 0 5xx ; req/s ≥ 0,9×(401/796/972) ; p95 ≤ 1,1×(5,5/25,6/93,9 ms) ; spy db.query → 1/tuile
- M2 302 (MinIO docker, STORAGE_DRIVER=s3 S3_FORCE_PATH_STYLE=1 TILE_PRESIGN_REDIRECT=1, seed copié) : K=50 ×20 `fetch(u,{redirect:'manual'})` → 302 sur 100 % des binaires ; req/s ≥ 972 ; p95 ≤ 94 ms ; octets corps API binaires = 0 ; `curl -s -o /dev/null -w '%{http_code}' "$LOCATION"` → 200 ; 2 Location même fenêtre identiques
- M3 RL (:4101 RATE_LIMIT=1, 1 IP) : admin@demo + membre@demo (project_access villelaure-real ajouté) ; A ×6200 → `{"302|200":5000,"429":1200}` ; B ×2000 pendant → 0×429
- M4 prod (humain, après CORS + flag) : DevTools Villelaure → 0 violation CSP/CORS, tuiles 302→200 S3 ; `docker stats` api : débit sortie ↓ vs flag 0
## Vérifié comment
- lecture server.ts:261-274,505-527,715-803 · storage.ts:47-178,205-233,378-427,557-625 · session.ts:1-47 · tenancy.ts:87-121 · config.ts:8-84,152-253 · logRedact.ts:1-41 → faits du contrat
- Grep repo.ts:14,33 → is_platform_admin, toSessionUser ; Grep schema.ts:121-135 → PK project_access, project_orgs
- lecture Caddyfile:1-29 → encode global :5, Report-Only :19, 0 `log` ; viewer.html:12 → CSP ; .env.production.example:7-36 → geolens-tuiles, fr-par, vhost
- lecture HttpBackend.ts:47-70,112-249 → jeton jamais hors origine API, credentials include ; TilesRendererLoader.ts:129-140 → preprocessURL signe, fetchOptions défaut
- WebFetch caddyserver.com/docs/caddyfile/directives/encode → défaut match sans octet-stream ni model/gltf-binary ; WebFetch scaleway.com/en/docs/object-storage/api-cli/setting-cors-rules.md → cors.json, put-bucket-cors, curl OPTIONS ; ACAC ∅ doc
## Écarts
- Grep `api/` hors api/src (liste fichiers api/test) — fakes StorageDriver existants → presignGet optionnel ; Grep web/src `credentials` → pvPanels.ts:208 à vérifier L5
- decisions.md non écrit : pack = écriture result.md seule, chemin ∅ → chef append (bloc ## Décisions)
- NV : signingDate passé accepté Scaleway ; response-* Scaleway ; cache 302 navigateur ; bucket prod réel ; version Caddy ; keyGenerator route en onRequest (params/query)
## Pour la suite
- Choix : 302 S3 présigné (binaires, GET sans Range, après 304, flag off) + quota par compte vérifié + 1 SELECT/tuile + encode par Content-Type.
- Interdit : loguer une URL présignée ; 302 sur `.json`/Range/HEAD ; cache d'auth ; wildcard CSP ; flag à 1 avant CORS bucket + CSP.
- Révocation : nouvelles tuiles coupées immédiatement ; tuiles déjà redirigées lisibles ≤ TILE_PRESIGN_TTL_SEC (300 s).
- Non-retour : TILE_GRANT_SQL duplique tenancy.ts → toute règle d'accès future touche les 2 (test de parité = garde).
- À revoir si : COPC/.sog dominent l'egress (étendre 302 + Range) ; X-Amz-Credential = clé S3 RW → clé IAM lecture seule dédiée.
## Retour sur le pack
- Manquait: chemin + droit d'écriture decisions.md ; web/src/viewer/index.html hors WL ; versions (fastify, @fastify/rate-limit, presigner, Caddy) ; schema.ts PK ; repo.ts toSessionUser
- Inutile: ∅
