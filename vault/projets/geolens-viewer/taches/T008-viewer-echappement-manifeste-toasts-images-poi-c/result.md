---
tache: T008
statut: fait
---
## Livré
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer
- G/ui/safeHtml.ts:1-22 — NEUF, escapeHtml + isSafeImageDataUrl, 0 import
- G/ui/safeHtml.test.ts:1-33 — NEUF, 5 it / 8 cas pack
- G/main.ts:164 — import isSafeImageDataUrl
- G/main.ts:875 — src photo POI filtré, sinon ''
- G/main.ts:4821-4823 — logo seulement si data URL sûre ; alt échappé
- G/main.ts:4861,4863 — stat label/value escapeHTML
- G/main.ts:4935,4938,4943 — d.id, d.filename, d.name, d.description échappés
- G/main.ts:5825,7173,7189 — toast loaded.name échappé
- G/main.ts:5846,7177 — toast err.message échappé
- G/ui/homeCinematic.ts:49,347,349,351 — import ; name/id, client·date, description échappés
- G/services/photoInspector/PhotoInspectorMode.ts:29,713 — import ; photo.filename échappé
- G/core/POIManager.ts:10,446-448 — restorePOIs : screenshot non sûr → undefined, photos filtrées
- G/ui/poiPanel.ts:18,97 — thumb seulement si data URL sûre
- G/core/ReportGenerator.ts:14,789 — screenshot rapport seulement si sûr
## Vérifié comment
npm --prefix web run typecheck → tsc --noEmit -p tsconfig.json ; exit=0
npm --prefix web test → Test Files 176 passed (176) · Tests 1683 passed (1683) ; exit=0
npx vitest run src/viewer/ui/safeHtml.test.ts → Test Files 1 passed (1) · Tests 5 passed (5)
wc -l main.ts → 9405 (≤ 9407)
git diff --stat (fichiers WL) → POIManager.ts 5 · ReportGenerator.ts 3 · main.ts 27 · PhotoInspectorMode.ts 3 · homeCinematic.ts 7 · poiPanel.ts 3 ; 28+/20- ; `??` safeHtml.ts, safeHtml.test.ts
git diff --stat global → 33 fichiers ; hors WL = T009/T010/autres (api/, e2e/, worker/, install.ts, HttpBackend.ts, viewer.html, index.html, boot-web.ts, TilesRendererLoader.ts, nginx.conf…) — 0 touché par T008
## Écarts
- imports ajoutés en tête hors plages : main.ts:164, homeCinematic.ts:49, PhotoInspectorMode.ts:29, poiPanel.ts:18, ReportGenerator.ts:14, POIManager.ts:10 — DoD exige l'import, plages ne le couvraient pas
- DoD poiPanel « + échappé » : src validé par regex base64 seul → échappement no-op, non ajouté
- base tests 1665 → 1683 : +5 T008, reste agents parallèles
- lecture hors WL : ∅
## Pour la suite
- main.ts:7193 toast drop `err.message` non échappé (hors liste pack) — même correctif que :7177
- main.ts:4935-4937 `d.type` (data-type, class, label fallback) + metaParts (resolution, gsdCm) non échappés
- isSafeImageDataUrl png|jpeg seul : photo POI jointe en webp/gif/heic (main.ts attachPhoto accepte image/*) → vignette vide et retirée au restore
- logo branding : svg+xml ou URL non-data désormais masqué — vérifier sortie de resolveBrandingLogoDataUrl
- main.ts:5846 errMsg échappé : messages loader contenant du HTML voulu (<br>) s'afficheraient littéralement — non audité
## Retour sur le pack
- Manquait: plages d'import en tête de fichier ; « poiPanel ~:85-92 photos » inexistant — site photos = main.ts:874 ; homeCinematic name = :346 pas :348
- Inutile: plage main.ts:535-550 (showToast inchangé)
