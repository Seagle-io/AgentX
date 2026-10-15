---
projet: geolens-charge-3d
titre: GeoLens — charge serveur du rendu 3D
statut: cadrage
objectif: 30 utilisateurs k6 naviguent dans le viewer 3D sans saturer l'API — p95 tuile < 150 ms, 0 erreur
depot: /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
produit: geolens
cree: 2026-10-12
tags: [projet, geolens, charge]
---

# Brief — GeoLens — charge serveur du rendu 3D

Source : epic Trello https://trello.com/c/pzR8vwst · suite de D19-D25 [[geolens-viewer]] · [[geolens-serveur-test]]

## Objectif
30 VUs k6 sur le modèle de référence (4 558 tuiles) : p95 tuile < 150 ms, 0 429/5xx ; aujourd'hui saturation entre 5 et 10 VUs (10 VUs p95 154 ms, API ≈ 1,15 cœur).

## Definition of Done du projet
- [ ] 0.1 scripts k6 dans `G/tools/load/` sans identifiant + 3 scénarios : retour 304, COPC par plages, suivi des 302
- [ ] 0.2 chronométrage agrégé route tuile (SQL, S3, envoi) en module dédié, testé
- [ ] 1.1 302 actif sur le serveur de test (MinIO joignable, CSP, CORS, TTL 3600) + mesure k6 5/10/30 VUs collée
- [ ] 1.2 route tuile : log seulement 4xx, 5xx, lents
- [ ] 1.3 304 avant SELECT, HMAC toujours vérifié, test de non-régression
- [ ] 2.1 cache persistant viewer (Cache Storage) clé sans jeton, purge à la déconnexion, plafond, COPC exclu — si mesure après phase 1 < objectif
- [ ] chaque lot d'implémentation passé au verificateur ; api + web typecheck/lint/tests verts, sortie collée

## Contraintes dures
- règles de G : `server.ts`, `main.ts` gelés → module dédié ; fichier neuf ≤ 400 l, fonction ≤ 60 l ; 0 `any` ; `process.env` seulement dans `api/src/config.ts` ; fix = test de non-régression
- serveur de test 82.65.97.67 : BDD 0 écriture destructive, 0 migration lancée par agent, 0 `down -v`, `.env` jamais affiché ni écrasé ; redéploiement API = humain, après validation des DDL de migrate()
- agents : 0 commit, 0 push ; commit local par le chef
- D6 maintenu (0 cache d'autorisation)

## Hors périmètre
- phase 3 (multi-process, Redis) sauf décision nouvelle après mesure
- phase 4 (compression, KTX2) : à chiffrer plus tard
- bucket Scaleway de prod, CDN
- jeton en en-tête Authorization (2.2)

## Hypothèses retenues
- la mesure sur le serveur de test (4 vCPU) préfigure POP2-2C-8G — à invalider si l'API dépasse 2 cœurs pendant un palier
- le viewer du serveur de test est servi en http → MinIO peut l'être aussi (pas de contenu mixte) — à invalider si l'architecte T004 trouve une contrainte HTTPS

## Questions ouvertes
- port ou nom d'hôte public pour exposer MinIO sur le serveur de test — humain (après T004)

## Carte du terrain
G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` (git local, master, HEAD da5fced, arbre sale : mission D24 non commitée)

| Quoi | Où | Note |
|---|---|---|
| route tuile | `G/api/src/server.ts:733-824` | HMAC :741, SELECT :749, 304 :760, 302 :763 |
| auth tuile | `G/api/src/tileAuth.ts:35-43` | resolveTileGrant, 1 SELECT nommé |
| 302 | `G/api/src/tileRedirect.ts:12-22` | GET sans Range, ext binaires |
| presign | `G/api/src/storage.ts:582-593,674-678` | presignGet, s3PublicOrigin |
| logger | `G/api/src/server.ts:155`, `logRedact.ts:39` | pino info, 2 lignes/req |
| config | `G/api/src/config.ts:212-223` | TILE_* |
| CSP viewer | `G/web/viewer.html:13`, `web/src/viewer/index.html:13` | placeholder bucket |
| fetch tuiles | `G/web/src/viewer/loaders/TilesRendererLoader.ts:134-141` | preprocessURL, fetchData natif |
| jeton URL | `G/web/src/viewer/backend/HttpBackend.ts:46-69` | makeSignUrl `?token=` |
| tests tuile | `G/api/test/tile-route-redirect.test.ts` | 304, 302, 429, Range |
| k6 | serveur `~/viewer-navigation.js`, `~/Makefile` | → `G/tools/load/` |
