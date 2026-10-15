---
tache: T001
projet: agentx-voix
statut: fait
---
## Livré
- bin/parle:11 — CACHE réglable par AGENTX_VOIX_DIR
- bin/dictee:5-6 — docstring on|off|etat
- bin/dictee:16-19 — CACHE réglable, PIDFILE/MUTE dérivés, ETAT ajouté
- bin/dictee:38-45 — client etat/on/off avant import numpy
- bin/dictee:69,76,116-118 — démon écrit/réécrit/supprime dictee.etat
- bin/parle_hook.py:6-12 — CACHE réglable, import time, JOURNAL 500
- bin/parle_hook.py:27-35,91 — journal jsonl après say, erreurs ignorées
- ~/.local/bin/parle, ~/.local/bin/dictee, ~/.claude/hooks/parle_hook.py — symlinks `ln -sfn` → bin/
- .cache/T001/{avant/,stub/notify-send,test_hook.py,test_dictee.sh} — originaux, stub, tests
## Vérifié comment
`readlink -f ~/.local/bin/parle ~/.local/bin/dictee ~/.claude/hooks/parle_hook.py` → `/home/jdrac/Documents/Workspace/AgentX/bin/parle` · `…/bin/dictee` · `…/bin/parle_hook.py`
`git ls-files --others --exclude-standard bin/` → `bin/dictee bin/parle bin/parle_hook.py` (+ `bin/produits.py bin/publier.py bin/voix.py`, autres agents) ; `test -x` → `x parle OK` `x dictee OK` `x parle_hook.py OK`
`rg -n AGENTX_VOIX_DIR` → `bin/dictee:16` `bin/parle:11` `bin/parle_hook.py:8` (1 ligne chacun)
`AGENTX_VOIX_DIR=.cache/T001/v PATH=stub:$PATH bin/parle on` → `ON` exit=0, flag présent ; `status` → `mode vocal: ON` `démon: arrêté` ; `off` → `OFF` exit=0, flag absent ; `~/.cache/claude-voix-on` réel inchangé
`python3 .cache/T001/test_hook.py` (faux socket, `python3 -I ~/.claude/hooks/parle_hook.py stop`) →
```
stop x1 → (0, '')
socket reçu: [{'cmd': 'say', 'text': 'Bonjour.'}]
journal 3 appels → lignes: 3
flag OFF stop → (0, '') lignes ajoutées: 0
après 500+1 → lignes: 500 première: {"t": "x", "texte": "1"} dernière texte: Cinq cent un.
journal lecture seule stop → (0, '') lignes ajoutées: 0
```
`.cache/T001/test_dictee.sh` (démon factice, piège SIGUSR1 compteur) →
```
$ dictee etat (sans démon)  → arrêté  exit=0
$ dictee on (sans démon)    → exit=1 stderr=dictee n'est pas lancé
$ dictee etat (pid vivant, pas de dictee.etat) → inconnu exit=0
$ dictee on (pas de dictee.etat) → exit=1 stderr=état inconnu — relance dictee signaux=0
etat=off + on → exit=0 signaux=1
etat=on + on → exit=0 signaux=0
etat=on + off → exit=0 signaux=1
etat=off + off → exit=0 signaux=0
```
`git diff --no-index --stat avant/X bin/X` → parle `1+ 1-` · dictee `19+ 4-` · parle_hook.py `15+ 2-` ; diff relu : chemins d'état, commandes client, ETAT, journal uniquement
`ast.parse` 3 fichiers → OK
démon dictee (écriture etat au démarrage / toggle / finally) : NV d'exécution — Whisper GPU + micro, diff relu
## Écarts
- tests hook dans `.cache/T001/vh`, dictee dans `.cache/T001/vd` (≠ `v`) — isoler les 3 jeux
- `kill` du démon factice créé par le test uniquement
- journal écrit à chaque `say` envoyé, même démon absent — DoD « quand il envoie say »
## Pour la suite
- démon dictee réel = ancien code : pas de `~/.cache/dictee.etat` → `dictee on|off` répond « état inconnu — relance dictee » jusqu'à relance (V2 chef)
- hook symlinké actif : journal réel `~/.cache/claude-voix-journal.jsonl` alimenté dès maintenant (`{"t","texte"}`, ≤ 500 lignes)
- `dictee on|off` pendant chargement modèle (etat écrit avant `signal.signal(SIGUSR1)`, bin/dictee:69 vs :79) → SIGUSR1 par défaut tue le démon ; risque déjà présent avec `toggle`
- etat contenu ≠ on/off (corrompu) : `on`/`off` signale (`etat != cmd`)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
