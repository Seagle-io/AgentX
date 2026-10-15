---
tache: T008
statut: fait
verdict: OK
tags: [result]
---
## Mesures avant/après
T = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t008.yjDm` · DEPTH=6 (1365 glb) · AVANT = HEAD 17d1f85 · APRÈS = arbre de travail à 10:19

| métrique | avant | après |
|---|---|---|
| D1 ortho, drag pendant chargement (ORTHOWAIT=300) : transitions `[motion-gate]` | 0 | gel dt=161 ms · reprise dt=8079 ms |
| D1 maxJobs échantillonné pendant le drag | {6:22} | {0:67, 6:1} |
| D1 requêtes pendant le drag | 138 / 6,2 s, [24,30,24,28,10,22,0] par s | 13 / 6,8 s, [13,0,0,0,0,0,0] (dt ≤ 85 ms, avant le gel) |
| D1 reprise des requêtes après mouse.up | ∅ (pas de gel) | 799 ms (gate 626 ms) |
| D1 ortho stabilisé (file vide) : requêtes pendant le drag | NV | 0 · gel dt=188 · reprise après up 372 ms |
| `__glrTiles.cameras` en ortho | [PerspectiveCamera] | [OrthographicCamera] |
| cameras après retour `5` | [PerspectiveCamera] | [PerspectiveCamera] |
| cameras après triple `5` (finit en ortho) | [PerspectiveCamera] | [OrthographicCamera] (1 seule) |
| tileset chargé APRÈS bascule ortho (`5` avant Explorer) | NV | [OrthographicCamera] → retour `5` [PerspectiveCamera] |
| ortho + pan (modèle hors écran, 1 coin visible) : tuiles visibles | 352 {d4:224, d5:128} (frustum perspective figé) | 3 {d4:3} |
| ortho molette : histo ortho → dézoom → zoom | {3:54,4:40} → {3:45,4:76} → {3:30,4:136} | {3:39,4:100} → {3:23,4:164} → {4:151} |
| ortho molette : zoom caméra / position | NV / idem | 1 constant / 210 → 6311 → 0,32 m (dolly) |
| dpr ×1 : pixelRatio · buffer (CSS 999×657) | 1 · 999×657 | 1 · 999×657 |
| dpr ×2 | 2 · 1998×1314 | 2 · 1998×1314 |
| dpr ×3 | **2** · 1998×1314 | **3** · 2997×1971 |
| dpr 1→2→3→1 en session (CDP) : event `change` media query | 0 (sonde témoin : 0) | 0 (sonde témoin : 0) → NON MESURABLE |
| idem + `resize` : pixelRatio · buffer | 1·999×657 ; 1·999×657 ; 1·999×657 | 2·1998×1314 ; 3·2997×1971 ; 1·999×657 |
| flux perspective (MODE=flux) : reqMouvement | NV (T035 : 148) | 12, toutes en 1re s (gel à 371 ms, fps 4,9) puis 0 |
| flux : reqArret (5 s) · pageerror · statuts | — | 78 · 0 · 200:845 304:13 404:8 |

## Défauts
- ∅ — rien n'a cédé sur T007 (gel ortho, caméra LOD, dpr, relecture au resize)

Essayé sans faire céder T007 :
- drag ortho pendant chargement (file 86) et après stabilisation (file vide)
- triple bascule rapide `5`×3 → 1 caméra dans `cameras`, pas de fuite
- bascule ortho AVANT chargement du tileset (`loadTileset` reçoit `sceneManager.camera` = ortho) → suivi OK, retour OK
- pan ortho : culling du frustum = caméra ortho (3 visibles contre 352 en AVANT)
- dpr fractionnaires 1,1 / 1,25 / 1,75 / 2,625 / 0,9 / 0,67 : `(resolution: ${dpr}dppx)` → `.matches` = true pour les 10 (le watcher s'arme)
- dpr 3 → 1 : rabaisse bien (aucun plafond, aucun plancher collé)
- pageerror : 0 sur tous les runs AVANT/APRÈS

## Vérifié comment
- `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo exit=$?` → `exit=0` (10:18 et après l'édition tierce de 10:42)
- `npx vite build` AVANT / APRÈS → `✓ built in 36.11s` / `✓ built in 34.69s` ; `grep Math.min(window.devicePixelRatio,2) dist-avant` → trouvé ; `grep glr:active-camera` → présent uniquement dans dist-apres/assets/main-BeTyrird.js
- `BASE=:5185 LABEL=apres-ow MODE=ortho FLUX=1 ORTHOWAIT=300 node scen.mjs` → `reqMouv=13 reqArret=40 reprGate_up=626 reprReq_up=799 pendantGel=0 mj={"0":67,"6":1} pe=0`
- idem avant-ow → `reqMouv=138 reqArret=0 reprGate_up=null pendantGel=0 mj={"6":22} pe=0`
- `LABEL=apres MODE=ortho FLUX=1` (stabilisé) → `reqMouv=0 reqArret=0 reprGate_up=372 mj={"0":62,"6":2} pe=0`
- `LABEL=apres3 MODE=flux FLUX=1` → `reqMouv=12 reqArret=78 reprGate_up=-448 reprReq_up=-3 pendantGel=0 mj={"0":26,"6":1} pe=0` (−448 = dernier move fini 1654 ms avant up, capture tenue)
- `MODE=lod|orbit|preortho|dpr DPR=1,2,3|dprchange SEQ=2,3,1 node t008.mjs` → JSON `$T/out/{avant,apres}-{lod,orbit,dpr1,dpr2,dpr3,dprch}.json`, `apres-preortho.json`
- `node $T/mq.mjs` (page nue + iframe, DSF 1→2) → `top {"dpr":2,"e":{"mq":0,"rs":0},"q1":false,"q2":true}` ; idem `CH=1` (headless new) → mq 0
- `node $T/mq2.mjs` → 10/10 `"m":true`
- PNG ×3 même pose [210,150.05,210] : `$T/out/avant-dpr3-dpr3.png`, `$T/out/apres-dpr3-dpr3.png` (3840×2400) ; recadrage côte à côte `$T/out/crop-dpr3-avant-gauche-apres-droite.png` → damier bleu résolu à droite seulement
- PNG ortho : `$T/out/{avant,apres}-lod-ortho{,-dezoom,-zoom}.png`, `apres-orbit-ortho-orbite.png`, `apres-ow-ortho-{ortho-avant,mouvement,apres}.png`
- relecture du diff : `SceneManager.ts:553-557` (watcher + réarmement), `:580-582` (dpr relu avant setSize), `:1013` (événement), `:1940-1941` (dispose) ; `TilesRendererLoader.ts:213-220`, `:731-732`, `:777`, `:785` (lignes à 10:42) → conformes au contrat
- nettoyage : `kill 1496208 1557326` ; `ss -ltn | grep -E ':(4015|5185)\b'` → ∅ ; chromium fermé (`browser.close` en finally)

## Écarts
- lecture hors WL 1/3 : `G/web/src/viewer/main.ts` (rg ciblé :2989-3001 `__glrDiag`, :4486-4487, :5794) — caméra passée à `loadTileset`, attaque « tileset chargé en ortho »
- lecture hors WL 2/3 : `G/web/src/viewer/loaders/FileManager.ts:231-235` — même raison
- CPU partagé : load 38-70 / 16 cœurs (job python externe) → fps 1-5, drag ramené à 1-2 allers ; flux 1er essai (`apres-flux.json`, allers=1, fps 1,1) écarté
- `TilesRendererLoader.ts` modifié par un tiers à 10:42 (H4 anisotropie, H15) après le build APRÈS de 10:19 ; hunks T007 inchangés

## Pour la suite
- dpr en session : chemin `matchMedia change` NON MESURABLE (CDP met à jour `.matches`, 0 event, même sur une sonde témoin) → à vérifier sur un vrai navigateur (Ctrl+molette, glisser vers un 2e écran)
- en ortho, la molette fait un dolly (zoom=1 figé) : échelle visuelle constante, vide à 10 km, plan near coupe à 0,3 m — idem AVANT, hors T007, tâche à ouvrir
- dpr ×3 : buffer ×9 → plus de tuiles pour errorTarget en px physiques (×3 : 25 visibles non convergées sous SwiftShader) ; coût D1 accepté, à mesurer sur GPU réel
- EDLRenderer et le pixel ratio : non testé (hors périmètre)

## Retour sur le pack
- Manquait : la molette ortho fait un dolly (le critère « histogramme change » supposait un zoom) → discriminant réel = `cameras` + culling au pan ; `page.screenshot` réapplique la DSF Playwright (efface l'override CDP) ; cache de tuiles (Cache Storage) : `loaded` monte sans requête réseau
- Inutile : ∅
