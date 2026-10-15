---
tache: T066
statut: fait
---
## Livré
- G/web/viewer.html:12-13 — commentaire D21 + meta CSP contrat
- G/web/src/viewer/index.html:12-13 — miroir identique octet pour octet
- G/web/src/viewer/backend/HttpBackend.ts:114,126,220,241 — fetch(sign(…)) en credentials 'same-origin'
- G/web/src/viewer/backend/HttpBackend.ts:298-663 — API JSON inchangées ('include')
- G/web/src/viewer/packs/shared/pvPanels.ts:208 — INCHANGÉ : url = pvgisProxyUrl (proxy API), res.json(), 0 sign(
- G/Caddyfile:5-16 — encode zstd gzip limité aux types texte
- G/Caddyfile:30 — Report-Only portail img-src + origine S3 provisoire
- G/.env.production.example:10-12 — RATE_LIMIT_TILE_MAX reformulée + 2 flags contrat
- G/web/src/viewer/__tests__/csp-s3.test.ts — NEUF, 6 cas (origine S3, 0 `*.`, metas =, 0 include sur sign)
- G/web/src/viewer/__tests__/csp.test.ts:10 — constante CSP alignée nouvelle meta (seule modif)
## Vérifié comment
- `node scripts/check-viewer-html-sync.mjs` → `[check-viewer-html-sync] OK — 263 IDs JS vérifiés, les 2 entrées HTML sont synchronisées.` exit=0
- `npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` exit=0
- `npx vitest run csp-s3 csp` → `✓ csp-s3.test.ts (6 tests)` `✓ csp.test.ts (9 tests)` `Tests 15 passed (15)`
- regex test sur HttpBackend → 4 matchs / 4 `fetch(sign(` — test non vide
- `npm --prefix web test` → `Test Files 177 passed (177)` `Tests 1697 passed (1697)` exit=0
- `npm --prefix web run build` → `✓ built in 15.09s` exit=0 (warning chunk size préexistant)
- `docker run … caddy:2-alpine caddy validate …` → `Valid configuration` exit=0
- `git -C G diff --stat` →
```
 .env.production.example               |  4 +++-
 Caddyfile                             | 15 +++++++++++++--
 api/src/server.ts                     | 36 +++++++++++++++++++++++++++++------   (autre agent, L4)
 api/src/storage.ts                    |  1 +                                    (autre agent, L4)
 web/src/viewer/__tests__/csp.test.ts  |  2 +-
 web/src/viewer/backend/HttpBackend.ts |  8 ++++----
 web/src/viewer/index.html             |  3 ++-
 web/viewer.html                       |  3 ++-
?? web/src/viewer/__tests__/csp-s3.test.ts
```
## Écarts
- meta désormais :13 (commentaire en :12) — DoD « :12 » + « au-dessus » incompatibles
- csp.test.ts:10 modifié — constante CSP cassait par construction
- lecture hors WL: ∅
## Pour la suite
- CSP viewer : origine provisoire `https://bucket-a-remplacer.s3.fr-par.scw.cloud` dans web/viewer.html:13, index.html:13, csp.test.ts:10, Caddyfile:30 → 4 sites à remplacer par S3_BUCKET réel
- .env.production.example:32 S3_BUCKET=geolens-tuiles existe déjà → candidat nom réel (à confirmer humain)
- HttpBackend : fetch(sign(…)) = 'same-origin' (4) ; csp-s3.test.ts garde la règle
- Caddy encode : tuiles binaires (octet-stream) plus compressées ; valide caddy 2-alpine
- Flag TILE_PRESIGN_REDIRECT=0 ; CORS bucket (ACAO exact, sans ACAC) reste humain
## Retour sur le pack
- Manquait: DoD « meta :12 » vs commentaire au-dessus → préciser ligne cible post-insertion
- Inutile: lecture check-viewer-html-sync.mjs (ne contrôle que les IDs, pas la CSP)
