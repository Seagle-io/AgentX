---
pack: T016
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T016 — Cache des droits de tuile 30 s et pool pg réglable

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Supprimer le SELECT de droits à chaque tuile : cache mémoire TTL des résultats POSITIFS de `resolveTileGrant` par (user, projet), et rendre la taille du pool pg configurable ; 0 changement de comportement hors route tuile.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] `api/src/tileGrantCache.ts` créé selon le contrat ; ≤ 80 l ; 0 dépendance
- [ ] config : `tileGrantCacheMs` = `intIn(env.TILE_GRANT_CACHE_MS, useMemDb ? 0 : 30000, 0, 60000)` ; `pgPoolMax` = `intIn(env.PG_POOL_MAX, 10, 2, 100)` ; champs documentés dans `AppConfig` (1 ligne chacun)
- [ ] db.ts : `createPgPool(databaseUrl, max)` ; `createDb(config)` passe `config.pgPoolMax` ; pg-mem inchangé
- [ ] server.ts : 1 cache créé à côté de `registerTileMetrics` (:732) ; :752 passe par `tileGrants.get(...)` ; reste de la route inchangé
- [ ] tileAuth.ts:1-6 : « 0 cache (D6) » → « cache 30 s des positifs dans tileGrantCache (D16) » ; SQL et fonction inchangés
- [ ] `.env.production.example` : 2 lignes commentées `TILE_GRANT_CACHE_MS=30000` et `PG_POOL_MAX=10`, sous `RATE_LIMIT_TILE_MAX` (:10)
- [ ] `api/test/tile-grant-cache.test.ts` : unitaires (horloge injectée) — hit dans le TTL → 1 seul load ; expiré → reload ; null jamais caché ; throw jamais caché et propagé ; N appels concurrents même clé → 1 load ; éviction au-delà de maxEntries (plus ancien d'abord) ; ttlMs 0 → load à chaque appel ; config : défauts réel/pg-mem, '0', '60001'→défaut, 'abc'→défaut, PG_POOL_MAX '1'→10, '50'→50
- [ ] test route (makeTestApp `{ TILE_GRANT_CACHE_MS: '30000' }`) : retrait d'accès entre 2 GET tuile → 2ᵉ toujours 200 ; même scénario avec `'0'` → 2ᵉ en 403
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 99 fichiers / 881 tests) ; synthèse collée
- [ ] `git -C G status --short -- api/ .env.production.example` → seulement les fichiers WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileGrantCache.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :725-760 route tuile |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :28-60 AppConfig, :160-172 intIn, :216-240 loadConfig |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | E | :38-50 createPgPool, :116-121 createDb |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | E | :1-6 commentaire |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | :10 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-grant-cache.test.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-redirect.test.ts` | L | modèle tileBase/tileUrl :1-40 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(env), login, accès db |

## Contrats
```ts
// tileGrantCache.ts — cible
import type { TileGrant } from './tileAuth.js';
export interface TileGrantCache {
  /** Positif frais (≤ ttlMs) → servi sans load ; sinon load() ; positif stocké, null/throw jamais stockés.
   *  Appels concurrents même clé pendant un load → même promesse (1 seul SELECT). */
  get(userId: string, projectId: string, load: () => Promise<TileGrant | null>): Promise<TileGrant | null>;
  size(): number;
  clear(): void;
}
/** ttlMs 0 → passe-plat (load à chaque appel, 0 stockage). Clé `${userId}\u0000${projectId}`.
 *  Map en ordre d'insertion ; > maxEntries → supprime la plus ancienne. now injectable (tests). */
export function createTileGrantCache(opts: { ttlMs: number; maxEntries: number; now?: () => number }): TileGrantCache;
```
```ts
// tileAuth.ts (inchangé)
export interface TileGrant { projectId: string; storagePrefix: string }
export async function resolveTileGrant(db: Db, userId: string, projectId: string): Promise<TileGrant | null>;
// server.ts:732 / :752 actuels
  const tileMetrics = registerTileMetrics(app, { slowMs: config.tileSlowMs });
      const grant = await tileMetrics.time(req, 'sql', () => resolveTileGrant(db, payload.u, payload.p));
// cible :752
      const grant = await tileMetrics.time(req, 'sql', () => tileGrants.get(payload.u, payload.p, () => resolveTileGrant(db, payload.u, payload.p)));
// cible :732+1
  const tileGrants = createTileGrantCache({ ttlMs: config.tileGrantCacheMs, maxEntries: 50_000 });
// config.ts:168 (inchangé)
function intIn(v: string | undefined, def: number, min: number, max: number): number; // hors bornes / non entier → def
// db.ts actuels
async function createPgPool(databaseUrl: string): Promise<Db> { … new pg.default.Pool({ connectionString: databaseUrl, max: 10 }) … }
export async function createDb(config: AppConfig): Promise<Db> { … return createPgPool(config.databaseUrl); }
```
Constat 13/10 (30 VUs) : phase sql p50 186–273 ms, DB CPU 23 % → attente du pool 10 ; ≈ 22 000 tuiles/min.

## Décisions actées
- D16 : positifs seuls ≤ 30 s ; révocation tuile retardée ≤ TTL acceptée ; refus jamais cachés
- défaut 0 sous pg-mem : tests existants de révocation immédiate restent verts sans retouche
- pas d'invalidation sur les routes d'admin (TTL seul) ; pas de Redis (décision 5 ouverte)
- `tileMetrics.time(req,'sql',…)` garde l'enveloppe : un hit mesure ≈ 0 ms, voulu

## Hors périmètre
- tenancy.ts, session.ts, TILE_GRANT_SQL, test/tile-auth-parity.test.ts : ne pas toucher
- 304 / ETag (L2), presign, tileMetrics.ts, k6
- tests existants : 0 modification
- commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; pg-mem en test ; HEAD G = af9418e ; base 99 fichiers / 881 tests
- arbre G sale hors api/ (web/…, RAPPORT_*) : ne pas toucher
- DoD périmètre : `git -C G status --short -- api/ .env.production.example`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T016
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
