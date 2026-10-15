---
tache: T012
statut: fait
---
## Livré
- `G/api/src/storage.ts:18` — import `isIP` de node:net
- `G/api/src/storage.ts:694-697` — host IP → `u.origin` ; `isIpHost` non exportée, 1 ligne
- `G/api/src/server.ts:2507-2508` — `sameOrigin` try/catch → false, 0 throw ; 3 lignes inchangées en nombre
- `G/api/test/presign-get.test.ts:141-153` — matrice {IPv4,IPv6,DNS}×{path,vhost}, loguée = réelle
- `G/api/test/s3-public-endpoint.test.ts:6,26-45` — boot : IP+vhost sameOrigin true ; WEB_ORIGIN non parsable OK
## Vérifié comment
- src restaurés à HEAD (copie scratchpad), `npx vitest run test/presign-get.test.ts test/s3-public-endpoint.test.ts` → `× ipv4+vhost · × ipv6+vhost · × public IP + vhost · × WEB_ORIGIN non parsable` · `Tests  4 failed | 29 passed (33)` (= repro T009 :87 :90 :145 :149) ; fix ensuite restauré
- même commande avec le fix → `Test Files  2 passed (2)` · `Tests  33 passed (33)`
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · exit=0
- `npm --prefix api test` → `Test Files  99 passed (99)` · `Tests  881 passed (881)` (base 873 + 8)
- `git -C G diff --stat -- api/src` →
```
 api/src/server.ts  | 4 ++--
 api/src/storage.ts | 5 ++++-
 2 files changed, 6 insertions(+), 3 deletions(-)
```
- `git -C G status --short -- api/` → `M api/src/server.ts · M api/src/storage.ts · M api/test/presign-get.test.ts · M api/test/s3-public-endpoint.test.ts`
## Écarts
- ∅ (lecture repro :1-40 en plus — même fichier WL, pour BASE/ENVS)
- vitest réel = 2.1.9 (pack : 2.1.8)
## Pour la suite
- G : 6 lignes ajoutées, 3 retirées en src ; server.ts n'a pas grossi (3→3 lignes) ; 0 commit
- `localhost`+vhost : le SDK garde le vhost (`geolens-tuiles.localhost`) → `isIpHost` exclut localhost à raison ; non testé dans G
- le `catch { return false; }` de server.ts:2507 suit le contrat du pack ; la règle G 01-style interdit le catch silencieux : ici il renvoie une valeur, à confirmer en revue
## Retour sur le pack
- Manquait: BASE env de boot S3 (repro :12-15) non recopié dans le pack, lu dans le fichier L
- Inutile: ∅
