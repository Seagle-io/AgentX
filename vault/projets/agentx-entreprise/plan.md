---
projet: agentx-entreprise
titre: AgentX entreprise : rôles, remplacement des agents défaillants, skills, salle de pilotage
maj: 2026-10-15
tags: [plan]
---

# Plan — AgentX entreprise : rôles, remplacement des agents défaillants, skills, salle de pilotage

## Découpage
| ID | Rôle | Livrable | Dépend de | Parallèle avec |
|---|---|---|---|---|
| T001 | eclaireur | carte rôles/statuts/console | — | — |
| T002 | architecte | `contrat.md` C1-C10 | T001 | T003-T006 |
| T003 | implementeur | skills officiels frontend-design, webapp-testing | — | T002 |
| T004 | scribe | skills langage-dense, conventions-geolens | — | T002 |
| T005 | scribe | skills conventions-seagle, conventions-orthopro | — | T002 |
| T006 | scribe | 6 agents `.claude/agents/*.md` | — | T002 |
| L1 | implementeur | roles.json, roles.py, vx.py virer/retenir/personnel, gardes | T002 | L2, L3, chef |
| L2 | implementeur | dash.py : état, RH, actions, todo | T002 | L1, L3, chef |
| L3 | implementeur | front salle N rôles + panneau RH | T002 | L1, L2 |
| L4 | implementeur | front pilotage : actions, palette ⌘K, tiroir terminal | L3 | — |
| chef | scribe | SKILL chef-de-projet, CLAUDE.md, commandes, consigne terminal, skills préchargés | T002-T006 | L1-L3 |
| éval | evaluateur/verificateur | évaluer L1-L4 (dogfood du remplacement) | L1-L4 | — |

## Vagues
- **V1** : T002, T003, T004, T005, T006
- **V2** : L1, L2, L3, chef
- **V3** : L4, vérif/éval L1-L3
- **V4** : éval L4, scribe clôture

## Synchronisations
- après V1 : contrat recopié dans chaque pack V2
- commit local après chaque vague

## Risques
| Risque | Signal | Parade |
|---|---|---|
| L3/L4 collision `dash.js` | même fichier E | séquentiels |
| `skills:` frontmatter ignoré | agent ne cite pas le skill | consigne dans le pack |
| tâches anciennes cassées | `doctor` rouge | champs neufs optionnels |
