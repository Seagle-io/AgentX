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
   rôle de la tâche. Prompt squelettique dense — le pack porte tout :

   ```
   T002 · projet <slug>
   pack: vault/projets/<slug>/taches/T002-<slug>/context.md
   → lire en entier · exécuter · result.md même dossier, sections « Format de sortie », dense
   rien d'autre du vault
   ```

4. Passe les tâches lancées en `en-cours`.
5. À leur retour, ne lis que `## Pour la suite`, `## Écarts`, `## Vérifié comment`
   (`python3 bin/vx.py integrer --projet <slug>`).
   - Producteurs (implementeur, testeur, designer, devops, juriste, tresorier, produit, marketing, rssi) : `set <TID> --statut revue`,
     puis tâche evaluateur : `python3 bin/vx.py tache "Evaluer <TID>" --projet <slug> --role evaluateur --dep <TID>`,
     pack écrit, lint, dispatch. Seul `retenir` → `fait`.
   - Verdict evaluateur : `retenir <TID> --projet <slug>` | `virer <TID> --motif "<Motif>" --projet <slug>`
     → corriger le pack de la remplaçante (motif recopié en Contrats/DoD ; lint bloque) → redispatcher.
   - « non vérifié » ⇒ non fait ; `bloque` ⇒ corrige le pack et crée une tâche neuve ;
     `DÉFAUTS` ⇒ tâche de correction avec les défauts recopiés dans `## Contrats`.
6. Mets les statuts à jour, affiche le board, annonce la vague suivante.
