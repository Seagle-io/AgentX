---
tache: T073
statut: fait
---
## Livré
- G/Caddyfile:30-31 — commentaire + CSP portail appliquée (contrat verbatim)
- G/web/src/viewer/core/reportFonts.ts:1-27 — NEUF ; 5 woff2 `?inline`, `buildFontFaceCss` pur, `REPORT_FONT_FACE_CSS`
- G/web/src/viewer/core/ReportGenerator.ts:15,157 — import + `${REPORT_FONT_FACE_CSS}` remplace @import Google
- G/web/src/pages/MapView.tsx:72 — `onerror` inline retiré
- G/web/src/pages/MapView.tsx:146-152 — `<template>` + écouteur `error` + `setDOMContent`
- G/web/src/viewer/core/reportFonts.test.ts:1-46 — NEUF ; 5 tests (woff2 réels base64)
- G/web/src/__tests__/portal-csp.test.ts:1-37 — NEUF ; 6 tests sur le bloc @portail_doc
## Vérifié comment
- `docker run … caddy:2-alpine caddy validate …` → `Valid configuration`
- `npx vitest run reportFonts.test.ts portal-csp.test.ts` → `Test Files 2 passed (2) · Tests 11 passed (11)`
- `npm --prefix web run typecheck` → `typecheck exit=0`
- `npm --prefix web run build:viewer-types` → `viewer-types exit=0`
- `npm --prefix web test` → `test exit=0 · Test Files 179 passed (179) · Tests 1708 passed (1708)`
- `npm --prefix web run build` → `build exit=0 · ✓ built in 13.77s`
- `rg -n "googleapis|gstatic" web/src` → `viewer/index.html:11` (commentaire) + `reportFonts.test.ts:33,42,44` (assertions ∌)
- `rg -n "googleapis" web/src/viewer/core/ReportGenerator.ts` → ∅ (rc=1)
- `rg -n "onerror=" web/src -g '!**/viewer/**'` → ∅ (rc=1)
- `git diff --stat` → `Caddyfile | 3 ++- · MapView.tsx | 10 ++++++++-- · ReportGenerator.ts | 3 ++- · 3 files changed, 12 insertions(+), 4 deletions(-)`
- `git status --short` → `?? web/src/__tests__/ · ?? reportFonts.test.ts · ?? reportFonts.ts`
- data URI dans le bundle → NV — ReportGenerator absent de dist/ (ancienne et nouvelle chaîne : 0 hit)
## Écarts
- lecture hors WL : node_modules/maplibre-gl/src/ui/popup.ts:354 — `getElement()` = `_container`, undefined avant addTo
- lecture hors WL : web/src/viewer/__tests__/csp.test.ts:1-30 — modèle de test readFileSync
- contrat C dévié : snippet `popup.getElement()?.…` = no-op à la création → `<template>` inerte, écouteur posé avant chargement image, `setDOMContent(tpl.content)` (0 wrapper ajouté)
- reportFonts : `buildFontFaceCss` exporté — repli pack ; vitest rend `?inline` = `/src/…woff2?inline`, pas un data URI
- écriture hors WL temporaire : web/src/__probe/p.test.ts créé puis supprimé — sonde `?inline` sous vitest
- DoD C : glob `-g '!viewer/**'` n'exclut pas web/src/viewer (4 hits tests préexistants) → `'!**/viewer/**'` utilisé
- DoD diff --stat : les 3 fichiers neufs, untracked, sont absents du stat → `git status` collé
- rg `@import` sur ReportExporter.ts, reportEngine.ts → 0 @import
## Pour la suite
- vitest ne transforme pas `?inline` en data URI → tester une fonction pure (cf. reportFonts.test.ts)
- ReportGenerator (viewer/main.ts:152) absent du bundle `npm run build` → data URI en build NV, à vérifier sur le build viewer/desktop
- CSP portail : font-src `'self'` et frame-src `'self'` (Report-Only avait `data:`/`blob:`) → surveiller la console en prod
- `bucket-a-remplacer` toujours dans Caddyfile:31 (D21)
- rg depuis G : exclure le viewer avec `-g '!**/viewer/**'`, pas `'!viewer/**'`
## Retour sur le pack
- Manquait : `getElement()` undefined avant addTo (snippet C faux) ; ReportGenerator hors bundle web ; web/src/__tests__ inexistant
- Inutile : glb-assets.d.ts (vite/client.d.ts:253 déclare déjà `*?inline`)
