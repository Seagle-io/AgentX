---
tache: T018
projet: agentx-voix
statut: fait
evalue: T016
verdict: retenir
---
## Verdict
retenir — repli CPU complet, 0 régression
## DoD
DoD T016 (recopiée) :
- [x] détection `get_cuda_device_count()` try/except Exception → cpu/int8 — `bin/dictee:81-84` ; `test_eval.py -v → test_cuda_count_leve ... ok` ; cas T018 `OSError` → `test_count_leve_oserror ... ok` (appel unique `cpu`/`int8`)
- [x] chargement cuda lève → stderr + cpu/int8 ; `--device cuda` → rc 1 sans repli — `bin/dictee:85-91` ; `stderr: dictee : GPU indisponible, repli CPU (Library libcublas.so.12 …)` ; `exit: dictee : GPU indisponible (…). Essaie --device cpu` ; `python3 -c 'sys.exit("x")' → rc=1`
- [x] tests 4 + 5 + 1 neuf, whisper-venv, sortie collée — `Ran 4 tests in 0.012s OK` · `Ran 5 tests in 0.014s OK` · `Ran 2 tests in 0.005s OK` ; 0 modèle réel (WhisperModel mocké), 0 micro
- [x] `docs/INSTALL-voix.md:~85` corrigé — `git diff --no-index` → `-Les trois scripts …` `+parle et dictee … ; parle_hook.py est en Python standard, sans venv.` ; `bin/parle_hook.py:6 import json, os, re, socket, sys, time` (stdlib)
- [x] 0 régression Julien — `~/.local/bin/dictee etat → inconnu rc=0` avant == après ; `grep -nE "/home/[a-z]+" bin/dictee → rc=1` ; `ast.parse bin/{parle,dictee,parle_hook.py} → ast OK ×3`
- [x] diff stat collé — `git diff --no-index --stat .cache/voix-T016/avant/dictee bin/dictee → dictee | 13 +++++++++++--` `1 file changed, 11 insertions(+), 2 deletions(-)` (== déclaré)
- [x] result.md T016 au format — `wc -l → 33` ; sections `Livré:6 Vérifié:13 Écarts:25 Pour la suite:28 Retour:32`
DoD T018 :
- [x] cases T016 recopiées, banc `AGENTX_VOIX_DIR=.cache/voix-eval-T018/v` + `PATH=.cache/T002/stub:$PATH` — ci-dessus ; tests copiés dans `.cache/voix-eval-T018/`, tempdirs sous `v/` (vide après)
- [x] simulation Sylvain — `env HOME=…/voix-eval-T018/home bin/parle status → parle : module piper introuvable (python : …/home/.local/share/parle-venv/bin/python). rc=1` · `bin/dictee etat → dictee : module faster_whisper introuvable (…) rc=1`, 0 traceback ; `AGENTX_PARLE_PY=…/parle-venv/bin/python bin/parle status → mode vocal: OFF / démon: arrêté rc=0` ; `AGENTX_DICTEE_PY=…/whisper-venv/bin/python bin/dictee etat → arrêté rc=0` ; `grep -rnE "/home/[a-z]+|jdrac" bin/parle bin/dictee bin/parle_hook.py docs/INSTALL-voix.md → ∅ rc=1` ; `head -1 ×3 → #!/usr/bin/env python3`
- [x] repli CPU, 3 fichiers rejoués + cas T018 — `test_t018.py -v → test_count_leve_oserror ok · test_cuda_leve_puis_cpu_reussit ok · test_cuda_explicite_rc1_sans_repli ok · test_cuda_explicite_count_zero_cuda_leve ok` `Ran 4 tests in 0.013s OK` ; `pw-record` intercepté (Popen mocké) ; témoin `DICTEE=.cache/voix-T016/avant/dictee → FAILED (errors=4)`
- [x] 0 régression Julien — `parle status → mode vocal: ON / démon: lancé rc=0` · `dictee etat → inconnu rc=0` avant == après ; `readlink -f ~/.local/bin/{parle,dictee} → …/AgentX/bin/{parle,dictee}` ; `Exec=/home/jdrac/.local/bin/{parle,dictee}` ; `stat -c %Y claude-voix-on parle.sock → 1792084733 1792084606` avant == après
- [x] guide étapes 1,2,5,9 — blocs ```bash extraits → `.cache/voix-eval-T018/etape{1,2,5,9}.sh` (1/2/1/1 blocs) ; `bash -n → rc=0 ×4` ; GPU facultatif `:3,11,14,54,58` ; `wc -l → 176`
- [x] Motif — `∅`
- [x] result.md au format — ce fichier
## Motif
∅
## Vérifié comment
- `env DICTEE=$PWD/bin/dictee AGENTX_VOIX_DIR=.cache/voix-eval-T018/v PATH=.cache/T002/stub:$PATH ~/.local/share/whisper-venv/bin/python -W ignore .cache/voix-eval-T018/test_dictee_device.py -v → Ran 4 tests in 0.012s OK`
- idem `test_eval.py -v → … test_cuda_count_leve (__main__.EvalT015.test_cuda_count_leve) ... ok` `Ran 5 tests in 0.014s OK`
- idem `test_repli.py -v → test_auto_cuda_leve_repli_cpu_int8 ... ok` `test_cuda_explicite_pas_de_repli ... ok` `Ran 2 tests in 0.005s OK`
- idem `test_t018.py -v → Ran 4 tests in 0.013s OK` ; `DICTEE=…/voix-T016/avant/dictee → FAILED (errors=4)`
- `bash -n .cache/voix-eval-T018/etape{1,2,5,9}.sh → rc=0 rc=0 rc=0 rc=0`
- `stat -c %Y ~/.cache/claude-voix-on ~/.cache/parle.sock → 1792084733 1792084606` (début == fin)
- `git diff --no-index .cache/voix-T016/avant/INSTALL-voix.md docs/INSTALL-voix.md → @@ -82,8 +82,9 @@` seul hunk
## Écarts
- lecture hors WL: `.cache/voix-eval-T015/test_eval.py` — rejeu exigé DoD n°3, absent WL
- lecture hors WL: `~/.config/autostart/{parle,dictee}.desktop` (grep Exec) + `~/.cache/{claude-voix-on,parle.sock}` (stat) — exigés DoD n°4
- lecture hors WL: `ls .cache/T017` + `find -newermt` — attribuer mtime `bin/parle_hook.py`
- `bin/parle_hook.py` mtime `00:41:33` > copie avant T016 `00:40:47` — contemporain de `.cache/voix-T017/test_hook_T001.py`, T017 ; T016 ne le déclare pas ; non-imputé
- `bin/dictee`, `docs/` non suivis git → `git diff` vide ; diff fait vs `.cache/voix-T016/avant/`
## Pour la suite
- `bin/dictee:87` capte `RuntimeError` seul — `OSError` au chargement cuda → traceback, pas de repli
- repli au chargement seul : cuBLAS paresseux → échec possible à `transcribe` (`:108`), non couvert
- `bin/dictee:78` pidfile écrit avant chargement → `--device cuda` rc 1 laisse pid mort
- repli signalé stderr seul, 0 `notify` — invisible en autostart
## Retour sur le pack
- Manquait: `.cache/voix-eval-T015/test_eval.py` absent WL alors que DoD n°3 l'exige ; `~/.config/autostart/*.desktop` et `~/.cache/*` absents WL (DoD n°4) ; `cp` absent outils (copie via python3) ; arbre partagé avec T017 sur `bin/parle_hook.py` non signalé | Inutile: `bin/parle_hook.py` en L — `grep` suffit
