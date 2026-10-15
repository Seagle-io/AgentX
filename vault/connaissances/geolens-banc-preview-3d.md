---
titre: geolens — banc headless preview 3D (lancement, sondes, pièges)
resume: bench-tileset + build --outDir + API mémoire + vite preview + Playwright ; GPU réel ; sondes __glr* ; pièges
source: geolens-charge-3d T033-T035 · geolens-preview-3d T001-T024
cree: 2026-10-14
tags: [connaissance, geolens, banc]
---

# Banc preview 3D

G = `~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` · V = `G/web/src/viewer`
Outillage général : [[geolens-web-outillage]]

## Lancement (ports banc 4010+n / 5180+n ; 4000, 5173 = OrthoPro intouchables)
```
T=<dossier jetable>                     # 1 par tâche, kill par PID, jamais de pkill global
STORE=$T/storage DEPTH=6 TEX=512 node e2e/bench-tileset.mjs      # → 1365 glb ≈ 51 Mio ; refuse STORE sous seed-data
cd web && npx vite build --outDir $T/dist-apres                  # 15-55 s ; dist/ du dépôt jamais touché
cd api && PORT=4012 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$T/storage WEB_ORIGIN=http://localhost:5182 npx tsx src/index.ts   # ≠ npm run dev (tsx watch)
cd web && VITE_API_TARGET=http://localhost:4012 npx vite preview --outDir $T/dist-apres --port 5182 --host
BASE=http://localhost:5182 OUT=$T/out LABEL=ref node e2e/bench-3d.mjs
```
- AVANT : `git -C G archive HEAD web | tar -x -C $T/src-avant` puis build `--outDir $T/dist-avant` ; HEAD exclut les fichiers non suivis (modules neufs absents) ⇒ AVANT réel ≠ « arbre sans la tâche »
- nettoyage : `kill <pids>` ; `ss -ltn | grep -E ':(4012|5182)\b'` → ∅
- `e2e/lib.mjs` : BASE défaut `http://localhost:5182` ⇒ passer `BASE=` si autre port
- `e2e/bench-3d.mjs` : `DIR` vient de `_proofEnv.mjs` (OUT lu via env) ; scénario `principal` non probant si tout est chargé avant le drag ⇒ prévoir drag PENDANT chargement (scénario `flux`)
- projet seed `villelaure-real` id `0a1b2c3d-0000-4000-8000-000000000203`, admin `admin@demo.geolens.fr` / `demo1234`
- `project.json` doit contenir `deliverables[]` (sinon `[init] TypeError … filter`, bouton Explorer absent)
- chromium : `chromium_headless_shell-1228` installé ; playwright-core 1.61.0 (`e2e/node_modules`)

## Comptes / projet
| Réglage | Valeur | Effet |
|---|---|---|
| DEPTH=4 | 85 glb | tout chargé ≈ 14 s ⇒ 0 req mesurée, banc inutile |
| DEPTH=6 | 1365 glb | stresse streaming (preset standard) |
| DEPTH=7 TEX=8 | 5461 glb | H2/H3 (VRAM), 392 s |
| geometricError | 64,16,4,0 à DEPTH=4 | niveau « 1 » seulement si DEPTH ≥ 5 |
- repère : Y haut, viewer n'ajoute aucune rotation ; gltfUpAxis Y ⇒ (x,y,z)→(x,−z,y) ; box locale |c| < 1e6 (sinon branche ECEF)

## GPU
- défaut headless = SwiftShader ⇒ tier `integrated` ⇒ preset clampé `standard` (errorTarget 4→1, cache 1,0 GiB), 0,4-3 fps, jamais stable sous load machine 40-70
- GPU réel (RTX 4070 Ti) : `--enable-gpu --use-angle=vulkan --ignore-gpu-blocklist` → renderer `ANGLE (NVIDIA, Vulkan 1.4 … RTX 4070 Ti)` ; preset défaut = `maximale` 2560 Mio (1365 tuiles tiennent, 0 req dolly/pan) ⇒ forcer `PRESET=standard` pour H9/H11
- `TILECACHE=4000` plafonné à 1280 en standard
- toujours loguer le renderer dans `## Vérifié comment`

