---
tache: T021
statut: fait
---
## Livré
- V/ui/safeHtml.ts:23-27 — + oneOf, égalité stricte via includes
- V/ui/safeHtml.test.ts:5,34-49 — + 4 cas oneOf (contrat)
- V/services/photoInspector/PhotoInspectorMode.ts:358 — S1 filename échappé
- V/services/photoInspector/PhotoInspectorMode.ts:769 — S2 `${f}` échappé, src inchangé
- V/ui/homeCinematic.ts:443-444 — S3 s.value, s.label échappés
- V/ui/homeCinematic.ts:454-455 — S4 c.title, c.subtitle échappés
- V/ui/poiPanel.ts:18,111,113,120 — S5 prio = oneOf(...), class + test
- V/ui/poiPanel.ts:122-123 — S6 data-poi-vis/del = escapeHTML(poi.id)
- V/core/POIManager.ts:10,446 — S7 restorePOIs priority via oneOf
- V/main.ts:4935-4936,4940-4941 — S8 d.type, label, metaParts échappés
- V/main.ts:7193 — S9 toast err.message échappé
- V/main.ts:8636,8638 — S10 data-type + class d.type échappés
- V/backend/install.ts:11,155-159 — S11 isSafeImageDataUrl(orgLogo) + commentaire aligné
## Vérifié comment
`npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` EXIT=0
`npm --prefix web run build:viewer-types` → `tsc --noEmit -p tsconfig.viewer.json` EXIT=0
`npx --prefix web vitest run --root web src/viewer/ui/safeHtml.test.ts` → `✓ safeHtml.test.ts (9 tests)` · `Tests 9 passed (9)`
`npm --prefix web test` → `Test Files 176 passed (176)` · `Tests 1691 passed (1691)` EXIT=0 (base 1683 + 4 oneOf + 4 hors T021, prob. T022)
`wc -l web/src/viewer/main.ts` → `9405` (0 ligne ajoutée)
`git -C G diff --stat -- web/src/viewer` →
```
 backend/HttpBackend.ts                  |  2 ++
 backend/install.ts                      | 27 ++++++++++-----
 boot-web.ts                             |  3 ++
 core/POIManager.ts                      |  6 +++-
 core/ReportGenerator.ts                 |  3 +-
 index.html                              | 10 ++----
 loaders/TilesRendererLoader.ts          |  4 +--
 main.ts                                 | 39 +++++++++++-----------
 services/photoInspector/PhotoInspectorMode.ts |  7 ++--
 ui/homeCinematic.ts                     | 15 +++++----
 ui/poiPanel.ts                          | 12 ++++---
 11 files changed, 74 insertions(+), 54 deletions(-)
```
safeHtml.ts/.test.ts = untracked (`??`), absents du stat
## Écarts
- DoD 6 partielle : stat inclut HttpBackend, boot-web, ReportGenerator, index.html, TilesRendererLoader — modifs non commitées antérieures (déjà `M` au `git status` initial), ∅ écrit par T021 ; git ne sépare pas les tâches sans commit
- install.ts:154-156 commentaire mis à jour — disait « data:image/png », faux après S11
- lecture hors WL : ∅
## Pour la suite
- main.ts:4919-4925 `tooltipText` → `title="${tooltipText}"` non échappé ; contient sizeTxt (fmtFileSize, numérique a priori) — NV si sizeBytes manifeste non-number
- main.ts:4935 `data-unloadable-reason="${reason}"` = constantes, OK
- commits intermédiaires par tâche requis pour que `git diff --stat` prouve le périmètre (D5)
- oneOf dispo dans ui/safeHtml.ts pour tout enum venant du manifeste/POI
## Retour sur le pack
- Manquait: baseline git ≠ état pré-T021 (modifs T008/T022 non commitées) → DoD diff --stat invérifiable telle quelle ; poiPanel escapeHTML vient de '../main' (import existant :27), à dire
- Inutile: homeData.ts (L) — non ouvert, inutile
