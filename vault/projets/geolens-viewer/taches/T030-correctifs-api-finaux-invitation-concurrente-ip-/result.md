---
tache: T030
statut: fait
---
## Livré
- api/src/server.ts:56 — import claimToken remplace consumeToken
- api/src/server.ts:465-466 — D6 reset : claimToken avant setPassword, 400 sinon
- api/src/server.ts:493-494 — D6 accept-invite : idem, consumeToken retiré
- api/src/server.ts:497-499 — D3 clientIp = req.ip || '?' (TRUST_PROXY)
- api/src/server.ts:1561-1566 — D1 INSERT pending try/catch → 409 EMAIL_UNAVAILABLE
- api/src/tokens.ts:60-65 — D6 claimToken UPDATE … used_at IS NULL, rowCount===1
- api/src/emailSchema.ts:8-9,11-15 — D2 non-string null ; INVISIBLE_RE contrôle/zéro-largeur
- api/src/passwordPolicy.ts:10-14 — D5 longueur [...pw].length
- api/src/config.ts:6,143,147-154 — D4 isIP node:net ; /8..32 v4, /16..128 v6
- api/test/final-fixes.test.ts:1-103 — NEUF, 7 tests D1-D6
## Vérifié comment
`npx --prefix api vitest run --root api test/final-fixes.test.ts` → `✓ test/final-fixes.test.ts (7 tests) 501ms` · `Tests 7 passed (7)`
même test, src (server/emailSchema/passwordPolicy/config) = HEAD, puis restaurés → 7/7 KO : D1 `[201, 500]` · D2 route `500` · D3 detail contient `6.6.6.6` · D6 `[200, 200]` · D2/D4/D5 unitaires KO
`npm --prefix api run typecheck` → `typecheck exit=0`
`npm --prefix api test` → `Test Files  73 passed (73)` · `Tests  629 passed (629)` (base 72/622 + 1/7)
`git -C G status --short` →
```
 M api/src/config.ts
 M api/src/emailSchema.ts
 M api/src/passwordPolicy.ts
 M api/src/server.ts
 M api/src/tokens.ts
?? api/test/final-fixes.test.ts
```
`git -C G diff --stat` → config.ts 13 +11/-2 · emailSchema.ts 9 · passwordPolicy.ts 6 · server.ts 21 · tokens.ts 6 · `5 files changed, 41 insertions(+), 14 deletions(-)`
## Écarts
- server.ts:56 hors plages pack — import consumeToken inutilisé sinon (noUnusedLocals)
- config.ts:6 hors plage :138-148 — import isIP requis par contrat
- lecture hors WL (1/3) : `grep rowCount api/src/db.ts` — type retour query (rowCount: number)
- lecture hors WL (2/3) : grep server.ts forgot-password :428-450, audit_log :1336-1350 ; seed.ts DEMO — corps uniforme + colonnes audit pour tests
- regex D2 du pack mal encodée (caractères littéraux) → rendue en échappements ` ​-‏ - ⁠﻿`
## Pour la suite
- claimToken(db, tokenId) dispo tokens.ts:60 ; consumeToken = 0 appelant src/test (`grep -rln` → tokens.ts seul), code mort à trancher
- TRUST_PROXY : préfixe < /8 (v4) ou < /16 (v6) → false global (fail-closed), documenter dans .env.example/README
- invitations : 409 sur course, mais getUserByEmail pré-check toujours présent (double garde)
- HP inchangés : nodemailer 10.x, audit fix transitifs (D8, D10)
## Retour sur le pack
- Manquait: ligne d'import server.ts:56 + import config.ts en tête hors plages autorisées ; colonnes audit_log (action, detail) ; route forgot-password (corps uniforme) ; regex D2 en échappements ASCII
- Inutile: ∅
