---
tache: T033
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 OK — 2x [201,409] · 5x [201,409×4] · inv+users [201,409] ; catch exercé
- A2 OK — normalizeEmail 42/{}/[]/{toString:1}/null → 400 inv+users, 200 forgot
- A3 OK — audit ip : pair public+XFF 6.6.6.6 → 198.51.100.9 ; Caddy → 203.0.113.5
- A4 KO — 3 plages citées false+429 ; `::/16`, `::ffff:0:0/96` acceptés → contournement (D1)
- A5 OK — distinct 0×429 · même XFF 429 au 11ᵉ · pair public 429
- A6 OK — reset 5x [200,400×4] · accept 3x [200,400,400] · 1 audit · mdp gagnant
- A7 OK — `\u0000`, ZWSP, ` `, 260 car → 400 ; 0×500
- A8 OK — consumeToken : 1 définition tokens.ts:57, 0 appelant (code mort)
- A9 OK — 73 fichiers 629 tests verts ; typecheck exit 0
## Défauts
- D1 · api/src/config.ts:L153 — v6 /16 couvre l'espace v4-mappé : pair IPv4 public de confiance → XFF honoré → rate-limit contourné — repro : TRUST_PROXY=`::/16` (ou `::ffff:0:0/96`), RATE_LIMIT=1, 11 login remoteAddress 198.51.100.9, XFF 203.0.113.{1..11} → 11×401, 0×429 — correctif : refuser CIDR v6 couvrant ::ffff:0:0/96 si préfixe < 104
- D2 · api/src/server.ts:L1549,L1386 — `orgId` non-string → `.trim` TypeError → 500 — repro : POST /api/admin/invitations (et /api/admin/users) `{email:'o1@x.fr', orgId:123}` → 500 server_error — correctif : `typeof req.body?.orgId === 'string' ? … : ''`
- D3 · api/src/server.ts:L293,L459,L484 (+L369,L403,L1370,L1704,L1792) — `{toString:1}` → `.toString()` TypeError → 500, préexistant 745d46f — repro : POST /api/auth/login `{email:{toString:1},password:'x'}` → 500 ; idem reset-password token, accept-invite password — correctif : `typeof v === 'string' ? v : ''` partout
## Vérifié comment
- `npx --prefix api vitest run --root api test/zz-verif-t033.test.ts` → `Tests 6 passed (6)` ; logs :
- `A1 2x [201,409] 5x [201,409,409,409,409] case [201,409] inv+usr [201,409]`
- `A1b [201,409] erreurs db ["INSERT INTO users … ERROR: insert into \"users\" …"]` → branche catch 23505 atteinte
- `A2 {"inv.num":400,"usr.num":400,"fgt.num":200,…,"inv.orgId=123":500,"usr.orgId=123":500,"reset.token={toString:1}":500,"accept.pw={toString:1}":500,"login.email={toString:1}":500}`
- `A3 198.51.100.9|6.6.6.6→200 198.51.100.9 ;; 10.0.0.2|203.0.113.5→200 203.0.113.5 ;; 10.0.0.2|6.6.6.6, 203.0.113.8→200 203.0.113.8 ;; 10.0.0.2|∅→200 10.0.0.2`
- `A4 tp "0.0.0.0/1,128.0.0.0/1" false · "::/1" false · "10.0.0.0/7" false · "::/16" ["::/16"] · "::ffff:0:0/96" ["::ffff:0:0/96"]` ; `A4 rl … true` ×3
- `A4 bypass? pair public ::/16 codes 401×11 429? false` · `::ffff:0:0/96 codes 401×11 429? false`
- `A5 distinct 401×11 · same 401×10,429 · public 401×10,429 · forged-prefix "9.9.9.i, 203.0.113.7" 401×10,429`
- `A6 reset [200,400,400,400,400] {"error":"invalid_token",…} accept [200,400,400] audit 1 login gagnant 200`
- `A7 a\u0000@b.fr 400 · a​@b.fr 400 · ​a@b.fr 400 · a @b.fr 400 · 'a'×250@b.fr 400 · é@b.fr 201 · a@b.fr  201 (trim)`
- 500 corps : `{"error":"server_error","message":"Erreur serveur."}` login / reset-password / invitations orgId
- `git show 745d46f:api/src/server.ts | rg -c "(req.body?.(email|token|password) ?? '').toString()"` → 11 (D3 préexistant)
- `rg -n consumeToken api/src api/test` → `api/src/tokens.ts:57:export async function consumeToken…`
- `npm --prefix api test -- --exclude 'test/zz-verif-*'` → `Test Files 73 passed (73) · Tests 629 passed (629)`
- `npm --prefix api run typecheck` → `typecheck exit=0`
- `rm api/test/zz-verif-t033.test.ts ; git -C G status --short` → ∅
## Écarts
- ∅
## Pour la suite
- config.ts:153 proxyList : v6 CIDR chevauchant ::ffff:0:0/96 → exiger p ≥ 104 ; test `::/16`, `::ffff:0:0/96` → false
- server.ts:1386,1549 orgId : typeof string sinon '' ; test orgId:123 → 400/ignoré
- server.ts `(x ?? '').toString()` ×11 → helper `str(v)` typeof string ; test `{toString:1}` login/reset/accept → 400
- HP : login L293 n'appelle pas normalizeEmail ; `\u0000` vers Postgres réel → erreur 22021 → 500 probable (pg-mem ne reproduit pas)
- HP : `0.0.0.0/08` accepté (préfixe à zéro de tête) — sans impact, /8 effectif
## Retour sur le pack
- Manquait: aucun test existant accept-invite concurrent ni A4 comportemental (429) — écrits ici ; règle « v6 /16 » sans mention espace v4-mappé
- Inutile: .env.production.example (1 ligne utile, uniquelocal)
