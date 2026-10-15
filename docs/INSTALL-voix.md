# Installer la voix d'AgentX (Claude qui parle + dictée)

Ce guide reproduit l'installation réellement en place chez Julien (Ubuntu 26.04, GNOME, GPU NVIDIA) ; le GPU est facultatif.
Trois briques :
- `parle` : Claude te répond à voix haute (Piper). **F8** active/coupe le mode vocal, **Ctrl+F8** le fait taire.
- `dictee` : tu parles, le texte est tapé dans la fenêtre active (Whisper + ydotool). **F9** active/coupe l'écoute.
- un hook Claude Code qui relie Claude à `parle`.

## Prérequis
- Ubuntu avec GNOME, session de bureau (PipeWire : `pw-play` et `pw-record` doivent exister).
- **GPU NVIDIA facultatif.** `dictee` utilise le GPU s'il est disponible (float16), sinon le CPU (int8) automatiquement.
  Sur CPU, la transcription est nettement plus lente qu'avec GPU ; `parle` tourne toujours sur CPU.
  Pour forcer : `dictee --device cpu` ou `--device cuda`, et `--compute-type <type>` pour la précision.
- Avec GPU : pilote NVIDIA installé (`nvidia-smi` doit répondre). Dans tous les cas : environ 3 Go de disque pour le modèle Whisper.
- Paquets système :

```bash
sudo apt install ydotool libnotify-bin pipewire-bin git curl
```
- `uv` (gestionnaire Python utilisé pour les venvs) : https://docs.astral.sh/uv/getting-started/installation/

Dans tout le guide, `$HOME` remplace le dossier personnel. Rien n'est à adapter à la main.

## 1. Récupérer AgentX
```bash
mkdir -p ~/Documents/Workspace && cd ~/Documents/Workspace
git clone https://github.com/Seagle-io/AgentX AgentX
export AGENTX="$HOME/Documents/Workspace/AgentX"
ls "$AGENTX/bin/parle" "$AGENTX/bin/dictee" "$AGENTX/bin/parle_hook.py"
```
Garde `AGENTX` défini dans le même terminal pour les étapes suivantes.

## 2. Venv de `parle` et voix Piper
Versions constatées chez Julien : Python 3.13.13, `piper-tts==1.8.0`, `onnxruntime==1.31.0`, `numpy==2.5.4`.
```bash
uv venv --python 3.13 ~/.local/share/parle-venv
uv pip install --python ~/.local/share/parle-venv/bin/python piper-tts
```
Voix (source officielle : https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR). Il faut le `.onnx` ET le `.onnx.json` de chaque voix. Voix par défaut : `siwis-medium` ; `tom-medium` en option.
```bash
mkdir -p ~/.local/share/piper-voices && cd ~/.local/share/piper-voices
B=https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR
for v in siwis tom; do for e in onnx onnx.json; do
  curl -L -O "$B/$v/medium/fr_FR-$v-medium.$e"; done; done
ls -l      # 4 fichiers, ~63 Mo par .onnx
```

## 3. Venv de `dictee` et modèle Whisper
Versions constatées : Python 3.12.13, `faster-whisper==1.2.1`, `ctranslate2==4.8.2`, `numpy==2.5.3`,
`nvidia-cublas-cu12==12.9.2.10`, `nvidia-cudnn-cu12==9.27.0.42`, `nvidia-cuda-nvrtc-cu12==12.9.86`.
```bash
uv venv --python 3.12 ~/.local/share/whisper-venv
uv pip install --python ~/.local/share/whisper-venv/bin/python faster-whisper
# seulement avec un GPU NVIDIA :
uv pip install --python ~/.local/share/whisper-venv/bin/python \
  nvidia-cublas-cu12 nvidia-cudnn-cu12 nvidia-cuda-nvrtc-cu12
```
Avec GPU, les bibliothèques `nvidia-*` sont indispensables : `dictee` les ajoute lui-même à `LD_LIBRARY_PATH`. Sans GPU, inutiles.

