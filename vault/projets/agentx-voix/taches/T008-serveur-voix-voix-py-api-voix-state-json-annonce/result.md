---
tache: T008
projet: agentx-voix
statut: revue
---
## Livré
- bin/voix.py:43-53 — `_pid_dictee` : `1 < pid <= 4194304`, `except Exception`
- bin/voix.py:56-62 — `_etat_dictee` : `errors="replace"`, ∉ {on,off} → None
- bin/voix.py:65-87 — `etat()` : try global → 5 booléens False
- bin/voix.py:101 — `journal()` : `except Exception` par ligne (RecursionError)
- bin/dash.py:1133-1141 — `voix` dans son propre try → null
## Vérifié comment
- `python3 -m py_compile bin/voix.py bin/dash.py; echo rc=$?` → `rc=0`
- `robu.py` (copie `.cache/voix-T008/`, + cas `journal_profond`) sur `bin` → 14 cas × 2, 0 `EXC` ; `pid_enorme`/`pid_zero`/`pid_moins1` → `"dictee": false` ; `etat_bin` → `"dictee": true, "ecoute": false`
- même robu.py sur `voix.avant.py` → `pid_enorme etat -> EXC OverflowError` · `etat_bin etat -> EXC UnicodeDecodeError` · `journal_profond journal -> EXC RecursionError` (3e trou, levé)
- `micro_pid.py` (`voix.os.kill` remplacé par enregistreur, 0 vrai kill) pid `0 -1 1 4194305 99999999999999999999999` + `dictee.etat=off` → ×5 `ValueError "dictee n'est pas lancé"`, `etat.dictee -> False` ; `os.kill appels: []`
- banc `.cache/voix-T008/banc` (cmp voix/dash → identiques), `V=.cache/voix-T008/v1`, :7819, faux parle/dictee T002, stub notify-send :
- phrases → `'Implémenteur : tâche 19 livrée, étage orthopro.'` `'Attention : Testeur bloqué sur la tâche 4, étage agentx voix.'` `'Évaluateur : verdict virer sur la tâche 3.'` `'Scribe a terminé.'` `'RSSI : tâche 10 livrée, étage x.'`
- `.voix` → `{"mode":false,"parle":true,"en_cours":false,"dictee":true,"ecoute":false,"journal":[]}` ; keys ⊃ `immeuble jeton roles taches voix`
- mode on → `{"ok": true, "voix": {"mode": true, …}} 200` + `ls v1/claude-voix-on` OK ; off → `"mode": false … 200`, ls → `Aucun fichier`, recu ∋ `{"cmd": "stop"}`
- sans jeton → `{"erreur": "jeton invalide — recharge la page"} 403` ; `{"on":"oui"}` → `on attendu : true|false 400` ; xyz → `route inconnue : xyz 400`
- micro on → `"ecoute": true} 200`, `usr1=1 etat=on` ; 2e on → `200 usr1=1` ; stop → `200`, recu `{"cmd": "stop"}`
- dictee tué → micro → `{"erreur": "dictee n'est pas lancé"} 400`
- state.json `[has erreur, immeuble, roles, taches, voix.dictee, taches|length]` : pid énorme/0/-1/1 → `[false,true,true,true,false,10]` ×4 ; `dictee.etat` `\xff\xfe\x00on` → `[false,true,true,true,{…"dictee":true,"ecoute":false,"journal":[]}]`
- banc_panne (`voix.etat` → RuntimeError) → `[has erreur, voix, immeuble type, roles len, taches len]` = `[false,null,"null",19,10]` (immeuble null = mode démo, clé présente)
- journal 3 + 1 corrompue → `jq '.voix.journal | length'` → `3`
- sonnerie ON → `rc=0 real 0m0,037s`, recu `{"cmd": "say", "text": "Implémenteur : tâche 19 livrée."}` ; OFF → `rc=0`, `wc -l` `0` ; socket absent → `rc=0 real 0m0,037s`
- fin : `kill` dash/parle/dictee ; `ss -ltn | grep :7819` → rc=1 ; `ps -p` → rc=1
- `git diff --no-index --stat .cache/voix-T008/voix.avant.py bin/voix.py` → `57 ++++++++++++++++-----------`, `33 insertions(+), 24 deletions(-)` (ré-indentation `etat`)
- `git diff --stat -- bin/dash.py` → `21 ++++++++++++++++++++-` (avant T008 : 18, +3/-0 net T008)
## Écarts
- ∅ lecture hors WL
- `journal()` : `except (ValueError, TypeError, KeyError)` → `except Exception` — RecursionError JSON imbriqué, hors liste DoD mais même clause « jamais d'exception »
- `micro()` inchangé : garde pid ≤ 1 portée par `_pid_dictee`
- `bin/roles.py` copié (pas lu) dans `.cache/voix-T008/avant/` pour rejouer robu sur l'ancien voix
- pid ≤ 1 non testé via serveur `micro` (risque `os.kill(-1)` si régression) : prouvé en unitaire, os.kill instrumenté
- dossiers laissés : `.cache/voix-T008/{banc,banc_panne,v1,v_sans,robu,robu_avant,mp,avant}`
## Pour la suite
- T005 peut compter sur `state.voix` = objet 6 clés ou `null`
- banc démo : `immeuble` null ; état complet avec vault réel NV
## Retour sur le pack
- Manquait: `journal()` trou RecursionError non cité par T004 ; `$status` ≠ `$?` (bash -c sous fish) | Inutile: ∅