## Sondes (window)
| Sonde | Contenu |
|---|---|
| `__glrTiles` | `stats{parsing,downloading,failed,inFrustum,used,active,visible}`, `downloadQueue{items,maxJobs}`, `lruCache` ; `downloading` = file + jobs actifs ; FAILED = −1 (lib 0.3.46) |
| `__glrTileMem` · `__tileCount` | mémoire / compte tuiles |
| `__glrMotionGate` | `allowed`, `transitions` (+2 par geste), `openingExempt`, `purged` ; publié dès création du loader |
| `__glrSplatStats` | `loads`,`frees`,`lodChanges`,`opens` — cumulés : comparer en delta |
| `__glrTest` | `camPos()`, `camLen()` = \|camPos\| (distance à l'origine, ≠ au target) ; setter de pose |
| `__glrDiag` | diagnostic |
| événement `glr:active-camera` | caméra active + `zoom` (ortho) ; seul accès au zoom ortho |
- logs console : `[motion-gate] gel` · `reprise (immobile ≥ 500 ms)` · `ouverture terminée (<type>)` · `[tile-retry] relance n°k` · `purge n tuiles hors vue`
- `sceneProbe().nCloudPoints` = 0 pour PLY (ne détecte pas le nuage) ; `edlRenderer.render` jamais appelé (EDL jamais rendu)
- sondes via iframe de `viewer.html` ; contrôles non exposés ⇒ souris simulée sur `canvas`

## Souris (navigationScheme.ts:25-26, mode1)
- gauche = translation (pan) · milieu = orbite · droit/molette = dolly en persp, zoom en ortho (depuis T016)
- orbite ∝ nombre d'événements, pas distance : 530 px × 8 pas ≈ 180° ; pas ≤ 8 px
- clic hors canvas / x0+DX > 1920 : molette perdue

## Pièges
- accueil : livrable auto-ouvert ; `#gx-home-explore` puis `[data-deliverable-id]` caché ⇒ `el.click()` via evaluate ; body `gx-home-open` ; Escape ne ferme pas ; tileset chargé ≈ 3,7 s AVANT le clic Explorer
- 3DGS : sans `localStorage['glr.settings.v1']={version:1,qualityPreset:'standard',userOverridden:true,gaussianSplatBeta:true}` ⇒ toast « Rendu 3DGS désactivé », 0 chargement ; mode `localStorage['geolens.splatLodMode']='fluid'`
- vues enregistrées : clé `glr.savedViews.pkg:synthetique|::tileset.json` ; nom de vue via `input:focus` (pas de dialog)
- contexte Playwright neuf par run : tuiles immutable 24 h + Cache Storage ⇒ `loaded` monte sans requête
- `page.screenshot` réapplique la DSF Playwright (efface l'override CDP dpr) ; `matchMedia change` non émis sous CDP (dpr en session non mesurable)
- entrée Playwright sur canvas lève l'exemption d'ouverture (1re entrée = fin d'ouverture) ; clic Explorer non
- nuage seed `pnts` vide ⇒ générer un PLY
- animation d'entrée caméra = mouvement (gel/reprise avant tout drag)
- box canvas lue avant layout ⇒ curseur décalé 140 px : attendre layout
- 404 attendus (6-9) : multi-pack.json, camera_params.json, presentation.json, thumbnail, branding.json, `3dgs/data/mesh/*.ply`
- critère « net » : `dl===0 && pa===0 && q===0 && et===1` tenu ≥ 3 s
- gel : reprise réelle ≈ 1,0-1,2 s après mouse.up (amortissement 0,6-0,8 s + 500 ms)
- CPU partagé : load machine ⇒ fps 1-5, drags réduits

## Témoins (avant → après)
- ouverture sans gel : cadrage d'ouverture exempté ⇒ −3,9 à −4,1 s cascade d2+
- flux (DEPTH=6, drag pendant chargement, GPU) : reqMouvement 148 → 6 ; 138 → 13 (T008 ortho)
- H1 standard 600 Mio : changements ET 0 → 3, ET final 4, ratioMax 0,895 (garde 90 % + hystérésis 80 %)
- H4 anisotropie : histo {1: 436} → {16: 223}
- H15 503 sur tuile : trou définitif → `[tile-retry] relance n°1` à ≈ 2 s, backoff 2/4/8/16 s
- purge reprise : orbite proche `purge 23-24 tuiles hors vue`, `notUsedRest15 0`, `reRequested 0`, ET 0,5 à la reprise
- fluide 3DGS villelaure : 14 `.sog`, 7 388 760 splats, `{loads 14, frees 0, lodChanges 0}` ; legacy stream : 5 req après init
- ortho vues enregistrées : 44,086 zoom ⇔ 128,27 px/m restauré ; bascule en vol : Persp zoom = 1
- dpr ×3 : buffer ×9 ⇒ errorTarget px physiques, coût accepté

## Scripts réutilisables
- versionnés : `G/e2e/bench-tileset.mjs`, `G/e2e/bench-3d.mjs` (+ `lib.mjs`, `_proofEnv.mjs`)
- versionnés : `G/e2e/bench-preview/` (commit 2bf1f0e, README) — ouverture, ouverture-entree, vues-ortho, zoom-ortho, vues-enregistrees, 3dgs (+ajout-lcc2), nuage-ply, purge (+purge-analyse) ; `BASE` obligatoire, `OUT` déf `./out-bench`
- restes éphémères (non versionnés), sous `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/` = éphémère, ne pas s'y fier ; recopier ce qui sert dans `G/e2e/` : `t003.cFkC/bench-t003.mjs` (journal requêtes, net, orbite), `t022.hMQF/{sv,sv2,o3b,o4,h,z}.mjs` (vues enregistrées, ouverture, ortho), `t024.sPuc/sv3.mjs`, `/tmp/t012-4kOe/{bench-rm,rm,analyse}.mjs` (purge), `/tmp/t010-030t/probe.mjs` (SCEN h1|h4|h6|h15|gel)
- `bench-t003.mjs` : codé SwiftShader + `FLOOR=1` ⇒ avec plancher 0,5 `waitNet` ne conclut jamais ; passer `FLOOR=0.5`
