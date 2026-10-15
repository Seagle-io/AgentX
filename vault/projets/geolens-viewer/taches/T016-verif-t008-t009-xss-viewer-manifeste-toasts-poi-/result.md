---
tache: T016
statut: fait
verdict: DÉFAUTS
---
## Livré
- A1 — OK id/filename/name/description échappés main.ts:4935-4943
- A2 — OK isSafeImageDataUrl + alt escapeHTML :4821-4823
- A3 — OK label/value échappés :4861,:4863 ; unit constante
- A4 — OK :5825,:7173,:7189,:5846,:7177 ; :7193 brut (connu)
- A5 — OK lignes citées ; KO fichier : D1 siblings bruts
- A6 — OK restore filtre, 4 sinks src gardés
- A7 — OK projectId/String(e)/status → textContent ; lien constant
- A8 — OK 7 URLs hostiles sans token (test jetable)
- A9 — OK 176/1683 verts ; typecheck exit 0
## Défauts
- D1 · PhotoInspectorMode.ts:358 `${this.photos[i].filename}` + :769 `${f}` (filename) bruts en innerHTML · filename=`<img src=x onerror=alert(3)>.jpg` → node -e template → `<span …><img src=x onerror=alert(3)>.jpg</span>` · attendu &lt;img / obtenu balise · exploitable oui — même champ que :713 corrigé
- D2 · homeCinematic.ts:443 `${s.value}` ← homeData.ts:109 `acquisition.accuracyCm` ; :455 `${c.subtitle}` ← homeData.ts:173 `deliverables[].gsdCm` · project.json accuracyCm=`<img src=x onerror=alert(1)>` → buildHomeStats value `± <img src=x onerror=alert(1)> cm` · attendu échappé / obtenu brut · exploitable oui — même accuracyCm échappé côté main.ts:4863
- D3 · poiPanel.ts:112,:119 `${poi.priority}` (class) + :121,:122 `${poi.id}` (data-poi-vis/del) bruts · POI restauré id=`"><img src=x onerror=alert(1)>` (POIManager.ts:444 `...p` ne filtre que images) → `data-poi-vis=""><img src=x onerror=alert(1)>">` · attendu attribut fermé / obtenu balise · exploitable oui si JSON POI contrôlé
- Restes connus confirmés : main.ts:7193 err.message brut ; :4935-4936 `d.type` (data-type, class) + :4940 `${label}` (= d.type si inconnu) ; :4941 metaParts resolution.width/height, gsdCm bruts ; pointCount/sizeBytes neutralisés par isFinite (main.ts:415,:423)
- :5846 `<br>` littéral : ∅ `<br` dans viewer/loaders → régression non reproduite
## Vérifié comment
- `npx --prefix <G>/web vitest run --root /tmp/tmp.fSQ48e62nd` → `Test Files 1 passed (1) · Tests 23 passed (23)`
  - isSafeImageDataUrl false : `data:image/png;base64,AA=="` · `DATA:IMAGE/PNG;base64,AA` · `…AA\n` · `…AA\n"><svg onload=1>` · objet toString · base64 vide · `image/jpg` · 10 Mo+`!` < 2 s
  - makeSignUrl 0 token : `https://portail.test.evil.test/…/storage/x` · `//evil.test/…` · `https://portail.test:444/…` · `http://portail.test/…` · `\\evil.test/…` · `https://portail.test@evil.test/…` · `https://evil.test/…?u=https://portail.test`
  - token présent : `https://PORTAIL.TEST:443/…` · `https://portail.test/…` · `storage/x` · `/api/projects/p/storage/x`
  - `STATS [{"value":"± <img src=x onerror=alert(1)> cm","label":"précision absolue"}]`
  - `CARDS [{"kind":"ortho","title":"Orthophoto","subtitle":"GSD <img src=x onerror=alert(2)> cm"}]`
- `node -e` template poiPanel/PhotoInspector → `<span class="poi-dot x"><svg onload=alert(2)>"></span>` · `data-poi-vis=""><img src=x onerror=alert(1)>">` · `<span style="font-size:12px;"><img src=x onerror=alert(3)>.jpg</span>`
- `npm --prefix web test` → `Test Files 176 passed (176) · Tests 1683 passed (1683)` EXIT 0
- `npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` EXIT 0
- `git -C G diff --stat -- web/src/viewer` → 11 fichiers, +50 −29
## Écarts
- lecture hors WL: web/src/viewer/ui/homeData.ts:96-200 — source s.value/c.subtitle homeCinematic
- lecture fichiers WL hors plages : main.ts:410-432,:460-475 ; PhotoInspectorMode.ts:350-372,:670-690,:750-772 ; homeCinematic.ts:425-462 ; poiPanel.ts:100-125
- dossier jetable /tmp/tmp.fSQ48e62nd (mktemp -d), pas le scratchpad
## Pour la suite
- T-fix : escapeHtml sur PhotoInspectorMode.ts:358,:769 (photo.filename) — D1
- T-fix : escapeHtml s.value/s.label/c.title/c.subtitle homeCinematic.ts:443-455 ou numéricité accuracyCm/gsdCm homeData.ts:109,:173 — D2
- T-fix : escapeHTML poi.id poiPanel.ts:121-122 + whitelist priority ∈ {critical,important,info} à POIManager.restorePOIs:444 — D3
- install.ts:158 orgLogo filtre `startsWith('data:image/png')` ≠ isSafeImageDataUrl → `data:image/png" onerror=…` passe ; sink reportEngine NV
- hors plages vus : PhotoInspectorMode.ts:689 src=url (__glrPhotoUrl NV) ; main.ts:8636 data-type brut ; :7447 label
## Retour sur le pack
- Manquait: homeData.ts en WL (source des sinks homeCinematic:441-456) ; plage poiPanel:80-100 coupe le sink réel :111-123
- Inutile: ∅
