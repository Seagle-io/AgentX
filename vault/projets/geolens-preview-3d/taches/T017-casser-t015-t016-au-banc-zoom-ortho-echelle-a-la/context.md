---
pack: T017
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T017 — Casser T015 + T016 au banc

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T016 (ortho : molette/droit = zoom vers le curseur, bascule ortho↔persp à échelle conservée ; EDL rendu à la densité physique) et T015 (texte d'aide fluide exact ; `__glrSplatStats` cumulatif et `lodChanges` vivant en mode stream). Banc headless local GPU réel, AVANT (HEAD) vs APRÈS (arbre de travail), captures + mesures. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] renderer WebGL (`UNMASKED_RENDERER_WEBGL`) collé ; 0 pageerror ; statuts HTTP notés
- [ ] Z1 ortho molette : maillage (tileset banc), touche `5` (bascule ortho) puis 5 crans molette avant au centre puis 5 arrière : `camera.zoom` (via `__glrTest` ou sonde), `camPos()`, `cameraType()` avant/après chaque série ; attendu APRÈS : zoom change, camPos quasi fixe (Δ ≤ 1 % de la distance), image agrandie (PNG) ; AVANT : zoom 1 figé, camPos bouge
- [ ] Z2 zoom vers le curseur : molette avant avec souris décalée (¼ largeur) ⇒ le point sous le curseur reste sous le curseur (±5 % largeur, par diff PNG ou repère) ; bouton droit glissé = zoom aussi
- [ ] Z3 traversée : 30 crans molette avant en ortho ⇒ le modèle ne disparaît pas (pas de coupe near) ; plafond maxZoom atteint sans écran vide (PNG)
- [ ] Z4 bascule : persp → ortho → zoom ×~3 → persp : taille apparente d'un repère au centre ortho vs persp ±2 % (PNG) ; puis persp → ortho : la 2e entrée ortho repart à l'échelle persp (zoom 1), pas au zoom précédent
- [ ] Z5 non-régression : en perspective la molette fait toujours un dolly (camPos bouge) ; gel D24 pendant un zoom ortho (`__glrMotionGate` : transitions, log `[motion-gate] gel`) ; mode navigation 2 (localStorage `geolens.navScheme`='mode2') ortho molette = zoom
- [ ] E1 EDL dpr : nuage de points chargé (EDL actif seulement si `loaded.pointCount > 0` : livrable PLY/LAS généré dans $T, cf. Contrats), contexte `deviceScaleFactor: 2` : capture canvas ⇒ % de blocs 2×2 alignés à 4 pixels identiques ; attendu AVANT ≈ 100 % (cible ½ résolution, NearestFilter) ; APRÈS nettement < ; idem dpr 1 (AVANT ≈ APRÈS) ; rayon EDL visuel comparable (PNG côte à côte)
- [ ] S1 3DGS (scène villelaure, reprendre le banc T006) : texte d'aide APRÈS = « Charge une seule fois toute la scène… » ; fluid : `__glrSplatStats` Δ après parcours ≥ 20 s = { loads 0, frees 0, lodChanges 0 } + 0 req `.sog` ; stream : lodChanges > 0 et Δloads = nb req `.sog` après init (± env) ; réouverture : opens +1, compteur cumulé (pas remis à 0)
- [ ] relecture diff (`git -C G diff web/src/viewer/core/SceneManager.ts web/src/viewer/core/EDLRenderer.ts web/src/viewer/core/navigationScheme.ts` ; `edlSize.ts`, `Lcc2Loader.ts` lus) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 + `npx vitest run src/viewer/core src/viewer/loaders/lcc2` collés
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t006.ZVgg/bench.mjs` | L | banc 3DGS (login, iframe, flag bêta, ouverture) à copier |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t006.ZVgg/addlcc2.mjs` | L | ajout livrable lcc2 au project.json |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t006.ZVgg/png.mjs` | L | lecture PNG / diff |
| `/tmp/t012-4kOe/bench-rm.mjs` | L | banc maillage (login, ouverture tileset, souris) à copier |
| `G/e2e/bench-tileset.mjs` | L | STORE + project.json |
| `G/web/src/viewer/core/edlSize.ts` | L | contrat livré |
| `G/web/src/viewer/loaders/PLYLoader.ts` | L | format PLY accepté (pour le nuage généré) |
| `G/web/src/viewer/loaders/lcc2/Lcc2Loader.ts` | L | :122-175 stats |

## Contrats
T016 livré : `controlsActionFor(a, ortho)` dolly+ortho ⇒ 'zoom' ; applyNavigationScheme ortho ⇒ `ACTION.ZOOM` (molette, droit) ; touches.two ortho ⇒ TOUCH_ZOOM_TRUCK ; P→O : `orthoCamera.zoom = 1`, après rebind `minZoom = H/20000`, `maxZoom = H/0.5` (H = hauteur visible) ; O→P : dist = ((top−bottom)/zoom)/(2·tan(fov/2)), même direction ; `dollyToCursor = true` ; EDL : `edlTargetSize(cssW, cssH, pr)` = floor(css·pr) ≥ 1 ⇒ renderTarget + depthTexture physiques, uniform `resolution` = CSS ; onContextRestored passe la taille CSS. Connus non traités : boutons +/− barre (main.ts `controls.dolly`) sans effet en ortho ; rebind via TopViewMapCapture sans min/maxZoom.
T015 livré : `window.__glrSplatStats = { opens, loads, frees, lodChanges }` partagé, jamais remis à 0 ; loads/frees = toute loadSplat résolue / tout dispose de poignée (tuiles, env, streamer) ; lodChanges = loads+frees après fin du chargement initial et avant dispose ; texte d'aide (viewer.html:808, index.html:805) : « Charge une seule fois toute la scène au niveau le plus fin, puis plus aucun chargement ni changement de détail pendant la navigation : aucun clignotement. Demande plus de mémoire et un chargement initial plus long. Splat LCC2. »
Sonde : `window.__glrTest` (iframe viewer) : `cameraType()`, `camPos()`, `camTarget()`, `camLen()` ; `camera.zoom` non exposé ⇒ déduire de captures (taille apparente) ou de `__glrMotionGate`/projectionMatrix si accessible ; bascule ortho = touche `5` (canvas focus) ou bouton `[data-view="perspective"]`.
Nuage EDL : seed `villelaure-real/pnts` = tileset.json seul (pas de données). Générer dans $T un PLY ASCII/binaire (≥ 200 k points colorés, relief, arêtes nettes) copié dans `$STORE/villelaure-real/bench/points.ply` + livrable `{"id":"bench-ply","name":"Nuage banc","type":"pointcloud","filename":"bench/points.ply","format":"PLY","viewMode":"3d"}` au `deliverables[]`. Vérifier `hasPointCloud` (EDL actif) par diff EDL on/off si possible.
Banc — commandes (ports DÉDIÉS T017 : API 4012, web 5182) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
mkdir -p $STORE/villelaure-real/3dgs && cp -r $G/seed-data/storage/villelaure-real/3dgs/. $STORE/villelaure-real/3dgs/   # copie, seed-data intact
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
mkdir -p $T/avant && git -C $G archive HEAD web | tar -x -C $T/avant && ln -s $G/web/node_modules $T/avant/web/node_modules
cd $T/avant/web && npx vite build --outDir $T/dist-avant > $T/build-avant.log 2>&1
cd $G/api && (PORT=4012 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5182 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4012 nohup npx vite preview --port 5182 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
# AVANT : relancer le preview avec --outDir $T/dist-avant
ss -ltnp | grep -E ':(4012|5182)\b' ; kill <pids> ; ss -ltn | grep -E ':(4012|5182)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run
- GPU : `chromium.launch({ headless: true, channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist','--no-sandbox'] })`
- souris : gauche = TRANSLATION, bouton MILIEU = orbite, droit/molette = dolly (persp) / zoom (ortho APRÈS)
- 3DGS : `glr.settings.v1` {gaussianSplatBeta:true} ; accueil : clic `#gx-home-explore` puis livrable ; mode `localStorage['geolens.splatLodMode']` = 'fluid' | 'stream' (addInitScript)
- HEAD n'a ni mode fluid ni compteur (fichiers non suivis exclus de git archive) ⇒ AVANT 3DGS = texte d'aide seulement

## Décisions actées
- D1 dpr réel ; minDistance 0,5 m (crash ArcelorMittal) ⇒ maxZoom = 0,5 m de hauteur visible ; D3/D4 fluid chargé une fois
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; seed-data (lecture/copie seulement) ; serveur de test ; commit, push ; near/brouillard (H14)
- ports 4000, 5173, 5174, 5199 et autres que 4012/5182

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 ; GPU RTX 4070 Ti ; machine chargée par un job externe (durées faussées, comptes fiables)
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` ; dernier `npm test` : 194 fichiers / 1826 tests

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive, tar, ln, cp, mkdir, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T017
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures avant/après
| id | métrique | avant | après |
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
