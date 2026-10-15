---
tache: T002
statut: fait
---
## Livré
Contrainte qui décide : 304 sans SELECT ⇒ la version du contenu (préfixe) doit voyager dans le jeton signé.

### C1 0.2 — décision : histogramme log fixe, log 1/min, 0 route
- ✔ 148 seaux ×1.1 dès 0,1 ms : 4 × 148 × Uint32 = 2 368 o + WeakMap ≤ req. en vol ; quantile sur-estimé ≤ 10 % · ✗ réservoir 2048/phase (64 Kio, non déterministe) · ✗ prom-client + route (dép., auth, test 401 ; k6 lit les logs)
- send = onResponse − onSend de route (précédent :2767) ; total = `reply.elapsedTime` (reply.d.ts:46)
```ts
// api/src/tileMetrics.ts — neuf, ≤ 400 l, 0 dépendance, 0 process.env
import type { FastifyInstance } from 'fastify';
export type TilePhase = 'sql' | 'storage' | 'send' | 'total';
export const TILE_PHASES: readonly TilePhase[] = ['sql', 'storage', 'send', 'total'];
export const HIST_BASE_MS = 0.1, HIST_FACTOR = 1.1, HIST_BUCKETS = 148; // seau 147 = débordement (> 110 s)
export const TILE_METRICS_WINDOW_MS = 60_000, TILE_LOG_MAX_PER_WINDOW = 600;
export function bucketIndex(ms: number): number;   // ms ≤ 0.1 | NaN | < 0 → 0 ; sinon min(147, ceil(ln(ms/0.1)/ln(1.1)))
export function bucketUpperMs(i: number): number;  // 0.1·1.1^i ; i ≥ 147 → Infinity
/** pq = min(bucketUpperMs(i), max), i = 1er seau où cumul ≥ ceil(q·count) ; arrondi 0.1 ; count 0 → tout 0. */
export interface PhaseStats { count: number; p50: number; p95: number; max: number }
export interface TileMetricsSnapshot { windowStartMs: number; windowMs: number; phases: Record<TilePhase, PhaseStats>;
  status: Record<string, number> /* code HTTP exact → n, clés vues */; slow: number; logSuppressed: number }
export interface TileMetricsCore { record(phase: TilePhase, ms: number): void; countStatus(status: number): void; countSlow(): void;
  takeLogSlot(max: number): boolean /* false → logSuppressed++ */; snapshot(): TileMetricsSnapshot; rotate(wallNowMs: number): TileMetricsSnapshot /* snapshot puis 0 */ }
export function createTileMetricsCore(wallNowMs: number, windowMs: number): TileMetricsCore;
export interface TileLogInput { status: number; totalMs: number; slowMs: number; reqId: string; ip: string;
  projectId: string /* params.id */; tile: string /* params['*'], jamais query/url */; sqlMs?: number; storageMs?: number; sendMs?: number }
export interface TileLogLine { level: 'warn' | 'error'; msg: 'tile 5xx' | 'tile 4xx' | 'tile slow';
  obj: { reqId: string; status: number; ms: number; project: string; tile: string; ip: string; sql?: number; storage?: number; send?: number } }
/** ≥500 → error 'tile 5xx' ; 400-499 → warn 'tile 4xx' ; sinon totalMs ≥ slowMs → warn 'tile slow' ; sinon null.
 *  ms arrondis 0.1 ; tile tronqué 200 car. ; sql/storage/send omis si absents. */
export function tileLogLine(i: TileLogInput): TileLogLine | null;
export interface TileLogSink { info(o: object, m: string): void; warn(o: object, m: string): void; error(o: object, m: string): void }
export interface TileReqLike { id: string; ip: string; params: unknown }
export interface TileReplyLike { statusCode: number; elapsedTime: number }
export interface TileRouteMetricsOptions { slowMs: number; windowMs?: number; maxLogPerWindow?: number;
  log?: TileLogSink; now?: () => number; wallNow?: () => number } // défauts app.log, performance.now, Date.now
export interface TileRouteMetrics {
  time<T>(req: object, phase: 'sql' | 'storage', fn: () => Promise<T>): Promise<T>; // record en finally (y.c. throw) ; ms par req (WeakMap) pour le log
  onSend(req: object, reply: unknown, payload: unknown): Promise<unknown>;          // marque t0 envoi ; payload inchangé
  onResponse(req: TileReqLike, reply: TileReplyLike): Promise<void>; // total ; send=now()−t0 si 200|206 ; status ; slow ; tileLogLine si takeLogSlot
  flush(): TileMetricsSnapshot | null; // rotate ; Σ status > 0 → log.info({ tileMetrics: snap }, 'tile metrics') + snap ; sinon null, 0 log
}
/** setInterval(flush, windowMs).unref() ; addHook('onClose') → flush() + clearInterval. 1 appel par app. */
export function registerTileMetrics(app: Pick<FastifyInstance, 'log' | 'addHook'>, opts: TileRouteMetricsOptions): TileRouteMetrics;
```
Points d'appel server.ts (3 ajoutées, 4 modifiées) :
```
:14   ~ `import { registerTileMetrics } from './tileMetrics.js';` sur la ligne d'imports multiples
:96   + logStream?: FastifyLoggerStreamDestination;            // BuildOptions, tests seulement
:155  ~ logger: loggerOptions(opts.logger ?? false, opts.logStream)
:731  + const tileMetrics = registerTileMetrics(app, { slowMs: config.tileSlowMs });
:739  + logLevel: 'warn', onSend: tileMetrics.onSend, onResponse: tileMetrics.onResponse,
:749  ~ const grant = await tileMetrics.time(req, 'sql', () => resolveTileGrant(db, payload.u, payload.p));
:789  ~ obj = await tileMetrics.time(req, 'storage', () => app.storage.get(grant.storagePrefix, rel, range));
```