Modèle : `whisper-large-v3-french` converti pour CTranslate2, attendu dans un sous-dossier `ctranslate2/`
(fichiers `config.json model.bin preprocessor_config.json tokenizer.json vocabulary.json`, ~2,9 Go).
Source : dépôt Hugging Face `bofenghuang/whisper-large-v3-french`, dossier `ctranslate2`
(chez Julien : `~/.local/share/whisper-models/whisper-large-v3-french/ctranslate2`).
```bash
~/.local/share/whisper-venv/bin/python -c "
from huggingface_hub import snapshot_download
import os
snapshot_download('bofenghuang/whisper-large-v3-french', allow_patterns=['ctranslate2/*'],
  local_dir=os.path.expanduser('~/.local/share/whisper-models/whisper-large-v3-french'))"
ls ~/.local/share/whisper-models/whisper-large-v3-french/ctranslate2
```

## 4. ydotool (taper au clavier) : service + droits
`ydotool` écrit via `/dev/uinput`, réservé au groupe `input`.
```bash
sudo usermod -aG input "$USER"            # puis FERMER LA SESSION et rouvrir
systemctl --user enable --now ydotool     # service utilisateur fourni par le paquet
systemctl --user status ydotool           # attendu : active (running)
ls -l /dev/uinput                         # attendu : crw-rw---- root input
```
La règle udev du paquet (`/usr/lib/udev/rules.d/80-uinput.rules`) donne déjà `GROUP="input", MODE="0660"`.
Chez Julien l'accès passe par une ACL individuelle ; l'appartenance au groupe `input` est l'équivalent standard (non testé sur une machine neuve).

## 5. Commandes `parle`, `dictee`, hook
`parle` et `dictee` démarrent avec `python3` et basculent seuls sur leur venv
(`~/.local/share/parle-venv`, `~/.local/share/whisper-venv`) ; `parle_hook.py` est en Python standard, sans venv.
De simples liens symboliques suffisent.
```bash
mkdir -p ~/.local/bin ~/.claude/hooks
ln -sf "$AGENTX/bin/parle" ~/.local/bin/parle
ln -sf "$AGENTX/bin/dictee" ~/.local/bin/dictee
ln -sf "$AGENTX/bin/parle_hook.py" ~/.claude/hooks/parle_hook.py
```
Vérifie que `~/.local/bin` est dans le `PATH` (`echo $PATH`).
Venv ailleurs ? Indique son Python : `AGENTX_PARLE_PY=/chemin/bin/python` (parle), `AGENTX_DICTEE_PY=/chemin/bin/python` (dictee).

## 6. Hooks Claude Code
Fusionne ce bloc dans la clé `hooks` de `~/.claude/settings.json` (crée le fichier s'il n'existe pas ; ne supprime pas tes autres réglages) :
```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "python3 -I ~/.claude/hooks/parle_hook.py prompt", "timeout": 5 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "python3 -I ~/.claude/hooks/parle_hook.py stop", "timeout": 5 } ] }
    ]
  }
}
```
Rôle : `prompt` coupe la parole en cours et, en mode vocal, demande à Claude un résumé oral entre `<voix>…</voix>` ; `stop` envoie ce résumé à `parle`.
Relance Claude Code après modification.

## 7. Raccourcis GNOME (F8, Ctrl+F8, F9)
```bash
K=org.gnome.settings-daemon.plugins.media-keys
P=/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings
gsettings get $K custom-keybindings      # note les raccourcis existants : ils doivent être conservés
```
Si la liste est `@as []`, applique :
```bash
gsettings set $K custom-keybindings "['$P/dictee/', '$P/parle-toggle/', '$P/parle-stop/']"
set_key() { S=$K.custom-keybinding:$P/$1/
  gsettings set $S name "$2"; gsettings set $S command "$3"; gsettings set $S binding "$4"; }
set_key dictee       'Dictée on/off'          "$HOME/.local/bin/dictee toggle" 'F9'
set_key parle-toggle 'Voix de Claude on/off'  "$HOME/.local/bin/parle toggle"  'F8'
set_key parle-stop   'Claude : tais-toi'      "$HOME/.local/bin/parle stop"    '<Control>F8'
```
Si la liste contient déjà des raccourcis, ajoute les trois chemins à la liste existante au lieu de la remplacer.

