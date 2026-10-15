---
tache: T013
statut: fait
evalue: T008
verdict: retenir
---
## Verdict
retenir — 10/10 cases DoD prouvées, re-jouées
## DoD
- [x] `ROLES_META` supprimé ; boucle sur `roles.charger().values()` — `rg -n "ROLES_META" bin/dash.py → rc=1` · bin/dash.py:68-71 `_registre` → `list(_roles.charger().values())` · :364 `for r in _registre()`
- [x] `ORDRE_PIPELINE` = §C3 — bin/dash.py:65 `["a-faire", "pret", "en-cours", "revue", "bloque", "fait", "rejete"]` ; `--json` pipeline k → idem
- [x] `construire_argv` 4 actions + set ≠ rejete — `.cache/T013_argv.py → virer ok ['virer','T009','--motif','tests non lances','--projet','agentx-entreprise'] · +role/modele → [... '--role','testeur','--modele','opus'] · motif ""/"   "/201/"a\nb"/"a\tb" → ValueError: motif invalide : 1 ligne, 1 a 200 caracteres · 200 car → argv · set rejete → ValueError: statut invalide : rejete · retenir sans_eval → ['retenir','T009','--projet','agentx-entreprise'] · personnel → ['personnel'] · integrer X1 → ValueError`
- [x] `_actions_tache` table §C8, ordre exact — `.cache/T013_actions.py → a-faire [pack,lint,pret,abandonner] · pret [dispatch,lint,abandonner] · en-cours [integrer,livrer,virer] · bloque [integrer,reprendre,virer,abandonner] · revue [integrer,evaluer,virer] · fait [integrer,virer] · rejete [integrer] · abandonne [reprendre] · lint FAIL → sans pret · sans result → en-cours [virer] · revue+retenir → [integrer,retenir,virer] · revue+virer → exe.motif 'tests non lances'` ; 10 libellés = §C8
- [x] `_todo` 7 règles ; juges() ; rejete exclu — `.cache/T013_todo.py → 1 Virer T001 · 2 Faire évaluer T002/T009 · 2 Retenir T005 · 2 Corriger le pack de T008 (remplace T003) | vire : trop lent · 2 Passer T004 en revue · 2 Intégrer T007 · 4 Revoir le pack type de implementeur | 2/4` ; T003 rejete/T014 abandonne → ∅ Virer ; T011 dep d'evaluateur → ∅ Faire vérifier ; fait+rejete+abandonne → Capitaliser ; taux None → ∅ crash
- [x] `state.json` clés §C7 + `_objet` — `python3 bin/dash.py --json → registre_erreur '' · statuts 8 (rejete) · roles[0] 17 clés §C7 · taches manque [] · personnel [archives,modeles,perimetre,projets,roles,taches]` ; `.cache/T013_etat.py → T001 eval=T003 ev=retenir motif='' · T004 eval=T005 ev=virer motif='motif quatre' · T002 evalue=T001 verdict=VIRER · objet ('pack','pack') ('diff','livrable') ('notes','à capitaliser') ('tests','tests') ('resultat','compte rendu') · registre KO → 'roles.json absent' [] · demo 0/0 0.0 'en attente' 'aucune tâche'`
- [x] ast rc 0 — `python3 -c "import ast;ast.parse(open('bin/dash.py').read())" → rc=0`
- [x] runtime — `→ [19 clés …] 13 [{'k': 'integrer', … 'projet': 'seagle-site'}, …] 260`
- [x] `git diff --stat` ; 0 autre fichier — `git diff HEAD~1 HEAD --shortstat -- bin/dash.py → 1 file changed, 232 insertions(+), 70 deletions(-)` = déclaré ; `git diff --stat -- bin/dash.py → ∅` (commité)
- [x] `result.md` selon Format — 38 lignes ≤ 60 ; 5 sections exactes ; Pour la suite 4 lignes ≤ 5
## Motif
∅
## Vérifié comment
- `python3 .cache/T013_argv.py` → 23 cas, sorties ci-dessus = Vérifié comment T008 L20
- `python3 .cache/T013_actions.py` → 8 statuts = T008 L21
- `python3 .cache/T013_todo.py` → = T008 L22 (+ cas rejete/abandonne/None)
- `python3 .cache/T013_etat.py` → registre absent `'roles.json absent' [] 7 integrer` = T008 L23
- runtime : personnel.taches 260 ≠ 255 déclaré — 5 tâches T012-T016 créées depuis, non bloquant
- `git diff HEAD~1 HEAD --stat` → 29 fichiers, commit multi-lots ; lot L2 = bin/dash.py seul (232/70 = déclaré) ; bin/terminal.py +5 = consigne chef, ∉ T008
## Écarts
- lecture hors WL: `rg -n "\.actions" dash/dash.js` — écart démo sans actions : consommateur cassé ?
- lecture hors WL: `git show HEAD -- bin/terminal.py` — attribuer fichier hors E du commit
- écart T008 §C7 `taches[].result` : clé additive, source « si result.md » §C8 → OK
- écart T008 §C8 cmd virer `--motif "<motif>"` : cmd non spécifiée §C8, exe.motif "" + saisie → OK
- écart T008 §C7 démo sans `actions` : dash.js:599,1166 `(t.actions || [])` ; :1122,1133 sur clic seul → 0 casse
## Pour la suite
- §C8 : spécifier `cmd` virer sans motif (placeholder `<motif>`) et source de « si result.md » (`taches[].result`)
- §C7 : dire si `etat_demo.taches[]` porte `actions` ; aujourd'hui ∅, front tolère
- DoD périmètre : commit multi-lots → fournir `git diff A B --stat -- <E>` ou SHA par lot
- `.cache/T013_todo/`, `.cache/T013_etat/` : faux projets de test, supprimables
## Retour sur le pack
- Manquait: SHA/attribution par lot (commit HEAD = 29 fichiers, 6 lots) ; `bin/roles.py` en L (juges(), livre_en réels) | Inutile: ∅
