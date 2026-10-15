---
tache: T022
statut: fait
verdict: DÉFAUTS
tags: [result]
---
## Mesures
| id | métrique | T020 (avant T021) | après |
|---|---|---|---|
| D1 | zoom restauré / sauvé (même frustum) | 1,000 / 44,087 | 44,086 / 44,086 ; px/m 128,273 = 128,273 |
| D1-P→O | vue persp restaurée en ortho | — | zoom 3,425 = zDist 3,425 ; px/m 34,127 = sauvé 34,127 |
| D1-O→P | vue ortho restaurée en persp | — | pos/cible exactes, 0 pageerror |
| D1-inj | old/−1/"x"/null/0 | — | 5/5 listées, zoom = zDist 1,572 ; 1e9 ⇒ borné 801,9 |
| D1-vol | px/m par image, vol 941 ms | — | 49 pas, monotone, 0 saut ×2, 5 PNG |
| D1-frustum | px/m restauré, frustum ortho ≠ | — | **70,951 vs 128,233 sauvé (KO)** |
| D1-bascule | zoom persp après `5` en plein vol | — | **44,080 persistant (KO)** |
| D2 | 1re entrée toolbar `top` | 722 req, 0 gel | ouverture terminée (pointerdown) +6 ms gel ; 0 req pendant gel 2867 ms |
| D2-accueil | wheel/clic/touche sous accueil, puis Explorer | — | openingExempt true, 0 log ; 1re wheel après ⇒ `ouverture terminée (wheel)` |
| D3 | `__glrMotionGate` dès création | undefined ×138 | 0 null / 140 éch. ; 1er = `{allowed:true,transitions:0,purged:0,openingExempt:true}` |
| O1 | req 4 s / gel ouverture | 401 / 0 | 401 / 0 ; caméra 25 changements, mj 12 constant |
| O2 | drag milieu 3 s | 0 req | 0 req ; mj 0 ×11/12 |
| V1 | Accueil après zoom ortho | zoom 0,55 fond 89 % | zoom 0,55 fond 89 % |
| V2 | persp depuis ortho max | 0,500 m | 0,500 m |

## Défauts
- D1-frustum (grave, case DoD « px/m ≈ sauvé ») · `web/src/viewer/ui/savedViews.ts:448-472` stocke `camera.zoom` brut ; frustum ortho = f(distance à la bascule P→O), non stocké · repro : `5` à d 255 → 12 crans → enregistrer (zoom 44,073, px/m 128,233, frustum 294,5) → `5` → `h` (d 461) → `5` (frustum 532,3) → clic vue · attendu px/m ≈ 128,2 · obtenu zoom 44,073, px/m 70,951 (×0,553 = 294,5/532,3). Idem injecté : session p0 d 400,95 ⇒ 81,606 au lieu de 128,273.
  `cd $T && BASE=http://localhost:5183 CASE=frustum OUT=$T/out/fr node sv2.mjs`
