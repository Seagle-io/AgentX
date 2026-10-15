---
tache: T013
statut: fait
---
## Livré
- G/docker-compose.scaleway.yml:L24-32 — api healthcheck fetch node + logging
- G/docker-compose.scaleway.yml:L36-41 — web depends_on api service_healthy + logging
- G/docker-compose.scaleway.yml:L52-54 — caddy logging json-file 10m×5 ; en-tête L1-16 intact
- G/web/nginx.conf:L1-2 — log_format noquery hors server
- G/web/nginx.conf:L9 — access_log noquery dans server
- G/.env.production.example:L17 — JWT_SECRET : valeur identique à la restauration
- G/.env.production.example:L32-34 — TTL 28800, WINDOW 14400 commentés
- G/DEPLOYMENT.md:L68-98 — §5 quinquies, 6 rubriques, 31 l
- G/DEPLOYMENT.md:L160 — « runbook §5 quinquies, à jouer une fois »
## Vérifié comment
`T=$(mktemp -d)` (/tmp, hors G) + cp compose + .env factice contrat → `docker compose -f $T/docker-compose.scaleway.yml config --quiet` → `exit=0`
`docker compose -f $T/... config | grep` → api `healthcheck` présent · web `condition: service_healthy` · 3× `max-file: "5"` `max-size: 10m`
`docker run --rm --add-host api:127.0.0.1 -v G/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t` (1 pull) →
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
exit=0
```
`git -C G diff --stat -- <4 fichiers>` →
```
 .env.production.example     |  5 ++++-
 DEPLOYMENT.md               | 34 +++++++++++++++++++++++++++++++++-
 docker-compose.scaleway.yml | 18 +++++++++++++++++-
 web/nginx.conf              |  4 ++++
 4 files changed, 58 insertions(+), 3 deletions(-)
```
dossier jetable supprimé ; 0 `.env` créé dans G
## Écarts
- DoD 7 : `git diff --stat` global = 34 fichiers (agents parallèles api/, web/src, e2e/, worker/, Caddyfile) → stat restreinte aux 4 fichiers WL
- nginx -t : `--add-host api:127.0.0.1` ajouté — `proxy_pass http://api:4000` non résolu hors compose
- §5 quinquies placée après §5, avant §5 bis (DoD littérale) → numérotation non monotone
- lecture hors WL : ∅
## Pour la suite
- caddy `depends_on: [api, web]` = service_started ; non durci (∅ contrat)
- healthcheck web/caddy ∅ (hors contrat)
- `TILE_URL_WINDOW_SEC` : vérifier lecture côté api/src (hors WL)
- §5 quinquies avant §5 bis : déplacer après §5 quater si ordre voulu
- runbook §5 quinquies jamais joué — à exécuter 1× avant ouverture client
## Retour sur le pack
- Manquait: nginx -t exige `--add-host api:…` ; DoD « 4 fichiers exactement » incompatible avec arbre partagé → préciser `-- <chemins>`
- Inutile: api/Dockerfile (L) — contrat suffisait
