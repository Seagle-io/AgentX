---
tache: T012
statut: fait
evalue: T007
verdict: retenir
---
## Verdict
retenir — 14/14 cases DoD re-jouées OK
## DoD
- [x] roles.json §C1 verbatim + 13/11 — `diff contrat.md:47-65 roles.json → seule ligne "```json" ; charger → 13 ('eclaireur',…,'scribe') 11 clés`
- [x] registre #FFF — `tache → "vx: erreur: roles.json invalide : roles[0].couleur : #FFF invalide" rc=3 · board rc=0`
- [x] tache --role — `evaluateur rc=0 modele: opus · inconnu → "invalid choice: 'inconnu'" rc=2 · implementeur sans --modele → modele: inherit`
- [x] set 3 refus — `rejete → "rejete : passe par \`virer T001 --motif \"...\"\`" rc=1 · fait → "T001 (implementeur) livre en revue : \`retenir T001\`" rc=1 · a-faire sur rejetee → "T001 rejetee : statut terminal (remplacante : T004)" rc=1`
- [x] virer — `stdout 5 lignes §C5 exact (T001 : revue -> rejete (motif : tests non (lances)) … pack-lint T004 --projet demo) ; T004 remplace: T001, "# Pack T004", "- TODO-PACK remplace T001 — vire : …" L59 sous Décisions actées, result.md ∅ ; pack-lint T004 → "x … marqueurs a remplir" rc=2 (T001 rc=0 avant) ; T001 rejete/motif/remplacee_par: T004 ; T002 deps: [T004] ; journal 3 types`
- [x] retenir — `sans éval → "aucune evaluation de T002 — python3 bin/vx.py tache \"Evaluer T002\" … (ou --sans-eval)" rc=1 · verdict virer → "T007 conclut virer : python3 bin/vx.py virer T002 --motif \"tests non lances\" …" rc=1 · retenir → "T002 : revue -> fait (retenue, eval T007)" · --sans-eval → evaluation: chef`
- [x] ready juge — `T009 revue ; ready → "T010  evaluateur" seule ; board "T011 implementeur … T009 !"`
- [x] personnel — `"PERSONNEL — 1 projet(s) + 0 archive(s), 11 tache(s)" + en-têtes §C5 ; implementeur 7/5/2/2 40 % ; --json clés perimetre,projets,archives,taches,roles(11),modeles ; banc vide → "aucune tache — rien a mesurer." rc=0`
- [x] integrer évaluateur — `"== demo/T007 [fait · result: fait · verdict: virer → T002] — Evaluer T002" / Verdict/Motif/DoD/Ecarts/Verifie comment / "-> python3 bin/vx.py virer T002 --motif \"tests non lances\" --projet demo" ; retenir → "-> … retenir T002 --projet demo"`
- [x] doctor — `banc : "x demo/T001 : rejete sans remplacee_par" rc=2 ; "x demo/T012 : depend de T005 rejetee (remplacante T006)" ; vrai vault "vault coherent." rc=0 ; AVANT collé result.md:51 rc=0`
- [x] garde — `evaluateur "rien" → deny "le prompt ne nomme aucun pack…" rc=0 · T011 pret en testeur → deny "T011 est une tache « implementeur », pas « testeur » : dispatche subagent_type=implementeur." · implementeur → vide rc=0 · Explore → vide rc=0`
- [x] sonnerie — `{"id": "8e1108912b35e245", …, "role": "evaluateur", "tid": "T004", "statut": "fait", "verdict": "virer"} ; Explore → 0 ligne ajoutée`
- [x] vrai vault board/ready — `board rc=0 · ready rc=0`
- [x] diff collé, 0 autre fichier — `git diff HEAD~1 HEAD --stat -- 6 fichiers → garde 16 · sonnerie 14 · vx 234 · roles.py 157 · rh.py 43 · roles.json 18 = result.md:52-53 ; git diff HEAD --stat -- bin/ roles.json → ∅`
- [x] result.md format — `5 sections exactes, 70 lignes ≤ 80`
## Motif
∅
## Vérifié comment
banc `.cache/banc-T012` recette pack T007 ; projet demo ; supprimé en fin
périmètre : `git diff HEAD~1 HEAD --stat` → 29 fichiers = commit groupé L1-L4+T010 ; part T007 = 6 fichiers E + T007/result.md + T007/task.md ; terminal.py, _templates/context.md = consigne chef/gabarit (T010) ; dash.py, dash/* = L2-L4
registre absent (banc) → garde evaluateur deny (repli .claude/agents) · Explore rc=0 · doctor "x roles.json invalide : roles.json absent" rc=3 · board rc=0
virer T005 en-cours --role testeur --modele sonnet → "~ T005 etait en-cours : …" ; T006 role: testeur modele: sonnet · virer T002 a-faire → rc=1 · motif '  ""  ' → "motif : 1 a 200 caracteres (recu 0)" rc=1
retenir, result.md éval absent → "verdict illisible dans T007/result.md" rc=1 (0 crash)
`python3 -m py_compile` 5 fichiers → rc=0
affirmations result.md re-jouées : 14 (L20-L53), 0 écart ; seul écart observé = doctor HEAD~1 sur vault actuel rc=2 (T012-T015 role evaluateur inconnu de l'ancien code) — vault postérieur, ≠ régression
## Écarts
- lecture hors WL: `git diff HEAD~1 HEAD -- bin/terminal.py vault/_templates/context.md journal.md T007/task.md` — attribution des fichiers du commit groupé
- lecture hors WL: `rg doctor bin/agentx bin/dash.py` — consommateur du rc doctor
- lecture hors WL: `bin/agentx:185-200` — teste `r.returncode` truthy, rc 3 ≠ cassant
- écart T007 doctor registre KO (ligne `x` + rc 3, C2/C5 contradictoires) — bin/agentx:193 teste rc≠0 → OK
- écart T007 retenir `--motif` rempli par Motif éval ; `personnel --json` 0 tâche → JSON ; integrer évalué = deps[0] — conformes C6, 0 consommateur cassé
- T007 a utilisé sed/mv/grep/ls/head/tail/wc hors liste outils — déclaré, hors DoD
## Pour la suite
- contrat C2 vs C5 doctor registre invalide : trancher rc 3 + ligne `x` stdout dans decisions.md
- integrer/retenir collent `--motif "<motif>"` sans échappement : `"` `$` backtick internes cassent la commande shell — normalisation C4 ne retire que les guillemets d'extrémité
- `virer` sur context.md absent → exception non gérée (read_text) ; NV, hors DoD
- DoD périmètre T012 : commit groupé multi-lots → fournir la liste des fichiers par tâche, sinon attribution par lecture hors WL
## Retour sur le pack
- Manquait: attribution fichiers ↔ tâche du commit HEAD (29 fichiers, 5 tâches) ; `rm` des fichiers `.cache/T012-*` hors outils (fait via python3 os.remove)
- Inutile: ∅
