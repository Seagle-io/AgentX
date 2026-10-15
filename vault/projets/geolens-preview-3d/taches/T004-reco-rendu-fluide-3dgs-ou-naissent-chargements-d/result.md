---
tache: T004
statut: fait
---
V=…/web/src/viewer · S=…/seed-data/storage/villelaure-real/3dgs · G=…/geolens-web-feat-viewer-online
## Cycle de vie du mode fluide
- sélection mode : main.ts:5417 `lodMode: readSplatLodMode()` → loadLcc2Scene (main.ts:5411, branche kind==='lcc2' :5403)
- Lcc2Loader.ts:89-92 effectiveLodMode — non-fixed exige camera ET levels.length>1, sinon 'fixed'
- Lcc2Loader.ts:94-98 selectInitialLevel — fluid/stream → levels[0] (depth 1 = plus grossier, 1 fichier, 459 029 splats)
- Lcc2Loader.ts:152-171 boucle `await loadSplat` séquentielle sur les tuiles du niveau initial → baseTiles Map<rel,handle>
- Lcc2Loader.ts:201 startLiveStreamer → :115-120 `new Lcc2FluidStreamer({budget: clampFluidBudget(ctx.budget), targetPx: ctx.streamTargetPx ?? 1000, initialTiles: baseTiles})` + `.start()`
- Lcc2Loader.ts:202 streamerOwnsBase=fluid → dispose() ne libère pas les handles de base (le streamer le fait) :204-209
- Lcc2FluidStreamer.ts:113 ctor → adoptInitialTiles :161-170 (entries, shown=true)
- Lcc2FluidStreamer.ts:115,151-155 start()/loop : requestAnimationFrame, `tick()` CHAQUE image (auto-piloté, 0 appel externe)
- Lcc2FluidStreamer.ts:131-140 tick : governor.onFrame → viewChanged (matrices caméra+groupe) → evaluate si dirty → updateFades
- main.ts:5445 `currentSplatStreamer = r.streamer` ; main.ts:5585 reset ; qualityHud.ts:356-367 curseur détail → setTargetPx
- changement de mode UI = rechargement de la scène : splatLodModeControl.ts:27-34 (writeSplatLodMode + reloadActiveModel)
## Points dynamiques (chargement, libération, LOD, opacité)
- recalcul de coupe `evaluate` · Lcc2FluidStreamer.ts:191-212 · caméra/groupe bougent (viewChanged :173) OU dirty
- dirty=true · :118 setTargetPx (curseur) ; :282 fin de load() ; :314 onBudgetDropped ; init :97
- coupe sous budget `selectFluidCut` · lcc2FluidCut.ts:~122-150 (affine si erreur>seuil ET tient dans budget) · à chaque evaluate
- hystérésis · lcc2FluidCut.ts:~101 wantsRefine ; KEEP_REFINED_RATIO 0,5 lcc2FluidMetric.ts:14
- erreur écran · lcc2FluidMetric.ts:32-36 tileErrorPx (distance caméra → dépend du mouvement)
- affichage sans trou `resolveFluidDisplay` · lcc2FluidCut.ts:~190-202 · après chaque coupe
- chargement tuile · scheduleLoads :266-274 → load :276-291 (loadSplat via loadFile :293) · cut ∖ entries, max 5 simultanés (:30), retry 5 s (:32,285)
- chargement ajoute au groupe, setVisible(false) :288 puis entries.set :289
- fondu entrée · applyDisplay :231-242 → showWithFade :244-248 setOpacity(0)→1 sur 350 ms (FADE_MS :28) · updateFades :250-264 chaque image
- retrait tuile remplacée · :238-240 retireAt=now+350 ; :257-262 setVisible(false) (tuile reste en mémoire)
- opacité réelle · SparkAdapter.ts:65-67 `mesh.opacity` ; interface splatEngine.ts:49 (setOpacity optionnel)
- libération LRU · evict :302-311 (appelé à la fin de chaque evaluate :211) → pickEvictions lcc2TileLru.ts:27-41 ; plafond = governor.budget × CACHE_FACTOR(2) :34 ; tuiles `shown` épinglées
- régulateur · lcc2BudgetGovernor.ts:104-122 onFrame : fps<25 (minFps :95) pendant 3 s (:96), warmup 2 s (:97) → budget ×0,75 (:98,125) jusqu'à min 500 k ; jamais de remontée ; émet FLUID_BUDGET_DROP_EVENT (:316, toast splatLodModeControl.ts:36-40)
- budget preset · lcc2FluidMetric.ts:16-17,52-55 clampFluidBudget : [500 k ; 6 M], non fini → 6 M
- budget preset source · main.ts:3985-3993 splatBudgetFromPct : 100 % → Number.MAX_SAFE_INTEGER ; sinon 0,5→20 M log ; défaut 30 % ≈ 1,5 M (:3979)
- dispose total · Lcc2FluidStreamer.ts:142-149 (cancelAnimationFrame + libère tout)
## Sources de clignotement candidates
- swap parent→enfants (remplacement, retire parent après 350 ms) · Lcc2FluidStreamer.ts:238-240,257-262 + lcc2FluidCut.ts:resolveFluidDisplay
- fondu enfants 0→1 en 350 ms pendant que le parent est encore plein opacité : double-couche = surbrillance/plus dense · :247 ; z-order/tri non coordonné entre meshes
- double affichage base + fines : parent (opacité 1) + enfants en fondu superposés 350 ms · :239 commentaire « reste visible derrière le fondu »
- re-évaluation à CHAQUE mouvement caméra → coupe change au gré de distance/angle · :134,173-184,191 ; seuil `OUT_OF_VIEW_FACTOR` 0,2 lcc2FluidMetric.ts:12 (tuile qui entre/sort du frustum change d'erreur ×5)
- oscillation de coupe autour du seuil (hystérésis 2:1 seulement) · lcc2FluidCut.ts:~101 ; tuile fine sortie de coupe puis rechargée si évincée
- budget governor : baisse en cours de navigation → coupe re-décidée, tuiles retirées/remplacées (fps<25, p.ex. rendu logiciel/headless) · lcc2BudgetGovernor.ts:104-122 → Lcc2FluidStreamer.ts:133,313-317
- LRU : plafond 2×budget ; total 3DGS = 14 299 626 > 12 M (budget 6 M×2) → éviction + rechargement possible · :302-311 ; lcc2TileLru.ts:27-41
- échec réseau tuile → retry 5 s → apparition tardive · :283-286
- load() async termine → dirty → re-coupe → fondu soudain en pleine navigation · :281-282
- slider détail en direct → dirty · :118 ; qualityHud.ts:356-359
- tri des splats Spark : SparkAdapter.ts ∅ code de tri (délégué à SparkRenderer, `import … SparkRenderer` :24) ; ajout/retrait de SplatMesh au groupe (`group.add` :288, `group.remove` :321) re-trie/regénère → NV (pas de lecture de Spark)
- opacité mesh Spark `mesh.opacity` : SparkAdapter.ts:66 ; Spark masque un splat à opacité 0 ≠ visible=false ; NV effet sur tri
## Pleine qualité : chiffres du manifest
Calcul node sur S/APT.lcc2 (même logique que parseLcc2Manifest, Lcc2Manifest.ts:138-160). `lodSplats` du manifest = mêmes valeurs. totalLevels=5.
| depth | fichiers .sog | nœuds | splats | octets .sog |
|---|---|---|---|---|
| 1 (grossier, initial fluid) | 1 | 22 | 459 029 | 8 062 445 |
| 2 | 2 | 22 | 920 024 | 16 128 885 |
| 3 | 4 | 33 | 1 843 699 | 32 148 524 |
| 4 | 7 | 52 | 3 688 114 | 62 334 791 |
| 5 (FIN) | 14 | 71 | 7 388 760 | 121 316 445 |
- somme niveaux 14 299 626 = totalSplats ; env.sog (79 630 splats) exclu du calcul ; 29 entrées splatFiles, env = index 28 data/3dgs/env.sog ; 241 959 387 o sur data/3dgs (29 fichiers)
- depth 0 (racine) ∅ données 3dgs ; levels triés grossier→fin (Lcc2Manifest.ts:97)
- 'fixed' : selectLcc2Level Lcc2Manifest.ts:190-208 → plus fin avec totalSplats ≤ budget, sinon levels[0] (overBudget) ; à budget 100 % (MAX_SAFE_INTEGER) → depth 5, 7 388 760 splats
- PIÈGE : fluid plafonne le budget à 6 M (lcc2FluidMetric.ts:17,52-55) < 7 388 760 → la coupe fluide NE PEUT JAMAIS afficher tout depth 5 ; et governor min 500 k
- PIÈGE : cache LRU plafond 12 M < 14,3 M total
- budget preset le plus haut = illimité à 100 % (main.ts:3989-3991) côté 'fixed' ; fluid le tronque à 6 M
- niveau fin 5 : 14 fichiers = 14 `loadSplat` ; groupes d'unités fluid via buildLcc2FileGroups (lcc2FileGroups.ts) = ensembles de fichiers liés (nb groupes NV)
## Banc 3DGS
- forcer fluid : `localStorage['geolens.splatLodMode']='fluid'` avant chargement (core/splatLodMode.ts:11 clé ; valeurs 'fixed'|'stream'|'fluid' :9,20-22 ; repli ancienne clé 'geolens.splatStreaming'==='1' → 'stream' :13,34) → Playwright `page.addInitScript(()=>localStorage.setItem('geolens.splatLodMode','fluid'))`
- case UI : V/index.html:801-802 `#splat-fluid-toggle` ; `#splat-streaming-toggle` ; change → écrit clé + reloadActiveModel (ui/splatLodModeControl.ts:25-34)
- 100 % détail : `localStorage['geolens.splatDetailPct']='100'` (main.ts:3998-4004 ; défaut 30) → budget illimité, targetPx 250 (main.ts:4008-4011), refine 0,5 px (lcc2FluidMetric.ts:47-49)
- deliverable lcc2 réel (S/../project.json) :
```
{"id": "gaussian-splat-lcc2", "name": "Gaussian Splatting (LCC2, beta)", "type": "gaussian_splat", "kind": "lcc2", "filename": "3dgs/APT.lcc2", "format": "3DGS LCC2 (XGrids)", "viewMode": "3d"}
```
- project.json réel : 4 deliverables, version "1.1" ; clic carte : `[data-deliverable-id="gaussian-splat-lcc2"]` (main.ts:4936 rendu cartes)
- banc existant G/e2e/bench-tileset.mjs:166-172 écrit project.json synthétique ; STORE sous seed-data refusé (:23-25) ; 3 autres fichiers G/e2e/bench-3d.mjs (171 l), _proofEnv.mjs (42 l) NV non lus
- tileUrl : main.ts:5424-5428 → `${manifestDir}/${rel}` signé par `window.__glrSignUrl` (web) sinon toGlrFileUrl ; rel = `data/3dgs/X.sog` relatif au manifest ; en banc web = URL http signée du backend (glr-file:// = desktop)
- copie S → `$STORE/villelaure-real/3dgs` (APT.lcc2 + data/3dgs/*.sog, 234 Mo) suffisante par l'arborescence (project.json filename `3dgs/APT.lcc2`) ; info/ et data/mesh non requis pour 3DGS (data/mesh = companionMesh, NV)
- MAIS un project.json par STORE : merger deliverable lcc2 dans celui du banc (ou copier project.json réel, 4 deliverables) — `deliverables[]` obligatoire
- observables EXISTANTS : `window.__` ∅ dans loaders/lcc2, services/gaussianSplat, core (rg → 1 hit sans rapport core/SceneManager.ts:408)
- stats() : Lcc2FluidStreamer.ts:123-128 `{loaded, shown, loading, splatsLoaded}` mais streamer non exposé sur window (seul `currentSplatStreamer` export module main.ts:4012, typé {setTargetPx} ; ∅ window)
- console : `[3dgs] LCC2 : ${reason} — N tuiles` Lcc2Loader.ts:132 ; `[3dgs] LCC2 chargé : n/total tuiles, X splats, depth d/T, ms` :197 ; warn `[lcc2-fluid] …` (:297,322) → `page.on('console')` suffit pour compter chargements initiaux
- metricsLog('lcc2_tile'/'lcc2_loaded') → window.glrAPI.debugLog (main.ts:5397-5399), NV en web
- événement window `glr:fluid-budget-drop` (splatLodMode.ts:15) = seul événement du streamer
- compteur à ajouter : point unique = Lcc2FluidStreamer.ts (loads :289, frees :319-325 disposeHandles, lodChanges :237 showWithFade + :259-261 retrait) ; dans le nouveau chemin (sans streamer) : Lcc2Loader.ts:155 loop (loads) ; exposer `window.__glrSplatStats`
## Contrat proposé
```
D3 : fluid = chargement unique pleine qualité, 0 dynamisme
1. Point de coupe UNIQUE : Lcc2Loader.ts:89-98 + :110-112. effectiveLodMode ne renvoie plus 'fluid' (→ 'fixed' si camera&&levels>1, ou 'fluid' conservé comme drapeau `fullQuality`).
2. Niveau : si lodMode==='fluid' → level = parsed.levels[parsed.levels.length-1] (depth 5, 14 .sog, 7 388 760 splats), SANS selectLcc2Level ni budget ; overBudget=false ; reason `fluid : pleine qualité depth=…`.
3. startLiveStreamer renvoie null pour fluid (pas de Lcc2FluidStreamer) ; streamerOwnsBase=false → dispose libère les handles (:206) ; result.streamer=null.
4. Réutilise la boucle de chargement existante :152-171 (même code que 'fixed') ; onProgress inchangé.
5. Garde mémoire : avant la boucle, estimer octets = estimateSplatBytes(Σ splats) (splatEngine.ts) ; si > seuil (à fixer par l'architecte, NV) → console.warn + repli sur selectLcc2Level(parsed, budget) ; sinon chargement complet. 0 garde existante aujourd'hui (rg ∅).
6. Compteur banc : `window.__glrSplatStats = {loads, frees, lodChanges, tiles, splats}` posé dans Lcc2Loader (loads++ à chaque loadSplat réussi :156 ; frees++ au dispose ; lodChanges=0 constant) ; Playwright lit avant/après navigation : delta loads=0, frees=0, lodChanges=0.
7. Conséquences à traiter : currentSplatStreamer=null → curseur détail non live (qualityHud.ts:356-367 : persiste seulement) ; toast budget-drop plus émis ; case UI index.html:802 libellé « LOD adaptatif » à renommer ; Lcc2FluidStreamer.ts/cut/governor/lru deviennent code mort pour fluid (conserver pour 'stream' ? stream n'utilise PAS ces fichiers : Lcc2Streamer.ts).
8. Tests : Lcc2FluidStreamer.test.ts, lcc2Fluid*.test.ts restent valides (modules purs intacts).
9. Banc : addInitScript 'geolens.splatLodMode'='fluid' + 'geolens.splatDetailPct' sans effet requis ; navigation caméra 30 s ; assert window.__glrSplatStats stable + capture console 0 nouveau `[3dgs] LCC2 chargé`.
```
## Vérifié comment
- `node -e` (lecture S/APT.lcc2, walk identique à Lcc2Manifest.ts:138-160) → `depth 1 files 1 nodes 22 splats 459029 bytes 8062445` / `depth 2 files 2 nodes 22 splats 920024 bytes 16128885` / `depth 3 files 4 nodes 33 splats 1843699 bytes 32148524` / `depth 4 files 7 nodes 52 splats 3688114 bytes 62334791` / `depth 5 files 14 nodes 71 splats 7388760 bytes 121316445` ; `allfiles bytes 241959387` ; `splatFiles 29 env 28 data/3dgs/env.sog`
- `python3 json.load(S/../project.json)` → 4 deliverables, entrée `gaussian-splat-lcc2` ci-dessus
- `rg 'window\.__|__glr|__splat|__lcc' loaders/lcc2 services/gaussianSplat core` → 1 hit (SceneManager.ts:408 sans rapport)
- NV : exécution navigateur, comportement Spark (tri), nb de groupes lcc2FileGroups, bench-3d.mjs
- Lignes `lcc2FluidCut.ts:~NNN` approximatives (lues par sed partiel 80-202, fonctions `wantsRefine`, `selectFluidCut`, `resolveFluidDisplay` en fin de fichier)
## Écarts
- lecture hors WL: V/ui/splatLodModeControl.ts — case UI + rechargement (cité par pack via index.html)
- lecture hors WL: V/index.html:801 (rg ciblé) · V/services/gaussianSplat/splatEngine.ts:40-55 — interface setOpacity (cité par pack :49)
- lecture hors WL: S/../project.json — explicitement demandé par DoD
- rg hors WL: ui/qualityHud.ts (curseur direct), main.ts:3970-4015 (budget, localStorage) — dans V/main.ts WL ciblé
## Pour la suite
- Implémenteur WL ≤ 6 : Lcc2Loader.ts (seul changement logique), ui/qualityHud.ts:356-367 (curseur sans streamer), index.html:802 (libellé), splatLodMode.ts (commentaire), e2e nouveau banc, Lcc2Loader test (créer, ∅ existant pour le loader).
- Faits clés : fluid aujourd'hui = base depth1 (459 k) puis streamer ; plafond fluid 6 M < 7,39 M du depth 5 → impossible de « tout charger » via le streamer ; solution = court-circuiter le streamer et réutiliser la boucle 'fixed' avec levels.at(-1) (14 .sog, 121 Mo, 7 388 760 splats).
- Piège banc : headless rendu logiciel → governor chute le budget (fps<25) ; supprimer le streamer évite ce biais. 7,39 M splats en headless = lent/VRAM : prévoir garde mémoire et timeout ≥ 120 s.
- Banc : STORE tmp, copier S (234 Mo) → `$STORE/villelaure-real/3dgs`, project.json avec deliverable lcc2 (format ci-dessus), addInitScript localStorage 'geolens.splatLodMode'='fluid', clic `[data-deliverable-id="gaussian-splat-lcc2"]`, compteur `window.__glrSplatStats`.
- Décision à trancher (architecte) : seuil garde mémoire et repli ; sort du mode 'stream' inchangé.
## Retour sur le pack
- Manquait: taille cible GPU/VRAM headless ; lecture de bench-3d.mjs pour flux login/ouverture projet web ; autorisation de lire ui/splatLodModeControl.ts et splatEngine.ts
- Inutile: ∅
