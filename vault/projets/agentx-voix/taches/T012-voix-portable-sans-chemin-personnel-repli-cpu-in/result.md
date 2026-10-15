---
tache: T012
projet: agentx-voix
statut: revue
---
## Livré
- bin/parle:1 — shebang `#!/usr/bin/env python3`
- bin/parle:10-16 — piper absent → execv venv (`AGENTX_PARLE_PY`), sinon exit 1
- bin/dictee:1 — shebang `#!/usr/bin/env python3`
- bin/dictee:9-15 — faster_whisper absent → execv venv (`AGENTX_DICTEE_PY`), sinon exit 1
- bin/dictee:63-64 — `--device auto|cuda|cpu` (défaut auto), `--compute-type`
- bin/dictee:68,81-82 — auto = `ctranslate2.get_cuda_device_count()` ; float16 GPU / int8 CPU
- docs/INSTALL-voix.md — clone Seagle-io/AgentX, symlinks, GPU facultatif, modèle sourcé, dépannage n°4
- .cache/voix-T012/test_dictee_device.py — 4 tests, WhisperModel+CUDA monkeypatchés
- .cache/voix-T012/avant/ — copies avant (parle, dictee, INSTALL-voix.md)
## Vérifié comment
- `grep -nE "/home/[a-z]+" bin/parle bin/dictee bin/parle_hook.py` avant → `bin/parle:1:#!/home/jdrac/.local/share/parle-venv/bin/python` · `bin/dictee:1:#!/home/jdrac/.local/share/whisper-venv/bin/python` ; après → ∅ (rc=1)
- `python3 -c "find_spec('piper'), find_spec('faster_whisper')"` (système) → `None None`
- avant : `~/.local/bin/parle status` → `mode vocal: ON` / `démon: lancé` rc=0 ; `~/.local/bin/dictee etat` → `inconnu` rc=0
- après : `~/.local/bin/parle status` → `mode vocal: ON` / `démon: lancé` rc=0 ; `~/.local/bin/dictee etat` → `inconnu` rc=0
- jetable avant=après : `parle status` → `mode vocal: OFF` / `démon: arrêté` ; `dictee etat` → `arrêté` ; `parle toggle`/`off` → `ON`/`OFF`
- re-exec prouvé (jetable, 0 son, 0 micro) : `bin/parle --voice /nulle/part.onnx` → `…/parle-venv/lib/python3.13/site-packages/piper/voice.py … FileNotFoundError` ; `bin/dictee --model <dossier vide> --device cpu` → `…/whisper-venv/…/faster_whisper/transcribe.py … RuntimeError: Unable to open file 'model.bin'`
- `AGENTX_PARLE_PY=/nulle/part/python bin/parle status` → `parle : module piper introuvable (python : /nulle/part/python).` + ligne d'aide, rc=1, 0 traceback ; idem dictee rc=1
- `AGENTX_PARLE_PY=/usr/bin/python3 bin/parle status` (venv sans module) → même message rc=1, 0 boucle
- autostart : `parle.desktop Exec=/home/jdrac/.local/bin/parle → …/AgentX/bin/parle exécutable` ; `dictee.desktop Exec=/home/jdrac/.local/bin/dictee → …/AgentX/bin/dictee exécutable` ; fichiers non modifiés
- `whisper-venv/bin/python -W ignore .cache/voix-T012/test_dictee_device.py` → `Ran 4 tests in 0.012s` `OK`
- même test contre copie avant (`DICTEE=.cache/voix-T012/avant/dictee`) → `AssertionError: {'device': 'cuda', 'compute_type': 'float16'} != {'device': 'cpu', 'compute_type': 'int8'}` `FAILED (failures=1, errors=2)`
- `ast.parse` bin/parle bin/dictee → `ast OK`
- `git diff --no-index --stat` → `parle | 9 ++++++++-` (8+/1-) · `dictee | 15 +++++++++++++--` (13+/2-) · `INSTALL-voix.md | 43` (21+/22-)
- `wc -l docs/INSTALL-voix.md` → 175 ; `grep -nE "/home/[a-z]+|jdrac|non vérifié"` → ∅
## Écarts
- ∅ lecture hors WL
- `device="auto"` résolu dans dictee (pas passé tel quel à WhisperModel) — sinon compute_type non adaptable
- test lancé via `python fichier.py`, pas `-m unittest` — chemin avec `.cache` invalide
## Pour la suite
- démon parle réel tourne encore sur l'ancien code : nouveau shebang pris au prochain lancement
- ResourceWarning préexistants bin/dictee:78-79 (`open(...).write` non fermé) — hors périmètre
- GPU détecté mais libs `nvidia-*` absentes → échec chargement, pas de repli CPU auto
- repli CPU jamais exécuté avec le vrai modèle (NV vitesse/qualité int8)
- publication GitHub des 3 scripts : au chef
## Retour sur le pack
- Manquait: `bin/dictee:9-14` (re-exec LD_LIBRARY_PATH via `sys.executable`) non recopié — ordre des re-exec à déduire | Inutile: T009/result.md (contrats déjà recopiés)
