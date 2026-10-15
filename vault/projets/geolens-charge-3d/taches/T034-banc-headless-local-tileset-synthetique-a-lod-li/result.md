---
tache: T034
statut: fait
---
## Fait
- G/e2e/bench-tileset.mjs:1-172 (neuf) — générateur 0 dép., 85 glb déf
- G/e2e/bench-tileset.mjs:21-30 — STORE absent / sous seed-data / DEPTH,TEX invalides → exit 2
- G/e2e/bench-tileset.mjs:39-69 — PNG RGB main : couleur=profondeur, damier 2^(d+2), bord sombre 2 px
- G/e2e/bench-tileset.mjs:71-135 — glb main : grille 32×32 = 2048 tri, KHR_materials_unlit, doubleSided
- G/e2e/bench-tileset.mjs:137-163 — quadtree REPLACE, box ⊂ parent, geometricError 64/4^d, feuilles 0
- G/e2e/bench-tileset.mjs:166-172 — project.json + `deliverables[]` 3d-tiles (requis, cf. Écarts)
- G/e2e/bench-3d.mjs:1-171 (neuf) — scénario contrat T033, mesure seule
- G/e2e/bench-3d.mjs:30-48 — probe : loaded/inFrustum/visible/maxDepthVisible/histoVisible/maxJobs/errorTarget/gate
- G/e2e/bench-3d.mjs:88-122 — stable 4×1,5 s (max 90 s) ; orbite 6 s ±300 px steps 30 ; maxJobs in-page /250 ms
- G/e2e/bench-3d.mjs:124-166 — arrêt : relevés /250 ms 5 s ; JSON (req horodatées, statuts, gate, erreurs)
- G/e2e/bench-3d.mjs:167-171 — exit 1 : erreur technique (login, iframe, 0 tuile, pageerror) seulement

