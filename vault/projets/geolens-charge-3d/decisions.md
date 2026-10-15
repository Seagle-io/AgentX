# Decisions — GeoLens — charge serveur du rendu 3D

Une decision = un bloc. Jamais de reecriture, on ajoute.

## D1 — 2026-10-12 — cadrage epic Trello pzR8vwst (humain)
- source : https://trello.com/c/pzR8vwst — phases 0→4 ; mesurer chaque phase avant la suivante ; phase 3 seulement si 1-2 insuffisantes
- objectif de charge : 30 VUs k6, p95 tuile < 150 ms, 0 erreur (429/5xx), cible POP2-2C-8G
- 302 testé sur MinIO du serveur de test (pas de bucket Scaleway)
- 304 avant SELECT accepté : compte révoqué revalide ses tuiles en cache tant que le jeton HMAC (8-12 h) vit ; HMAC + exp + p=:id restent vérifiés avant
- redéploiement API du serveur de test accordé APRÈS liste des DDL de migrate() validée par l'humain ; base : 0 écriture destructive (D25 geolens-viewer)
- D6 (0 cache d'autorisation) maintenu tant que la mesure 0.2 ne montre pas le SQL dominant ; Redis : non (phase 3 non lancée)

## D2 — 2026-10-12 — 304 sans SELECT : ETag non dérivable (T001)
- ETag actuel = sha1(grant.storagePrefix/rel) ; prefix sorti du SELECT `tile_grant` → 304 sans SELECT impossible tel quel
- à trancher par l'architecte (T002) : ETag indépendant du SELECT, sans 304 faux après ré-import

## D3 — 2026-10-12 — scripts k6 versés au dépôt
- source : serveur de test `~/viewer-navigation.js` (238 l) + `~/Makefile` (80 l), copiés en lecture (scp) ; identifiants via __ENV / `~/.env.k6`, jamais dans G
- cible : `G/tools/load/` (carte 0.1)

## D4 — 2026-10-12 — DDL de migrate() sur le serveur de test (T003)
- 32 stmts, 26 no-op attendus ; effectifs : 4 ADD COLUMN (organizations.contract_end_at, users.session_version, audit_log.ip, audit_log.user_agent) + 2 CREATE INDEX audit_log (schema.ts:151-152, verrou SHARE)
- destructif effectif : ∅ ; DELETE org_packs :304,:307 et UPDATE projects :258 identiques au serveur → no-op
- PG 16 (postgres:16-alpine, [[geolens-serveur-test]]) → ADD COLUMN DEFAULT sans réécriture
- NV : taille audit_log (durée du verrou d'écriture) ; schema.ts:238 avale toute erreur ALTER/INDEX
- en attente : validation humaine avant redéploiement

## D5 — 2026-10-12 — 302 tuiles test : MinIO même origine via Caddy + S3_PUBLIC_ENDPOINT (T004)
- SigV4 signe Host → URL présignée valide ssi Host signé = Host reçu par MinIO
- choix : Caddy test `GET /<B>/*` avec `X-Amz-Signature` → minio:9000, Host inchangé ; 2ᵉ client S3 de présignature sur `S3_PUBLIC_ENDPOINT` (défaut absent → comportement actuel octet pour octet)
- écarté : port dédié (box + CSP/CORS test en prod) ; réécriture d'URL signée ; S3_ENDPOINT public (hairpin pour tout S3)
- conséquence : 0 CSP, 0 CORS, 0 action box ; `/<B>/*` réservé sur l'origine test ; GET seul routé
- à vérifier au lot A : signUploadPart sur client public → PUT non routé par Caddy ⇒ upload direct test cassé ? (verificateur)
- BLQ humain avant activation : S3_SECRET_KEY du test ≠ défaut compose `geolens123` (H1)
- à revoir si : test en HTTPS/nom de domaine, ou portail utilise une route `/<B>/…`

## D6 — 2026-10-12 — route tuile : histogramme mémoire, logLevel warn de route, tag du préfixe signé (T002)
- choix : `api/src/tileMetrics.ts` histogramme 148 seaux ×1.1, 4 phases sql|storage|send|total, 1 log info/min, 0 route, 0 dépendance
- choix : `logLevel: 'warn'` sur la route + 1 ligne onResponse (4xx/5xx/lente), plafond 600/fenêtre ; `TILE_SLOW_MS` défaut 500 [50,60000]
- choix 1.3 : `v = tilePrefixTag(storage_prefix)` dans le jeton ; ETag = tileEtag(v, rel) ; 304 = 2 HMAC + 1 sha1, 0 SELECT
- écarté : cache id→préfixe ; prom-client + route ; disableRequestLogging (déprécié)
- invariant si 1.3 livré : contenu sous storage_prefix immuable, sauf project.json
- gain 1.3 seul ≈ 0 : clé de cache navigateur = URL avec jeton, `immutable`, jeton ≤ 43 200 s < max-age → If-None-Match quasi jamais envoyé

## D7 — 2026-10-12 — séquencement (chef)
- L1 (C1+C2) maintenant ; lot A (T004) après L1 (server.ts + config.ts communs) ; L2 (C3, 304 sans SELECT) REPORTÉ et couplé à 2.1 (cache viewer) — gain nul seul (D6)
- mesure k6 après L1 + lot A déployés : décide 2.1 + L2

## D8 — 2026-10-12 — lot A : présignature publique limitée aux GET de tuile (chef)
- `getPresignClient()` pour presignGet seul ; signUploadPart reste sur getClient (≠ T004) — Caddy test ne route que GET, 0 régression upload
- vérification L1 dans un worktree figé `AgentX/.cache/wt-charge3d-T006` (038120d, node_modules en lien) — lot A édite api/ en parallèle

## D9 — 2026-10-12 — images MinIO non pullables (chef)
- `docker pull minio/minio:latest` et `quay.io/minio/minio:latest` → refusés (2026-10-12) ; compose prod G :26 `minio/minio:latest`
- conséquence : SigV4 bout en bout = étape humaine H8 seulement ; sur le serveur de test, JAMAIS `docker compose pull` ni `--pull` (minio introuvable → service cassé)

## D10 — 2026-10-12 — catch du log de boot (T012, chef)
- server.ts:2507 `catch { return false; }` : valeur de repli loguée (`sameOrigin:false`), pas un catch silencieux au sens 01-style:94 — accepté
- code phases 0 + 1 (1.1 code, 1.2) livré et vérifié : 038120d T006 · d2a7eab T005 · 77ecdcd T007 · 3490795 T010 · 21444bb T011 · T012 ; api 99 fichiers / 881 tests

## D11 — 2026-10-12 — redéploiement API du serveur de test accordé (humain : « oui »)
- liste DDL D4 validée : 4 ADD COLUMN + 2 CREATE INDEX audit_log, 0 destructif
- exécution = humain, séquence `deploiement-test.md` ; agents : 0 ssh d'écriture
- mesure : quota tuile par compte 5000/min (D20 geolens-viewer) + k6 1 compte partagé (1 VU/conteneur → sessions[0]) ⇒ 429 garantis dès ~3 VUs → `RATE_LIMIT_TILE_MAX=500000` le temps des mesures, restauré après
- `up -d --no-deps --build api` : jamais de pull (D9), minio-init non relancé

## D12 — 2026-10-13 — redéploiement API suspendu : boot prod refusé en http (chef)
- G/api/src/index.ts → `loadProductionSafeConfig()` ; Dockerfile `NODE_ENV=production` ; serveur `WEB_ORIGIN=http://82.65.97.67`, `COOKIE_SECURE=0` → config.ts:342-343 → « démarrage refusé » → API KO, boucle de restart
- runbook §3 tel quel = panne du serveur de test ; aucune action d'écriture faite (sauvegardes seules dans ~/deploy-charge3d, 13/10)
- jobs nouveaux non couverts par D4 : `startRetentionScheduler` (server.ts:2505, mode 'report' par défaut sur base réelle) → T013
- compat front 22/09 ↔ API G → T014 ; exécution par le chef via ssh (humain : « continue », 13/10) après levée de T013/T014

## D13 — 2026-10-13 — supersède D12 : boot http OK, rétention coupée (T013, T014)
- productionProblems → [] si `GEOLENS_ENV` ≠ 'production' (config.ts:325) ; clé absente du .env serveur → boot OK ; ne jamais la poser sur le serveur de test
- JWT_SECRET : même garde dans l'API actuelle (S server.ts:156) qui tourne → OK
- écritures hors D4 : migrate() UPDATE/DELETE + sweepOrphans `_ingest-tmp` > 2 h = déjà faites par l'API actuelle → inchangé ; retention = nouveau → `RETENTION_MODE=off` (scheduler non démarré, retention.ts:142)
- front 22/09 compatible API G (29 routes =, cookie, jeton) → pas de redéploiement front (T014)
- runbook §3 : + `RETENTION_MODE=off` ; exécution chef via ssh

## D14 — 2026-10-13 — API G déployée sur le serveur de test, M0 mesuré (chef)
- `up -d --no-deps --build api` OK, healthy ; DDL D4 constaté (4 colonnes, 2 index) ; audit_log +10 `login` (k6) seulement
- .env : RATE_LIMIT_TILE_MAX 5000→500000 (à restaurer §9), + S3_PUBLIC_ENDPOINT, TILE_PRESIGN_REDIRECT=0, TILE_PRESIGN_TTL_SEC=3600, RETENTION_MODE=off
- hairpin KO (hôte et réseau docker) → lot B k6 (T015, af9418e) : `TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580 TILE_ORIGIN_INTERNAL=http://caddy:80`
- Caddy §5 : refusé au chef par le classifieur (exposition MinIO) → exécution humain ; fichier prêt `~/deploy-charge3d/Caddyfile.charge3d`
- M0 → [[mesures]]

## D15 — 2026-10-13 — M1 : redirection active, objectif tenu à 10 VUs, pas à 30 (chef)
- serveur de test laissé avec TILE_PRESIGN_REDIRECT=1, bloc Caddy @s3_presigne (exécuté humain), RATE_LIMIT_TILE_MAX=5000 restauré, RETENTION_MODE=off
- refus Caddy vérifiés de l'extérieur : bucket/list/objet sans signature, PUT, DELETE, signature fausse → 403 ; :9001 injoignable
- goulot 30 VUs = SQL de droits par tuile en file sur pool pg 10 → décision humaine : cache de droits 30 s (carte, décision 4) et pool pg configurable
- [[mesures]]

## D16 — 2026-10-13 — cache des droits de tuile 30 s + pool pg réglable (humain)
- supersède D6 « 0 cache » pour la route tuile seule : résultat positif de resolveTileGrant gardé ≤ 30 s en mémoire par (user, projet) ; refus jamais caché ; reste de l'app inchangé (coupure immédiate)
- révocation (retrait d'accès, compte désactivé, org suspendue) → tuiles encore servies ≤ 30 s : accepté
- `TILE_GRANT_CACHE_MS` (défaut 30000 base réelle, 0 en pg-mem ; 0 = désactivé) · `PG_POOL_MAX` (défaut 10)

## D17 — 2026-10-13 — retour T017 sur le cache de droits (chef)
- précise D16 : révocation tuile ≤ TTL + durée d'1 load en vol (un load lancé avant la révocation peut stocker un positif)
- défaut horloge murale (recul d'horloge → retard > TTL) → T018 : `performance.now` monotone
- `TILE_GRANT_CACHE_MS=''` → 0 (intIn littéral) : laissé, intIn partagé hors lot ; `clear()` sans effet sur inflight : 0 appel en prod, laissé

## D18 — 2026-10-13 — M2 : API hors de cause à 30 VUs, générateur k6 saturant (chef)
- M2 (cache 30 s, pool 10) : sql p50 0,1 ms, DB CPU 0–6 % ; 302 côté API p50 1,4 · p95 6,6 ms ; k6 voit p95 411–426 ms, débit ≈ 23–28 k tuiles/min
- contrôle CPU 30 VUs : machine 0 % idle ; 30 conteneurs k6 ≈ 245 % / 400 ; api 55 % ; minio 55 % ; caddy 28 %
- ⇒ latence k6 = file CPU du générateur colocalisé ; mesure 30 VUs invalide tant que k6 ≈ 60 % de la machine → T019 (k6 allégé : corps non conservés, N VUs par conteneur)

## D19 — 2026-10-13 — M3 : à 30 VUs le goulot est le process Node unique (chef)
- k6 allégé (T019) : générateur ÷ 3,8 en CPU, machine 19–28 % idle ; débit 40 k tuiles/min
- 10 VUs : 302 p95 47,5 ms + S3 p95 8,6 ms → objectif tenu ; 30 VUs : 302 p95 295 ms (handler p95 2,1 ms, API ≈ 100 % d'un cœur) → non tenu
- suite : profiler le coût CPU d'un 302 (T020) avant de choisir entre cache d'URL présignée et plusieurs process API (phase 3, décision 5 Redis)
- quota tuile restauré à 5000 après M3

## D20 — 2026-10-13 — présignature GET SigV4 directe, octet pour octet = SDK (chef, T020)
- T020 : 302 = 770 µs CPU dont presignGet SDK 554 µs (72 %), Fastify 209 µs, jeton 6,6 µs ; SigV4 direct ≈ 7 µs → ≈ ×3,5 req/s/process
- presignGet : chemin rapide `presignGetV4` (node:crypto, clé de signature mémoïsée par jour+région) ; URL = sortie du SDK octet pour octet (test d'égalité sur matrice) ; cas non couvert (endpoint absent, credentials absents, bucket non DNS…) → SDK
- `S3_PRESIGN_SDK=1` → SDK partout (retour arrière sans redéploiement de code)
- signUploadPart reste SDK (D8) ; cache d'URL (piste a) et N process (phase 3) : après mesure

## D21 — 2026-10-13 — M4 : objectif API tenu à 30 VUs (chef)
- SigV4 direct (T021) : API 94 % → 55 % CPU à 30 VUs ; 302 p95 295 → 52,7 ms ; débit 40 k → 64 k tuiles/min ; 0 erreur
- jambe S3 (MinIO via Caddy) p95 95 ms à 30 VUs, 378 ms à 60 : plafond = machine de test 4 vCPU partagée avec k6 ; en prod Scaleway, S3 managé hors API
- phase 3 (N process, Redis) : non nécessaire pour l'objectif ; L2 (304) + phase 2.1 (cache viewer) : bénéfice navigateur réel, à décider avec l'humain

## D22 — 2026-10-13 — Cache tuiles viewer : plugin fetchData + Cache Storage par compte/projet/contentTag (T024, chef)
- **Contexte** : token tuile dans l'URL (4 h) + presign → cache HTTP inutile entre visites ; confidentialité > gain ; humain : « je teste tout après, avance ».
- **Choix** : plugin 3d-tiles-renderer `fetchData` (3 l. TilesRendererLoader:142) ; cache `geolens-tiles-v1/{sha256(userId)[16]}/{projectId}/{contentTag}` ; `contentTag`+`viewerUserId` dans GET /api/projects/:id sous VIEWER_TILE_CACHE (défaut off) ; purge logout/idle/flag off, sélective login/boot ; plafond min(1,5 Gio, 0,6×quota), TTL 30 j.
- **Écarté** : Service Worker ; `v` dans le jeton (C3/L2 abandonné : 304 déjà sans SELECT via D16) ; override méthode ; cache HTTP.
- **Conséquence** : revisite = 0 requête tuile en HTTPS ; no-op sur serveur test HTTP ; toute réécriture en place sous un storage_prefix servirait du périmé ≤ 30 j.
- **À revoir si** : une fonction réécrit un fichier sous un storage_prefix existant ; ou Cache Storage évincé avant revisite.
- commit de TilesRendererLoader.ts : seulement les 3 lignes (index construit par le chef), hunks de l'autre mission jamais commités

## D23 — 2026-10-13 — retour T028 sur le cache de tuiles viewer (chef)
- confidentialité, périmé, clés, abort, erreurs Cache Storage, quota, API flag : conformes (28 tests de casse)
- défauts à corriger → T029 : housekeep sans try par clé (purge inter-comptes interrompue) ; > 64 Mio lu avant rejet (pic mémoire) ; TTL sur âge signé (horloge reculée) ; + MUTABLE_RE testé aussi sur le rel décodé (`%70roject.json`)
- accepté : projet supprimé/rétention → tuiles déjà vues restent dans le navigateur du lecteur ≤ 30 j ou jusqu'au logout (il y avait accès) ; abort pendant match avec hit → réponse rendue puis jetée par le renderer (`__loadIndex`)

## D24 — 2026-10-13 — gel des téléchargements de tuiles pendant le mouvement caméra (humain + T031)
- règle humaine : caméra en mouvement ⇒ 0 nouveau téléchargement ; reprise après 0,5 s d'immobilité continue
- humain : tuiles déjà chargées restent affichées, LOD recalculé entre elles (update() continue) ; fetch en vol finissent (non annulés) ; même règle pour tout chargement piloté par la caméra (COPC = one-shot racine ⇒ rien) ; livraison locale + vérif headless, serveur de test = accord humain
- levier : `downloadQueue.maxJobs = 0` ; parseQueue inchangé ; reprise ⇒ `scheduleJobRun()` explicite
- un seul propriétaire de maxJobs : `downloadJobs({moving, vramThrottled, streamingActive, normal})` → 0 | normal (gel, backpressure VRAM, œil fusion)
- pose lue sur la caméra passée à `update()` (`options.camera`), plus sur `cam` du hook : une passe de capture (ortho, rapport) ne doit ni geler ni casser C3
- animations programmées (fly-to, vues enregistrées) = mouvement ⇒ gel aussi (règle littérale)
- accepté : items périmés en file partent à la reprise (tri priorityCallback) → optimisation au chantier preview
