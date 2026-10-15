---
pack: T020
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-13
---

# Pack T020 — Profil CPU d'un 302 de tuile : jeton, cache, SigV4, Fastify

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Chiffrer en µs CPU par requête ce que coûte un 302 de tuile dans l'API (route complète et chacune de ses étapes), pour savoir quoi retirer avant d'ajouter des process ; 0 modification du code.

W = `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016` (worktree détaché 382ddc7, `api/node_modules` → G)

## Definition of Done
- [ ] bench sous `W/api/test/bench-t020-*.test.ts` (seul endroit écrit, hors result.md) ; lancé par `npx vitest run test/bench-t020-… ` depuis `W/api`
- [ ] µs/op (médiane de 5 séries de ≥ 5 000 ops, après chauffe) pour : `verifyTileToken` · `tileGrants.get` hit (createTileGrantCache) · `presignGet` réel du driver s3 (endpoint factice, 0 I/O) · `shouldRedirectTile` + `redirectCacheControl` · route complète `app.inject` GET tuile binaire → 302 (TILE_PRESIGN_REDIRECT=1, STORAGE_DRIVER=s3, cache 30 s, grant chaud)
- [ ] part de chaque étape dans le total de la route (%) ; reste = Fastify (hooks, rate-limit, tileMetrics, sérialisation)
- [ ] `node --cpu-prof` (ou `--prof`) sur une boucle `app.inject` → top 15 fonctions (self time) ; si impossible sous vitest → NV + raison
- [ ] débit max théorique d'1 process = 1e6 / µs route ; à comparer au constat serveur ≈ 670 req/s à ≈ 100 % d'un cœur
- [ ] 2 pistes chiffrées : (a) cache d'URL présignée par (prefix, rel) sur fenêtre quantifiée — gain µs estimé ; (b) N process — gain attendu ; + toute 3ᵉ piste vue dans le profil
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/server.ts` | L | :732-800 route tuile |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/storage.ts` | L | :40-70 jeton, :380-445 clients S3, :590-615 presignGet |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/tileRedirect.ts` | L | 21 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/tileGrantCache.ts` | L | 51 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/src/tileMetrics.ts` | L | hooks onRequest/onSend/onResponse |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/test/tile-route-redirect.test.ts` | L | modèle tileBase/tileUrl, makeTestApp env |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/test/presign-get.test.ts` | L | config s3 factice pour presignGet |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T016/api/test/helpers.ts` | L | makeTestApp(env), login |

## Contrats
```ts
// storage.ts
export function verifyTileToken(config: AppConfig, token: string | undefined): TileTokenPayload | null;   // :54
async presignGet(prefix, relPath, opts)                                                                  // :598
// server.ts:766-775
if (shouldRedirectTile({ enabled: config.tilePresign.enabled, method: req.method, hasRange: typeof req.headers.range === 'string', rel }) && app.storage.presignGet) {
  const pg = await app.storage.presignGet(grant.storagePrefix, rel, {
    ttlSec: config.tilePresign.ttlSec, nowMs: now, responseCacheControl: TILE_OBJECT_CACHE, responseContentType: contentTypeFor(rel),
  return reply.code(302).header('Location', pg.url)
// tileGrantCache.ts
export function createTileGrantCache(opts: { ttlMs: number; maxEntries: number; now?: () => number }): TileGrantCache;
```
Constat serveur (M3, 30 VUs) : handler 302 p50 1,2 · p95 2,1 ms (tileMetrics total) ; API ≈ 94 % CPU ; ≈ 40 000 req/min ; k6 voit p95 295 ms (file avant handler).
Tests existants : stubPresign (tile-route-redirect) — pour le bench, presign RÉEL du driver s3 (cf. presign-get.test.ts).

## Décisions actées
- pg-mem en bench : la SQL est hors sujet (cache chaud, D16)
- mesure CPU locale ≠ serveur (CPU différent) : rapporter des µs et des parts, pas des absolus serveur

## Hors périmètre
- toute édition hors `W/api/test/bench-t020-*` ; jamais G ; 0 commit
- ssh, serveur de test, k6
- proposer un patch : seulement nommer fichier:ligne et gain estimé

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; fastify 5.12.5 ; @aws-sdk/s3-request-presigner (import dynamique)
- machine locale chargée (load avg élevé constaté) → médiane de séries, noter `uptime` avant/après

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npx vitest dans W/api, node, rg, uptime), Write (W/api/test/bench-t020-*, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T020
statut: fait | bloque
---
## Livré
- étape · µs/op · % de la route
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : top coûts, pistes chiffrées (fichier:ligne, gain µs). Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
