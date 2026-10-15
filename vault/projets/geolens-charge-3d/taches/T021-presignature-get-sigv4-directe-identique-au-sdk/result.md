---
tache: T021
statut: fait
---
## Livré
- G/api/src/s3Presign.ts:1-81 — presignGetV4 SigV4 directe, node:crypto seul
- G/api/src/s3Presign.ts:29-41 — clé signature mémoïsée (secret,jour,région), ≤ 8
- G/api/src/storage.ts:22 — import presignGetV4
- G/api/src/storage.ts:599-625 — chemin rapide, repli SDK inchangé si null/presignSdk
- G/api/src/config.ts:97-98,287 — s3.presignSdk = bool(S3_PRESIGN_SDK, false)
- G/.env.production.example:39 — `# S3_PRESIGN_SDK=1` commenté
- G/api/test/s3-presign.test.ts:1-126 — 72 égalités SDK, 6 null, interrupteur, bench
## Vérifié comment
`npx vitest run test/s3-presign.test.ts test/presign-get.test.ts` →
```
 ✓ test/presign-get.test.ts (22 tests) 109ms
[bench] presignGetV4 34.3 µs/op · getSignedUrl 334.1 µs/op · ×9.7
 ✓ test/s3-presign.test.ts (82 tests) 877ms
 Test Files  2 passed (2)
      Tests  104 passed (104)
```
`npm --prefix api run typecheck` → `typecheck exit=0`
`npm --prefix api test` →
```
 Test Files  101 passed (101)
      Tests  976 passed (976)
```
`git status --short -- api/ .env.production.example` →
```
 M .env.production.example
 M api/src/config.ts
 M api/src/storage.ts
?? api/src/s3Presign.ts
?? api/test/s3-presign.test.ts
```
`git diff --quiet -- api/test/presign-get.test.ts` → `presign-get.test.ts inchangé`
## Écarts
- ∅ lecture hors WL
- égalité : 8 endpoints (6 du pack + minio:9000 vhost, [::1] vhost) × 9 clés = 72 cas, régions alternées, en-têtes route 2/3 des cas
- null aussi si : endpoint non http(s), chemin ≠ `/`, userinfo, expires ∉ [1, 604800], bucket non DNS même en path-style
- bench = 1 boucle sans échauffement séparé (log seul) ; 2 000 ops, cas Scaleway vhost
## Pour la suite
- Ordre query SDK = tri code-unit : X-Amz-* (Signature incluse) < response-* < x-id ; X-Amz-Content-Sha256=UNSIGNED-PAYLOAD présent en query
- Encodage SDK = encodeURIComponent + `!'()*` → %XX, clé segment par segment, chemin canonique S3 non ré-encodé
- IPv4/`[…]` + vhost → path-style (= s3PublicOrigin storage.ts:~705)
- bucket avec `.` / majuscule / `_` → SDK (repli, non mesuré en perf)
- gain CPU mesuré ×9.7 en process unique vitest ; à confirmer sous k6
## Retour sur le pack
- Manquait: ∅
- Inutile: getSignedUrl.d.ts (signature déjà dans le contrat)
