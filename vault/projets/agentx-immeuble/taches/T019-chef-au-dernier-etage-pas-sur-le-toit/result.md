---
tache: T019
projet: agentx-immeuble
statut: revue
---
## Livré
- dash/dash.js:1130-1158 — `posteTour`, `coqueTour` extraits de niveauTour (0 dupli)
- dash/dash.js:1160-1199 — niveauTour = coque + postes, sortie inchangée
- dash/dash.js:1200-1214 — `directionTour` : chef à son bureau, ok/off/ko
- dash/dash.js:1225-1231 — hF = 300/(n+1) ; zd sol direction ; couvH
- dash/dash.js:1257-1259 — couverture seule, 0 mascotte, antenne retirée
- dash/dash.js:1262-1266 — gaine : n+1 repères, dessert la direction
- dash/dash.js:1287-1297 — plaque `É<n+1> · CHEF` focusable, sonde au-dessus
- dash/dash.js:1327-1331 — decor + direction ; plaqueChef 1er de #tour-etages
- dash/dash.js:1349-1356 — focus restauré sur étage ou direction
- dash/dash.js:1381-1395 — clic/Entrée direction → basculerTiroir(true) ; ↑↓ inclut direction
- dash/dash.js:1022-1031 — coupe `#im-direction` : É<n+1> · CHEF, picto bureau, aria-label
- dash/dash.js:630-633 — todo : étiquette `chef`
- dash/dash.js:1513,1524,1529 — param `toit` → `agrege`
- dash/dash.js:982,1108,1225,1276 — commentaires « dernier étage »
- dash/dash.css:48-49,57-73,130,801 — `.im-toit*` → `.im-direction*`
- dash/dash.css:309-311,319-320 — hover/focus étendus à `.tour-direction`, plaque à `--c`
- dash/dash.css:327 — bandeau LED direction à la couleur chef
- dash/dash.css:336 — `.tour-chef.off` yeux clos ; `.tour-feu*` orphelins supprimés
- dash/dash.css:388-389 — `.ti-etage.toit` → `.ti-etage.chef`
- dash/index.html:14-16 — commentaire + `#im-direction`
- bin/terminal.py:26 — « au toit » → « au dernier étage »
- .cache/T019/{e2e.mjs,t019.mjs,coupe.mjs,zoom.mjs,todo.mjs} — banc
- .cache/T019/{tour-1600,tour-12,tour-390,coupe,coupe-390,tour-3-arrete,tour-8-injoignable}.png — captures
## Vérifié comment
- `node .cache/T019/e2e.mjs` → `rc 0` · 87 OK · `KO total 0` (e2e T015 + 26 contrôles T019)
- `T019 réel {"n":9,"viv":true,"dir":{"top":1031.9,"bot":1247.5},"haut0":{"top":1077.9,"bot":1293.5},"chev":0,"hors":0,"chef":"tour-chef ok","lbl":"É10 · CHEF● en sessiontodo 118 ·…","premier":"tour-direction","reperes":10}`
- `T019 3 ét. chef=false {"dir":"tour-niv-direction tn-eteint","chef":"tour-chef off","chev":0,"hors":0,"nPlaques":4,"ecranChef":0,"bob":[0],"yeux":["matrix(1, 0, 0, 0.15, 0, 0)"…]}`
- `T019 8 ét. chef=null {"dir":"tour-niv-direction tn-vide","chef":"tour-chef ko","chev":0,"hors":0,"nPlaques":9,"fill":"#5d6880"}`
- `T019 12 ét. chef=true {"dir":"tour-niv-direction tn-allume","chef":"tour-chef ok","chev":0,"hors":0,"nPlaques":13,"lbl":"É13 · CHEF…","ecranChef":1,"bob":[1]}` ; 0 ét. → `nPlaques 1, É1 · CHEF`
- `T019 390 px reduce {"scrollWidth":390,"clientWidth":390,"anim":0,"coupe":[9,381,34],"chev":0,"hors":0}`
- `OK T019 clic plaque chef → tiroir ouvert, hash inchangé {"ouvert":true,"hash":""}` · `OK Entrée sur la direction → tiroir ouvert` · `OK ↑ depuis le plus haut étage → direction ["tour-direction","agentx-immeuble"]`
- `OK T019 focus visible direction (cyan 2px)` · `OK régression T018 : Échap → vue immeuble` · console 0 erreur ×8 contextes
- `OK T019 coupe « É10 · CHEF », aria-label {"aria":"Dernier étage, chef de projet, en session"}`
- `node .cache/T019/todo.mjs` → `["SPAN.ti-etage chef=chef","BUTTON.ti-etage=AgentX immeuble",…]`
- contraste #3b82f6 / #05070c 5.48 · / #0b0d13 ≈5.4 · / #141824 (hover) 4.81 · #9fb0cc 9.17 · cyan focus 12.6
- `node --check dash/dash.js` → rc 0 · `python3 -m py_compile bin/terminal.py` → rc 0
- `git diff -U0 bin/terminal.py` → 1 hunk : `-"ouvert et tu es au toit, …"` / `+"ouvert et tu es au dernier étage, …"`
- `rg -n -i "toit" dash/ bin/terminal.py` → dash.js:1022,1258,1288,1347 — tous `im.toit` (clé serveur §C1)
- `git diff --stat -- dash/ bin/terminal.py` → `terminal.py 2 +- · dash.css 42 · dash.js 178 · index.html 4 · 4 files changed, 128 insertions(+), 98 deletions(-)`
- banc :7812 tué → `curl` 000
## Écarts
- lecture hors WL: roles.json (rg `"chef"`) — couleur chef pour contraste
- lecture hors WL: .cache/eval-T015/state-reel.json — données lues par l'e2e
- e2e adapté (copie .cache/T019/e2e.mjs, original intact) : `.tour-lbl` → `.tour-etage .tour-lbl` ; écrans comptés dans `.tour-niveau` ; coupe `li === 8` → `=== LIVE.etages.length` (vault réel : 9 étages)
- classes renommées `im-toit*` → `im-direction*`, `ti-etage.toit` → `.chef` — plus de toit habité
- invention : LED direction couleur chef, yeux clos si arrêté — distinguent l'étage, l'état
- tableau de todo au mur essayé puis retiré — masqué par la dalle iso dès 8 étages
- hF = 300/(n+1) : étages 5-8 un peu plus bas qu'avant (ex. n=8 37.5 → 33.3)
## Pour la suite
- > 15 étages : hF < 18 → plaques se chevauchent (préexistant, non traité)
- .cache/T019/z*.png, zoom-*.png : captures de travail, supprimables
- aria-label coupe sans todo (format DoD strict) ; la tour l'inclut
## Retour sur le pack
- Manquait: e2e attend `.tour-chef` dans #tour et compte `#tour-etages .tour-lbl` / `.tour-ecran` globaux — à signaler | couleur chef (#3b82f6) non recopiée
- Inutile: ∅
