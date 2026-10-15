---
tache: T014
projet: agentx-immeuble
statut: fait
evalue: T012
verdict: retenir
---
## Verdict
retenir — 7/7 DoD T012, 26/26 banc, 0 contournement
## DoD
- [x] D1 inertes + saisie fermée + 0 requête alpha — `node .cache/eval-T014/e2e.mjs` → 4 voies (hash, clic, Alt+↓, palette), retard 1500 ms : `pendant {"transit":true,"inert":true,"saisie":null,"champ":false,"cliquables":0}` · `requêtes [] · Δ {}` ×4 ; dash.js:1189 `SAISIE.tid = null` avant `rendre`
- [x] D1 bis : refus si `projet` ≠ affiché — `OK D1 bis ligne de tâche exe.projet=alpha sur beta → refusé — refusé | refusé — action pour alpha, étage affiché beta. · requêtes []` · palette périmée → `refusé … étage affiché gamma. · requêtes []`
- [x] D2 : Alt+↓ ×2 → rang 2 — `OK D2 … ordre alpha,beta,gamma · départ alpha (hash vide) · pendant gamma/gamma · obtenu gamma #/gamma`
- [x] D3 : 1er événement sonne, 0 rejeu — `OK D3 pré : run/evenements.jsonl absent` · `sonne ["beta"] toasts ["beta · T002 · 14:03:11"]` · rechargement `sonne [] toasts []` · neuf gamma `sonne ["gamma"]`
- [x] 0 régression V1-V9 — script T009 rejoué (seule adaptation : clic V2b tolérant, le bouton est inert) → `BILAN 33/35` ; KO V4 `["beta","",null]` : défaut = activité, V3b `ordre beta,alpha,gamma` (dépendait de la mutation D1, écart déclaré T012) ; KO V6a `sonne [] toasts ["beta · T002 · 14:03:11"]` : attente fixe 2600 ms > `.sonne` 2500 ms (dash.js:1071) ; V6a en attente active → `.sonne beta vue à 46 ms` · `OK V6a` · `BILAN 34/35`
- [x] `node --check` rc 0 ; alert/confirm/prompt ∅ — `node --check …/snap-T012/dash/dash.js; echo rc $?` → `rc 0` · `rg -n "alert\(|confirm\(|prompt\(" …; echo rg rc $?` → `rg rc 1`
- [x] diff dash/ = dash.js seul côté T012 — `git show --stat 48a6888 -- dash/` → `dash.css 143 · dash.js 211 · index.html 12` ; T010 result.md:38 → `dash.css 143 + · dash.js 185 + · index.html 12 ±` ⇒ css/html Δ 0 entre T010 et T012 ; `rg -n "inert" dash.css index.html` → ∅
- [x] result.md T012 au format — 51 lignes ≤ 60 · frontmatter `tache/projet/statut: revue` · 5 sections exactes · Pour la suite 3 lignes
## Motif
∅
## Vérifié comment
- instantané = commit : `git show 48a6888:dash/{dash.js,dash.css,index.html} | diff -q - snap` → `SNAP=COMMIT dash.css=COMMIT index.html=COMMIT`
- banc `.cache/eval-T014/banc` (setup.py T009) :7808 → `banc ok` · `curl` → `200` ; kill pid → `000`
- `node .cache/eval-T014/e2e.mjs` → `BILAN 26/26 OK` (sortie : `.cache/eval-T014/e2e.out`), retard = fenêtre sur toutes les requêtes du slug (poll compris)
- contournements pendant bascule (retard 3000 ms), tous `transit true · requêtes []` :
```
OK C palette Ctrl+K (T001 virer + motif) — voyant «refusé» refusé — étage en bascule, rien n'est parti.
OK C palette Ctrl+K (board, exe direct) — refusé — étage en bascule
OK C todo ▶ lancer — refusé — étage en bascule
OK C double Entrée saisie palette alpha pendant bascule — saisie {"action":"virer","tid":"T004","projet":"alpha"} · Entrée après atterrissage voyant «refusé» · requêtes []
OK C clic souris sur .tbtn résiduel — champ ouvert false
OK C el.click() JS sur .tbtn exe direct (contourne inert) — refusé — étage en bascule
OK C el.click() JS virer + motif + Entrée — champ ouvert true · refusé — étage en bascule · après : saisie null champ false
OK C barre pilote data-lire — refusé — étage en bascule
```
- décision chef (todo toit cross-étage) : `OK … {"exe":{"action":"set","tid":"T003","statut":"a-faire","projet":"alpha"},"etiquette":"alpha","affiche":"gamma"} · requêtes [["set","T003","alpha"]] · code 0 · Δ {"alpha":["T003:bloque→a-faire"]}` ; pendant transit → `OK C todo ▶ lancer … refusé`
- affirmations T012 rejouées (6) : rc 0 · rg rc 1 · V2b `inert:true, cliquables:0` · V3b → gamma · V6a/V6e · V4 défaut = beta ; coordonnées :937-942 :985-986 :1002-1009 :1189-1192 :1209-1227 :1275 :1436-1438 → `sed -n` = code déclaré
- 0 erreur console, 0 dialogue (e2e.mjs) ; vrai vault : 0 commande vx lancée hors banc
## Écarts
- lecture hors WL: `vault/projets/agentx-immeuble/taches/T010-*/result.md` (rg dash.css|index.html) — attribuer diff css/html
- scripts : `.cache/eval-T014/{e2e.mjs, e2e-T009-rejeu.mjs, e2e-T009-rejeu-attente.mjs, sonde-v6a.mjs}` · sorties `*.out`
## Pour la suite
- `surHash` ne ferme pas `PALETTE.saisie` : saisie palette alpha survit à la bascule (refusée par `pilote`, UX)
- `#tasks[inert]` sans style dans dash.css (déclaré T012)
- `charger` : `s.erreur` → throw avant `transit = false` (dash.js:1184) : pilote refusé jusqu'au poll suivant OK
- script T009 : V6a attente fixe 2600 ms > durée `.sonne` 2500 ms → instable ; V4 suppose alpha par défaut
## Retour sur le pack
- Manquait: DoD T012 « git diff --stat » inapplicable (dash/ commité en 48a6888) — donner les compteurs T010 ; T012 DoD « 35/35 » impossible littéralement (V2b clique un bouton désormais inert)
- Inutile: ∅
