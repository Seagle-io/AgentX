---
tache: T010
projet: agentx-voix
statut: fait
evalue: T008
verdict: virer
---
## Verdict
virer — `journal()` lève MemoryError sur lien /dev/zero
## DoD
Banc `.cache/voix-eval-T010/banc` (`cmp` voix/dash/sonnerie → identiques), `AGENTX_VOIX_DIR=.cache/voix-eval-T010/v`, faux parle/dictee `.cache/T002/`, stub notify-send, :7821.
Cases du pack T008 :
- [ ] motif levé — manque : `journal()` ≠ « jamais d'exception » : `robu2.py journal_zero_lien` (RLIMIT_AS 512 Mo) → `journal -> EXC MemoryError 200ms` ; `bin/voix.py:92-95` `read_text` non borné + `except OSError` seul. `_pid_dictee`/`_etat_dictee`/`etat()` OK (cf. robu ci-dessous)
- [x] micro() pid ≤ 1 — `robu2.py` os.kill instrumenté, pid `0 -1 1 -5 ''` → `ValueError dictee n'est pas lancé` ×5, `os.kill appels: []`
- [x] dash try séparé — `bin/dash.py:1138-1141` ; banc_panne (`etat` lève RuntimeError) → `erreur=False immeuble∈ roles=19 taches=10 voix=None`
- [x] robu.py rejoué — `python3 robu.py banc/bin robu1` → 13 cas × 2, 0 `EXC` ; `pid_zero`/`pid_moins1`/`pid_enorme` → `"dictee": false` ; `etat_bin` → `"dictee": true, "ecoute": false`
- [x] non-régression T002 — phrases ×5 identiques à T004 ; `.voix` → `{"mode":false,"parle":true,"en_cours":false,"dictee":true,"ecoute":false,"journal":[]}` ; mode on → `200` + flag présent ; off → `200`, flag absent, recu ∋ `{"cmd": "stop"}` ; sans jeton → `403` ; `{"on":"oui"}`/xyz → `400` ; micro on → `"ecoute": true} 200 usr1=1 etat=on` ; 2e on → `usr1=1` ; off → `usr1=2 etat=off` ; stop → `200`, recu `{"cmd": "stop"}` ; sonnerie ON `rc=0 0.042s` recu `{"cmd": "say", "text": "Implémenteur : tâche 19 livrée."}` · OFF `say=0` · absent `rc=0 0.043s` ; journal 3+1 corrompue → `3`
- [x] py_compile + diff — `python3 -m py_compile bin/voix.py bin/dash.py bin/sonnerie.py` → `rc=0` ; `git diff --stat -- bin/dash.py` → `21 ++++++++++++++++++++-` = collé T008
- [x] result.md T008 — 42 lignes, sections Livré/Vérifié comment/Écarts/Pour la suite/Retour sur le pack
Cases du pack T010 :
- [x] sécurité — sans jeton/jeton faux → `403` ; `Host: evil.com` / `127.0.0.1.evil.com:7821` → `hote non local 403` ; 70 Ko → `requete trop grosse 400` ; `{"on":"true"}` `{"on":1}` `{}` `{"on":null}` → `on attendu : true|false 400` ; `[true]`/`null` → `charge invalide 400` ; `/api/voix/say {"text"}` → `route inconnue : say 400` ; `grep '"say"'` → `voix.py:179` (annoncer) seul ; dash ne passe que `req["on"]` bool (`:1186-1189`)
- [ ] motif du renvoi levé, 0 exception — manque : cas neuf `claude-voix-journal.jsonl → /dev/zero` → `EXC MemoryError` ; 14 autres cas neufs OK : pid `-5`/`1`/`0`/`-1`/`4194305`/vide+etat on/lien boucle/chmod 000 → `dictee:false`, `ValueError` ; pid = mon pid → `dictee:true` ; `dictee.pid`/`dictee.etat → /dev/zero` → 0 EXC (197/205 ms, plafond RLIMIT atteint) ; journal 50 Mo → `len=30 846ms` ; non-objet → `len=1` ; `on\n\n` → `ecoute:true` ; `pid<=1: []` sur 15 cas
- [x] panne voix isolée — banc_panne → `False True NoneType 19 10 True None` ; serveur `ulimit -v 1500000` + journal → /dev/zero → `erreur=False roles=19 taches=10 voix=None 200 0.586s`
- [x] sonnerie ≤ 1,5 s — sourd accepte-sans-lire → `rc=0 0.041s` ; backlog plein → `rc=0 0.044s` ; `annoncer` lève RuntimeError → `rc=0 0.055s` ; `import voix` ImportError → `rc=0 0.036s`
- [x] coût du poll — 20 × state.json → `pings=20` ; `etat()` médiane `0.118` ms max `0.322` ; `journal(30)` `0.037` ms (< 20 ms)
- [x] non-régression — state.json pid énorme/0/-1/1/-5/vide, etat binaire → `[False, True, 19, 10, …]` ×8 ; py_compile 3 fichiers `rc=0`
- [x] verdict/motif — 2 `[ ]` ⇒ virer
- [x] result.md — ce fichier
## Motif
voix.journal leve MemoryError si claude-voix-journal.jsonl pointe vers /dev/zero : read_text non borne, except OSError seul ; sans ulimit le serveur dash lit jusqu a saturer la RAM
## Vérifié comment
- `cmp bin/{voix,dash,sonnerie}.py banc/bin/` → `identique` ×3
- `git diff -- bin/dash.py` → +import voix, try voix séparé, `_voix`, route `/api/voix/` ; ∅ hors E T008 sur `bin/dash.py` ; `bin/voix.py` non suivi (`??`)
- `python3 robu2.py banc/bin robu2 <cas>` ×15 (1 processus/cas, RLIMIT_AS 512 Mo, `voix.os.kill` = enregistreur, sig 0 seul délégué si pid > 1) → cf. DoD
- pid = mon pid + `etat=off` + `micro(True)` → `os.kill appels: [(996421, 0), (996421, 0), (996421, 10), (996421, 0)]` (SIGUSR1 enregistré, non envoyé)
- fin : `kill` dash/parle/dictee ; `ss -ltn | grep :7821` → `rc=1` ; `ps -p` → `rc=1` ; `~/.cache/claude-voix-on` jamais écrit (AGENTX_VOIX_DIR partout)
## Écarts
- lecture hors WL: `.cache/voix-eval-T004/sourd.py` — modèle faux serveur sourd, recopié dans `.cache/voix-eval-T010/sourd.py`
- `py_compile` sur `bin/` réel → `bin/__pycache__` régénéré
- `bin/voix.py` non suivi : diff avant/après NV par moi, `voix.avant.py` T008 hors WL
- dossiers laissés : `.cache/voix-eval-T010/{banc,banc_panne,banc_exc,banc_imp,v,robu1,robu2,s_*}`
- micro via serveur avec pid ≤ 1 non exécuté — danger os.kill(-1), prouvé instrumenté
## Pour la suite
- `journal()` : lecture bornée (ex. `f.seek(max(0, taille-64 Ko))` + `read(64 Ko)`) et `except Exception` sur l'ouverture/lecture
- `_pid_dictee`/`_etat_dictee` : `read(32)` au lieu de `read_text()` — /dev/zero mange la RAM jusqu'au plafond avant le `except`
- journal 50 Mo → 846 ms par poll (2 s) : borne de lecture règle aussi le coût
- pid recyclé : `micro()` enverrait SIGUSR1 à un processus étranger (action par défaut = mort) ; vérifier `/proc/<pid>/cmdline` ∋ `dictee`
- DoD remplaçant : `robu2.py` (`.cache/voix-eval-T010/`) rejoué → 0 `EXC` sur 15 cas, dont `journal_zero_lien`, sous RLIMIT_AS
## Retour sur le pack
- Manquait: `sourd.py` T004 hors WL (faux serveur sourd) ; `curl -o /dev/stdout` tronque la sortie capturée | Inutile: ∅
