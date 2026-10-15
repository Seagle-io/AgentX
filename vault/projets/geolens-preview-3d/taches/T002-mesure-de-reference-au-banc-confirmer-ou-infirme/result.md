---
tache: T002
statut: fait
---
## Verdicts
Réf = G HEAD 17d1f85 + arbre non commité · lib 3d-tiles-renderer 0.3.46 · banc DEPTH=6 TEX=512 (1365 glb) · SwiftShader · viewport 1920×1200 (canvas 1639×1057 CSS)

| id | verdict | chiffres | PNG |
|---|---|---|---|
| H1 | CONFIRMÉE (budget serré) · volet isFull INFIRMÉ | budget 600 MiB : ET 1→4→1→4→1 entre 75 et 81 s, file dl 250↔0, tc figé 587 pendant 8 s · budget défaut 1024 MiB : ratio max 0,852, isFull()=false sur 100 % des relevés | t002-h1-force600-rasante.png, t002-h1-std-z4-arret15s.png |
| H2 | NON MESURABLE | seuil hardGpuCeil = 4000 textures (std) > 1365 tuiles du banc ; parcours 60 s : tex max 360, maxBytesSize 1024 MiB sur 22/22 relevés, 0 `[vram-watchdog]` | t002-h2-std-final.png |
| H3 | NON MESURABLE | 0 `[vram] backpressure` ; maxJobs final au repos = 6 ; les maxJobs=0 du parcours = gel D24 | t002-h2-std-final.png |
| H4 | CONFIRMÉE | vue 10,4° : 355/355 textures de tuiles anisotropy=1 ; GL MAX_TEXTURE_MAX_ANISOTROPY=16 | t002-h4-std-z4-rasante.png |
| H5 | CONFIRMÉE | ortho : tr.cameras[0]=Perspective ≠ active ; used 357/vis 268 identiques avant/après zoom et drag ; 0 log motion-gate | t002-h5-ortho-avant.png, t002-h5-ortho-zoom.png |
| H6 | CONFIRMÉE | ET effectif plancher = 1 (std 4→2→1 ; haute 2→1 ; maximale 1) ; jamais < 1 ; D1 demande 0,5 px physique | t002-h1-disc-haute-arret-long.png |
| H7 | NON MESURABLE | project.json du banc = 1 livrable ⇒ fusion non déclenchable | ∅ |
| H8 | CONFIRMÉE | dpr 1/2/3 → pixelRatio 1/2/2 ; buffer à dpr 3 = 3278×2114 (attendu 4917×3171) ; dpr modifié en session : pixelRatio et buffer inchangés | t002-h8-dpr{1,2,3}-dpr.png |
| H14 | CONFIRMÉE (near) · z-fighting non observé | near 0,3 / far 50000 fixes à 0,5 m, 332,7 m et 10000 m (ratio 1,67e5) ; à 0,5 m le bas de l'image est coupé par near | t002-h14-{moyen,loin,proche,proche-rasant}.png |
| H15 | CONFIRMÉE | 503 1× sur t/4_5_5.glb → __loadingState=-1 (FAILED), stats.failed=1, 1 seule requête en 21 s, trou visible | t002-h15-apres15s.png, t002-h15-apres-zoom.png |

