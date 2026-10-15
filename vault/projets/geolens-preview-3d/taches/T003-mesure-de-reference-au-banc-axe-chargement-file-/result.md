---
tache: T003
statut: fait
tags: [result]
---
## Référence chargement
Verdict mesure : **CONFIRMÉ H9, H11 · INFIRMÉ H10, H13 · H12 structure confirmée, coût infirmé**. Banc saturé (load avg 50-76 / 16 cœurs, job tiers `absorptivite.py` ~980 % CPU) ⇒ durées ×3,4 entre runs ; les comptes de requêtes sont stables.
Build = arbre G à `git diff | sha1sum` 79b37f28 (8 fichiers M) ; DEPTH=6 ⇒ 1365 glb, 48,3 Mio ; preset standard, base errorTarget 4, plancher 1 ; parseMaxJobs 4, downloadMaxJobs 6 (lus à chaud).
jetables = requête dont la tuile n'est jamais `__visible` (échantillon /250 ms + snapshot fin) ; colonne balayage = non `__used` au snapshot final.

| scénario | run | requêtes | Mo | jetables | net (ms) |
|---|---|---|---|---|---|
| ouverture (clic→net) | R1 | 357 | 13,0 | 0 | 31886 |
| ouverture | R2 | 359 (2 json, 1×404) | 13,6 | 0 | 74870 |
| ouverture (sup.) | D1 · C1 · C2 | 359 · 357 · 357 | 13,6 · 13,0 · 13,0 | 0 · 1 (racine d0, artefact /250 ms) · NV | 107336 · 78913 · >150000 |
| balayage orbite 180° vue large | R1 | 16 | 0,6 | 0 | 11681 depuis mouse.up |
| balayage orbite 180° vue large | R2 | 16 | 0,6 | 0 | 33294 depuis mouse.up |
| balayage orbite, dolly 3 crans | D1 | 200 | 7,2 | 0 | 181621 |
| balayage orbite, dolly 5 crans | C1 · C2 | 236 · 236 | 8,5 · 8,5 | 0 · 0 | >240000 · >240000 (0,43 fps) |
| dolly 5 crans (molette = mouvement) | calib · C1 · C2 | 512 ×3 | 18,5 ×3 | 72 ×3 | NV · 434601 · >600000 |
| dolly 8 crans | explo1 | 464 | 16,8 | 148 | >150000 |
| pan gauche 2700 px, dolly 5 | calib | 132 | 4,8 | 44 | 51606 |

Goulot mesuré hors H9-H13 : parse ≈ **1 tuile / frame**, quel que soit le fps. 7 runs : 1,24 · 1,16 · 0,98 · 1,01 · 1,02 · 1,00 · 1,07 tuile/frame, à 9,6 · 4,3 · 3,5 · 4,6 · 1,5 · 4,4 · 3,8 fps. Fin des téléchargements à l'ouverture : 10,2-29,8 s. Après le dernier octet, il reste 21,7-136 s de parse (`stats.parsing` max 185-261).

