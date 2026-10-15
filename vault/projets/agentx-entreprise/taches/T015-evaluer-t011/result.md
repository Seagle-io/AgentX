---
tache: T015
statut: fait
evalue: T011
verdict: retenir
---
## Verdict
retenir — 15/15 cases T011 prouvées, 0 écart bloquant
## DoD
- [x] supprimés sortie/ecrire/lancer/peuplerConsole/brancherConsole + #console-out + CSS .console-* — `rg -n "peuplerConsole|brancherConsole|console-out|console-etat|console-barre" dash/ → rc=1` · `rg -n "function (sortie|ecrire|lancer)\b|\blancer\(|sortie\(\)" dash/dash.js → rc=1` · `rg -n console dash/dash.css dash/index.html → rc=1`
- [x] copier verbatim ; pilote = ex-lancer — `diff <(HEAD~1 copier) <(copier) → diff_rc=0` · eval-T015 B → `POST jeton: JT` · `#sortie: "<span class=\"cmd\">$ python3 bin/vx.py board</span>\nOUT\n…— code 0"` · `#sortie-etat: ok · charger() rappelé: 1`
- [x] brancherTodo data-exe → pilote, data-copie → copier — eval-T015 B → `body: {"action":"virer","tid":"T009","projet":"x","motif":"m"}` · `todo ⧉ → copie: python3 bin/vx.py virer T009 --motif "m" --projet x` ; dash.js:1102-1108 ≡ HEAD~1:1066-1069 (lancer→pilote)
- [x] rendreTaches ACTIONS, .tbtn[data-act][data-tid], rejete, gel si SAISIE — eval-T015 D → `trow rejete T004: true · data-act virer: true` · pilote-T011 3/4 → `tbtn: 5 · tact vide: true` · `html inchangé` ; index.html:118 `<span>ACTIONS</span>`
- [x] saisie inline maxlength 200, prérempli, Entrée/vide/Échap — pilote-T011 4-7 → `input: true · prérempli: "tests non lances"` · `ko: true · requêtes envoyées: 0` · `SAISIE: {"tid":null,"k":null}` · `POST: {…"motif":"doublon de T004"}`
- [x] palette HTML verbatim, entreesPalette, filtre sans accents, ↑↓/Entrée/Échap, saisie motif — `diff contrat.md:462-466 index.html:163-167 → palette_diff=0` · eval-T015 E/F/H → `filtre "ecran" → [ 'T009 · intégrer', 'T009 · ✕ virer' ]` · `↓ ↓ ↑ sel: 1 0 1` · `motif 201 → ko: true · POST: 0` · `body: {…"motif":"raison"} · palette: false` · pilote-T011 9 → `placeholder: "motif du renvoi — Entrée" · maxLength: 200`
- [x] raccourcis Ctrl/⌘K (ignoré xterm), Ctrl+` partout, Échap palette > saisie > plein écran — pilote-T011 11/12 → `ignoré: true` · `tiroir ouvert: true` · eval-T015 G → `Échap1 → palette: false · saisie: T009` · `Échap2 → saisie: null · stopPropagation: true` · `Échap3 → propagé vers plein écran: true` · H via metaKey OK
- [x] tiroir fixe, translateY(calc(100% - 34px)), 0 display:none, localStorage try/catch, fit 50 ms, padding-bottom 40px, ids conservés — dash.css:514-521 · dash.css:28 · index.html:143-155 ids 5/5 + #tiroir-btn · eval-T015 A/I/J → `init ouvert: false · ls: 0 · fit ms: 50` · `ls: 1 … re-bascule → ls: 0 · btn: ▴ terminal` · `localStorage KO → pas d'exception`
- [x] POSTE DE PILOTAGE + #pilote-barre 6 data-lire + kbd ⌘K + #sortie/#sortie-etat — index.html:105-121 · eval-T015 C → `barre personnel → body: {"action":"personnel","projet":"x"}`
- [x] amorçage verbatim — `rg -n "^brancherTodo" dash/dash.js → 1474:brancherTodo(); brancherTaches(); brancherPalette(); brancherTerminal(); brancherSon(); boucle();`
- [x] 0 alert/confirm/prompt — `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js → rc=1`
- [x] node --check — `node --check dash/dash.js; echo rc=$? → rc=0`
- [x] harnais .cache/pilote-T011.mjs — `node .cache/pilote-T011.mjs → rc=0`, sortie 12 points identique au result.md T011
- [x] git diff --stat dash/ collé, 0 autre fichier — `git diff HEAD~1 HEAD --stat -- dash/ → 3 files changed, 396 insertions(+), 111 deletions(-)` = déclaré ; `git status --short dash/ → ∅`
- [x] result.md T011 au format — 5 sections exactes ; `wc -l → 61` dont 4 frontmatter → corps 57 ≤ 60 ; sortie 1 condensée déclarée, re-jouée contenu identique
## Motif
∅
## Vérifié comment
`node --check dash/dash.js; echo rc=$?` → `rc=0`
`node .cache/pilote-T011.mjs; echo rc=$?` → 12 lignes ≡ result T011 · `rc=0`
`node .cache/eval-T015.mjs; echo rc=$?` → A…K ci-dessus · `rc=0`
`git diff HEAD~1 HEAD --stat` → 29 fichiers : commit b0109a2 multi-lots L1-L4+T010 du chef ; part T011 = dash/{dash.js,dash.css,index.html} + T011/{context,result,task}.md
`rg -n "csep|clab" dash/` → rc=1 (écart .csep/.clab : CSS mort, 0 consommateur)
## Écarts
- lecture hors WL: .cache/pilote-T011.mjs — authentifier harnais T011 (1/5)
- `git show HEAD~1:dash/dash.js` — version antérieure fichier WL, copier verbatim
- navigateur non lancé — salle :7792 ouvrirait/redimensionnerait session terminal chef
## Pour la suite
- écarts T011 vs §C9 : z-index tiroir 39 < .demo-flag 40 (démo seule) ; pilote écrit via closure ; fit?.() — 0 consommateur cassé
- DoD « ≤ 60 lignes » ambiguë (frontmatter inclus ?) et « sortie brute » vs condensé — préciser au gabarit
- rendreTaches gelé gèle aussi #journal/#tasks-meta pendant saisie — à trancher au contrat
- vérif navigateur restante : scénario « Pour la suite » de T011, sur :7777 humain
## Retour sur le pack
- Manquait: avertir que la page lancée ouvre/attache la session terminal chef (term open) — capture navigateur pas sûre
- Manquait: commit HEAD~1..HEAD multi-lots, périmètre à filtrer par lot
- Inutile: ∅
