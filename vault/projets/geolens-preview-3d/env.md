---
projet: geolens-preview-3d
maj: 2026-10-15
tags: [env]
---

# Environnement — geolens-preview-3d

Conventions : [[conventions-geolens]], [[geolens-banc-preview-3d]] (non recopiées). Format : `fait — source`.

## Dépôts et branches
- G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` ; git local, branche `master` — geolens-preview-3d/T001
- arbre sale attendu (C3 non commité, e2e/bench-*, fichiers lcc2 non suivis) : ne rien annuler — geolens-preview-3d/T009, geolens-preview-3d/T015
- HEAD `345a7a0` (T019-T023), `b551616` (T026) → `git -C G log --oneline -1` — geolens-preview-3d/T019, geolens-preview-3d/T026
- modules neufs non suivis (`splatLodMode.ts`, `Lcc2FluidStreamer.ts`, 3 modules T010) : `git diff` vide, `git archive` les exclut → lire en entier — geolens-preview-3d/T006, geolens-preview-3d/T010
- un autre agent édite en parallèle `SceneManager`/`EDLRenderer`/`navigationScheme`/`TilesRendererLoader`/`motionGate` : ne pas y toucher — geolens-preview-3d/T015, geolens-preview-3d/T019

## Lancer, tester, linter
- tests : `npm test` (vitest env node, 0 jsdom) ; 194 fichiers / 1826 tests (T017) → 196 / 1849 (T024) — geolens-preview-3d/T024
- typecheck viewer : `npx tsc --noEmit -p tsconfig.viewer.json` ; `npm run typecheck` exclut `src/viewer` — geolens-preview-3d/T008
- eslint ignore `src/viewer` : lint non probant — geolens-preview-3d/T001
- `SceneManager.ts` 1971 l : lire par plages (`sed -n`) — geolens-preview-3d/T016
- `Lcc2Streamer.start()` appelle `requestAnimationFrame` → inutilisable en test node — geolens-preview-3d/T005
- règles G : fonction ≤ 60 l, fichier neuf ≤ 400 l, 0 `any`, 0 `@ts-ignore` — geolens-preview-3d/T009
- banc : `BASE` obligatoire (`Error: BASE obligatoire`) ; sortie `OUT` (déf `./out-bench`) — geolens-preview-3d/T026

## Comptes et données de test
- tileset banc : `STORE=$T/storage DEPTH=6 TEX=512 node e2e/bench-tileset.mjs` → 1365 glb (51020 Kio) ; `project.json` synthétique, `deliverables[]` requis — geolens-preview-3d/T002, geolens-preview-3d/T035
- jeu splat : 7,4 M splats (`S` 234 Mo, 63 fichiers `APT.lcc2`, `data/`, `info/`) — geolens-preview-3d/T004, geolens-preview-3d/T006
- preset forcé : `localStorage['glr.settings.v1']={version:1,qualityPreset:'standard',userOverridden:true}` (+ `gaussianSplatBeta:true` pour le splat) — geolens-preview-3d/T002, geolens-preview-3d/T006
- 100 % détail : `localStorage['geolens.splatDetailPct']='100'` (défaut 30) — geolens-preview-3d/T006
- livrable auto-ouvert à l'accueil : clic `#gx-home-explore` puis `el.click()` sur `[data-deliverable-id]` — geolens-preview-3d/T006, geolens-preview-3d/T017
- souris : gauche = pan, milieu = orbite (`navigationScheme.ts:26`) — geolens-preview-3d/T002, geolens-preview-3d/T003

## Versions
- node v22.22.1 ; playwright-core 1.61.0 (`G/e2e/node_modules`) ; chromium(_headless_shell)-1228 — geolens-preview-3d/T010
- 3d-tiles-renderer 0.3.46 : `FAILED = -1` (≠ 4 du commentaire Loader:793) ; `resetFailedTiles()` remet `stats.failed = 0` — geolens-preview-3d/T002, geolens-preview-3d/T009
- machine : 16 cœurs, GPU RTX 4070 Ti ; headless défaut SwiftShader (fps 5-7, stabilisation 90-121 s) — geolens-preview-3d/T002, geolens-preview-3d/T010
- GPU réel : `channel: 'chromium'`, `--enable-gpu --use-angle=vulkan` ; preset par défaut = maximale — geolens-preview-3d/T010, geolens-preview-3d/T012

## Ports, URL, fuseau
- bancs : API `:4010+n` / front `:5180+n` (ex. `:5182`, `:5183`, `:5185`, `:5188`) ; plage `:4011-4013` — geolens-preview-3d/T002, geolens-preview-3d/T006
- `lib.mjs` : BASE défaut `5182` ≠ `5183` — geolens-preview-3d/T022
- H: `:5183` = stack e2e OrthoPro interdite — conventions-orthopro:L17 ; `:5173`, `:4000` OrthoPro intouchables — geolens-viewer/T033
- machine chargée par d'autres bancs (load 50-76) → durées absolues bruitées, comparer états/compteurs, 2 runs min/max — geolens-preview-3d/T003, geolens-preview-3d/T014

## Rouge d'avance
- seuils VRAM (std 4000 textures) : H2/H3 inatteignables avec `DEPTH=6` — geolens-preview-3d/T002
- parse SwiftShader ≈ 4 tuiles/s à TEX512 : « 15 s à l'arrêt » ne converge pas au banc — geolens-preview-3d/T002
- `bench-t003.mjs` codé SwiftShader + `FLOOR = 1` (plancher actuel 0,5) — geolens-preview-3d/T012
- Cache Storage inactif en http → tuiles `loaded` sans requête réseau — geolens-preview-3d/T008

## Interdits
- `page.screenshot` réapplique la DSF Playwright (efface l'override CDP) — geolens-preview-3d/T008
- `pkill` global ; dossier jetable `T` par tâche, kill par PID — [[geolens-banc-preview-3d]]
- `STORE` sous `seed-data` (refusé par `bench-tileset.mjs:23-25`) — geolens-preview-3d/T001

## Bancs et scripts de référence
- `G/e2e/bench-preview/*.mjs` (12 fichiers, `lib.mjs`, README) ; `node --check` rc 0 — geolens-preview-3d/T026
- `G/e2e/bench-tileset.mjs`, `bench-3d.mjs`, `_proofEnv.mjs` — geolens-preview-3d/T001, geolens-preview-3d/T003
- sondes window : `__glrTest.camLen()` = |camPos| (≠ distance au target) ; `sceneProbe().nCloudPoints` = 0 pour PLY — geolens-preview-3d/T017