- D1-bascule (persistant jusqu'au rechargement) · `savedViews.ts:156` `isOrtho` figé au départ ; `:183-184` `zoomTo` appliqué à la caméra active même devenue persp · repro : vue ortho zoom 44 enregistrée → `h` → clic vue → `5` à +300 ms · attendu persp zoom 1 · obtenu PerspectiveCamera zoom 44,080 ; px/m 128,253 ; puis 🏠 persp px/m 70,962 (normal 1,61) ; survit à O→P→O ; PNG `out/mt/midtoggle-home-final.png` (téléobjectif ×44)
  `cd $T && BASE=http://localhost:5183 CASE=midtoggle DT=300 OUT=$T/out/mt node sv2.mjs`

## Vérifié comment
`T=/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t022.hMQF` · scripts T020 copiés + `sv2.mjs`, `o3b.mjs` (o3 + compteurs gel), `o4.mjs` (accueil) ; `lib.mjs` BASE défaut 5182 ⇒ `BASE=http://localhost:5183` passé
- `bench-tileset.mjs` → `1365 glb (51020 Kio), DEPTH=6 TEX=512`
- `npx vite build --outDir $T/dist-apres` → exit=0 `✓ built in 15.85s` ; `grep -l "ouverture terminée" dist-apres/assets/*.js` → `main-DF9kbl2U.js`
- `npx tsc --noEmit -p tsconfig.viewer.json` → tsc_exit=0, 0 ligne
- `npx vitest run src/viewer/core src/viewer/ui/savedViewZoom.test.ts` → `Test Files 23 passed (23) Tests 162 passed (162)`
- renderer : `ANGLE (NVIDIA, Vulkan 1.4.329 (NVIDIA NVIDIA GeForce RTX 4070 Ti (0x00002782)), NVIDIA)`
- `node sv.mjs` → `o-z12 Ortho zoom 44.086 pxm 128.273` · ls `"zoom":44.086461641922774` · `o-restaure Ortho zoom 44.086 pxm 128.273` · `pe 0`
- `CASE=persp2ortho` → `o-restaure-vueP Ortho zoom 3.425 zDist 3.425 pxm 34.127` (sauvé `p-z6 pxm 34.127`)
- `CASE=ortho2persp` → `p-restaure-vueO Persp pos 188.998,103.299,141.503 tgt 27.998,-11.701,-19.497` = sauvé ; pe 0
- `CASE=inject` → `vues listées ["old","neg","str","nul","zero","big","ok"]` ; `o-old|neg|str|nul|zero zoom 1.572 zDist 1.572` ; `o-big zoom 801.904` ; `o-ok zoom 44.086 pxm 81.606`
- `CASE=fly` → `frames 234 framesChange 49 durée 941 sauts×2 0 nonMonotone 0` ; PNG `out/sv2/fly-0..4.png`
- `CASE=wheelafter` → 1 cran `55.757→84.044` (pas de rappel) ; restaure ×2 + double vol `zoom 55.757 pxm 162.228` ; O→P `pxm 162.228`
- `CASE='view:[data-view="top"]' WAIT=3500 node o3b.mjs` → `4143:ouverture terminée (pointerdown)`,`4149:gel`,`7016:reprise` ; `reqGelReprise 0 req[clic,gel] 42 gelDuree 2867` ; pageErrors 0
- `MODE=explore node o4.mjs` → sous accueil `openingExempt:true log:[]` ; après Explorer idem ; 1re wheel `["ouverture terminée (wheel)","gel"]`
- `LABEL=o1 node o.mjs` → `trT -3799 req4s_fromTr 401 gelO1 0 exemptO1 [true] reqDuringDrag 0 dragMid mj [12,0×11] pageErrors []` ; loader créé 3,8 s AVANT Explorer ⇒ pointerdown Explorer réellement filtré
- `SELS=home,top,front,iso,recadrer node h.mjs` → `home zoom 0.55 pxPerM 1.61 fond% 89` ; pe []
- `RUN=b node z.mjs` → `b-persp-depuis-max pxm 1484.903 dist 0.5` ; pe []
- relecture `git -C G diff` 3 fichiers + `savedViewZoom.ts` : `endsOpening` + capture document ; `gateMoveStamp` ; horloges `performance.now()` des 2 côtés ; `removeOpeningListeners` dans `dispose`
- `diff gstatus-avant gstatus-apres` → `G_inchange` ; `web/dist` mtime 2026-10-13 (non touché)
- `kill 2309453 2309420` ; `ss -ltnp | grep -E ':(4013|5183)\b'` → ∅ (exit 1)

## Écarts
- ∅ lecture hors WL (relecture via `git diff -U40` des 3 fichiers listés DoD)
- scripts ajoutés dans $T : `sv2.mjs`, `o3b.mjs`, `o4.mjs`

## Pour la suite
- D1-frustum : stocker l'échelle (px/m ou hauteur frustum/zoom) plutôt que `zoom` brut ; décision architecte
- D1-bascule : relire le type de caméra à chaque pas (ou annuler le vol sur bascule P/O)
- vue ortho restaurée en persp : position brute d 255 ⇒ px/m 2,91 vs 162 vu à l'enregistrement (conforme contrat, UX discutable)
- `#tool-zoom-in/out` en ortho : zoom 44,086 inchangé, px/m inchangé (distance seule bouge) — hors T021, à trancher
- Escape ne ferme pas l'accueil (body garde `gx-home-open`) — neutre pour D2

## Retour sur le pack
- Manquait : `lib.mjs` BASE défaut 5182 ≠ 5183 (à signaler) ; clé localStorage `glr.savedViews.pkg:synthetique|::tileset.json` ; nom de vue via `input:focus` (pas de dialog)
- Inutile : ∅
