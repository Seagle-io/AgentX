---
tache: T005
statut: fait
---
## Livré
- `G/tools/load/viewer-navigation.js:1-297` — S + SCENARIO navigation/revisit/redirect, USERS obligatoire
  - L19-37 usage `tools/load/`, scénarios · L60-74 SCENARIO validé, Counters `tile_304 tile_302 s3_bytes s3_err`, `seen` ETag/VU
  - L90-103 seuils par scénario (`s3/tile` p95+failed ; `storage/tile-revisit` p95) · L181 `setup()` lève si USERS vide
  - L227-265 revisit (ITER 0 mémorise `Etag` clé sans token ; ITER>0 `If-None-Match`) · redirect (`redirects: 0`, 302 → batch `Location` jar vide)
  - L285-295 résumé : lignes 304 / S3 selon scénario ; navigation inchangé
- `G/tools/load/copc-ranges.js:1-145` — neuf : en-tête 0-65535 en setup, taille via Content-Range, plages aléatoires batch, `copc_206 copc_err copc_bytes`
- `G/tools/load/Makefile:1-91` — S + SCRIPT/SCENARIO/COPC_PATH `-e`, `--out csv=…csv.gz`, p95 agrégé CSV (L83-86)

## Vérifié comment
- `docker run --rm -v G/tools/load:/s:ro grafana/k6:0.54.0 inspect [-e SCENARIO=x] /s/<script>` → `viewer-navigation.js → exit 0` · `SCENARIO=revisit → exit 0` (seuil `storage/tile-revisit`) · `SCENARIO=redirect → exit 0` (seuils `http_req_duration{name:s3/tile}` `http_req_failed{name:s3/tile}`) · `copc-ranges.js → exit 0`
- `inspect -e SCENARIO=bogus` → `SCENARIO inconnu : bogus` exit 107
- `make -n run VUS=2 SCENARIO=redirect -C G/tools/load PROJECT_ID=x USERS=a:b` →
  `grafana/k6:0.54.0 run --quiet --summary-export /out/u$i.json --out csv=/out/u$i.csv.gz \`
  `-e BASE_URL=http://api:4000 -e PROJECT_ID=x -e USERS="a:b" \`
  `-e SCENARIO=redirect -e COPC_PATH="" \`
- `rg -n "demo1234|@demo\.geolens\.fr" G/tools/load` → ∅ (exit 1) · `grep -n ^-include Makefile` → `10:-include $(HOME)/.env.k6` `11:-include .env.k6`
- report : python extrait verbatim de `make -s -n report OUT=/tmp/t005` (/out → /tmp/t005), u1.csv.gz tuile 10,20,30,40 (+ waiting 999, project 5000 exclus) · u2.csv.gz tuile 50,60,70 + s3 100,200 →
  `p95 agrégé tuile        : 67.0 ms  (7 req, tous VUs)` · `p95 agrégé s3/tile      : 195.0 ms  (2 req, tous VUs)` ; main : 60+10×0.7=67.0 · 100+100×0.95=195.0 (interpolation = TrendSink.P k6)
- k6 0.54 local `--out csv=/s/k.csv.gz` → exit 0, en-tête `metric_name,timestamp,metric_value,…,name,…` (colonnes lues par report OK)
- k6 0.54 `new http.CookieJar()` → `jar ok function`
- `git -C G status --short -- tools/load` → `?? tools/load/` · /tmp/t005 supprimé
- NV : exécution réelle des 3 scénarios / COPC contre l'API — hors périmètre (0 k6 réel serveur)

## Écarts
- Makefile : `$(PWD)` → `$(CURDIR)` — `make -C` montait le mauvais chemin
- Makefile : `-include $(HOME)/.env.k6` ajouté avant `-include .env.k6` — D3, Makefile plus dans ~/
- report : `storage/tile-revisit` ajouté aux noms agrégés — sinon revisit sans p95 agrégé
- copc-ranges.js : en-tête lu dans `setup()` (1 fois/conteneur = 1/VU) ; THINK_MIN/MAX_MS repris de S ; Counter `copc_bytes` en plus (Mo/s)

## Pour la suite
- `.gitignore` G ne couvre pas `tools/load/.env.k6` (`.env` seul, L13-15) → ajouter avant tout commit
- redirect : `Location` présignée doit être joignable depuis le réseau docker `geolens-web_default` (hôte public vs `minio:9000`) — à constater au 1er run
- revisit : ETag mémorisé seulement sur passe 1 (ITER 0, ≤ TILES_PER_MOVE tuiles) ; serveur sans `Etag` → déplacements suivants vides (tiles_per_move=0)
- k6 summary-export n'exporte les sous-métriques `{name:…}` que si seuil défini ; p95 agrégé fiable = CSV uniquement
- serveur : `make run SCRIPT=copc-ranges.js COPC_PATH=<rel>` ; CSV gz ~volumineux à 30 VUs (1 ligne/métrique/req)

## Retour sur le pack
- Manquait: `.gitignore` de G (pour `.env.k6`) ; emplacement de `.env.k6` une fois Makefile hors ~/ ; seuils voulus pour `s3/tile` (valeur) — repris 1000 ms / 1 % de storage/tile
- Inutile: ∅
