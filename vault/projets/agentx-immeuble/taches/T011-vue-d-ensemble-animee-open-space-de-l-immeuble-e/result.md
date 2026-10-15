---
tache: T011
projet: agentx-immeuble
statut: revue
---
## Livré
- dash/dash.js:1104-1358 — tour : isoT, boiteT, niveauTour, construireTour, rendreTour, majVue, brancherTour
- dash/dash.js:1067-1078 — sonnerEtages : liste + tour, lueur survit au re-rendu
- dash/dash.js:1008 — surHash → majVue (bascule immédiate, avant fetch)
- dash/dash.js:1368-1369 — rendre : rendreTour + majVue après rendreImmeuble
- dash/dash.js:1922 — amorçage : brancherTour()
- dash/dash.js:557-561 — rendreCourbe : pulsation SMIL coupée si reduce
- dash/index.html:57-73 — svg#tour (defs halo/hachure, 4 calques) + bouton #vers-immeuble
- dash/dash.css:269-337 — .room-wrap empilée, fondu+zoom .26 s, styles .tour-*
- dash/dash.css:455-456 — #tasks[inert] grisé, cursor:not-allowed
- dash/dash.css:769,780 — .salle-body/.hud minmax(0,1fr) : 390 px sans débord
- .cache/T011/e2e.mjs, e2e.log + 6 captures

## Vérifié comment
`node --check dash/dash.js` → rc 0 · `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ (rc 1)
`git diff --stat -- dash/` → `dash.css | 77 +-, dash.js | 279 +-, index.html | 17 +, 3 files changed, 360 insertions(+), 13 deletions(-)`
`node .cache/T011/e2e.mjs` (banc :7804, api/run abort, term simulé) → rc 0, extraits bruts de `.cache/T011/e2e.log` :
```
1600 vue= immeuble hash= ""
  mascottes agentx-immeuble        OK [designer:T011]   (+7 étages OK [])
  chef toit vivant= true classe= tour-chef ok · cartons sous-sol 2
3 étages {"wrapH":735,"dessinY":[72,383],"chevauchements":0,"hauteurEtage":56,"hauteurEtagePx":85.8,"agentsVsMascottes":"OK OK OK","plus":["+2"],"dormants":1,"eteints":1}
8 étages {"wrapH":735,"dessinY":[6,449],"chevauchements":0,"compresse":false,"hauteurEtage":37.5,"hauteurEtagePx":57.4,"agentsVsMascottes":"OK×8","gyros":2}
12 étages {"wrapH":735,"dessinY":[6,449],"chevauchements":0,"compresse":true,"hauteurEtage":25,"hauteurEtagePx":38.3,"agentsVsMascottes":"OK×12","plus":["+2"],"gyros":2,"dormants":2}
perf  re-rendus #tour-decor sur 2 tics identiques = 0 · après +1 agent = 1 mascotte T999 = 1
anim  getAnimations (normal) = 410 dont #tour = 88 en pause hors vue (#room) = 220
anim  prefers-reduced-motion: reduce → getAnimations = 0
sonne étage geolens-preview-3d → animation tourSonne 2.5s | liste #immeuble sonne = true · après 2.7 s sonne = false
ascenseur sélection rang 1 → rang 5 : translateY(-229px) → translateY(-79px) | transition transform 0.9s
tab  ordre dans #tour : Étage 8, AgentX immeuble : …, 1 en cours, 0 bloqués → … → Étage 1, OrthoPro — front et back, 0 en cours, 1 bloqués
focus visible ["orthopro","rgb(45, 226, 230)","2px"]
Entrée → {"hash":"#/orthopro","vue":"etage","inert":true,"cursor":"not-allowed","opacite":"0.45","tour":"0.26s, 0.26s, 0s"}
  fondu #tour sortie : hash → transitionend = 441 ms ; transitionstart → transitionend = 262 ms
bouton ⌂ {"visible":true,"texte":"⌂ immeuble","w":85,"h":24} → hash "#/" vue immeuble, fondu (hash → transitionend) = 351 ms
clic plaque seagle-site → vue etage ; page rechargée = false · #/zz → hash "" vue immeuble
démo immeuble=null → vue etage | bouton ⌂ caché true | #tour visibility hidden
390 px réel / 12 étages {"scrollWidth":390,"clientWidth":390,"vue":"immeuble","tour":[336,230],"visibilite":"visible"}
contraste plaques (fill × opacités, sur #05070c .82) : min 5.08 (violet revue) · 5.47 bleu · 5.78 rouge · 5.79 zéros #7c8aa6 · 9.16 dormant · 13.22 texte → AA
erreurs console 0 (7 pages)
```
Captures : `.cache/T011/tour-1600.png`, `tour-390.png`, `tour-12-etages.png`, `transition-etage.png`, `tour-3-etages.png`, `transit-lent.png`

## Écarts
- ∅ lecture hors WL
- signature #tour ⊃ DoD : + titres, compteurs, chef, todo toit, couleurs — plaques sinon périmées
- transition CSS 260 ms (≤ 400) ; mur headless hash→fin 351-441 ms — latence 1re frame, raster logiciel
- #room masqué pendant IMMEUBLE.transit + « chargement de l'étage… » — évite flash ancien étage
- dash.css .salle-body/.hud minmax(0,1fr) : à 390 px colonne 627 px (todo) rognait salle+tour
- rendreCourbe : SMIL coupé si reduce — sinon 2 CSSTransition #chart, DoD = 0
- cibles 390 px : bande étage ≈ 18 px < 24 — équivalent #immeuble (28 px) même page
- zéros compteurs #7c8aa6 ≠ opacité .35 du kit — .35 = 1.6:1, KO AA
- couleurs inventées : sols #242d42/#11151f, murs — paliers lumière allumé/vide/éteint

## Pour la suite
- `/` sans hash : tour, É sélectionné = contour bleu + cabine ascenseur à son niveau ; Tab parcourt É8→É1, Entrée/clic plaque → `#/<slug>` zoom vers l'étage, salle d'étage
- `⌂ immeuble` (haut gauche, vue étage) → `#/` : tour revient, cabine glisse vers étage par défaut
- réécrire state.json : 12 étages, agents 12 + en-cours 14 → `+2` façade ; bloque = gyrophare rouge, urgent = jaune ; dormant = étage éteint, plaque grise
- devtools reduce → `document.getAnimations().length` = 0 ; 390 px : tour 336×230 entière, plaques ≈ 5 px (lecture via liste #immeuble)
- NV : radar #room bloque (SMIL `<animate>`) tourne encore sous reduce — hors périmètre #room

## Retour sur le pack
- Manquait: `.salle-body 1fr` déjà > 390 px (todo) — non signalé ; `transition ≤ 400 ms` ambigu (durée CSS vs mur incl. fetch)
- Inutile: ∅
