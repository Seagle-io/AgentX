---
projet: geolens-charge-3d
titre: Recette — charge serveur du rendu 3D
maj: 2026-10-13
tags: [recette, geolens]
---

# Recette — à dérouler par l'humain

Code : G = `geolens-web-feat-viewer-online`, master, commits locaux `038120d` → `17d1f85` (non poussés). Serveur de test = API `03a7bcb` déployée (sans 2.1). Voir [[deploiement-test]], [[mesures]], [[decisions]].

## 1. Serveur de test — redirection des tuiles (http://82.65.97.67:34580)
- [ ] Ouvrir un projet 3D dans le viewer, DevTools › Réseau, filtre `storage` : une tuile `.b3dm` → **302** → `/geolens/…?X-Amz-…` → **200** ; console : 0 erreur CSP
- [ ] Le modèle s'affiche entièrement en naviguant (pas de trous) ; aucune requête en 403/429
- [ ] Retirer l'accès d'un membre au projet pendant qu'il est ouvert → ses tuiles s'arrêtent en **≤ 30 s** (cache des droits D16) ; le reste de l'app refuse immédiatement
- [ ] Retour au SDK sans changer de code : `.env` + `S3_PRESIGN_SDK=1`, `up -d --no-deps api` → tuiles toujours 200 ; puis retirer la ligne

## 2. Cache des tuiles du viewer (phase 2.1) — en local (localhost = contexte sécurisé)
Cache Storage n'existe qu'en HTTPS ou sur localhost : **inactif sur le serveur de test http** (normal).
- [ ] API locale avec `VIEWER_TILE_CACHE=1` + `npm --prefix web run dev`, se connecter, ouvrir un projet 3D
- [ ] 1ʳᵉ visite : DevTools › Application › Cache Storage → un cache `geolens-tiles-v1/<16 hex>/<projet>/<tag>` se remplit
- [ ] Fermer le viewer, rouvrir le même projet : Réseau `storage` → **0 tuile** téléchargée (seuls tileset/project.json) ; console `__glrTileCacheStats.hits > 0`
- [ ] Déconnexion → Cache Storage **vide** ; idem après déconnexion par inactivité
- [ ] Compte A puis compte B dans le même navigateur → au login de B, les caches de A disparaissent
- [ ] Ré-import du projet (nouveau storage_prefix) → nouveau `<tag>`, l'ancien cache du projet est supprimé à l'ouverture
- [ ] Kill switch : `localStorage.setItem('glr.tileCache','off')` → plus aucun cache créé ; serveur `VIEWER_TILE_CACHE` absent → idem

## 3. Re-mesurer (serveur de test, k6)
```bash
cd ~/geolens-web && sed -i 's/^RATE_LIMIT_TILE_MAX=5000$/RATE_LIMIT_TILE_MAX=500000/' .env && docker compose -f docker-compose.prod.yml up -d --no-deps api
cd ~/load && make run VUS=30 PER=10 DURATION=2m SCENARIO=redirect TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580 TILE_ORIGIN_INTERNAL=http://caddy:80 && make report VUS=30
cd ~/geolens-web && sed -i 's/^RATE_LIMIT_TILE_MAX=500000$/RATE_LIMIT_TILE_MAX=5000/' .env && docker compose -f docker-compose.prod.yml up -d --no-deps api
```
Attendu (M4) : p95 agrégé tuile ≈ 50 ms, s3/tile ≈ 95 ms, 0 erreur.

## 4. Avant la production (Scaleway, HTTPS)
- [ ] Pousser les commits (humain) ; tests : `npm --prefix api test` (102 fichiers / 994), `npm --prefix web test` (182 / 1750)
- [ ] `.env` prod : `TILE_PRESIGN_REDIRECT=1` ; `S3_PUBLIC_ENDPOINT` vide (Scaleway) ; `TILE_GRANT_CACHE_MS` défaut 30000 ; `VIEWER_TILE_CACHE=1` quand la recette §2 est passée ; jamais `RETENTION_MODE=off` en prod (rétention RGPD)
- [ ] **CSP** `web/viewer.html:13` et `web/src/viewer/index.html:13` : remplacer le placeholder `bucket-a-remplacer.s3.fr-par.scw.cloud` (img-src, connect-src) par le vrai bucket — sinon les tuiles redirigées sont bloquées
- [ ] **CORS du bucket Scaleway** : GET depuis l'origine du portail, en-têtes de réponse exposés — sinon le viewer ne peut pas lire les tuiles redirigées
- [ ] Invariant à respecter : aucun fichier réécrit en place sous un `storage_prefix` existant (sauf project.json) — le cache navigateur le servirait ≤ 30 j

## 5. Retour arrière serveur de test
Voir [[deploiement-test]] § Retour arrière (`~/deploy-charge3d/` : api.avant, env.avant, Caddyfile.avant).
