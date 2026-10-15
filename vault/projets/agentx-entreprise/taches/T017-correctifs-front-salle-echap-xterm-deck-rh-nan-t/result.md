---
tache: T017
statut: revue
---
## Livré
- dash/dash.js:1250-1258 — F1 `dansXterm` exclut Ctrl+K et Échap
- dash/dash.js:567-570 — F3 `Number.isFinite` → `—`, jamais NaN
- dash/dash.css:29-30 — F4 `.frame:has(.tiroir.ouvert)` padding + hauteur tiroir
- dash/dash.css:90-95 — F2 `.card-top` grille "face tag"/"id id"
- dash/dash.css:107-114 — F2 nom pleine largeur, `min(15px,12cqi)`, tag en coin
- dash/dash.css:569-571 — F5 `.demo-flag` z 38, `left:16px;bottom:44px`
- .cache/T017/capture.mjs — banc Playwright F1/F2/F4/F5, 320-1600 px
- .cache/T017/{deck-1600,deck-390,tiroir-ouvert}.png · sortie.txt
## Vérifié comment
`node .cache/T017/capture.mjs` (avant correctif CSS, 1600) → `F2 1600: … chevauchement=0 débord=11` · `IMPLÉMENTEUR sw/cw=121/55` · `F2 150: débord=13` · `F4 ouvert: #tasks.bottom=778 #tiroir.top=360 visible=false` · clic `virer` intercepté par `#tiroir`
`node .cache/T017/capture.mjs` (après) →
```
F2 1600: cartes=13 largeur=164px chevauchement=0 débord=0
F2 150: cartes=13 largeur=150px chevauchement=0 débord=0
F4 ouvert: #tasks.bottom=138 #tiroir.top=360 visible=true .frame padding-bottom=680px
F4 fermé: .frame padding-bottom=40px
F1 saisie ouverte=1
F1 xterm+Échap: actif=xterm-helper-textarea saisie=1 api/term/in=1 {"data":"\u001b"}
F1 champ+Échap: saisie=0
F1 palette: ouverte=true après Échap=false
F5 tiroir fermé: z=38 rect=16,932,289x24 visible=true
F5 tiroir ouvert: z=38 rect=16,932,289x24 visible=false
F2 390: cartes=13 largeur=181px chevauchement=0 débord=0
390 scrollWidth/clientWidth=390/390
F2 320: cartes=13 largeur=150/142px chevauchement=0 débord=0
320 scrollWidth/clientWidth=320/320
F2 cartes KO=0 · erreurs console=0
  IMPLÉMENTEUR  w=164 fs=15px inter=false sw/cw=136/136
  VÉRIFICATEUR  w=164 fs=15px inter=false sw/cw=136/136
  IMPLÉMENTEUR  w=150 fs=14.64px inter=false sw/cw=122/122
  VÉRIFICATEUR  w=142 fs=13.68px inter=false sw/cw=114/114
```
(13 lignes/largeur dans `.cache/T017/sortie.txt` ; F5 z-index toasts=41 inchangé)
`node --check dash/dash.js; echo $?` → `0`
`rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ (rc 1)
`rg -n "t === null" dash/dash.js` → ∅ (rc 1)
`git diff --stat -- dash/` → `dash/dash.css | 18 ++++++++++++------` · `dash/dash.js | 11 ++++++-----` · `2 files changed, 18 insertions(+), 11 deletions(-)`
`curl -s -o /dev/null -w '%{http_code}' 127.0.0.1:7794` (banc tué) → `000`
## Écarts
- lecture hors WL: `rg` sur dash/index.html — `#tiroir` dans `.frame` ? (oui, :12/:143)
- `container-type` sur `.card-id`, pas `.card` — sur `.card`, 320 px → colonnes `264px 28px`
- `.demo-flag` déplacé à gauche, bottom 44 — z 38 seul ⇒ masqué par barre 34 px ; droite = toasts
- banc : `api/term/open|etat` → `{"vivant":true}`, GET term → `text/event-stream` vide — simule session, 0 erreur MIME
- banc F5 : `state.json` réécrit `demo:true` côté route — `.demo-flag` absent du vrai vault
- `git status` : `.gitignore`, `bin/dash.py`, `bin/vx.py` modifiés — pas par T017 (T018 ?)
## Pour la suite
- 390 px : en-tête du tiroir fermé déborde 34 px (CHEF DE PROJET sur 3 lignes) — hors périmètre
- `.frame:has()` et `cqi` : Chromium/Firefox 121+/Safari 16 ; pas de repli
- nom ≥ 13 lettres dans roles.json → 12cqi déborde à 150 px ; recalculer
## Retour sur le pack
- Manquait: témoin F1 exige session simulée vivante (body `{}` ⇒ 0 `api/term/in`) ; flux EventSource → erreur MIME si fulfill JSON ; `.demo-flag` z<39 la cache sous barre fermée
- Inutile: ∅
