---
tache: T016
projet: agentx-immeuble
statut: fait
---
## Livré
- verdict : DÉFAUTS (3)
- D1 · task.md `role: constructor` (ou `__proto__`, `toString`) en-cours · tour = 1 niveau/étage · 0 niveau, tour vide ou figée, 0 erreur console · `node .cache/banc-T016i/repro-d1.mjs` → `{"vue":"immeuble","niveaux":0,"plaquesEtage":0,"etagesSrv":14,"listeImmeuble":14} · console []` · dash.js:1141 `COULEUR_ROLE[a.role]` hérite d'Object.prototype → dash.js:1148 `ombrer(c)` TypeError `hex.slice is not a function` ; dash.js:1319-1320 `TOUR.sig = sig` avant `construireTour` → plus de retentative ; boucle avale (dash.js:1460)
- D2 · vue étage `#/beta`, focus body, Échap · retour tour (DoD W6 « Échap / ⌂ revient ») · hash `#/beta`, vue `etage` inchangés · `node .cache/banc-T016i/sonde-bords.mjs` → `Échap en vue étage (focus body) {"hash":"#/beta","vue":"etage",…}` · dash.js:1705 Échap = palette/saisie seulement ; brancherTour dash.js:1336-1355 ∅ Échap
- D3 · titre `'x'*28 + '🚀🏢 suite : reste'` · plaque tronquée propre · `xxxx…x\ud83d…` → glyphe `�` visible · `sonde-bords.mjs` → `"seulSurrogate":true,"codes":["78","78","d83d","2026"]` · dash.js:1124 `courtT` coupe en unités UTF-16 (aussi alerte 48 car.)

## Vérifié comment
banc : `.cache/banc-T016i` (setup.py T009 + snap-T011/dash), `curl :7810/dash.js | cmp - .cache/snap-T011/dash/dash.js` → `SAME`
`node .cache/banc-T016i/e2e-T016.mjs all` → `.cache/banc-T016i/e2e.log`, extraits bruts :
```
beta T001 pret→en-cours : mascotte T001 → 1645 ms · OK
beta T003 en-cours→revue→retenir(fait) : 0 mascotte T003 → 1895 ms · OK
fantômes T003 beta = 0
beta T001 en-cours→bloque : gyro beta → 2080 ms · OK
alpha T003 bloque→en-cours : gyro alpha off → 2019 ms · OK
total mascottes tour 2 · srv 2
créer epsilon → étage 1743 ms · étages 3 → 4
clore epsilon → étage retiré 2010 ms · plaque sous-sol "SOUS-SOL · 3clos et archivés"
12 étages {"plaques":14,"chevauchements":0,"titreSurCompteurs":[],"horsViewBox":[["#tour-decor",0,0,700,490]],"scrollWidth":1600,"largeur":1600,"noeudsTour":888}
p01 mascottes 12 · +N +2 · OK
clic étage beta {"hash":"#/beta","vue":"etage","nom":"Beta : livraison","slug":"beta","transit":false,"tourInert":true,"maison":true}
⌂ {"hash":"#/","vue":"immeuble",…} · retour navigateur {"hash":"#/beta","vue":"etage",…}
5 A/R rapides puis gamma {"hash":"#/gamma","vue":"etage","nom":"Gamma : en sommeil",…} OK · 3× retour rapide … cohérent OK
transit {"transit":true,"inert":true,"boutons":10} · api/run envoyés pendant bascule = 0 · sortie "refusé — étage en bascule, rien n'est parti."
10 bascules désordonnées (délai 0–1200 ms) → fin gamma {"vue":"etage","slug":"gamma","transit":false} OK
rôle zorglub {"xss":null,"scripts":0,"lbl":"É13 · <img src=x onerror=\"window.__…","lblLen":36,"droite":582.8,"compteurs":612,…} · OK
rôle constructor → gyro bloque suivi KO >6000 ms
nœuds #tour 967 → 962 (-0.5 %) · heap 4302 → 4721 KiB (9.7 %)
caché (visibilityState=visible, puis gelé 20 s) : 1,5 s après reprise = 1 state.json
Tab : 1er étage tour après 17 Tab · étages traversés 13 … étages tour 13 OK
Entrée sur beta → {"hash":"#/beta","vue":"etage","focus":"BODY"} · Échap → {"hash":"#/beta","vue":"etage"}
⌂ atteint après 1 Tab · Entrée → {"hash":"#/","vue":"immeuble","focus":"BODY"}
reduce : repos {"total":0,"tour":0,"smilTour":0,"smilPage":0}
390 px scrollWidth=390 largeur=390 OK · #tour [27,363,336,230] · chevauchements 0
1600 px scrollWidth=1600 largeur=1600 OK · #tour [193,1265,1072,735] · chevauchements 0
== erreurs console cumulées 0 []
```
`node sonde-mem.mjs bascule` (600 cycles, gc) → `[[0,3073,967],[100,3475,967],[300,3518,967],[600,3609,967]]` heap KiB, nœuds #tour — plateau +3.9 % après 100
`node sonde-vb.mjs` → seul dépassement viewBox : `polygon url(#tour-hachure)` y 311→489.9 (terre décorative)
`node sonde-bords.mjs` → réseau KO 5 s : transit true, tasks inert ; rétabli +2.6 s : slug alpha, transit false ; `#/delta` clos → vue etage, ⌂ visible
captures : `.cache/banc-T016i/T016-{w1-vie,w2-12-etages,w3-bascule,w4-hostile,w6-reduce,w7-390,w7-1600,reduce-bascule,d1-constructor,d3-emoji}.png`
fin : `kill 370425` ; `curl :7810` → `000` ; `git status --short vault/` → ∅ avant écriture result.md

## Écarts
- ∅ lecture hors WL
- `.cache/T016keep` créé par erreur puis `rmdir` — vide, 0 effet
- `retenir` exige `--sans-eval` sur banc ; vx 1re passe KO, banc remonté
- onglet caché NV réel : headless garde `visible`, `setWebLifecycleState frozen` n'arrête pas les polls (10 en 20 s)

## Pour la suite
- D1 : `COULEUR_ROLE` → `Object.create(null)` ou `Object.hasOwn` (dash.js:8,1141) ; poser `TOUR.sig` après `construireTour` réussi (dash.js:1319-1320)
- D2 : Échap en vue étage (hors xterm, palette, saisie) → `location.hash = '#/'` ; focus rendu à l'étage quitté (aujourd'hui BODY après Entrée et ⌂)
- D3 : `courtT` par points de code `[...t]` (dash.js:1124)
- `#/Beta` (hors RE_SLUG_PAGE) → vue immeuble, hash `#/Beta` conservé ≠ C8 « hash effacé »
- reduce : bascule crée 1864 CSSTransition `visibility` (règle globale dash.css:829-830 × delay .26 s) — 0 mouvement, coût DOM

## Retour sur le pack
- Manquait: `retenir` sur banc exige `--sans-eval` ; moyen fiable d'onglet caché en headless | Inutile: `bin/dash.py` (défauts tous côté page)
