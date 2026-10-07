---
tache: T003
statut: fait
---
## Constats
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online ; chemins ci-dessous relatifs à G/web.
- C1 · src/viewer/main.ts:4934 — data-filename="${d.filename}" brut — confirmé
- C1 · main.ts:4937 — ${d.name} brut dans innerHTML — confirmé
- C1 · main.ts:4942 — ${d.description} brut — confirmé
- C1 · main.ts:4936 — data-deliverable-id="${d.id}" brut — nouveau (non listé audit)
- C1 · main.ts:4822 — branding.companyName dans alt="" — confirmé ; src=brandingLogoDataUrl aussi brut
- C1 · main.ts:4858-4863 — stats label/value (acq.coordinateSystem, verticalDatum) brut — confirmé ; numériques `${acq.x}` aussi injectés
- C1 · src/viewer/ui/homeCinematic.ts:348 — proj.name ?? proj.id brut — ≠ audit (346→348)
- C1 · homeCinematic.ts:350 — proj.description brut — ≠ audit (350→350 ok)
- C1 · homeCinematic.ts:349 — proj.client, proj.date joints brut — nouveau
- C1 · src/viewer/services/photoInspector/PhotoInspectorMode.ts:712 — photo.filename brut dans spinner.innerHTML — confirmé
- C1 · total sites manifeste: 9 (4934,4936,4937,4942,4822,4858-4863,homeCinematic 348/349/350,PhotoInspector 712) — audit ≈10
- C1 · main.ts:4900-4906 — tooltip title="${tooltipText}" : sizeTxt seulement, non user — HP
- C1 · global: 163 occurrences innerHTML|insertAdjacentHTML|outerHTML dans 40 fichiers viewer hors tests ; main.ts 26 lignes `innerHTML` — confirmé (audit 165/40)
- C1 · escapeHTML: main.ts:465 (export, couvre & < > " ') ; doublons: ui/savedViews.ts:398 escapeHtml, packs/shared/reportEngine.ts:125 escapeXml, packs/risque/doc-engine/render.js escapeHtml, core/ReportGenerator.ts this.esc → 4 helpers, 0 module partagé neutre
- C2 · src/viewer/backend/install.ts:45-58 — fail(): message+detail concaténés dans box.innerHTML — ≠ audit (332-336 → 45-58)
- C2 · install.ts:61-62 — projectId = params.get('project') — source (audit :342-343 ; fichier = 155 l.)
- C2 · install.ts:79 — fail('…', `id=${projectId}`) sur 404 — sink réfléchi, confirmé (audit :360 → 79)
- C2 · install.ts:67 — apiBase = `${origin}/api/projects/${projectId}` sans encodeURIComponent — confirmé (audit :348 → 67)
- C2 · install.ts:64,82,86,97,99 — autres appels fail(): messages constants ou String(e)/HTTP status ; String(e) :86 aussi injecté (erreur fetch, risque faible)
- M2 · main.ts:541-546 — showToast : `${message}` dans toast.innerHTML — confirmé
- M2 · showToast: 461 appels `showToast(` dans src/viewer hors tests (rg -c somme) ; main.ts 123 ; audit : 30 avec texte utilisateur (NV recompté)
- M2 · appels manifeste: main.ts:5824,7172,7188 `${loaded.name} charge avec succes` — confirmé
- M2 · main.ts:5845,7176 — message d'erreur (err.message) dans toast — texte non maîtrisé, même sink
- M2 · showToast redéfini par injection: workspace.ts:144 (deps type), tools.ts:60, drawTool.ts:49, packs/types.ts → tous délèguent à main.ts:541 (NV chaîne complète)
- M2 · contraste: setStatus main.ts:568-572, showLoading :622-629 utilisent textContent
- m13 · core/POIManager.ts:437-446 restorePOIs — valide position seulement ; screenshotDataUrl et photos[] copiés sans validation — confirmé (audit 432-446)
- m13 · core/POIManager.ts:53-54 — screenshotDataUrl?: string ; photos: string[] (commentaire "paths", en pratique data-URL)
- m13 · core/POIManager.ts:596 — export JSON met screenshotDataUrl: undefined ; photos exportées telles quelles
- m13 · ui/poiPanel.ts:96-98 — src="${poi.screenshotDataUrl}" brut — confirmé
- m13 · ui/poiPanel.ts:~85-92 (map photos) — src="'+dataUrl+'" brut — nouveau (2e sink poiPanel, photos[])
- m13 · main.ts:874 — src="${poi.screenshotDataUrl}" (cf. audit) — NV re-lu ; ReportGenerator.ts:788 — src brut, alt via this.esc — confirmé
- m13 · format attendu: screenshotDataUrl = canvas.toDataURL (POIManager.ts:294 captureScreenshot) → data:image/(png|jpeg);base64,…
- M4 · backend/HttpBackend.ts:47-68 — makeSignUrl : exige http(s)+pathname contient '/api/projects/' et '/storage/' ; AUCUNE vérif d'origine — ≠ audit (86 resolve/62-66 → 47-68)
- M4 · HttpBackend.ts:63 — `if (!u.searchParams.has('token')) u.searchParams.set('token', ctx.token)` — token ajouté à https://attacker/api/projects/x/storage/y
- M4 · HttpBackend.ts:86-88 — resolve(): URL absolue http(s) renvoyée telle quelle puis passée à sign (:82 const sign)
- M4 · install.ts:101-104 — ctx.apiBase disponible (= location.origin + /api/projects/<id>) ; window.__glrSignUrl = makeSignUrl(ctx)
- M4 · consommateur: loaders/TilesRendererLoader.ts:131 (commentaire) — appelle window.__glrSignUrl ; connect-src 'self' bloque aujourd'hui l'exfiltration fetch, PAS <img src>/img-src 'self' (bloque aussi) — OK partiel
- M3 · loaders/TilesRendererLoader.ts:169 — draco.setDecoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/') — confirmé
- M3 · TilesRendererLoader.ts:172 — draco.setDecoderConfig({ type: 'js' })
- M3 · TilesRendererLoader.ts:177 — ktx2.setTranscoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/basis/') — confirmé
- M3 · package.json:36 three 0.184.0 exact = node_modules/three/package.json version 0.184.0 ; unpkg seulement ces 2 lignes dans src (+ CSP des 2 HTML)
- M3 · node_modules/three/examples/jsm/libs/draco/ : draco_decoder.js, draco_decoder.wasm, draco_wasm_wrapper.js, draco_encoder.js, gltf/ ; libs/basis/ : basis_transcoder.js, basis_transcoder.wasm
- M3 · public/ absent dans G/web (ls public → ∅) ; vite.config.ts : assetsInlineLimit 0, assetsInclude **/*.wasm, 0 plugin copie statique
- M1 · CSP unique: meta viewer.html:16 et src/viewer/index.html:16 (identiques) ; web/index.html ∅ CSP (16 l.) ; nginx.conf ∅ add_header ; Caddyfile ∅ (rg header|Content-Security → ∅)
- M1 · CSP actuelle: script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://unpkg.com ; style-src 'self' 'unsafe-inline' ; connect-src … https://unpkg.com ; ∅ frame-ancestors (inopérant en meta de toute façon)
- M1 · `<script>` dans viewer.html : 2 (L21 module src ; L23-26 module inline import idleLogout) ; src/viewer/index.html : 1 ; index.html : 1 (src)
- M1 · attributs on*= inline dans viewer.html : 0 ; dans templates JS src/viewer : 0 (rg '\son[a-z]+=\\?"' → ∅)
- M1 · `<style>` viewer.html : 0 ; style="" inline viewer.html : 82 lignes ; templates JS: ~365 style="…" (audit) → style-src 'unsafe-inline' à conserver
- M1 · verdict: script-src sans 'unsafe-inline' FAISABLE : 1 seul inline à externaliser (viewer.html:23-26 → import dans boot-web.ts) ; 0 on*= ; nonce inutile (aucune injection serveur) ; build vite non testé (NV : modulepreload polyfill inline ?)
- M1 · en-têtes (frame-ancestors, nosniff, Referrer-Policy) = nginx/Caddy uniquement (meta ignore frame-ancestors) — hors viewer
- M1 · viewer lance Worker/blob: ? blob: nécessaire (worker-src 'self' blob:, script-src blob:) — conserver ; 'wasm-unsafe-eval' requis (draco/basis/copc/laz-perf wasm)
- Tests viewer: 168 *.test.ts sous src/viewer ; __tests__ dirs: backend (copcHeader, copcHttpBackend, multiPackCopc), loaders (lazPerfFactory, copcOctreeBudget), core (picking, worldCoordsFusionCopc), core/geometry, ui (copcDensity), packs/risque/{core,doc-engine}
- Tests: backend/install.ts ∅ ; makeSignUrl ∅ ; showToast/escapeHTML ∅ (rg -l sur *.test.ts → seulement quantities.test.ts, volumesStore.test.ts stubs showToast) ; poiPanel/POIManager restore ∅ ; homeCinematic ∅ ; TilesRendererLoader décodeurs ∅
- Pièges: vitest env node sans jsdom (audit) → tester via fonctions pures (helper escape, validateur data-URL, makeSignUrl) ; main.ts importe tout le viewer → NE PAS l'importer dans un test
- Pièges: viewer.html ↔ src/viewer/index.html dupliqués ; `npm run check:viewer-html` (G/package.json:13, racine ; script G/scripts/check-viewer-html-sync.mjs) vérifie les IDs ; toute modif CSP/script inline = 2 fichiers
## Correctif minimal
- C1 · E: nouveau src/viewer/ui/safeHtml.ts (+ safeHtml.test.ts) ; main.ts (L4822,4858-4863,4934,4936,4937,4942) ; ui/homeCinematic.ts (348-350) ; services/photoInspector/PhotoInspectorMode.ts (712) · helper escapeHtml(str) = copie de main.ts:465 (même corps, import par les 3 consommateurs), appliqué à chaque champ · test: safeHtml.test.ts cas `<img src=x onerror=1>`, `"`, `'`, null→''
- C1 (variante) · main.ts ne peut importer safeHtml côté sink sans toucher le monolithe: changements main.ts = 1 import + appels (monolithe gelé, correctif = appel helper seulement)
- C2 · E: src/viewer/backend/install.ts (45-58, 67, 79) ; src/viewer/backend/__tests__/ (fail non testable sans DOM → extraire buildFailBox pure ? sinon test escape) · fail(): message/detail via textContent (createElement) ; apiBase avec encodeURIComponent(projectId) · test: nouveau backend/__tests__/installFail.test.ts (cas projectId=`"><img onerror=1>`) — nécessite extraction d'une fonction pure `renderFailHtml` ou jsdom (NV)
- M2 · E: src/viewer/main.ts:541-546 · remplacer `${message}` par span.textContent = message après innerHTML (ou createElement) ; ≤ 6 lignes · test: extraire `buildToastEl` dans ui/toast.ts (pur, DOM stub) — sinon test manuel ; ⚠ appelants passant du HTML volontaire: NV (rg showToast avec balises `<b>|<br`)
- m13 · E: nouveau helper ui/safeHtml.ts (isSafeImageDataUrl) ; core/POIManager.ts:437-446 (filtrer screenshotDataUrl/photos à la restauration) ; ui/poiPanel.ts:96,~90 ; main.ts:874 ; core/ReportGenerator.ts:788 · regex ^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$ + escapeHtml attribut · test: safeHtml.test.ts cas `data:image/png;base64,AAA`, `x" onerror="1`, `javascript:`, `data:image/svg+xml`
- M4 · E: src/viewer/backend/HttpBackend.ts:47-68 (makeSignUrl) · ajouter `if (u.origin !== new URL(ctx.apiBase).origin) return u.href;` avant L63 · test: nouveau backend/__tests__/makeSignUrl.test.ts (origine ≠ → pas de token ; même origine → token ; data:/blob: intacts ; token déjà présent)
- M3 · E: src/viewer/loaders/TilesRendererLoader.ts:169,177 ; vite.config.ts ou public/ (nouveau, copie draco/ + basis/) ; viewer.html:16 + src/viewer/index.html:16 (retirer unpkg) · setDecoderPath('/draco/'), setTranscoderPath('/basis/') via public/ copié depuis node_modules/three/examples/jsm/libs/ (version alignée 0.184.0) · test: loaders/__tests__/ ∅ possible ; vérif manuelle build (dist contient draco_decoder.wasm) — NV
- M1 · E: viewer.html:16,23-26 ; src/viewer/index.html:16 (+ miroir) ; src/viewer/boot-web.ts (ajouter installIdleLogout) ; nginx.conf (add_header) ou Caddyfile · retirer 'unsafe-inline' de script-src, externaliser l'inline, retirer unpkg · test: `npm run check:viewer-html` + e2e manuel (e2e non installé)
- m11 hors lot (reportEngine.ts:319 escapeXml) : non demandé
## Contrats
```
// main.ts:465
export function escapeHTML(str: string): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// main.ts:541
export function showToast(message: string, type: ToastType = 'info', durationMs: number = 3500): void
// backend/HttpBackend.ts:47
export function makeSignUrl(ctx: ViewerContext): (url: string) => string
// install.ts:45
function fail(message: string, detail?: string): false
// install.ts:101
const ctx: ViewerContext = { projectId, token, apiBase, tilesetUrl: tilesetUrlAbs };
// CSP actuelle (viewer.html:16 = src/viewer/index.html:16)
default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: file: glr-file: cog: photo:; font-src 'self' data:; connect-src 'self' blob: data: glr-file: cog: photo: https://unpkg.com; worker-src 'self' blob:; frame-src file: blob: glr-file:; object-src glr-file: file: blob:;
// TilesRendererLoader.ts:169,177
draco.setDecoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/draco/');
ktx2.setTranscoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/basis/');
```
## Vérifié comment
- rg -c "showToast\(" src/viewer -g '!*.test.ts' | awk somme → 461
- rg -c innerHTML|insertAdjacentHTML|outerHTML src/viewer hors tests → 163 / 40 fichiers
- rg -c 'unpkg' src → TilesRendererLoader.ts:169,177 seulement
- ls node_modules/three/examples/jsm/libs/draco, basis → fichiers listés ci-dessus ; three 0.184.0
- rg -n '<script' viewer.html → L21, L23 ; wc -l install.ts → 155
- rg 'onclick|onerror' viewer.html → ∅ ; ls public → absent
- NV: build vite dist (script inline injecté ?), main.ts:874 re-lu, showToast avec HTML volontaire, chaîne showToast packs complète
## Écarts
- ∅ lecture hors WL (rg/sed sur G/web/src, G/package.json, G/scripts/check-viewer-html-sync.mjs:5-12 en-tête, G/Caddyfile rg seul : sous règle rg libre)
- install.ts = 155 l. : audit C2 (332-364) numéros erronés, correct = 45-82
## Pour la suite
- Lot A (sink/helper): C1+M2+m13 — fichiers: ui/safeHtml.ts(+test) NEUF, main.ts, homeCinematic.ts, PhotoInspectorMode.ts, POIManager.ts, poiPanel.ts, ReportGenerator.ts ; collision interne sur main.ts (1 seul agent).
- Lot B (réseau): C2+M4 — install.ts, HttpBackend.ts, backend/__tests__/{makeSignUrl,installFail}.test.ts NEUFS ; disjoint de A (sauf si fail() importe safeHtml : créer safeHtml d'abord ou dupliquer 3 lignes).
- Lot C (CSP+décodeurs): M3+M1 — TilesRendererLoader.ts, public/ ou vite.config.ts, viewer.html, src/viewer/index.html, boot-web.ts, nginx.conf ; exécuter après A/B pour tests e2e ; lancer `npm run check:viewer-html`.
- Contraintes: 0 dépendance ; vitest env node → tester helpers purs ; main.ts gelé = appels helper seulement ; showToast : vérifier appelants passant du HTML volontaire avant textContent.
## Retour sur le pack
- Manquait: numéros de ligne audit install.ts périmés (C2/M4 ≠) ; vitest config (env node/jsdom par fichier) ; contenu Caddyfile/racine G
- Inutile: plage RAPPORT 215-245 partiellement redondante avec SYNTHESE
