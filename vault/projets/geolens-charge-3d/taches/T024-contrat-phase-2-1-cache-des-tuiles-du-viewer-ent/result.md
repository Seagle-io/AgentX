---
tache: T024
statut: fait
---
## Livré
- contrainte qui décide : token dans l'URL tuile (fenêtre 4 h) + presign S3 → cache HTTP natif rate ; il faut une clé stable hors URL
- Q1 ✔ plugin 3d-tiles-renderer `fetchData` — API supportée, 3 lignes après TilesRendererLoader.ts:142
  - preuve : TilesRendererBase.js:832-834 plugins avant renderer ; :565→569 et :613→727 preprocessURL(signFn) PUIS fetchData → plugin reçoit l'URL signée
  - ✗ override `tilesRenderer.fetchData` — monkeypatch, non testable isolé · ✗ Service Worker — KO en HTTP, survit au kill switch · ✗ « bêtement » cache HTTP (immutable 24 h + ETag) — token/X-Amz changent → clé change
- Q2 ✔ `contentTag` = tilePrefixTag(storage_prefix) dans GET /api/projects/:id — 0 requête · ✗ `v` dans jeton — C3 absent, couple client au jeton
  - cache = `geolens-tiles-v1/{scope}/{projectId}/{contentTag}` ; clé = `{origin}/__glr-tile-cache/{rel}` (query ignorée) ; ré-import ⇒ nouveau prefix ⇒ nouveau cache
