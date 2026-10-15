---
projet: agentx-voix
maj: 2026-10-15
tags: [env]
---

# Environnement — agentx-voix

## Dépôts et branches
- `/home/jdrac/Documents/Workspace/AgentX` · branche `master` · 0 remote
- arbre partagé : `dash/dash.js` déjà `M` (agentx-immeuble T018)

## Lancer, tester, linter
- salle : `./bin/agentx` (idempotent) · `./bin/agentx statut` · après modif `bin/dash.py` : `./bin/agentx stop && ./bin/agentx`
- serveur de test : `python3 bin/dash.py --port 7790 --no-open` (pid tué en fin)
- état sans navigateur : `python3 bin/dash.py --json`
- voix : `parle status` · `parle say "…"` · `parle stop` · `dictee toggle`
- pipe-test hook : `echo '{"last_assistant_message":"<voix>ok</voix>"}' | python3 -I bin/parle_hook.py stop`
- Playwright : node + `.cache/eval-T015/e2e.mjs` (référence salle) ; Chromium installé par Playwright, pas de nouveau

## Comptes et données de test
- ∅

## Versions
- python3 système 3.14 (salle, hooks) · venv TTS `~/.local/share/parle-venv` (py3.13, piper-tts 1.8.0) · venv STT `~/.local/share/whisper-venv` (faster-whisper 1.2.1)
- voix Piper : `~/.local/share/piper-voices/fr_FR-{siwis,tom}-medium.onnx`

## Ports, URL, fuseau
- salle `http://127.0.0.1:7777` · test 7790 · Europe/Paris

## Rouge d'avance
- ∅

## Interdits
- toucher l'état voix réel en test : `~/.cache/claude-voix-on`, `~/.cache/dictee.mute`, `~/.cache/parle.sock`, `~/.cache/dictee.pid` → `AGENTX_VOIX_DIR=<banc>`
- faire parler la machine en test (fake socket qui enregistre)
- `parle quit`, `dictee stop`, kill des démons voix réels
- éditer `~/.claude/settings.json`

## Bancs et scripts de référence
- `.cache/eval-T015/e2e.mjs` — non-régression salle
