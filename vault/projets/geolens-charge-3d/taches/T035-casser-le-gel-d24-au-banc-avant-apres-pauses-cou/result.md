---
tache: T035
statut: fait
verdict: DÉFAUTS
tags: [result]
---
## Mesures avant/après
$T = /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t035.t3i1 · DEPTH=6 (1365 glb) · scénario `flux` : entrée 3D +8 s, molette ×6 (rapprochement), +2 s, drag ±300 px, capture souris enfoncée, mouse.up, relevés 6 s · contexte neuf chacun
| métrique | avant | après |
|---|---|---|
| reqMouvement (drag) | 148 / 12,0 s | 6 / 8,9 s (tous à dt 160 ms, gel à dt 356) |
| req/s pendant drag | 12,8,16,12,18,18,16,0,0,0,24,18,24 | 6,0,0,0,0,0,0,0,0 |
| reqArret (5 s après fin drag) | 84 | 60 |
| fin drag → 1re req | 252 ms (flux jamais coupé) | 1667 ms (dont 1669 ms capture souris enfoncée) |
| total req /storage glb+json | 681 | 429 |
| maxJobs échantillons drag | 6 ×30 | 0 ×29, 6 ×1 (1er) |
| loaded/visible/dmax — avant drag | 123/24/4 | 91/21/3 |
| loaded/visible/dmax — fin mouvement | 172/59/4 | 156/57/4 |
| loaded/visible/dmax — après 6 s | 201/71/4 | 184/72/4 |
| errorTarget avant/mouv/après | 0.75/0.75/0.75 | 4/4/1 (C3) |
| statuts tuiles | 200/304 | 200/304 |
| pageerror | 0 | 0 |
- écart reqMouvement 148 → 6 (−96 %) ⇒ 1 run suffit (règle < 20 %)
- run `principal` (attente silence réseau 4 s avant drag) : AVANT reqMouvement 0 = tout téléchargé (1309 req) ⇒ non probant ; APRÈS 0
- loaded monte pendant gel (parse des tuiles déjà téléchargées, st2 ≈ 90-400) — accepté D24
## Cas limites
- cas 1 pauses 300 ms souris enfoncée (pauses 306/301/301 ms, drag 8,8 s) · 0 req pendant séquence, reprise après ≥ 500 ms · 6 req à dt ≤ 200 ms (avant 1er mouvement caméra, camDejaBouge=0), puis 0 ; 1 gel + 1 reprise, 0 transition pendant pauses · OK (amortissement caméra masque partiellement l'arrêt de 300 ms)
- cas 2 molette 4 s (9 évts) · gel · 12 req à dt 142/284 ms (avant pose changée, camDejaBouge=0), gel dt 305, 0 req ensuite, maxJobs 0 ×14 · OK
- cas 3a touche `7` · gel pendant anim · gel dt 420, reprise dt 4335, 6 req avant mouvement, 12 req à dt 4909+ avec gate=true · OK
- cas 3b touche `0` (vol (3,3,4)→(189,135,189)) · gel · gel dt 153, reprise dt 3386, 0 fetch caméra bougée · OK (reprise ~2 s après fin visible, conservatrice)
- cas 4 ortho `5` puis drag immédiat · gel · 0 transition, maxJobs 6 ×55, 216 req pendant drag (2e run : 218, maxJobs 6 ×43) · DÉFAUT D1
- cas 4 LOD ortho · suit la caméra ? · ortho + molette arrière : camPos (3,3,4)→(6311,4509,6312), histo visible {5:269} inchangé, 0 req, écran vide · NV (cause pré-existante, Loader:206 hors diff T032) → Pour la suite
- cas 5 délai (mouse.up sans pause, 3 runs) · reprise ≥ 500 ms après immobilité · up→`reprise` 974/1013/1173 ms ; up→1re req 1335/1320/1489 ms ; `reprise`→1er fetch 183/155/166 ms = 0-1 frame (fps 5-7) ; amortissement camPos bouge encore 599/733/809 ms après up (AVANT : 771 ms) · OK (T034 : 1035 ms, cohérent)
- cas 6 capture mouvement · ≠ vide · APRÈS visible 57 tuiles fin mouvement, PNG damier bleu+violet · OK ; 404 ×6-8 = multi-pack.json, camera_params.json, presentation.json, thumbnail, identiques AVANT · OK (hors tuiles)
- 1-frame : 0 fetch tuile émis avec camPos ≠ pose pré-scénario et gate=true pendant mouvement (fetchCtx, 5 runs perspective) · OK
- relecture diff : runtime writer maxJobs = `applyDownloadJobs` seul (Loader:626) ; Loader:321 = init preset ; `scheduleJobRun` à la reprise (Loader:639) ; VRAM (Loader:663) et œil (Loader:770) passent par applyDownloadJobs · OK
## Défauts
- D1 · vue ortho ⇒ gel inactif · repro : serveurs banc (pack) dist-apres ; `cd $T && FLUX=1 ORTHOWAIT=300 OUT=$T/out LABEL=apres8 MODE=ortho node scen.mjs` (touche `5` dans l'iframe, 300 ms, drag 7,4 s) · attendu : `[motion-gate] gel`, maxJobs 0, 0 req pendant drag · obtenu : gateLogs [], maxJobs 6 ×55, 216 req (44,27,51,48,46,0,0,0 /s), camPos (3.28,2.69,3.54)→(6.06,2.04,1.22), vue tournée (PNG) ; 2e run apres10 : 218 req, 0 transition
- D1 cause probable (non prouvée) : Loader:713-714 lit la pose de `camera` (options = perspective) ; caméra ortho rendue ⇒ pose perspective figée ⇒ `poseChanged` false
## Vérifié comment
```
node e2e/bench-tileset.mjs (STORE=$T/storage DEPTH=6) → 1365 glb (48291 Kio), DEPTH=6 TEX=256
vite build dist-apres → apres:0 ; dist-avant (git archive HEAD) → avant:0
grep -l motion-gate dist-*/assets/*.js → dist-apres/assets/main-fGYM9GMY.js seul
avant/flux → reqMouv=148 reqArret=84 mj={"6":30} statuts={"200":962,"304":13,"404":8} pe=0
apres/flux → reqMouv=6 reqArret=60 reprReq_up=-2 mj={"0":29,"6":1} statuts={"200":693,"304":15,"404":6} pe=0
apres6/pauses → rm=6 rps=[6,0,0,0,0,0,0,0,0] pauses=[306,301,301] gate=[gel dt158, reprise dt9847] fctx camDejaBouge=[]
apres9/molette → rm=12 dt=[142×6,283-285×6] gate=[gel dt305, reprise dt5660] camDejaBouge=[]
apres6k7/anim → gate=[gel dt420, reprise dt4335] avecGateFalse=0
apres6k0/anim → gate=[gel dt153, reprise dt3386] camDejaBouge=[]
apres3/5/6 delai → repUp=1013/974/1173 reqUp=1320/1335/1489 rep={ms:155,183,166} dampUp=733/599/809
apres8/ortho → rm=216 gate=[] mj={"6":55} ; apres10/ortho → rm=218 gate=[] mj={"6":43}
apres7o/molette ORTHO=1 WHEELOUT=1 → rm=0 gate=[] histo {5:269} avant=après camApres=[6311,4509,6312]
grep -rn "maxJobs\s*=[^=]" web/src → Loader:321 (init), Loader:626 (applyDownloadJobs), Loader:324 parseQueue
grep -rn scheduleJobRun web/src → Loader:639 seul
npm --prefix G/web test → Test Files 189 passed (189) · Tests 1791 passed (1791)
kill 1392978 1429459 ; ss -ltn | grep -E ':(4011|5181)\b' → ∅ (exit 1)
git -C G status --short | wc -l → 30 (inchangé) ; web/dist mtime 2026-10-13 20:58 (non touché)
```
- script : $T/scen.mjs (MODE=principal|flux|delai|pauses|molette|anim|ortho ; FLUX, KEY, ORTHO, ORTHOWAIT, WHEELOUT) ; résumé $T/sum.js, $T/show.sh
- JSON : $T/out/{avant,apres}-flux.json, avant-{principal,delai}.json, apres{,2,3,5,6}-*.json, apres6k7-anim.json, apres6k0-anim.json, apres7o-molette.json, apres8-ortho.json, apres10-ortho.json
- PNG AVANT : $T/out/avant-flux-{avant,mouvement,apres}.png ; APRÈS : $T/out/apres-flux-{avant,mouvement,apres}.png ; D1 : $T/out/apres8-ortho-{ortho-avant,mouvement,apres}.png
- T032 `## Vérifié comment` non rejoué : result.md T032 hors WL
## Écarts
- lecture hors WL : `grep -rn maxJobs/scheduleJobRun G/web/src` — DoD « 1 seul écrivain » exige tout src
- banc : bench-3d.mjs non modifié, dérivé dans $T/scen.mjs (+ hook fetch, échantillonneur 50 ms, compteur rAF)
- scénario mesure = `flux` (drag pendant chargement) : `principal` non probant AVANT (tout chargé)
## Pour la suite
- D1 : poser la pose du gel (et `setCamera`) sur la caméra ACTIVE à chaque bascule persp/ortho ; rejouer `MODE=ortho ORTHOWAIT=300`
- LOD ortho figé (visible {5:269} après dézoom 9 km, écran vide) : pré-existant Loader:206, à instruire hors T032
- hypothèse NV : pose stockée en Float32Array (Loader:285) + eps 1e-6 ⇒ en ECEF (~4e6 m, ulp ≈ 0,25-0,5 m) un pan lent < ulp/frame non détecté ⇒ reprise en mouvement ; banc sans branche ECEF
- délai reprise réel ≈ 1,0-1,2 s après mouse.up = amortissement 0,6-0,8 s + 500 ms
## Retour sur le pack
- Manquait: result.md T032 (affirmations à rejouer) ; bench-3d `principal` non probant même DEPTH=6 (stabilité réseau ⇒ tout chargé) — prévoir drag pendant chargement ; `DIR` vient de `_proofEnv.mjs` (OUT non lu directement)
- Inutile: ∅
