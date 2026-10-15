---
tache: T007
statut: fait
---
## Livré
- `api/src/config.ts:85-87` — `AppConfig.s3.publicEndpoint` (doc contrat)
- `api/src/config.ts:200-213` — `s3PublicEndpointOf()` exporté, throw message contrat
- `api/src/config.ts:273` — `publicEndpoint: s3PublicEndpointOf(env.S3_PUBLIC_ENDPOINT)`
- `api/src/storage.ts:384-408` — `s3ClientConfig(config, endpoint)` extrait verbatim, 0 divergence
- `api/src/storage.ts:430` — getClient → `new S3Client(s3ClientConfig(config, config.s3.endpoint))`
- `api/src/storage.ts:433-442` — `getPresignClient` : absent → getClient ; sinon singleton, jamais clientFactory
- `api/src/storage.ts:600` — presignGet → `await getPresignClient()` ; signUploadPart inchangé
- `api/src/storage.ts:690-692` — `s3PublicOrigin` : `publicEndpoint ?? endpoint`
- `api/src/server.ts:2506-2508` — log boot `{ origin, sameOrigin }` verbatim contrat
- `.env.production.example:36` — `# S3_PUBLIC_ENDPOINT=` commenté
- `api/test/presign-get.test.ts:7-8,61-116,131-137` — I1 I2 I3 D8 I5
- `api/test/s3-public-endpoint.test.ts` (neuf, 23 l) — I4 + loadConfig propage le throw
## Vérifié comment
- `npx --prefix api vitest run --root api test/presign-get.test.ts test/s3-public-endpoint.test.ts test/presign-checksum.test.ts` → `Test Files 3 passed (3) · Tests 27 passed (27)`
- `npm --prefix api run typecheck >/dev/null; echo $?` → `typecheck exit=0`
- `npm --prefix api test` → `Test Files 99 passed (99) · Tests 869 passed (869)` (base 98/854 + 1 fichier / 15 tests)
- `git -C G diff --stat -- api/src/server.ts` → `api/src/server.ts | 4 +++- · 1 file changed, 3 insertions(+), 1 deletion(-)`
- `git -C G status --short -- api/ .env.production.example` → `M .env.production.example · M api/src/config.ts · M api/src/server.ts · M api/src/storage.ts · M api/test/presign-get.test.ts · ?? api/test/s3-public-endpoint.test.ts`
## Écarts
- ∅ lecture hors WL
- HEAD G constaté = `d2a7eab` (T005) ≠ pack `038120d` ; zones visées conformes aux coordonnées
- I1 : référence = driver + clientFactory avec options S3Client d'avant recopiées verbatim (même nowMs)
- I3 : fake client `{ send }` via clientFactory ; presignGet OK sans lui ⇒ factoryCalls=0 ; 6 ops serveur ⇒ factoryCalls=1
- server.ts : contrat = 3 lignes, remplace 1 ligne
## Pour la suite
- `S3_PUBLIC_ENDPOINT` invalide ⇒ `loadConfig` throw au boot (fail-fast, toutes envs)
- `S3_PUBLIC_ENDPOINT` = origine nue (`http://h:port`), normalisée `u.origin`
- presignGet signe sur publicEndpoint ; signUploadPart/opérations serveur restent sur S3_ENDPOINT
- étapes humaines restantes : env serveur test (`= WEB_ORIGIN`), Caddyfile route bucket, CSP viewer si sameOrigin=false
- `createS3Driver` > 60 l (préexistant) — hors périmètre
## Retour sur le pack
- Manquait: HEAD G à jour (d2a7eab) ; nom exact des méthodes driver pour I3 (lu dans storage.ts, en WL)
- Inutile: helpers.ts (makeTestApp non requis, tests unitaires driver/config)
