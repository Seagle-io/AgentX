---
tache: T017
statut: fait
verdict: DÉFAUTS
tags: [result]
---
## Mesures avant/après
$T = /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t017.iDDQ ; viewport 1600×1000, canvas CSS 1319×857 ; px/m = projection de target ± 1 m (axe droit caméra)

| id | métrique | avant | après |
|---|---|---|---|
| Z1 | persp→ortho (touche 5) zoom / px/m | NV / 2.231 | 1 / 2.231 |
| Z1 | 5 crans avant centre : zoom | 1 (camPos 332→38 m, dolly) | 7.33 |
| Z1 | idem : Δ camPos / dist | 294 m / 332 m | 0.27 m / 332.7 m (0.08 %) |
| Z1 | 5 crans arrière : zoom | NV (camPos revient 332) | 0.958 |
| Z2 | 3 crans à cx+¼W : dérive point sous curseur | NV (pas de zoom) | dx 0.05 % W, dy −0.14 % H |
| Z2 | contrôle cx±140 px : dérive | — | 0.08 % W (×3) |
| Z2 | bouton droit glissé −200 px : zoom | NV (camPos 61→221 m) | 3.23 → 1.95 |
| Z3 | 30 crans avant : zoom / maxZoom attendu (384.19/0.5) | camPos 0.5 m du target | 768.37 / 768.37 |
| Z3 | PNG 30 crans : écran vide ? | contenu 4.6 % | non, damier plein écran |
| Z4 | px/m persp → ortho(zoom 1) | 2.231 → (PNG id.) | 2.231 → 2.231 (0 %) |
| Z4 | ortho ×3.42 → persp : px/m | NV → 306.9 (×137 saut) | 7.640 → 7.640 (0 %) |
| Z4 | 2e entrée ortho : zoom / px/m | NV | 1 / 7.640 (= persp) |
| Z4b | ortho maxZoom → persp : dist caméra-target | 0.5 m | **0.433 m** (< minDistance 0.5) |
| Z4b | puis 1 cran AVANT : px/m | 1484 → 1484 | **1713.6 → 1484.1 (−13 %)** |
| Z5 | persp 5 crans : camPos | 332 → 42.8 m | 332 → 42.8 m |
| Z5 | gel D24 pendant 8 crans ortho : allowed / transitions | ∅ (__glrMotionGate absent) | false / 8→9→10 ; log gel + reprise + purge 36 |
| Z5 | mode2 ortho : 8 crans / droit | — | zoom 1→22.69 / 22.69→15.92 |
| Z6 | ortho 12 crans puis Accueil(H) : zoom / fond % | NV / 85.0 % | **64.74 / 4.8 %** |
| Z6 | puis Recadrer(F), Dessus(7), Iso(0) : zoom | NV, fond 85/76/85 % | **64.74 ×3, fond 25/46/26 %** |
| E1 | PLY 409 600 pts dpr2 : blocs 2×2 actifs identiques | 37.3 % | 37.3 % |
| E1 | dpr1 : idem | 38.7 % | 38.7 % |
| E1 | diff pixels buffer avant↔après dpr2 / dpr1 | — | **0 / 4 521 532 ; 0 / 1 130 383** |
| E1 | bindFramebuffer non-null pendant 3 s orbite (raf 201) | 0 | 0 |
| S1 | texte d'aide « Charge une seule fois toute la scène… » dans viewer.html | 0 occ. | 1 occ. (exact) |
| S1 | fluid init : req .sog / stats | — (HEAD sans fluid) | 15 / {1,15,0,0} « 14/14 tuiles depth 5/5 » |
| S1 | fluid réouverture : stats | — | {2,30,15,0} (cumulé) |
| S1 | fluid parcours 31.7 s : Δstats / req .sog | — | {0,0,0,0} / 0 |
| S1 | stream init → réouverture → fin | — | {1,10,2,10} → {2,17,10,15} → {2,36,30,54} |
| S1 | stream parcours : Δloads / req .sog / ΔlodChanges | — | 19 / 19 / 39 (=19+20 frees) |

