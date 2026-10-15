---
pack: T020
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T020 — Casser T018 + T019 au banc

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T018 (le cadrage d'ouverture ne gèle plus les téléchargements ; gel D24 intact après la 1re entrée utilisateur) et T019 (en ortho, les vues programmées reprennent l'échelle de leur distance ; bornes de zoom = distances min/max ; bascule O→P jamais sous minDistance). Banc headless local GPU réel, AVANT = HEAD 345a7a0 vs APRÈS = arbre de travail. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] renderer WebGL collé ; 0 pageerror ; statuts HTTP notés
- [ ] O1 ouverture (tileset banc, contexte neuf, 0 entrée utilisateur pendant 6 s après ouverture du livrable) : chronologie requêtes de tuiles /250 ms, logs `[motion-gate] *`, `__glrMotionGate` /250 ms ; attendu APRÈS : 0 `gel` avant l'entrée, `openingExempt: true`, `allowed: true`, 1re requête ≤ 300 ms après le 1er `load-tile-set`/ouverture ; AVANT : gel ≈ 3,9-4,1 s (T014) ; nb requêtes dans les 4 premières s AVANT vs APRÈS ; temps jusqu'à image nette (stabilité PNG) AVANT vs APRÈS
- [ ] O2 levée : 1re entrée (pointerdown canvas, puis variante wheel, puis keydown) ⇒ log `[motion-gate] ouverture terminée (<type>)` unique, `openingExempt: false` ; drag 3 s ensuite ⇒ `gel`, maxJobs 0, ≈ 0 requête (T035 : 6) ; reprise après 0,5 s immobile
- [ ] O3 pièges : clic « Explorer » de l'accueil (`#gx-home-explore`, hors canvas) ⇒ exemption maintenue pendant le cadrage qui suit (attendu) ; saisie clavier hors scène (champ texte) ⇒ lève l'exemption (acceptable, noter) ; ouverture d'un 2e livrable ⇒ nouvelle exemption (nouveau loader) ; affinage pendant l'ouverture = base (pas 0,5 px tant que la caméra bouge) : errorTarget lu si exposé, sinon histogramme de profondeur
- [ ] V1 (repro T017-D1) : `5`, 12 crans molette avant, puis Accueil, Recadrer, Dessus (`7`), Face (`1`), Iso (`0`) ⇒ zoom ortho cohérent avec la distance de la vue (fond ≈ AVANT-T016 85 % à l'Accueil ; PNG) ; AVANT (HEAD) = zoom 64,74 conservé
- [ ] V2 (repro T017-D3) : ortho au zoom max puis `5` ⇒ distance persp ≥ minDistance (0,5 m ou valeur fitToScene) ; 1 cran molette avant ⇒ rapproche (px/m augmente), jamais de recul
- [ ] V3 non-régression T016 : Z1-Z5 de T017 (zoom molette ortho, vers le curseur, 30 crans sans écran vide, échelle persp↔ortho ±2 %, 2e entrée ortho à zoom 1, dolly persp, mode2) ; vues enregistrées / cinématique en ortho : pas d'échelle aberrante (PNG)
- [ ] relecture diff (`git -C G diff` : motionGate.ts, TilesRendererLoader.ts, SceneManager.ts ; `orthoScale.ts` lu) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 + `npx vitest run src/viewer/core` collés
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T` (copier les scripts T017).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t017.iDDQ/lib.mjs` | L | login, iframe, sondes |
| `…/t017.iDDQ/h.mjs` | L | repro D1 (vues ortho) |
| `…/t017.iDDQ/z.mjs` | L | Z1-Z5, repro D3 |
| `…/t017.iDDQ/png.mjs` | L | PNG, fond, diff |
| `/tmp/t012-4kOe/bench-rm.mjs` | L | chronologie requêtes + `__glrMotionGate` |
| `G/e2e/bench-tileset.mjs` | L | STORE + project.json |
| `G/web/src/viewer/core/orthoScale.ts` | L | contrat livré |
| `G/web/src/viewer/core/motionGate.ts` | L | contrat livré |
(`…` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad`)

## Contrats
T018 livré : `OPENING_INPUT_EVENTS = ['pointerdown','wheel','touchstart']` (canvas, capture, passive) + `keydown` (window) ; `gateMoveStamp(prevMs, nowMs, moved, openingExempt)` ⇒ `moved && !openingExempt ? nowMs : prevMs` ; loader : `gateLastMoveMs = -Infinity` initial ⇒ téléchargements autorisés dès la 1re image ; gel lit `loadsAllowed(now, gateLastMoveMs)` ; affinage lit toujours `refine.lastMoveMs` (initial = performance.now() ⇒ base 500 ms au démarrage) ; 1re entrée ⇒ `openingExempt = false`, `gateLastMoveMs = now` (gel ≥ 500 ms même sans mouvement), log unique `[motion-gate] ouverture terminée (<type>)`, écouteurs retirés (et au dispose) ; `window.__glrMotionGate = { allowed, transitions, purged, openingExempt }`.
T019 livré : `orthoZoomForDistance(frustumHeight, fovDeg, dist)` = H/(2·tan(fov/2)·dist) (dist ≤ 0/non fini ⇒ 1) ; `orthoZoomBounds(H, fov, minDistance, maxDistance)` ⇒ maxZoom = zoom à minDistance, minZoom = zoom à maxDistance ; `perspDistanceForOrtho(visibleHeight, fov, minD, maxD)` borné ; SceneManager : enveloppe de `controls.setLookAt` (constructeur + rebind) : ortho ⇒ bornes recalculées puis `zoomTo(clamp(...), enableTransition)` ; persp ⇒ appel d'origine seul ; bornes posées au rebind si ortho (TopViewMapCapture compris) ; O→P via perspDistanceForOrtho. Connu : après fitToScene en ortho, bornes à jour seulement au prochain setLookAt/rebind.
D7 (humain) : cadrage d'ouverture exempté du gel ; ouverture = avant la 1re entrée utilisateur ; après, D24 intact (animations programmées = mouvement).
Mesures de référence : T014 ouverture gelée 3,9-4,1 s ; T017 D1 zoom 64,74 conservé, fond 4,8 % (Accueil), 25 % (Face), 46 % (Dessus) vs 85 % ; D3 persp 0,433 m puis recul à 0,5 m (−13 % px/m).
Sondes : `window.__glrTest` (iframe) `cameraType()`, `camPos()`, `camTarget()` ; zoom ortho lisible via l'événement `glr:active-camera` (detail.camera) — cf. lib.mjs T017 ; `camLen()` = |camPos| (pas la distance à la cible) ; boutons `[data-view="home"]`, recadrer, touches `7`/`1`/`3`/`0`/`5` canvas focus.
Banc — commandes (ports DÉDIÉS T020 : API 4013, web 5183) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; S=/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad
cp $S/t017.iDDQ/*.mjs /tmp/t012-4kOe/bench-rm.mjs $T/
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
mkdir -p $T/avant && git -C $G archive HEAD web | tar -x -C $T/avant && ln -s $G/web/node_modules $T/avant/web/node_modules
cd $T/avant/web && npx vite build --outDir $T/dist-avant > $T/build-avant.log 2>&1
cd $G/api && (PORT=4013 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5183 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4013 nohup npx vite preview --port 5183 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
# AVANT : relancer le preview avec --outDir $T/dist-avant
ss -ltnp | grep -E ':(4013|5183)\b' ; kill <pids> ; ss -ltn | grep -E ':(4013|5183)\b' → ∅
```
- les scripts copiés référencent des ports/chemins T017/T012 : les adapter dans $T
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run
- GPU : `chromium.launch({ headless: true, channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist','--no-sandbox'] })`
- souris : gauche = TRANSLATION, MILIEU = orbite, droit/molette = dolly (persp) / zoom (ortho)
- toute interaction Playwright sur le canvas (move, click) peut lever l'exemption : pour O1, n'envoyer AUCUN événement souris/clavier au canvas ni à la fenêtre (mouse.move compris si pointerdown non émis : vérifier)

## Décisions actées
- D7 ; D24 ; minDistance 0,5 m (ArcelorMittal) = plancher aussi en ortho ; EDL hors sujet
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; seed-data ; serveur de test ; commit, push ; 3DGS ; EDL
- ports autres que 4013/5183 (4000, 5173, 5174, 5199 occupés)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 ; GPU RTX 4070 Ti ; machine chargée par un job externe (durées faussées, comptes fiables)
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` ; dernier `npm test` : 195 fichiers / 1838 tests

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive, tar, ln, cp, mkdir, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T020
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
