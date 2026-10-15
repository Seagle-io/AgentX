---
projet: agentx-voix
titre: La salle parle et écoute
maj: 2026-10-15
tags: [plan]
---

# Plan — La salle parle et écoute

## Découpage
Contrat fichiers/socket fixé par le chef (packs T001, T002) → pas d'architecte : T001 et T002 partent ensemble.

| ID | Rôle | Livrable | Dépend de | Parallèle avec |
|---|---|---|---|---|
| T001 | implementeur | `bin/parle`, `bin/dictee`, `bin/parle_hook.py` versionnés + symlinks + `AGENTX_VOIX_DIR` + `dictee on/off/etat` | — | T002 |
| T002 | implementeur | `bin/voix.py` + `/api/voix/*` + `state.json.voix` + annonce dans `sonnerie.py` | — | T001 |
| T003 | evaluateur | verdict T001 | T001 | T004 |
| T004 | evaluateur | verdict T002 | T002 | T003 |
| T005 | designer | 🔊, ■, 🎙️ dans la salle | T002 + immeuble T018/T019 clos | — |
| T006 | evaluateur | verdict T005 | T005 | T007 |
| T007 | verificateur | casser la voix de la salle dans Chromium, sur banc | T005 | T006 |

## Vagues
- **V1** : T001, T002
- **V2** : T003, T004 · chef relance `dictee`/`parle` (symlinks) et la salle (dash.py)
- **V3** : T005 — pack écrit APRÈS clôture immeuble T018/T019 (mêmes fichiers, coordonnées à re-`rg`)
- **V4** : T006, T007 · puis scribe de clôture

## Synchronisations
- après V1 : `bin/parle` du dépôt = celui qui tourne ; hook global pipe-testé via symlink
- avant V3 : `git status dash/` propre (immeuble commité) — sinon instantané `.cache/snap-T005/`
- contrat `state.json.voix` + `/api/voix/*` (pack T002) recopié tel quel dans T005

## Risques
| Risque | Signal | Parade |
|---|---|---|
| test qui touche l'état voix réel | `~/.cache/claude-voix-on` change, la machine parle | `AGENTX_VOIX_DIR` + faux socket ; stub `notify-send` |
| test sonnerie qui écrit le vrai `run/evenements.jsonl` | bip dans la salle réelle | sonnerie lancée depuis banc `.cache/banc-T002` |
| ydotool tape hors du terminal | texte dicté dans la page, pas dans xterm | 🎙️ rend le focus à xterm ; vérif T007 |
| collision dash.js avec immeuble | `M` sur dash.js au dispatch de T005 | V3 attend T018/T019 |
| symlink cassé = F8/F9/hooks morts | `parle status` KO, hook absent | DoD T001 `readlink -f` + pipe-test via chemin global |
