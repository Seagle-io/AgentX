---
pack: T009
projet: agentx-voix
role: scribe
cree: 2026-10-16
---

# Pack T009 — Guide d'installation de la voix pour Sylvain

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `docs/INSTALL-voix.md` : le guide pas à pas, en français courant (lecteur humain : Sylvain, associé de Julien, à l'aise en terminal Linux), pour installer sur SA machine la voix d'AgentX — Claude qui parle (Piper), la dictée au micro (Whisper + ydotool), les raccourcis F8 / Ctrl+F8 / F9, le démarrage automatique, les hooks Claude Code — reconstitué UNIQUEMENT à partir de ce qui est réellement installé chez Julien (constaté, pas supposé).

## Definition of Done
- [ ] inventaire constaté, collé dans `result.md` : venvs `~/.local/share/{parle-venv,whisper-venv}` (version Python, `pip freeze` des paquets principaux), voix Piper `~/.local/share/piper-voices/*.onnx`, modèles `~/.local/share/whisper-models/`, `ydotool`/`ydotoold` (paquet, service, groupe/udev requis), `notify-send`, fichiers `~/.config/autostart/{parle,dictee}.desktop`, raccourcis GNOME (`gsettings get … custom-keybindings` puis `name`/`command`/`binding` de chacun), hooks dans `~/.claude/settings.json` (`UserPromptSubmit`, `Stop`)
- [ ] guide structuré : Prérequis (Ubuntu/GNOME, GPU optionnel) · 1 Récupérer AgentX (le dépôt contient `bin/parle`, `bin/dictee`, `bin/parle_hook.py`) · 2 Venv de `parle` + voix Piper (lien de téléchargement des voix : source officielle citée par URL) · 3 Venv de `dictee` + modèle Whisper · 4 ydotool (service + permissions) · 5 Liens symboliques `~/.local/bin/parle`, `~/.local/bin/dictee`, `~/.claude/hooks/parle_hook.py` → `bin/` · 6 Hooks Claude Code (bloc JSON exact à fusionner dans `~/.claude/settings.json`) · 7 Raccourcis GNOME (commandes `gsettings` exactes) · 8 Démarrage auto (contenu des 2 `.desktop`) · 9 Vérifier (`parle status`, `parle say "bonjour"`, F8, F9) · 10 Dépannage (5 pannes réelles max : démon arrêté, micro muet, ydotool sans droits, « état inconnu — relance dictee », mode vocal qui ne s'active pas)
- [ ] chaque commande du guide = commande réellement exécutable ; chemins génériques (`~/`, `$HOME`), JAMAIS `/home/jdrac` en dur ; les shebangs codés en dur de `bin/parle` (`#!/home/jdrac/...`) et `bin/dictee` signalés en `## Pour la suite` (bloquant pour Sylvain : à rendre portables, tâche implementeur à créer) et contournés dans le guide (lancer via le python du venv)
- [ ] 0 secret, 0 donnée personnelle (pas d'email, pas de token) ; versions de paquets réelles
- [ ] `docs/INSTALL-voix.md` ≤ 250 lignes ; lien depuis `README.md` NON modifié (le chef décidera) ; `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `docs/INSTALL-voix.md` | E | livrable (neuf) |
| `bin/parle` | L | démon TTS, commandes, chemins |
| `bin/dictee` | L | démon STT, commandes, chemins |
| `bin/parle_hook.py` | L | hook Claude Code |
| `~/.config/autostart/parle.desktop` | L | démarrage auto |
| `~/.config/autostart/dictee.desktop` | L | démarrage auto |
| `~/.claude/settings.json` | L | bloc `hooks` seulement (rien d'autre à recopier) |
| `~/.local/share/applications/dictee.desktop` | L | lanceur |
| `vault/projets/agentx-voix/brief.md` | L | objectif, raccourcis F8 / Ctrl+F8 / F9 |

## Contrats
Constaté par le chef :
```
~/.local/share/{parle-venv, whisper-venv, piper-voices (fr_FR-siwis-medium, fr_FR-tom-medium), whisper-models}
~/.config/autostart/parle.desktop  Exec=~/.local/bin/parle   · dictee.desktop Exec=~/.local/bin/dictee
gsettings custom-keybindings : dictee/, parle-toggle/, parle-stop/
/usr/bin/{ydotool, ydotoold, notify-send}
bin/parle shebang : #!/home/jdrac/.local/share/parle-venv/bin/python ; bin/dictee : #!/home/jdrac/.local/share/whisper-venv/bin/python
~/.claude/settings.json hooks : UserPromptSubmit → python3 -I ~/.claude/hooks/parle_hook.py prompt ; Stop → … stop
```

## Décisions actées
- demande humaine 2026-10-16 : « une tâche pour Sylvain : lui expliquer comment installer AgentX voix »
- guide en français courant (lecteur humain), pas en langage dense ; constaté > supposé ; NV écrit en clair si non vérifiable

## Hors périmètre
- modifier `bin/*`, les venvs, les raccourcis ou `~/.claude/settings.json` ; installer quoi que ce soit ; faire parler la machine
- la salle (console vocale, boutons) : tâches T005/T008

## Environnement
- lecture seule partout : `pip freeze` via `~/.local/share/<venv>/bin/python -m pip freeze`, `gsettings get`, `systemctl --user status ydotool` / `systemctl status ydotoold`, `id -nG`, `ls`, `cat` des .desktop
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write (`docs/INSTALL-voix.md`, `result.md`), Grep, Glob, `Bash(ls:*)`, `Bash(gsettings get:*)`, `Bash(systemctl:*)` (status seulement), `Bash(id:*)`, `Bash(python3:*)`, `Bash(~/.local/share/parle-venv/bin/python:*)`, `Bash(~/.local/share/whisper-venv/bin/python:*)`, `Bash(which:*)`, `Bash(dpkg -S:*)`, `Bash(lsb_release:*)`, `Bash(wc:*)`, `Bash(mkdir -p docs)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T009
projet: agentx-voix
statut: fait | bloque
---
## Livré
- docs/INSTALL-voix.md — n lignes, n étapes
## Vérifié comment
commande → sortie brute (inventaire)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : ce qui bloque une installation chez Sylvain (shebangs, chemins en dur…)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
