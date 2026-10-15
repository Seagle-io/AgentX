---
tache: T028
statut: fait
verdict: DÉFAUTS
---
## Livré
- défaut 1 : `housekeep` sans try par clé (tileCache.ts:108-110) → `cs.delete` rejette sur 1 cache de A → boucle abandonnée, caches suivants de A survivent à install(B) ; `purgeTileCaches` (:93-95) a le try, housekeep non · repro verif-t028-tileCache.test.ts:« DÉFAUT? housekeep : cs.delete rejette… » (`expect(left).toContain(a2)` vert) · gravité faible (rejet rare, mais D22)
- défaut 2 : réponse > 64 Mio clonée puis lue en entier avant le test de taille (tileCache.ts:131-132, :186) ; 0 test Content-Length → pic +N Mio · repro scratchpad/mem.mjs : 256 Mio direct +768 → plugin +1024 ; 100 Mio +300 → +400 · gravité faible (tuiles > 64 Mio rares ; navigateur NV)
- défaut 3 : TTL sur différence signée (tileCache.ts:173) → stocké avec horloge +365 j, relu horloge corrigée à +40 j → hit (âge réel 40 j > 30 j) · repro verif-t028-tileCache.test.ts:« TTL … horloge reculée » → `hit = true` · gravité bénigne (contenu immuable)
- conformes : confidentialité install(B) purge A, forgé non lu, keepScope exact (pas de scope-préfixe) ; contentTag/projet ≠ → miss ; MUTABLE_RE casse/sous-dossier → null ; tileset.json racine+sous → stockés ; `..`/`%2e%2e`/`%2E.`/`.evil`/`@evil`/`http:`/`p-10`/relatif → null ; query + fragment ignorés ; abort pendant fetch / match(miss) → AbortError ; abort corps → skipped, writable=true ; open/match(rejet+throw sync)/keys rejettent / crypto.subtle absent → repli fetch ; 64 puts ≥ plafond → writable=false, 65ᵉ non stocké ; LRU n'évince jamais le cache courant ; API flag off clés = on − [contentTag, viewerUserId] même ordre ; viewerUserId membre = session ≠ admin ; rival → 404
- non-défaut noté : abort pendant `c.match` avec hit → résout 200 (fetch natif rejetterait) ; renderer jette via `__loadIndex++` (TilesRendererBase.js:625, :654)
- tests : W/web/src/viewer/backend/__tests__/verif-t028-tileCache.test.ts (18) · W/api/test/verif-t028-content-tag.test.ts (10)
## Vérifié comment
- `npm --prefix web test -- tileCache` → `tileCache.test.ts (23 tests)` · `Tests 23 passed (23)`
- `npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` 0 erreur (avec fichier verif inclus)
- `npm --prefix api test -- project-content-tag` → `project-content-tag.test.ts (4 tests)` · `Tests 4 passed (4)`
- `npx vitest run src/viewer/backend/__tests__/verif-t028-tileCache.test.ts` (W/web) → `Tests 18 passed (18)` ; `T028 horloge reculée → hit = true` ; `T028 abort pendant match (hit) → resolved 200`
- clés : `a%2F..%2Fb.glb` → `__glr-tile-cache/a%2F..%2Fb.glb` ; `%61.glb` → `%61.glb` (≠ `a.glb`, doublon, pas collision) ; `a\b.glb` → `a/b.glb` ; `HTTPS://PORTAIL.TEST:443` → même clé ; `%70roject.json` → clé non null
- `npx vitest run src/viewer/backend/__tests__/` → `Test Files 7 passed (7)` · `Tests 74 passed (74)`
- `npx vitest run test/verif-t028-content-tag.test.ts` (W/api) → `Tests 10 passed (10)` ; `clés off ["project","tilesetUrl","tokenExpiresAt","crossOrg","thumbnailStatus","packs","whiteLabel","userLayersEnabled","userLayersCanPublish"]` ; `VIEWER_TILE_CACHE= true|yes → on ; false|0|off|"" → off` ; `membre viewerUserId=…0102 me=…0102 admin=…0101`
- `node --expose-gc mem.mjs plugin 256` → `store skipped` · `pic arrayBuffers + 1024 Mio` (direct `+ 768 Mio`)
- NV — `%70roject.json` côté serveur (no-store ?) : fixture → 404 pour project.json, encodé ou non
- NV navigateur — Cache réel : Response de `match` neuve par appel, cache supprimé encore écrit par un onglet ouvert, blob > 64 Mio sur disque ou RAM
## Écarts
- lecture hors WL: `git diff 03a7bcb 6efe658 -- api/src/server.ts` + `grep viewerTileCache api/src` (config.ts:49, :252) — parsing du flag
- lecture hors plage WL: server.ts:738-800 (route storage) — seul `token` lu en query ⇒ query ignorée sans collision
- lecture hors plage WL: TilesRendererBase.js:576-640, :680-714 — gestion abort / `__loadIndex`
## Pour la suite
- housekeep : try/catch par clé dans la 1ʳᵉ boucle (tileCache.ts:108-110), comme purgeTileCaches:93-95 ; test = delete rejeté sur 1 clé → les autres scopes purgés
- store : `Content-Length` > 64 Mio → pas de clone ; sinon lire le clone en flux avec compteur, abandon > 64 Mio
- TTL : `age < 0 ∨ age ≥ TTL` → périmé (tileCache.ts:173)
- serveur : `isMutableManifest` (server.ts ~768) teste-t-il le rel décodé ? sinon `%70roject.json` stocké par le plugin (clé non null) ; multi-pack.json sans no-store serveur
- livrables sous storage_prefix (content.ts:5) supprimés par rétention : servis du cache ≤ 30 j s'ils passent par le renderer — à trancher (D22)
## Retour sur le pack
- Manquait: route storage (server.ts:738-800, query lue = token seul) ; config.ts:252 parsing `bool()` ; renderer :615-660 (abort + `__loadIndex`) ; comptes DEMO (admin/member/rival) pour tester viewerUserId
- Inutile: ∅
