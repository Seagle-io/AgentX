---
pack: T006
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-12
---

# Pack T006 — L1 : chronométrage tuile et logs filtrés (tileMetrics)

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer `api/src/tileMetrics.ts` (histogramme agrégé sql|storage|send|total, 1 log/min) et brancher la route tuile de G en `logLevel: 'warn'` + 1 ligne pour 4xx/5xx/lente, selon le contrat ci-dessous, tests verts.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] `api/src/tileMetrics.ts` exporte exactement les symboles du contrat C1 ; ≤ 400 l, fonctions ≤ 60 l, 0 `any`, 0 `process.env`, 0 import hors `fastify` (types)
- [ ] `api/src/config.ts` : `tileSlowMs` dans AppConfig + `intIn(env.TILE_SLOW_MS, 500, 50, 60000)` dans loadConfig
- [ ] `api/src/logRedact.ts` : `loggerOptions(enabled, stream?)` selon C2 ; sans stream → objet identique à aujourd'hui
- [ ] `api/src/server.ts` : ≤ 3 lignes ajoutées + 4 modifiées, exactement les points d'appel C1 ; `git -C G diff --stat -- api/src/server.ts` collé
- [ ] `api/test/tile-metrics.test.ts`, `api/test/tile-route-logs.test.ts` neufs + cas ajoutés à `api/test/log-redact.test.ts`, couvrant la liste « Tests » ; jeton absent des lignes (`token=` ∅)
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base ≥ 77 fichiers / 690 tests + neufs) ; sortie (ligne de synthèse) collée
- [ ] `rg -n "req\.(query|url)" G/api/src/tileMetrics.ts` → ∅
- [ ] `test/tile-route-redirect.test.ts` inchangé et vert
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileMetrics.ts` | E | neuf |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :8-60 AppConfig, :163 intIn, :210-225 TILE_* |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/logRedact.ts` | E | loggerOptions :39-41 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :1-100 imports/BuildOptions, :150-160, :725-830 route |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-metrics.test.ts` | E | neuf |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-logs.test.ts` | E | neuf |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/log-redact.test.ts` | E | 2 cas |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-redirect.test.ts` | L | modèle de test route tuile, jeton |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/node_modules/fastify/types/logger.d.ts` | L | :37 FastifyLoggerStreamDestination |

## Contrats
C1 — module (verbatim, architecte T002) :
```ts
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
send = onResponse − onSend ; total = `reply.elapsedTime` (fastify types/reply.d.ts:46).
Points d'appel server.ts (ancres `rg`, n° HEAD da5fced) :
```
:14   ~ import { registerTileMetrics } from './tileMetrics.js';   (sur une ligne d'imports existante ou +1)
:96   + logStream?: FastifyLoggerStreamDestination;               // interface BuildOptions :90, tests seulement
:155  ~ logger: loggerOptions(opts.logger ?? false, opts.logStream)
:731  + const tileMetrics = registerTileMetrics(app, { slowMs: config.tileSlowMs });   // avant app.get('/api/projects/:id/storage/*')
:739  + logLevel: 'warn', onSend: tileMetrics.onSend, onResponse: tileMetrics.onResponse,   // dans l'objet options { config: { rateLimit … } }
:749  ~ const grant = await tileMetrics.time(req, 'sql', () => resolveTileGrant(db, payload.u, payload.p));
:789  ~ obj = await tileMetrics.time(req, 'storage', () => app.storage.get(grant.storagePrefix, rel, range));
```
C2 :
```ts
// config.ts — AppConfig + loadConfig (intIn :163 : hors bornes/non entier → défaut)
/** Seuil « tuile lente » (ms, reply.elapsedTime) : au-delà, 1 ligne warn. */
tileSlowMs: number;
tileSlowMs: intIn(env.TILE_SLOW_MS, 500, 50, 60000),
// logRedact.ts — stream ignoré si enabled=false ; absent → objet identique à aujourd'hui
export function loggerOptions(enabled: boolean, stream?: FastifyLoggerStreamDestination):
  false | { serializers: { req: typeof serializeReq }; stream?: FastifyLoggerStreamDestination };
// ligne : {"level":40,"reqId","status","ms","project","tile","ip","sql"?,"storage"?,"send"?,"msg":"tile 4xx"}
```

## Décisions actées
- histogramme fixe, log 1/min, 0 route, 0 dépendance — D6
- `logLevel: 'warn'` de route, pas disableRequestLogging (déprécié) — D6
- warn existants :775/:795/:802 conservés ; doublon 404/503 accepté
- module ne lit jamais req.query/req.url → jeton jamais logué
- D6 projet : 0 cache d'autorisation

## Hors périmètre
- C3 / 304 sans SELECT, tileEtag.ts, signTileToken, storage.ts — reporté (D7)
- presign / S3_PUBLIC_ENDPOINT (lot A, tâche suivante)
- route `/imported/*` (:1197)
- web/, tools/, e2e/ ; fichiers sales de web/ (mission D24) : ne pas toucher
- commit (le chef commite)

## Environnement
- node v22.22.1 ; fastify 5.12.5 ; vitest 2.1.8 ; pg-mem (`USE_MEM_DB=1`) ; incompatible fake timers pour la db → fake timers seulement sur Fastify nu
- `npm --prefix api test` · `npm --prefix api run typecheck` (tsc -p tsconfig.test.json, noUnusedLocals)
- règles G : fichier neuf ≤ 400 l, fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore` ; fix = test
- DoD périmètre : `git -C G status --short -- api/` seulement (web/ sale d'avance)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T006
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
