---
tache: T019
statut: fait
evalue: T017
verdict: retenir
---
## Verdict
retenir — 10/10 cases DoD T017 prouvées, re-jouées
## DoD
- [x] F1 Échap xterm → terminal, saisie reste ; hors xterm → palette puis saisie — `node .cache/eval-T019/mesure.mjs` → `F1 xterm+Échap: actif=xterm-helper-textarea saisie=1 SAISIE.tid=T001 defaultPrevented(doc-capture)=false in+=1 {"data":"\u001b"}` · `F1 champ+Échap: saisie=0` · `F1 palette+saisie: palette=true Échap1→palette=false saisie=1 Échap2→saisie=0` · `F1 xterm+Ctrl+K: palette=false`
- [x] F2 tag ∩ nom = ∅, `scrollWidth <= clientWidth`, 13 noms entiers à 1600 — `mesure.mjs` → `F2 1600: cartes=13 largeurs=164 inter=0 sw>cw=0 hors-carte=0 tag-none=0 KO=0` · `F2 150: cartes=13 largeurs=150 inter=0 sw>cw=0 … KO=0` · `IMPLÉMENTEUR w=150 fs=14.64px tag="AGENT" inter=false sw/cw=122/122`
- [x] F3 jamais NaN, `t === null` ∅ — `mesure.mjs` → `tableRH(null,undefined,.6,0,NaN) → ["|—","|—","ko|60 %","|0 %","|—"] · NaN dans #rh-* page=false` · `rg -n "t === null" dash/dash.js` → rc=1
- [x] F4 bas de `#tasks` atteignable tiroir ouvert ; fermé 40px — `node .cache/eval-T019/f4b.mjs` → `1600x1000 ouvert: pb=680px #tasks.bas=350 #tiroir.haut=360 ligneTouchee=T028 sousTiroir=0` · `1600x700 ouvert: pb=530px … ligneTouchee=T028` · `390x844 ouvert: pb=630.8px #tasks.bas=244 #tiroir.haut=253 ligneTouchee=T028` · `fermé: pb=40px` ×3
- [x] F5 `.demo-flag` z < 39, `.toasts` inchangé — `mesure.mjs` → `F5 fermé: {"z":"38","zt":"39","zToasts":"41","toasts":"16px/44px","dessus":"flag"}` · `F5 ouvert: {… "dessus":"tiroir"}` · `git show HEAD:dash/dash.css | rg toasts` → `.toasts{position:fixed;right:16px;bottom:44px;z-index:41;`
- [x] `node --check` rc 0 ; alert/confirm/prompt ∅ — `node --check dash/dash.js; echo rc=$?` → `rc=0` · `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → rc=1
- [x] script `.cache/T017/capture.mjs` F2+F1 collées, 0 erreur console — `rg -n "erreurs|F1 " .cache/T017/sortie.txt` → `34:F1 xterm+Échap: … api/term/in=1` · `69:F2 cartes KO=0 · erreurs console=0` ; mon banc → `erreurs console=0`
- [x] captures listées — `ls .cache/T017/*.png` → `deck-1600.png 126180` · `deck-390.png 113811` · `tiroir-ouvert.png 122766`
- [x] `git diff --stat -- dash/` collé ; 0 autre fichier — `git diff --stat -- dash/` → `dash/dash.css | 18 ++++++++++++------` · `dash/dash.js | 11 ++++++-----` · `2 files changed, 18 insertions(+), 11 deletions(-)` ; `git status --short dash/` → ` M dash/dash.css` ` M dash/dash.js` ; reste = `bin/*`, `.gitignore`, `vault/` (T018/chef, hors éval)
- [x] `result.md` T017 au format — sections Livré/Vérifié comment/Écarts/Pour la suite/Retour sur le pack présentes, 58 lignes ≤ 60
## Motif
∅
## Vérifié comment
`python3 bin/dash.py --port 7796 --no-open &` → `curl … /` → `200` ; fin `kill 162614` → `curl … 127.0.0.1:7796` → `000`
Affirmations T017 re-jouées (5/5 identiques) :
- `F2 1600 largeur=164 sw/cw=136/136` → observé `w=164 sw/cw=136/136`
- `IMPLÉMENTEUR w=150 fs=14.64px sw/cw=122/122` → observé identique (viewport 328 → carte 150)
- `F4 ouvert: #tasks.bottom=138 #tiroir.top=360 padding-bottom=680px` → `mesure.mjs` `#tasks.bottom=138 #tiroir.top=360 pb=680px`
- `F5 z=38 rect=16,932,289x24` → observé `"z":"38","rect":"16,932,289x24"`
- `F1 api/term/in=1 {"data":"\u001b"}` → observé `in+=1 {"data":"\u001b"}`
Écarts déclarés T017 jugés :
- `.demo-flag` gauche, bottom 44 — `rg demo-flag dash/` → seul consommateur `dash.js:999-1005` (création) ; droite = `.toasts` right:16 bottom:44 ; z<39 à bottom:14 ⇒ sous barre 34 px ; 0 casse
- `container-type` sur `.card-id` — `rg "@container|container-type|cqi" dash/` → `dash.css:107-109` seuls ; mesure F2 KO=0 aux 3 largeurs ; 0 casse
- `display:none` du tag (décision T017) → `tag-none=0` aux 3 largeurs
## Écarts
- lecture hors WL: `.cache/T017/capture.mjs:1-40` — routes obligatoires présentes
- lecture hors WL: `.cache/T017/sortie.txt` (rg) — 0 erreur console déclarée
- `mesure.mjs` F4 première version : page scrollée en bas ≠ bas de `#tasks` (scroll interne `max-height:252px`) → remplacée par `f4b.mjs`
## Pour la suite
- 390 px : bouton de la dernière `.trow` hors `elementFromPoint` (`cliquable=false` fermé ET ouvert) — préexistant, hors F4
- T017 `F2 320: largeur=150/142px` : carte < minmax 150 à 320 px — non couvert par DoD
- DoD F4 à préciser : `#tasks` scrolle en interne ; « bas atteignable » = page + `#tasks.scrollTop` max
## Retour sur le pack
- Manquait: `.tasks{max-height:252px;overflow:auto}` (scroll interne) ; tag réel des cartes (`AGENT`) ; viewport donnant carte 150 px (328)
- Inutile: ∅