- Q3 ✔ stocké ssi GET ∧ sans Range ∧ status 200 ∧ type basic|cors ∧ ¬no-store ∧ ≤ 64 Mio ∧ ¬MUTABLE_RE ∧ signal non aborté ; sinon passthrough `fetch(url, opt)` intact
- Q4 ✔ scope = sha256('glr-tile-cache|'+userId)[hex 0..16] ; userId = nouveau champ `viewerUserId` (viewer ne connaît pas l'id : install.ts:13-44 ∅)
  - purge totale : logout (auth.tsx:36-39) · idle (idleLogout.ts:33-37) · flag off ; sélective : login portail (garde son scope) · boot viewer (autres scopes/tags/versions)
  - résiduel : session expirée sans logout → tuiles A lisibles DevTools jusqu'au prochain login/boot ; = exposition cache HTTP actuel
- Q5 ✔ plafond = min(1,5 Gio, 0,6×quota) sur `estimate().usage` ; check à l'init + tous les 64 puts ; init > plafond → suppression caches du scope par LRU (`glr.tileCache.lru`) jusqu'à < 0,8×plafond, sinon writable=false ; put KO (QuotaExceeded…) → writable=false, silencieux ; TTL entrée 30 j
- Q6 ✔ fetch suit le 302 (redirect 'follow') ; test = même origine → type basic ; prod Scaleway → type cors (CORS requis déjà pour le rendu) ; on stocke un `new Response(blob)` neuf sous clé synthétique, jamais l'objet redirigé ; opaque/opaqueredirect → ✗ ; CSP viewer.html:13 inchangée (clé jamais fetchée, Cache Storage hors CSP)
- ⚠ Cache Storage = secure context only : serveur test `http://82.65.97.67:34580` → `caches` undefined → no-op (mesure via flag Chrome, cf. lots)

```ts
// ── web/src/viewer/backend/tileCache.ts (NEUF, 0 import : chargé par portail ET viewer) ──
export const TILE_CACHE_PREFIX = 'geolens-tiles-v1/';           // purge = startsWith('geolens-tiles-')
export const TILE_CACHE_KILL_KEY = 'glr.tileCache';              // localStorage 'off' → installTileCache = null
export const TILE_CACHE_LRU_KEY = 'glr.tileCache.lru';           // JSON { [cacheName]: lastUsedMs }
export const TILE_CACHE_MAX_BYTES = 1.5 * 1024 ** 3, TILE_CACHE_MAX_ENTRY_BYTES = 64 * 1024 ** 2;
export const TILE_CACHE_TTL_MS = 30 * 24 * 3600 * 1000, TILE_CACHE_CHECK_EVERY = 64; // TTL via en-tête 'X-Glr-Cached-At'
export const MUTABLE_RE = /(^|\/)(project|multi-pack)\.json$/i;
export interface TileCacheStats { hits: number; misses: number; puts: number; skipped: number; writable: boolean }
export interface TilesPlugin { name: 'GLR_TILE_CACHE'; fetchData(url: string, options?: RequestInit): Promise<Response> }
export interface TileCacheInit { projectId: string; contentTag?: string; userId?: string; origin: string }
/** hex(sha256('glr-tile-cache|' + userId)).slice(0, 16) — jamais l'id brut. */
export function tileCacheScope(userId: string): Promise<string>;
/** `${TILE_CACHE_PREFIX}${scope}/${projectId}/${contentTag}` */
export function tileCacheName(scope: string, projectId: string, contentTag: string): string;
/** `${origin}/__glr-tile-cache/${rel}` ; rel = pathname après `/api/projects/${encodeURIComponent(projectId)}/storage/`, brut.
 *  null si : autre origine · autre projet · data:/blob: · MUTABLE_RE · URL invalide. Query (token) ignorée. */
export function tileCacheKey(url: string, projectId: string, origin: string): string | null;
/** Supprime tout cache startsWith('geolens-tiles-') sauf `${TILE_CACHE_PREFIX}${keepScope}/*`. 0 throw. → nb supprimés. */
export function purgeTileCaches(opts?: { keepScope?: string }): Promise<number>;
/** null (0 throw) si kill switch · !isSecureContext · !('caches' in window) · contentTag ou userId absent
 *  (dans ce dernier cas lance `void purgeTileCaches()`). Sinon : maj LRU, housekeeping async non bloquant,
 *  renvoie une FABRIQUE (1 plugin neuf par TilesRenderer — registerPlugin refuse la réutilisation). */
export function installTileCache(init: TileCacheInit): (() => TilesPlugin) | null;
/** Aussi exposé en window.__glrTileCacheStats (mesure manuelle). */
export function getTileCacheStats(): TileCacheStats;

// fetchData(url, opt) — séquence normative
//  key = tileCacheKey(url) ; si !key ∨ (opt.method ?? 'GET') ≠ 'GET' ∨ new Headers(opt.headers).has('range') → return fetch(url, opt)
//  c = await opened (caches.open(name), mémoïsé) ; hit = await c.match(key) (catch → null)
//  hit ∧ now − Number(hit.headers.get('X-Glr-Cached-At')) < TTL → hits++ ; return hit (0 requête) ; hit périmé → void c.delete(key)
//  misses++ ; res = await fetch(url, opt)
//  res.status===200 ∧ res.type∈{basic,cors} ∧ !/no-store/i.test(CC) ∧ writable ∧ !opt.signal?.aborted → void store(c, key, res.clone()) (NON attendu) ; sinon skipped++
//  return res  // réponse d'origine intacte
// store : blob = await clone.blob() ; size > MAX_ENTRY → skipped ; c.put(key, new Response(blob, { status: 200, headers: { 'Content-Type': ct, 'X-Glr-Cached-At': String(now) } }))
//  catch(*) → writable=false ; puts % CHECK_EVERY === 0 → estimate() ; usage ≥ plafond → writable=false
// housekeeping init (0 throw) : delete startsWith('geolens-tiles-') ∧ ¬startsWith(PREFIX+scope+'/') ; delete PREFIX+scope+'/'+projectId+'/*' ≠ name ; estimate ; > plafond → LRU (≠ name)

// ── api/src/tilePrefixTag.ts (NEUF, = C3 de T002) ──
export function tilePrefixTag(storagePrefix: string): string;   // b64url(sha256(prefix).subarray(0, 8)) → /^[A-Za-z0-9_-]{11}$/
// ── api/src/server.ts:632-656 objet retourné par GET /api/projects/:id, ajout ──
...(config.viewerTileCache ? { contentTag: tilePrefixTag(project.storage_prefix), viewerUserId: user.userId } : {}),
// config : viewerTileCache: boolean ← process.env.VIEWER_TILE_CACHE === '1' ; défaut false (= kill switch serveur)
// ── web/src/api.ts:105 ProjectDetail ET install.ts:13-44 ProjectDetail, ajout ──
contentTag?: string; viewerUserId?: string;

// ── points d'appel ──
// TilesRendererLoader.ts — insérer après :142, 3 lignes, hors hunks :35/:266-311/:342-349/:681-710
const mkTileCache = typeof window !== 'undefined' ? (window as unknown as { __glrTileCachePlugin?: (() => object) | null }).__glrTileCachePlugin : undefined;
const tileCachePlugin = mkTileCache ? mkTileCache() : null;
if (tileCachePlugin) tilesRenderer.registerPlugin(tileCachePlugin);
// install.ts — après :113
(window as unknown as { __glrTileCachePlugin?: (() => TilesPlugin) | null }).__glrTileCachePlugin =
  installTileCache({ projectId, contentTag: detail.contentTag, userId: detail.viewerUserId, origin });
// auth.tsx:32-35 login, après setUser(user) : void tileCacheScope(user.id).then((s) => purgeTileCaches({ keepScope: s })).catch(() => {});
// auth.tsx:36-39 logout, AVANT api.post : await purgeTileCaches(); · idleLogout.ts:33-37, avant location.href : try { await purgeTileCaches(); } catch { /* ignore */ }

// ── tests exigés ──
// web/src/viewer/backend/tileCache.test.ts (vitest, CacheStorage + fetch simulés ; précédent copcHttpBackend.test.ts) :
//  miss→1 fetch+put, 2e→0 fetch mêmes octets · 2 tokens même rel→1 fetch · autre tag→miss · project.json/multi-pack.json→0 put
//  206/404/500/opaque/no-store→0 put · Range/POST/autre origine/autre projet→passthrough · >64 Mio→rendu, 0 put
//  put rejette QuotaExceeded→0 throw, writable=false · signal aborté→0 put · redirected cors 200→put · TTL dépassé→refetch
//  kill switch/!isSecureContext/contentTag absent→null (+purge) · purge({keepScope}) · housekeeping (scopes, tags, 'geolens-tiles-v0/…')
//  tileCacheScope : 16 hex, déterministe, ≠ id
// API : tilePrefixTag (11 car., déterministe, 2 prefixes→2 tags) ; GET /api/projects/:id flag on → contentTag
//  = tilePrefixTag(storage_prefix) ∧ viewerUserId === /api/auth/me user.id ; flag off → 2 champs absents ; storage_prefix jamais exposé
```
- lots (ordre A ∥ B → C → mesure) :
  - A API (WL 4-5) : E `api/src/tilePrefixTag.ts` · E server.ts:632-656 · E config (chemin NV) · E test API projet (chemin NV) · E test tilePrefixTag
  - B module (WL 3) : E `web/src/viewer/backend/tileCache.ts` · E `tileCache.test.ts` · L `copcHttpBackend.test.ts`
  - C câblage (WL 6) : E install.ts · E TilesRendererLoader.ts (3 l. après :142) · E auth.tsx · E idleLogout.ts · E api.ts · L tileCache.ts
  - k6 : ∅ mesurable (cache navigateur). Manuel : Chrome `--unsafely-treat-insecure-origin-as-secure=http://82.65.97.67:34580 --user-data-dir=<tmp>`, VIEWER_TILE_CACHE=1, 2 visites projet → 2e : Network `/storage/` tuiles = 0 ; `__glrTileCacheStats.hits` > 0 ; logout → DevTools Cache Storage ∅
- point de non-retour : caches dans les navigateurs clients (format = préfixe `v1`, changement ⇒ bump + purge auto) ; invariant « storage_prefix immuable sauf project.json » devient critique 30 j côté client ; `contentTag`/`viewerUserId` = contrat API public
- décision à appendre :
```markdown
## 2026-10-13 — Cache tuiles viewer : plugin fetchData + Cache Storage par compte/projet/contentTag
- **Contexte** : token tuile dans l'URL (4 h) + presign → cache HTTP inutile entre visites ; confidentialité > gain.
- **Choix** : plugin 3d-tiles-renderer `fetchData` (3 l. TilesRendererLoader:142) ; cache `geolens-tiles-v1/{sha256(userId)[16]}/{projectId}/{contentTag}` ; `contentTag`+`viewerUserId` dans GET /api/projects/:id sous VIEWER_TILE_CACHE ; purge logout/idle/flag off, sélective login/boot ; plafond min(1,5 Gio, 0,6×quota), TTL 30 j.
- **Écarté** : Service Worker (survit au kill switch, KO en HTTP) ; `v` dans le jeton (C3 non implémenté) ; override méthode (monkeypatch) ; cache HTTP (URL change).
- **Conséquence** : revisite = 0 requête tuile en HTTPS ; no-op sur serveur test HTTP ; toute réécriture en place sous un storage_prefix servirait du périmé.
- **À revoir si** : une fonction réécrit un fichier sous un storage_prefix existant ; ou Cache Storage évincé (estimate) avant revisite.
```
## Vérifié comment
- `rg -n "fetchData|preprocessURL" TilesRendererBase.js` → `102: set preprocessURL( v )` · `369: fetchData( url, options )` · `565/613: plugin.preprocessURL(...)` · `569: plugin.fetchData( processedUrl, this.fetchOptions )` · `727: plugin.fetchData( uri, { ...this.fetchOptions, signal } )`
- TilesRendererBase.js:834 → `const plugins = [ ...this.plugins, this ];` ; :165 → `A plugin can only be registered to a single tile set`
- `rg -n "api/auth/logout|caches\.|isSecureContext|registerPlugin" web/src` → `auth.tsx:37` · `idleLogout.ts:34` (caches/registerPlugin ∅)
- `rg -n "tilePrefixTag|contentTag|storageEtag" G` → `server.ts:523/764/1209 storageEtag` seulement ; install.ts:13-44 ∅ id utilisateur
- Q6 runtime (type basic/cors après 302) : NV — pas de navigateur → test « redirected cors » + mesure manuelle
- `user.userId` (session) === `PublicUser.id` (api.ts:93) : NV — test API exigé
## Écarts
- rg `tilePrefixTag|contentTag|storageEtag` sur G entier (api/ inclus, hors périmètre rg web/src) — vérifier C3 non implémenté ; 0 lecture de fichier hors WL
## Pour la suite
- Choix : plugin `fetchData` enregistré via fabrique `window.__glrTileCachePlugin` (install.ts) — 3 lignes après TilesRendererLoader.ts:142, rien d'autre dans ce fichier
- Interdit : clé contenant le token/la query ; stocker 206/Range/opaque/no-store/project.json/multi-pack.json ; throw depuis tileCache.ts
- Interdit : réécrire un fichier sous un storage_prefix existant (sinon bump contentTag) ; Service Worker
- `tileCache.ts` 0 import (chargé par portail et viewer) ; contentTag absent ⇒ no-op + purge (kill switch serveur VIEWER_TILE_CACHE, défaut off)
- Lots : A API ∥ B module → C câblage → mesure manuelle Chrome flag secure-origin (serveur test HTTP = no-op natif)
- k6 ne mesure rien ici ; preuve = Network `/storage/` 0 tuile à la 2e visite + `__glrTileCacheStats`
## Retour sur le pack
- Manquait: serveur test en HTTP ⇒ Cache Storage indisponible (secure context) ; viewer sans userId (champ API requis) ; chemins config API et test API projet
- Inutile: ∅
