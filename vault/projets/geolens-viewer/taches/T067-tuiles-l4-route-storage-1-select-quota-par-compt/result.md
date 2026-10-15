---
tache: T067
statut: fait
---
## Livré
- api/src/server.ts:66-70 — imports contentTypeFor, s3PublicOrigin, tileAuth, tileRateKey, tileRedirect
- api/src/server.ts:737-739 — rateLimit keyGenerator tileRateKey, quota par compte
- api/src/server.ts:748-750 — resolveTileGrant 1 SELECT remplace resolveSignedProject
- api/src/server.ts:759 — etag sur grant.storagePrefix
- api/src/server.ts:761-777 — 302 présigné après 304, catch → warn(err.name) → stream
- api/src/server.ts:789 — storage.get sur grant.storagePrefix
- api/src/server.ts:2503 — log boot origine S3 si tilePresign.enabled
- api/src/storage.ts:83 — `.webp` → image/webp
- api/test/tile-route-redirect.test.ts:1-147 — NEUF, 9 tests, cas du pack
- resolveSignedProject : 2 appelants restants (vignette :677, objets :1199), inchangé
## Vérifié comment
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · TC_EXIT=0
- `npx --prefix api vitest run --root api test/tile-route-redirect.test.ts` → `Test Files 1 passed (1) · Tests 9 passed (9)`
- `npm --prefix api test` → `Test Files 95 passed (95) · Tests 821 passed (821)` · TEST_EXIT=0
- `git diff --stat -- api` →
```
 api/src/server.ts  | 36 ++++++++++++++++++++++++++++++------
 api/src/storage.ts |  1 +
 2 files changed, 31 insertions(+), 6 deletions(-)
```
- `git status --short api` → ` M api/src/server.ts` · ` M api/src/storage.ts` · `?? api/test/tile-route-redirect.test.ts`
## Écarts
- base pack 95 fichiers / 827 tests ≠ mesuré : 94 / 812 avant ajout (95 / 821 après, `ls api/test/*.test.ts | wc -l` → 95 avec le neuf) — base pack probablement fausse, 0 fichier api supprimé (git status)
- seed : 0 .b3dm réel → 302 testé sur `tiles/0.b3dm` (presign avant get, fichier inutile) ; stream/304/Range/HEAD sur `geolens_logo.png` (projet villelaure-real, admin)
- commentaire route :737 « défaut 5000/min/IP » → « défaut 5000/min » — devenu faux avec quota par compte
- sondes jetables via vitest (liste storage seed) avant écriture du test — 0 lecture hors WL
## Pour la suite
- 302 actif seulement si `TILE_PRESIGN_REDIRECT=1` ET driver S3 (local sans presignGet → stream)
- prod : origine `s3PublicOrigin` à ajouter CSP viewer (connect-src/img-src) + CORS bucket GET — log boot l'affiche
- HEAD binaire → 200 stream (Fastify exposeHeadRoutes) ; Range/JSON jamais redirigés
- quota tuile : clé `tu:<userId>` si jeton valide pour :id, sinon `ti:<ip>` ; jeton forgé → IP
- seed sans .b3dm : un fixture binaire 3D-Tiles faciliterait les tests de route
## Retour sur le pack
- Manquait: compte/projet seed portant un binaire (geolens_logo.png @ villelaure-real) ; base de tests exacte (94/812, ≠ 95/827) ; membre n'a accès qu'aux projets 201/202
- Inutile: ∅
