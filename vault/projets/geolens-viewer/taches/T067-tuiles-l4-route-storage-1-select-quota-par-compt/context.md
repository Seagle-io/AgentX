---
pack: T067
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T067 — Tuiles L4 : route storage → 1 SELECT, quota par compte, 302 S3 présigné (server.ts)

> Seule source de vérité de l'agent T067. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Câbler dans la route `GET /api/projects/:id/storage/*` (server.ts ~:728-802) les briques livrées : auth en 1 SELECT (`resolveTileGrant`), clé de rate-limit par compte (`tileRateKey`), redirection 302 vers URL S3 présignée pour les binaires (`shouldRedirectTile` + `presignGet`, derrière le flag), log de démarrage ; + `.webp` dans CONTENT_TYPES ; tests de route. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] route = ordre contrat (étapes D, 1-6) ; `resolveSignedProject` reste utilisé ailleurs (vignette, objets importés) et inchangé
- [ ] log au démarrage si `config.tilePresign.enabled` (contrat) ; 0 log de `pg.url` / `Location`
- [ ] storage.ts CONTENT_TYPES : + `'.webp': 'image/webp'` (seule ligne de storage.ts)
- [ ] `api/test/tile-route-redirect.test.ts` NEUF : cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 95 fichiers / 827 tests) — sorties collées
- [ ] `git -C G diff --stat -- api` collé : server.ts + storage.ts + 1 test neuf
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | imports ; route ~:728-802 ; log boot près de ~:2479 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | E | CONTENT_TYPES :70-85 (1 ligne) ; presignGet, s3PublicOrigin (L) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-redirect.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | L | resolveTileGrant |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRateKey.ts` | L | tileRateKey |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileRedirect.ts` | L | shouldRedirectTile, redirectCacheControl, TILE_OBJECT_CACHE |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/auth-and-tiles.test.ts` | L | modèle : obtenir tilesetUrl signée, URL de tuile |

## Contrats
```ts
// modules livrés
export async function resolveTileGrant(db: Db, userId: string, projectId: string): Promise<{ projectId: string; storagePrefix: string } | null>;  // tileAuth.ts
export function tileRateKey(config: AppConfig, req: { params: unknown; query: unknown; ip: string }): string;  // tileRateKey.ts : `tu:<u>` | `ti:<ip>`
export function shouldRedirectTile(i: { enabled: boolean; method: string; hasRange: boolean; rel: string }): boolean;  // tileRedirect.ts
export function redirectCacheControl(expiresAtMs: number, nowMs: number): string;  // tileRedirect.ts
export const TILE_OBJECT_CACHE = 'private, max-age=86400, immutable';
// StorageDriver.presignGet?(prefix, rel, { ttlSec, nowMs, responseCacheControl, responseContentType }): Promise<{ url; expiresAtMs } | null>  (S3 seulement)
// storage.ts : contentTypeFor(rel), s3PublicOrigin(config) ; config.tilePresign { enabled, ttlSec }

// ═══ route — ordre exact
// D  route options : { config: { rateLimit: { max: config.rateLimitTileMax, timeWindow: '1 minute', keyGenerator: (req) => tileRateKey(config, req) } } }
//    (commentaire au-dessus : « par compte (jeton vérifié), par IP sinon »)
// 1  payload = verifyTileToken(config, req.query.token) ; !payload || payload.p !== req.params.id → 403 (inchangé)
// 2  const grant = await resolveTileGrant(db, payload.u, payload.p) ; null → 403 { error: 'forbidden', message: 'Accès au projet refusé.' }
//    (remplace `const project = await resolveSignedProject(payload)` ; garder le commentaire sur la coupure immédiate)
// 3  rel = sanitizeRelPath(*) ; null → 400 (inchangé)
// 4  isMutableManifest ; etag = storageEtag(grant.storagePrefix, rel) ; !isMutableManifest && replyNotModified → 304 (inchangé)
// 5  if (shouldRedirectTile({ enabled: config.tilePresign.enabled, method: req.method, hasRange: typeof req.headers.range === 'string', rel }) && app.storage.presignGet) {
//      const now = Date.now();
//      try { const pg = await app.storage.presignGet(grant.storagePrefix, rel, { ttlSec: config.tilePresign.ttlSec, nowMs: now, responseCacheControl: TILE_OBJECT_CACHE, responseContentType: contentTypeFor(rel) });
//            if (pg) return reply.code(302).header('Location', pg.url).header('Cache-Control', redirectCacheControl(pg.expiresAtMs, now)).header('Referrer-Policy', 'no-referrer').send(); }
//      catch (e) { app.log.warn({ tile: rel, project: req.params.id, err: (e as Error).name }, 'tile presign failed → stream'); } }
// 6  suite inchangée (Range, get, 503/404, en-têtes, stream) avec `project.storage_prefix` → `grant.storagePrefix`
// interdits : loguer pg.url / Location ; ETag sur la 302 ; 302 pour HEAD, Range, .json
// boot (près de startRetentionScheduler ~:2479) :
//   if (config.tilePresign.enabled) app.log.info({ origin: s3PublicOrigin(config) }, 'tile presign ON — origine requise CSP viewer + CORS bucket');
```
Cas tile-route-redirect.test.ts (makeTestApp ; driver local ; stub : `app.storage.presignGet = async () => ({ url: 'https://stub.example/x?X-Amz-Signature=s', expiresAtMs: Date.now() + 300_000 })` avec `TILE_PRESIGN_REDIRECT=1`) :
- .b3dm GET → 302, Location = stub, Cache-Control commence par `private, max-age=`, 0 ETag, corps vide, Referrer-Policy no-referrer
- If-None-Match = ETag → 304 (avant toute redirection)
- project.json → 200 no-store ; tileset.json → 200
- Range → 206 (stream) ; HEAD .b3dm → pas de 302
- flag off → 200 stream ; sans presignGet (driver local nu) → 200 ; stub qui lève → 200 + log ∌ `X-Amz` (logger capturé ou espion app.log.warn)
- utilisateur désactivé après émission du jeton → 403
- `makeTestApp({ RATE_LIMIT: '1', RATE_LIMIT_TILE_MAX: '5' })` : compte A ×6 → 6ᵉ 429 ; compte B (même IP, jeton valide sur un projet accessible) ×5 → 0 × 429 ; jeton forgé ×6 → 403 ×5 puis 429

## Décisions actées
- D20 : 302 binaires GET sans Range, flag défaut 0, 304 avant 302, échec presign → stream ; quota par compte ; 1 SELECT ; 0 log d'URL présignée
- D6 : 0 cache d'auth

## Hors périmètre
- web/, Caddyfile, .env (T066 en parallèle) ; tileAuth/tileRateKey/tileRedirect (livrés : défaut → BLQ avec repro)
- autres routes de server.ts ; modifier un test existant (si un test existant casse → BLQ avec nom + sortie)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; rate-limit actif seulement avec RATE_LIMIT=1 ; `npm --prefix api test` ; typecheck (noUnusedLocals : retirer l'import resolveSignedProject seulement s'il n'a plus d'appelant — il en a)
- G sous git, HEAD 378f53c ; SEUL écrivain de api/ ; T066 écrit web/, Caddyfile, .env.production.example en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T067
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
