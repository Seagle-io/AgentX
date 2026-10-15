---
tache: T068
statut: fait
verdict: DÉFAUTS
---
## Mesures
Loopback, pg-mem, 1 machine : chiffres relatifs, pas des seuils prod. BASE = 120d0aa (code T062) relancé même machine, même copie de stockage.
| scénario | K | req/s | p50 | p95 | 302 % | 429 | 5xx | octets API | critère |
|---|---|---|---|---|---|---|---|---|---|
| M1 HEAD local (4 runs) | 1 | 337-444 | 1,6-2,6 | 4,8-6,2 | – | 0 | 0 | 27 Mo | ≥361 KO 2/4 ; p95 ≤6,05 KO 1/4 |
| M1 HEAD local | 10 | 557-667 | 13,2-15,9 | 24,3-32,1 | – | 0 | 0 | 275 Mo | ≥716 KO 4/4 |
| M1 HEAD local | 50 | 619-668 | 50,7-62,8 | 138,7-202,3 | – | 0 | 0 | 1,37 Go | ≥875 KO ; ≤103 ms KO |
| M1 BASE 120d0aa | 1/10/50 | 583 / 977 / 920-1049 | 1,3 / 8,9 / 38-42 | 4,1 / 17,8 / 91-128 | – | 0 | 0 | idem | réf. même machine |
| M2 S3+302 (3 runs) | 50 | 575-638 | 78,8-85,7 | 93,5-108 | 100 (3000/3000) | 0 | 0 | 0 | ≥972 KO ; ≤94 KO 2/3 |
| M2 S3+302 | 1 / 10 | 395 / 618 | 2,4 / 15,9 | 4,1 / 19,2 | 100 | 0 | 0 | 0 | info |
| M2 S3 stream (flag 0) | 50 | 436-448 | 107-110 | 148-161 | 0 | 0 | 0 | 1,37 Go | 302 = +33 % req/s |
| 304 seul (auth) HEAD / BASE | conc 20 | 830-850 / 1460-1502 | 24 / 13 | 30-34 / 16-18 | – | 0 | 0 | 0 | auth ×1,75 plus lente |
| M3 A ×6200 ‖ B ×2000 (RL=1) | 1 IP | – | – | – | – | A 1200 (1er à #4992) · B 0 | 0 | – | OK |
## Livré
- M1 — KO : −33 % req/s K=50 vs BASE
- M2 — KO débit ; 302 100 %, 0 octet, Location OK
- M3 — OK : A 5000+1200×429, B 0×429
- casse — OK : 0 signature logs, HEAD/Range streamés, révocation 403
- tests — OK : api 821/821, web 1697/1697
- nettoyage — OK : minio stoppé, 0 port, G propre
## Défauts
- D1 · G/api/src/tileAuth.ts:14-26 (TILE_GRANT_SQL, 1 SELECT 4 LEFT JOIN) appelé server.ts:749 · repro : 2 API pg-mem même machine (HEAD :4100, `git archive 120d0aa api` :4101), `node $W/b304.mjs <base> 3000 20` (If-None-Match → 304 = auth seule) · attendu ≥ BASE / obtenu 830-850 vs 1460-1502 req/s ; propage M1 K=50 619-668 vs 920-1049 req/s, p95 139-202 vs 91-128 ms ; M2 plafonné 575-638 (binaires seuls 695) · cause = coût jointure pg-mem ; sur Postgres réel NV (1 aller-retour au lieu de 2, sens probablement inverse)
- D2 · seuils M2 (≥972 req/s, p95 ≤94) inatteignables tant que D1 : 302 binaires seuls K=50 = 695 req/s p95 89 ms ; vs S3 stream même code +33 % → 302 lui-même OK
## Vérifié comment
- `node $W/bench.mjs http://127.0.0.1:4100 50 20` → `{"rps":667,"p50":60.3,"p95":149.8,"codes":{"200":5000}}` · BASE :4101 → `{"rps":1035,"p50":38.6,"p95":91.7,"codes":{"200":5000}}`
- `node $W/b304.mjs …4101(BASE) 3000 20` → `{"codes":{"304":3000},"rps":1502}` · HEAD → `{"codes":{"304":3000},"rps":850}`
- `node $W/bench.mjs http://127.0.0.1:4101 50 20 manual` (S3, flag 1) → `{"rps":638,"p95":93.5,"codes":{"200":2000,"302":3000},"binCodes":{"302":3000},"apiBinBodyBytes":0,"distinctLocations":3}`
- `curl -s -o /dev/null -w '%{http_code} %{size_download}' "<Location big.b3dm>"` → `200 1048576`
- `node $W/casse.mjs …4101` → `2 comptes 302 302 302 Location identiques true CC private, max-age=140 RP no-referrer` · `HEAD .b3dm 200 noloc` · `Range .b3dm 206 100 noloc` · `rel ../secret/tileset.json 401` · `..%2Fsecret%2Ftileset.json 400` · `autre projet même jeton 403` · `compte désactivé .b3dm 403 noloc` · `jeton forgé {"403":20}`
- `node $W/revoke.mjs …4101` → `revoke 200 B .b3dm 403 B tileset 403` · `re-grant 200 B .b3dm 302`
- ETag 206 puis GET If-None-Match → `304 noloc` (304 avant 302)
- `grep -c 'X-Amz-Signature\|X-Amz-Credential' api4101.log` (53947 l.) → `0` ; url loguée `?token=[redacted]`
- `node $W/m3.mjs …4102` (RATE_LIMIT=1) → `A x6200 {"200":5000,"429":1200},"first429":4992 | B x2000 pendant {"200":2000}` · `forgé x5100 {"403":5000,"429":100}` · `B après épuisement IP {"200":50}`
- `npm --prefix api test` → `Test Files 95 passed (95) Tests 821 passed (821)` exit 0 ; `npm --prefix web test` → `Test Files 177 passed (177) Tests 1697 passed (1697)` exit 0
- `docker stop t068-minio` → `t068-minio` ; `ss -ltn | grep -E ':(410[0-3]|910[01])'` → ∅ ; `git -C G status --short | wc -l` → `0`
- $W = /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/2e7b366b-45a7-450b-b9df-37aa6f7ce759/scratchpad/t068.76Hp (scripts + logs gardés ; copie stockage + BASE supprimées)
## Écarts
- lecture hors WL: api/src/tileRateKey.ts — clé quota, comprendre forgé→IP
- lecture hors WL: api/src/tileAuth.ts — localiser D1
- lecture hors WL: ls seed-data/storage — mix T062, copie
- `git -C G archive 120d0aa api` (hors liste outils, lecture seule) → BASE dans $W, node_modules symlink → G ; seul moyen d'attribuer l'écart machine vs code
- port 4103 ~10 s (BASE) puis relancé sur 4101 ; mix T062 « tileset.json ~0,6 Ko » ≠ réel 6731 o (mix repris tel quel)
## Pour la suite
- D1 à trancher sur Postgres réel (EXPLAIN + bench 304) avant de conclure : régression pg-mem seule probable, prod NV
- Location S3 émise avant désactivation reste servie 200 jusqu'à TTL (≤300 s) — accepté D20, révocation ≠ immédiate pour URL déjà émise
- 302 sans ETag → navigateur ne revalide jamais en 304 ; absent.b3dm → 302 puis 404 S3 (0 test existence, D20)
- Range `bytes=-100` / multi-range → 200 corps entier 1 Mo (regex server.ts:784, pré-existant)
- S3 sans clés : presign via chaîne de credentials SDK (IMDS ?) par requête [NV]
## Retour sur le pack
- Manquait: tileAuth.ts (cause probable de régression) ; route PATCH /api/admin/users/:id {disabled} et DELETE sans content-type ; consigne de BASE même machine (T062 sur autre charge) ; taille réelle tileset.json
- Inutile: docker-compose.yml (identifiants MinIO seuls utiles)
