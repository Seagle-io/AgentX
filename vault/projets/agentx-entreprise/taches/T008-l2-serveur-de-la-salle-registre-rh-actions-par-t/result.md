---
tache: T008
statut: fait
---
## Livré
- bin/dash.py:31-32 — import rh ; roles as _roles (local `roles` masquait)
- bin/dash.py:65-80 — ROLES_META supprimé ; ORDRE_PIPELINE §C3 ; _registre, _carte
- bin/dash.py:108-171 — _projet_connu ; argv virer/retenir/personnel/integrer ; set ≠ rejete
- bin/dash.py:301-420 — taches[] champs §C7 + actions ; roles[] registre ; registre_erreur/statuts/personnel
- bin/dash.py:422-447 — _personnel (exception → {}) ; _objet → role(de).objet/livrable
- bin/dash.py:450-485 — _flux livre = dep_satisfaite
- bin/dash.py:493-539 — _actions_tache table §C8
- bin/dash.py:542-652 — _todo 7 règles, juges(), rejete exclu
- bin/dash.py:655-671 — _analyse_result : verdict frontmatter, decision, motif
- bin/dash.py:763-790 — etat_demo sur registre, 0/0 hors démo, pipeline rejete
- bin/dash.py:953 — do_GET : statuts déplacé dans construire_etat/etat_demo
## Vérifié comment
- `python3 -c "import ast;ast.parse(open('bin/dash.py').read())"` → rc=0
- `rg -n "ROLES_META" bin/dash.py` → ∅ (rc=1)
- construire_argv : virer motif "  tests non lances " → `['virer', 'T009', '--motif', 'tests non lances', '--projet', 'agentx-entreprise']` · role/modele → `[... '--role', 'testeur', '--modele', 'opus']` · motif "" / 201 car. / "a\nb" → `ValueError: motif invalide : 1 ligne, 1 a 200 caracteres` · role chef → `ValueError: role invalide : chef` · modele gpt → `ValueError: modele invalide : gpt` · set rejete → `ValueError: statut invalide : rejete` · retenir sans_eval=True → `['retenir', 'T009', '--projet', 'agentx-entreprise']` · personnel → `['personnel']` · integrer sans tid → `['integrer', '--projet', 'agentx-entreprise']` · integrer X1 → `ValueError: identifiant de tache invalide : X1`
- _actions_tache (lint PASS, result, eval "") → `a-faire ['pack','lint','pret','abandonner']` · `pret ['dispatch','lint','abandonner']` · `en-cours ['integrer','livrer','virer']` · `bloque ['integrer','reprendre','virer','abandonner']` · `revue ['integrer','evaluer','virer']` · `fait ['integrer','virer']` · `rejete ['integrer']` · `abandonne ['reprendre']` · revue+eval retenir → `['integrer','retenir','virer']` · revue+eval virer → `['integrer','virer']`, exe.motif `tests non lances`
- _todo synthétique (scratchpad) → `1 Virer T001` · `2 Faire évaluer T002` · `2 Retenir T005` · `2 Corriger le pack de T008 (remplace T009) | vire : trop lent` · `2 Passer T004 en revue` · `2 Intégrer T007` (eclaireur) · `4 Revoir le pack type de implementeur | 2/4` ; T010 dep d'un relecteur → pas de « Faire vérifier »
- registre absent (charger → /nonexistent) → `'roles.json absent' [] 28 integrer`
- DoD runtime → `['demo', 'evenements', 'flux', 'heure', 'horodate', 'journal', 'personnel', 'pilotable', 'pipeline', 'projet', 'registre_erreur', 'roles', 'serie', 'seuils', 'statuts', 'supervision', 'taches', 'ticker', 'todo'] 13 [{'k': 'integrer', 'libelle': 'intégrer', 'exe': {'action': 'integrer', 'tid': 'T001', 'projet': 'seagle-site'}, 'cmd': 'python3 bin/vx.py integrer T001 --projet seagle-site', 'saisie': ''}] 255`
- `git diff --stat -- bin/dash.py` → `bin/dash.py | 302 +++++---- 1 file changed, 232 insertions(+), 70 deletions(-)` ; autres M de bin/ = L1, pas moi
## Écarts
- lecture hors WL: bin/vx.py (rg `champ`, `lire_frontmatter`, parser integrer) — sémantique champ + `tid nargs="*"`
- écart au contrat: §C7 — `taches[].result: bool` ajouté ; « si result.md » de §C8 sans champ source
- écart au contrat: §C8 — cmd virer sans motif = `--motif "<motif>"` (repris de §C5 retenir)
- écart au contrat: §C7 — demo : `registre_erreur`, `statuts`, `personnel` aussi ; `taches[]` démo sans `actions`
## Pour la suite
- roles[] : `{"cle":"implementeur","nom":"IMPLÉMENTEUR","sous":"code en périmètre fermé","label":"diff","couleur":"#ff8a3d","modele":"inherit","affectable":true,"livre_en":"revue","juge":false,"objet":"diff","valeur":"18/18","jauge":1.0,"etat":"terminé","actif":false,"actifs":0,"en_cours":[],"note":"T028 statut en-cours -> fait"}`
- taches[] : `{"id":"T008","titre":"…","role":"implementeur","statut":"fait","lint":"PASS","tokens":2155,"fichiers":10,"bloquee":false,"verdict":"","vierge":false,"modele":"inherit","livre_en":"revue","remplace":"","remplacee_par":"","motif":"","evalue":"","eval":"","eval_verdict":"","eval_motif":"","result":true,"actions":[{"k":"integrer",…},{"k":"virer","libelle":"✕ virer","exe":{"action":"virer","tid":"T008","projet":"seagle-site","motif":""},"cmd":"python3 bin/vx.py virer T008 --motif \"<motif>\" --projet seagle-site","saisie":"motif"}]}`
- L3 : taches[] démo sans `actions` → front : `t.actions || []`
- salle à relancer (dash.py chargé au démarrage) ; tâches `fait` legacy de rôle livre_en=revue exposent `virer`
## Retour sur le pack
- Manquait: source de « si result.md » pour _actions_tache(l) ; sémantique `champ()` (vx) | Inutile: ∅
