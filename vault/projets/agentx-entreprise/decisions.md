# Decisions — AgentX entreprise : rôles, remplacement des agents défaillants, skills, salle de pilotage

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-15 — cadrage (humain)
- rôles neufs : evaluateur, relecteur, testeur, designer, securite, devops — choix humain
- remplacement : évaluation → viré (`rejete`, motif) → chef corrige pack → tâche remplaçante liée — pas d'auto-relance
- console → poste de pilotage : actions par tâche, palette ⌘K, terminal en tiroir
- skills : officiels anthropics/skills + maison tirés de `vault/connaissances`
- registre unique `roles.json` racine — 4 listes en dur aujourd'hui
- dossier RH calculé depuis task.md — 0 stockage neuf, pas de fake
- serena retiré partout (MCP, binaire, `.serena/`) — demande humaine

## 2026-10-15 — contrat T002
- **Contexte** : 4 implémenteurs parallèles sans canal → 1 propriétaire Python par règle ; front sans logique de permission.
- **Choix** : `roles.json` (13, champs `livre_en`/`juge`/`objet`) + `bin/roles.py` + `bin/rh.py` ; serveur calcule `taches[].actions` ; [[contrat]] C1-C10.
- **Choix** : `set` refuse →rejete, →fait si livre_en=revue, depuis rejete ; reste permissif (compat).
- **Choix** : dep en `revue` satisfaite pour rôles `juge` — sinon évaluateur jamais ready.
- **Choix** : `retenir` exige évaluation `fait` verdict retenir, sauf `--sans-eval` (CLI seul).
- **Choix** : registre KO → hooks replient sur `.claude/agents/<nom>.md` ; vx `tache/virer/doctor` rc 3.
- **Écarté** : listes en dur ×8 sites parce que 1 rôle = 8 edits, dérive.
- **Écarté** : GET `/roles.json` séparé parce que 2 sources de vérité front.
- **Conséquence** : ajouter un rôle = 1 entrée JSON + 1 agent .md ; front L3/L4 séquentiels (3 fichiers partagés).
- **Conséquence** : 1er `virer` = point de non-retour (rejete, liens, deps réécrites).
- **À revoir si** : > 12 rôles affectables (grille salle déborde) ou chef contourne `retenir` par `--sans-eval` > 1/3.
