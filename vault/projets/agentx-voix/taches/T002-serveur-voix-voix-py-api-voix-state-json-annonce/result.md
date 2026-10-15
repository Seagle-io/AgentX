---
tache: T002
projet: agentx-voix
statut: fait
---
## Livré
- bin/voix.py:1-173 — nouveau : etat/journal/mode/taire/micro/phrase/annoncer, stdlib + roles
- bin/dash.py:36 — `import voix`
- bin/dash.py:1136 — state.json `voix` = etat() + journal(30)
- bin/dash.py:1177-1186 — `_voix(action, req)` : stop/mode/micro, validation `on`
- bin/dash.py:1190,1209-1211 — route `/api/voix/*` sous garde existante
- bin/sonnerie.py:101-105 — `voix.annoncer(ev)` après écriture, except Exception
- CLAUDE.md:50-53 — puce Voix verbatim avant « La session chef »
## Vérifié comment
banc `.cache/banc-T002`, `V=$B/v`, `AGENTX_VOIX_DIR=$V`, stub notify-send en tête de PATH, port 7790
- `python3 .cache/T002/phrases.py bin` → `'Implémenteur : tâche 19 livrée, étage orthopro.'` · `'Attention : Testeur bloqué sur la tâche 4, étage agentx voix.'` · `'Évaluateur : verdict virer sur la tâche 3.'` · `'Scribe a terminé.'` · `'RSSI : tâche 10 livrée, étage x.'`
- sans démons `jq -c .voix` → `{"mode":false,"parle":false,"en_cours":false,"dictee":false,"ecoute":false,"journal":[]}`
- faux parle+dictee → `{"mode":false,"parle":true,"en_cours":false,"dictee":true,"ecoute":false,"journal":[]}`
- micro sans dictee → `{"erreur": "dictee n'est pas lancé"} 400`
- mode sans jeton → `{"erreur": "jeton invalide — recharge la page"} 403`
- `{"on":"oui"}` → `{"erreur": "on attendu : true|false"} 400` · `/api/voix/xyz` → `{"erreur": "route inconnue : xyz"} 400`
- mode on → `{"ok": true, "voix": {"mode": true, …}} 200` + `ls $V/claude-voix-on` OK ; mode off → `"mode": false … 200`, ls → `Aucun fichier`
- micro on (etat=off) → `"ecoute": true} 200`, `usr1=1 etat=on` ; 2e micro on → `usr1=1`
- stop → 200 ; `rg -v ping $V/recu.jsonl` → `{"cmd": "stop"}` ×2 (mode off + stop)
- journal 3 valides + 1 corrompue → `jq '.voix.journal | length'` → `3` ; `keys` → `["dictee","ecoute","en_cours","journal","mode","parle"]`
- sonnerie flag ON → exit 0, recu `{"cmd": "say", "text": "Implémenteur : tâche 19 livrée."}` ; OFF → `wc -l` `0` ; socket absent → exit 0, `real 0m0,037s`
- `rg -n "import voix|voix\.etat\(\)|/api/voix/" bin/dash.py` → 4 lignes (36,1136,1190,1209/1210) ; `rg -n "voix.annoncer" bin/sonnerie.py` → `104:`
- `git diff --stat -- CLAUDE.md` → `1 file changed, 4 insertions(+)`
- `kill <pid dash/dictee/parle>` ; `ss -ltn | rg 7790` → ∅ (rg=1) ; `py_compile` 3 fichiers → OK ; `cmp bin/* banc/bin/*` → identiques
## Écarts
- lecture hors WL: roles.json (1 grep `"nom"`) — vérifier noms ≤ 4 car. (RSSI)
- phrase hors exemples, extrapolé : bloqué sans tid → `Attention : X bloqué{étage}.` ; verdict sans tid → `X : verdict v{étage}.` ; sans tid → `X a terminé{étage}.`
- `curl :7790` → code 000 sur cette machine : URL `http://127.0.0.1:7790` utilisée
## Pour la suite
- salle 7777 NON relancée : `bin/dash.py` modifié ⇒ relance humaine requise pour `voix` dans state.json
- state.json fait 1 `{"cmd":"ping"}` sur parle.sock par poll (2 s/onglet) : T001 doit ignorer ping silencieusement
- T005 front : `state.voix` 6 clés ; POST `/api/voix/{mode,stop,micro}` + `X-AgentX-Jeton` ; réponse `{"ok":true,"voix":{5 clés}}` (sans journal)
- micro : 400 `dictee n'est pas lancé` | `état inconnu — relance dictee` à afficher tel quel
- banc `.cache/banc-T002` + `.cache/T002` (faux_parle/faux_dictee/stub) réutilisables par vérificateur
## Retour sur le pack
- Manquait: phrase() pour bloqué/verdict sans tid · `curl :port` KO ici, écrire `http://127.0.0.1:port` | Inutile: ∅
