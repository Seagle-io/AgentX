---
pack: T026
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T026 — Lot B 2.1 : module tileCache du viewer et ses tests

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire le module autonome `tileCache.ts` (plugin `fetchData` 3d-tiles-renderer + Cache Storage par compte/projet/version, purge, plafond, TTL) et ses tests vitest, exactement selon le contrat ; aucun câblage (lot C).

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] `web/src/viewer/backend/tileCache.ts` : 0 import ; exports et séquence = contrat verbatim ; aucune fonction exportée ne throw (try/catch) ; ≤ 260 l
- [ ] `web/src/viewer/backend/__tests__/tileCache.test.ts` : CacheStorage + fetch + window/localStorage/isSecureContext SIMULÉS (env node, aucun jsdom) ; cas : miss → 1 fetch + put, 2ᵉ → 0 fetch mêmes octets · 2 tokens même rel → 1 fetch · autre tag → miss · project.json / multi-pack.json → 0 put · 206/404/500/opaque/no-store → 0 put · Range / POST / autre origine / autre projet → passthrough (fetch appelé avec url+opt inchangés) · > 64 Mio → réponse rendue, 0 put · put rejette QuotaExceeded → 0 throw, writable=false · signal aborté → 0 put · réponse redirigée type cors 200 → put · TTL dépassé → refetch · kill switch / !isSecureContext / contentTag absent / userId absent → null (+ purge si userId/contentTag absent) · purge({keepScope}) · housekeeping (autres scopes, autres tags du projet, `geolens-tiles-v0/…`) · tileCacheScope : 16 hex, déterministe, ≠ id
- [ ] `npm --prefix web test -- tileCache` vert ; `npm --prefix web run typecheck` exit 0 ; `npm --prefix web test` → synthèse collée (échecs préexistants hors tileCache listés, pas corrigés)
- [ ] `git -C G status --short -- web/src/viewer/backend/` → seulement les 2 fichiers neufs
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/tileCache.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/tileCache.test.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/copcHttpBackend.test.ts` | L | précédent : fetch simulé, vitest |

## Contrats
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
/** hex(sha256('glr-tile-cache|' + userId)).slice(0, 16) — jamais l'id brut. (crypto.subtle) */
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
//  plafond = min(TILE_CACHE_MAX_BYTES, 0.6 × estimate().quota)
// housekeeping init (0 throw) : delete startsWith('geolens-tiles-') ∧ ¬startsWith(PREFIX+scope+'/') ; delete PREFIX+scope+'/'+projectId+'/*' ≠ name ;
//  estimate ; > plafond → suppression caches du scope par LRU (≠ name) jusqu'à < 0,8×plafond, sinon writable=false
```
Précédent fetch simulé (copcHttpBackend.test.ts) : `fetch` remplacé par une fonction `(input, init) => Promise<Response>` qui journalise ; `afterEach` restaure (`vi.unstubAllGlobals` / `vi.restoreAllMocks`).
Node 22 : `Response`, `Headers`, `crypto.subtle` natifs ; `caches`, `window`, `localStorage`, `isSecureContext` absents → `vi.stubGlobal`. `Response.type` est en lecture seule : pour basic/cors/opaque, simuler un objet réponse (Object.defineProperty sur une Response) .

## Décisions actées
- D22 : plugin fetchData ; clé sans query ; confidentialité > gain (en cas de doute, ne pas stocker) ; 0 Service Worker
- `store` jamais attendu par fetchData (pas de latence ajoutée au rendu)

## Hors périmètre
- câblage install.ts / TilesRendererLoader.ts / auth.tsx / idleLogout.ts / api.ts (lot C)
- TilesRendererLoader.ts : NE PAS OUVRIR (modifs non commitées d'une autre mission)
- api/ (lot A en parallèle) ; commit (le chef commite)

## Environnement
- web : vite + vitest (`npm --prefix web test` = `vitest run`), env node par défaut ; TS strict (`npm --prefix web run typecheck`)
- 3d-tiles-renderer 0.3.46 : `registerPlugin(plugin)` ; plugin.fetchData(url, options) appelé avec l'URL déjà signée (preprocessURL avant) ; le 1er plugin qui définit fetchData gagne
- HEAD G = 03a7bcb ; arbre G sale : web/src/viewer/loaders/TilesRendererLoader.ts, web/src/viewer/ui/qualityHud.ts, errorTargetRefine* — ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix web test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T026
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
