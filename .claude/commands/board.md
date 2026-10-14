---
description: État du vault — projets, tâches, statuts, packs manquants, incohérences
argument-hint: [slug du projet, optionnel]
allowed-tools: Bash(python3 bin/vx.py:*)
---

!`python3 bin/vx.py board $ARGUMENTS`

Prêt à partir :
!`python3 bin/vx.py ready`

Cohérence :
!`python3 bin/vx.py doctor`

Résume en 3 lignes maximum : avancement, ce qui bloque, prochaine action
recommandée. Si le board affiche `A CLORE`, commence par demander à l'humain
s'il faut clore ces projets (`/clore <slug>`). N'ouvre aucun fichier du vault pour ça — le board suffit, c'est
exactement pourquoi il existe.
