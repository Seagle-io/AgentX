---
description: Bilan RH — taux de renvoi par rôle, verdicts à appliquer, correction des packs types
argument-hint: [slug du projet]
allowed-tools: Bash(python3 bin/vx.py:*)
---

Charge la compétence `chef-de-projet`, phase « Évaluation et remplacement ».

Cible : $ARGUMENTS

Personnel :
!`python3 bin/vx.py personnel`

Rends, dense, dans cet ordre :
1. Rôles à taux de renvoi ≥ 50 % : rôle · renvois/tâches · motifs récurrents.
2. Tâches à trancher : `python3 bin/vx.py integrer --projet <slug>` → par verdict evaluateur,
   la commande `retenir <TID>` ou `virer <TID> --motif "<Motif>"` à lancer.
3. Proposition de correction du pack type de chaque rôle ≥ 50 % (section du gabarit en cause,
   ligne à ajouter) — sans l'appliquer sans accord.
