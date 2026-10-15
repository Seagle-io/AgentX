---
tache: T013
projet: agentx-voix
statut: fait
evalue: T011
verdict: retenir
---
## Verdict
retenir — 7/7 cases T011 OK, 0 EXC sur 58 cas
## DoD
Banc `.cache/voix-eval-T013/banc` (`cmp` voix/dash/sonnerie → `identique` ×3), `AGENTX_VOIX_DIR=.cache/voix-eval-T013/v`, faux parle/dictee `.cache/T002/`, stub notify-send, :7823.
Cases du pack T011 :
- [x] motif levé journal — `bin/voix.py:44-55` `_lire` : `os.stat` → non régulier → OSError ; `seek(size-n)` + `readline(n)` ; `:111` 64 Ko, `errors="replace"`, `:112 except Exception` → `[]` ; `robu2 journal_zero_lien` → `len=0 [] 0ms` ; `n_tout_zero`/`n_journal_urandom`/`n_fifo` → `len=0 [] 0.0ms` ; serveur sans ulimit, journal → /dev/zero → `0.008 s journal [] VmRSS 34148 kB`
- [x] `_pid_dictee`/`_etat_dictee` read(32) régulier seul — `:63` `:77` `_lire(…, 32)` ; `grep -n "read_text\|\.read()" bin/voix.py` → ∅ `rc=1`
- [x] pid recyclé — `:66` cmdline ∋ `dictee` avant `:68 os.kill` ; `n_pid_recycle_sleep(_on)` (pid `sleep 300` à moi) → `etat dictee:false`, `micro_on/off → ValueError dictee n'est pas lancé`, `os.kill appels: []`
- [x] robu2 RLIMIT_AS 512 Mo + robu.py + 50 Mo — `robu2.py` ×15 → `cas: 15 EXC: 0` ; `robu.py` → `EXC: 0 lignes: 26` ; journal 56623104 o ×20 → `mediane 0.702 ms max 0.862 ms len=30`
- [x] non-régression T002 + panne — `phrase()` hors diff ; `phrases.py` → 5 chaînes (`'Implémenteur : tâche 19 livrée, étage orthopro.'`…) ; `cles voix [dictee ecoute en_cours journal mode parle] 6` ; mode on `200 flag True` · off `200 flag False recu ∋ {'cmd': 'stop'}` ; sans jeton `403` ; `{"on":"true"}` `400` ; micro on `200 usr1 1 etat on` · bis `usr1 1` · off `usr1 2 etat off` ; stop `200` ; sonnerie ON `(0, 0.056)` recu `{"cmd": "say", "text": "Implémenteur : tâche 19 livrée."}` · OFF `(0, 0.039)` `∅` · absent `(0, 0.041)` ; journal 3+1 corrompue → `len 3` ; panne → `voix None | immeuble True roles 19 taches 10 erreur None`
- [x] py_compile + diff — `python3 -m py_compile bin/voix.py bin/dash.py bin/sonnerie.py` → `rc=0` ; `md5sum bin/dash.py` → `07dd30791ef1…` = déclaré ; `git diff --stat -- bin/dash.py` → `21 ++++++++++++++++++++-` = T010 avant T011 ; `git diff --no-index --stat .cache/voix-T011/voix.avant.py bin/voix.py` → `1 file changed, 23 insertions(+), 5 deletions(-)` = déclaré
- [x] result.md T011 — `wc -l` → `48` ; `## Livré/Vérifié comment/Écarts/Pour la suite/Retour sur le pack`
Cases du pack T013 :
- [x] sécurité — sans jeton/jeton faux → `403 jeton invalide` ; `Host: evil.com` / `127.0.0.1.evil.com:7823` → `403 hote non local` ; 70 Ko → `400 requete trop grosse` ; Content-Length 10 Mo menteur → `400` ; `{"on":"true"}` `{"on":1}` `{}` `{"on":null}` `{"on":0}` → `400 on attendu : true|false` (micro et mode) ; `[true]` → `400 charge invalide` ; `/api/voix/say {"text":"pirate"}` → `400 route inconnue : say` ; `textes say recus [] False` ; `grep '"say"'` → `bin/voix.py:197` (annoncer) seul ; dash `:1212` ne passe que `req["on"]` bool
- [x] motif du renvoi levé — `robu.py` + `robu2.py` rejoués (cf. ci-dessus) ; 17 cas neufs `robu13.py` (RLIMIT_AS 512 Mo, os.kill enregistreur) → `cas: 17 EXC: 0` : pid `  -42 \n` / `{mon pid}\n` / `1\n` / `\n\n` / lien `/proc/self/stat` → `dictee:false` + `ValueError` ; 3 fichiers → /dev/zero, /dev/urandom, fifo ×3 → 0 EXC, 0 blocage ; journal 50 Mo 1 ligne `0.034 ms len=0` ; sparse 8 Go `0.040 ms` ; non-objet + `[`×100000 → `len=1` ; `on\n\n` + faux démon → `"dictee": true, "ecoute": true` ; `pid<=1: []` ×17
- [x] motif du 2e renvoi levé — robu2 RLIMIT_AS → `EXC: 0` ; 50 Mo → `0.702 ms` < 20 ms ; pid `sleep` → `os.kill appels: []` ; faux démon `python3 -c … dictee` → `dictee: true`, `signaux!=0: [(1026173, 10)]` (enregistré, non envoyé) ; `faux_dictee.py` T002 → `dictee: true` ; via serveur micro → `usr1 1 etat on`
- [x] panne voix isolée — banc_panne (`etat` lève RuntimeError) → `voix None | immeuble True roles 19 taches 10 erreur None nb cles 22`
- [x] sonnerie ≤ 1,5 s — sourd accepte-sans-lire → `(0, 0.04, '')` ; backlog plein → `(0, 0.038, '')` ; `annoncer` lève → `(0, 0.039, '')` + `1 ev` écrit ; `import voix` ImportError → `(0, 0.035, '')` + `1 ev` écrit
- [x] coût du poll — `state.json` ×20 → `pings recus 20` ; `state.json mediane 1.0 ms max 8.5 ms` ; `voix.etat() x20 mediane 0.109 ms max 0.201 ms` ; `journal(30) mediane 0.029 ms` (< 20 ms)
- [x] non-régression — `"immeuble" in d, "roles" in d, "taches" in d` → `True True True 19 10 None` ; py_compile 3 fichiers `rc=0`
- [x] verdict/motif — 0 `[ ]` ⇒ retenir, Motif `∅`
- [x] result.md — ce fichier
## Motif
∅
## Vérifié comment
- `git diff --no-index .cache/voix-T011/voix.avant.py bin/voix.py` → seuls `_lire`, `_pid_dictee`, `_etat_dictee`, `journal`, `import stat` ; `bin/voix.py` non suivi (`??`)
- `git status --short bin/` → `M dash.py`, `M sonnerie.py` (T002/T008), `?? voix.py` ; ∅ fichier touché hors E T011 par T011 (md5 dash = déclaré)
- logs : `.cache/voix-eval-T013/{robu1,robu2,robu13,api13,sonn13}.log`
- fin : `kill` dash/parle/dictee → `ps -p` `rc=1` ; `ss -ltn | grep :7823` → `rc=1` ; `ps … sleep 300|faux_*` → `rc=1` ; `~/.cache/claude-voix-on` mtime `Oct 15 19:18` (jamais touché)
## Écarts
- ∅ lecture hors WL
- `.cache/voix-eval-T010/sourd.py` copié non lu, non utilisé ; faux sourd réécrit dans `sonn13.py`
- `py_compile` sur `bin/` réel → `bin/__pycache__` régénéré
- outils hors liste : `ln`, `mv`, `rm` (symlink dans `v/`), `nohup`, `timeout`, `git diff/status`, `md5sum`, `ps` — lecture/banc seulement
- coordonnées pack périmées : dash `:1136` → `:1163`, `:1177-1211` → `:1204-1237`
## Pour la suite
- règle cmdline laxiste : `b"dictee" in cmdline` reconnaît tout processus citant `dictee` en argument (`vim bin/dictee`, `grep dictee`) → SIGUSR1 = mort ; comparer basename argv[0]/argv[1]
- `_lire` : dernière ligne > 64 Ko → journal entier `[]` (accepté, borné)
- règle cmdline sur le vrai `bin/dictee` : NV (hors périmètre, T001)
- dossiers laissés : `.cache/voix-eval-T013/{banc,banc_panne,banc_exc,banc_imp,v,robu1,robu2,robu13,s13}` (robu2/journal_50mo = 54 Mo)
## Retour sur le pack
- Manquait: `ln`/`mv`/`git diff` hors outils autorisés ; coordonnées `bin/dash.py` périmées ; faux sourd (`sourd.py` T010) hors WL | Inutile: ∅
