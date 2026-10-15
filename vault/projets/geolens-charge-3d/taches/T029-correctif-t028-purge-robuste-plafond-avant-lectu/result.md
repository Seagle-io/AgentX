---
tache: T029
statut: fait
---
## Livré
- G/web/src/viewer/backend/tileCache.ts:78-79 — D4 rel décodé testé, invalide → null
- tileCache.ts:86-94 — `safeDecode` (decodeURIComponent sans throw)
- tileCache.ts:120-125,133-135 — D1 try par clé, purge + LRU
- tileCache.ts:143-162 — D2 `readCapped` : flux compté, cancel > 64 Mio
- tileCache.ts:166-167 — store : blob null → skipped
- tileCache.ts:208-209 — D3 âge fini, ≥ 0, < TTL
- tileCache.ts:222 — D2 Content-Length > 64 Mio → 0 clone
- G/web/src/viewer/backend/__tests__/tileCache.test.ts:388-460 — 5 tests D1-D4, harnais intact
## Vérifié comment
- `npm --prefix web test -- tileCache` → `Test Files 2 passed (2) · Tests 29 passed (29)`
- `npm --prefix web run typecheck; echo $?` → `0`
- `npm --prefix web test` → `Test Files 182 passed (182) · Tests 1750 passed (1750)` (base 1745 + 5)
- mutation : patch -R sur tileCache.ts → `Tests 5 failed | 23 passed (28)` (les 5 nouveaux) ; restauré
- `git -C G status --short -- web/src/viewer/backend/` → `M __tests__/tileCache.test.ts` · `M tileCache.ts`
- `wc -l tileCache.ts` → 266 (≤ 280)
## Écarts
- ∅ lecture hors WL
- test D2 sans CL : flux 65 Mio laissé ouvert après 65 Mio — sinon passait déjà sur l'ancien code
- D4 : invalide → clé null (doute → pas de stockage)
## Pour la suite
- `reader.cancel()` d'une branche tee non attendu : la promesse attend l'autre branche
- `BlobPart[]` requis : TS refuse Uint8Array<ArrayBufferLike>[] dans `new Blob`
- Content-Length = taille compressée si gzip ; le plafond en flux couvre le décompressé
- T028 repro `.cache/wt-charge3d-T026/...verif-t028` attend encore `%70roject.json` → clé : obsolète
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
