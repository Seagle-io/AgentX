---
pack: T008
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T008 — Casser T007 au banc : caméra active (ortho) et densité d'écran

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T007 : (1) en vue ortho le gel D24 se déclenche et le LOD suit la caméra ortho ; (2) le rendu respecte le devicePixelRatio réel (×1, ×2, ×3, sans plafond) et le relit quand il change. Banc headless local AVANT (HEAD) vs APRÈS (arbre de travail), captures + compte des requêtes. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] repro T035-D1 rejouée AVANT et APRÈS : ortho (touche `5`) puis drag 7 s pendant chargement (DEPTH=6) : transitions `[motion-gate]`, maxJobs échantillonné, requêtes pendant drag ; attendu APRÈS : gel + ~0 requête
- [ ] LOD en ortho : dézoom molette fort puis zoom fort en ortho : histogramme de profondeur visible avant/après (attendu APRÈS : change) ; `__glrTiles.cameras` contient la caméra ortho, pas la perspective ; retour `5` ⇒ perspective de nouveau suivie
- [ ] dpr : contextes `deviceScaleFactor` 1, 2, 3 : `__glrDiag().pixelRatio` et taille du drawing buffer du canvas (= CSS × dpr) AVANT vs APRÈS (attendu APRÈS ×3 = 3) ; captures PNG ×3 AVANT/APRÈS même pose
- [ ] changement de dpr en cours de session : CDP `Emulation.setDeviceMetricsOverride` (deviceScaleFactor 1 → 2) ⇒ pixelRatio relu (APRÈS) ; noter si l'émulation ne déclenche pas la media query (NON MESURABLE motivé)
- [ ] non-régression perspective : scénario `flux` T035 APRÈS : reqMouvement ≈ 0, reprise après arrêt ; 0 pageerror ; statuts 200/304
- [ ] relecture du diff T007 (`git -C G diff web/src/viewer/core/SceneManager.ts web/src/viewer/loaders/TilesRendererLoader.ts` + `core/pixelRatio.ts`) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 collé
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t035.t3i1/scen.mjs` | L | scénario T035 (FLUX, MODE=ortho) à copier dans $T |
| `G/e2e/bench-3d.mjs` | L | login, iframe |
| `G/e2e/bench-tileset.mjs` | L | DEPTH |
| `G/web/src/viewer/core/pixelRatio.ts` | L | contrat livré |
| `G/web/src/viewer/core/SceneManager.ts` | L | rg ciblé : watchPixelRatio, glr:active-camera |
| `G/web/src/viewer/loaders/TilesRendererLoader.ts` | L | rg ciblé : activeCamera |

## Contrats
T007 livré :
```
effectivePixelRatio(dpr) : fini > 0 ⇒ dpr, sinon 1 ; 0 plafond (SceneManager.ts:188)
SceneManager.watchPixelRatio() :549-557 matchMedia `(resolution: <dpr>dppx)` change ⇒ handleResize, réarmé ; handleResize relit dpr avant setSize/onViewportResize (:579-582)
togglePerspective émet window `glr:active-camera` {camera, previous} (:1012-1013)
Loader : activeCamera ; écouteur deleteCamera(previous)/setCamera(camera) (:208-217) ; pose Float64Array(32), pose + setResolutionFromRenderer sur activeCamera (:723-727, :764)
```
T035 (perspective, APRÈS gel) : reqMouvement 148 → 6 ; reprise ≈ 1,0-1,2 s après mouse.up (amortissement 0,6-0,8 s + 500 ms) ; D1 ortho : 0 transition, maxJobs 6 ×55, 216 req pendant 7,4 s de drag.
Hooks iframe : `window.__glrTiles` (`.cameras`, `.downloadQueue.maxJobs`, `.traverse`, tuile `__depth,__visible`) · `window.__glrDiag()` (pixelRatio) · `window.__glrTest.{cameraType,camPos}` · `window.__glrMotionGate` · console `[motion-gate] gel|reprise`.
Banc — commandes (ports DÉDIÉS T008 : API 4015, web 5185) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=6 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
mkdir -p $T/avant && git -C $G archive HEAD web | tar -x -C $T/avant && ln -s $G/web/node_modules $T/avant/web/node_modules
cd $T/avant/web && npx vite build --outDir $T/dist-avant > $T/build-avant.log 2>&1
cd $G/api && (PORT=4015 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5185 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4015 nohup npx vite preview --port 5185 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
# AVANT : relancer le preview avec --outDir $T/dist-avant
ss -ltnp | grep -E ':(4015|5185)\b' ; kill <pids> ; ss -ltn | grep -E ':(4015|5185)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run ; sortie PNG : `OUT` lu par _proofEnv (`$OUT`)
- AVANT = HEAD : sans gel ni T007 (comparer le LOD ortho et le dpr ; le gel n'existe pas en AVANT)

## Décisions actées
- D1 : dpr réel sans plafond ; D24 gel conservé
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; serveur de test ; commit, push
- EDLRenderer et pixel ratio (connu, tâche à venir) ; 3DGS (T006)
- ports 4000, 5173, 4010-4014, 5180-5184 (autres agents)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium_headless_shell-1228 installé ; SwiftShader lent (fps 5-7)
- `npm run typecheck` exclut src/viewer ⇒ typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json`
- d'autres bancs peuvent tourner ⇒ CPU partagé

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive, tar, ln, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T008
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures avant/après
| métrique | avant | après |
## Défauts
- D1 · repro · attendu · obtenu
## Vérifié comment
commande → sortie brute ; chemins PNG/JSON
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
