---
tache: T024
statut: bloque
---
## Livré
- api/package.json:27-28 — fastify ^5.12.5, nodemailer ^9.1.1 (via npm)
- api/package-lock.json — +50/-21, résolu par la commande npm
- api/src/config.ts:32-33 — AppConfig `trustProxy: number` + doc
- api/src/config.ts:140-144 — `hops()` 0..5, sinon 0
- api/src/config.ts:165 — `trustProxy: hops(env.TRUST_PROXY)`
- api/src/server.ts:165 — `trustProxy: config.trustProxy || false` → casse typecheck, KO runtime
- .env.production.example:10 — `TRUST_PROXY=1` + commentaire Caddy 1 saut
- api/test/rate-limit-proxy.test.ts:1-51 — NEUF, 4 cas ; cas 1 KO
## Vérifié comment
`npm --prefix api install fastify@^5.12.5 nodemailer@^9.1.1` → `15 vulnerabilities (4 moderate, 9 high, 2 critical)` (arbre complet, dev inclus)
`node -p …fastify…version` → `5.12.5` ; `…nodemailer…version` → `9.1.1`
`npm --prefix api audit --omit=dev` avant → `5 high` (fastify, find-my-way, nodemailer, +2) ; après → `4 high` : @fastify/busboy <=3.2.1 (3.2.0), fast-uri 3.0.0-3.1.7 (3.1.2), find-my-way <=9.6.0 (9.6.0), nodemailer <=10.0.8 (9.1.1). fastify sorti. 0 audit fix
`npm --prefix api run typecheck` → exit=2, `src/server.ts(165,70): error TS2769: No overload matches this call.` + ~90 erreurs en cascade (Http2SecureServer)
même typecheck, ligne :165 sans trustProxy (temporaire, restaurée) → exit=0 — montée seule OK
`npm --prefix api test` → `Test Files 1 failed | 71 passed (72)` · `Tests 1 failed | 620 passed (621)` ; KO = rate-limit-proxy cas 1 ; 617 existants verts
cause, node_modules/fastify/lib/request.js:51-54 :
```js
if (typeof tp === 'number') {
  // Hop-count-only trust cannot validate the immediate peer. Fail closed so
  // direct clients cannot spoof X-Forwarded-* values by supplying enough hops.
  return function () { return false }
}
```
node_modules/fastify/fastify.d.ts:152 → `trustProxy?: boolean | string | string[] | TrustProxyFunction` (number retiré)
sonde inject + HTTP réel, fastify 5.12.5 : `trustProxy:1` → ip=socket ; `trustProxy:true` → ip=XFF
`git diff --stat` (5 fichiers WL) → `5 files changed, 66 insertions(+), 21 deletions(-)` ; `git status --short api/test/rate-limit-proxy.test.ts` → `?? api/test/rate-limit-proxy.test.ts`
## Écarts
- lecture hors WL: `rg rateLimit|keyGenerator api/src` — exclure un keyGenerator custom
- lecture hors WL: node_modules/fastify/lib/request.js:43-55 — cause du KO cas 1
- lecture hors WL: node_modules/fastify/fastify.d.ts:152 — cause du KO typecheck
- DoD 4/6/7 non cochées — contrat `trustProxy: <number>` invalide en fastify ≥ 5.12.5
- api/test/zz-debug-t024.test.ts — fichier de debug temporaire, supprimé, ∉ diff
- `web/src/viewer/main.ts` M dans G — pas T024 (autre agent)
## Pour la suite
- fastify 5.12.5 : trustProxy nombre = fail-closed (jamais XFF) ; types : bool|string|string[]|fn
- options : IP/CIDR de Caddy (`TRUST_PROXY=172.18.0.0/16` p.ex., string|string[]) ou fn `(addr,i)=>i<n` (= hop-count, contourne volontairement le correctif fastify)
- état laissé : server.ts:165 casse le typecheck ; config.ts `hops()`, .env, test 4 cas à adapter au contrat retenu
- audit prod restant 4 high transitifs (busboy, fast-uri, find-my-way, nodemailer <=10.0.8) → 9.1.1 reste vulnérable
- nodemailer sain = 10.0.9+ (majeure, HP actuel) ; transitifs = `npm audit fix` (HP actuel)
## Retour sur le pack
- Manquait: notes de version fastify 5.12.x (trustProxy nombre retiré) ; adresse/réseau de Caddy en prod
- Inutile: ∅

BLQ — question : trustProxy doit-il faire confiance à une liste d'IP/CIDR de Caddy (`TRUST_PROXY` = chaîne, ex. `127.0.0.1,172.18.0.0/16`, recommandé fastify) ou à une fonction hop-count `(addr, i) => i < n` qui contourne le fail-closed de fastify ?