## 8. Démarrage automatique
Les fichiers `.desktop` n'interprètent ni `~` ni `$HOME` : on écrit le chemin réel.
```bash
mkdir -p ~/.config/autostart ~/.local/share/applications
cat > ~/.config/autostart/parle.desktop <<EOS
[Desktop Entry]
Type=Application
Name=Voix de Claude
Comment=Synthèse vocale des réponses de Claude Code (F8 : on/off, Ctrl+F8 : stop)
Exec=$HOME/.local/bin/parle
Icon=audio-speakers
Terminal=false
Categories=Utility;Accessibility;
EOS
cat > ~/.config/autostart/dictee.desktop <<EOS
[Desktop Entry]
Type=Application
Name=Dictée vocale
Comment=Tape ce que tu dis dans la fenêtre active (F9 : on/off)
Exec=$HOME/.local/bin/dictee
Icon=audio-input-microphone
Terminal=false
Categories=Utility;Accessibility;
EOS
cp ~/.config/autostart/dictee.desktop ~/.local/share/applications/dictee.desktop   # lanceur du menu
```
Ouvre une nouvelle session (ou lance `parle &` et `dictee &` à la main) pour démarrer les deux démons.

## 9. Vérifier
```bash
parle status                # mode vocal: OFF · démon: lancé
parle say "bonjour"         # tu dois entendre la voix
dictee etat                 # off (démon lancé, écoute en pause)
```
- **F8** : notification « Mode vocal activé » ; `parle status` → `mode vocal: ON`. Dans Claude Code, chaque réponse se termine par un résumé lu à voix haute.
- **F9** : notification « Écoute activée » ; ouvre un éditeur de texte, parle : le texte s'écrit. Le chargement du modèle prend quelques secondes au démarrage (notification « Prêt »).
- **Ctrl+F8** : coupe la parole en cours.
- Pendant que Claude parle, le micro de `dictee` est coupé automatiquement (pas d'écho).

## 10. Dépannage
1. **`parle n'est pas lancé` / `démon: arrêté`** : lance `parle &` (ou rouvre la session). Si le message est `parle tourne déjà` alors qu'il ne répond plus : `rm ~/.cache/parle.sock` puis relance.
2. **Micro muet, rien n'est tapé** : `dictee etat` doit afficher `on` (sinon F9). Vérifie que le micro par défaut est le bon (`pw-record --rate 16000 --channels 1 /tmp/test.wav`, parle 3 s, Ctrl+C, puis écoute). Le seuil de voix est `--thresh 0.01` : à baisser si le micro est faible. Après une parole de Claude, le micro reste coupé ~1 s.
3. **ydotool sans droits (rien ne se tape, `failed to open uinput`)** : `id -nG` doit contenir `input` (session rouverte après `usermod`) et `systemctl --user status ydotool` doit être `active (running)`.
4. **`module piper introuvable` / `module faster_whisper introuvable`** : le venv n'est pas à l'endroit attendu ou le paquet n'y est pas installé. Refais l'étape 2 ou 3, ou définis `AGENTX_PARLE_PY` / `AGENTX_DICTEE_PY` (étape 5).
5. **`état inconnu — relance dictee`** : le démon tourne mais n'a pas écrit son état. Fais `dictee stop`, puis `dictee &`, attends la notification « Prêt », puis F9.
6. **Le mode vocal ne s'active pas / Claude ne parle pas** : F8 doit afficher une notification et `parle status` donner `mode vocal: ON`. Si oui mais silence : démon arrêté (cas 1), hook absent (`ls -l ~/.claude/hooks/parle_hook.py`, bloc de l'étape 6, Claude Code relancé), ou fichier voix manquant (`ls ~/.local/share/piper-voices`). Si F8 ne fait rien : raccourci GNOME mal enregistré (étape 7, `gsettings get` sur chaque entrée).
