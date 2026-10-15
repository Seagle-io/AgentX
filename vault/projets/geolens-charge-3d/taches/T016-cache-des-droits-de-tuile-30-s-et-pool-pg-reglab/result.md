---
tache: T016
statut: fait
---
## Livré
- api/src/tileGrantCache.ts:1-51 — cache TTL positifs, dédup in-flight, éviction FIFO
- api/src/config.ts:50-53 — AppConfig tileGrantCacheMs, pgPoolMax documentés
- api/src/config.ts:248-249 — intIn TILE_GRANT_CACHE_MS / PG_POOL_MAX selon contrat
- api/src/db.ts:40-42,120 — createPgPool(url, max) ; createDb passe pgPoolMax
- api/src/server.ts:69 — import createTileGrantCache
- api/src/server.ts:735 — 1 cache maxEntries 50 000 après registerTileMetrics
- api/src/server.ts:752-754 — commentaire D16 + grant via tileGrants.get
- api/src/tileAuth.ts:4 — commentaire D6 → D16 ; SQL inchangé
- .env.production.example:11-12 — 2 lignes commentées sous RATE_LIMIT_TILE_MAX
- api/test/tile-grant-cache.test.ts:1-141 — 7 unitaires + 3 config + 2 route
## Vérifié comment
```
npm --prefix api run typecheck → typecheck exit=0
npx vitest run test/tile-grant-cache.test.ts → Test Files 1 passed (1) · Tests 12 passed (12)
npm --prefix api test → Test Files 100 passed (100) · Tests 893 passed (893) · test exit=0
  (base 99/881 + 1 fichier / 12 tests)
git -C G status --short -- api/ .env.production.example →
 M .env.production.example
 M api/src/config.ts
 M api/src/db.ts
 M api/src/server.ts
 M api/src/tileAuth.ts
?? api/src/tileGrantCache.ts
?? api/test/tile-grant-cache.test.ts
```
## Écarts
- lecture hors WL: api/src/seed.ts (rg) + ls seed-data/storage — membre → project_access arcelor/briancon, tileset.json présent
- server.ts:750-753 commentaire « IMMÉDIATEMENT … 0 cache (D6) » corrigé — devenu faux avec D16
## Pour la suite
- route tuile : révocation retardée ≤ TILE_GRANT_CACHE_MS (30 s prod, 0 pg-mem) ; 0 invalidation admin
- cache mémoire par process : N instances API → N caches indépendants
- PG_POOL_MAX (2..100, défaut 10) à régler avec max_connections Postgres managé × instances
- mesurer phase sql p50 sous 30 VUs après déploiement (constat 186–273 ms avant)
- test route : `app.db.query('DELETE FROM project_access WHERE project_id=$1')` + membre DEMO = révocation simple
## Retour sur le pack
- Manquait: moyen de retirer l'accès en test (table project_access, membre DEMO → projets arcelor/briancon) ; commentaire server.ts:750-753 à mettre à jour
- Inutile: ∅
