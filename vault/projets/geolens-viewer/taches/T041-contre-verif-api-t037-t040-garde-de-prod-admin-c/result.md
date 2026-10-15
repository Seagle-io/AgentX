---
tache: T041
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 KO — example → R1+R3 ; sain → [] ; `Production`/` production`/`PRODUCTION` → [] (contourné)
- A2 OK — `'a'×32` → [] (constat) ; `'   '` → défaut → R1 refus
- A3 KO — même email concurrent : 1 ok, 1 erreur pg brute, 2 orgs « Org Conc »
- A4 OK — env minimal → message 7 règles, exit=1, 4000 jamais ouvert
- A5 KO — 6 `req.body?.x ?? ''` résiduels :2822-2834 → 500 + verrou bloqué
- A6 OK — token×2, `t%6Fken`, casse masqués ; `;`/`%3D` non parsés en token par Fastify 5.12.5
- A7 OK — `::ffff:0:0/104`, `::ffff:127.0.0.0/104`, `64:ff9b::/96`, `2002::/16` acceptés (constat)
- A8 OK — `86400.9`→86400/14400 ; `0x3c`→60 ; `' 3600 '`→3600 ; jamais NaN
- A9 OK — 75 fichiers 667 tests verts ; typecheck exit 0
## Défauts
- D1 (M) · api/src/server.ts:2822-2834 — `name`/`description`/`interventionDate`/`equipment`/`geoidModel` sans bodyStr, `crs` `.toString()` ; `.trim()` sur non-string lève après `entry.publishing = true` (:2811, jamais relâché) → 500 puis 409 `already_publishing` sur l'uploadId — repro : analyze MINI_TILESET puis from-upload `{uploadId, ondulation:49, name:{a:1}}` → 500 ; même uploadId `name:'ok'` → 409 ; `equipment:123` → 500 ; `crs:{toString:1}` → 500 — correctif : bodyStr sur les 6 champs, avant la pose du verrou
- D2 (M) · api/src/config.ts:262 — garde stricte `!== 'production'` : `GEOLENS_ENV=Production|PRODUCTION|' production'|'production '` + JWT défaut + USE_MEM_DB=1 → [] → démarrage avec le secret dev — repro : `productionProblems({...SAIN, GEOLENS_ENV:'Production', JWT_SECRET:undefined, USE_MEM_DB:'1'}, loadConfig(…))` → [] — correctif : `env.GEOLENS_ENV?.trim().toLowerCase() === 'production'`
- D3 (B) · api/src/scripts/create-platform-admin.ts:28-41 — check-then-insert sans transaction ni unicité de `organizations.name` : 2 appels concurrents même email + org neuve → 1 ok, 1 rejet `duplicate key … users_pkey` (≠ « email déjà utilisé »), 2 orgs « Org Conc » dont 1 orpheline ; 2 emails ≠, même org neuve → 2 orgs homonymes — repro : `Promise.allSettled([cPA(db,'conc@x.fr','Org Conc'), cPA(db,'conc@x.fr','Org Conc')])` → orgsNamed=2 — correctif : transaction + `INSERT … ON CONFLICT`, ou contrainte unique sur le nom
## Vérifié comment
- `npx --prefix api vitest run --root api test/zz-verif-t041.test.ts` → `Test Files 1 passed (1) · Tests 7 passed (7)` ; logs T041 :
- `A1 example => ["JWT_SECRET absent…","stockage non S3…"]` · `A1 sain => []` · `GEOLENS_ENV="Production"|" production"|"PRODUCTION"|"production " + JWT défaut + USE_MEM_DB=1 => []`
- `A2 aaaa32 => []` · `A2 blanc => ["JWT_SECRET absent…"]` · `A2 31 => ["JWT_SECRET absent…"]`
- `A3 conc status => ["ok","KO ERROR: … duplicate key value violates unique constraint \"users_pkey\" … (email)=(conc@x.fr)"]` · `A3 conc users/orgs Δ => {"usersEmail":1,"orgsNamed":2,"dU":1,"dO":2}` · `A3 conc 2 emails même org neuve => {"st":["fulfilled","fulfilled"],"orgsNamed":2}`
- `A3 trim reuse => {"bCreated":false,"same":true}` · `A3 login+platform => {"login":true,"platformUsers":200}` · `A3 membre existant => {"err":"email déjà utilisé", before=after is_platform_admin:false role:member, "orgAutre":0}`
- `A5 search search[a]=1 => 200` · `search=a&search=b => 200` · `search=%00 => 200` ; fields.orgId :2292 = `Record<string,string>` via `String(value)` (:2245) → OK
- `A5 analyze => 200` · `from-upload {"name":{"a":1}} => [500,"server_error"]` · `{"name":"ok"} => [409,"already_publishing"]` · `{"equipment":123} => 500` · `{"crs":{"toString":1}} => 500`
- `rg -n "req\.body\?\.[a-zA-Z]+ \?\? ''" api/src/server.ts` → 2822, 2825, 2826, 2827, 2828, 2834
- `A6 /t?token=a&token=b => "/t?token=[redacted]&token=[redacted]"` · `/t?t%6Fken=a => masqué` · `/t?token => inchangé` · `/t;token=abc => inchangé` · `/t?%74oken%3Da => inchangé` ; Fastify nu : `/e;token=abc => 404`, `/e?x=1;token=abc => q {"x":"1;token=abc"}`, `/e?%74oken%3Da => q {"token=a":""}`
- `A7 ::ffff:0:0/104|::ffff:127.0.0.0/104|64:ff9b::/96|2002::/16|::/96|fe80::1%eth0|fe80::%eth0/64|1.2.3.4/08 => [entrée]` · `::ffff:0:0/103 => false` · `0:0:0:0:0:ffff:0:0/96 => false` · `10.0.0.0/8,0.0.0.0/0 => false` · buildServer `fe80::1%eth0 => ok`
- `A8 "86400.9" => [86400,14400]` · `"0x3c" => [60,60]` · `" 3600 " => [3600,3600]` · `"0b111100" => [60,60]` · `"Infinity"|"-60"|"59.9"|"" => [28800,14400]`
- `env -i PATH HOME GEOLENS_ENV=production npx --prefix api tsx api/src/index.ts` → `démarrage refusé` 7 lignes, `exit=1` ; `ss -ltn | grep :4000` → `4000 jamais ouvert`
- `create-platform-admin.ts` env minimal prod → `démarrage refusé`, exit=1 ; sans GEOLENS_ENV → `relation "users" does not exist`, exit=1
- `npm --prefix api test -- --exclude "test/zz-verif-*"` → `Test Files 75 passed (75) · Tests 667 passed (667)`, exit=0
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json`, exit=0
- `rm api/test/zz-verif-t041.test.ts ; git -C G status --short` → ∅
## Écarts
- lecture hors WL : `rg` dans api/src/seed.ts — clés DEMO (adminEmail/memberEmail, platform)
- lecture hors WL : api/node_modules/fastify/package.json (version 5.12.5) + script Fastify nu dans le scratchpad — sémantique de `;` (A6)
- lancement non prévu : `GEOLENS_ENV=Production PORT=4000 HOST=127.0.0.1 timeout 3 tsx index.ts` ≤ 3 s, sortie perdue (fish) ; non relancé
## Pour la suite
- D1 : bodyStr sur server.ts:2822-2834 avant :2811 ; test from-upload `name:{}` → 400 puis même uploadId → ≠ 409
- D2 : normaliser GEOLENS_ENV (trim+lower) ou refuser toute valeur ≠ ''/'production' ; tests `Production`, `' production'`
- D3 : transaction createPlatformAdmin + rejet uniforme « email déjà utilisé » ; test Promise.allSettled → 1 org
- R2 n'attrape pas le DATABASE_URL d'exemple `USER:PASSWORD@HOTE` ; R3 n'attrape pas `S3_BUCKET=__…__` (échec au 1er accès, pas au boot)
- R1 sans contrôle d'entropie : `'a'×32` accepté
## Retour sur le pack
- Manquait : clés DEMO (seed.ts) ; recette d'un uploadId via analyze (MINI_TILESET + multipartBody) ; version Fastify
- Inutile : ∅
