---
projet: geolens-charge-3d
titre: Déploiement et mesure sur le serveur de test
maj: 2026-10-12
tags: [runbook, geolens, serveur-test]
---

# Déploiement et mesure — serveur de test (82.65.97.67)

Exécuté par le chef via ssh (D13). Jamais `GEOLENS_ENV=production` sur ce serveur. Code : G HEAD `edb565f`. Décisions : D4, D5, D9, D11. Voir [[geolens-serveur-test]].
Règles : 0 `pull`, 0 `down`, 0 `-v`, `.env` jamais affiché. Coller les sorties marquées 📋 au chef.

## 1. Depuis la machine locale — copier le code et les scripts
```bash
G=~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
ssh -p 34522 geo-test@82.65.97.67 'mkdir -p ~/deploy-charge3d ~/load && cd ~/geolens-web && cp -a api ~/deploy-charge3d/api.avant && cp -p .env ~/deploy-charge3d/env.avant && cp -p Caddyfile ~/deploy-charge3d/Caddyfile.avant && chmod 600 ~/deploy-charge3d/env.avant'
rsync -a --exclude node_modules --exclude dist -e 'ssh -p 34522' "$G/api/" geo-test@82.65.97.67:~/geolens-web/api/
rsync -a -e 'ssh -p 34522' "$G/tools/load/" geo-test@82.65.97.67:~/load/
```

## 2. Sur le serveur — contrôles préalables (STOP si un contrôle échoue)
```bash
cd ~/geolens-web
grep -cE '^S3_SECRET_KEY=.+' .env            # attendu 1
grep -c '^S3_SECRET_KEY=geolens123$' .env    # attendu 0, sinon STOP : changer la clé MinIO d'abord
grep -E '^(S3_BUCKET|S3_ENDPOINT|S3_FORCE_PATH_STYLE|WEB_ORIGIN|STORAGE_DRIVER)=' .env   # 📋 (aucun secret)
docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from audit_log"'   # 📋 lecture seule
B=$(grep -E '^S3_BUCKET=' .env | cut -d= -f2); echo "bucket=${B:-geolens}"
curl -s -o /dev/null -w '%{http_code}\n' "http://82.65.97.67:34580/${B:-geolens}/x"   # 📋 avant Caddy
```

## 3. API — redéploiement, presign encore OFF (mesure de la phase 1.2 seule)
```bash
cat >> .env <<'ENV'
# charge-3d (2026-10-12)
S3_FORCE_PATH_STYLE=1
S3_PUBLIC_ENDPOINT=http://82.65.97.67:34580
TILE_PRESIGN_REDIRECT=0
TILE_PRESIGN_TTL_SEC=3600
RATE_LIMIT_TILE_MAX=500000
RETENTION_MODE=off
ENV
docker compose -f docker-compose.prod.yml up -d --no-deps --build api
docker compose -f docker-compose.prod.yml logs --since 3m api | grep -iE 'listening|error|migrat' | tail -20   # 📋
```
Si `.env` contient déjà une de ces clés, modifier la ligne existante au lieu d'en ajouter une seconde.

## 4. Mesure M0 — 10 VUs, sans redirection (comparable au 09/10 : p95 154 ms)
```bash
cd ~/load && make run VUS=10 DURATION=2m && make report VUS=10   # 📋
cd ~/geolens-web && docker compose -f docker-compose.prod.yml logs --since 5m api | grep '"tile metrics"' | tail -2   # 📋
```

## 5. Caddy — MinIO même origine
Dans `~/geolens-web/Caddyfile`, bloc du site servi sur :34580, AVANT `handle /api/*`, remplacer `<B>` par le bucket du point 2 :
```caddyfile
    @s3_presigne {
        method GET
        path /<B>/*
        query X-Amz-Signature=*
    }
    handle @s3_presigne {
        reverse_proxy minio:9000 {
            header_up -Cookie
            header_up -Authorization
        }
    }
    @s3_autre path /<B> /<B>/*
    handle @s3_autre {
        respond 403
    }
```
Interdit : `header_up Host`, `uri strip_prefix`.
```bash
docker compose -f docker-compose.prod.yml restart caddy
docker compose -f docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile   # 📋 Valid configuration
curl -s -o /dev/null -w '%{http_code}\n' "http://82.65.97.67:34580/${B:-geolens}/"              # 403
curl -s -o /dev/null -w '%{http_code}\n' "http://82.65.97.67:34580/${B:-geolens}/?list-type=2"   # 403
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "http://82.65.97.67:34580/${B:-geolens}/x?X-Amz-Signature=x"   # 403
curl -s -m5 -o /dev/null -w '%{http_code}\n' http://82.65.97.67:9001 || echo injoignable             # injoignable
```

## 6. Activer la redirection
```bash
sed -i 's/^TILE_PRESIGN_REDIRECT=0$/TILE_PRESIGN_REDIRECT=1/' .env
docker compose -f docker-compose.prod.yml up -d --no-deps api
docker compose -f docker-compose.prod.yml logs --since 2m api | grep 'tile presign ON'   # 📋 attendu "origin":"http://82.65.97.67:34580","sameOrigin":true
```
Navigateur : ouvrir le viewer sur un projet 3D, DevTools › Réseau, une tuile `.b3dm` → 302 → `/<B>/…` → 200 ; 0 erreur CSP en console. 📋 statut (ne pas coller l'URL signée).

## 7. k6 suit-il la redirection depuis le réseau Docker ?
```bash
docker run --rm --network geolens-web_default curlimages/curl -s -o /dev/null -w '%{http_code}\n' -m 5 http://82.65.97.67:34580/   # 📋 200 → OK ; timeout → STOP, le chef prépare un correctif k6
```

## 8. Mesures M1 — redirection active
```bash
cd ~/load
make run VUS=5  DURATION=2m SCENARIO=redirect && make report VUS=5    # 📋
make run VUS=10 DURATION=2m SCENARIO=redirect && make report VUS=10   # 📋
make run VUS=30 DURATION=2m SCENARIO=redirect && make report VUS=30   # 📋
cd ~/geolens-web && docker compose -f docker-compose.prod.yml logs --since 15m api | grep '"tile metrics"' | tail -3   # 📋
```

## 9. Après les mesures
```bash
sed -i 's/^RATE_LIMIT_TILE_MAX=500000$/RATE_LIMIT_TILE_MAX=5000/' .env
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

## Retour arrière (si besoin)
```bash
cd ~/geolens-web
cp -p ~/deploy-charge3d/Caddyfile.avant Caddyfile && docker compose -f docker-compose.prod.yml restart caddy
cp -p ~/deploy-charge3d/env.avant .env
rm -rf api && cp -a ~/deploy-charge3d/api.avant api
docker compose -f docker-compose.prod.yml up -d --no-deps --build api
```
Les colonnes et index ajoutés restent en base : sans effet sur l'ancien code.
