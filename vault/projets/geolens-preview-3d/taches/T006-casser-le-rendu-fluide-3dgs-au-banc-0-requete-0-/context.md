---
pack: T006
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T006 — Casser le rendu fluide 3DGS au banc

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T005 : « en Rendu fluide 3DGS, tout est chargé une fois au démarrage en pleine qualité, puis 0 requête, 0 chargement/déchargement, 0 changement de LOD pendant la navigation, au mouvement comme à l'arrêt ⇒ plus de clignotement ». Banc headless local AVANT (HEAD) vs APRÈS (arbre de travail), scène 3DGS réelle villelaure, captures + compte des requêtes. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] navigateur : GPU matériel si possible (RTX 4070 Ti présente) — `chromium.launch({ channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist'] })` ; renderer WebGL lu (`UNMASKED_RENDERER_WEBGL`) collé ; sinon repli SwiftShader (args du banc) + timeouts ≥ 300 s, noté
- [ ] APRÈS : console `[3dgs] LCC2 chargé : 14/14 tuiles, 7 388 760 splats, depth 5/5` (pleine qualité) ; `window.__glrSplatStats` après chargement puis après parcours : Δloads = 0, Δfrees = 0, lodChanges = 0
- [ ] parcours caméra ≥ 30 s (orbite souris, molette avant/arrière, 2 arrêts de 3 s) : requêtes `.sog` après la fin du chargement initial = 0 (APRÈS) ; même mesure AVANT (attendu > 0 : streamer fluide)
- [ ] clignotement : caméra immobile ≥ 5 s après chargement, 10 captures du canvas à 200 ms ⇒ nb de paires non identiques (octets PNG ou diff pixels) ; idem juste après un arrêt de mouvement ; AVANT vs APRÈS
- [ ] captures PNG : AVANT et APRÈS à pose identique (fin de chargement, milieu de parcours, fin de parcours)
- [ ] non-régression : mode `'fixed'` (clé absente) charge toujours le niveau sous budget ; mode `'stream'` démarre ; 0 pageerror ; statuts HTTP 200/304
- [ ] relecture du diff T005 (`git -C G diff web/src/viewer/loaders/lcc2/Lcc2Loader.ts web/viewer.html web/src/viewer/index.html`) + `npx vitest run src/viewer/loaders/lcc2` collé
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T` (scripts dérivés du banc, project.json du banc).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/e2e/bench-3d.mjs` | L | login, iframe, mesures : modèle à adapter dans $T |
| `G/e2e/bench-tileset.mjs` | L | génère STORE + project.json |
| `G/web/src/viewer/loaders/lcc2/Lcc2Loader.ts` | L | contrat livré |
| `G/web/src/viewer/loaders/lcc2/Lcc2Loader.test.ts` | L | tests livrés |
| `G/web/src/viewer/core/splatLodMode.ts` | L | clé et valeurs du mode |

## Contrats
```
D3 (humain) : « En mode fluide avec LOD 3DGS : tout charger UNE SEULE FOIS au démarrage (pleine qualité), puis plus aucun chargement/déchargement ni changement de LOD pendant la navigation, ni au mouvement ni à l'arrêt. Vérifie au banc qu'après le chargement initial il y a 0 requête et 0 changement de LOD pendant un parcours caméra, captures avant/après. »
D4 : fluid ⇒ niveau le plus fin entier (villelaure depth 5 : 14 .sog, 7 388 760 splats, 121 Mo), 0 Lcc2FluidStreamer ; window.__glrSplatStats = { loads, frees, lodChanges }
AVANT (HEAD) : fluid = base depth 1 (1 .sog, 459 029 splats) puis Lcc2FluidStreamer par rAF : coupe sous budget ≤ 6 M, LRU, fondu 350 ms, régulateur fps ; warns console `[lcc2-fluid] …` ; événement window `glr:fluid-budget-drop`
mode : localStorage['geolens.splatLodMode'] = 'fixed' | 'stream' | 'fluid' (addInitScript avant chargement) ; détail 100 % : localStorage['geolens.splatDetailPct']='100'
livrable lcc2 (à ajouter au deliverables[] du project.json du banc) :
{"id": "gaussian-splat-lcc2", "name": "Gaussian Splatting (LCC2, beta)", "type": "gaussian_splat", "kind": "lcc2", "filename": "3dgs/APT.lcc2", "format": "3DGS LCC2 (XGrids)", "viewMode": "3d"}
ouverture : dans l'iframe viewer, clic `[data-deliverable-id="gaussian-splat-lcc2"]` ; URL tuiles = http signée `/api/projects/:id/storage/3dgs/data/3dgs/*.sog?token=`
```
Banc — commandes (ports DÉDIÉS T006 : API 4014, web 5184) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=2 node e2e/bench-tileset.mjs
mkdir -p $STORE/villelaure-real/3dgs && cp -r $G/seed-data/storage/villelaure-real/3dgs/. $STORE/villelaure-real/3dgs/   # copie, seed-data intact
# ajouter le livrable lcc2 à $STORE/villelaure-real/project.json (script node dans $T)
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
mkdir -p $T/avant && git -C $G archive HEAD web | tar -x -C $T/avant && ln -s $G/web/node_modules $T/avant/web/node_modules
cd $T/avant/web && npx vite build --outDir $T/dist-avant > $T/build-avant.log 2>&1
cd $G/api && (PORT=4014 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5184 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4014 nohup npx vite preview --port 5184 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
# AVANT : relancer le preview avec --outDir $T/dist-avant
ss -ltnp | grep -E ':(4014|5184)\b' ; kill <pids> ; ss -ltn | grep -E ':(4014|5184)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run (cache `immutable`)
- caméra non exposée : souris sur `frame.locator('canvas').first()` — gauche = TRANSLATION, rotation = bouton du MILIEU (navigationScheme.ts:26), molette = dolly ; stabilisation 90-121 s (T002)

## Décisions actées
- D3, D4 ci-dessus ; gel D24 (maillage) hors sujet ici
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; seed-data (lecture/copie seulement) ; serveur de test ; commit, push
- ports 4000, 5173, 4010-4013, 5180-5183 (autres agents)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 et chromium_headless_shell-1228 installés ; GPU NVIDIA RTX 4070 Ti
- 7,4 M splats : chargement long (prévoir ≥ 120 s matériel, ≥ 300 s SwiftShader)
- d'autres bancs peuvent tourner (ports 4011-4013) ⇒ CPU partagé

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive, tar, ln, cp, mkdir, ss, kill, mktemp, ls), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T006
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures avant/après
| métrique | avant | après |
## Clignotement
- scénario · paires non identiques avant · après
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
