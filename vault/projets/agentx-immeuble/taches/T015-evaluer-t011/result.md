---
tache: T015
projet: agentx-immeuble
statut: fait
evalue: T011
verdict: retenir
---
## Verdict
retenir — 11/11 cases DoD T011 prouvées, 0 KO
## DoD
- [x] bascule IMMEUBLE ↔ ÉTAGE, ⌂, clic, ≤ 400 ms, 0 rechargement — `e2e.log` → `1600 réel {"vue":"immeuble","hash":""}` · `#/orthopro {"vue":"etage"}` · `après ⌂ {"vue":"immeuble","hash":"#/"}` · `clic plaque seagle-site {"vue":"etage","hash":"#/seagle-site"} rechargée= false` · `transition-duration #tour 0.26s, 0.26s, 0s` · `transition.mjs` → `cssStartFin 249|253|262|253`
- [x] `#tour` dalles ordre rang, toit chef, sous-sol, étiquettes + compteurs — `OK dalles ordre rang` · `OK chef au toit : classe ↔ vivant {"cls":"tour-chef ok","masc":1}` · `étiquettes ["É8 · AgentX entreprise","É7 · AgentX immeuble"] … 8` · `compteurs en=0,rv=0,bl=1` · capture `SOUS-SOL · 2` + 2 cartons
- [x] agents ≤ 12 puis +N, bob/écran, vide baissé, dormant éteint, gyro rouge/jaune, sélection accent, 0 inventé — `réel agentx-immeuble:agents=2/masc=2` (tids égaux) · `12 étages agents/mascottes 3/3 12/12 0/0 0/0 1/1 … 2/2` · `+N ["e1-proj:+2"]` · `couleurs gyro ["#ffcc33","#ff3b5c"]` · `lumière … "7":"tn-eteint" … "2":"tn-vide"` · `contour sélection rgb(59, 130, 246)` · `0 agent → {"agents":0,"mascTour":1,"ecrans":0}`
- [x] sonnerie d'étage 2.5 s + ascenseur — `sonnerie e3-proj ["tourSonne 2500"] étages qui sonnent 1` · `fin lueur après 2508 ms` · `ascenseur rang 0 → rang 4 translateY(-254px) → translateY(-54px) | transform 0.9s`
- [x] 3/8/12 étages dans `.room-wrap` — `3 étages {"svgH":735.1,"wrapH":735.1,"hors":0,"chevPlaques":0,"compresse":false}` · `8 … "hors":0,"chevPlaques":0` · `12 … "hors":0,"chevPlaques":0,"plaqueHpx":27.6,"compresse":true}`
- [x] perf signature, CSS seul, reduce → 0 — `MutationObserver #tour {"records":0}` sur `polls 10` · `après +1 agent {"decor":1,"etages":1,"records":2}` · `getAnimations {"normal":{"doc":393,"tour":68},"reduce":{"doc":0,"tour":0,"mm":true}}` · `diff base snap | rg -c "requestAnimationFrame|setInterval"` → rc=1 (∅)
- [x] a11y tabindex/role/aria-label, Entrée — `a11y[7] ["0","button","Étage 1, OrthoPro — front et back, 0 en cours, 1 bloqués"]` · `Tab ["agentx-entreprise","agentx-immeuble","seagle-site"]` · `focus-visible {"fv":true,"stroke":"rgb(45, 226, 230)","sw":"2px"}` · `Entrée sur orthopro {"hash":"#/orthopro"}`
- [x] 390 px — `390 px / 12 étages {"scrollWidth":390,"clientWidth":390,"tour":[27,363,336,230],"vis":"visible"}`
- [x] `node --check` rc 0, ∅ alert/confirm/prompt, 0 erreur console — `node --check .cache/snap-T011/dash/dash.js → rc=0` · `rg -n "alert\(|confirm\(|prompt\(" → rc=1` · `OK console 0 erreur` ×8 contextes
- [x] e2e + 4 captures + `git diff --stat` — `ls .cache/T011/` → `e2e.mjs tour-1600.png tour-390.png tour-12-etages.png transition-etage.png` · `git diff --stat -- dash/` → `3 files changed, 360 insertions(+), 13 deletions(-)` = collé
- [x] `result.md` format — frontmatter `statut: revue`, 5 sections exactes, `wc -l` → 68 ≤ 70
## Motif
∅
## Vérifié comment
`diff -rq dash .cache/snap-T011/dash` → ∅ (identique) · `git diff --stat 48a6888 c8637d9 -- dash/` → ∅ · `diff -rq base(c8637d9) snap` → 3 fichiers E seulement
`node .cache/eval-T015/e2e.mjs` (banc :7809, api/run abort, term simulé, state.json réécrit) → rc 0, `51 OK`, `KO total 0` ; log `.cache/eval-T015/e2e.log`
régressions : `OK régression #room rendu et visible en vue étage {"vis":"visible","n":93}` · `OK régression coupe #immeuble : 8 li, sel = seagle-site` · `T012 en transit {"inert":true,"cursor":"not-allowed","opacite":"0.45","transit":true}` · `T012 pilote en transit → refusé — étage en bascule, rien n'est parti. api/run appels 0`
démo : `démo immeuble=null {"vue":"etage","btn":true,"tour":"hidden","room":"visible"}` · `#/zz {"vue":"immeuble","hash":""}`
affirmations T011 rejouées (7) : rc 0 / ∅ rg / diff --stat 360+13- / 390 `[336,230]` scrollWidth 390 / reduce 0 / cabine 0.9s / Entrée inert+not-allowed+0.45 → toutes égales
`node .cache/eval-T015/transition.mjs` → `hashFin 512|308|488|313` ms ; `cssStartFin 249|253|262|253` ms
banc : `kill pid` → `curl :7809` → `000`
captures : `.cache/eval-T015/reel-1600.png`, `tour-3.png`, `tour-8.png`, `tour-12.png`, `tour-390.png`, `transition.png`
## Écarts
- ∅ lecture hors WL (`ls .cache/T011/` existence seule, contenu non lu)
- écart T011 « transition 260 ms, mur 351-441 » : OK — CSS 0.26 s ; mur hash→fin 488-512 ms vers étage (headless) — latence 1re frame, DoD = « zoom/fondu CSS »
- écart T011 SMIL `rendreCourbe` coupé si reduce : OK — `#chart` ∉ hors périmètre (terminal, palette, todo)
- écart T011 `.salle-body/.hud minmax(0,1fr)` : OK — dash.css ∈ E, requis par 390 px
- écart T011 cibles 390 px ≈ 18 px < 24 : non exigé par DoD ; plaques illisibles à 390 (capture)
- reduce pendant bascule : 5 CSSTransition 0.01 ms transitoires ; régime établi = 0
## Pour la suite
- DoD « transition ≤ 400 ms » : préciser durée CSS vs mur hash→transitionend ; mur actuel 488-512 ms headless
- 12 étages : mascottes de É11 (12 agents) débordent visuellement dans la bande É12 (`tour-12.png`) — critère « lisible » non mesurable, à chiffrer
- 390 px : plaques ≈ 5 px de texte ; exiger taille mini texte ou bascule vers liste `#immeuble`
- NV hors périmètre : radar `#room` SMIL sous reduce (déclaré par T011)
## Retour sur le pack
- Manquait: base c8637d9 ≠ 48a6888 du pack T011 (diff nul sur dash/, vérifié) ; `.cache/T011/` hors WL alors que DoD T011 exige son existence
- Inutile: `contrat.md` §C1 — schéma déjà recopié dans pack T011