## Détails
- H1 · std, zoom 8 crans (dist 5,49 m), arrêt 15 s · ET 4→2→1 à 1,1/3,4/4,5 s ; cache 488→542/1024 MiB ; isFull false ; 67 tuiles visibles `__error>ET` non remplacées (max 135,7 px) ; enfants : 248 PARSING / 20 LOADED ⇒ goulot = parse SwiftShader, pas le cache
- H1 · std, zoom 6 (15,3 m), 15 s + 120 s · à 15 s : 75 non remplacées (max 9,2 px) ; convergence à ~110 s ; plateau cache 871 MiB = minBytesSize (0,85×max) ; LOADED 638 ; 0 non remplacée
- H1 · std, zoom 4 (42,8 m), 15 s + 150 s · à 170 s : 32 non remplacées (max 12,3 px), 90 enfants PARSING ; cache 871 MiB (r=0,851), isFull false
- H1 · std, zoom 4 + vue 10,4°, 150 s · used 649, LOADED 638, cache 871 MiB (r 0,851) ; 44 non remplacées (max 27,5 px), 125 PARSING ; garde 90 % jamais atteinte
- H1 · GPU stub « discrete » + haute · maxBytes 1792 MiB, maxJobs 8, ET 2→1 ; 15 s : 73 non remplacées ; 135 s : 0, r 0,56
- H1 · stub discrete + maximale, zoom 4 · maxBytes 2560 MiB, maxJobs 12, ET 1 ; 170 s : 17 non remplacées, 600 PARSING, r 0,404
- H1 · forcé `glr.tileCacheMB=600`, zoom 4 + vue 10,4° · r 0,913 à 75 s ⇒ ET 4 (vis 226→167) ⇒ r 0,872 ⇒ ET 1 ⇒ r 0,924 ⇒ ET 4 ⇒ ET 1 ; de 82 à 90 s dl alterne 268/256, tileCount figé 587 ⇒ boucle sans progrès, pas d'hystérésis
- H1 · mécanisme observé : la LRU évince jusqu'à minBytes (0,85×max) dès que cachedBytes > min ⇒ r > 0,9 seulement si le working set utilisé dépasse 0,9×max (≈ 675 tuiles TEX512 à 1024 MiB)
- H2/H3 · parcours 60 s (22 gestes : rotation/translation/molette, dist 47→10000 m) · maxBytes 1024 MiB constant ; tex/geom 360/370 ; maxJobs=0 sur 21/22 relevés = gel D24 en mouvement ; repos +2 s → 6
- H2/H3 · banc 2 DEPTH=7 TEX=8 (5461 glb), preset économe (seuil 2500) · 552 tuiles chargées en 392 s (~1,4/s) ⇒ seuil hors d'atteinte ; abandonné
- H4 · zoom 4, rotation (bouton du milieu) jusqu'à 10,4° · histo anisotropy {1: 355} ; max GL 16
- H5 · touche `5` · cameraType Orthographic ; trCamType Perspective ; trCamIsActive false ; après 10 crans de molette dist 332,7→1,97 m : used/visible/états inchangés, 0 téléchargement ; drag ortho : logsOrtho=[]
- H5 · annexe · en ortho la molette fait un dolly, pas un zoom : la caméra avance à 1,97 m, la moitié avant du plan est coupée (ortho-zoom.png)
- H8 · dpr1 : PR 1, buffer 1639×1057 · dpr2 : PR 2, 3278×2114 · dpr3 : PR 2, 3278×2114 · CDP dpr 1→2 : PR 1, 1639×1057 · CDP dpr 3→1 : PR 2, 3278×2114 ⇒ jamais relu
- H14 · moyen 332,7 m : rendu OK · très proche 0,5 m (minDistance) : near 0,3, plan à 0,19 m sous la caméra ⇒ bande basse vide (pixel (1100,1000) = fond 1f2428) · vue 6,3° à 0,5 m : seule une bande 540-710 px est rendue
- H14 · annexe · loin 10000 m (maxDistance) : 16 tuiles d2 visibles côté LOD mais 0 px ≠ fond dans le carré central 160×160 ; scene.fog FogExp2 densité 0,00025 ; fog=null → 172 px (vert d2) ⇒ modèle noyé dans le brouillard
- H15 · route 503 1× · 15 s : loadingState -1, used true, inFrustum true, parent LOADED non visible, frères [3,3,3,-1] ; +3 crans molette +6 s : visible true, toujours -1, failHits 1 ; barre d'état « Modèle prêt · 356 tuiles »
- annexe · lib 0.3.46 : FAILED = -1 ; Loader:810,834-835 suppose FAILED=4 ⇒ dumpTilesDiagnostic range FAILED dans OTHER

