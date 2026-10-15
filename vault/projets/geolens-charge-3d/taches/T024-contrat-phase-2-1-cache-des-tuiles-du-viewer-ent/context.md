---
pack: T024
projet: geolens-charge-3d
role: architecte
cree: 2026-10-13
---

# Pack T024 — Contrat phase 2.1 : cache des tuiles du viewer entre sessions

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire le contrat exécutable d'un cache persistant des tuiles 3D côté navigateur (Cache Storage) pour qu'une revisite d'un projet ne refasse aucune requête tuile, sans servir un contenu périmé après ré-import ni exposer les tuiles d'un compte à un autre sur un poste partagé ; 0 code de production.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] Q1 point d'accroche tranché (✔/✗ justifiés ≤ 8 mots) : override `fetchData` du TilesRenderer (TilesRendererLoader.ts près de :137-141) · plugin 3d-tiles-renderer · Service Worker ; contrainte : TilesRendererLoader.ts a des modifs NON commitées d'une autre mission aux hunks :35, :266-311, :342-349, :681-710 → l'accroche choisie ne doit toucher aucune de ces zones (≤ 6 lignes dans ce fichier, ou 0)
- [ ] Q2 clé de cache : version du contenu sans requête en plus ; options : `contentTag` (= tag 11 car. du storage_prefix, non secret) ajouté à la réponse `GET /api/projects/:id` (server.ts:616-640) et transmis par install.ts · ou `v` dans le jeton (C3 ci-dessous) ; clé = `/{projectId}/{tag}/{rel sans token}` ; project.json et tout manifeste mutable exclus
- [ ] Q3 exclusions : Range (COPC, HttpBackend.ts:200-240), statut ≠ 200, réponse opaque, corps > plafond ; méthode ≠ GET
- [ ] Q4 confidentialité : nom de cache par compte (`geolens-tiles-<hash userId>`) ; purge au logout (auth.tsx:36-38, idleLogout.ts:30-36) et au boot si le compte courant ≠ propriétaire ; aucune tuile d'un autre compte lisible
- [ ] Q5 taille : plafond (ex. 1,5 Go via `navigator.storage.estimate()` vérifié 1×/N puts) → au-delà, plus d'écriture + purge des tags d'autres versions du même projet ; échec `put` (QuotaExceeded) = silencieux
- [ ] Q6 redirection 302 (TILE_PRESIGN_REDIRECT) : fetch suit le 302 ; la réponse S3 (même origine sur le serveur de test, cross-origin CORS en prod Scaleway) est-elle stockable (`type` basic/cors) ? sinon NE PAS stocker ; CSP inchangée ?
- [ ] contrat verbatim : signatures TS du module (ex. `web/src/viewer/backend/tileCache.ts`), points d'appel (fichier:ligne), champ API (type + server.ts:ligne + web/src/api.ts type), kill switch (ex. `localStorage['glr.tileCache']='off'`), tests vitest exigés (web : `copcHttpBackend.test.ts` = précédent) + test API
- [ ] lots d'implémentation (WL ≤ 12 chacun, fichiers E/L) ; ordre ; ce que mesure k6 (aucun — navigateur) vs mesure manuelle
- [ ] décision prête à appendre (bloc ## Décision) dans result.md
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | :113-145 création renderer, signFn |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | L | 164 l, détail projet → ctx, __glrSignUrl |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | :1-60 makeSignUrl, :200-240 Range/COPC |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/auth.tsx` | L | 48 l, logout |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/idleLogout.ts` | L | 72 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/api.ts` | L | types réponse projet |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :612-645 GET /api/projects/:id ; :740-800 route tuile (ETag, Cache-Control) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/node_modules/3d-tiles-renderer/src/base/TilesRendererBase.js` | L | fetchData, preprocessURL (déprécié :102) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | :13 CSP |

## Contrats
```ts
// server.ts:616-617 — URL signée du tileset
const token = signTileToken(config, { p: project.id, u: user.userId, exp });
const tilesetUrl = `/api/projects/${project.id}/storage/${project.tileset_path}?token=${encodeURIComponent(token)}`;
// réponse GET /api/projects/:id : { project:{id,name,crs,createdAt,…provenance}, tilesetUrl, tokenExpiresAt, crossOrg, orgName?, thumbnailStatus, … }
// tileRedirect.ts : TILE_OBJECT_CACHE = 'private, max-age=86400, immutable' ; binaires = /\.(b3dm|pnts|i3dm|cmpt|glb|bin|ktx2|jpe?g|png|webp)$/i
```
C3 (T002, non implémenté) : `v = tilePrefixTag(storage_prefix)` = b64url(sha256(prefix)[0..8]) 11 car., dans le jeton signé ; invariant : contenu sous un storage_prefix immuable sauf project.json ; ré-import ⇒ nouveau storage_prefix.
Faits : URL tuile = `/api/projects/:id/storage/<rel>?token=…` (token change toutes les 4 h, TILE_URL_WINDOW_SEC) ; 302 → `http://82.65.97.67:34580/geolens/<prefix>/<rel>?X-Amz-…` (test, même origine) ; prod Scaleway = `https://<bucket>.s3.fr-par.scw.cloud` (cross-origin) ; cache de droits 30 s (D16) ⇒ un 304 ne coûte plus de SELECT : L2 (304 sans SELECT) n'est PAS l'objectif ici.

## Décisions actées
- D16/D21 : objectif charge tenu ; 2.1 = gain navigateur (revisite → 0 requête), pas un correctif de charge
- confidentialité > gain : en cas de doute, ne pas stocker
- 0 modification des hunks non commités de TilesRendererLoader.ts (autre mission)
- pas de nouvelle dépendance npm

## Hors périmètre
- code de production, tests (écrits par les implémenteurs)
- 304 / ETag serveur (L2) sauf si la clé l'exige ; presign, k6
- COPC / nuages de points (Range)

## Environnement
- 3d-tiles-renderer 0.3.46 (fetch natif) ; three r184 ; vite ; vitest côté web ; HEAD G = 03a7bcb
- viewer = page séparée `viewer.html` (CSP propre :13), portail React = `index.html`
- `rg` autorisé sur G/web/src et le module 3d-tiles-renderer pour localiser (pas de lecture de fichier hors WL)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg, sed -n), Write (result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T024
statut: fait | bloque
---
## Livré
- Q1..Q6 : ✔ choix / ✗ écartés, contrat verbatim, lots
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
