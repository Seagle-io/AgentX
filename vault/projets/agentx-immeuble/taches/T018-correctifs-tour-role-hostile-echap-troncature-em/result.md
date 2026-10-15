---
tache: T018
projet: agentx-immeuble
statut: revue
---
## Livré
- dash/dash.js:7-14 — COULEUR_ROLE, COULEUR_STATUT sans prototype (`{__proto__: null}`)
- dash/dash.js:281,288 — POSTES sans prototype (arcs relais, rôle `constructor`)
- dash/dash.js:300 — GLYPHES sans prototype, repli `resultat` inchangé
- dash/dash.js:471,711 — COULEUR_STATUT repli `#5d6880`
- dash/dash.js:994 — slug du hash minuscule : `#/Beta` = `#/beta`
- dash/dash.js:1125-1126 — courtT par points de code (`Array.from`)
- dash/dash.js:1320-1329 — construireTour en try : console.error, sig après succès, focus suit l'étage
- dash/dash.js:1332-1348 — majVue : tour→⌂ focus ; ⌂/Échap→plaque quittée
- dash/dash.js:1721-1724 — Échap vue étage → `#/`, après palette/saisie/plein écran, hors xterm
## Vérifié comment
banc `.cache/T018/banc` (setup.py T016i) :7811 ; `curl :7811/dash.js | cmp - dash/dash.js` → `SAME` ; scripts copiés dans `.cache/T018/` (chemins + port)
base avant correctif : `node repro-d1.mjs` → `{"vue":"immeuble","niveaux":0,"plaquesEtage":0,"etagesSrv":14,"listeImmeuble":14} · console []`
`node repro-d1.mjs` → `{"vue":"immeuble","niveaux":14,"plaquesEtage":14,"etagesSrv":14,"listeImmeuble":14} · console []`
`node roles-hostiles.mjs` → `constructor|__proto__|toString|hasOwnProperty {"niveaux":13,"plaques":13,"srv":13,…,"ecran":"#5d6880"}` · `implementeur … "ecran":"#ff8a3d"` · vue étage `constructor:rgb(93, 104, 128)` · `console []`
`node sonde-bords.mjs` → `emoji plaque {"texte":"É14 · xxxxxxxxxxxxxxxxxxxxxxxxxxxx🚀…","seulSurrogate":false,"codes":["78","1f680","2026"]}` · `Échap en vue étage (focus body) {"hash":"#/","vue":"immeuble",…}` · `#/Beta {"hash":"#/Beta","vue":"etage","slug":"beta",…}` · console = 4 lignes ERR_FAILED du scénario réseau coupé volontaire
`node court.mjs` → `{"alerte48":"🚀…","seulSurrogate":false,"points":48,"court":"abc"}`
`node sonde-T018.mjs` →
```
Entrée sur beta (tour) {"hash":"#/beta","vue":"etage",…,"focus":"vers-immeuble"}
Entrée sur ⌂ {"hash":"#/","vue":"immeuble",…,"focus":"tour:beta"}
clic ⌂ depuis gamma {…"focus":"tour:gamma"} · Échap depuis alpha (focus body) {"hash":"#/",…,"focus":"tour:alpha"}
Échap 1 (palette) {"hash":"#/alpha","vue":"etage","palette":false,…} · Échap 2 (saisie) {"hash":"#/alpha",…,"saisie":null}
Échap 3 (plein écran) {"hash":"#/alpha","vue":"etage",…,"plein":false} · Échap 4 (retour) {"hash":"#/","vue":"immeuble",…}
Échap dans xterm (focus xterm true ) {"hash":"#/alpha","vue":"etage",…,"focus":"xterm-helper-textarea"}
tour en panne {"sig":"forcé","erreurs":["error: dash: tour non rendue, nouvel essai au prochain relevé TypeError: panne simulée",×2]}
panne levée → plaques 14 sig posée true · console (hors panne simulée) []
```
`node e2e-T016.mjs all` (banc neuf) → 0 KO ; W4 `rôle constructor → gyro bloque suivi 1048 ms · tour ["constructor:T002"]` ; `== erreurs console cumulées 0 []`
`node e2e-T016.mjs w6` (adapté, cf. Écarts) → `Entrée sur beta → {…"focus":"vers-immeuble"}` · `Échap → {"hash":"#/","vue":"immeuble"}` · `⌂ atteint après 0 Tab · Entrée → {"hash":"#/","vue":"immeuble","focus":"g"}`
`node e2e-T015.mjs` (adapté) → rc 0 · 51 `OK` · `KO total 0`
`rg -n "COULEUR_ROLE\[|GLYPHES\[|COULEUR_STATUT\[|POSTES\[" dash/dash.js` → 17,18 écriture registre · 51,479-480 `r.cle` = roles.json · 102,471,711 sans proto + repli · 360,369 sans proto + repli resultat · 376,383 sans proto, filtre · 388 `f.de` ∈ POSTES (filtré 376) · 614,674,677,681,1037,1143 sans proto + repli `#5d6880` · 1318 signature seule
`node --check dash/dash.js` → rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅ (rc 1)
`git diff --stat 625d4fc -- dash/` → `dash/dash.js | 45 +++++++++++++++++++++++++++++++--------------`
fin : `kill 457270` ; `curl :7811` → `000`
## Écarts
- `#/Beta` tranché : minuscules avant validation — slugs vx toujours minuscules
- POSTES (hors liste DoD) sans proto — `POSTES['constructor']` = fonction → arcs TypeError
- e2e-T015 adapté : `orthopro`→`beta`, `seagle-site`→`gamma`, 8→14 li — supposait le vrai vault
- e2e-T016 W6 adapté : Échap revient à l'immeuble, ⌂ re-cherché depuis Entrée sur beta
- dash.css non touché ; ∅ lecture hors WL
## Pour la suite
- focus → BODY après Échap qui ferme palette ou saisie (hors DoD)
- hash invalide autre que casse (`#/a b`) : conservé + vue immeuble ≠ C8 « effacé »
- console.error tour répété toutes les 2 s tant que la panne dure
- reduce : 1864 CSSTransition `visibility` à la bascule (noté, non traité)
- validation serveur du rôle (`bin/*`) : rôle `constructor` accepté par vx
## Retour sur le pack
- Manquait: e2e-T015 dépend des slugs du vrai vault (orthopro, seagle-site, 8 étages) ; banc T016i : projet `emoji` + rôle `constructor` posés à la main après e2e | Inutile: ∅
