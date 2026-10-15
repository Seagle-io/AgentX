---
tache: T016
statut: fait
---
## Livré
- verdict : DÉFAUTS (3) — S1-S7 de la DoD : 38/38 OK ; défauts trouvés hors scénarios nominaux
- D1 · 2 `virer` concurrents (2 onglets / chef CLI + page) · attendu : 1 remplaçante, ids uniques · obtenu : virer T003 ∥ T007 → 2 dossiers `T014-gamma-encours` + `T014-zeta-fait`, T003 et T007 `remplacee_par: T014` ; virer T006 ∥ T006 → 2 rc 0, remplaçantes T012 + T013, T012 orpheline ; `doctor` → `vault coherent.` rc 0 ; page : clic « abandonner » ligne 2 T014 (Zeta fait) → abandonne T014 Gamma encours · repro : `for t in T003 T007; do curl -s -X POST 127.0.0.1:7793/api/run -H 'Content-Type: application/json' -H "X-AgentX-Jeton: $J" -d '{"action":"virer","tid":"'$t'","projet":"banc","motif":"course"}' & done; wait` puis `node .cache/banc-T016/e2e-T016-bords.mjs` (B4) · bin/vx.py:336-340 (max+1, `mkdir exist_ok=True`, 0 verrou) · bin/dash.py:176-179 (`executer` sans verrou sous `ThreadingHTTPServer` :1077) · bin/vx.py:266-272 (`_trouver_tache` 1er trouvé)
- D2 · commande « ⧉ copier » / `integrer` avec Motif d'éval contenant `` ` `` ou `$(` · attendu : chaîne shell inerte · obtenu : Motif `` `touch /tmp/claude-1000/T016-INJECTE` non lance, $(echo SUBST) "cite" `` → todo cmd `--motif "`touch …` non lance, $(echo SUBST) "cite""` ; collée dans bash → fichier créé, `SUBST` substitué, guillemets cassés · repro : result évaluateur T015 ci-dessus, `curl -s 127.0.0.1:7793/state.json` → `todo[Virer T002].cmd` ; `bash -c "$(sed 's#^python3 bin/vx.py#printf "<%s>\\n"#' .cache/banc-T016/.cache_cmd)"` → `< non lance, SUBST cite>` + `ls /tmp/claude-1000/T016-INJECTE` existe · bin/dash.py:524, :577 ; bin/vx.py:406, :523 (même gabarit, lu et exécuté par le chef en Bash) — `shlex.quote` absent ; gabarit dicté par §C5/C6/C8
- D3 · saisie motif ouverte, focus dans xterm (session vivante), Échap · attendu : `\x1b` envoyé à claude (interruption), comme sans saisie · obtenu : Échap avalé, saisie fermée, 0 `api/term/in` ; témoin sans saisie → `in {"data":"\u001b"}` · repro : `node .cache/banc-T016/e2e-T016-bords.mjs` (B1) · dash/dash.js:1257 (branche Échap sans exclusion `xterm-helper-textarea`, cf. :1457 qui l'exclut)
- captures : `.cache/banc-T016/T016-pleine-1600.png` · `T016-tiroir.png` · `T016-palette.png` · `T016-390.png` · `T016-390-taches.png` (même dossier)
- scripts : `.cache/banc-T016/e2e-T016.mjs` (DoD) · `e2e-T016-bords.mjs` (B1-B4) · `e2e-390.mjs`
## Vérifié comment
banc : 10 tâches (a-faire T001/T010, pret T002, en-cours T003, revue T004+éval T008 `virer`, revue T005+éval T009 `retenir`, bloque T006, fait T007 eclaireur) ; `vx.py doctor` → `vault coherent.` rc=0
`curl -s 127.0.0.1:7793/state.json | python3 -c …` → `roles 13` · `affectables 11` · T001 `['pack','lint','pret','abandonner']` … T005 `['integrer','retenir','virer']`
`node .cache/banc-T016/e2e-T016.mjs` → rc=0, `KO=0` :
```
OK S1 deck 13 cartes · n=13 | OK S1 room 12 bureaux · n=12 | OK S1 #rh rempli · tr=16 meta="1 projet(s) · 0 archive(s)"
OK S2 saisie préremplie · "tests non lances" | OK S2 saisie survit au tic 2 s | OK S2 motif vide → 0 /api/run · envoyées=0 ko=true
OK S2 virer 200 · status=200 code=0 cmd=vx.py virer T004 --motif tests non lances (banc) --projet banc
OK S2 T004 rejete · remplacee_par=T011 | OK S2 remplaçante T011 visible | OK S2 T011 lint FAIL | OK S2 T004 ligne .rejete
OK S2 todo « Corriger le pack de T011 » | OK S2 deps T010 réécrites · deps: [T011] | OK S2 #sortie affiche la commande
OK S3 retenir → fait · code=0 out=T005 : revue -> fait (retenue, eval T009)
OK S4 Ctrl+K ouvre | OK S4 « vir » filtre · T003 · ✕ virer | T004 · intégrer | … (10) | ↓ sel="T004 · intégrer" → runs+1 integrer
OK S4 Échap ferme | OK S4 Ctrl+K dans xterm ignoré · activeElement=xterm-helper-textarea
OK S5 Ctrl+` bascule · false→true display=block/flex | OK S5 Ctrl+` dans xterm ferme · term+= (∅)
OK S5 fermé → bandeau 34 px · top=966 vh=1000 | OK S5 rechargement → ouvert conservé · ls=1 | OK S5 rechargement → fermé conservé
OK S5 #term jamais display:none · block/flex | OK S5 xterm cols > 0 tiroir fermé · cols=199
OK S6 set rejete refusé · 400 {"erreur":"statut invalide : rejete"} | OK S6 motif a\nb refusé · 400
OK S6 sans_eval ignoré · commande="vx.py retenir T001 --projet banc" | OK S6 jeton faux 403 | OK S6 projet ../x 400 | OK S6 role chef 400 | OK S6 motif 201 400
OK S6 virer a-faire → rc 1 | OK S7 390 px 0 scroll horizontal · scrollWidth=390 | OK S1 0 erreur console (fin)
```
`node .cache/banc-T016/e2e-T016-bords.mjs` →
```
B1 saisie ouverte + focus xterm + Échap → SAISIE={"tid":null,"k":null} term+=[stream ]
B1 témoin sans saisie + Échap → term+=[in {"data":"\u001b"}]
B2 palette "T009 · intégrer|T009 · ✕ virer" → placeholder="motif du renvoi — Entrée" vide→ko=true runs=0 → 200 code=0 T009 : fait -> rejete (motif : évaluateur hors sujet ✓)
B3 Échap 1 → palette fermée=true saisie=T008 · Échap 2 → saisie=null
B4 lignes T014 = ["Gamma encours","Zeta fait"] → clic abandonner ligne 2 → après T014-gamma-encours:abandonne,T014-zeta-fait:a-faire
```
`node .cache/banc-T016/e2e-390.mjs` → 38 `.tbtn` hors 390 px mais `#tasks` `overflow-x:auto` ; clic T001/abandonner atteignable → OK
fin : `kill $(cat .cache/banc-T016/pid)` ; `curl -s -o /dev/null -w '%{http_code}' 127.0.0.1:7793/` → `000`
`git status --short vault/projets/agentx-entreprise` → M journal.md, todo.md, T008/T009/T011 task.md + ?? T012-T016 : diffs = actions chef 15:35-15:39 (retenu T009/T011), antérieures au banc (16:03) ; 0 ligne `banc` de ma main
## Écarts
- ∅ lecture hors WL
- `/api/term/*` intercepté par Playwright (`route.fulfill`) : 0 requête terminal vers le vrai socket chef — la page POST `open`/`resize`/`in` toute seule au chargement
- écritures hors banc : copie `.cache/banc-T016-vault-snapshot` (supprimée, refaite dans `$B/snap-vault`) ; `/tmp/claude-1000/T016-INJECTE` (repro D2, supprimé)
## Pour la suite
- D1 : sérialiser `executer` (`threading.Lock` module dash.py:176) + allocation id sous `fcntl.flock` dans vx.py (`virer` :336, `tache` :235) ; `mkdir(exist_ok=False)` ; doctor : `x {slug} : id {T} en double`
- D2 : `shlex.quote(motif)` dans dash.py:524/:577 et vx.py:406/:523 ; amender §C5/C6/C8 (gabarit `--motif "…"`)
- D3 : dash.js:1257 → ajouter `&& document.activeElement?.className !== 'xterm-helper-textarea'` (comme :1457)
- hypothèse NV : charger la page :7777 POST `api/term/open` si chef arrêté (dash.js:1467) → toute salle-banc sur le même socket relance le vrai chef
- tiroir ouvert (640 px fixe) masque les lignes de tâches du bas : clic impossible sans défiler — choix de design, à trancher
## Retour sur le pack
- Manquait: la page POST `api/term/etat|open|resize` seule au chargement → « NE PAS POST /api/term/* » intenable sans interception ; le dire et imposer `route.fulfill`
- Manquait: `set revue|fait` accepté sans result.md (fixtures) ; glob en redirection bash non développé
- Inutile: ∅
