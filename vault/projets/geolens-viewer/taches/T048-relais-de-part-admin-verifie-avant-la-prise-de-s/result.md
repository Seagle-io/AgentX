---
tache: T048
statut: fait
---
## Livré
- `G/api/src/server.ts:2711` — `onRequest: [requireAdmin, relayGate.onRequest]`, preHandler retiré
- `G/api/test/relay-auth-t048.test.ts:1-115` — NEUF, 4 tests HTTP réels, gate espionné
- test: `vi.mock('../src/relayGate.js')` capture gate réel → `inflight()` + compteur `onRequest`
- test: anonyme ×3 → 401 ; membre ×3 → 403 ; sv révoqué ×3 → 401 ; `onRequest` 0 appel, `inflight()=0`, sonde admin 200
- test: admin max=1 → [429 pendant vol, 200] ; `inflight()` 1 → 0
## Vérifié comment
```
npx --prefix api vitest run --root api test/relay-auth-t048.test.ts test/sidecar-upload-t047.test.ts
 ✓ test/relay-auth-t048.test.ts (4 tests) 508ms
 ✓ test/sidecar-upload-t047.test.ts (14 tests) 636ms
      Tests  18 passed (18)
# KO sur HEAD (ligne 2711 remise à l'identique HEAD, puis restaurée)
   × ... anonyme ×3 ... AssertionError: expected undefined to deeply equal [ 401, 401, 401 ]   (timeout 2 s : parseur attend 2 Mo, slot tenu)
   × ... membre ... expected [ 429, 429, 429 ] to deeply equal [ 403, 403, 403 ]
   × ... admin ... ; × ... sv ... expected [ 429, 429, 429 ] to deeply equal [ 401, 401, 401 ]
      Tests  4 failed (4)
git -C G diff --stat -- api/src/server.ts → api/src/server.ts | 2 +-  (1 insertion(+), 1 deletion(-))
npm --prefix api run typecheck → exit 0
npm --prefix api test → Test Files  79 passed (79) · Tests  708 passed (708)
```
- chaîne onRequest Fastify 5.12.5 s'arrête après `reply.sent` → prouvé (`onRequest` gate 0 appel) ; relayGate.ts non touché
## Écarts
- lecture hors WL: `rg 'DEMO\.\w+|session_version' api/test` — noms `DEMO.memberEmail/Password` + requête bump sv
## Pour la suite
- `G/api/src/relayGate.ts:6` commentaire périmé : « avant l'auth (un anonyme tient un slot ~1 RTT) » → faux depuis T048
- `G/api/src/server.ts:2704` commentaire relais ne mentionne pas l'auth en onRequest
- motif réutilisable : `vi.mock` + `vi.hoisted` pour capturer un objet créé dans `buildServer`
- arbre G : `M api/src/server.ts`, `?? api/test/relay-auth-t048.test.ts` — non commité (D5/D9)
## Retour sur le pack
- Manquait: champs `DEMO.memberEmail/memberPassword` ; requête révocation `UPDATE users SET session_version = session_version + 1 WHERE email = $1` ; relayGate non exposé par buildServer (inflight() inaccessible sans mock)
- Inutile: ∅
