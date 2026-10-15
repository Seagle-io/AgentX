---
tache: T006
statut: fait
verdict: DÉFAUTS
---
Verdict : DÉFAUTS — 2 mineurs. Cœur T005 confirmé : fluid = 0 req, 0 clignotement.

## Mesures avant/après
T = /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t006.ZVgg ; GPU matériel, 1600×1000, détail 100 %, preset standard

| métrique | avant (HEAD) | après (arbre) |
|---|---|---|
| mode 'fluid' demandé | clé ignorée (HEAD ∅ mode fluid) ⇒ fixed | `fluid : pleine qualité depth=5` |
| console fin de chargement | `14/14 tuiles, 7 388 760 splats, depth 5/5, 6515 ms` | `14/14 tuiles, 7 388 760 splats, depth 5/5, 6064 ms` |
| req .sog chargement initial | 15 (14 + env.sog) | 15 (14 + env.sog) |
| req .sog pendant parcours 31,6 s (fluid) | 0 | 0 |
| req .sog pendant parcours (stream : AVANT clé legacy `splatStreaming=1`, APRÈS `'stream'`) | 5 | 5 |
| `__glrSplatStats` init → fin parcours (fluid) | ∅ (absent HEAD) | `{14,0,0}` → `{14,0,0}` : Δloads 0, Δfrees 0, lodChanges 0 |
| `glr:fluid-budget-drop` · warns `[lcc2-fluid]` | 0 · 0 | 0 · 0 |
| frame time parcours p50/p99/max (ms) | 16.7 / 16.8 / 17 | 16.7 / 16.8 / 50 |
| fixed, détail absent (budget standard) | NV | depth 2, `920 024 splats ≤ budget 1 512 126` |
| fluid, détail absent (budget standard) | n/a | depth 5, 7 388 760 splats (budget ignoré, voulu D3) |
| stream démarre | base depth 1, 459 029 splats | base depth 1, 459 029 splats, `[stream] chargées=6` |
| pageerror · statuts HTTP | 0 · 200 ×51, 404 ×38 | 0 · 200 ×51, 404 ×38 |

- 404 ×38 = thumbnail ×2, multi-pack.json ×3, camera_params.json, branding.json, `3dgs/data/mesh/*.ply` ×31 ; 0 sur `.sog`/`.lcc2` — identique avant/après

## Clignotement
10 captures canvas / 200 ms ; paires consécutives non identiques (octets PNG, puis diff pixels)
- immobile 5 s après chargement · avant(HEAD, depth 5) 0/9 · après fluid 0/9
- immobile 5 s, stream · avant 0/9 · après 0/9
- arrêt 3 s en vue rapprochée (après molette avant) · avant(HEAD) 0/9, legacy-stream 0/9 · après fluid 0/9, stream 0/9
- t=0 juste après arrêt · avant 6/9 `55919,47597,13680,800,36,36,0,0,0` · après fluid 6/9 `55801,47311,16567,624,59,63,0,0,0`
  - décroissance monotone → 0 en 1,2 s ⇒ amortissement caméra, ≠ clignotement ; fixed (5/9) même profil

## Défauts
- D1 · aide UI du mode fluid décrit l'ancien streamer — `web/viewer.html:808`, `web/src/viewer/index.html:805`, `web/src/viewer/core/splatLodMode.ts:5-6`
  - repro : `grep -n "Affine la scène sous un budget fixe" $T/dist-apres/viewer.html` → `808:Affine la scène sous un budget fixe, sans trou ni clignotement : le détail arrive en fondu, les zones déjà vues restent en mémoire et le détail baisse seul si l'image saccade.`
  - attendu : texte = « tout chargé une fois, pleine qualité, sans budget »
  - obtenu : promet budget fixe, fondu, cache, régulateur ; mesuré : budget ignoré (7 388 760 > 1 512 126), 0 fondu, 0 baisse auto
