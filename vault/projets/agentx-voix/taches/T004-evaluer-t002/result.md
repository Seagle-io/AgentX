---
tache: T004
projet: agentx-voix
statut: fait
evalue: T002
verdict: virer
---
## Verdict
virer — `voix.etat()` lève : state.json entier en erreur
## DoD
Banc `.cache/voix-eval-T004/banc` (cmp bin/{voix,dash,sonnerie}.py → identiques), `AGENTX_VOIX_DIR=.cache/voix-eval-T004/v`, faux parle/dictee `.cache/T002/`, stub notify-send, port 7818.
Cases du pack T002 :
- [x] phrase 5 exemples — `phrases.py banc/bin` → `'Implémenteur : tâche 19 livrée, étage orthopro.'` `'Attention : Testeur bloqué sur la tâche 4, étage agentx voix.'` `'Évaluateur : verdict virer sur la tâche 3.'` `'Scribe a terminé.'` `'RSSI : tâche 10 livrée, étage x.'`
- [x] state.json 6 clés — sans démons → `{"mode":false,"parle":false,"en_cours":false,"dictee":false,"ecoute":false,"journal":[]}` ; faux démons → `{…"parle":true,…"dictee":true,"ecoute":false,"journal":[]}`
- [x] mode on/off — on → `{"ok": true, "voix": {"mode": true, …}} 200` + `ls v/claude-voix-on` OK ; off → `"mode": false … 200`, ls → `Aucun fichier`, recu → `{"cmd": "stop"}`
- [x] erreurs — sans jeton → `403` ; `{"on":"oui"}` → `{"erreur": "on attendu : true|false"} 400` ; `xyz` → `{"erreur": "route inconnue : xyz"} 400` ; dictee pid 4999999 → `{"erreur": "dictee n'est pas lancé"} 400`
- [x] micro/stop — micro on (etat=off) → `"ecoute": true} 200`, `usr1=1 etat=on` ; 2e on → `usr1=1` ; stop → `200`, recu `{"cmd": "stop"}`
- [x] sonnerie — ON → `rc=0 real 0,037`, recu `{"cmd": "say", "text": "Implémenteur : tâche 19 livrée."}` ; OFF → `wc -l` `0` ; socket absent → `rc=0 real 0,039`
- [x] rg — dash.py → `36: 1136: 1190: 1209: 1210:` (5) ; sonnerie.py → `104:        voix.annoncer(ev)`
- [x] CLAUDE.md — `git diff --stat` → `CLAUDE.md | 4 ++++` ; puce verbatim avant `- La session chef` (diff L50-53)
- [x] serveur tué — `kill <pid>` ; `ss -ltn | grep -E ':7818|:7790'` → rc=1 ; `ps -p dash,parle,dictee` → rc=1
- [x] journal 3+1 corrompue — `jq '.voix.journal | length'` → `3`
- [x] result.md T002 — sections exactes, 41 lignes
Cases du pack T004 :
- [x] sécurité — sans jeton/jeton faux → `403` ; `Host: evil.com` / `127.0.0.1.evil.com:7818` → `{"erreur": "hote non local"} 403` ; 70 Ko → `{"erreur": "requete trop grosse"} 400` ; `"true"` / `1` / `{}` → `on attendu : true|false 400` ; `/api/voix/say {"text":…}` → `route inconnue : say 400` ; `dash.py:1177-1186` ne passe que `req["on"]` bool
- [ ] etat()/journal() jamais d'exception — manque : `robu.py` → `pid_enorme etat -> EXC OverflowError Python int too large to convert to C int` ; `etat_bin etat -> EXC UnicodeDecodeError 'utf-8' codec can't decode byte 0xff` ; `pid_zero`/`pid_moins1` → `"dictee": true` ; journal OK sur tous les cas (absent, binaire, dossier, types)
- [x] sonnerie ≤ 1,5 s + exception — serveur qui accepte sans lire → `rc=0 real 0,036` ; backlog plein → `rc=0 real 0,036` ; `annoncer` lève RuntimeError → `rc=0` ; `import voix` ImportError → `rc=0`
- [x] coût du poll — 20 × state.json → `pings=20` ; `etat()+journal(30)` médiane `0.096` ms, max `0.249` ms (< 20 ms)
- [ ] non-régression — manque : dictee.pid `99999999999999999999999` → `{"erreur":"Python int too large to convert to C int","immeuble":false,"voix":null}` ; dictee.etat `\xff\xfeon` → `{"erreur":"'utf-8' codec can't decode…","immeuble":false}` ; nominal → `immeuble roles taches` présents ; `py_compile` 3 fichiers → rc=0
- [x] verdict/motif — 2 `[ ]` ⇒ virer
- [x] result.md — ce fichier
## Motif
voix.etat leve sur dictee.pid enorme (OverflowError) et dictee.etat binaire (UnicodeDecodeError) : state.json entier en erreur, immeuble roles taches perdus ; pid 0 ou -1 lu comme dictee vivant
## Vérifié comment
- `cmp bin/X banc/bin/X` ×3 → `identiques` ; `python3 -m py_compile bin/voix.py bin/dash.py bin/sonnerie.py` → `rc=0`
- `python3 .cache/voix-eval-T004/robu.py banc/bin robu1` → 13 cas, 2 EXC (cf. DoD)
- causes : `bin/voix.py:45-50` `except (OSError, ValueError)` ∌ OverflowError, accepte pid ≤ 0 ; `bin/voix.py:53-57` `except OSError` ∌ UnicodeDecodeError ; `bin/dash.py:1136` `voix.etat()` dans le même `try` que `construire_etat` → tout l'état perdu
- danger NV (non exécuté, volontaire) : pid `-1` + `dictee.etat` présent ⇒ `micro()` → `os.kill(-1, SIGUSR1)` (`bin/voix.py:136`) = tous les processus de l'utilisateur
- `git diff --stat -- bin/voix.py bin/dash.py bin/sonnerie.py CLAUDE.md` → `CLAUDE.md 4 +` · `dash.py 18 +-` · `sonnerie.py 5 +` ; diff = routes/état/annonce déclarés seulement
## Écarts
- ∅ lecture hors WL
- `rg` absent du PATH bash → `grep -nE` même motif
- `rm` refusé par garde : bascule flag OFF via `POST /api/voix/mode {"on":false}` ; dossiers `robu1 s0 s1 s2 banc2-5` laissés dans `.cache/voix-eval-T004/`
- `bin/__pycache__` réel régénéré par `py_compile`
- fichiers M hors E T002 (`bin/vx.py`, `bin/agentx`, `vault/_templates/brief.md`) : attribution NV, non déclarés par T002
## Pour la suite
- `_pid_dictee` : `except Exception` + rejeter `pid <= 1` → None
- `_etat_dictee` : `read_text(errors="replace")` ou `except (OSError, ValueError)`
- `etat()` : enveloppe totale `try/except Exception` → 5 booléens False
- `dash.py:1136` : `voix` dans son propre `try` → `construire_etat` jamais perdu
- DoD remplaçant : rejouer `.cache/voix-eval-T004/robu.py` → 0 `EXC`, `pid_zero`/`pid_moins1` → `"dictee": false`
## Retour sur le pack
- Manquait: `rg` hors PATH bash, écrire `grep -nE` ; garde refuse `rm` → prévoir dossiers jetables nommés | Inutile: ∅
