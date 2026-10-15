---
pack: T008
projet: geolens-charge-3d
role: verificateur
cree: 2026-10-12
---

# Pack T008 — Casser L1 : chronométrage et logs de la route tuile

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer le lot L1 (commit 038120d : tileMetrics.ts + route tuile logLevel warn) dans le worktree figé W ; rendre `OK` ou `DÉFAUTS` avec reproduction ; 0 correction.

W = `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006` (worktree détaché sur 038120d, `api/node_modules` = lien vers G)

## Definition of Done
- [ ] base : `npm --prefix api run typecheck` et `npm --prefix api test` dans W → synthèses collées
- [ ] fuite de jeton : une ligne de log route tuile (403, 404, 503, lente) peut-elle contenir le jeton, une URL présignée ou `req.url` ? tester via `buildServer({ logger: true, logStream })` (précédent `api/test/tile-route-logs.test.ts`)
- [ ] volume : 200/206/304 rapides → 0 ligne ; rafale 1 000 × 403 → ≤ 600 lignes/fenêtre, `logSuppressed` = excédent ; agrégat 1 ligne/min, 0 ligne si 0 requête
- [ ] justesse : p50/p95/max de `tileMetrics` vs valeurs connues (1..100 ms, distribution bimodale 1 ms ×95 + 1 000 ms ×5) ; sur-estimation ≤ 10 % ; seau de débordement > 110 s
- [ ] `send` : mesuré si 200/206 seulement ; client qui coupe le flux (abort) → pas de fuite WeakMap ni exception non gérée ; `time()` qui lève → phase enregistrée, erreur propagée (503 conservé)
- [ ] `TILE_SLOW_MS` : '49', '60001', 'abc', '' → 500 ; '50' → 50
- [ ] autres routes : `GET /api/projects` garde ses lignes `request completed` (logLevel global intact)
- [ ] `onClose` : flush + clearInterval, pas de timer qui retient le process (`unref`)
- [ ] verdict + reproductions minimales (test vitest ou commande) pour chaque défaut ; tests de casse écrits UNIQUEMENT sous `W/api/test/verif-t008-*.test.ts`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/src/tileMetrics.ts` | L | 203 l, cible |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/src/server.ts` | L | :1-20, :90-100, :150-160, :725-830 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/src/logRedact.ts` | L | loggerOptions |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/src/config.ts` | L | :45-50, :220-230 tileSlowMs |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/test/tile-metrics.test.ts` | L | 21 cas existants |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/test/tile-route-logs.test.ts` | L | 7 cas, modèle logStream |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T006/api/test/tile-route-redirect.test.ts` | L | jeton, fixtures tuile |

## Contrats
```ts
export function registerTileMetrics(app: Pick<FastifyInstance, 'log' | 'addHook'>, opts: TileRouteMetricsOptions): TileRouteMetrics;
export interface TileRouteMetrics {
  time<T>(req: object, phase: 'sql' | 'storage', fn: () => Promise<T>): Promise<T>; // record en finally (y.c. throw)
  onSend(req: object, reply: unknown, payload: unknown): Promise<unknown>;          // t0 envoi ; payload inchangé
  onResponse(req: TileReqLike, reply: TileReplyLike): Promise<void>; // total ; send=now()−t0 si 200|206 ; status ; slow ; ligne si takeLogSlot
  flush(): TileMetricsSnapshot | null; // Σ status > 0 → log.info({ tileMetrics: snap }, 'tile metrics') ; sinon null, 0 log
}
/** ≥500 → error 'tile 5xx' ; 400-499 → warn 'tile 4xx' ; sinon totalMs ≥ slowMs → warn 'tile slow' ; sinon null.
 *  ms arrondis 0.1 ; tile tronqué 200 car. ; sql/storage/send omis si absents. */
export function tileLogLine(i: TileLogInput): TileLogLine | null;
// bucketIndex : ms ≤ 0.1 | NaN | < 0 → 0 ; sinon min(147, ceil(ln(ms/0.1)/ln(1.1))) ; pq = min(bucketUpperMs(i), max)
// TILE_METRICS_WINDOW_MS 60_000 ; TILE_LOG_MAX_PER_WINDOW 600 ; TILE_SLOW_MS intIn(500, 50, 60000)
// ligne : {"level":40,"reqId","status","ms","project","tile","ip","sql"?,"storage"?,"send"?,"msg":"tile 4xx"}
// route : { logLevel: 'warn', onSend: tileMetrics.onSend, onResponse: tileMetrics.onResponse, config: { rateLimit … } }
// server.ts : time(req,'sql', resolveTileGrant) ; time(req,'storage', app.storage.get)
```
Implémenteur T006 : `import type { FastifyLoggerStreamDestination } from 'fastify/types/logger.js'` ; `buildServer({ logger: true, logStream })` réutilisable.

## Décisions actées
- 404/503 → 2 lignes (warn existant + tile 4xx/5xx) : accepté, pas un défaut — D6
- 304 sans SELECT hors lot (D7) : ne pas le signaler comme manque
- histogramme ×1.1 : sur-estimation ≤ 10 % acceptée — D6

## Hors périmètre
- toute édition hors `W/api/test/verif-t008-*.test.ts` ; jamais G (un implémenteur y travaille)
- commit, `git` autre que `status`/`diff`/`log` dans W
- presign / S3 (lot A), viewer, k6

## Environnement
- node v22.22.1 ; fastify 5.12.5 ; vitest 2.1.8 ; pg-mem ; fake timers incompatibles avec la db → seulement sur Fastify nu
- dans W : `npm --prefix api test` · `npm --prefix api run typecheck` · `npx vitest run <fichier>` depuis `W/api`
- base attendue : 98 fichiers / 854 tests verts

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm/npx dans W/api, rg), Write (W/api/test/verif-t008-*.test.ts, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T008
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- défaut n : symptôme · repro (fichier:cas ou commande) · gravité
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
