---
tache: T037
statut: fait
---
## Livré
- api/src/bodyField.ts:L1-L2 — NEUF, bodyStr : non-string → ''
- api/src/server.ts:L14 — import bodyStr
- api/src/server.ts:L294-L2770 — 18 sites req.body → bodyStr (dont orgId :1387 :1550)
- api/src/config.ts:L6 — import BlockList
- api/src/config.ts:L136-L150 — posInt(max) + V4_MAPPED + coversV4Mapped
- api/src/config.ts:L152-L166 — proxyList v6 : v4-mappé exige ≥ /104
- api/src/config.ts:L183-L184 — TTL ≤ 604800, fenêtre ≤ 86400
- api/src/logRedact.ts:L9-L23 — redactUrl par clé décodée, segment par segment
- api/test/hardening-t037.test.ts:L1-L122 — NEUF, 11 cas non-régression
## Vérifié comment
HEAD (src intact, cas bodyStr retiré temporairement — module absent) : `npx --prefix api vitest run --root api test/hardening-t037.test.ts` → `Tests  9 failed | 1 passed (10)` ; KO : proxy loadConfig `expected [ '::/16' ] to be false`, proxy 429 `expected false to be true`, login `expected [ 400, 401 ] to include 500`, reset/accept-invite `expected 500 to be 400`, invitations/users `expected 500 to be less than 500`, redact `expected '/p/storage/tileset.json?%74oken=a' to be …[redacted]`, TTL `expected 1000000000 to be 28800` ; OK sur HEAD : cas mytoken / `%E0` (garde)
après : même commande → `Tests  11 passed (11)`
`npm --prefix api run typecheck` → `typecheck exit 0`
`npm --prefix api test` → `Test Files  74 passed (74)` · `Tests  640 passed (640)` (629 + 11)
`rg -c "\?\? ''\)\.toString\(\)" api/src/server.ts` → `1` (:2136 req.query.search, HP)
`rg -n "orgId \?\? ''\)\.trim" api/src/server.ts` → `2292:    const reqOrgId = (fields.orgId ?? '').trim();`
`git -C G diff --stat` → `server.ts | 41 +++++…---- (21 insertions, 20 deletions)` ; `wc -l` → 3397 (HEAD 3396, ≠ 3387 annoncé)
## Écarts
- DoD 4 non cochée : rg -c → 1, pas 0 — :2136 req.query.search HP selon Contrats ; les 19 du pack = 18 body + 1 query
- DoD 4 non cochée : rg -n → :2292 `fields.orgId` multipart, hors contrat, inchangé
- DoD 7 non cochée : server.ts +1 net — ligne d'import bodyStr ; refus de 2 imports sur une ligne
- HEAD server.ts = 3396 lignes, pas 3387
- KO HEAD prouvé par retrait temporaire du cas bodyStr (import d'un module absent = échec du fichier entier) puis restauration
## Pour la suite
- :2292 `(fields.orgId ?? '').trim()` multipart : vérifier le type de fields → bodyStr si non garanti string
- :2136 `req.query.search` encore en `.toString()` : `?search[a]=1` → objet possible → 500 à tester
- redactUrl ne masque que la query ; jeton dans le chemin ou le fragment non couvert
- coversV4Mapped : les plages v6 ≥ /104 dans ::ffff:0:0/96 restent acceptées (= /8 v4), voulu
## Retour sur le pack
- Manquait : compte exact des sites (18 body + 1 query HP) ; :2292 fields.orgId capté par la regex DoD ; ligne d'import comptée dans « +0 net » ; wc HEAD réel 3396
- Inutile : ∅