### C2 1.2 — décision : `logLevel: 'warn'` de route + ligne onResponse
- ✔ route.d.ts:69 stable, typé, 1 route ; coupe incoming/completed (req.log) ; app.log :775/:795/:802 intacts · ✗ `disableRequestLogging` fn (déprécié, appelé à l'entrée → status inconnu) · ✗ `LogController` logger.d.ts:113-134 (API 5.12 neuve, globale)
- volume ≈ 600 l/s → 4xx/5xx/lent + 1 l/min ; plafond 600 l/fenêtre (flood 403/429), excédent compté ; doublon accepté 404/503 (warn existant + ligne)
- jeton jamais logué : module ne lit ni query ni url (invariant) ; logRedact inchangé pour les autres routes
```ts
// config.ts — AppConfig + loadConfig (intIn :163 : hors bornes/non entier → défaut)
/** Seuil « tuile lente » (ms, reply.elapsedTime) : au-delà, 1 ligne warn. */
tileSlowMs: number;
tileSlowMs: intIn(env.TILE_SLOW_MS, 500, 50, 60000),     // 500 ≈ 3,3 × p95 réf. 150 ms
// logRedact.ts — stream ignoré si enabled=false ; absent → objet identique à aujourd'hui
export function loggerOptions(enabled: boolean, stream?: FastifyLoggerStreamDestination):
  false | { serializers: { req: typeof serializeReq }; stream?: FastifyLoggerStreamDestination };
// ligne : {"level":40,"reqId","status","ms","project","tile","ip","sql"?,"storage"?,"send"?,"msg":"tile 4xx"}
```

### C3 1.3 — décision : tag du préfixe signé dans le jeton
- ✔ `v` = tilePrefixTag(storage_prefix) : 0 DB, 0 cache, HMAC couvre v · ✗ bête = statu quo (0 coût ; 304 coûte 1 SELECT) · ✗ cache id→préfixe (multi-process, esprit D6, faux 304 si périmé)
```ts
// api/src/tileEtag.ts — neuf, pur, node:crypto seul
export const PREFIX_TAG_RE = /^[A-Za-z0-9_-]{11}$/;
export function tilePrefixTag(storagePrefix: string): string;  // b64url(sha256(utf8)[0..8]) → 11 car.
export function tileEtag(tag: string, rel: string): string;    // `"${sha1(`${tag}/${rel}`).hex.slice(0,32)}"`
export function isMutableManifest(rel: string): boolean;       // /(^|\/)project\.json$/i, déplacé de server.ts:758
// storage.ts
export interface TileTokenPayload { p: string; u: string; exp: number; v?: string } // v absent = jeton legacy
export function signTileToken(config: AppConfig, claims: { p: string; u: string; exp: number }, storagePrefix: string): string; // JSON {p,u,exp,v}
// verifyTileToken : + ('v' in payload && (typeof v !== 'string' || !PREFIX_TAG_RE.test(v))) → null
```
```
onRequest  rate-limit ; tileRateKey (HMAC n°1)
1 verifyTileToken (HMAC n°2, exp, v) ; KO | p ≠ :id → 403
2 rel = sanitizeRelPath ; null → 400              ← remonté avant SELECT (400 prime sur 403 grant)
3 manifest = isMutableManifest(rel)
4 !manifest && payload.v && INM ∋ tileEtag(payload.v, rel) → replyNotModified → 304   (0 SELECT, 0 stockage)
5 grant = time('sql', resolveTileGrant) ; null → 403
6 etag = tileEtag(tilePrefixTag(grant.storagePrefix), rel)   ← vérité DB, jamais payload.v
7 presign → 302 (inchangé) · 8 time('storage', get) → 503 | 404 · 9 ETag si !manifest ; send
ancien 304 :759-760 supprimé ; storageEtag gardé (route /imported :1204)
```
- preuve : E émis seulement étape 9 = tileEtag(tag(P_DB), rel) avec contenu (P_DB, rel), ou renvoyé tel quel par 304 ⇒ 304 étape 4 ⇒ client détient (P_jeton, rel) ; v signé → non forgeable
- ré-import P_old → P_new : jeton neuf porte v_new ⇒ ≠ même à exp égal ⇒ URL ≠ ; client sans P_old n'a aucun E_old ⇒ 0 304 · jeton v_old + E_old → 304 = client détient P_old (≡ cache immutable actuel)
- collision tag 64 bits ≈ 2^-64/paire ; jeton legacy (≤ 12 h) → étape 4 sautée → 200 ; formule ETag change au déploiement → 1 re-téléchargement
- 3ᵉ arg signTileToken : server.ts:545,:599 p.storage_prefix (lu :182,:584) · :615 project.storage_prefix (tenancy.ts:29) · :863 artifactUrl(project: { id: string; storage_prefix: string }, …), appelants :1313,:1326 NV · computeProxy.ts:229 (lu :207) · test/tile-rate-key.test.ts:17,22,26,30 → 'pfx'
- URL : +`,"v":"…11"` 18 o → +24 car. b64url ; jeton ≈ 183 → 207 car. (p,u UUID 36 — NV)
- gain : clé cache = URL jeton inclus ; stable W 14 400 s, valide ≤ T+W 43 200 s < max-age 86 400 s ⇒ 0 revalidation par expiration ; `immutable` ⇒ 0 au rechargement ; forcé ⇒ no-cache sans INM ; fenêtre neuve ⇒ miss sans INM
- ⇒ 1.3 seul ≈ 0 SELECT/s évité (NV : mode fetch viewer hors WL ; C1 status['304'] tranche) · avec 2.1 (cache viewer sans jeton + INM) : revisite → 304 0 SELECT, plafond réf. 404 req/s
- conclusion : 1.3 utile seulement avec 2.1 ; tileEtag(v, rel) ⊥ u/exp = prérequis serveur de 2.1
- /imported :1197-1230 : C2 transposable (1 ligne) ; C3 non (préfixe = org_id via SELECT)

### Tests
- test/tile-metrics.test.ts (neuf) : bucketIndex(0.1)=0, (0.11)=1, (1e9)=147, (NaN)=0 · 1..100 ms → count 100, p50 ∈ [50;55], p95 ∈ [95;104.5], max 100 · count 0 → 0×4 · rotate → 0, windowStartMs=now · tileLogLine 200/10 ms → null ; 304 → null ; 403 → warn 'tile 4xx' ; 503 → error 'tile 5xx' ; 200/600 ms → 'tile slow'
- idem, Fastify nu + registerTileMetrics + route stream : 200 → send.count 1, total.count 1, status['200'] 1 · 403 → send.count 0 · maxLogPerWindow 2, 5×403 → warn ×2, logSuppressed 3 · 0 req → flush() null, info ×0 · fake timers +60 000 → info ×1 'tile metrics'
- test/tile-route-logs.test.ts (neuf, logger true + logStream) : 200 tuile → 0 ligne `/storage/` · jeton forgé → 1 ligne 'tile 4xx' 403, sans 'token=' ni jeton · GET /api/projects → ≥ 1 'request completed' · TILE_SLOW_MS absent|'49'|'abc' → 500, '50' → 50, '60000' → 60000
- test/log-redact.test.ts : loggerOptions(true, s).stream === s ; loggerOptions(false, s) === false
- test/tile-etag-304.test.ts (neuf) : tag 11 car. PREFIX_TAG_RE, 'a' ≠ 'b' · tileEtag /^"[0-9a-f]{32}"$/ · verify v = tag(prefix) ; legacy → valide, v undefined ; v malformé signé → null
- idem route : spy app.db.query + INM → 304, calls 0 · 200 → 1 appel 'tile_grant' · forgé / jeton A sur :id B / expiré + INM → 403 · disabled + INM → 304 (D1), sans INM → 403 · project.json + INM → 200 'private, no-store', 0 ETag · ré-import (UPDATE storage_prefix ← autre projet seed) → jeton2 ≠ jeton1 ; jeton2 + E1 → 200, E2 ≠ E1 ; jeton1 + E1 → 304 · legacy + INM → 200 + ETag · chemin rejeté → 400, calls 0
- test/tile-route-redirect.test.ts inchangé, reste vert (304 avant 302 :61)

### Lots (séquentiels : server.ts commun :739-790)
- L1 C1+C2 (7) : E src/tileMetrics.ts, src/config.ts, src/logRedact.ts, src/server.ts, test/tile-metrics.test.ts, test/tile-route-logs.test.ts, test/log-redact.test.ts
- L2 C3 (6) : E src/tileEtag.ts, src/storage.ts, src/server.ts, src/geoplan/computeProxy.ts, test/tile-etag-304.test.ts, test/tile-rate-key.test.ts ; après L1 ; à couper en 1er si 2.1 repoussé

### Décision (à appendre decisions.md par le chef — pack en lecture seule)
## 2026-10-12 — Route tuile : histogramme mémoire, logLevel warn de route, tag du préfixe signé dans le jeton
- **Contexte** : 304 sans SELECT impose une version du contenu hors DB.
- **Choix** : `v = tilePrefixTag(storage_prefix)` dans le jeton ; ETag = tileEtag(v, rel) ; histogramme 148 seaux, log 1/min ; `logLevel: 'warn'` + ligne onResponse.
- **Écarté** : cache id→préfixe (multi-process) ; prom-client/route (dép. + auth) ; disableRequestLogging (déprécié, status inconnu).
- **Conséquence** : 304 = 2 HMAC + 1 sha1 ; jeton +24 car. ; tout appelant de signTileToken fournit le préfixe.
- **À revoir si** : contenu réécrit en place sous un préfixe existant, ou status['304'] ≈ 0 après 2.1.
Point de non-retour : 304 sans DB ⇒ « contenu sous storage_prefix immuable, sauf project.json » devient invariant porteur ; écriture en place ⇒ nouveau préfixe ou ajout à isMutableManifest.

## Vérifié comment
- `rg signTileToken api/src api/test` → server.ts:545,599,615,864 ; computeProxy.ts:229 ; storage.ts:47 ; tile-rate-key.test.ts:7,17,22,26,30
- `rg storageEtag api/src` → server.ts:521,759,1204 · `rg 'function intIn'` → config.ts:163-166 `Number.isInteger(n) && n >= min && n <= max ? n : def`
- `rg elapsedTime reply.d.ts` → :46 `elapsedTime: number;` · logger.d.ts:37-39 `write(msg: string): void`, :110 `stream?`
- typecheck / tests : NV — 0 code écrit (rôle)

## Écarts
- lecture hors WL : api/node_modules/fastify/types/reply.d.ts (rg elapsedTime) — contrat phase total
- decisions.md non écrit : pack = result.md seul ; bloc ci-dessus à appendre

## Pour la suite
- L1 puis L2, séquentiels (server.ts commun) ; contrats ci-dessus verbatim dans les packs implémenteur
- interdit : lire `req.query`/`req.url` dans tileMetrics ; ETag étape 6 depuis payload.v ; cache d'autorisation (D6)
- interdit : écrire en place sous un storage_prefix existant hors project.json (304 sans DB repose dessus)
- 1.3 n'a de gain qu'avec 2.1 ; mesurer status['304'] (C1) au run k6 T005
- /imported :1197 : C2 transposable 1 ligne ; C3 non — tâche séparée si voulu

## Retour sur le pack
- Manquait : chemin + droit d'append decisions.md (exigé par le rôle) ; reply.d.ts:46 ; tile-rate-key.test.ts (appelant signTileToken) ; storageEtag :1204 (/imported)
- Inutile : tileExp.ts (formule déjà dans le pack), index.ts