- D2 · `window.__glrSplatStats` aveugle hors `loadLcc2Scene` — `Lcc2Loader.ts:123-130,160,209`
  - repro : `OUT=$T/out2 LABEL=apres-stream MODE=stream node $T/bench.mjs` → `req .sog après init=5 stats={"loads":1,"frees":0,"lodChanges":0}`
  - attendu (D4) : compteur loads/frees/lodChanges du banc
  - obtenu : loads streamer non comptés ; `lodChanges` jamais incrémenté (`grep -rn lodChanges web/src` → seulement L123/L127 déclaration) ; reset par chargement : réouverture livrable = 15 req, stats `{14,0,0}` inchangées (frees de l'ancienne scène perdus)
  - impact : preuve « Δloads=0, lodChanges=0 » tautologique ; seule preuve valide = compte réseau (0)

## Vérifié comment
- renderer : `ANGLE (NVIDIA, Vulkan 1.4.329 (NVIDIA NVIDIA GeForce RTX 4070 Ti (0x00002782)), NVIDIA)` (args `--enable-gpu --use-angle=vulkan --ignore-gpu-blocklist`)
- `cd G/web && npx vitest run src/viewer/loaders/lcc2` → `Test Files  5 passed (5)` · `Tests  28 passed (28)`
- builds : `vite build --outDir $T/dist-apres` → `✓ built in 53.59s` ; dist-avant (git archive HEAD) → `✓ built in 49.05s`
- `git -C G diff` 3 fichiers relu : fluid = `levels[length-1]`, `startLiveStreamer` null hors 'stream', 0 import `Lcc2FluidStreamer` (code mort, non suivi)
- `git -C G grep -n "splatLodMode|Lcc2FluidStreamer" HEAD -- web/src` → 0 ; HEAD : seulement `geolens.splatStreaming`
- `OUT=$T/out2 LABEL=apres-fluid MODE=fluid node $T/bench.mjs` → `init : 15 req .sog, stats={"loads":14,"frees":0,"lodChanges":0}` · `immobile : non identiques 0/9 pixMax=0` · `parcours 31563 ms : req .sog après init=0 stats={"loads":14,"frees":0,"lodChanges":0}` · `proche 0` · `pageErrors=0`
- `LABEL=avant-legacy-stream` (preview dist-avant) → `req .sog après init=5`
- `LABEL=apres-fixed-detailnone MODE=fixed DETAIL=none` → `LCC2 : niveau depth=2 (920 024 splats ≤ budget 1 512 126)`
- `LABEL=apres-fluid-reopen REOPEN=1` → `reopen {"reqAjout":15,"loadsLog":1,"sameObj":true,"stats":{"loads":14,"frees":0,"lodChanges":0}}`
- poses identiques avant/après (`node $T/cmp.mjs $T/out`) : pose1 0/1 600 000 px ; pose2 255 px ; pose3 21 774 px (boucle molette bornée en temps ⇒ pose finale ≠)
- PNG : `$T/out/{avant-fluid,apres-fluid,avant-none,apres-none,apres-fixed,avant-legacy-stream,apres-stream}-pose{1-finchargement,2-milieu,3-finparcours}.png` ; vue rapprochée `$T/out2/*-pose15-proche.png` ; rafales `$T/out*/<label>-{immobile,apresarret,proche}-{0..9}.png`
- JSON : `$T/out/*.json`, `$T/out2/*.json`, `$T/out3/*.json` ; scripts `$T/bench.mjs`, `$T/png.mjs`, `$T/cmp.mjs`, `$T/addlcc2.mjs`
- fin : `kill 1554947 2040356` ; `ss -ltn | grep -E ':(4014|5184)\b'` → ∅ ; `git -C G status --short seed-data web/dist | wc -l` → 0

## Écarts
- lecture hors WL: `web/src/viewer/services/gaussianSplat/GaussianSplat.ts:30-60` — toast « Rendu 3DGS désactivé » bloquait le banc
- lecture hors WL: `web/src/viewer/core/SettingsManager.ts` (grep) — clé `glr.settings.v1`, `gaussianSplatBeta`
- lecture hors WL: `web/src/viewer/core/QualityPresets.ts` (grep) — id de preset valide (`standard`)
- lecture hors WL: `git diff SparkAdapter.ts splatEngine.ts` — LoD Spark interne ? ∅ (setOpacity seul) ; budget 3 dépassé de 1
- grep `web/src` (lodChanges, FLUID_BUDGET_DROP, texte toast) + `git grep HEAD` — localiser, sans ouverture de fichier
- AVANT ≠ pack : HEAD sans mode fluid ⇒ baseline « > 0 » mesurée en stream legacy

## Pour la suite
- fluid ignore le preset : `overBudget:false` à 7 388 760 > 1 512 126 (`Lcc2Loader.ts:97`, test L82) ; risque OOM machine `econome`/mobile, NV
- tuile `.sog` en échec en fluid : sautée sans réessai (`Lcc2Loader.ts:170-173`) ⇒ trou permanent, NV au banc
- `Lcc2FluidStreamer`, `lcc2BudgetGovernor`, écouteur `FLUID_BUDGET_DROP_EVENT` (`splatLodModeControl.ts:42`) : code mort non suivi, à supprimer ou geler
- réouverture du livrable : 121 Mo re-demandés (15 req) — cache navigateur NV
- changement de preset/curseur détail en fluid : recharge ? NV

## Retour sur le pack
- Manquait: flag bêta `localStorage['glr.settings.v1']={version:1,qualityPreset:'standard',userOverridden:true,gaussianSplatBeta:true}` (sinon toast, 0 chargement)
- Manquait: livrable auto-ouvert à l'accueil ; `[data-deliverable-id]` caché ⇒ clic `#gx-home-explore` puis `el.click()` via evaluate
- Manquait: HEAD ≠ « streamer fluide » — `splatLodMode.ts`, `Lcc2FluidStreamer.ts` non suivis, exclus de `git archive` ; AVANT réel = fixed
- Manquait: `splatDetailPct='100'` ⇒ budget `9 007 199 254 740 991` ⇒ fixed = depth 5 = fluid ; non-régression fixed exige détail absent
- Inutile: tileset synthétique DEPTH=2 (seul project.json sert)
