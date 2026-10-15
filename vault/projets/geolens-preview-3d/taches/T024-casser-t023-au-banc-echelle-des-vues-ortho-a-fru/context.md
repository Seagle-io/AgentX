---
pack: T024
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T024 — Casser T023 au banc : échelle des vues ortho, bascule pendant le vol

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T023 : une vue enregistrée en ortho restitue son échelle (px/m) même si le frustum ortho a changé depuis ; une bascule P/O pendant le vol ne laisse aucun zoom parasite. Rejouer les repro T022 sur un build NEUF de l'arbre de travail, GPU réel. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `CASE=frustum` : px/m restauré ≈ sauvé (±2 %) (T022 : sauvé 128,233, obtenu 70,951)
- [ ] `CASE=midtoggle DT=300` puis DT=100, 600, 900 : après le vol, `cameraType()` = PerspectiveCamera et zoom persp = 1 ; 🏠 en persp px/m normal (T022 : 1,61) ; O→P→O ensuite sans échelle aberrante (PNG)
- [ ] non-régression vues (cas conformes T022) : même frustum ⇒ px/m = sauvé ; vue persp restaurée en ortho ⇒ zoom = distance ; vue ortho restaurée en persp ⇒ pos/cible exactes ; vues injectées (`zoom` résiduel, `orthoHeight` −1, "x", null, 0) ⇒ gardées, chargées ; vol monotone sans saut (5 PNG) ; zoom borné (orthoHeight minuscule ⇒ maxZoom)
- [ ] non-régression rapide T018/T021 : `o3.mjs` toolbar ⇒ `ouverture terminée (pointerdown)` + gel ; `o.mjs` O1 ≥ 300 req/4 s sans gel ; 0 pageerror
- [ ] relecture diff (`git -C G diff web/src/viewer/ui/savedViews.ts` ; `savedViewZoom.ts` lu) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 + `npx vitest run src/viewer/ui/savedViewZoom.test.ts src/viewer/core` collés
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T`. `S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `S/t022.hMQF/sv2.mjs` | L | repro frustum / midtoggle (BASE, CASE, DT, OUT) |
| `S/t022.hMQF/sv.mjs` | L | vues enregistrées de base |
| `S/t022.hMQF/lib.mjs` | L | login, iframe, sondes (BASE par défaut 5182 : passer BASE) |
| `S/t022.hMQF/o3.mjs` | L | ouverture/toolbar |
| `S/t022.hMQF/o.mjs` | L | O1 |
| `S/t022.hMQF/png.mjs` | L | PNG |
| `G/e2e/bench-tileset.mjs` | L | STORE + project.json |
| `G/web/src/viewer/ui/savedViewZoom.ts` | L | contrat livré |

## Contrats
T023 livré : `SavedView.camera.orthoHeight?: number` = `(top − bottom) / zoom` (stocké si ortho, après `controls.update(1e3)`) ; `zoom` résiduel retiré au parse ; hauteur invalide retirée, vue gardée ; `flightZoom(savedHeight, isOrtho, frustumHeight, startHeight, e)` = `frustumHeight / (startHeight + (savedHeight − startHeight)·e)`, null si !isOrtho ou savedHeight absent ; flyTo : `startCam = sm.camera` ; `sm.camera !== startCam` ⇒ plus aucun zoomTo pour ce vol ; frustum relu à chaque pas ; zoomTo après setLookAt(..., false).
Clé localStorage des vues : `glr.savedViews.pkg:synthetique|::tileset.json` ; le nom de vue se saisit via `input:focus` (prompt) ; zoom ortho lisible via `glr:active-camera` (cf. lib.mjs).
Mesures T022 : frustum px/m 128,233 sauvé → 70,951 ; midtoggle ⇒ PerspectiveCamera zoom 44,080, 🏠 persp px/m 70,962 (normal 1,61).
Banc — commandes (ports DÉDIÉS T024 : API 4013, web 5183) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
S=/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad
T=$(mktemp -d -p $S t024.XXXX); STORE=$T/storage; cp $S/t022.hMQF/*.mjs $T/
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
cd $G/api && (PORT=4013 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5183 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4013 nohup npx vite preview --port 5183 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
cd $T && BASE=http://localhost:5183 CASE=frustum OUT=$T/out/fr node sv2.mjs
ss -ltnp | grep -E ':(4013|5183)\b' ; kill <pids> ; ss -ltn | grep -E ':(4013|5183)\b' → ∅
```
- AVANT = mesures T022 (pas de rebuild HEAD) ; comptes `admin@demo.geolens.fr` / `demo1234` ; contexte Playwright NEUF par run
- GPU : `chromium.launch({ headless: true, channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist','--no-sandbox'] })`

## Décisions actées
- D7, D8 ; vue d'accueil 🏠 : zoom ortho non stocké (connu)
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; seed-data ; serveur de test ; commit, push ; 3DGS ; EDL ; boutons +/− barre (connu)
- ports autres que 4013/5183

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 ; GPU RTX 4070 Ti ; machine chargée par un job externe
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` ; dernier `npm test` : 196 fichiers / 1849 tests

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff, cp, mkdir, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T024
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures
| id | métrique | T022 (avant T023) | après |
## Défauts
- D1 · repro · attendu · obtenu
## Vérifié comment
commande → sortie brute ; chemins PNG/JSON ; renderer WebGL
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
