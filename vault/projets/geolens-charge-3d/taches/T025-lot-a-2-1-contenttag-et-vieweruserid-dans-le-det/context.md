---
pack: T025
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T025 — Lot A 2.1 : contentTag et viewerUserId dans le détail projet

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Exposer dans `GET /api/projects/:id`, sous le flag `VIEWER_TILE_CACHE=1`, la version du contenu (`contentTag`, tag non réversible du storage_prefix) et l'id du lecteur (`viewerUserId`), pour la clé du cache de tuiles du viewer ; flag off → réponse strictement inchangée.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] `api/src/tilePrefixTag.ts` créé : `tilePrefixTag(storagePrefix)` = base64url(sha256(utf8).subarray(0, 8)) → 11 car. `/^[A-Za-z0-9_-]{11}$/` ; node:crypto seul ; ≤ 15 l
- [ ] config.ts : `viewerTileCache: boolean` (AppConfig, 1 ligne de doc) = `bool(env.VIEWER_TILE_CACHE, false)`, à côté de `tilePresign` (:47, :249)
- [ ] server.ts : objet retourné par GET /api/projects/:id (:630-656) + `...(config.viewerTileCache ? { contentTag: tilePrefixTag(project.storage_prefix), viewerUserId: user.userId } : {}),` ; rien d'autre
- [ ] `.env.production.example` : 1 ligne commentée `# VIEWER_TILE_CACHE=1   # cache tuiles viewer (Cache Storage, HTTPS seulement)` près de :38
- [ ] `api/test/project-content-tag.test.ts` : tilePrefixTag 11 car., déterministe, 2 préfixes → 2 tags, ≠ préfixe brut · flag on → `contentTag === tilePrefixTag(storage_prefix)` (lu en base via app.db) ∧ `viewerUserId === (GET /api/auth/me).user.id` · flag off → les 2 champs absents (`'contentTag' in body` false) · `storage_prefix` jamais présent dans le JSON (rg sur le texte de la réponse) · ré-import simulé (UPDATE projects SET storage_prefix) → contentTag change
- [ ] `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` tout vert (base 101 fichiers / 990 tests) ; synthèses collées
- [ ] `git -C G status --short -- api/ .env.production.example` → seulement les fichiers WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tilePrefixTag.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :1-75 imports, :612-656 GET /api/projects/:id |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | :40-55 AppConfig, :240-255 loadConfig, :162 bool |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | :30-40 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/project-content-tag.test.ts` | E | nouveau |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(env), login, app.db |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/tile-route-redirect.test.ts` | L | :1-40 modèle tileBase (login → projects → detail) |

## Contrats
```ts
// api/src/tilePrefixTag.ts — cible
/** Version du contenu d'un projet, non réversible : b64url(sha256(storage_prefix)[0..8]) → 11 car. Ré-import ⇒ nouveau prefix ⇒ nouveau tag. */
export function tilePrefixTag(storagePrefix: string): string;
// server.ts — GET /api/projects/:id (extraits actuels)
  app.get<{ Params: { id: string } }>('/api/projects/:id', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.sessionUser!;
    const project = await getAccessibleProject(db, user, req.params.id);
    …
    return {
      project: { id: project.id, name: project.name, crs: project.crs, createdAt: project.created_at, ...provenanceOf(project) },
      tilesetUrl, tokenExpiresAt: exp, crossOrg, …
      userLayersEnabled: config.userLayersEnabled,
      userLayersCanPublish: config.userLayersEnabled && canPublishOfficial(project.org_id, user),
    };   // ← ajout du spread juste avant la fermeture
// config.ts
function bool(v: string | undefined, def: boolean): boolean;   // :162
    tilePresign: { enabled: bool(env.TILE_PRESIGN_REDIRECT, false), ttlSec: intIn(env.TILE_PRESIGN_TTL_SEC, 300, 120, 3600) },  // :249
```
Champs consommés par le lot C (viewer) : `contentTag?: string; viewerUserId?: string;`

## Décisions actées
- D22 : flag serveur défaut off = kill switch ; storage_prefix jamais exposé (tag non réversible) ; userId du lecteur = celui de la session
- invariant : contenu sous un storage_prefix immuable (sauf project.json)

## Hors périmètre
- route tuile, jeton, 304/ETag, tileEtag (C3 abandonné, D22)
- web/ (lots B et C)
- tests existants : 0 modification ; commit (le chef commite)

## Environnement
- node v22.22.1 ; vitest 2.1.8 ; pg-mem ; HEAD G = 03a7bcb ; base 101 fichiers / 990 tests
- arbre G sale hors api/ (web/…, RAPPORT_*) : ne pas toucher ; un autre agent (lot B) écrit dans web/ en parallèle
- DoD périmètre : `git -C G status --short -- api/ .env.production.example`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Bash(npm --prefix api test|run typecheck, npx vitest, rg, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T025
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