## Mode d'emploi
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE node e2e/bench-tileset.mjs            # DEPTH=4 TEX=256 par défaut
cd $G/web && npm run build > $T/build.log 2>&1
cd $G/api && (PORT=4010 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5180 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4010 nohup npx vite preview --port 5180 --host > $T/web.log 2>&1 &)
cd $G && BASE=http://localhost:5180 OUT=$OUT LABEL=run node e2e/bench-3d.mjs
ss -ltnp | grep -E ':(4010|5180)\b'      # relever les 2 pid node
kill <pid4010> <pid5180>                 # puis : ss -ltn | grep -E ':(4010|5180)\b' → ∅
```

## Vérifié comment
- `node --check e2e/bench-3d.mjs && node --check e2e/bench-tileset.mjs` → (rien, exit 0)
- `wc -l` → `171 bench-3d.mjs` · `172 bench-tileset.mjs`
- `STORE=$T/storage node e2e/bench-tileset.mjs` → `[bench-tileset] /tmp/tmp.HJiSNLOEmD/storage/villelaure-real : 85 glb (3017 Kio), DEPTH=4 TEX=256`
- `STORE=seed-data/storage node e2e/bench-tileset.mjs; echo exit=$?` → `STORE refusé : …/seed-data/storage est sous …/seed-data` `exit=2`
- `node e2e/bench-tileset.mjs; echo exit=$?` → `STORE obligatoire (dossier racine du stockage local)` `exit=2`
- glb 3_5_2 parsé → magic `46546c67`, longueur 36328 = taille fichier, `2048 tris` ; PNG extrait → `PNG image data, 256 x 256, 8-bit/color RGB` (bleu, damier 32×32)
- `npm run build` (web) → `✓ built in 14.03s`
- banc → 
```
[bench] entrée 3D — attente stabilité
[bench] stable en 13664 ms : tiles=85 vis=64 depth=3
[bench] reqMouvement=0 reqArret=0 delaiRepriseMs=null cam change=true
[bench] JSON : /tmp/tmp.HJiSNLOEmD/out/bench-run.json
exit=0
```
- JSON (`reqDetail` 93 entrées retirées, `tileMem` retiré, `serie` 28 pts et `relevesArret` 20 pts résumés) :
```json
{"label":"run","base":"http://localhost:5180","projectId":"0a1b2c3d-0000-4000-8000-000000000203","temps":{"stableMs":13664,"dragMs":6820,"allersDrag":2,"mouseUpApresFinDragMs":311},"reqTotal":93,"reqMouvement":0,"reqArret":0,"delaiRepriseMs":null,"phases":{"avant":{"tileCount":85,"loaded":85,"inFrustum":85,"visible":64,"maxDepthVisible":3,"histoVisible":{"3":64},"maxJobs":6,"errorTarget":1,"cacheMB":33,"gateAllowed":true},"finMouvement":{"tileCount":85,"loaded":85,"inFrustum":85,"visible":64,"maxDepthVisible":3,"histoVisible":{"3":64},"maxJobs":0,"errorTarget":4,"cacheMB":33,"gateAllowed":false},"finArret":{"tileCount":85,"loaded":85,"inFrustum":85,"visible":64,"maxDepthVisible":3,"histoVisible":{"3":64},"maxJobs":6,"errorTarget":1,"cacheMB":33,"gateAllowed":true}},"maxJobsDrag":{"echantillons":28,"zeros":28,"valeurs":[0],"serie":"28 pts"},"relevesArret":[{"dtMs":1,"req":93,"maxJobs":0,"gateAllowed":false,"tileCount":85},{"dtMs":315,"req":93,"maxJobs":0,"gateAllowed":false,"tileCount":85},{"dtMs":4768,"req":93,"maxJobs":6,"gateAllowed":true,"tileCount":85}],"camPos":{"avant":[210,150.05,210.00000000000003],"apres":[287.10356314402713,150.05,132.89643685597287],"change":true},"statutsHttp":{"200":87,"404":6},"motionGate":{"transitions":6,"logs":[{"dtDragMs":-17578,"m":"[motion-gate] gel"},{"dtDragMs":-13933,"m":"[motion-gate] reprise (immobile ≥ 500 ms)"},{"dtDragMs":-13731,"m":"[motion-gate] gel"},{"dtDragMs":-9884,"m":"[motion-gate] reprise (immobile ≥ 500 ms)"},{"dtDragMs":100,"m":"[motion-gate] gel"},{"dtDragMs":8166,"m":"[motion-gate] reprise (immobile ≥ 500 ms)"}]},"pageErrors":[],"consoleErrors":["Failed to load resource: … 404 (Not Found)", "×6 au total"]}
```
- reqDetail : 1re `{"dtDragMs":-19340,"p":"project.json"}` · dernière `{"dtDragMs":-9123,"p":"t/3_0_0.glb"}` ⇒ 0 req après début drag
- 404 ×6 = multi-pack.json ×2, data/multi-pack.json ×2, 05_Photos_Drone/camera_params.json ×2 (vus en debug, attendus)
- `ls -la $T/out` →
```
-rw-rw-r-- 1 jdrac jdrac 318638 Oct 14 09:34 bench-run-apres.png
-rw-rw-r-- 1 jdrac jdrac 314543 Oct 14 09:34 bench-run-avant.png
-rw-rw-r-- 1 jdrac jdrac 318650 Oct 14 09:34 bench-run-mouvement.png
-rw-rw-r-- 1 jdrac jdrac  13352 Oct 14 09:34 bench-run.json
```
- captures lues : plan horizontal bleu (profondeur 3), 64 dalles à bord sombre, angle ≠ entre avant/apres
- `kill 4044793 4044772 4044728 4044730` puis `ss -ltn | grep -E ':(4010|5180)\b'; echo $?` → `1` (∅) ; 4000/5173 toujours LISTEN, jamais touchés
- artefacts gardés : /tmp/tmp.HJiSNLOEmD/{storage,out,api.log,web.log,build.log}

## Écarts
- lecture hors WL: G/seed-data/storage/villelaure-real/project.json — viewer KO avec project.json minimal T033 (`[init] TypeError: … reading 'filter'`, bouton « Explorer en 3D » absent, timeout 30 s) ; ajouté `deliverables[]` 1×3d-tiles → OK
- contrat T033 « project.json minimal » insuffisant ⇒ remplacé (bench-tileset.mjs:166-172)
- orientation : renderer tourne glb (gltfUpAxis Y) (x,y,z)→(x,-z,y), viewer n'ajoute rien (`[addToScene] … pas de rotation`) ⇒ 1er run = plan VERTICAL ; box posée en (cx,0,cz)/épaisseur sur y du tileset ⇒ plan horizontal
- geometricError DEPTH=4 → 64,16,4,0 : « 1 » n'existe qu'avec DEPTH ≥ 5 (85 glb ⇒ profondeur 3 = feuille)
- script debug jetable dans scratchpad session (hors G, hors vault) pour lister boutons/console iframe
- web/dist reconstruit (build exigé par le pack)

## Pour la suite
- tileset DEPTH=4 entièrement chargé avant drag (85/85 en 13,7 s) ⇒ reqMouvement=reqArret=0 : le banc ne stresse PAS le streaming ; essayer DEPTH=6 (1365 glb) et/ou HALF plus grand / caméra plus proche
- gel D24 observé : maxJobs=0 sur 28/28 échantillons drag ; reprise loguée 1035 ms après mouse.up (dtDrag 8166 − T0 7131) ; errorTarget 1→4 pendant mouvement
- 30 steps ≈ 3 s/aller sous SwiftShader ⇒ 2 allers seulement en 6 s
- 2 cycles gel/reprise avant drag (pendant entrée 3D, sans souris) : animation caméra d'entrée compte comme mouvement
- 1 seul run ; délai de reprise réseau non mesurable tant que rien ne reste à charger

## Retour sur le pack
- Manquait: schéma project.json réel (`deliverables[]` obligatoire) ; repère monde du viewer (Y haut, 0 rotation ajoutée) ; avertir que DEPTH=4 tient en cache ⇒ 0 req à mesurer
- Inutile: ∅
