---
tache: T005
statut: fait
---
## Constats
G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
- runner · e2e/package.json:8-22 — `proofs` = 13 `node proof-*.mjs` chaînés par `&&`; + 13 `proof:<x>` — confirmé (13)
- runner · README.md:73 — annonce "12 preuves" — ≠ audit (README périmé, réel 13)
- runner · proof-*.mjs:~7 — `import { chromium } from 'playwright-core'`, pas @playwright/test — confirmé
- runner · e2e/package.json:24-29 — dev dep `@playwright/test ^1.49.1` (lock 1.61.0) apporte playwright-core 1.61.0; dep `yazl` — confirmé
- config · e2e/playwright.config.ts:1-48 — jamais lue par `node proof-*`; ports 4000/5173 identiques — confirmé inutilisée
- racine · G/package.json — ∅ script `proofs`/`e2e` (seulement dev:api:8, dev:web:9) — ≠ pack ("npm run proofs racine") : lancer depuis `e2e/`
- navigateur · ~/.cache/ms-playwright/chromium-1234/chrome-linux64 + chromium_headless_shell-1234 présents — installation NV (adéquation 1234↔1.61.0 NV)
- lancement · proof-viewer.mjs:22 — `chromium.launch({headless:true,args:[swiftshader,…,--no-sandbox]})`, ∅ executablePath/channel — OK Linux
- e2e/node_modules ∅ — `npm ci` requis dans e2e (hors périmètre ici)
- serveurs · e2e/playwright.config.ts:19-41 — API `npx tsx src/index.ts` cwd api; env ci-dessous; web `npm run preview`
- serveurs · web/package.json:11 — `vite preview --port 5173 --host`; web/dist ∅ → `npm --prefix web run build` requis
- serveurs · web/vite.config.ts:55-62 — preview+dev port 5173, proxy /api → VITE_API_TARGET ou :4000
- serveurs · api/package.json:8 — `dev` = `tsx watch src/index.ts`; .env.example:5-14 = USE_MEM_DB=1, STORAGE_DRIVER=local, STORAGE_LOCAL_ROOT=../seed-data/storage
- env preuves · rg process.env e2e — BASE (défaut :5173, geoplan-* :5281, diag-* :8080), OUT (diag-*), GPU, LABEL, DELIV; ∅ dans les 13 proofs hors BASE
- chemins Win · `const DIR = 'C:/tmp/glw-proofs'` littéral, 1 par fichier: proof-{viewer:11,upload:19,package:22,cloudpkg:19,refine:16,export:8,pnts:9,ortho:9,interaction:6,photo:13,import-lcc2:18}.mjs = 11 — ≠ audit (17 = 11 + 6 `process.env.OUT||'C:/tmp/glw-proofs'` diag-{ui:4,full:6,prod:6,nested:7,nuage:5,stream:14}.mjs)
- chemins Win · proof-import-lcc2.mjs:10 — commentaire seul
- chemins Win · autres lettres de lecteur absolues dans e2e: ∅ (rg `[A-Z]:[/\\]` = 17 DIR + 1 commentaire)
- chemins Win · sous Linux `mkdirSync('C:/tmp/glw-proofs',{recursive})` crée `./C:/tmp/glw-proofs` relatif au cwd — pas d'échec, écrit dans e2e/C:/ ; 8 des 11 faisant mkdirSync à la volée
- chemin tmp · proof-upload.mjs:35, proof-package.mjs, proof-cloudpkg.mjs:59 — `os.tmpdir()` portable — OK
- helper partagé · ∅ — pas de `_lib`/`common`; login copié-collé dans chaque preuve (rg -c login = 1 chez 13 proofs; persistence 4, viewer 2, packs 5, pack-risque 3, packs2 3)
- login · `#email`/`#pw`/bouton « se connecter` + admin@demo.geolens.fr / demo1234 (viewer:36-40, persistence:19-22, interaction:19-22, export, upload) — dupliqué
- fin · proof-*.mjs `process.exit(fails.length===0?0:1)` (viewer:102) — code de sortie exploitable
- données · seed-data/storage/villelaure-real (projet « Vieux Château », seed.ts:85,128): 73 fichiers, tileset.json ✓, 0 .b3dm, 0 .pnts (gitignoré .gitignore:38-44)
- données · populate-real-tileset.mjs:22 lit `../GeoLens_Reality/DEMOS/...` ; G/../GeoLens_Reality ∅ (existe: geolens-reality-main) → restauration impossible telle quelle
- données · .ply : 5 sous seed-data/storage/uploads (fixtures), 0 dans villelaure-real/3dgs/data (NV contenu)
- tests · pas lancé (interdit) — résultats réels des preuves NV

### Sélection par lot
- XSS viewer : proof-interaction.mjs — POI/topo/mesure/rapport/vue sauvegardée (20 asserts) ; proof-pack-risque.mjs — dock packs, rendu libellés ; proof-persistence.mjs — annotations `Fissure E2E` save→load
- CSP/décodeurs : proof-viewer.mjs — canvas, ≥30 tuiles, console sans erreur bloquante ; proof-ortho.mjs — GeoTIFF décodé, URL signée ; proof-pnts.mjs — ≥12 tuiles .pnts signées ; proof-splat.mjs — manifest LCC2 + .ply signés (rendu GPU requis)
- upload : proof-upload.mjs — ZIP admin → apparaît → streame ≥1 → suppression ; proof-package.mjs — package nested, sélection livrables, 404 exclus ; proof-cloudpkg.mjs — nuage-only + ortho ; proof-import-lcc2.mjs (hors `proofs`)
- sessions/jetons : proof-viewer.mjs — 0 requête /storage/ sans token, isolation membre ; proof-persistence.mjs — tenant rival 401/403/404 ; proof-range.mjs — sans token → 403, 206
- exports : proof-export.mjs — PNG vue + rapport téléchargés >0 octet ; proof-report-v2.mjs — PDF direct (hors `proofs`)

### Dépendance aux données (villelaure-real sans .b3dm/.pnts)
- proof-viewer.mjs:70,75 — ≥30 tuiles/≥30 req /storage/ : KO attendu (NV)
- proof-refine.mjs:10 — assertion dure ≥150 tuiles : KO attendu (NV)
- proof-pnts.mjs:52 — ≥12 .pnts : KO attendu (0 .pnts) ; proof-package.mjs:68 / proof-cloudpkg.mjs:55 — `readFileSync(.../pnts/pointcloud_0164.pnts)` → ENOENT (fichier absent)
- proof-interaction.mjs:36 — ≥20 tuiles : KO attendu ; proof-export.mjs — rendu scène, seuil tuiles ∅ (peut passer)
- indépendantes des gros assets : proof-upload.mjs (tileset.json+tri.gltf présents), proof-persistence.mjs (API), proof-range.mjs (NV), proof-ortho.mjs (ortho.tif versionné 3,2 Mo)

## Correctif minimal
- chemins Win · e2e/proof-{viewer,upload,package,cloudpkg,refine,export,pnts,ortho,interaction,photo,import-lcc2}.mjs (11) + diag-{ui,full,prod,nested,nuage,stream}.mjs (6, hors lots) · remplacer littéral par `process.env.OUT || path.join(os.tmpdir(),'glw-proofs')` · test: lancer proof-export.mjs, vérifier fichiers dans /tmp/glw-proofs, ∅ dossier `e2e/C:`
- alternative ∅-édition · lancer avec cwd jetable : crée `<cwd>/C:/tmp/glw-proofs` ; rien à modifier mais captures éparpillées
- helper login · nouveau e2e/_lib.mjs (`DIR`, `login(page,BASE)`) · option HP (factorisation hors périmètre) 

## Contrats
```
e2e/package.json scripts.proofs: node proof-viewer.mjs && node proof-persistence.mjs && node proof-interaction.mjs && node proof-ortho.mjs && node proof-pnts.mjs && node proof-export.mjs && node proof-photo.mjs && node proof-range.mjs && node proof-splat.mjs && node proof-refine.mjs && node proof-upload.mjs && node proof-package.mjs && node proof-cloudpkg.mjs
playwright.config.ts webServer API env: { USE_MEM_DB:'1', STORAGE_DRIVER:'local', STORAGE_LOCAL_ROOT:'../seed-data/storage', JWT_SECRET:'e2e', PORT:'4000', WEB_ORIGIN:'http://localhost:5173' }  (url santé: http://localhost:4000/api/health)
launch: chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox'] })
login: #email=admin@demo.geolens.fr · #pw=demo1234 · bouton /se connecter/i · attend .gl-project
```
Séquence Linux (bash; fish → `bash -c`), cwd=G, à lancer par l'humain/implémenteur:
```
(cd e2e && npm ci)
npm --prefix web run build
(cd api && USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=../seed-data/storage JWT_SECRET=e2e PORT=4000 WEB_ORIGIN=http://localhost:5173 npx tsx src/index.ts) &
(cd web && npm run preview) &
cd e2e && node proof-upload.mjs        # ou npm run proof:<x>
```
## Vérifié comment
- `rg -c "chromium.launch" e2e/proof-*.mjs` + sed -n tête de fichiers → import playwright-core, args ci-dessus
- `rg -n "[A-Z]:[/\\\\]" e2e` → 18 lignes : 17 `DIR='C:/tmp/glw-proofs'` + 1 commentaire
- `find seed-data -name "*.b3dm"` → 3 (tous sous uploads/) ; `*.pnts` → 0 ; `ls GeoLens_Reality` → absent
- `ls ~/.cache/ms-playwright` → chromium-1234, chromium_headless_shell-1234, ffmpeg-1011
- `ls web/dist` → absent ; `ls e2e/node_modules` → absent
- NV: version chromium↔playwright 1.61.0 ; exécution des preuves
## Écarts
- ∅ lecture hors WL (rg/find/sed ciblés sur G/api, G/scripts, G/seed-data, G/.gitignore, ~/.cache/ms-playwright, ls Geolens/)
## Pour la suite
- Preuves exécutables sans gros assets : upload (lot upload), persistence (sessions/isolation tenant), range (jetons), ortho ; export à tenter (rendu scène, seuil tuiles ∅).
- KO attendu sans tuiles b3dm/pnts : viewer, refine, pnts, package, cloudpkg, interaction (≥20) → avant lot XSS/CSP, décider : fournir assets (populate-real-tileset.mjs exige ../GeoLens_Reality absent) ou assouplir seuils — question humaine.
- Correctif chemin : 1 constante `DIR` dans 11 fichiers proof ; collision certaine avec tout lot touchant ces proofs (viewer/upload/export/interaction) → faire ce correctif en tâche préalable unique.
- Prérequis humain : `cd e2e && npm ci` ; `npm --prefix web run build` ; lancer api+preview ; chromium cache déjà présent (pas d'install attendue, NV).
- README.md:73 "12 preuves" et :75 chemin C:/tmp à corriger ; racine sans `npm run proofs`.
## Retour sur le pack
- Manquait: version playwright du lock, état seed-data (b3dm/pnts) et build web/dist ; "17 fichiers" mêlait 6 diag-*
- Inutile: proof-viewer/upload head complet (suffisait rg ciblé)
