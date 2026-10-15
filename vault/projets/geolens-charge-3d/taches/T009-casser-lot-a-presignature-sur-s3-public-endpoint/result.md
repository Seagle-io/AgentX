---
tache: T009
statut: fait
verdict: DÉFAUTS
---
## Livré
- défaut 1 : `S3_PUBLIC_ENDPOINT`=IP + `S3_FORCE_PATH_STYLE=0` → origine loguée `http://geolens-tuiles.82.65.97.67:34580`, `sameOrigin:false` ; URL réelle `http://82.65.97.67:34580/geolens-tuiles/…` (SDK repasse en path-style si host IP) · storage.ts:689-693 (branche vhost sans test IP) · repro `verif-t009-casse.test.ts` : « origine loguée (CSP) … ip+vhost », « ipv6+vhost », « public IP + vhost (=WEB_ORIGIN) → log » · gravité bas — log seul consommateur ; config cible = path-style 1 ; classe préexistante (endpoint IP), aggravée par lot A
- défaut 2 : `TILE_PRESIGN_REDIRECT=1` + `WEB_ORIGIN` non parsable (`127.0.0.1:5173`, ou `https://` qui passe le contrôle prod config.ts:342) → `buildServer` throw `TypeError: Invalid URL` ; même env sans presign → boot OK · server.ts:2507 `new URL(config.webOrigin)` non gardé · repro « WEB_ORIGIN non parsable + presign → boot » vs « … sans presign → boot OK (témoin) » · gravité bas — crash au boot sur mauvaise config, message opaque
- tests de casse : `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T007/api/test/verif-t009-casse.test.ts` (45 cas ; 4 KO = défauts 1-2) ; réf. d2a7eab générée par `git show` en beforeAll puis supprimée en afterAll
## Vérifié comment
- `npm --prefix api run typecheck` (W, avec fichier de vérif) → `tsc -p tsconfig.test.json` 0 erreur
- `npm --prefix api test` (W, avant ajout) → `Test Files 99 passed (99)` · `Tests 869 passed (869)`
- `npx vitest run test/presign-get.test.ts test/s3-public-endpoint.test.ts` → `Test Files 2 passed (2)` · `Tests 25 passed (25)`
- `npx vitest run test/verif-t009-casse.test.ts` → `Tests 4 failed | 41 passed (45)`
- non-régression d2a7eab : 5 env (scw vhost, scw path, minio path, sans endpoint, public blanc) × 4 nowMs (dont 0, 2099) × 3 clés (dont unicode/espace/`+%`) × ttl 120/300/3600 → presignGet `toEqual` réf ; signUploadPart + s3PublicOrigin identiques ; signUploadPart avec public posé identique → OK
- I2 : host `82.65.97.67:34580`, chemin `/geolens-tuiles/projects/p1/tiles/0.b3dm`, `X-Amz-SignedHeaders` = `['host']`, clés query exhaustives = Algorithm/Content-Sha256/Credential/Date/Expires/Signature/SignedHeaders/response-cache-control/response-content-type/x-id, 0 checksum → OK
- séparation : storage.ts:436-443 `_presignClient` dans la closure createS3Driver (par driver) ; 2 drivers / 2 publics → hosts `a.test:1`,`b.test`,`a.test:1` ; seul presignGet (L600) → getPresignClient ; complete/abort/deleteFile/exists/signUploadPart + factory → 1 appel factory, presignGet 0 → OK
- concurrence 50 presignGet simultanés → 1 URL distincte → OK
- s3PublicEndpointOf : `http://h:34580/?`→`http://h:34580` · `HTTP://H`→`http://h` · `http://h:0`→`http://h:0` · `http://[::1]:9000`→idem · `http://h:80`→`http://h` · `http://h:34580#`→origine · `\thttp://h:1\n`→`http://h:1` · `http:\\h`→`http://h` · IDN→punycode ; throw message exact : `javascript:`, `http://h:34580//`, `http://h :1`, `:65536`, `http://`, `h:34580`, `//h:1`, userinfo, `file:`, `http://h/%2F`, `ws:` → OK
- boot : loadConfig `javascript:x` → message contrat exact ; log `{origin:'http://82.65.97.67:34580', sameOrigin:true}` (public = WEB_ORIGIN, aussi WEB_ORIGIN à `/` final) ; sans public → `{origin:'http://127.0.0.1:1', sameOrigin:false}` → OK
- fuite : ligne de boot sérialisée ∌ `x-amz|secret|akia` → OK ; warn server.ts:778 logue `(e as Error).name` seul → 0 URL/clé (lecture code)
- SigV4 bout en bout contre MinIO → NV — images non pullables, étape humaine H8
## Écarts
- ∅
## Pour la suite
- s3PublicOrigin (storage.ts:689) : host IP/IPv6/non-DNS → retourner `u.origin` (le SDK signe en path-style) ; test « origine loguée = origin(URL presignGet) » sur matrice IP/DNS × path/vhost
- server.ts:2507 : `new URL(config.webOrigin)` gardé (try → sameOrigin false) ou WEB_ORIGIN validé dans loadConfig
- s3PublicEndpointOf accepte port 0 et `?`/`#` vides — contrat muet ; trancher si refus voulu
- getPresignClient/getClient : course sur `await import` → N S3Client créés au 1er appel concurrent, 1 conservé ; 0 effet observé (URL identiques)
## Retour sur le pack
- Manquait: BuildOptions (`logger`, `logStream`) pour le test de boot — trouvé dans server.ts:90-100 (WL) ; réf d2a7eab importe `./config.js` → réécriture d'import à prévoir
- Inutile: `.env.production.example` (1 ligne commentée)