## Vérifié comment
T=/tmp/t002-kWIp ; OUT=$T/out (JSON + PNG) ; script $T/probe.mjs (dérivé de bench-3d.mjs, env SCEN/LABEL/STUB/PRESET/DPR/ZOOM/EXTRA/STILL/EVERY/TILECACHE/FAILTILE)
```
STORE=$T/storage DEPTH=6 TEX=512 node e2e/bench-tileset.mjs → 1365 glb (51020 Kio), DEPTH=6 TEX=512
npx vite build --outDir $T/dist → rc=0 ✓ built in 18.75s
BASE=http://localhost:5182 OUT=$T/out LABEL=ref node e2e/bench-3d.mjs → stable en 90972 ms : tiles=321 vis=238 depth=4 ; reqMouvement=0 reqArret=0
SCEN=h1 LABEL=h1-std ZOOM=8 → final ET 1 cache 542/1024 isFull False visErrGtNonRemplacees 67 maxErrVis 135.67 enfants [0,0,248,20,0,0]
SCEN=h1 LABEL=h1-std-long ZOOM=6 EXTRA=120000 → finalLong cache 871/1024 r 0.851 LOADED 638 vis {'5':307} nr 0
SCEN=h1 LABEL=h1-std-z4 ZOOM=4 EXTRA=150000 → finalLong r 0.851 nr 32 maxErrVis 12.26 PARSING 90
SCEN=h1 LABEL=h1-disc-haute STUB=1 PRESET=haute ZOOM=6 EXTRA=120000 → config {qualityPreset: haute, errorTarget: 2} ; tier=discrete ; max 1792 ; ET 1
SCEN=h1 LABEL=h1-disc-max-z4 STUB=1 PRESET=maximale ZOOM=4 EXTRA=150000 → max 2560 jobs 12 ET 1 r 0.404
SCEN=h4 LABEL=h1-force600 TILECACHE=600 ZOOM=4 STILL=90000 EVERY=1000 → changements ET [(1,4,2),(2,2,1),(75,1,4),(76,4,1),(78,1,4),(79,4,1)] ; final ET 4 r 0.911
SCEN=h2 LABEL=h2-std → max 1024 ×22 ; tex 360 ; logs vram [] ; repos jobs [0,6,6,6,6,6,6,6]
SCEN=h4 LABEL=h4-std-z4 ZOOM=4 STILL=150000 → tilt [26.8,47.2,26.8,6.3,2.2,6.3,10.4] ; aniso {'texturesTuiles':355,'histoAnisotropy':{'1':355},'maxAnisotropyGL':16}
SCEN=h5 LABEL=h5 → orthoAvant activeCamType OrthographicCamera trCamType PerspectiveCamera trCamIsActive False ; orthoApresZoom used 357 visible 268 dist 1.97 ; logsOrtho []
SCEN=h8 DPR=1 DPR2=2 → avant PR 1 [1639,1057] ; apresChangementDpr dpr 2 PR 1 [1639,1057]
SCEN=h8 DPR=2 → PR 2 [3278,2114] · SCEN=h8 DPR=3 DPR2=1 → PR 2 [3278,2114] ; après dpr 1 : PR 2 [3278,2114]
SCEN=h14 → near 0.3 far 50000 ratio 166667 à dist 332.72 / 10000 / 0.5
SCEN=h14b → fog {'density':0.00025,'color':'1f2428'} ; px≠fond centre : pas1 0, sansfog 172
SCEN=h15 FAILTILE=t/4_5_5.glb → tuile loadingState -1 ; failHits 1 ; après zoom loadingState -1 visible True failHitsApresZoom 1 ; stats.failed 1
banc 2 : STORE=$T/storage2 DEPTH=7 TEX=8 → 5461 glb ; SCEN=h3 PRESET=econome → {"dt":391970,"tex":452,"loaded":552,"jobs":4} → arrêté
ss -ltn | grep -E ':(4012|5182)\b' → ∅ (rc=1) ; G git status : 0 fichier hors liste initiale
```

## Écarts
- lecture hors WL : G/web/src/viewer/core/vramBackpressure.ts:1-60 — seuils textures pour H2/H3
- lecture hors WL : G/web/src/viewer/main.ts:1490-1530, 2915-2935, 2989-3003 — regex tier GPU, __glrTest, __glrDiag
- lecture hors WL : G/web/node_modules/3d-tiles-renderer/package.json — version de la lib (0.3.46)
- rg ciblé (autorisé) : SettingsManager `glr.settings.v1` ; navigationScheme.ts:25-26 (bouton gauche = translation)
- API 4012 relancée 1× sur $T/storage2 (banc 2), mon port uniquement

## Pour la suite
- P1 H15 : relancer les tuiles FAILED (resetFailedTiles + backoff) ; trou définitif + « Modèle prêt » trompeur
- P1 H5 : setCamera/deleteCamera au toggle ortho + pose du motion gate sur la caméra active ; molette ortho = zoom, pas dolly
- P1 H1 : hystérésis sur la garde 90 % (sortie < 80 %) ; boucle 1↔4 reproduite à budget 600 MiB
- P2 H8+H6 : pixelRatio = dpr réel relu au resize/matchMedia ; plancher ET 0,5/dpr (D1) ; H4 anisotropy = getMaxAnisotropy()
- P2 H14 : near dynamique (∝ distance caméra) ; brouillard FogExp2 0,00025 fixe noie le modèle à 10 km ; H2/H3 à mesurer sur GPU réel ou via un test unitaire du watchdog

## Retour sur le pack
- Manquait : bouton gauche = translation (mode1, navigationScheme.ts:26), rotation = bouton du milieu ; le « gauche = orbite » du pack et de bench-3d est faux
- Manquait : FAILED = -1 dans la lib 0.3.46 (≠ 4 dans le commentaire de Loader:793)
- Manquait : seuils VRAM (std 4000 textures) ⇒ H2/H3 inatteignables avec DEPTH=6 (1365 tuiles) ; à dire avant de lancer
- Manquait : clé preset `glr.settings.v1` {version:1, qualityPreset, userOverridden:true} pour forcer haute/maximale ; levier `glr.tileCacheMB`
- Manquait : stabilisation 90-121 s > plafond de 90 s du banc ; parse SwiftShader ~4 tuiles/s TEX512 ⇒ « 15 s à l'arrêt » ne converge jamais au banc
- Inutile : ∅
