---
description: Lance une vague d'agents détachés sur les tâches prêtes, puis intègre leurs rendus
argument-hint: [slug du projet] [TID ...]
allowed-tools: Bash(python3 bin/vx.py:*), Bash(./bin/agentx dispatch:*), Bash(./bin/agentx attendre:*), Bash(./bin/agentx ready:*), Read, Glob, Grep
---

Charge la compétence `chef-de-projet`, phases 4 et 5.

Cible : $ARGUMENTS

Tâches dispatchables : `./bin/agentx ready --projet <slug>` (ou sans projet).

1. Si la liste est vide, dis pourquoi (dépendances non faites ? pack vide ? statut
   pas `pret` ?) et arrête-toi — ne fabrique pas de travail. Une tâche `pret`
   depuis longtemps est peut-être périmée (lis son `## Mission` contre l'état HEAD) :
   `set <TID> --statut abandonne` plutôt que dispatcher.
2. Écarte de la vague les tâches qui écriraient dans les mêmes fichiers (vagues de
   2-3 tâches disjointes ; un fichier partagé = le dire dans chaque pack).
3. Lance la vague : **une commande**, jamais d'appel `Agent` pour un rôle AgentX
   (le hook `garde_dispatch` le refuse) :

   ```bash
   ./bin/agentx dispatch --vague T002 T003 --projet <slug>
   ```

   `dispatch` lance les agents détachés (`claude --bg`, 1 fiche `run/agents/` chacun)
   et passe les tâches en `en-cours`. Codes : `OK` · `DEJA` (agent vivant) · `KO`.
4. Attends sans sonder à la main :

   ```bash
   ./bin/agentx attendre T002 T003 --projet <slug> --integrer     # 1er rendu, puis integrer
   ./bin/agentx attendre T002 T003 --projet <slug> --tout --integrer
   ```

   `0` rendu · `1` un agent mort sans rendu (`TID MORT` ⇒ `dispatch --relancer <TID>`,
   jamais pour un `bloque`) · `3` délai dépassé. `dispatch --etat` dit qui vit.
5. À leur retour, ne lis que `## Pour la suite`, `## Écarts`, `## Vérifié comment`
   (`integrer`, ou `integrer --court`).
   - Producteurs (implementeur, testeur, designer, devops, juriste, tresorier, produit, marketing, rssi) :
     `retenir <TID> --projet <slug>` accepte `en-cours` si `result.md` dit `revue` ;
     sans évaluateur : `--sans-eval` (le chef assume). Évaluateur voulu :
     `python3 bin/vx.py tache "Evaluer <TID>" --projet <slug> --role evaluateur --dep <TID> --pack - --dispatch`.
   - Verdict evaluateur : `retenir <TID>` | `virer <TID> --motif "<Motif>" --projet <slug>`
     → corriger le pack de la remplaçante (motif recopié en Contrats/DoD ; lint bloque) → redispatcher.
   - « non vérifié » ⇒ non fait ; `bloque` ⇒ `virer` + remplaçante au pack corrigé, jamais relancer avec le même pack ;
     `DÉFAUTS` ⇒ tâche de correction avec les défauts recopiés dans `## Contrats`.
6. Mets les statuts à jour, affiche le board, annonce la vague suivante.
