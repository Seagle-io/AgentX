---
tache: T009
projet: agentx-voix
statut: fait
---
## Livré
- docs/INSTALL-voix.md — 176 lignes, 10 étapes (Prérequis + 1..10) ; README.md non modifié
- 0 note vault créée (faits propres au projet)
## Vérifié comment
- lsb_release -ds → Ubuntu 26.04 LTS
- parle-venv/bin/python -V → Python 3.13.13 (uv 0.11.13) ; whisper-venv → Python 3.12.13
- `pip freeze` → "No module named pip" (venvs uv) ; remplacé par importlib.metadata :
  - parle-venv → piper-tts==1.8.0 onnxruntime==1.31.0 numpy==2.5.4 flatbuffers==25.12.19 pathvalidate==3.3.1 protobuf==7.36.2
  - whisper-venv → faster-whisper==1.2.1 ctranslate2==4.8.2 numpy==2.5.3 onnxruntime==1.30.0 huggingface_hub==1.33.0 tokenizers==0.23.2 av==15.1.0 nvidia-cublas-cu12==12.9.2.10 nvidia-cudnn-cu12==9.27.0.42 nvidia-cuda-nvrtc-cu12==12.9.86
- ls piper-voices → fr_FR-siwis-medium.onnx(+.json) 63201294 · fr_FR-tom-medium.onnx(+.json) 63511038
- ls whisper-models → whisper-large-v3-french/ctranslate2/{config.json,model.bin,preprocessor_config.json,tokenizer.json,vocabulary.json} · du → 2.9G
- which/dpkg -S → /usr/bin/ydotool,/usr/bin/ydotoold (paquet ydotool) · /usr/bin/notify-send (libnotify-bin) · pw-play, pw-record présents
- systemctl --user status ydotool → enabled, active (running) ; /usr/lib/systemd/user/ydotool.service ExecStart=/usr/bin/ydotoold ; ydotoold.service (système) → not found
- id -nG → jdrac adm cdrom sudo dip plugdev users lpadmin lxd docker (∅ input)
- ls -l /dev/uinput → crw-rw----+ root input ; getfacl → user:jdrac:rw- (ACL individuelle) ; 80-uinput.rules → GROUP="input", MODE="0660"
- nvidia-smi -L → GPU 0: NVIDIA GeForce RTX 4070 Ti
- autostart/{parle,dictee}.desktop + applications/dictee.desktop → Exec=<home>/.local/bin/{parle,dictee} (contenu recopié dans le guide)
- ls -l ~/.local/bin/{parle,dictee} ~/.claude/hooks/parle_hook.py → liens symboliques vers AgentX/bin/
- gsettings custom-keybindings → dictee/, parle-toggle/, parle-stop/ ; (name,command,binding) → ('Dictée on/off','…/dictee toggle','F9') ('Voix de Claude on/off','…/parle toggle','F8') ('Claude : tais-toi','…/parle stop','<Control>F8')
- settings.json hooks → UserPromptSubmit/Stop : python3 -I ~/.claude/hooks/parle_hook.py prompt|stop, timeout 5
- wc -l docs/INSTALL-voix.md → 176 ; grep -c /home/jdrac → 1 (mention explicite des shebangs, pas une commande)
- NV : guide jamais exécuté sur machine neuve ; dépôt HF du modèle Whisper (bofenghuang/whisper-large-v3-french) ; URLs rhasspy/piper-voices (schéma standard, non téléchargées) ; droits uinput via groupe input (chez Julien : ACL)
## Écarts
- ∅ lecture hors WL (inventaire système seulement : nvidia-smi, getfacl, udev rules, pyvenv.cfg, .cache/huggingface du modèle)
- pip absent des venvs → importlib.metadata (contourne le contrat « pip freeze »)
## Pour la suite
- BLQ Sylvain : shebangs `bin/parle:1` `#!/home/jdrac/.local/share/parle-venv/bin/python`, `bin/dictee:1` idem whisper-venv → implementeur : `#!/usr/bin/env python3` + re-exec sur venv via `$HOME`/`AGENTX_VENV` ; contourné par wrappers dans le guide
- BLQ GPU : `bin/dictee` WhisperModel(device="cuda", compute_type="float16") en dur → sans NVIDIA, dictee KO ; ajouter fallback CPU (int8) — tâche implementeur
- source du modèle Whisper non tracée (repo HF inconnu) : demander à Julien, corriger étape 3 du guide
- URL du dépôt AgentX à renseigner (étape 1) ; lien depuis README.md à décider par le chef
## Retour sur le pack
- Manquait: repo HF du modèle Whisper ; pip freeze impossible (venvs uv) ; dépendance GPU NVIDIA | Inutile: ∅