## Verdicts
| id | verdict | chiffres |
|---|---|---|
| H9 | CONFIRMÉ (geste vers zone non cachée) | dolly 5 : 72/512 non `__used` (14 %), 3/3 runs identiques, `downloadQueue.items.length` à la reprise = 180 ×3 · dolly 8 : 148/464 (32 %), q=244 · dolly 3 : 16/736, q=56 · pan : 44/132 (33 %), q=108. Inutiles servies EN QUEUE : rang moyen 0,84-0,99, 0 dans la 1re moitié, 1re inutile +8,9 à +56 s après la reprise ⇒ file triée mais jamais purgée. Orbite 180° : 0 jetable (R1, R2 0/16 ; D1 0/200 ; C1, C2 0/236), q reprise 0·0·0·4·4 — à base 4 rien à charger pendant le geste. Tri profondeur avant frustum : non testable, 100 % des requêtes post-geste en d5 |
| H10 | INFIRMÉ | requêtes ≤ 500 ms après `[motion-gate] reprise` : 0·0·0·0·0 (orbites) · 0·0·18·6·12 (dolly) · 6 (pan) ; hors frustum final 0 dans toutes les phases ; non `__used` 0. Plafond 6 jobs/frame + priorité ⇒ tuiles des poses intermédiaires servies en dernier (cf. H9), pas en rafale |
| H11 | CONFIRMÉ | transitions errorTarget 4→2→1 après mouse.up (ms) : R1 2200/4147 · R2 5362/6473 · D1 2826/4423 · C1 —/8890 · C2 —/5016 (palier 2 sauté à 0,43 fps). Requêtes post-geste en vague et=1 : R1 16/16 · R2 16/16 · D1 200/200 · C1 226/236 · C2 236/236 · pan 78/132 · dolly 374-482/512. Net après arrêt ≥ 11681 ms. Ouverture : vagues et4/et2/et1 = 89/144/124 (R1), 66/90/201 (R2) |
| H12 | structure CONFIRMÉE, coût INFIRMÉ | 352/356 requêtes enfant après le load-model du parent (5 runs ; 4 exceptions = d1 émis à la même ms que la racine). Attente médiane parent→enfant : 842-2355 ms. Σ latences réseau médianes par niveau : 119 ms (R1) · 414 ms (R2) · 750 ms (D1). Cascade R1 (ms, t1re requête) : d0,d1 1802 · d2 5957 · d3 6053 · d4 6589 · d5 9930 ; dernier octet 10152 ; net 31886. Chemin critique = gel caméra d'ouverture (gel 2014 → reprise 5896, 3,9 s ; R2 3,9 s ; D1 4,1 s ; C1 3,9 s) + parse 1/frame, pas Σ latences |
| H13 | INFIRMÉ (tileset de 1365 tuiles) | traverse identique au handler :565-576 : 0,1-0,2 ms médiane (max 4,4). Dispatch `glr:tile-loaded` (tous listeners, dont main.ts:3434 synchrone) : 0,1-0,3 ms médiane (max 0,9). × 357 chargements ≈ 0,1-0,2 s, contre 24-99 s de longtasks. Longtasks à l'ouverture (R1·R2·D1·C1) : nb 193·266·379·287 ; total 24147·66425·98980·70728 ms ; max 830·712·558·574 ; occupation 76·89·92·90 %. Longtasks avec ≥ 1 arrivée de tuile, moyenne avec/sans : 116/130 · 286/226 · 280/254 · 269/233 ms ⇒ pas d'écart systématique. Coût O(N tuiles) par chargement : NV au-delà de 1365 |

