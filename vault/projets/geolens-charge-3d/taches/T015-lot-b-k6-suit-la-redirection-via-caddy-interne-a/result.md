---
tache: T015
statut: fait
---
## Livré
- G/tools/load/viewer-navigation.js:41 — doc Variables, 1 ligne TILE_ORIGIN_*
- G/tools/load/viewer-navigation.js:63-65 — ORIGIN_PUBLIC/INTERNAL, throw si 1 seule
- G/tools/load/viewer-navigation.js:127-133 — `export function s3Request(loc)` → `{ url, headers }`
- G/tools/load/viewer-navigation.js:267-268 — 302 → s3Request, jar vide + tag s3/tile conservés
- G/tools/load/Makefile:5 — usage redirect, 1 ligne
- G/tools/load/Makefile:22-23 — `TILE_ORIGIN_PUBLIC ?=` / `TILE_ORIGIN_INTERNAL ?=`
- G/tools/load/Makefile:53 — `-e TILE_ORIGIN_*="$(…)"` au conteneur
## Vérifié comment
- scratchpad/t/t.js + stub.py (7 l, port 18765) ; `docker run --rm --network host -v G/tools/load:/s:ro -v …/t:/t:ro grafana/k6:0.54.0 run --quiet /t/t.js`
- RUN A sans vars → `{"url":"http://82.65.97.67:34580/geolens/p/x/tile.b3dm?X-Amz-Signature=abc&X-Amz-Date=1","headers":{}}` · `✓ absentes: url inchangee ✓ absentes: headers {} ✓ absentes: relative -> BASE` · `checks 100.00% 3 out of 3` exit 0
- RUN B `-e TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580/ -e TILE_ORIGIN_INTERNAL=http://127.0.0.1:18765` → `{"url":"http://127.0.0.1:18765/geolens/p/x/tile.b3dm?X-Amz-Signature=abc&X-Amz-Date=1","headers":{"Host":"82.65.97.67:34580"}}` · autre `{"url":"http://minio:9000/b/k?sig=1","headers":{}}` · `stub 200 Host: 82.65.97.67:34580` · `✓ public: url interne + chemin+query ✓ public: Host = hote:port public (env avec slash final) ✓ autre origine: inchangee ✓ autre origine: pas de Host ✓ port prefixe: inchangee ✓ stub: Host recu = 82.65.97.67:34580` · `checks 100.00% 6 out of 6` exit 0
- stub.log → `/geolens/p/x/tile.b3dm?X-Amz-Signature=abc&X-Amz-Date=1 82.65.97.67:34580`
- RUN C `-e TILE_ORIGIN_PUBLIC=http://x` seul → `Error: TILE_ORIGIN_PUBLIC et TILE_ORIGIN_INTERNAL : les 2 ou aucun at file:///s/viewer-navigation.js:65:48` exit 107
- `k6 inspect -e PROJECT_ID=x -e USERS=a:b /s/viewer-navigation.js` → exit 0 ; idem + `SCENARIO=redirect` + 2 vars → exit 0
- `git -C G status --short -- tools/load/` → ` M tools/load/Makefile` ` M tools/load/viewer-navigation.js` · diff → `2 files changed, 18 insertions(+), 1 deletion(-)`
- `make -n run PROJECT_ID=x USERS=a:b` → `TILE_ORIGIN_INTERNAL=""` `TILE_ORIGIN_PUBLIC=""` ; avec vars → `"http://caddy:80"` `"http://p:1"`
## Écarts
- préfixe testé = `ORIGIN_PUBLIC + '/'` — évite `:345800` matché par `:34580`
- `make -n` (dry-run) hors liste outils — vérif passage env ; `-include ~/.env.k6` évalué, seul TILE_ORIGIN affiché
- test Host : origine interne = stub 127.0.0.1:18765, pas caddy:80 — pas de caddy local
## Pour la suite
- serveur : `make run SCENARIO=redirect TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580 TILE_ORIGIN_INTERNAL=http://caddy:80` (ou dans ~/.env.k6)
- NV contre MinIO réel : SigV4 avec Host public via caddy:80 — 1er palier VUS=1 à surveiller (`s3_err`, `http_req_failed{name:s3/tile}`)
- Location relative → absolute(BASE) puis test préfixe, inchangé si BASE ≠ public
## Retour sur le pack
- Manquait: ∅ (make -n à autoriser pour DoD Makefile) | Inutile: ∅
