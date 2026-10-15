---
tache: T017
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 — OK : 2 metas :16 = contrat, octet pour octet
- A2 — OK : build prod 0 inline, 0 `on*=` ; KO en dev (D1)
- A3 — OK : boot-web.ts:21 appel unique, idleLogout sans throw
- A4 — OK : :169 `/draco/`, :172 `'js'`, :177 `/basis/`, 5 fichiers = three 0.184.0
- A5 — OK : 0 unpkg src+dist ; 0 origine externe chargée
- A6 — OK : frame-ancestors présent ; viewer sans Report-Only (repro Caddy)
- A7 — OK nginx 1.31.6 ; NV image prod `nginx:1.27-alpine`
- A8 — OK : 176 fichiers / 1683 tests verts ; tsc exit 0
## Défauts
- D1 · web/viewer.html:16 (script-src sans 'unsafe-inline') · `vite` dev : @vitejs/plugin-react 4.7.0 injecte `<script type="module">import { injectIntoGlobalHook } from "/@react-refresh"…` inline → bloqué par meta → tout .tsx viewer lève `@vitejs/plugin-react can't detect preamble` (pack Risque, import dyn. packs/risque/index.ts:43) · attendu : dev viewer fonctionnel (OK avant, 'unsafe-inline') / obtenu : pack Risque KO en `npm run dev` · impact casse — dev seul ; build/preview/e2e (5173 preview) intacts
## Vérifié comment
- `sed -n 16p` des 2 html | `grep -oP 'content="\K[^"]+'` | `diff - <(echo "$CONTRAT")` → `web/viewer.html = contrat` · `web/src/viewer/index.html = contrat` · `dist=contrat`
- `npm --prefix web run build` → `✓ built in 14.86s` exit=0
- `grep -nE '<script|modulepreload|<link|\son[a-z]+\s*=' web/dist/viewer.html` → `19:<script type="module" crossorigin src="/assets/viewer-Ye-SpiNw.js">` · `20:<link rel="modulepreload" … href="/assets/idleLogout-CO9DNcFq.js">` · `21:<link rel="stylesheet" … idleLogout-BQMNCE_3.css` (= @font-face Poppins) · `22:… viewer-FomLdkbP.css` ; `grep -c '<script'` → 1 ; polyfill modulepreload dans idleLogout-*.js (externe)
- `rg -n "https?://" web/src/viewer -g '!**/__tests__/**' -g '!*.test.ts'` → appels réseau : ∅ ; `<a href>` geolens.fr ×2, sketchfab ×1 (navigation, hors CSP) ; ReportGenerator.ts:156 `@import fonts.googleapis` (bloqué : style-src ; déjà bloqué baseline) ; commentaires HttpBackend.ts:25, solarMath.ts:194
- `rg -o 'https?://…' dist/assets/*.js` → geopf/OSM = MapView-*.js importé par main-B24cveLH.js (portail) ; cesium/google tiles = plugins 3d-tiles non appelés ; jspdf cdnjs pdfobject = `output()` ∅ dans src/viewer
- workers dist : DRACO/KTX2/Spark/fflate/web-ifc = blob: (worker-src OK) ; Spark fallback `data:` seulement si blob échoue ; analysis.worker = /assets (self)
- `rg -c unpkg web/dist/viewer.html web/dist/assets/` → exit=1 ; `rg unpkg web/src/viewer` (hors tests) → exit=1
- `cmp public/<f> node_modules/three/examples/jsm/libs/<f>` ×5 → `= three r184` ×5, `dist ok` ×5
- `docker run … caddy:2-alpine caddy validate` → pull 1 essai OK · `Valid configuration` exit=0 (warn `not formatted` line 5)
- Caddyfile copie, domaine→`:8080`, upstreams→`respond`, `curl -D -` → /viewer.html, /viewer.html?project=1, /viewer, /VIEWER.HTML, /assets/*, /draco/* : `CSP: frame-ancestors 'self'; base-uri 'self'; form-action 'self'` + nosniff + Referrer, 0 Report-Only ; /, /login, /index.html, /viewer.html/ : + `Content-Security-Policy-Report-Only` ; /api/projects : 0 en-tête
- `docker run --rm nginx:alpine grep wasm /etc/nginx/mime.types` → `nginx/1.31.6` · `55: application/wasm wasm;` · nginx.conf inclut mime.types L15
- `npm --prefix web test` → `Test Files 176 passed (176)` `Tests 1683 passed (1683)` exit=0 ; `npm --prefix web run build:viewer-types` → `tsc --noEmit -p tsconfig.viewer.json` exit=0 ; csp.test.ts → `5 passed`
- `rg installIdleLogout web/src` → Layout.tsx:14 (portail), boot-web.ts:21 ; viewer 1 appel ; idleLogout.ts : localStorage sous try/catch → pas de throw avant `boot()`
- D1 : `createServer({server:{middlewareMode:true,hmr:{port:24999}}}).transformIndexHtml('/viewer.html',…)` → `<script type="module"> inline=true import { injectIntoGlobalHook } from "/@react-refresh"…` ; `transformRequest('/src/viewer/packs/risque/app/RisqueApp.tsx')` → `if (!window.$RefreshReg$) { throw new Error("@vitejs/plugin-react can't detect preamble…`
## Écarts
- lecture hors WL: web/src/viewer/main.ts:6020-6060 — chemin iframe PDF (mission)
- lecture hors WL: web/src/viewer/core/PDFViewer.ts:1-70 — iframe PDF src
- lecture hors WL: web/src/idleLogout.ts:1-90 — throw possible avant boot ?
- lecture hors WL: web/Dockerfile (grep FROM) — version nginx prod
- budget 3 dépassé (4) + contextes rg (ImageViewer.ts:28-40, risque/*Screen.tsx iframe, api/src/storage.ts:559-562)
- outils hors liste : `node -e` (Vite transformIndexHtml/transformRequest), `docker run nginx:alpine`, `docker run -d caddy` + curl — repro A6/A7/D1, 0 écriture dans G
## Pour la suite
- D1 : retirer @vitejs/plugin-react de la page viewer en dev, ou CSP meta dev ≠ prod (plugin transformIndexHtml `apply:'build'`) ; repro = `transformIndexHtml('/viewer.html')`
- PDFViewer.loadFromPath (main.ts:6040) → `glr-file://` : PDF inopérant sur web indépendamment de la CSP ; si portage → frame-src doit gagner `'self'`
- csp.test.ts:29-38 testent la constante, pas les fichiers ; :41 ne voit ni `on*=` ni `data-src=` → durcir sur dist/viewer.html
- portail Report-Only : connect-src/img-src `'self'` vs tuiles geopf/OSM (MapView) + PUT S3 présigné → violations attendues avant enforce ; Dockerfile épingle `nginx:1.27-alpine` (wasm MIME NV) ; web/public/ non suivi (`??`)
- ReportGenerator.ts:156 `@import fonts.googleapis` mort sous CSP → embarquer Poppins
## Retour sur le pack
- Manquait: Dockerfile (version nginx prod) · src/idleLogout.ts · PDFViewer.ts + appelant (mission cite iframe PDF) · cas `vite` dev (plugin-react) · outil `node -e` pour repro Vite
- Inutile: ∅
