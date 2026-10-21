---
description: État du vault — projets, tâches, statuts, packs manquants, incohérences
argument-hint: [slug du projet, optionnel]
allowed-tools: Bash(python3 bin/vx.py:*), Bash(true)
---

!`python3 bin/vx.py board $ARGUMENTS`

Prêt à partir :
!`python3 bin/vx.py ready`

Cohérence :
!`python3 bin/vx.py doctor || true`

Résume en 3 lignes maximum : avancement, ce qui bloque, prochaine action
recommandée. Si le board affiche `A CLORE`, clos d'office tout projet sans tâche ouverte (`/clore <slug>`) en prévenant l'humain en une ligne, puis lis la todo de chaque étage ouvert et exécute l'URGENT puis la vague suivante. Ne pose aucune question bloquante. N'ouvre aucun fichier du vault pour ça — le board suffit, c'est
exactement pourquoi il existe.