## Défauts
- D1 · T016 · régression vues ortho · repro : tileset banc, `5`, 12 crans molette avant au centre (zoom 64.7), clic `[data-view="home"]` puis `recadrer`, `top`, `iso` · attendu : vue d'ensemble (AVANT fond 85 %, modèle entier) · obtenu : `camera.zoom` reste 64.74, fond 4.8 % (Accueil), 25 % (F) — vue ×65, modèle hors champ ; seule sortie = molette arrière ou bascule persp (boutons −/+ morts en ortho, connu) · cause : `SceneManager.ts:991` zoom réinitialisé seulement à P→O ; Accueil/F/vues (`animateCamera`/`setView` `SceneManager.ts:935-962`) ne touchent pas `zoom` · `cd $T && BASE=http://localhost:5182 LABEL=apres-h OUT=$T/out SELS='[data-view="home"],[data-view="recadrer"],[data-view="top"],[data-view="iso"]' node h.mjs`
- D2 · T016 EDL sans effet observable · repro : PLY 409 600 pts (`$T/genply.mjs`), contexte dpr 2 puis 1, capture `canvas.toDataURL` · attendu (contrat T016) : rendu EDL à densité physique, image ≠ AVANT à dpr 2 · obtenu : buffer APRÈS ≡ AVANT au pixel près (0 px dpr2, 0 px dpr1), 0 `bindFramebuffer` non-null en 3 s d'orbite · cause : `EDLRenderer.render()` appelé nulle part (`rg -n -i edl web/src --type ts` hors tests → seulement construction `SceneManager.ts:514` + `resize` :529/:601 + `.camera` :1026 ; boucle `SceneManager.ts:1895-1899` = `renderer.render` direct) ⇒ edlSize/resize = code mort, prémisse E1 « AVANT ≈ 100 % » fausse · `cd $T && LABEL=apres-e-dpr2 OUT=$T/out DPR=2 node e.mjs && node cmp.mjs out/avant-e-dpr2-buffer.png out/apres-e-dpr2-buffer.png`
- D3 · T016 bascule depuis maxZoom viole D1 (minDistance 0.5 m) · repro : `5`, 40 crans avant (zoom 224.36 = maxZoom), `5` · attendu : persp ≥ 0.5 m du target, molette avant = agrandit · obtenu : dist 0.433 m (= 0.5/(2·tan 30°)), puis 1 cran AVANT ⇒ recul à 0.5 m, px/m 1713.6 → 1484.1 (−13 %, zoom inverse) · cause : `SceneManager.ts:1022` `maxZoom = height/0.5` = hauteur visible 0.5 m, pas distance 0.5 m · `cd $T && LABEL=apres-b OUT=$T/out RUN=b node z.mjs` (étapes b-ortho-max → b-persp-1cran)

