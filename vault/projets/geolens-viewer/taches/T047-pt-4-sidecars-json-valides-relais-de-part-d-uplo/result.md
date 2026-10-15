---
tache: T047
statut: fait
---
## Livré
- api/src/sidecarJson.ts:1-14 — NEUF, sidecarJsonProblem : objet/tableau JSON sinon 400
- api/src/relayGate.ts:1-36 — NEUF, createRelayGate : WeakSet, 429 Retry-After 2, release idempotent
- api/src/config.ts:71-74 — AppConfig.upload.relayMaxInflight
- api/src/config.ts:145-149 — intIn(v, def, min, max)
- api/src/config.ts:228-229 — relayMaxInflight = intIn(env, 4, 1, 64)
- api/src/server.ts:14 — imports sidecarJson + relayGate (même ligne que bodyStr)
- api/src/server.ts:1084-1085 — PUT sidecar : sidecarJsonProblem, chaîne stockée telle quelle
- api/src/server.ts:2588 — relayGate créée 1× après RELAY_PART_BODY_LIMIT
- api/src/server.ts:2711 — route part : + onRequest/onResponse/onRequestAbort de la gate
- .env.production.example:37-39 — UPLOAD_RELAY_MAX_INFLIGHT=4 + commentaire mémoire (≈ 80 Mo/part)
- api/test/sidecar-upload-t047.test.ts:1-177 — NEUF, 14 tests (inject + HTTP réel)
## Vérifié comment
KO sur HEAD (avant tout src) : `npx --prefix api vitest run --root api test/sidecar-upload-t047.test.ts` → `Error: Failed to load url ../src/sidecarJson.js` · `Test Files 1 failed`
KO comportemental (modules + config créés, server.ts non câblé) : même commande → `Tests 8 failed | 6 passed (14)` · `AssertionError: expected 200 to be 400` (×5 PT-4) · `Error: condition jamais atteinte` (rafale) · `Error: Test timed out in 5000ms` (429 pré-parseur)
après câblage : même commande → `Tests 14 passed (14)` ; 5 relances → `Tests 14 passed (14)` ×5
`npm --prefix api run typecheck; echo $?` → `typecheck exit=0`
`npm --prefix api test` → `Test Files 78 passed (78)` · `Tests 704 passed (704)`
`git -C G diff --stat -- api/src/server.ts` → `1 file changed, 5 insertions(+), 6 deletions(-)`
preuve pré-parseur : requête HTTP réelle `Content-Length: 2 Mo`, 0 octet de corps envoyé → 429 + `retry-after: 2` reçu
preuve abort : 2 slots tenus par corps partiels → probe 429 ; `req.destroy()` → probe 200 puis rafale à nouveau `[200,200,429]` (compteur revenu à 0)
## Écarts
- lecture hors WL : api/src/seed.ts (grep `DEMO`) — identifiants de login du test
- lecture hors WL : api/node_modules/fastify/lib/{hooks,route,reply}.js — sémantique arrêt hook async
- lecture hors WL : api/package.json, api/src/bodyField.ts, api/src/health.ts — scripts, style modules voisins
- budget 3 lectures dépassé (5 sources) — aucune non bloquante écrite hors WL
- `onRequest` fait `await reply…send()` (Reply thenable) — sans await, `reply.sent` faux si onSend async → parsing poursuivi
## Pour la suite
- relayGate.onRequest attend la fin d'envoi du 429 (`await reply.send`) : à garder si on change le contrat en `return reply`
- onRequestAbort Fastify 5 = `req.on('close')` + `req.aborted` ; prouvé seulement via `app.listen` (inject ne simule pas)
- plafond global (pas par user) : un anonyme tient un slot ~1 RTT avant 401 — DoS de slots possible, rate-limit à regarder
- 429 côté client absorbé par directUpload.ts:62 (6 tentatives) ; pas de test e2e navigateur
## Retour sur le pack
- Manquait: identifiants DEMO (seed.ts) + ex. d'URL sidecar/projet accessible ; note « hooks async Fastify : reply.send ≠ sent » ; fastify 5.12.5
- Inutile: ∅
