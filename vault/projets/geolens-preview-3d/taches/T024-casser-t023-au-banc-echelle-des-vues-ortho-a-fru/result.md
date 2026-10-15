---
tache: T024
statut: fait
verdict: OK
---
## Mesures
| id | métrique | T022 (avant T023) | après |
|---|---|---|---|
| frustum | px/m sauvé → restauré (fr 294,5 → 532,3) | 128,233 → 70,951 | 128,280 → 128,280 (0 %) |
| mt100 | après vol : type · zoom · 🏠 px/m | Persp · 44,080 · 70,962 | Persp · 1,000 · 1,610 |
| mt300 | idem | Persp · 44,080 · 70,962 | Persp · 1,000 · 1,610 |
| mt600 | idem | — | Persp · 1,000 · 1,610 |
| mt900 | idem (bascule APRÈS fin du vol ~980 ms) | — | Persp · 1,000 · 9,662 (cf. Pour la suite) |
| mtP300/600 | P→O en vol : type · zoom · zDist | — | Ortho · 1,657/1,078 · = zoom |
| dbltoggle | O→P→O en vol (DT 250/150) | — | Ortho · zoom 1,428 = zDist · 2,910 px/m |
| persp2ortho | vue persp en ortho : zoom / zDist | conforme | 3,425 / 3,425 |
| ortho2persp | vue ortho en persp : pos/cible | conforme | 188.998,103.299,141.503 / 27.998,-11.701,-19.497 = sauvé |
| wheelafter | restaure ×3 + double vol 200 ms | conforme | 128,309 ×4 = sauvé |
| fly | frames · sauts×2 · nonMono · durée | conforme | 239 · 0 · 0 · 988 ms ; contenu PNG 0,053→0,060→0,136→0,230→0,597 |
| inject | `zoom` résiduel (old,-1,"x",null,0,1e9,44.086) | gardées | 7/7 listées, zoom = zDist 1,572 |
| inject2 | orthoHeight -1,"x",null,0,"6.68",1e400,absent | — | 11/11 listées ; invalides ⇒ zoom = zDist 1,572 |
| inject2 | orthoHeight 6.68 (± `zoom:3`) | — | 128,293 px/m (= 857/6,68) |
| maxzoom | oh 1e-6 / 1e6 → zoom ; +5 crans | — | 801,904 / 0,040 ; inchangés ⇒ butées max/min |
| o3 | toolbar `#tool-zoom-in` | ouverture terminée + gel | `8648:ouverture terminée (pointerdown)`,`8650:gel`,`11638:reprise` |
| O1 | req/4 s · gel O1 · pageerror | ≥ 300 · 0 · 0 | 401 · 0 · 0 |
## Défauts
- ∅ (T023)
## Vérifié comment
- T=`/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t024.sPuc` ; build neuf `npx vite build --outDir $T/dist-apres` → `✓ built in 14.73s` ; `grep -c orthoHeight dist-apres/assets/main-CJlR1Ur7.js` → 2
- bench `DEPTH=6 TEX=512` → `1365 glb (51020 Kio)` ; API 4013 pid 2371403, web 5183 pid 2371384
- renderer → `ANGLE (NVIDIA, Vulkan 1.4.329 (NVIDIA NVIDIA GeForce RTX 4070 Ti (0x00002782)), NVIDIA)` ; pe 0 tous runs ; ce 7–9 = 404 bench (thumbnail, multi-pack.json, camera_params.json, presentation.json)
- `CASE=frustum node sv2.mjs` → `o-z12 Ortho zoom 44.089 pxm 128.280` · `ls oh 6.6807` · `o-restaure Ortho zoom 79.684 zDist 1.807 pxm 128.280 {"frAvant":294.54,"frApres":532.35}`
- `CASE=midtoggle DT=300` → `apres-vol-bascule Persp zoom 1.000 pxm 2.910 d 255.08 pos 188.862,103.357,141.597` · `re-bascule Ortho zoom 1.000 pxm 4.386` · `re-re-bascule Persp 4.386` · `home-final Persp pxm 1.610 pos 288,216.225,288`
- DT=100/600 → idem (Persp 1.000, home 1.610) ; DT=900 → `apres-vol-bascule Persp zoom 1.000 pxm 128.274 d 5.79` · `home-final pxm 9.662 pos 50,30,50`
- `sv3.mjs CASE=homeclosePonly` (0 vue, 0 ortho : 14 crans persp → h) → `p-z14 d 0.82` · `p-home pxm 9.662 pos 50,30,50 tgt 0,0,0` ⇒ hors T023
- PNG : `$T/out/mt300/midtoggle-{apres-vol-bascule,re-bascule,re-re-bascule}.png` lus : plan entier, échelle saine ; `$T/out/fly/fly-{0..4}.png`
- JSON : `$T/out/{fr,mt100,mt300,mt600,mt900,mtP300,mtP600,persp2ortho,ortho2persp,fly,wheelafter,inject,inject2,maxzoom,homeclose,homeclosePonly,dbltoggle,o3,o}/`
- `npx tsc --noEmit -p tsconfig.viewer.json` → exit 0
- `npx vitest run src/viewer/ui/savedViewZoom.test.ts src/viewer/core` → `Test Files 23 passed (23) · Tests 164 passed (164)` ; savedViewZoom seul → `9 passed`
- relecture `git diff savedViews.ts` : parse filtre `isValidHeight`, retire `zoom` ; save `orthoHeight` si ortho après `update(1e3)` ; flyTo latch `zoomLive=false` si `sm.camera !== startCam` ; zoomTo après setLookAt — conforme contrat
- G : `git status --short` + `git diff --stat` avant/après → identiques ; 0 commit
- `ss -ltnp | grep -E ':(4013|5183)\b'` → ∅ (exit 1) ; `pgrep tsx|vite preview 5183` → ∅
## Écarts
- lecture hors WL : `G/web/src/viewer/ui/savedViewZoom.test.ts` — `grep -c` seul, test non vide (9)
- `sv2.mjs` copié dans $T : log `oh` ajouté à `save()` ; `sv3.mjs` = sv2 + cas inject2/maxzoom/homeclose/homeclosePonly/dbltoggle
## Pour la suite
- 🏠 en persp depuis d ≲ 5 m → pos 50,30,50 tgt 0 (9,662 px/m) au lieu de 288,216,288 (1,61) ; repro sans vue : `sv3.mjs CASE=homeclosePonly` ; hors T023, NV cause
- O→P→O pendant le vol : latch ⇒ fin à zoom = distance (2,91 px/m), pas l'échelle sauvée ; attendu par contrat, à trancher UX
- localStorage garde les champs invalides/`zoom` bruts jusqu'au prochain persist (parse filtre en mémoire) ; 0 impact observé
## Retour sur le pack
- Manquait: sélecteur o3 « toolbar » (pris `view:#tool-zoom-in`) ; `OBS_MS` O1 (pris 12000) ; sv2 `inject` n'injecte que `zoom`, pas `orthoHeight` (variante écrite)
- Inutile: ∅