## Vérifié comment
- renderer → `ANGLE (NVIDIA, Vulkan 1.4.329 (NVIDIA NVIDIA GeForce RTX 4070 Ti (0x00002782)), NVIDIA)` (toutes les sessions)
- pageerror → 0 sur 15 runs (z ×7, exp ×2, e ×4, h ×3, bench ×2) ; HTTP : 200/304 + 404 préexistants (thumbnail 201/202, multi-pack.json, camera_params.json, presentation.json, 3dgs/data/mesh/*.ply ×33, branding.json) ; 0 5xx
- builds → `vite build --outDir $T/dist-apres` exit 0 ; `$T/dist-avant` (git archive HEAD) exit 0 ; `grep -c "Charge une seule fois" dist-avant/viewer.html dist-apres/viewer.html` → 0 / 1
- `npx tsc --noEmit -p tsconfig.viewer.json` → `tsc exit=0`
- `npx vitest run src/viewer/core src/viewer/loaders/lcc2` → `Test Files 26 passed (26) · Tests 171 passed (171)`
- diff relu : `git -C G diff web/src/viewer/core/{SceneManager,EDLRenderer,navigationScheme}.ts` ; edlSize.ts, Lcc2Loader.ts:115-180 lus ; compteur `countingEngine` conforme contrat (dispose après `disposed` non compté)
- Z : `$T/z.mjs` (RUN a|b|c, NAV=mode2) → `$T/out/{apres,avant}-{a,b,c}.json`, `apres-c2.json` (mode2), PNG `$T/out/<label>-<étape>.png` ; zoom lu via `window.__cam` (événement `glr:active-camera`, APRÈS seulement) ; AVANT zoom ortho NV (caméra non exposée)
- Z2 contrôle : `$T/exp.mjs` → `$T/out/apres-exp-{ortho,persp}.json` (dx 0.08 % / −0.04 %)
- Z6 : `$T/h.mjs` → `$T/out/{apres,avant}-h.json` + PNG `*-h-apres-_data_view_*.png`
- E1 : `$T/e.mjs` (espion GL viewport/texStorage/bindFramebuffer) → `$T/out/{avant,apres}-e-dpr{1,2}.json`, `*-buffer.png` ; `node cmp.mjs` → `{"n":0,"maxd":0,"bbox":null,"total":4521532}` / `{"n":0,…,"total":1130383}`
- S1 : `$T/bench.mjs` (copie T006, BASE 5182, REOPEN=1) → `$T/out3/apres-{fluid,stream}.json` ; fluid « après arrêt » 5/9 paires ≠ décroissantes 38348→34→0 en 1 s (amorti caméra, 0 req, lodChanges 0)
- nettoyage → `kill` pids 4012/5182 ; `ss -ltn | grep -E ':(4012|5182)\b'` → ∅ ; `find G -newer genply.mjs` (hors node_modules/.git) → ∅ ; 0 commit

## Écarts
- lecture hors WL : `G/web/src/viewer/core/SceneManager.ts:935-1075, 585-610, 60-70, 1880-1905` — togglePerspective/rebind/handleResize/boucle de rendu (D1, D2, D3)
- lecture hors WL : `G/web/src/viewer/main.ts:7600-7632` — condition `hasPointCloud` (E1 bloquant)
- lecture hors WL : `G/web/src/viewer/core/RenderModeManager.ts:335-360` — recherche appel EDL (D2)
- budget 3 dépassé d'1 (4 fichiers) — D2 exigeait prouver l'absence d'appel ; greps `rg` en plus
- 1er run z.mjs invalide (boîte canvas lue avant layout ⇒ curseur décalé 140 px) ; corrigé, relancé, seuls les runs corrigés comptent

## Pour la suite
- D1 : réinitialiser/ajuster `orthoCamera.zoom` dans animateCamera/setView/fit (ou fitToBox camera-controls) en ortho
- D2 : décider brancher l'EDL dans la boucle (`hasPointCloud && edlEnabled`) ou retirer EDLRenderer/edlSize ; refaire E1 seulement après
- D3 : `maxZoom = height / (0.5 · 2·tan(fov/2))` ou clamp `perspDist ≥ minDistance` à O→P
- hypothèse NV : resize fenêtre en ortho ⇒ min/maxZoom figés à la hauteur du toggle ; picking ortho zoomé (seuil `computePickingThreshold` sur distance)

## Retour sur le pack
- Manquait : `edlRenderer.render` jamais appelé (prémisse E1 fausse) ; `__glrTest.camLen()` = |camPos| (distance à l'origine, pas au target) ; zoom ortho lisible via événement `glr:active-camera` (APRÈS) ; Explorer en 3D n'ouvre aucun livrable (clic `[data-deliverable-id]` requis) ; `sceneProbe().nCloudPoints` = 0 pour PLY (ne détecte pas le nuage)
- Inutile : `PLYLoader.ts` (format standard suffisait), addlcc2.mjs (2 lignes)
