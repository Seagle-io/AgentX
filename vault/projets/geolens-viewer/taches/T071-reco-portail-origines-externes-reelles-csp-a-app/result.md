---
tache: T071
statut: fait
---
## Origines du portail
G = geolens-web-feat-viewer-online. Portail = web/index.html → src/main.tsx (hors src/viewer/**, qui sert viewer.html).
| origine | directive | chargée par (chemin:L) | nécessaire |
|---|---|---|---|
| 'self' (js/css/woff2/wasm hashés /assets/) | script/style/font-src | dist/index.html (1 module + 6 modulepreload + 2 stylesheet) | oui |
| https://data.geopf.fr (tuiles WMTS png+jpeg) | img-src + connect-src | web/src/pages/MapView.tsx:25 (PLANIGNV2), :32 (ORTHOPHOTOS) | oui (fond carte) |
| https://tile.openstreetmap.org | img-src + connect-src | MapView.tsx:38 | oui (fond « osm ») |
| https://<bucket>.s3.fr-par.scw.cloud (PUT parts) | connect-src | web/src/upload/directUpload.ts:188 `fetch(url,{credentials:'omit'})`, url = présignée par API | oui (import) |
| https://<bucket>.s3.fr-par.scw.cloud (GET 302 tuiles) | img-src/connect-src | env TILE_PRESIGN_REDIRECT=1 (.env.production.example:11) ; viewer surtout | oui si flag=1 |
| /api/* | connect-src 'self' | web/src/api.ts:21,32 (fetch), :56 (XHR postFormProgress) ; directUpload.ts sameOrigin → 'include' | oui |
| blob: worker | worker-src blob: | maplibre-gl (worker blob par défaut) via MapView.tsx:3 | oui (NV runtime) |
| data: images | img-src data: | MapView popup SVG inline (fieldIconSvg) ; maplibre-gl.css | oui |
| /viewer.html?project= | frame-src 'self' | web/src/pages/Project.tsx:108 `<iframe src>` | oui |
| https://www.geolens.fr | ∅ (liens <a target=_blank>, pas de chargement) | components/SiteFooter.tsx:68 | n/a |
| fonts.googleapis.com | ∅ | ReportGenerator.ts:156 — viewer/ ; PAS le portail | non (voir rapports) |
| mailto:, xmlns SVG http://www.w3.org | ∅ | Import.tsx:376 ; URI de namespace | n/a |
- Absences : 0 `<script>` inline, 0 `<style>` inline, 0 `<link>` externe, 0 CDN dans dist/index.html. 0 fetch tiers hors directUpload (rg).
- Polices portail : Poppins locale (main.tsx:6 → fonts.css), 10 woff2 émis en /assets/ (assetsInlineLimit 0) → font-src 'self' suffit ; `data:` inutile.
- Styles : `style={{}}` React = CSSOM, OK sans unsafe-inline ; MAIS MapView popup `setHTML` (MapView.tsx:72) + maplibre-gl injectent style/attributs → garder style-src 'unsafe-inline' (NV : non testé navigateur).
- Build : `index.html` → script-src 'self' SANS 'unsafe-inline' possible (module externe, 0 inline).
- Piège : MapView.tsx:72 `onerror="this.style.display='none'"` = handler inline → BLOQUÉ par script-src 'self' ; effet : vignette cassée visible si 404 (cosmétique). Correctif : écouteur JS après setHTML, ou accepter.
- Piège : maplibre-gl charge les tuiles raster par fetch+createImageBitmap (NV version/chemin) → geopf/OSM dans connect-src EN PLUS d'img-src.
- Piège CORS : connect-src ne suffit pas ; bucket doit autoriser PUT/ETag expose depuis l'origine portail (hors CSP).

## CSP portail proposée
Origine bucket (api/src/storage.ts:675-677) : vhost-style (S3_FORCE_PATH_STYLE=0) = `https://${S3_BUCKET}.${host(S3_ENDPOINT)}` ; exemple .env.production.example:30-32 → `https://geolens-tuiles.s3.fr-par.scw.cloud` (bucket réel D21 pas créé ; remplacer). Statique OK (changé seulement à la création du bucket) ; option `{$S3_PUBLIC_ORIGIN}` Caddy env (NV : env transmise au conteneur caddy ? non vérifié).
```
Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://data.geopf.fr https://tile.openstreetmap.org https://geolens-tuiles.s3.fr-par.scw.cloud; font-src 'self'; connect-src 'self' https://data.geopf.fr https://tile.openstreetmap.org https://geolens-tuiles.s3.fr-par.scw.cloud; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
```
Écart vs Report-Only (Caddyfile:30) :
- nom de directive : `Content-Security-Policy-Report-Only` → `Content-Security-Policy` (matcher @portail_doc inchangé)
- + img-src : data.geopf.fr, tile.openstreetmap.org
- + connect-src : data.geopf.fr, tile.openstreetmap.org, origine bucket (était 'self' seul → PUT S3 cassait)
- font-src : − data:
- frame-src : − blob:
- img-src bucket : placeholder bucket-a-remplacer → bucket réel
- Conflit : bloc @front (Caddyfile:24) pose déjà un CSP `frame-ancestors/base-uri/form-action` sur tout non-/api → 2 en-têtes CSP cumulés (intersection) ; inoffensif mais redondant.
- Piège : @portail_doc exclut /assets/* → un CSP sur index.html seul ; viewer.html garde sa meta CSP (viewer/index.html:13), non touchée.
- Risque : 'wasm-unsafe-eval' absent ; portail ne charge pas wasm (laz-perf/web-ifc côté viewer) — NV si MapView lazy-importe qqch wasm (non trouvé).

## Police des rapports
- Contexte : web/src/viewer/core/ReportGenerator.ts:156 `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');` dans `<style>` du HTML retourné par `generateHTML` (:136-:153 template string `<!DOCTYPE html>`). Document = fichier HTML TÉLÉCHARGÉ (main.ts:9341 `Blob`+`<a download>` ; HttpBackend.ts:588 exportReportPDF → Blob download .html), ouvert hors site (file://), imprimé en PDF par l'utilisateur. Ni iframe, ni srcdoc, ni fenêtre. Donc la CSP portail/viewer ne s'applique pas au rapport ouvert ; l'@import est un vrai appel réseau Google (RGPD, échoue hors-ligne → repli sans-serif). « Bloqué par CSP viewer » seulement si rendu dans le viewer (aucun cas trouvé).
- Autre générateur : reportEngine.ts / ReportExporter.ts (photoInspector) non examinés pour @import (hors question) — NV.
- Fichiers locaux : web/src/viewer/styles/fonts.css (4669 o, 10 @font-face) → fonts/ : poppins-{300,400,500,600,700}-latin.woff2 (7840/7884/7748/8000/7816 o = 39 288 o) + -latin-ext.woff2 (5524/5644/5484/5524/5432 o = 27 608 o). Total 66 896 o. unicode-range fournis dans fonts.css.
- Correctif minimal :
  1. Nouveau web/src/viewer/core/reportFonts.ts : `import p300 from '../styles/fonts/poppins-300-latin.woff2?inline'` (×5, latin seul ; `?inline` force data URI malgré assetsInlineLimit 0) → exporte `REPORT_FONT_CSS` = 5 `@font-face{font-family:'Poppins';font-weight:N;src:url(${pN}) format('woff2')}`.
  2. ReportGenerator.ts:156 : remplacer l'@import par `${REPORT_FONT_CSS}` (+ import en tête).
  3. Taille ajoutée au HTML rapport : 39 288 o → ≈ 52 400 o base64 (latin seul) ; +latin-ext ≈ 89 200 o. Latin couvre œ/–/…/€ (fonts.css:7 dit latin-ext pour œ/–/… ; NV : vérifier œ dans unicode-range latin : U+0152-0153 présent ligne 'latin').
  4. Test : `rg -n "googleapis" web/dist web/src` → 0 hors commentaires ; générer un rapport, `rg -c "data:font/woff2" rapport.html` → 5.
  5. Fichiers à toucher : 2 (reportFonts.ts nouveau, ReportGenerator.ts). Vérifier que web/tsconfig/vite-env reconnaît `*.woff2?inline` (vite/client le déclare ; NV).

## Vérifié comment
- `npm --prefix web run build` → `✓ built in 14.40s` ; dist/index.html : 1 `<script type="module" src>`, 6 modulepreload, 2 `<link stylesheet>`, 0 inline
- `rg -n "https?://" web/src -g '!viewer/**' -g '!*.test.*'` → MapView.tsx:25,32,38 ; SiteFooter.tsx:68 (+ xmlns/commentaires)
- `rg -n "fetch\(|XMLHttpRequest" web/src/upload/directUpload.ts` → :188 fetch(url) ; api.ts:21,32,56
- `ls web/src/viewer/styles/fonts` → 10 woff2 (tailles ci-dessus)
- `git status --short` → ` M api/package-lock.json`, ` M api/package.json` (T072) ; web/ inchangé

## Écarts
- ∅ lecture hors WL hors pack : j'ai lu directUpload.ts, api/src/storage.ts:675-677, Project.tsx:108, viewer/main.ts:9341, HttpBackend.ts:588, Caddyfile complet (rg/sed, ciblés) — 5 fichiers hors WL (budget 3 dépassé ; tous nécessaires : PUT S3 réel, origine bucket, iframe, contexte rapport)
- non testé navigateur : aucune violation CSP mesurée ; recommandation = repasser 1 cycle Report-Only avec ajouts avant enforce

## Pour la suite
- Lot A (Caddyfile seul) : remplacer ligne :30 par la CSP ci-dessus en `Content-Security-Policy`, bucket réel au lieu de geolens-tuiles ; garder Report-Only 1 cycle si bucket/CORS non testés.
- Lot B (ReportGenerator.ts + nouveau reportFonts.ts) : @font-face data URI Poppins latin 300-700 (+52 Ko), supprimer @import :156 ; disjoint de A.
- Lot C optionnel (MapView.tsx:72) : retirer `onerror` inline (bloqué par script-src) → écouteur `error` JS après setHTML.
- Vérif navigateur (hors scope éclaireur) : carte geopf/OSM, import PUT S3, popup, 0 violation en console.

## Retour sur le pack
- Manquait: origine bucket dérivée (api/src/storage.ts:675) ; directUpload.ts (le vrai PUT, pas Import.tsx) ; Project.tsx (iframe)
- Inutile: web/src/api.ts:L (peu), vite.config.ts (seul assetsInlineLimit 0 utile)
