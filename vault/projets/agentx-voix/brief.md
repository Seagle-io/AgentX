---
projet: agentx-voix
titre: La salle parle et écoute
statut: cadrage
objectif: depuis la salle on coupe ou active la voix du chef, on dicte au chef au micro, et chaque agent qui rend est annoncé à voix haute
depot: /home/jdrac/Documents/Workspace/AgentX
produit: agentx
cree: 2026-10-15
tags: [projet]
---

# Brief — La salle parle et écoute

## Objectif
Salle 7777 : bouton 🔊 (voix du chef + annonces on/off, stop), bouton 🎙️ (dictée Whisper vers le terminal du chef), annonce vocale à chaque agent AgentX qui rend ; code voix versionné dans `bin/`.

## Definition of Done du projet
- [ ] `bin/parle`, `bin/dictee`, `bin/parle_hook.py` suivis par git ; `~/.local/bin/parle`, `~/.local/bin/dictee`, `~/.claude/hooks/parle_hook.py` = symlinks vers eux
- [ ] F8, Ctrl+F8, F9, autostart et hooks globaux marchent comme avant (chemins inchangés côté système)
- [ ] `state.json` porte `voix` (contrat T002) ; mode basculé par F8 visible dans la salle en ≤ 2 s
- [ ] 🔊 bascule le mode vocal, ■ coupe la parole en cours, 🎙️ bascule la dictée et rend le focus à xterm
- [ ] agent AgentX qui rend + mode vocal ON ⇒ phrase dite par `parle` ; mode OFF ⇒ silence ; jamais d'exception dans le hook
- [ ] vérificateur passé sur banc, sans toucher l'état voix réel de l'humain

## Contraintes dures
- 0 dépendance Python ajoutée côté salle (stdlib) — règle dash.py
- hooks voix restent GLOBAUX (`~/.claude/settings.json`) — doublon sinon en session AgentX
- POST `/api/voix/*` : hôte local + jeton, comme `/api/term/*` ; aucun texte libre client → `parle`
- sonnerie.py ne lève jamais, ne bloque jamais > 1 s (hook SubagentStop)
- tests : `AGENTX_VOIX_DIR` vers un dossier jetable ; jamais toucher `~/.cache/claude-voix-on`, `dictee.mute`, `parle.sock` réels, jamais faire parler la machine
- arbre partagé avec agentx-immeuble T018/T019 (dash.js, dash.css, index.html) : front voix APRÈS eux

## Hors périmètre
- changer de moteur TTS (Piper reste) ou de modèle STT
- capture micro dans le navigateur (getUserMedia) — la dictée reste Whisper local via ydotool
- touche « envoie » / envoi automatique du prompt
- annonces vocales dans d'autres sessions que celles qui ont les hooks AgentX

## Hypothèses retenues
- un seul interrupteur : mode vocal = voix du chef ET annonces — à invalider si l'humain veut les séparer
- dictée dans la salle = `dictee on|off` + focus xterm ; ydotool tape dans la fenêtre active — à invalider si le navigateur n'a pas le focus clavier au moment de parler
- `bin/dictee` versionné aussi (pas seulement parle) — il doit exposer son état pour 🎙️

## Questions ouvertes
- ∅

## Carte du terrain
| Quoi | Où | Note |
|---|---|---|
| démon TTS (Piper, socket) | `~/.local/bin/parle` | → `bin/parle` T001 |
| dictée Whisper F9 | `~/.local/bin/dictee` | → `bin/dictee` T001 |
| hook Stop/UserPromptSubmit voix | `~/.claude/hooks/parle_hook.py` | global, → `bin/parle_hook.py` |
| hooks globaux | `~/.claude/settings.json` | `.hooks.Stop`, `.hooks.UserPromptSubmit` |
| routes POST salle | `bin/dash.py:1175-1198` | `do_POST`, jeton, `/api/term/` |
| état servi | `bin/dash.py:1125-1138` | `do_GET` `/state.json`, `etat["jeton"]` |
| hook SubagentStop | `bin/sonnerie.py:68-101` | `main()`, écrit `run/evenements.jsonl` |
| bip et cloche | `dash/dash.js:881-975` | `sonnerie`, `brancherSon` |
| terminal xterm | `dash/dash.js:1880-1938` | `brancherTerminal`, `term.focus()` |
| barre terminal | `dash/index.html:174-180` | `#term-etat`, boutons `cbtn` |
| cloche HUD | `dash/index.html:78-79` | `#son-btn` |
