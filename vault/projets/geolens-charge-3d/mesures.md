---
projet: geolens-charge-3d
titre: Mesures k6 du serveur de test
maj: 2026-10-13
tags: [mesures, geolens, serveur-test, charge]
---

# Mesures k6 — serveur de test (82.65.97.67)

Script `tools/load/viewer-navigation.js`, preset standard (concurrence 6), 2 min de palier, 1 conteneur k6 = 1 VU, BASE_URL `http://api:4000`. Voir [[deploiement-test]], [[geolens-serveur-test]].

| mesure | date | API | VUs | tuiles | p95 tuile k6 | médiane | 429/5xx | CPU api | CPU minio |
|---|---|---|---|---|---|---|---|---|---|
| réf | 09/10 | S (22/09) | 10 | 48 480 | 147–154 ms | 78 ms | – | ≈ 115 % | – |
| M0 | 13/10 | G edb565f, presign OFF | 10 | 54 600 | 120,1 ms | 51 ms | 0/0 | 103 % | 100 % |
| M1 | 13/10 | presign ON (302 + S3 via caddy) | 5 | 39 240 | 302 : 21,2 ms · S3 : 13,4 ms | 6 ms | 0/0 | 54 % | 49 % |
| M1 | 13/10 | presign ON | 10 | 61 800 | 302 : 55,6 ms · S3 : 37,7 ms | 12 ms | 0/0 | 75 % | 59 % |
| M1 | 13/10 | presign ON | 30 | 75 000 | 302 : 362,6 ms · S3 : 91,4 ms | 54 ms | 0/0 | 81 % | 60 % |
| M2 | 13/10 | + cache droits 30 s (382ddc7) | 10 | 62 640 | 302 : 48,3 ms · S3 : 41,1 ms | 10 ms | 0/0 | 85 % | 60 % |
| M2 | 13/10 | idem | 30 | 82 080 | 302 : 426,0 ms · S3 : 129,4 ms | 57 ms | 0/0 | 71 % | 65 % |
| M3 | 13/10 | + horloge monotone (0ab700f), k6 allégé PER=10 (0e04b46) | 10 | 85 680 | 302 : 47,5 ms · S3 : 8,6 ms | 5 ms | 0/0 | 55–76 % | 76–94 % |
| M3 | 13/10 | idem | 30 | 106 320 | 302 : 295,3 ms · S3 : 10,0 ms | 10 ms | 0/0 | **90–94 %** | 95–103 % |
| M4 | 13/10 | + SigV4 direct (d15be57) | 10 | 98 880 | 302 : 7,6 ms · S3 : 12,0 ms | 3 ms | 0/0 | 31–38 % | 90–97 % |
| M4 | 13/10 | idem | **30** | **177 000** | **302 : 52,7 ms · S3 : 95,2 ms** | 19 ms | **0/0** | 52–59 % | 158 % |
| M4 | 13/10 | idem | 60 | 172 320 | 302 : 111,2 ms · S3 : 378,4 ms | 48 ms | 0/0 | 44–52 % | 129–154 % |

M0 côté API (tileMetrics, fenêtre 60 s, ≈ 20 000 tuiles/min) : sql p50 13–14 · p95 44,6 ms ; storage p50 19–21 · p95 45–54 ms ; send p95 < 2 ms ; total p50 34–41 · p95 86,9 ms ; slow 0.
Lecture : SQL ≈ 1/3 du temps serveur → cible L2 (304/jeton) et cache de droits (décision 4) ; MinIO à 100 % = 2ᵉ goulot.

M1 30 VUs côté API (tileMetrics) : ≈ 22 000 tuiles/min (= plafond M0) ; sql p50 186–273 · p95 330–363 ms = 100 % du temps du 302 ; DB CPU 23 % → attente du pool pg (`max: 10` en dur, db.ts:42), pas la base.
Lecture : redirection = gain net (10 VUs : 302+S3 ≈ 94 ms vs 120 ms, CPU API −28 pts, MinIO −40 pts) ; à 30 VUs le goulot est le SELECT de droits par tuile (resolveTileGrant, server.ts:752) → cache de droits (décision 4) et/ou pool pg.
NV : contrôle navigateur 302 → 200 (extension Chrome absente) ; CSP `connect-src 'self'` couvre la même origine.

M2 : sql p50 0,1 ms (cache), DB 0–6 % ; 302 côté API p95 6,6 ms ; machine 0 % idle, 30 conteneurs k6 ≈ 245 % → mesure 30 VUs invalide (D18).
M3 30 VUs : k6 ≈ 65 % (÷ 3,8), machine 19–28 % idle ; ≈ 40 000 tuiles/min (× 1,7) ; handler 302 p50 1,2 · p95 2,1 ms ; API ≈ 1 cœur plein → file d'attente avant le handler = p95 295 ms. Goulot = process Node unique (CPU par 302 : jeton HMAC + SigV4 présigné + Fastify) ; MinIO ≈ 1 cœur aussi.

M4 : handler 302 p50 0,3–0,5 · p95 0,9–2,1 ms ; 30 VUs ≈ 64 000 tuiles/min (× 2,8 vs M0), ≈ 44 Go servis par MinIO en 2 min 45 ; 0 erreur S3.
Lecture : objectif API tenu à 30 VUs (302 p95 53 ms) ; API ≈ ½ cœur. Nouveau plafond = machine (0–5 % idle) : MinIO ≈ 1,6 cœur + Caddy ≈ 0,75 + k6 ≈ 1 ; à 60 VUs, le saut S3 (378 ms) sature, pas l'API (111 ms).
