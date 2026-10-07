---
description: Rédige ou répare le context pack d'une tâche, puis le valide
argument-hint: <TID> [slug du projet]
allowed-tools: Bash(python3 bin/vx.py:*), Read, Write, Edit, Glob, Grep, Agent
---

Charge la compétence `chef-de-projet`, phase 3 (écriture des packs).

Tâche : $ARGUMENTS

1. Lis `task.md` de la tâche et le `plan.md` du projet pour cadrer le livrable.
2. Si tu ne sais pas quoi mettre dans « Fichiers autorisés » ou « Contrats »,
   **ne devine pas** : lance un `eclaireur` avec une question précise
   (« où est défini X, quelles sont ses signatures, qui l'appelle »), et attends.
   Son `## Pour la suite` est écrit exprès pour être collé dans ton pack.
3. Rédige `context.md`. Les contrats sont **recopiés**, jamais référencés.
4. Valide : `python3 bin/vx.py pack-lint <TID> --projet <slug>`.
   Corrige jusqu'au `OK`. Un pack > 220 lignes signale une tâche à découper, pas
   un pack à abréger.
5. `python3 bin/vx.py set <TID> --statut pret --projet <slug>`.

Montre le pack final en entier avant de passer la main — c'est l'artefact que
l'humain doit pouvoir contester d'un coup d'œil.
