---
tache: T009
statut: fait
---
## Livré
- web/src/viewer/backend/install.ts:51-63 — fail : message/detail via createElement+textContent
- web/src/viewer/backend/install.ts:75 — apiBase encode projectId (encodeURIComponent)
- web/src/viewer/backend/HttpBackend.ts:65-66 — token seulement si origine = origine apiBase
- web/src/viewer/backend/__tests__/makeSignUrl.test.ts:1-45 — NEUF, 6 cas pack
- web/src/viewer/backend/__tests__/installFail.test.ts:1-31 — NEUF, garde statique 2 cas
## Vérifié comment
```
npx --prefix web vitest run --root web <2 tests neufs>
 ✓ src/viewer/backend/__tests__/installFail.test.ts (2 tests) 3ms
 ✓ src/viewer/backend/__tests__/makeSignUrl.test.ts (6 tests) 5ms
 Test Files  2 passed (2)
      Tests  8 passed (8)

npm --prefix web run typecheck → tsc --noEmit -p tsconfig.json ; typecheck exit=0

npm --prefix web test
 Test Files  175 passed (175)
      Tests  1678 passed (1678)

git diff --stat -- web/src/viewer/backend/
 web/src/viewer/backend/HttpBackend.ts |  2 ++
 web/src/viewer/backend/install.ts     | 20 ++++++++++++++------
 2 files changed, 16 insertions(+), 6 deletions(-)
?? web/src/viewer/backend/__tests__/installFail.test.ts
?? web/src/viewer/backend/__tests__/makeSignUrl.test.ts
```
- `git diff --stat` global : 22 fichiers M (Caddyfile, api/*, e2e/*, worker/*, boot-web.ts, viewer.html, index.html, TilesRendererLoader.ts) — ∉ T009, agents parallèles
## Écarts
- ∅ lecture hors WL
- DoD 8 : diff global ≠ 0 hors WL — fichiers d'autres agents, T009 = 4 fichiers WL
- install.ts : lien « Retour au portail » via insertAdjacentHTML (constante) — garde ordre titre/msg/detail/lien
## Pour la suite
- makeSignUrl : `u.origin !== new URL(ctx.apiBase).origin` → token jamais hors origine API (HttpBackend.ts:66)
- install.ts fail() : 0 innerHTML de donnée ; garde statique installFail.test.ts casse si `${message}`/`${detail}` réapparaît
- Baseline tests web : 1678 (175 fichiers) après T009 + travaux parallèles
- Garde DoD « diff --stat 0 hors WL » inapplicable en arbre partagé : préférer `git diff --stat -- <WL>`
## Retour sur le pack
- Manquait: ∅ (chemin de test vitest ciblé : `npx --prefix web vitest run --root web <chemin>` utile)
- Inutile: copcHttpBackend.test.ts (L) — seul l'en-tête lu
