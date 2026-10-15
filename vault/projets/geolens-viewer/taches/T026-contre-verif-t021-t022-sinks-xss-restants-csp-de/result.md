---
tache: T026
statut: fait
verdict: DÉFAUTS
---
## Livré
- S1 PIM:358 · S2 PIM:769 (texte) — OK, escapeHtml(filename)
- S3 homeCinematic:443-444 · S4 :454-455 — OK, escapeHtml ; ICONS[kind] → "undefined", pas injection
- S5 poiPanel:111-120 · S7 POIManager:446 — OK, oneOf strict ; S6 poiPanel:122-123 — OK, `"` échappé
- S8 main.ts:4935-4941 — OK ; tooltip sizeTxt = fmtFileSize → `—`/nombre seul (main.ts:422-428)
- S9 main.ts:7193 · S11 install.ts:155-159 — OK
- S10 main.ts:8636-8638 — KO, même d.type brut en main.ts:8641 (D1)
- C1 dev script-src + 'unsafe-inline' · C2 dist strict · C3 9/9 · C4 sync — OK
- 22 contre-exemples jetables /tmp/tmp.kCw0kzeDTm — 22/22 OK
## Défauts
- D1 · main.ts:8641 `<div class="scene-item-meta">${metaBits.join(' · ')}</div>` non échappé · source : :8624 `label = DELIVERABLE_LABELS[d.type] || d.type` → :8627 `metaBits=[label]` (+ :8630 `${d.resolution.width}×${d.resolution.height}` brut) → :8687 `listEl.innerHTML` · repro : project.json deliverable `{filename:"a.pdf", type:"<img src=x onerror=alert(1)>"}` → filterClientFacingDeliverables :461 `return true` → gDocs → renderItem · attendu `&lt;img…` / obtenu `<img src=x onerror=alert(1)>` dans le DOM · exploitable : injection HTML oui ; JS prod non (CSP script-src sans unsafe-inline) ; JS dev oui (T022 ajoute unsafe-inline). Même champ échappé :8636 (title) et :4939 (dashboard) → correctif S10 incomplet
## Vérifié comment
- `sed -n 8624,8641p main.ts` → `const label = DELIVERABLE_LABELS[d.type] || d.type;` … `${metaBits.join(' · ')}`
- `git diff 745d46f ad370d1 -- web/src/viewer/main.ts` → hunk @@8632 touche data-type/icon class, pas :8641
- `npm --prefix web test` → `Test Files 176 passed (176)` `Tests 1691 passed (1691)`
- `npm --prefix web run typecheck` → rc=0 · `build:viewer-types` → rc=0
- `npm --prefix web run build` → `✓ built in 14.38s` (warning chunk > 500 kB)
- C1 `node -e` createServer middlewareMode hmr 24699 + transformIndexHtml → `/viewer.html  script-src 'self' 'wasm-unsafe-eval' blob: 'unsafe-inline' | inline <script> count 1` ; `/index.html ∅ meta`
- C2 `grep -o 'script-src[^;]*' web/dist/viewer.html` → `script-src 'self' 'wasm-unsafe-eval' blob:` ; seul unsafe-inline = style-src
- C3 `npx --prefix web vitest run --root web src/viewer/__tests__/csp.test.ts` → `Tests 9 passed (9)` ; lit viewer.html + src/viewer/index.html réels (:14-15)
- C4 `node scripts/check-viewer-html-sync.mjs` → `OK — 263 IDs JS vérifiés` rc=0
- jetable `npx --prefix <G>/web vitest run --root /tmp/tmp.kCw0kzeDTm` → `Tests 22 passed (22)` :
  - oneOf `'info '`/`'critical '`/`['critical']`/`Object('critical')`/`'CRITICAL'`/NaN/null → `'info'` (string)
  - escapeHtml(`<img src=x onerror=1>"'`) → `&lt;img src=x onerror=1&gt;&quot;&#39;` ; isSafeImageDataUrl svg/js/`\n`/`DATA:`/`"` → false
  - relaxCspForDev `<META HTTP-EQUIV… CONTENT=…>` → relaxé ; `SCRIPT-SRC` → inchangé ; 2 metas → 1re seule ; script-src absent → inchangé ; content avant http-equiv → inchangé ; idempotent ×3 ; '' → ''
## Écarts
- lecture hors WL: main.ts:414-476, :4890-4914, :8590-8690 — remonter d.type/sizeTxt jusqu'au sink
- lecture hors WL: poiPanel.ts:85-104 — source categoryIcon/Label/thumb (lookup, pas brut)
- `git diff 745d46f ad370d1` — isoler le correctif S10
- `cp` + `rm` immédiat de `web/.c1tmp.mjs` dans G (erreur) ; `git status` web/ → 0 trace
## Pour la suite
- corriger main.ts:8641 `${escapeHTML(metaBits.join(' · '))}` ; test : type hors DELIVERABLE_LABELS
- grep résiduel : `rg -n '\$\{[a-zA-Z.]+\.join\(' web/src/viewer` + main.ts:4861 `${s.unit}` non échappé (source NV)
- relaxCspForDev fail-closed (SCRIPT-SRC maj., 2e meta, script-src absent → dev cassé, prod intacte)
- S2 PIM:768 `src="${_pu(...)}"` non échappé ; encodeURIComponent OK, __glrPhotoUrl NV
- poiPanel en-tête de groupe (grouped par poi.category :85) rendu NV
## Retour sur le pack
- Manquait: plages main.ts amont des sinks (label/metaBits :8624-8641, escapeHTML :466) ; hash base 745d46f/ad370d1
- Inutile: ∅
