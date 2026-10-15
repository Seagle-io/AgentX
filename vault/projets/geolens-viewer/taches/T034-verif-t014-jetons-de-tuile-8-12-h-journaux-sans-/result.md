---
tache: T034
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 OK — 6 couples × 200k now : min>T, max≤T+W ; réel d=37785 s (10,5 h)
- A2 OK — valide 200 · exp=now-1 403 · horloge exp+1 403 (+If-None-Match 403) · horloge=exp 200
- A3 KO — '1e9' accepté → validité 31,7 ans ; T=W='1.7e308' → exp Infinity
- A4 KO — clé encodée `?%74oken=` → 200 ET jeton en clair dans pino
- A5 KO — `?Token=` `&token=` `#` `%2E` masqués ; `mytoken` intact ; `%74oken`/`tok%65n` non masqués
- A6 OK — 404/403/400/route inconnue : url `token=[redacted]` ; `%ZZ` 400 non journalisé ; 5xx NV
- A7 OK — seuls TILE_* : `.env.production.example:34-35` 28800/14400 ; compose/DEPLOYMENT ∅
- A8 risque B — cache privé, contenu déjà téléchargé ; aucun accès neuf accordé
## Défauts
- D1 · api/src/logRedact.ts:28 — regex sur URL brute, parseur décode la clé : `?%74oken=<jeton>` authentifie (200) et logue le jeton — `GET /api/projects/<pid>/storage/tileset.json?%74oken=<jeton>` → `"url":"…?%74oken=eyJw…DVI"` — masquer par clé décodée (URLSearchParams, `decodeURIComponent(k).toLowerCase()==='token'`) — sévérité B : client légitime n'encode jamais `token`
- D2 · api/src/config.ts:137-139 — posInt sans borne haute : `TILE_TOKEN_TTL_SEC=1e9` → exp-now=1000004800 s ; `TILE_TOKEN_TTL_SEC=TILE_URL_WINDOW_SEC=1.7e308` → exp Infinity → JSON `null` → storage.ts:62 rejette → 100 % tuiles 403 — `loadConfig({TILE_TOKEN_TTL_SEC:'1.7e308',TILE_URL_WINDOW_SEC:'1.7e308'})` puis `tileTokenExp(c,Date.now())` — borne haute (ex. ≤ 604800) sinon défaut — sévérité B (erreur d'exploitation)
## Vérifié comment
- `npx --prefix api vitest run --root api test/zz-verif-t034.test.ts > cap.txt 2>&1` → `Test Files 1 passed (1) · Tests 4 passed (4)`
- A1 → `T=28800 W=14400 {"min":28801,"max":43200}` · `T=3600 W=14400 {"min":3601,"max":18000}` · `T=14400 W=14400 {"min":14401,"max":28800}` · `T=86400 W=600 {"min":86401,"max":87000}` · réel `{"d":37785,"h":10.4958}`
- A3 → `"abc"|"30"|"-5"|""|"0"|"NaN"|"Infinity"|"1e400" → T 28800` · `"1e9" {"T":1000000000,"expMinusNow":1000004800}` · `T=1.7e308 W=1.7e308 {"exp":null,"finite":false}`
- A2 → `valide 200 · exp=now-1 403 · exp=now+1 200 · horloge exp+1 403 · INM 403 · horloge=exp 200`
- A4 → `rg -o '"msg":"[^"]*"' cap.txt | sort | uniq -c` → `17 incoming request · 17 request completed · 1 tile not found (404)`
- A4 → `rg -c -F "$MAC" cap.txt` → `2` (req-g `?%74oken=`, req-h `?tok%65n=`) ; `rg 'token=' cap.txt` hors T034 → 11 url toutes `token=[redacted]`
- A5 → `redactUrl('/x?%74oken=SEKRET')` → `/x?%74oken=SEKRET` ; route `?%74oken=<jeton>` → 200 ; `?Token=<jeton>` → 403
- A7 → `rg -n --hidden "TILE_" G --glob '!node_modules'` → `.env.example:15 TILE_TOKEN_TTL_SEC=3600` · `.env.production.example:34-35 28800/14400`
- `npx --prefix api vitest run --root api test/tile-window.test.ts test/log-redact.test.ts test/auth-and-tiles.test.ts` → `3 passed · 24 passed`
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` 0 sortie
- `rm api/test/zz-verif-t034.test.ts ; git -C G status --short` → ∅ ; `ls api/test | grep zz` → ∅
- A6 5xx (error handler server.ts:255 `app.log.error(err)`) NV — 500 non provoquable sans éditer src
## Écarts
- lecture hors WL: api/src/storage.ts:30-70 — sign/verifyTileToken là, pas auth.ts
- lecture hors WL: api/test/helpers.ts:8-28 — makeTestApp/login pour reproduire config test
- capture pino écrite dans scratchpad session (hors G) — preuve A4
## Pour la suite
- D1 : logRedact.ts redactUrl → parser query, comparer clé décodée insensible casse ; test `?%74oken=` + `?tok%65n=`
- D2 : config.ts posInt → borne max (TTL ≤ 604800, W ≤ 86400) ; test '1e9', '1.7e308'
- `.env.example:15` TTL=3600 → validité 1-5 h ≠ D6 8-12 h (dev seulement, non bloquant)
- tile-window.test.ts : ajouter `TILE_URL_WINDOW_SEC` hostile (∅ test aujourd'hui)
## Retour sur le pack
- Manquait: sign/verify dans `api/src/storage.ts:47-68` (pack dit auth.ts) ; `api/test/helpers.ts` (makeTestApp) ; rg sans `--hidden` rate `.env*`
- Inutile: api/src/auth.ts (0 code jeton tuile)
