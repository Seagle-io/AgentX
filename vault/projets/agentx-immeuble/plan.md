---
projet: agentx-immeuble
titre: AgentX immeuble : un étage par projet
maj: 2026-10-15
tags: [plan]
---

# Plan — AgentX immeuble : un étage par projet

## Découpage
| ID | Rôle | Livrable | Dépend de | Parallèle avec |
|---|---|---|---|---|
| T001 | eclaireur | carte des hypothèses mono-projet | — | — |
| T002 | architecte | contrat : `state.immeuble`, `?projet=`, coupe, todo agrégée, consigne chef | T001 | — |
| L1 | implementeur | serveur `bin/dash.py` : état immeuble + étage choisi | T002 | L3 |
| L2 | designer | coupe d'immeuble + bascule d'étage `dash/*` | L1 | — |
| L3 | implementeur | chef au toit : consigne `terminal.py`, `agentx`, sonnerie projet | T002 | L1 |
| E* | evaluateur | 1 par lot producteur | lot | — |
| V | verificateur | Chromium sur banc ≥ 3 projets | L1-L3 retenus | — |
| S | scribe | capitaliser | V | — |

## Vagues
- **V1** : T001 (+ fin agentx-entreprise : éval T018)
- **V2** : T002
- **V3** : L1 ∥ L3 → évaluations
- **V4** : L2 → évaluation
- **V5** : V → correctifs éventuels → S

## Synchronisations
- après T002 : contrat validé avant tout lot
- L2 après L1 : `dash.js` consomme `state.immeuble`
- commit local de la vague 3 agentx-entreprise avant V3 (mêmes fichiers)

## Risques
| Risque | Signal | Parade |
|---|---|---|
| état de N projets trop lent | `construire_etat` × N > 300 ms | résumé léger par étage, détail pour l'étage choisi seulement |
| actions sur le mauvais projet | `exe.projet` ≠ étage affiché | contrat : `projet` toujours explicite, testé au navigateur |
| coupe illisible > 6 étages | capture 1600 px | hauteur d'étage dégressive, sous-sol replié |