## Vérifié comment
- setup : `STORE=$T/storage DEPTH=6 node e2e/bench-tileset.mjs` → `1365 glb (48291 Kio), DEPTH=6 TEX=256` ; `npx vite build --outDir $T/dist` → `✓ built in 19.36s`
- `$T`=/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t003.cFkC (hors vault, éphémère)
- banc d'origine `BASE=http://localhost:5183 OUT=$T/out LABEL=ref node e2e/bench-3d.mjs` → `stable en 90271 ms : tiles=307 vis=226 depth=4` · `reqMouvement=0 reqArret=0 delaiRepriseMs=null cam change=true`
- banc T003 : `$T/bench-t003.mjs`. Journal requêtes = `ctx.on('request'|'requestfinished'|'requestfailed')` (t0, t1, statut, `sizes().responseBodySize`, profondeur lue dans `d_x_y.glb`). addInitScript : PerformanceObserver longtask, wrap de `console.log` (q/dl/pa relevés à l'instant `[motion-gate]`), rAF (errorTarget, frames), échantillon /250 ms (dl, pa, q, pq, mj, et, vis) + ensemble des tuiles déjà visibles. Net = `dl===0 && pa===0 && q===0 && et===1` tenu ≥ 3 s ; firstHit = début de série (identiques sur tous les runs nets)
- runs : `DOLLY=0|3|5 X0C=1 DX=530 STEPS=8 BUTTON=middle LABEL=R1|R2|D1|C1|C2 node bench-t003.mjs` → `[t003 R1] ouverture net=31886 ms req=365` · `[t003 R1] balayage net(15s)=11681 ms req=381` · `[t003 R2] ouverture net=74870 ms` · `[t003 D1] balayage net(long)=181621 ms req=1301` · `[t003 C1] dolly net=434601 ms req=877` · `[t003 C2] ouverture net=TIMEOUT`
- orbite : bouton milieu, 530 px en pas ≤ 8 px → ΔAz −179,6/−179,6/−179,7/−180,0/−180,0° ; geste réel 9024·13319·11355·49193·47917 ms (cible 6000, CDP lent sous charge)
- analyse : `node $T/analyse.mjs $T/out/t003-<L>.json $T/storage` → `$T/out/<L>.ana.json` ; `node $T/dolly.mjs $T/out/t003-{calib,C1,C2,D1,explo1}.json` → `calib {"req":512,…,"qAtReprise":180,…,"unused":72,…,"unusedRank":"0.93","unusedFirstHalf":0,…}` (C1, C2 identiques)
- H13 micro (frame iframe, au repos) : 20× traverse + dispatch → `{"travMedMs":0.2,"dispMedMs":0.1,"travMaxMs":2.3,"dispMaxMs":0.5,"nTiles":1365,"parseMaxJobs":4,"downloadMaxJobs":6}` (R1)
- JSON bruts : `$T/out/t003-{R1,R2,D1,C1,C2,calib,explo1}.json`, `$T/out/bench-ref.json`
- arrêt : `kill 1393776 1393757 1393755 1393754 1393756 1393693` ; `ss -ltn | grep -E ':(4013|5183)\b'` → ∅ (rc=1)

## Écarts
- lecture hors WL : `G/web/src/viewer/main.ts:3420-3455` — handler tile-loaded synchrone ? → oui, mesuré via dispatch
- pack « gauche = orbite » FAUX : gauche = pan (Δcam ⊥ visée, |r| 297→1025). Orbite = bouton milieu (|r| conservé). `bench-3d.mjs` mesure donc un pan de ~20°
- l'orbite dépend du nombre d'événements, pas de la distance : 1000 px en 15 événements → 19°, 600 px × 6 pas → 204°. 530 px × 8 pas → 180°
- sondes `__glrTiles.stats` réelles : `parsing, downloading, failed, inFrustum, used, active, visible` ; `downloading` inclut la file (dl = q + jobs actifs)
- orbite à base 4 depuis vue large/moyenne : rien à charger ⇒ ajout des scénarios dolly + pan pour exposer H9. D2 (dolly 3) interrompu, remplacé par C1/C2 (dolly 5)
- C1, C2 dégradés (0,43 fps au balayage) : net non atteint, `jetables` = vue finale non nette
- G modifié par un autre agent pendant les runs (SceneManager.ts ; diff sha1 79b37f28 → 04bb487d) ; mesures = build initial ; 0 écriture de ma part dans G

## Pour la suite
- parse plafonné à ≈ 1 tuile/frame malgré parseMaxJobs 4 ⇒ net ≈ N tuiles / fps. Plus gros gain au banc ; à revérifier sur GPU réel (60 fps ⇒ ~6 s pour 357 tuiles)
- purger `downloadQueue`/`parseQueue` des tuiles non `__used` à la reprise du gel ⇒ −14 à −33 % de requêtes après dolly/pan, et la file se vide plus tôt
- ouverture : exempter du gel l'animation de cadrage programmée ⇒ −3,9 à −4,1 s sur la cascade d2+
- H11 : viser le plancher dès la reprise (ou à 1,5 s) ; 100 % des requêtes des orbites partent dans la vague et=1, au plus tôt 4,1 s après mouse.up
- H13 : rien à faire à 1365 tuiles ; remesurer sur un vrai tileset (≥ 10⁴ nœuds)

## Retour sur le pack
- Manquait : mapping souris réel (milieu = orbite, gauche = pan) ; sensibilité de l'orbite par événement ; avertissement de charge machine (load 50-76) ; `bench-3d.mjs` importe `_proofEnv.mjs` hors WL (sortie via OUT) ; critère « net » en tenue ≥ N s ; scénario qui charge PENDANT le geste (dolly/pan rapproché) pour exposer H9/H10
- Inutile : `TilesRendererLoader.ts` lu en entier (889 l.) ; seules :250-330, :550-760 ont servi
