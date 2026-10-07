---
description: Démarre un projet multi-agent — entretien de cadrage, brief, plan, packs
argument-hint: [description libre du besoin]
allowed-tools: Bash(python3 bin/vx.py:*), Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion
---

Charge la compétence `chef-de-projet` et exécute les phases 1 à 3.

Besoin exprimé : $ARGUMENTS

État actuel du vault :
!`python3 bin/vx.py board`

Déroulé attendu :

1. **Entretien** (`AskUserQuestion`, 2 tours max, option recommandée en premier).
   Ne demande à l'humain que ce qu'un éclaireur ne peut pas trouver.
   Si du code existant est concerné, lance un `eclaireur` **en parallèle** de
   l'entretien pour dresser la carte du terrain.
2. **Brief** : `vx projet <slug>` puis remplis `brief.md`. Les sections vides sont
   des questions, pas des hypothèses silencieuses.
3. **Plan** : `plan.md` d'abord — tâches, dépendances, vagues parallèles — puis
   `vx tache` pour chacune.
4. **Packs** : un `context.md` par tâche, chacun validé par
   `vx pack-lint <TID> --projet <slug>`, puis `vx set <TID> --statut pret`.

Termine en montrant le board et la vague 1 proposée, et demande le feu vert avant
de dispatcher. N'enchaîne pas sur le dispatch de ton propre chef.
