---
pack: T017
projet: geolens-charge-3d
role: verificateur
cree: 2026-10-13
---

# Pack T017 — Casser T016 : cache des droits de tuile et pool pg

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer T016 (commit 382ddc7 : tileGrantCache + PG_POOL_MAX) dans le worktree figé W ; rendre `OK` ou `DÉFAUTS` avec reproduction ; 0 correction.

W = `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016` (worktree détaché sur 382ddc7, `api/node_modules` = lien vers G)

## Definition of Done
- [ ] base : `npm --prefix api run typecheck` et `npm --prefix api test` dans W → synthèses collées (attendu 100 fichiers / 893 tests)
- [ ] fuite de droits : un grant caché pour (u1, p1) peut-il servir (u2, p1), (u1, p2), ou un jeton de projet A sur l'URL du projet B ? (clé, `payload.p !== req.params.id` avant le cache ?)
- [ ] borne TTL : après révocation, tuile servie au plus TTL + durée d'un load en vol ; un load commencé AVANT la révocation et fini APRÈS → stocké avec `at` = fin du load : retard max réel ? chiffrer
- [ ] refus jamais caché : null, throw, rejet → 0 stockage ; un throw ne laisse pas d'entrée `inflight` (fuite mémoire / promesse rejetée partagée à vie)
- [ ] concurrence : N appels même clé → 1 load ; un load rejeté → les N rejettent, l'appel suivant relance
- [ ] mémoire : maxEntries 50 000 respecté sous 100 000 clés distinctes ; `inflight` borné ?
- [ ] storage_prefix : projet republié (storage_prefix change) → ancien préfixe servi ≤ TTL : constaté et chiffré (pas un défaut si ≤ TTL, D16)
- [ ] config : `TILE_GRANT_CACHE_MS` '0','-1','30000.5','60000','60001','abc','' ; `PG_POOL_MAX` '1','2','100','101' → valeurs contre le contrat ; pg-mem → 0
- [ ] verdict + reproductions ; tests de casse écrits UNIQUEMENT sous `W/api/test/verif-t017-*.test.ts`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/tileGrantCache.ts` | L | 51 l, cible |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/server.ts` | L | :730-770 route tuile |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/config.ts` | L | :50-53, :160-172, :240-252 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/db.ts` | L | :38-50, :116-121 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/tileAuth.ts` | L | 43 l, resolveTileGrant |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/test/tile-grant-cache.test.ts` | L | 12 cas, modèle route + révocation |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/test/helpers.ts` | L | makeTestApp(env), login |

## Contrats
```ts
export interface TileGrant { projectId: string; storagePrefix: string }
export interface TileGrantCache {
  /** Positif frais (≤ ttlMs) → servi sans load ; sinon load() ; positif stocké, null/throw jamais stockés.
   *  Appels concurrents même clé pendant un load → même promesse (1 seul SELECT). */
  get(userId: string, projectId: string, load: () => Promise<TileGrant | null>): Promise<TileGrant | null>;
  size(): number; clear(): void;
}
/** ttlMs 0 → passe-plat. Clé `${userId}\u0000${projectId}`. > maxEntries → supprime la plus ancienne. */
export function createTileGrantCache(opts: { ttlMs: number; maxEntries: number; now?: () => number }): TileGrantCache;
// config : tileGrantCacheMs = intIn(env.TILE_GRANT_CACHE_MS, useMemDb ? 0 : 30000, 0, 60000) ; pgPoolMax = intIn(env.PG_POOL_MAX, 10, 2, 100)
// intIn : Number.isInteger(n) && min ≤ n ≤ max ? n : def
// server.ts : const tileGrants = createTileGrantCache({ ttlMs: config.tileGrantCacheMs, maxEntries: 50_000 });
//   grant = await tileMetrics.time(req, 'sql', () => tileGrants.get(payload.u, payload.p, () => resolveTileGrant(db, payload.u, payload.p)));
```
Révocation en test (T016) : `app.db.query('DELETE FROM project_access WHERE project_id=$1', [id])` + membre DEMO (projets arcelor/briancon).

## Décisions actées
- D16 : révocation tuile retardée ≤ 30 s acceptée ; refus jamais cachés ; TTL seul, 0 invalidation admin
- cache par process (N instances = N caches) : accepté, pas un défaut
- défaut 0 sous pg-mem : voulu (tests existants de révocation immédiate)

## Hors périmètre
- toute édition hors `W/api/test/verif-t017-*.test.ts` ; jamais G
- commit ; `git` autre que `status`/`diff`/`log`/`show` dans W
- presign, tileMetrics, 304, k6 ; charge réelle (mesurée par le chef sur le serveur)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; pg-mem ; dans W : `npm --prefix api test` · `npx vitest run <fichier>` depuis `W/api`
- fake timers incompatibles avec la db → horloge injectée (`now`) pour les unitaires

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm/npx dans W/api, rg, git -C W show/log/diff), Write (W/api/test/verif-t017-*, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T017
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
