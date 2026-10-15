---
tache: T020
projet: agentx-immeuble
statut: fait
evalue: T018
verdict: retenir
---
## Verdict
retenir — 9/9 cases DoD T018 re-jouées OK
## DoD
- [x] D1 rôle hostile → repli, 0 TypeError, sig après succès, console.error — `node .cache/eval-T020/e2e.mjs hostile` → `constructor|__proto__|toString|hasOwnProperty|valueOf {"niveaux":7,"plaques":7,…,"ecran":["#5d6880"×5]} srv 7` · 6/6 OK · `vue étage hostile … "roles":["constructor:rgb(93, 104, 128)",…]` OK · `0 TypeError, console 0 erreur []` ; `e2e.mjs panne` → `{"sig":"force","erreurs":2}` OK · `panne levée 7 7 srv 7` OK
- [x] garde des autres lectures `COULEUR_ROLE[`/`GLYPHES[`/`COULEUR_STATUT[` — `rg -n … .cache/snap-T018/dash/dash.js` → 17,18,51,102,360,369,376,383,388,471,479,480,614,674,677,681,1037,1143,1318 = liste justifiée du result.md T018, à l'identique
- [x] D2 Échap palette > saisie > plein écran > retour, xterm intouché — `e2e.mjs echap` → `Échap 0 {"palette":true,"saisie":"T001","plein":true}` · `Échap 1 {"palette":false,"saisie":"T001","plein":true,"hash":"#/alpha"}` · `Échap 2 {"saisie":null,"plein":true}` · `Échap 3 {"plein":false,"hash":"#/alpha"}` · `Échap 4 {"hash":"#/","vue":"immeuble"}` · `Échap dans xterm {"hash":"#/alpha","vue":"etage","focus":"xterm-helper-textarea"}` · 7/7 OK
- [x] D3 troncature par points de code, 0 surrogate isolé — `e2e.mjs tronc` → `"É6 · x…x🇫…" ["78","1f1eb","2026"]` · `"É5 · x…x👩‍…" ["1f469","200d","2026"]` · `"y…y👩…" ["79","1f469","2026"]` · `courtT [["x🚀…",30],…,["aaa…",48],["abc",3]]` · `OK tour : 0 surrogate isolé` · `OK courtT : 0 surrogate isolé, ≤ n points`
- [x] focus Entrée / ⌂ / Échap, jamais BODY — `e2e.mjs focus` → `Entrée beta … vers-immeuble` · `Entrée ⌂ … tour:beta` · `clic ⌂ gamma … tour:gamma` · `Échap alpha … tour:alpha` · `après poll … tour:alpha` · 6/6 OK
- [x] `#/Beta` tranché (minuscules), 1 ligne Écarts — `e2e.mjs beta` → `#/Beta {"vue":"etage","hash":"#/Beta","slug":"beta"}` · `#/BETA … "slug":"beta"` · `#/zz {"vue":"immeuble","hash":""}` · 4/4 OK ; result T018:L42 présent
- [x] 0 régression — `node .cache/eval-T020/e2e-T015.mjs` → rc 0 · 51 `OK` · `KO total 0` ; `node .cache/eval-T020/e2e-T016.mjs all` (banc neuf) → rc 0 · W1-W7 0 `KO` · `== erreurs console cumulées 0 []` ; `node --check dash.js` → rc=0 ; `rg -n "alert\(|confirm\(|prompt\(" dash.js` → rc=1
- [x] périmètre `dash/dash.js` seul — `git show --stat --format= 625d4fc..bb592d9 -- dash/` → `dash/dash.js | 45 +++…--- · 1 file changed, 31 insertions(+), 14 deletions(-)` ; `git show --stat bb592d9` → 1 fichier
- [x] result.md T018 au format — `grep -n '^## '` → Livré:6 · Vérifié comment:16 · Écarts:41 · Pour la suite:47 · Retour sur le pack:53 ; corps 49 l. ≤ 60
## Motif
∅
## Vérifié comment
banc `.cache/eval-T020/banc` (setup T009 + `ext.py` : étage `hostile` 5 tâches en-cours, `emoji-a/b/c`) :7813 → `cmp dash.js snap-T018` → `SAME` · 7 étages srv
`git show bb592d9:dash/dash.js | cmp - .cache/snap-T018/dash/dash.js` → `SAME`
`node e2e.mjs all` → `KO total 0 (snap-T018)` (log `.cache/eval-T020/run-snap.log`)
discrimination `BASE=1` (dash.js 625d4fc) → hostile `KO total 7` · tronc `KO total 2` · beta `KO total 2` · echap/focus `TimeoutError` (Échap 4 sans retour)
affirmations T018 re-jouées (6) : repro-d1 niveaux=srv · roles-hostiles `#5d6880` · emoji `seulSurrogate:false` · Échap→`#/` · `#/Beta`→beta · panne console.error ×2 · e2e-T015 `51 OK` = déclaré
e2e-T016 re-banc neuf (setup T009 + `pack.tpl` extrait) :7813 → W4 `rôle constructor → gyro bloque suivi 1125 ms · charger() → ok` · W6 `Entrée sur beta → {…"focus":"vers-immeuble"}` · `Échap → {"hash":"#/","vue":"immeuble"}`
fin : `kill $(cat .cache/eval-T020/pid)` ; `curl :7813` → `000`
écarts T018 jugés : POSTES sans proto — OK, `POSTES[f.de]` dash.js:376-383 rôle vault ; `#/Beta` minuscules — OK, hash URL non réécrit ; e2e-T015 slugs adaptés — OK, refait idem (orthopro→beta, seagle-site→gamma, 8 li→`LIVE.etages.length`) ; W6 adapté — OK, diff = 3 lignes, ⌂ caché en vue immeuble après Échap
## Écarts
- lecture hors WL: `bin/dash.py:425-436,545-560` — source de `alerte.texte` (urgent/sonde)
- lecture hors WL: `.cache/T018/e2e-T016.mjs` — W1-W7 exigés par DoD T018
- lecture hors WL: `.cache/banc-T016i/e2e-T016.mjs` — juger l'adaptation W6 (diff)
- lecture hors WL: `.cache/banc-T016i/setup.py` — `diff` = setup T009, identique
- `git show 625d4fc:dash/dash.js > .cache/eval-T020/base-dash.js` — preuve de discrimination
- alertes 48 car. testées par réponse `state.json` mutée (route) ; titres 30 car. par vault réel
## Pour la suite
- courtT par point de code : ZWJ `👩‍…` et drapeau `🇫…` brisés (0 surrogate) → `Intl.Segmenter`
- focus → BODY après Échap fermant palette ou saisie (Échap 1/2 observés)
- sortie plein écran → `term.focus()` : 4e Échap va à claude sans blur
- `#/Beta` : URL non normalisée (`location.hash` reste `#/Beta`)
- e2e-T016 W2 `horsViewBox [["#tour-decor",0,0,700,490]]` signalé, non KO, hors périmètre
## Retour sur le pack
- Manquait: `.cache/T018/e2e-T016.mjs` + `pack.tpl` en WL (DoD T018 exige W1-W7) ; source `alerte.texte` (bin/dash.py:429,557) | Inutile: ∅
