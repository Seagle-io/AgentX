---
tache: T021
projet: agentx-immeuble
statut: fait
evalue: T019
verdict: retenir
---
## Verdict
retenir — 9/9 cases DoD T019 re-prouvées, 0 KO
## DoD
- [x] tour : niveau direction au-dessus de rang 0, même gabarit, chef à son bureau dedans, 3 états, toit vide, plaque `É<n+1> · CHEF` + état + todo, clic/Entrée → tiroir, ascenseur dessert — `node .cache/eval-T021/e2e.mjs` → `OK banc : 1 chef, dans la direction, 0 mascotte hors niveau, 0 après la direction (couverture)` · `OK direction au-dessus de rang 0, même hauteur ±1 px [227.1,227.2]` · `OK true : allumé (bob, écran)` · `OK false : éteint, assoupi (yeux clos, 0 bob, 0 écran)` · `OK null : grisé (#5d6880…)` · `OK 3 états visuels distincts` · `OK clic plaque direction → tiroir ouvert, vue inchangée` · `OK Entrée direction → tiroir ouvert` · `OK ascenseur : n+1 repères, le plus haut dans la direction [8,1021.9,955.9,1183]` · `OK ↑ rang 0 → direction, ↑ reste, ↓ → rang 0`
- [x] coupe : `É<n+1> · CHEF`, picto bureau, en tête, aria-label — `coupe {"txt":"É8 · CHEF","aria":"Dernier étage, chef de projet, en session","premier":true,"vieux":false,"tri":false}` · `OK clic coupe → tiroir ouvert, étage inchangé` · 0/3/8/12 → `É1/É4/É9/É13 · CHEF` coupe = tour
- [x] todo : étiquette `chef`, classe renommée partout — `todo {"chef":["chef"],"toit":0,"motToit":0}` · `rg -n "im-toit|ti-etage\.toit|tour-toit" --glob '!vault/**' --glob '!.cache/**' .` → rc 1
- [x] `CONSIGNE_CHEF` 1 hunk, py_compile rc 0 — `git show 45e9fbc -- bin/terminal.py | rg -c "^@@"` → `1` (`-…au toit…` / `+…au dernier étage…`) · `python3 -m py_compile <terminal.py@45e9fbc>` → rc 0
- [x] commentaires mis à jour, `rg toit` → clé serveur seule — `rg -n -i "toit" .cache/snap-T019/dash/` → `dash.js:1022,1258,1288,1347`, tous `im.toit` ; idem `dash/ bin/terminal.py` ; diff : index.html:14, dash.css:48-49, dash.js:630,982,1108 réécrits
- [x] 0 régression : e2e T015 adapté 0 KO ; 3/8/12 + direction 0 chevauchement ; 390 ; reduce — `node .cache/eval-T021/t015/e2e.mjs` → `KO total 0` (51 OK) · T021 `0/3/8/12 ét. : 0 chevauchement, tout dans le cadre, direction au-dessus` OK ×4 · `390 px {"sw":390,"cw":390}` OK · `getAnimations {"false":{"doc":343,"chef":3},"true":{"doc":0,"chef":0}}` OK
- [x] captures listées, `node --check` rc 0, 0 erreur console — `ls .cache/T019/` → tour-1600.png tour-12.png tour-390.png coupe.png présents · `node --check .cache/snap-T019/dash/dash.js` → rc 0 · `contextes 12 avec erreurs []`
- [x] `git diff --stat` collé — `git show --stat 45e9fbc -- dash/ bin/terminal.py` → `4 files changed, 128 insertions(+), 98 deletions(-)` = déclaré
- [x] `result.md` T019 au format — sections Livré/Vérifié comment/Écarts/Pour la suite/Retour sur le pack présentes, sorties collées
## Motif
∅
## Vérifié comment
- instantané = commit : `git show 45e9fbc:dash/{dash.js,dash.css,index.html} | cmp - .cache/snap-T019/dash/…` → identiques ×3 ; banc `cmp` → `= snap` ×3
- périmètre : `git show --name-only --format= 45e9fbc | rg -v "^vault/"` → `bin/terminal.py dash/dash.css dash/dash.js dash/index.html` (vault = comptabilité chef)
- banc : `.cache/eval-T021/setup.py` (T009 + hostile 5 en-cours + emoji-a/b/c) → `banc ok` / `banc T021 ok` ; :7815 → `toit {'chef':{'vivant':True},'todo':27,'urgent':1,'etages':7,…}`
- `node .cache/eval-T021/e2e.mjs` → rc 0, `KO total 0` (37 OK) ; log `.cache/eval-T021/e2e.log`
- `node .cache/eval-T021/t020/e2e.mjs` → rc 0, `KO total 0 (snap-T019, banc T021)` (32 OK) ; log `t020/e2e.log`
- `node .cache/eval-T021/t015/e2e.mjs` → rc 0, `KO total 0` (51 OK) ; log `t015/e2e.log`
- adaptations t020 : port 7813→7815, D → eval-T021 (banc hostile/emoji recréé) — 0 assertion touchée
- adaptations t015 : port 7809→7815 ; REEL = `state.json` du banc (≠ vrai vault) ; slugs orthopro→alpha, seagle-site→beta ; coupe `li === 8` → `LIVE.etages.length` ; `.tour-lbl` → `.tour-etage .tour-lbl` — plaque direction ≠ étage ; écrans comptés dans `.tour-niveau` — chef en session = écran voulu (DoD T019)
- captures : `.cache/eval-T021/{banc-1600,chef-true,chef-false,chef-null,tour-3,tour-12,tour-390,coupe}.png` ; tour-12 et chef-false inspectées : chef sous la couverture, toit nu
- `kill $(cat .cache/eval-T021/pid)` → `curl :7815` → 000
## Écarts
- ∅ lecture hors WL
- banc : `TERM.vivant()` du serveur :7815 lit le démon chef réel (lecture seule, `vivant True`) ; `/api/term/*` simulé côté page → 0 écriture
- jugés : renommage `im-toit*`→`im-direction*`, `ti-etage.toit`→`.chef` — complet, 0 référence restante, OK
- jugé : LED direction `--c` = `#3b82f6`, seulement si allumé — couleur rôle, charte tenue, OK
- jugé : hF = 300/(n+1) — 0 chevauchement 0/3/8/12/390, même hauteur direction/étage ±0.1 px, OK
- note : ascenseur « dessert » = repère + gaine au niveau direction ; cabine ne s'y arrête pas (direction jamais sélectionnée) — lecture retenue
## Pour la suite
- seuil plaques serrées déplacé : hF < 18 dès n = 16 (avant n = 17) — à couvrir si > 15 projets ouverts
- DoD « ascenseur dessert » floue : préciser repère seul ou cabine
- `.cache/T019/z*.png`, `zoom-*.png` : captures de travail supprimables
## Retour sur le pack
- Manquait: e2e T020 dépend d'un banc hostile/emoji non décrit (setup T009 seul) — recréé par déduction ; T015 e2e lit `state-reel.json` hors WL — remplacé par `state.json` du banc
- Inutile: ∅
