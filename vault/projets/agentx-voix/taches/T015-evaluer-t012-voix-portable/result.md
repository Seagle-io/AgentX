---
tache: T015
projet: agentx-voix
statut: fait
evalue: T012
verdict: virer
---
## Verdict
virer — CUDA qui lève → exception non gérée
## DoD
DoD T012 (recopiée) :
- [x] 0 `/home/x` dans 3 scripts — `grep -nE "/home/[a-z]+" bin/parle bin/dictee bin/parle_hook.py → ∅ rc=1` ; avant (`.cache/voix-T012/avant/`) → `parle:1:#!/home/jdrac/…/parle-venv/bin/python` · `dictee:1:#!/home/jdrac/…/whisper-venv/bin/python`
- [x] shebang env + re-exec venv + surcharge + venv absent rc 1 — `bin/parle:1,11-16` `bin/dictee:1,10-15` ; HOME jetable → `parle : module piper introuvable (python : …/home/.local/share/parle-venv/bin/python).` rc=1, 0 traceback ; idem dictee rc=1 ; venv vide (`python3 -m venv --without-pip`) → même message rc=1, 0 boucle
- [x] 0 régression Julien — voir case T015 n°4
- [x] device auto + compute_type + `--device`/`--compute-type` + test monkeypatch — `bin/dictee:63-64,81-82` ; `whisper-venv/bin/python -W ignore .cache/voix-T012/test_dictee_device.py → Ran 4 tests in 0.011s OK`
- [x] guide : clone Seagle-io, 0 contournement shebang, GPU optionnel + lent, modèle bofenghuang ctranslate2, ≤ 250 — `docs/INSTALL-voix.md:27,11-12,62-63` ; `grep -niE "shebang|sed -i|#!/" → rc=1` (avant : `:86,90,96`) ; `wc -l → 175`
- [x] ast + diff stat — `ast.parse → ast OK` ; `git diff --no-index --stat` → `parle | 9 ++++++++-` · `dictee | 15 +++++++++++++--`
- [x] result.md T012 conforme — sections Livré/Vérifié/Écarts/Pour la suite/Retour présentes
DoD T015 :
- [x] cases T012 recopiées, banc `AGENTX_VOIX_DIR=.cache/voix-eval-T015/v` + stub PATH — ci-dessus
- [x] simulation Sylvain — `env HOME=…/home bin/parle status → module piper introuvable rc=1` · `bin/dictee etat → module faster_whisper introuvable rc=1` ; `AGENTX_PARLE_PY=…/parle-venv/bin/python bin/parle status → mode vocal: OFF / démon: arrêté rc=0` ; `AGENTX_DICTEE_PY=…/whisper-venv/bin/python bin/dictee etat → arrêté rc=0` ; `grep -rnE "/home/[a-z]+|jdrac" bin/parle bin/dictee bin/parle_hook.py docs/INSTALL-voix.md → ∅ rc=1`
- [ ] repli CPU, cas `get_cuda_device_count()` lève — manque : `bin/dictee:81` appel non protégé → `RuntimeError: CUDA driver version is insufficient` remonte, `WhisperModel` jamais appelé ; `.cache/voix-eval-T015/test_eval.py -v → Ran 5 tests … FAILED (errors=1)` (4 tests T012 OK)
- [x] 0 régression Julien — avant (copies pré-T012 via venvs) `parle status → mode vocal: ON / démon: lancé rc=0` · `dictee etat → inconnu rc=0` ; après `~/.local/bin/parle status` / `~/.local/bin/dictee etat` → identiques rc=0 ; `readlink -f ~/.local/bin/{parle,dictee} → …/AgentX/bin/{parle,dictee}` exécutables ; `Exec=/home/jdrac/.local/bin/{parle,dictee}` (mtime 2026-10-15 / 2026-10-06, pré-T012) ; mtime `claude-voix-on 1792084733` · `parle.sock 1792084606` avant == après
- [x] guide étapes 1,2,5,9 — blocs ```bash extraits → `.cache/voix-eval-T015/etape{1,2,5,9}.sh` ; `bash -n → rc=0` ×4 ; GPU facultatif `:3,11,54,58` ; `wc -l → 175`
- [x] Motif 1 ligne — ci-dessous
- [x] result.md au format — ce fichier
## Motif
bin/dictee:81 ctranslate2.get_cuda_device_count() non protégé : s'il lève, RuntimeError non gérée au lieu du repli CPU int8 ; envelopper try/except → cpu et ajouter ce cas au test
## Vérifié comment
- `~/.local/bin/parle status → mode vocal: ON / démon: lancé rc=0` (avant == après)
- `~/.local/bin/dictee etat → inconnu rc=0` (avant == après)
- `AGENTX_VOIX_DIR=…/voix-eval-T015/v PATH=stub:$PATH bin/parle toggle → ON` · `status → mode vocal: ON` · `off → OFF` ; `bin/dictee etat → arrêté`
- `stat -c %Y ~/.cache/claude-voix-on ~/.cache/parle.sock → 1792084733 1792084606` (début == fin)
- test T012 rejoué → `Ran 4 tests in 0.011s OK`
- `test_eval.py` (T012 + cas lève) → `RuntimeError: CUDA driver version is insufficient` `bin/dictee, line 81` `FAILED (errors=1)`
- `bash -n etape1.sh … etape9.sh → rc=0 rc=0 rc=0 rc=0`
- `python3 ast.parse bin/parle bin/dictee → ast OK`
## Écarts
- lecture hors WL: `~/.config/autostart/{parle,dictee}.desktop` (grep Exec + stat) — exigée par DoD n°4
- lecture hors WL: `~/.cache/{claude-voix-on,parle.sock,dictee.pid}` (stat seul) — exigée par DoD n°4
- test T012 rejoué écrit/efface un tempdir sous `.cache/voix-T012/v` — fichier de T012, non modifié
- `.cache/voix-T012/v/dictee.{pid,etat}` (00:36, pid 1017588 mort) — reliquat T012
## Pour la suite
- `bin/dictee:81` : `try: n = ctranslate2.get_cuda_device_count() except Exception: n = 0` → cpu/int8 ; test du cas lève obligatoire (`side_effect=RuntimeError`)
- repli sur échec `WhisperModel(device="cuda")` (GPU détecté, libs `nvidia-*` absentes) → retenter cpu/int8 + notify ; signalé par T012 lui-même
- `docs/INSTALL-voix.md:85` « les trois scripts … basculent sur leur venv » : faux pour `parle_hook.py` (stdlib) — corriger en « deux »
- remplaçant : repartir de `bin/dictee` actuel, conserver les 4 tests T012 + cas lève
## Retour sur le pack
- Manquait: WL sans `~/.config/autostart/*.desktop` ni `~/.cache/*` alors que DoD n°4 les exige ; `Bash(ls|git diff|timeout)` absents des outils | Inutile: ∅
