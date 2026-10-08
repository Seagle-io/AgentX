---
description: Lance la prochaine vague d'agents et intègre leurs résultats
argument-hint: [slug du projet] [ou IDs de tâches : T002 T003]
allowed-tools: Bash(python3 bin/vx.py:*), Read, Write, Edit, Glob, Grep, Agent
---

Charge la compétence `chef-de-projet`, phases 4 et 5.

Cible : $ARGUMENTS

Tâches dispatchables :
!`python3 bin/vx.py ready --json`

1. Si la liste est vide, dis pourquoi (dépendances non faites ? pack vide ? statut
   pas `pret` ?) et arrête-toi — ne fabrique pas de travail.
2. Écarte de la vague les tâches qui écriraient dans les mêmes fichiers.
3. Lance la vague : **un seul message, N appels `Agent`**, `subagent_type` = le
   rôle de la tâche. Prompt squelettique — le pack porte tout :

   ```
   Tâche <TID> du projet <slug>.
   Ton context pack : <chemin context.md>
   Lis-le en entier, exécute, puis écris ton compte rendu dans result.md
   (même dossier), aux sections exactes du « Format de sortie ».
   Ne lis rien d'autre du vault.
   ```

4. Passe les tâches lancées en `en-cours`.
5. À leur retour, ne lis que `## Pour la suite`, `## Écarts`, `## Vérifié comment`.
   Applique les règles d'intégration : « non vérifié » ⇒ non fait ; `bloque` ⇒
   corrige le pack et crée une tâche neuve ; `DÉFAUTS` ⇒ tâche de correction avec
   les défauts recopiés dans `## Contrats`.
6. Mets les statuts à jour, affiche le board, annonce la vague suivante.
