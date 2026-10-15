---
tache: T012
projet: agentx-immeuble
statut: revue
---
## Livré
- dash/dash.js:937-942 — D3 : `SON.vu=''` si 0 événement au chargement ; 1er événement sonne
- dash/dash.js:985-986 — `IMMEUBLE.transit` : bascule demandée, réponse non rendue
- dash/dash.js:1002-1009 — D1 : `surHash` pose transit + `#tasks.inert=true`, ferme saisie
- dash/dash.js:1189-1192 — D1 : `charger` : étage ≠ → `SAISIE.tid=null` avant `rendre` ; lève transit/inert
- dash/dash.js:1209-1227 — D1 bis : `pilote` refuse si transit ou `IMMEUBLE.slug`≠affiché ou `req.projet`≠affiché ; message `#sortie-etat`=`refusé`
- dash/dash.js:1275 — todo du toit : `pilote(..., true)` exempté du contrôle `req.projet`
- dash/dash.js:1436-1438 — D2 : Alt+↑/↓ part de `IMMEUBLE.slug`, sinon sélection `ETAT`
- .cache/T012/e2e-T012.mjs — script T009 rejoué :7805, V2b réécrit, V6e ajouté
## Vérifié comment
`node --check dash/dash.js; echo rc $?` → `rc 0`
`rg -n "alert\(|confirm\(|prompt\(" dash/dash.js; echo rg rc $?` → `rg rc 1` (∅)
banc neuf (`setup.py` T009, `run/` absent) + `node .cache/T012/e2e-T012.mjs` → `.cache/T012/e2e.out` :
```
   V2b clic pendant bascule : clic refusé
   V2b pendant bascule : {"hash":"#/gamma","slug":"alpha","inert":true,"cliquables":0,"saisie":false}
   V2b pilote pendant bascule : refusé | refusé — étage en bascule, rien n'est parti.
   V2b après réponse : {"hash":"#/gamma","slug":"gamma","nom":"Gamma : en sommeil","saisie":null,"inert":false}
OK V2b lignes inertes pendant la bascule — {"inert":true,"cliquables":0,"saisie":false}
OK V2b pilote refusé pendant la bascule (#sortie-etat) — refusé | refusé — étage en bascule, rien n'est parti.
OK V2b 0 requête vers alpha, alpha inchangé — affiché gamma « Gamma : en sommeil » · requêtes [] · alpha Δ []
OK V2b pilote projet ≠ affiché refusé — refusé | refusé — action pour alpha, étage affiché gamma.
OK V2b retour alpha : lignes actives
OK V3b Alt+↓ ×2 → rang 2 — ordre beta,alpha,gamma · obtenu gamma #/gamma
OK V4 archive refusée — ["beta","",null,"défaut beta"]
OK V6a 1er événement (fichier vide au chargement) → beta sonne — sonne ["beta"] toasts ["beta · T002 · 14:03:11"]
OK V6e rechargement → 0 rejeu — sonne [] toasts []
OK 0 erreur console — []
OK 0 dialogue
BILAN 40/40 OK
```
40 = 35 T009 − 1 (ancien V2b) + 5 (V2b) + 1 (V6e) ; reste V1-V9 OK, sortie complète dans e2e.out
salle-banc `kill` pid → `curl` → `000`
`git diff --stat -- dash/` → dash.css 143 · dash.js 211 · index.html 12 — css/html = travail non commité T005/T010, 0 octet de T012
## Écarts
- lecture hors WL : ∅
- V4 « archive refusée » : attendu `alpha` → défaut serveur lu par fetch ; T009 n'obtenait alpha que via la mutation fautive D1
- V2b réécrit selon DoD (saisie ouverte alpha → `#/gamma` retardé 1500 ms → Entrée) ; ancien V2b (clic pendant bascule) gardé : « clic refusé »
- D1 bis littéral (« toute requête porte projet affiché ») casserait la todo agrégée : `exe.projet`=beta sur étage alpha ; exemption `toit` sur `req.projet` seul, contrôle transit gardé
## Pour la suite
- évaluateur : trancher l'exemption todo du toit (D1 bis) — sinon ▶ lancer cross-étage refusé
- `#tasks[inert]` sans style : T011/designer peut griser (`dash.css` hors WL)
- todo ▶ lancer cross-étage NV sur banc (0 scénario)
## Retour sur le pack
- Manquait: todo agrégée porte `exe.projet` d'autres étages (D1 bis ambigu) ; V4 du script T009 dépend du défaut D1 ; `git diff --stat` inclut le travail non commité d'autres tâches
- Inutile: ∅
