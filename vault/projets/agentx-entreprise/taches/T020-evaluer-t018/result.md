---
tache: T020
statut: fait
evalue: T018
verdict: retenir
---
## Verdict
retenir — 10/10 cases DoD prouvées sur banc-T020
## DoD
- [x] S1 verrou — `rg LOCK_EX|with verrou|exist_ok=False bin/vx.py → :189 flock LOCK_EX · :245 cmd_tache · :337 cmd_virer (task.md relu dedans) · :257, :354 exist_ok=False`
- [x] S1 banc — `virer A ∥ virer B ×3 → T014/T013, T015/T016, T018/T017 rc 0/0 · virer A ∥ A ×3 → T007, T008, T009 : 1 rc 0 + 1 rc 1 « aucun agent a virer » · uniq -d dossiers → ∅`
- [x] S2 Lock + curl — `dash.py:177,182 _EXECUTION · POST /api/run ×2 parallèles AB ×3 → code 0/0, T029..T034 distincts · AA ×3 (T019-T021) → code 0 + code 1 « aucun agent a virer » · kill → curl 000`
- [x] S3 doctor id double — `cp T022-s1 → T022-gamma, T022-zeta ; doctor → « x banc/T022 : id en double (T022-gamma, T022-s1, T022-zeta) » rc=2 ; rm → 0 « double »`
- [x] S4 échappement — `motif a \`touch $B/INJ\` $(echo X) "q" ; 4 cmd (integrer, retenir die, todo[0], taches[9].actions[1]) = --motif 'a \`touch $B/INJ\` $(echo X) "q"' ; ×4 bash -n rc=0 · bash -c rc=0 · ls $B/INJ INJ → absent ×2 · task.md statut: rejete / motif: a \`touch $B/INJ\` $(echo X) "q`
- [x] S5 virer sans context.md — `T011 → « vx: erreur: T011 sans pack : …/context.md absent, rien a recopier » rc=2 ; md5 vault avant=après eaf599cb… ; find wc 99=99`
- [x] S6 projet par journal — `state.json projet.slug : création autre → autre · utime banc → banc · utime autre → autre · run/projet=banc → banc · journal autre absent → banc · autre clos → banc`
- [x] py_compile + doctor réel — `python3 -m py_compile bin/vx.py bin/dash.py → rc=0 · ./bin/agentx doctor → vault coherent. rc=0`
- [x] git diff --stat collé, 0 autre fichier — `git diff --stat -- bin/ → dash.py 26, vx.py 193, 124+/95- (= déclaré) · git status --short bin/ → M dash.py, M vx.py`
- [x] result.md T018 au format — `frontmatter tache/statut: revue · 5 sections exactes · 53 lignes ≤ 70`
## Motif
∅
## Vérifié comment
```
banc .cache/banc-T020 (bin/ recopié de l'arbre), projet banc, 12 tâches en-cours
S1 mixte : virer T013..T016 ∥ tache s1, s2 → 6 rc 0, T022..T027 distincts, uniq -d → ∅
écart mkdir : tache zz --dep T999 → « dependance inconnue : T999 » rc=1 ; dossiers 37 → 37
_citer_motif("it's") → 'it'"'"'s' → bash printf → it's · _citer_motif("") → "<motif>"
affirmations T018 rejouées : S1b, S2b, S3 rc=2, S4 ×4, S5 rc=2, S6 ×6, py_compile, doctor, diff --stat → 0 écart
```
## Écarts
- ∅ lecture hors WL
- écart T018 mkdir après contrôle deps : améliore, dep inconnue → 0 dossier orphelin ; 0 consommateur cassé
- écart T018 `"` final retiré : `.strip("\"'")` déjà dans HEAD (ligne `-` du diff) ; décision « motif nettoyé comme aujourd'hui » respectée ; argv reçu intact (backticks, `$B`, `$(` non interprétés)
## Pour la suite
- motif `-x` : shlex.quote laisse `-x` nu → argparse le prend pour option ; préexistant, hors DoD
- `.verrou` en vault : dossier `tache` déjà présent sans task.md → FileExistsError non géré (exist_ok=False)
- strip `"'` tronque un motif finissant par guillemet : trancher si motif byte-exact voulu
- `.cache/banc-T020/` laissé (jetable)
## Retour sur le pack
- Manquait: emplacement du jeton (`/state.json` champ `jeton`, pas `run/state.json`) ; motif d'éval via `retenir` die imprimé sur stderr
- Inutile: ∅
