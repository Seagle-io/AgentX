---
pack: T028
projet: geolens-charge-3d
role: verificateur
cree: 2026-10-13
---

# Pack T028 — Casser T025-T026 : cache de tuiles viewer (confidentialité, périmé, quota)

> Seule source de vérité de l'agent T028. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer le module `tileCache.ts` (6f83db5) et le champ API `contentTag`/`viewerUserId` (6efe658) dans le worktree figé W : fuite entre comptes, contenu périmé servi, plugin qui casse le rendu, cache qui grossit sans borne ; rendre `OK` ou `DÉFAUTS` avec reproduction ; 0 correction.

W = `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026` (worktree détaché 6f83db5 ; `web/node_modules`, `api/node_modules` → G)

## Definition of Done
- [ ] base : dans W `npm --prefix web test -- tileCache` + `npm --prefix web run typecheck` + `npm --prefix api test -- project-content-tag` → synthèses collées
- [ ] confidentialité : compte A remplit le cache ; compte B (scope ≠) : installTileCache(B) → les caches de A supprimés au housekeeping ? `purgeTileCaches()` → 0 cache `geolens-tiles-*` restant ; purge({keepScope}) n'épargne QUE ce scope ; un nom de cache forgé (`geolens-tiles-v1/<scopeA>/…` créé par B) peut-il être lu par B via fetchData ? (non attendu : la clé passe par le scope de B)
- [ ] périmé : contentTag change (ré-import) → miss ; même rel, autre projet → miss ; MUTABLE_RE (project.json, multi-pack.json, casse, sous-dossier) → jamais stocké ; `tileset.json` racine et sous-tilesets JSON : stockés ? (immuables sous storage_prefix — conforme D22 sauf project.json) ; TTL 30 j respecté avec horloge
- [ ] clé : `tileCacheKey` avec `..`, `%2e%2e`, `//`, encodage différent du même rel, query avec `token=` ET autre param, fragment `#` → collisions ou évasion de projet ? autre origine / `http://origin.evil` préfixe → null
- [ ] contrat plugin 3d-tiles-renderer 0.3.46 (TilesRendererBase.js:161, :369, :569, :727) : fetchData appelé avec `{ ...fetchOptions, signal }` → abort pendant `c.match` / pendant fetch / après → rejet AbortError propagé comme le fetch natif ? hit renvoyé = Response consommable 1 fois par le renderer (2 lectures du même hit ?) ; erreur Cache Storage (open/match rejettent) → repli fetch, jamais d'exception
- [ ] quota : puts > CHECK_EVERY avec estimate() au-delà du plafond → writable=false ; réponse > 64 Mio sans Content-Length → pic mémoire chiffré ; LRU purge bien d'autres projets du scope, jamais le cache courant
- [ ] API : flag off → JSON strictement identique à avant (ordre/absence de clés) ; `contentTag` non réversible (11 car., pas de préfixe en clair) ; viewerUserId = compte de la session (pas celui du propriétaire du projet)
- [ ] verdict + reproductions ; tests de casse UNIQUEMENT sous `W/web/src/viewer/backend/__tests__/verif-t028-*.test.ts` (et `W/api/test/verif-t028-*.test.ts`)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/web/src/viewer/backend/tileCache.ts` | L | 229 l, cible |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/web/src/viewer/backend/__tests__/tileCache.test.ts` | L | 23 cas, harnais globals simulés |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/web/node_modules/3d-tiles-renderer/src/base/TilesRendererBase.js` | L | :155-200, :360-380, :560-575, :715-735 |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/api/src/tilePrefixTag.ts` | L | 7 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/api/src/server.ts` | L | :612-660 GET /api/projects/:id |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/api/test/project-content-tag.test.ts` | L | 4 cas, modèle |

## Contrats
```ts
export const TILE_CACHE_PREFIX = 'geolens-tiles-v1/';  export const MUTABLE_RE = /(^|\/)(project|multi-pack)\.json$/i;
export function tileCacheScope(userId: string): Promise<string>;                  // hex(sha256('glr-tile-cache|'+userId))[0..16]
export function tileCacheName(scope: string, projectId: string, contentTag: string): string; // PREFIX+scope/projectId/contentTag
export function tileCacheKey(url: string, projectId: string, origin: string): string | null; // `${origin}/__glr-tile-cache/${rel}` ; query ignorée
export function purgeTileCaches(opts?: { keepScope?: string }): Promise<number>;
export function installTileCache(init: { projectId: string; contentTag?: string; userId?: string; origin: string }): (() => TilesPlugin) | null;
// fetchData : key null ∨ method≠GET ∨ Range → fetch(url,opt) ; hit frais → hit ; miss → fetch ; 200 ∧ basic|cors ∧ ¬no-store ∧ writable ∧ ¬aborted → store non attendu
// API : ...(config.viewerTileCache ? { contentTag: tilePrefixTag(project.storage_prefix), viewerUserId: user.userId } : {})
```
Écarts implémenteur T026 : abort pendant lecture du corps → skipped (pas writable=false) ; `typeof window === 'undefined'` → null ; writable global au module, jamais remis à true.

## Décisions actées
- D22 : confidentialité > gain ; résiduel accepté = session expirée sans logout → tuiles lisibles DevTools jusqu'au prochain login/boot
- invariant serveur : contenu sous storage_prefix immuable sauf project.json (multi-pack.json par prudence)
- Cache Storage HTTPS seulement : no-op sur le serveur de test HTTP (pas un défaut)

## Hors périmètre
- câblage (lot C, en cours dans G : install.ts, auth.tsx, idleLogout.ts, TilesRendererLoader.ts) ; toute édition hors fichiers verif-t028-* ; jamais G ; 0 commit
- navigateur réel (NV autorisé, dire ce qui ne peut être prouvé qu'en navigateur)

## Environnement
- web : vitest env node, globals simulés via vi.stubGlobal (caches, window, localStorage, isSecureContext, fetch) — voir tileCache.test.ts ; `npx vitest run <fichier>` depuis `W/web`
- api : `npx vitest run <fichier>` depuis `W/api`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npx vitest dans W/web et W/api, npm --prefix …, rg), Write (verif-t028-* sous W, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T028
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- défaut n : symptôme · repro (fichier:cas) · gravité
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
