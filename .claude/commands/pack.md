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
3. Rédige. Contrats **recopiés**. Toute case de DoD à seuil/compteur finit par
   `— HEAD : <commande → valeur>` mesurée **avant** d'écrire (`rg -c`, `wc -l`, test) ; 0 HEAD ⇒ lint KO.
4. Tâche neuve : 1 appel, création + pack + lint :
   `python3 bin/vx.py tache "<titre>" --projet X --role R [--dep T] --pack - <<'EOF' … EOF`
   Pack existant : `python3 bin/vx.py pack-lint <TID> --projet <slug>` jusqu'au `OK`.
   Pack > 220 lignes = tâche à découper, pas à abréger.
5. Lint vert ⇒ `a-faire -> pret` + enfants verificateur/critique ; `--dispatch` (avec `--pack`) ou `/dispatch`.

Montre le pack final en entier avant de passer la main — c'est l'artefact que
l'humain doit pouvoir contester d'un coup d'œil.
