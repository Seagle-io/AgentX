---
tache: T023
statut: fait
---
## Livré
- G/api/src/s3Presign.ts:24-27 — const DNS_REGION, EXPRESS_BUCKET
- G/api/src/s3Presign.ts:51-62 — gardes D1-D5, D7, D8 → null
- G/api/src/config.ts:97-98 — doc presignSdk forcé FIPS/dual-stack
- G/api/src/config.ts:288-289 — D6 presignSdk OR FIPS OR DUALSTACK
- G/api/test/s3-presign.test.ts:76-89 — 13 cas D1-D8 → v4 null
- G/api/test/s3-presign.test.ts:107-110 — FIPS/DUALSTACK=true → presignSdk true
## Vérifié comment
cp verif-t022-casse.test.ts G/api/test/ ; npx vitest run test/verif-t022-casse.test.ts test/s3-presign.test.ts → `✓ test/verif-t022-casse.test.ts (16 tests)` · `✓ test/s3-presign.test.ts (96 tests)` · `Tests 112 passed (112)` ; rm → `ls: impossible d'accéder … verif-t022-casse.test.ts`
npm --prefix api run typecheck → `tsc -p tsconfig.test.json` · `typecheck exit=0`
npm --prefix api test → `Test Files 101 passed (101)` · `Tests 990 passed (990)` (976 + 14 ajoutés)
git -C G status --short -- api/ → `M api/src/config.ts` · `M api/src/s3Presign.ts` · `M api/test/s3-presign.test.ts`
git -C G diff --stat -- api/ → 3 files, 34 insertions(+), 3 deletions(-)
## Écarts
- lectures hors WL : 0
- numérotation : repro T022 D6 = port 0, D7 = date ; pack D7 = port, D8 = date → noms de test suivent le pack
- D8 : `!(year >= 1970 && year <= 9999)` couvre NaN/non fini — pas de garde isFinite séparée
## Pour la suite
- presignGetV4 : gardes région/bucket/date/port 0 → null ; config presignSdk forcé si AWS_USE_FIPS_ENDPOINT|AWS_USE_DUALSTACK_ENDPOINT
- verif-t022-casse.test.ts passe 16/16 sur G ; fichier non conservé dans G (reste dans .cache/wt-charge3d-T021)
- docs/ENV.md : mention AWS_USE_FIPS_ENDPOINT / AWS_USE_DUALSTACK_ENDPOINT NV (hors WL, règle repo « variable documentée »)
- commit à faire par le chef : 3 fichiers api/
## Retour sur le pack
- Manquait: numérotation D cohérente avec le fichier repro (D6/D7 décalés) | Inutile: ∅
