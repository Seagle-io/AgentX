---
tache: T016
projet: agentx-voix
statut: revue
---
## Livré
- `bin/dictee:81-84` — `cuda_dispo()` : count protégé `except Exception` → cpu
- `bin/dictee:85-91` — `WhisperModel` cuda lève `RuntimeError` → stderr + cpu/int8
- `bin/dictee:89` — `--device cuda` explicite : `sys.exit(message)` rc 1, 0 repli
- `docs/INSTALL-voix.md:85-87` — « trois scripts » → `parle`/`dictee` venv, hook stdlib
- `.cache/voix-T016/test_repli.py` — 2 cas : repli auto, cuda explicite sans repli
- `.cache/voix-T016/avant/{dictee,INSTALL-voix.md}` — copies avant
## Vérifié comment
- `PATH=.cache/T002/stub:$PATH AGENTX_VOIX_DIR=.cache/voix-T016/v`, python `~/.local/share/whisper-venv/bin/python -W ignore`, 0 modèle réel, 0 micro
- `test_dictee_device.py -v` → `Ran 4 tests in 0.010s OK`
- `test_eval.py -v` → `test_cuda_count_leve ... ok` · `Ran 5 tests in 0.012s OK`
- `test_repli.py -v` → `test_auto_cuda_leve_repli_cpu_int8 ... ok` · `test_cuda_explicite_pas_de_repli ... ok` · `Ran 2 tests in 0.007s OK`
- témoin `DICTEE=.cache/voix-T016/avant/dictee` → `test_eval FAILED (errors=1)` · `test_repli FAILED (errors=2)`
- `diff` copies `.cache/voix-T016/test_{dictee_device,eval}.py` vs originaux → `copies identiques`
- `grep -nE "/home/[a-z]+" bin/dictee` → ∅ `rc=1`
- `python3 ast.parse bin/dictee` → `ast OK`
- `git diff --no-index --stat .cache/voix-T016/avant/dictee bin/dictee` → `dictee | 13 +++++++++++--` `1 file changed, 11 insertions(+), 2 deletions(-)`
- `git diff --no-index --stat … INSTALL-voix.md` → `INSTALL-voix.md | 5 +++--` ; `grep -c "trois scripts"` → `0` ; `wc -l` → `176`
- `~/.local/bin/dictee etat` avant → `inconnu rc=0` · après (`env -u AGENTX_VOIX_DIR`) → `inconnu rc=0`
## Écarts
- tests T012/T015 lancés sur copies dans `.cache/voix-T016/` — tempdirs sous `voix-T016/v`, originaux intacts
- repli capte `RuntimeError` seul ≠ `Exception` — garde `Arret` des tests T012 (sinon cas cuda→cpu)
## Pour la suite
- repli au chargement seul : libs cuBLAS chargées paresseusement → échec possible à `transcribe`, non couvert
- `bin/dictee:78` pidfile écrit avant chargement modèle → pid mort si échec (préexistant)
- repli CPU signalé sur stderr seul, 0 `notify` — service autostart ne le montre pas
## Retour sur le pack
- Manquait: env `AGENTX_VOIX_DIR` du banc fausse `~/.local/bin/dictee etat` (→ `arrêté`) ; préciser lancer sans | Inutile: ∅
