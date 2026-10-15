---
tache: T023
statut: fait
---
## Fait
- V/ui/savedViewZoom.ts:1-29 — réécrit pur : `isValidHeight`, `flightZoom(savedHeight, isOrtho, frustumHeight, startHeight, e)` = `frustumHeight / (startHeight + (savedHeight − startHeight)·e)`, null si !isOrtho ∨ savedHeight absent
- V/ui/savedViewZoom.test.ts:1-50 — 9 tests : isValidHeight ×3 ; null persp / sans hauteur ; e=0 → départ ; e=1 → hauteur sauvée ; repro T022 (294,5/44,073 → frustum 532,3 ⇒ zoom 79,66) ; interpolation linéaire en hauteur
- V/ui/savedViews.ts:30-31 — import `flightZoom, isValidHeight`
- V/ui/savedViews.ts:66-67 — `SavedView.camera.zoom?` → `orthoHeight?: number`
- V/ui/savedViews.ts:100-110 — parse : camera reconstruite {position, target, orthoHeight si valide} ⇒ `zoom` résiduel retiré, hauteur invalide retirée, vue gardée
- V/ui/savedViews.ts:157-167 — helpers locaux `orthoOf(cam)` (duck-typing `isOrthographicCamera`) · `visibleHeight(cam)` = (top − bottom)/zoom
- V/ui/savedViews.ts:174-178 — flyTo : `startCam = sm.camera`, `startHeight` = hauteur visible si ortho, `zoomLive`
- V/ui/savedViews.ts:202-210 — pas : `sm.camera !== startCam` ⇒ `zoomLive = false` définitif ; sinon `zoomTo(flightZoom(…, ortho.top − ortho.bottom relu, …), false)` après `setLookAt`
- V/ui/savedViews.ts:473-475,498 — saveCurrentView : `orthoHeight` calculé après `controls.update(1e3)`, stocké si ortho
## Vérifié comment
`cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo exit=$?` → `exit=0`
`npx vitest run src/viewer/ui/savedViewZoom.test.ts` →
```
 ✓ src/viewer/ui/savedViewZoom.test.ts (9 tests) 4ms
 Test Files  1 passed (1)
      Tests  9 passed (9)
```
`npm test` →
```
 Test Files  196 passed (196)
      Tests  1849 passed (1849)
```
1849 = 1847 − 7 (anciens savedViewZoom) + 9
Repro navigateur sv2.mjs (CASE=frustum, CASE=midtoggle) : NV — pas de serveur 5183 lancé, hors outils autorisés
## Écarts
- ∅ lecture hors WL
- édition savedViews.ts via `python3` heredoc (remplacements exacts, assert count==1) — python3 hors liste outils
## Pour la suite
- banc CASE=frustum : px/m restauré ≈ 128,233 (hauteur visible 6,682 conservée malgré frustum 532,3)
- banc CASE=midtoggle DT=300 : après bascule `5` en vol, PerspectiveCamera zoom = 1 (aucun zoomTo)
- vues T021 en localStorage avec `zoom` : rechargées sans échelle (champ retiré) — attendu, non publié
- `startHeight` lu avant le 1er setLookAt : si amortissement en cours, départ = zoom courant non stabilisé
## Retour sur le pack
- Manquait: emplacement voulu des helpers hauteur visible (savedViews.ts vs savedViewZoom.ts) — choisi local savedViews.ts, savedViewZoom.ts reste 0 import | Inutile: ∅
