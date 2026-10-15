---
pack: T034
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
tags: [pack]
---

# Pack T034 — Banc headless local : tileset synthétique + scénario mouvement/arrêt

> Seule source de vérité de l'agent T034. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer un banc headless LOCAL réutilisable : (1) `G/e2e/bench-tileset.mjs` génère un tileset synthétique dont le niveau de détail affiché se LIT sur une capture ; (2) `G/e2e/bench-3d.mjs` ouvre la vue 3D du projet Villelaure, orbite à la souris, s'arrête, mesure requêtes/états de tuiles et prend des captures. Puis le lancer 1× sur l'arbre actuel et coller la sortie. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `G/e2e/bench-tileset.mjs` ≤ 400 l, 0 dépendance : écrit `$STORE/villelaure-real/{tileset.json,project.json,t/*.glb}` ; `$STORE` obligatoire, refuse un chemin sous `G/seed-data` (exit 2)
- [ ] tileset : quadtree DEPTH niveaux (déf 4 ⇒ 1+4+16+64 = 85 glb ; env `DEPTH`), box locale |centre| < 1e5, sans `transform`, `asset.gltfUpAxis:"Y"`, `geometricError` 64→16→4→1, feuilles 0, `refine:"REPLACE"`, box enfants ⊂ parent
- [ ] chaque glb : grille plane texturée (≈ 2k triangles) + texture PNG `TEX`×`TEX` (déf 256 ; env `TEX`) dont la COULEUR code la profondeur (0 rouge, 1 orange, 2 vert, 3 bleu, 4+ violet) et un damier de fréquence 2^(profondeur+2) cases ⇒ LOD lisible à l'image ; glb écrit à la main (header 12 o + chunk JSON + chunk BIN, PNG via `zlib.deflateSync` + `zlib.crc32`)
- [ ] `G/e2e/bench-3d.mjs` ≤ 400 l : scénario + mesures du contrat ; sortie `$OUT/bench-<LABEL>.json` + `$OUT/bench-<LABEL>-{avant,mouvement,apres}.png` ; LABEL env (déf `run`)
- [ ] exécution réelle complète (stack lancée en arrière-plan, banc, arrêt des process) ; JSON collé ; 3 PNG existants (ls -la) ; `node --check` des 2 fichiers
- [ ] tous les process lancés tués à la fin (`ss -ltn | grep -E ':(4010|5180)\b'` → ∅) ; ports 4000/5173 jamais touchés
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/e2e/bench-tileset.mjs` | E (neuf) | générateur |
| `G/e2e/bench-3d.mjs` | E (neuf) | scénario playwright-core |
| `G/e2e/diag-stream.mjs` | L | modèle : launch, login, iframe, comptage :50-110 |
| `G/e2e/proof-refine.mjs` | L | modèle : attente stable, hooks |
| `G/e2e/_proofEnv.mjs` | L | DIR (`$OUT`) |

## Contrats
Démarrage (T033, NV en exécution) :
```
STORE=<TMP>/storage  OUT=<TMP>/out  (TMP = mktemp -d)
node e2e/bench-tileset.mjs
cd api && PORT=4010 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5180 SEED_DEMO=1 npx tsx src/index.ts   # PAS npm run dev (tsx watch)
cd web && npm run build && VITE_API_TARGET=http://localhost:4010 npx vite preview --port 5180 --host   # dist du 08/10 périmé ⇒ build obligatoire
BASE=http://localhost:5180 node e2e/bench-3d.mjs
```
Faits T033 :
- comptes : `admin@demo.geolens.fr` / `demo1234` ; projet Villelaure id `0a1b2c3d-0000-4000-8000-000000000203`, prefix `villelaure-real`, `tileset_path='tileset.json'`
- `project.json` minimal par prudence : `{"version":"1.1","project":{"name":"synthetique"}}`
- route tuile : `GET /api/projects/:id/storage/*?token=` ; `Cache-Control: private, max-age=86400, immutable` ⇒ `browser.newContext()` NEUF par run ; 302 inactif en local
- glb natif (3d-tiles-renderer 0.3.46 TilesRenderer.js:661) ; box |c| > 1e6 ⇒ branche ECEF (à éviter)
- launch : `chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox']})` ; viewport 1920x1200 ; chromium_headless_shell-1228 déjà installé (pas d'install)
- login : goto `BASE/login` · `#email` · `#pw` · `getByRole('button',{name:/se connecter/i})` · attendre `.gl-project` (20 s) · goto `BASE/projects/${id}` · `page.locator('iframe').waitFor()` · frame = `page.frames().find(f=>f.url().includes('viewer.html'))` · `frame.getByRole('button',{name:/explorer en 3d/i}).click()`
- hooks iframe : `window.__glrTiles` (TilesRenderer : `.errorTarget`, `.downloadQueue.maxJobs`, `.lruCache.cachedBytes`, `.traverse(cb)` ; tuile `__loadingState`, `__visible`, `__inFrustum`, `__depth`) · `window.__glrTileMem` · `window.__tileCount` (addInitScript + event `glr:tile-loaded`) · `window.__glrTest.camPos()` lecture seule · `window.__glrMotionGate = {allowed, transitions}` (T032) · console `[motion-gate] gel` / `[motion-gate] reprise (immobile ≥ 500 ms)`
- caméra NON exposée ⇒ souris : `box = await frame.locator('canvas').first().boundingBox()` puis `page.mouse.move/down/move(steps)/up` (gauche = orbite) ; vérifier `camPos()` ≠ initial
- SwiftShader lent (~45 s de stabilisation possibles) ; proof-refine affirme 0 interaction : ne pas reprendre `interactions===1`
Scénario (contrat T033) :
```
contexte neuf → login → projet → « Explorer en 3D »
1 stable : __tileCount inchangé 4 relevés × 1,5 s (max 90 s) ; capture avant
2 orbite 6 s : drag canvas ±300 px, steps 30, boucle ; capture mouvement en fin de drag (souris encore enfoncée) ; camPos ≠ initial
3 arrêt : mouse.up ; T0 ; attendre 5 s ; relevés /250 ms ; capture apres à T0+5 s
mesures JSON : reqMouvement = requêtes /storage/ (.glb|.json) démarrées ∈ [début drag, fin drag]
  · reqArret ∈ [fin drag, +5 s] · delaiRepriseMs = 1re requête après fin drag − fin drag
  · par phase (avant, fin mouvement, fin arrêt) : loaded, inFrustum, visible, maxDepthVisible, histogramme profondeur visible (traverse)
  · maxJobs échantillonné /250 ms pendant drag · camPos avant/après · statuts HTTP · pageerror + console error · motionGate transitions
```

## Décisions actées
- D24 : gel = `downloadQueue.maxJobs = 0` pendant mouvement ; reprise après 500 ms immobile ; fetch en vol finissent
- banc = local seulement ; 0 serveur de test ; seed-data/ intouché
- le banc MESURE et rapporte ; il n'échoue (exit 1) que sur erreur technique (login, iframe, 0 tuile, pageerror) — jugement = vérificateur

## Hors périmètre
- web/src, api/src (aucune modif) ; seed-data/ ; e2e/package.json (playwright-core déjà en node_modules)
- serveur de test ; commit, push ; Docker

## Dépendances de comportement
- `npm run build` web ≈ 20-35 s ; `vite preview` sert `web/dist`
- API mem-db + SEED_DEMO sème comptes et projets au boot
- tuiles servies depuis `$STORE/villelaure-real/` (STORAGE_LOCAL_ROOT)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 dans G/e2e/node_modules ; import `playwright-core` comme diag-stream.mjs
- ports libres 4010, 5180 ; occupés 4000 (OrthoPro), 5173 (OrthoPro) — intouchables
- arbre G sale attendu (C3 + T032 non commités) — ne rien annuler
- fish possible : rediriger la sortie des process d'arrière-plan vers fichier dans $TMP

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Bash(node, npx tsx, npm run build, npx vite preview, mktemp, ls, ss, kill, curl local, sed -n, rg)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T034
statut: fait | bloque
---
## Fait
- chemin:L — quoi
## Mode d'emploi
commandes exactes (copiables) démarrage → banc → arrêt
## Vérifié comment
commande → sortie brute (JSON du run collé, ls des PNG)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
