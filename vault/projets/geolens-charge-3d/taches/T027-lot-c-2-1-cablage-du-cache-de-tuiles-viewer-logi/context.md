---
pack: T027
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T027 — Lot C 2.1 : câblage du cache de tuiles (viewer, login, logout)

> Seule source de vérité de l'agent T027. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Brancher le module `tileCache.ts` (déjà livré, lot B) : plugin enregistré sur le TilesRenderer du viewer, installé depuis le détail projet (champs `contentTag`/`viewerUserId` du lot A), purge à la déconnexion et à l'inactivité, purge sélective au login ; aucune autre modification.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] TilesRendererLoader.ts : EXACTEMENT 3 lignes insérées après :142 (fermeture du `if (signFn)`), texte du contrat ; `git -C G diff -U0 -- web/src/viewer/loaders/TilesRendererLoader.ts` montre ce hunk en plus des hunks préexistants (:35, :266-311, :342-349, :681-710) INCHANGÉS
- [ ] install.ts : `ProjectDetail` (:13-44) + `contentTag?: string; viewerUserId?: string;` ; après `window.__glrSignUrl = makeSignUrl(ctx);` (:113) l'installation du plugin (contrat) ; import de `installTileCache`, `type TilesPlugin`
- [ ] web/src/api.ts:105 `ProjectDetail` + `contentTag?: string; viewerUserId?: string;`
- [ ] auth.tsx : login (:32-35) après `setUser(user)` → purge sélective ; logout (:36-39) AVANT `api.post` → `await purgeTileCaches()` ; import depuis `./viewer/backend/tileCache`
- [ ] idleLogout.ts `defaultOnIdle` (:33-37) : avant `window.location.href` → `try { await purgeTileCaches(); } catch { /* ignore */ }`
- [ ] tests : auth/idleLogout — si un test existant couvre logout/idle, il reste vert ; ajouter 1 test vitest `web/src/viewer/backend/__tests__/tileCacheWiring.test.ts` : `defaultOnIdle`-équivalent ou `purgeTileCaches` appelé avant redirection (spy) — si non testable sans refactor : NV + raison
- [ ] `npm --prefix web run typecheck` exit 0 ; `npm --prefix web run build:viewer-types` exit 0 ; `npm --prefix web test` → synthèse collée (échecs préexistants listés, comparés à `git stash`-free baseline : relancer sur fichiers non touchés seulement)
- [ ] `git -C G status --short -- web/` → seulement les fichiers WL (+ fichiers sales préexistants : TilesRendererLoader.ts, qualityHud.ts, errorTargetRefine*)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | E | :136-143 SEULEMENT (+3 l. après :142) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | E | :1-46, :95-120 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/api.ts` | E | :105 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/auth.tsx` | E | 48 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/idleLogout.ts` | E | 72 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/tileCacheWiring.test.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/tileCache.ts` | L | exports (lot B) |

## Contrats
```ts
// TilesRendererLoader.ts — actuel :137-142
  const tilesRenderer: TilesRendererInstance = new TilesRenderer(url);
  if (signFn) {
    tilesRenderer.preprocessURL = (uri: string | URL) => signFn(uri.toString());
  }
// + 3 lignes après :142 (cast : TilesRendererInstance n'expose pas registerPlugin)
  const mkTileCache = typeof window !== 'undefined' ? (window as unknown as { __glrTileCachePlugin?: (() => object) | null }).__glrTileCachePlugin : undefined;
  const tileCachePlugin = mkTileCache ? mkTileCache() : null;
  if (tileCachePlugin) (tilesRenderer as unknown as { registerPlugin(p: object): void }).registerPlugin(tileCachePlugin);
// install.ts — après :113 `window.__glrSignUrl = makeSignUrl(ctx);`
  (window as unknown as { __glrTileCachePlugin?: (() => TilesPlugin) | null }).__glrTileCachePlugin =
    installTileCache({ projectId, contentTag: detail.contentTag, userId: detail.viewerUserId, origin });
// auth.tsx
  const login = async (email: string, password: string): Promise<void> => {
    const { user } = await api.post<{ user: PublicUser }>('/api/auth/login', { email, password });
    setUser(user);
    void tileCacheScope(user.id).then((s) => purgeTileCaches({ keepScope: s })).catch(() => {});
  };
  const logout = async (): Promise<void> => {
    await purgeTileCaches();
    await api.post('/api/auth/logout');
    setUser(null);
  };
// tileCache.ts (lot B) — exports utilisés
export function tileCacheScope(userId: string): Promise<string>;
export function purgeTileCaches(opts?: { keepScope?: string }): Promise<number>;   // 0 throw
export function installTileCache(init: { projectId: string; contentTag?: string; userId?: string; origin: string }): (() => TilesPlugin) | null;
export interface TilesPlugin { name: 'GLR_TILE_CACHE'; fetchData(url: string, options?: RequestInit): Promise<Response> }
```
`origin` et `projectId` existent déjà dans install.ts (:100-110). `PublicUser.id` = id du compte (= `viewerUserId` côté API, testé lot A).

## Décisions actées
- D22 : purge totale logout/idle, sélective login ; kill switch serveur (VIEWER_TILE_CACHE) + localStorage `glr.tileCache=off`
- TilesRendererLoader.ts : autre mission en cours dans ce fichier → 3 lignes, rien d'autre ; le chef commitera ces 3 lignes seules

## Hors périmètre
- tileCache.ts (lot B, lecture seule), api/ (lot A)
- CSP viewer.html, HttpBackend.ts, COPC
- commit (le chef commite)

## Environnement
- web : vite + vitest (env node) ; `npm --prefix web run typecheck` (tsconfig.json) et `build:viewer-types` (tsconfig.viewer.json) ; HEAD G après lots A/B
- arbre G sale préexistant : TilesRendererLoader.ts (hunks listés), qualityHud.ts, errorTargetRefine* — ne jamais les modifier/annuler

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix web test|run typecheck|run build:viewer-types, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T027
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
