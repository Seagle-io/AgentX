---
tache: T062
statut: fait
---
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online (abrégé `G/`)
## Chemin d'une tuile
- 1 URL signée · G/api/src/server.ts:612 (tilesetUrl), :526 (thumbnailUrl) — token en query ; signTileToken{p,u,exp} storage.ts:47 ; 1 HMAC, 0 DB
- 2 jeton PAR USER+PROJET · storage.ts:44-46 `u` dans le payload → URL ≠ entre comptes (2 comptes = 2 URLs = 2 clés de cache) ; même user = URL identique (exp quantifiée tileExp.ts, T=28800 W=14400 → stable 4 h)
- 3 Caddy · Caddyfile:5 `encode zstd gzip` global (hors matcher) ; `handle /api/*` → reverse_proxy api:4000 ; 0 cache, 0 limite débit
- 4 rate-limit · server.ts:734 route override max=rateLimitTileMax (5000/min/IP, config.ts:211) ; global 300/min (server.ts:232) NON appliqué aux tuiles (mesuré)
- 5 vérif jeton · server.ts:736 verifyTileToken — HMAC+timingSafeEqual, 0 DB
- 6 DB 2 SELECT/tuile · server.ts:270-274 resolveSignedProject : session.ts:19 loadUserAccessState (users⋈organizations) + tenancy.ts:87 getAccessibleProject (projects⋈org[⋈project_access]) ; 0 cache (session.ts:5 « 0 cache »)
- 7 ETag/304 · server.ts:516-523,752 — ETag sha1(prefix/rel) ; If-None-Match → 304 AVANT stockage, mais APRÈS les 2 SELECT
- 8 project.json · server.ts:748 no-store, jamais 304
- 9 Range · server.ts:754-759 `bytes=S-E` passé au driver
- 10 stockage local · storage.ts:215-229 existsSync+statSync×2 (sync, bloque event loop) + createReadStream
- 11 stockage S3 · storage.ts:601 GetObject, client singleton storage.ts:391-420 ; stream passé à reply.send (pas de buffer, mémoire bornée) ; erreur transitoire → 503 Retry-After:1 (server.ts:767), NoSuchKey → 404
- 12 réponse · server.ts:782 `Cache-Control: private, max-age=86400, immutable` + ETag ; Accept-Ranges
- Content-Type tuiles : .b3dm/.pnts = application/octet-stream, .glb = model/gltf-binary (storage.ts:73-78) → compressées par Caddy `encode` ? NV (défaut Caddy non testé, pas de Caddy local)
## Mesures
Stack : API locale :4100, pg-mem, stockage local, RATE_LIMIT off (défaut mem). Projet « Vieux Château de Villelaure » (prefix villelaure-real). Boucle/session ×20 : tileset.json(~0,6 Ko), pnts/tileset.json(6,7 Ko), mid.pnts(100 Ko synthétique), big.b3dm(1 Mo synthétique), thumb.jpg(222 Ko réel). Sessions = K logins admin (même user → 1 URL distincte sur K).
| K sessions | req/s | p50 ms | p95 ms | 429 | 5xx | RSS API (avant→après) |
|---|---|---|---|---|---|---|
| 1 | 401 (107 Mo/s) | 2,2 | 5,5 | 0 | 0 | 217→219 Mo |
| 10 | 796 (213 Mo/s) | 10,3 | 25,6 | 0 | 0 | 219→271 Mo |
| 50 | 972 (260 Mo/s) | 41,9 | 93,9 | 0 | 0 | 271→393 Mo |
Fichier lourd réel 3dgs/…0_19_0_0_1_0.sog (10,8 Mo) ×2/session :
| 1 | 31 (332 Mo/s) | 38,7 | 38,7 | 0 | 0 | 374 Mo |
| 10 | 49 (527 Mo/s) | 189 | 273 | 0 | 0 | 393 Mo |
| 50 | 58 (628 Mo/s) | 753 | 1047 | 0 | 0 | 445 Mo |
Rate-limit (instance :4101 RATE_LIMIT=1, 1 IP, 1 login) :
- 6200 GET tuile en rafale → `{"200":5000,"429":1200}` ; les 304 comptent aussi (2000 suivants → 2000×429)
- 320 GET /api/projects → `{"200":298,"429":22}` (global 300/min ; ≠ tuiles)
Chemin 304 (If-None-Match, 20 conc., RL off) : 2000×304, 1290 req/s → 304 ≠ gratuit (2 SELECT pg-mem)
Limites de mesure : client+serveur même machine (loopback) ; pg-mem ≠ Postgres managé (latence réseau DB non mesurée) ; disque local ≠ S3 (latence/egress Scaleway non mesurés) ; seed sans vrais .b3dm (synthétiques) ; 1 seul user (membre@demo n'a pas accès à Villelaure → 2 users distincts non testés sur ce projet).
## Goulots
- 1 · rate-limit IP 5000/min · ~83 tuiles/s par IP · prouvé : 429 à la 5001e. Villelaure ≈ 2500 req/chargement (server.ts:715-728) → 2 comptes derrière 1 NAT/bureau saturent ; 304 compris. Effet : sous-arbres FAILED
- 2 · bande passante sortie API+Caddy (1 réplique, docker-compose.scaleway.yml:23-) · octets/tuile × N, aucun CDN ; local 600 Mo/s non représentatif de la VM prod [NV: débit VM]
- 3 · latence DB : 2 SELECT/tuile → ~2×N×req/s requêtes sur Postgres managé · ~1000 req/s ⇒ ~2000 q/s [NV: pool pg, latence réseau]
- 4 · CPU Caddy compression des octet-stream si activée [NV]
- 5 · sockets S3 : client S3Client sans NodeHttpHandler custom (storage.ts:396-419, 0 maxSockets/keepAlive explicite) → défaut SDK v3 maxSockets=50 par handler ⇒ au-delà de 50 GET S3 simultanés les requêtes font la queue [NV: défaut SDK, S3 non testé]
- 6 · RSS : +176 Mo entre K=1 et K=50 (217→393 Mo local ; 445 Mo sog) — pg-mem + buffers streams, non représentatif Postgres ; 0 limite mémoire compose (docker-compose.scaleway.yml : ∅ mem_limit/deploy.resources)
- 7 · event loop : existsSync+statSync ×2 en local (storage.ts:221-222) — driver local seulement, S3 prod non concerné
## Leviers
| # | levier | gain | fichiers | risque sécurité | taille |
|---|---|---|---|---|---|
| a | jeton tuile par projet+fenêtre (sans `u`) → URL identique entre comptes + cache partagé Caddy | N comptes → 1 fetch backend/tuile/4 h ; supprime goulots 1,2,3,5 sur hit | server.ts:526,612,736,270 ; storage.ts:44 ; Caddyfile (cache — module non standard `cache-handler`, NV) | fort : URL = capacité partagée ; fuite = accès tous comptes jusqu'à exp ; révocation immédiate (D6) perdue sur hit cache | L |
| b | 302 vers GET S3 présigné | tuile ne passe plus par API/Caddy : bande passante API→0, sockets S3 hors API | storage.ts:568 (getSignedUrl existe, UploadPart seulement ; 0 usage GET), server.ts:782, driver local sans équivalent | URL S3 portable 60-300 s ; auth DB gardée 1×/tuile (2 SELECT restent) ; T009 (jeton limité à l'origine API) contourné ; CORS bucket à régler ; tuile ≠ immuable-cacheable (URL change) | M |
| c | exclure tuiles de `encode` Caddy | −CPU Caddy si octet-stream compressés [NV] ; b3dm/pnts/glb déjà compacts (draco) | Caddyfile:5 (matcher `not path /api/projects/*/storage/*`) | ∅ | S |
| d | clé rate-limit tuile par user/jeton | NAT/bureau : cap 5000/min par user, plus par IP | server.ts:734 (`keyGenerator` : token.u), config.ts:211 | clé dérivée d'un token vérifié seulement (sinon contournable par jeton forgé → vérifier HMAC avant) ; anti-scraping par IP perdu | S |
| e | cache LRU mémoire API (résultat resolveActiveUser+getAccessibleProject, TTL 5-10 s) | −2 SELECT/tuile (→ ~0,0x) | server.ts:270-274, session.ts:31 | révocation retardée ≤ TTL : contredit D6 « coupure immédiate » ; invalidation sur disable/sv bump = O(1) si process unique | S/M |
| e' | LRU de contenu (octets tuiles) | −GET S3 sur hits ; mémoire API ↑ (tuiles 1-10 Mo) | storage.ts get | cache serveur-side sûr (auth déjà passée) ; coût RAM sans limite compose | M |
| f | CDN Scaleway Edge Services devant bucket/API | egress hors VM, cache mondial | infra + signed URLs CDN, server.ts | = a/b selon mode ; URLs signées CDN ≠ jeton actuel | L |
Combo minimal peu risqué : c + d (S+S). Combo fort : b (M) ; a/f exigent arbitrage révocation vs cache.
## Vérifié comment
- `git -C G status --short` → ∅ ; `rev-parse --short HEAD` → 120d0aa
- bench : `node $W/bench.mjs {1,10,50} 20` → lignes JSON du tableau (codes `{"200":N}`)
- `node $W/rl.mjs` (:4101 RATE_LIMIT=1) → `tiles x6200 … {"200":5000,"429":1200}` · `304 test {"429":2000}` · `global /api/projects x320 {"200":298,"429":22}`
- `node $W/rl2.mjs` (:4100) → `304 test {"304":2000} rps 1290`
- tokens : K=1/10/50 → « distinct tileset URLs among K sessions = 1 » (même user)
- 2 SELECT/tuile : lecture server.ts:270-274, session.ts:19-23, tenancy.ts:87-120 (non compté à l'exécution)
- procs :4100/:4101 tués (`ss -ltn | grep 410[01]` → ∅) ; $W = mktemp hors G, storage copié supprimé
## Écarts
- ∅ lecture hors WL de fichiers non listés, sauf : seed-data/storage (ls/find, copie en tmp), api/src/seed.ts:60-145 (prefix villelaure-real, comptes), api/src/tenancy.ts:87-120 (getAccessibleProject) — 3 lectures, bloquantes pour compter les SELECT/préfixe
- bench.mjs seul tmp ; `claude -p`-ignorés : des process `tsx watch` pré-existants (pids 2308532/3, non lancés par moi) laissés
- write de result.md via chemin `Geolens/../../AgentX/…` = même fichier du pack
## Pour la suite
- Chemin tuile = 1 jeton HMAC (par user+projet) + 2 SELECT DB + (local: 2 stat | S3: GetObject stream) par requête, 304 inclus ; Caddy `encode` global, 0 cache ; 1 réplique api ; Cache-Control private ⇒ 0 cache partagé possible aujourd'hui.
- 1er goulot prouvé : rate-limit 5000/min/IP (429 à 5001, 304 comptés) ; Villelaure ≈ 2500 req ⇒ 2 comptes/NAT en rafale = FAILED. Levier d (keyGenerator par user, S) le résout sans toucher la sécurité.
- Local K=50 : 972 req/s mixte, p95 94 ms, 0 5xx, RSS 393 Mo ; mesure non représentative de S3/Postgres managé/VM prod → NV pour tout seuil prod.
- Décision à trancher par l'humain : a (cache partagé) vs D6 révocation immédiate ; b (302 S3) vs T009. c et d ne touchent pas la sécurité.
- Non vérifié : défaut `encode` Caddy sur octet-stream, maxSockets S3 SDK effectif, latence S3/Postgres, ressources VM Scaleway.
## Retour sur le pack
- Manquait: prefix du seed Villelaure (`villelaure-real`, pas `villelaure`) et que membre@demo n'a pas accès à Villelaure ; chemin tenancy.ts:87 (getAccessibleProject) ; débit/CPU de la VM prod
- Inutile: ∅
