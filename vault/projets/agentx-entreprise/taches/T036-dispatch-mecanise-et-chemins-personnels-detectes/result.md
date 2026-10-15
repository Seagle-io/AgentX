---
tache: T036
projet: agentx-entreprise
statut: revue
---
## Livré
- bin/garde_dispatch.py:46-58 — `dispatcher()` : pret→en-cours (`set --dispatch`) + événement, échoue ouvert
- bin/garde_dispatch.py:95 — appelé après lint OK ; :86 refus statut → `--statut pret`
- bin/vx.py:60-63 — EVENEMENTS, PRET_SANS_AGENT_S=900, PORTABLES, RE_CHEMIN_PERSO
- bin/vx.py:424-425,438-440,1094-1095 — set en-cours refusé sauf `--force`/`--dispatch`, journal `[force]`/`[dispatch]`
- bin/vx.py:926-974 — `evenements_par_tache`, `sans_agent`, `chemins_personnels`
- bin/vx.py:988,1032-1033,doctor fin — doctor : sans agent + chemins perso
- bin/dash.py:38-40 — imports vx (PRET_SANS_AGENT_S, evenements_par_tache, sans_agent)
- bin/dash.py:227-235 — `_evenements` ignore `dispatch` — sinon page sonne « a terminé »
- bin/dash.py:339-358,417-419,422 — cache clé (sig, empreinte événements) + échéance 15 min
- bin/dash.py:752-758 — `_todo` prio 1 « T0xx prête mais aucun agent lancé — dispatcher »
- .claude/skills/chef-de-projet/SKILL.md:188 — « Marque les tâches en-cours » → doctrine hook
- CLAUDE.md:19 — § Réflexes, 1 ligne doctrine
- vault/_templates/context.md:63 — § Environnement, ligne portabilité
## Vérifié comment
banc `.cache/T036/banc` (projet banc, packs = copie T036)
1) `echo '{"tool_name":"Agent",…"implementeur"…T001…}' | python3 bin/garde_dispatch.py` → rc=0, stdout vide ; `statut: en-cours` ; evenements.jsonl `{"id": "c40f24f899d9ea1b", "t": "00:39:56", "quoi": "dispatch", "role": "implementeur", "tid": "T001", "statut": "en-cours", "verdict": "", "projet": "banc"}` ; journal `T001 statut pret -> en-cours [dispatch]`
1b) rôle faux T002 → `"permissionDecision": "deny" … T002 est une tache « implementeur », pas « testeur »` ; T002 reste pret, 1 ligne d'événements
2) `vx.py set T002 --statut en-cours` → `vx: erreur: en-cours = dispatch : lance l'agent (le hook passe la tâche en-cours)` rc=1 ; `set T003 --statut en-cours --force` → `T003 : a-faire -> en-cours` rc=0, journal `[force]`
3) `dash.py --json` todo prio 1 : fraîche → `T003 prête mais aucun agent lancé — dispatcher` seul ; `touch -d '20 minutes ago'` T002 → + `T002 prête mais aucun agent lancé — dispatcher | Tache vieillie — pret, aucun dispatch noté` ; doctor → `x banc/T002 : pret, prete mais aucun agent lance — dispatcher`
3b) cache in-process `../cache_test.py` → `t0: ['T003 …']` · `cache: True` · `t0+16min: ['T002 …', 'T003 …']` · hook T003 déjà en-cours rc 0 stdout '' · `apres: []`
3c) agent-bloque T001 puis `set pret` + vieillie → `x banc/T001 : pret, prete mais aucun agent lance — dispatcher`
3d) `dash._evenements()` → `[]` (dispatch seuls), puis `['agent-bloque']`
4) `../chemins_test.py` (ls-files forgé : a.py `#!/home/x/…`, b.py `"/home/x/data"` l2, c.py `/home/<nom>/`, d.sh `#!/bin/sh`, disparu.py) → `['outils/a.py:1', 'outils/b.py:2', 'outils/d.sh:1']`
réel : `python3 -m py_compile bin/garde_dispatch.py bin/vx.py bin/dash.py` → rc=0
réel : hook Explore → rc=0 sans sortie ; T999 → deny « pack introuvable »
réel : `vx.chemins_personnels()` → `[]` sur 66 fichiers (bin/parle, bin/dictee : `#!/usr/bin/env python3`, déjà corrigés par T012)
réel : `./bin/agentx doctor` → `x agentx-entreprise/T036 : en-cours, prete mais aucun agent lance — dispatcher` · `x agentx-voix/T013 : en-cours, …` rc=2 (agentx tolère rc≠0 au démarrage : salle démarre)
réel : `dash.py --json` todo → `1 agentx-voix T013 prête mais aucun agent lancé — dispatcher` · `1 agentx-entreprise T036 …`
`git diff --stat` E → SKILL.md 2 +- · CLAUDE.md 5 + · bin/dash.py 61 · bin/garde_dispatch.py 28 · bin/vx.py 214 · _templates/context.md 1 (vx.py, dash.py, CLAUDE.md déjà `M` avant T036 : stat cumulée)
## Écarts
- lecture hors WL: bin/agentx:186-205 — doctor rc≠0 bloque-t-il la salle (non)
- lecture hors WL: grep dash/dash.js + bin/voix.py `quoi` — dispatch sonnerait « a terminé » → filtré dash.py
- lecture hors WL: grep `en-cours` bin/ .claude/commands — appelants du set manuel
- `git ls-files --cached --others --exclude-standard` ≠ « suivi » strict — parle/dictee non suivis, attendus dans la liste
- flag `--dispatch` (vx set) ajouté — voie du hook, distincte de `--force` au journal
## Pour la suite
- bin/terminal.py:41 consigne encore « statut `en-cours` (`./bin/agentx set`) » → contredit le hook
- bin/sonnerie.py:95-97 tronque à 50 lignes > 256 Ko → dispatchs perdus = faux positifs
- T036, agentx-voix T013 signalés : dispatchés avant le hook, disparaissent à leur sortie d'en-cours
- dash.py modifié → relancer la salle
- `--force` ne note pas d'événement : tâche forcée reste signalée jusqu'à vrai dispatch
## Retour sur le pack
- Manquait: parle/dictee non suivis par git (DoD « suivi » vs attendu) ; dash.js joue tout événement en « fini » ; cache `_bloc_projet` par signature (vieillissement 15 min invisible) | Inutile: ∅
