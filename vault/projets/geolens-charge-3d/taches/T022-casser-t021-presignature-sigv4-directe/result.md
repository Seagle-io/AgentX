---
tache: T022
statut: fait
verdict: DÉFAUTS
---
## Livré
- défaut 1 : `region=aws-global` → v4 signe scope `aws-global`, SDK signe `us-east-1` → URL ≠, 403 S3 · repro `verif-t022-casse.test.ts:D1` + `storage.presignGet KO D1` (env `S3_REGION=aws-global`) · gravité moyenne (atteignable par env, 100 % des tuiles KO)
- défaut 2 : region FIPS (`fips-us-east-1`, `us-east-1-fips`) + endpoint custom → SDK lève « A custom endpoint cannot be combined with FIPS », v4 rend une URL · repro `casse:D2` · faible
- défaut 3 : region ≠ label DNS (`fr par`, `fr/par`, `é`) → SDK lève « Region not accepted », v4 rend une URL · repro `casse:D3` · faible (env mal saisi)
- défaut 4 : bucket `xn--a` (punycode invalide, passe `DNS_BUCKET`) en vhost → SDK lève `Invalid URL`, v4 rend `https://xn--a.h/…` que `new URL` refuse · repro `casse:D4`, fuzz 2 graines = seule classe KO · faible
- défaut 5 : bucket `*--x-s3` (S3 Express) → SDK fait CreateSession réseau puis lève/signe autrement ; v4 URL SigV4 simple · repro `casse:D5` (`endpoint http://127.0.0.1:9` → ECONNREFUSED vs URL) · faible
- défaut 6 : env `AWS_USE_FIPS_ENDPOINT=true` ou `AWS_USE_DUALSTACK_ENDPOINT=true` → SDK lève sur 74/77 sondes, v4 URL ; v4 ignore l'env lu par le SDK · repro `env AWS_USE_DUALSTACK_ENDPOINT=true npx vitest run test/verif-t022-probe.test.ts` · faible
- défaut 7 : endpoint `http://minio:0` → v4 garde `:0`, SDK le retire → URL ≠ · repro `casse:D6` · négligeable
- défaut 8 : `signedAtMs` an ≥ 10000 → date `+01000001T01T0000Z` ≠ SDK · repro `casse:D7` · négligeable
- OK : cache clé (66 appels, 11 secrets × 3 régions × 4 jours, 3 passes ; bascule 23:59:59.999→00:00) = SDK ; bucket à point → repli SDK = `S3_PRESIGN_SDK=1` ; MinIO public path = SDK ; secret absent de l'URL ; erreurs v4 = `Invalid time value` / `URI malformed` seulement (0 secret) ; `keyCache` ≤ 8 — `s3Presign.ts:32,39` FIFO
- OK fuzz : clés unicode/surrogates/`#?&=+%~*!'()`/espaces/`..` bruts ou nettoyés, `:443`, `:80`, `HTTP://H.EXAMPLE`, point final, IPv6, IPv4 courte/hex, port 8443, IP+vhost, IDN host, 29/02, 2099, minuit ±1 ms, ttl {1,299,300,3600,604800} → 100 % égal ; ttl {0,1.5,604801} → null
- fichiers : `W/api/test/verif-t022-casse.test.ts` (11 KO voulus, verts une fois corrigé), `verif-t022-fuzz.test.ts` (rouge tant que D4), `verif-t022-probe.test.ts` (log, vert) → `npm test` dans W rouge à cause d'eux
## Vérifié comment
- `npm --prefix api run typecheck` (W, avant + après ajout tests) → `tsc -p tsconfig.test.json` rc=0
- `npm --prefix api test` (W, avant ajout) → `Test Files  101 passed (101)` · `Tests  976 passed (976)`
- `npx vitest run test/s3-presign.test.ts test/presign-get.test.ts` → `Test Files  2 passed (2)` · `Tests  104 passed (104)`
- `npx vitest run test/verif-t022-fuzz.test.ts` (seed=22022 n=6000) → `stats={"eq":1616,"nullSdkOk":3486,"nullSdkErr":799,"bothThrow":0} classes_ko=10 ko=99` ; 10 classes = `V4URL_SDKTHROW|bucket=xn--a|*|path=false`
- `T022_SEED=7 T022_N=10000 …fuzz` → `stats={"eq":2802,"nullSdkOk":5694,"nullSdkErr":1351,"bothThrow":0} classes_ko=10 ko=153` ; 10× `bucket=xn--a`
- `npx vitest run test/verif-t022-casse.test.ts` → `Tests  11 failed | 5 passed (16)` ; KO = D1×2, D2×2, D3×2, D4, D5, D6, D7, storage D1
- `env AWS_USE_FIPS_ENDPOINT=true npx vitest run test/verif-t022-probe.test.ts` → `74 [V4URL-SDKTHROW]` `3 [BOTH-THROW]` ; idem DUALSTACK
- 1er fuzz sans garde : bucket `geolens--x-s3` → SDK bloque > 120 s (CreateSession réseau, maxAttempts 4) ; retiré du fuzz, isolé en D5
## Écarts
- ∅
## Pour la suite
- s3Presign.ts:46-48 → null si `region === 'aws-global'` ou `/fips/` ou ∉ `/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i` (D1-D3)
- → null si `bucket.startsWith('xn--')` ou `/--x-s3$|--xa-s3$/` ; si `u.port === '0'` ; si an ∉ [1970, 9999] (D4,D5,D7,D8)
- → null si `AWS_USE_FIPS_ENDPOINT`/`AWS_USE_DUALSTACK_ENDPOINT` vrais — via config.ts, pas process.env (D6)
- tests casse prêts : `W/api/test/verif-t022-casse.test.ts` doivent passer verts après correctif ; supprimer `verif-t022-probe` avant intégration
- `ttlSec ∈ {1}` ou < 2 : `Bms=0` → `signedAtMs=NaN` → RangeError (v4 et SDK idem, préexistant `storage.ts` presignGet)
## Retour sur le pack
- Manquait: régions spéciales SDK (`aws-global`, fips) et env `AWS_USE_*` dans la grammaire du fuzz ; avertir que bucket `--x-s3` déclenche un appel réseau SDK
- Inutile: ∅
