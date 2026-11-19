---
description: Tableau Trello d'un produit — lire les cartes, demander l'accord, les réaliser, les déplacer
argument-hint: [slug du projet du tableau, optionnel]
allowed-tools: Bash(python3 bin/vx.py:*), Bash(./bin/agentx:*), mcp__claude_ai_Trello__trelloReadBoard, mcp__claude_ai_Trello__trelloReadList, mcp__claude_ai_Trello__trelloReadCard, mcp__claude_ai_Trello__trelloWriteCard, AskUserQuestion
---

Tableaux déclarés et tâches déjà liées à une carte :
!`python3 bin/vx.py trello`

Le CLI ne parle jamais à Trello : **toi**, tu lis et tu déplaces les cartes avec les outils
Trello (MCP) ; le vault garde la trace (`trello:`, `trello_accord:`, `trello_liste:` du task.md, journal).

## Règle qui ne se discute pas

**Aucune carte n'est commencée sans l'accord explicite de l'humain, carte par carte.**
Pas d'accord implicite, pas de « je prends les suivantes », pas d'accord recyclé d'une autre carte.
`vx tache --trello` exige `--accord "<ses mots>"` et refuse sans. Écris ses mots tels qu'il les a donnés.

## 1. Lire

1. Pour chaque tableau (ou celui de `$ARGUMENTS`) : `trelloReadCard` `list_by_list` sur la liste `a_faire`
   (son id : `trelloReadBoard` `get` sur l'URL du tableau).
2. Écarte les cartes déjà liées (colonne carte de `vx trello` : même `https://trello.com/c/<id>`).
3. Lis la description de chaque carte restante ; `get` la carte si la description est tronquée.

## 2. Proposer et demander

Une question `AskUserQuestion` (`multiSelect: true`), ≤ 4 cartes, les plus claires et les plus petites d'abord.
Pour chaque carte : titre, ce que tu ferais en 1 ligne, taille estimée (retouche / tâche / projet à cadrer).
S'il n'a coché aucune carte, ou a répondu autre chose qu'un oui clair : **arrête-toi**, rien n'est créé.
Une carte floue : ne la propose pas — liste-la à part avec la question à lui poser.

## 3. Réaliser (cartes acceptées seulement)

1. Projet : le `projet` du tableau. S'il n'existe pas, `vx projet` le crée (demande le porteur à l'humain).
2. Par carte : `./bin/agentx tache "<titre de la carte>" --projet <projet> --role <rôle> --trello <URL carte>
   --accord "<ses mots>" --pack -` (`--retouche` si ≤ 3 fichiers, ≤ 30 lignes). Le pack recopie la description
   de la carte dans `## Mission` (contrat verbatim, règle 3) — l'agent ne lit pas Trello.
3. Commente la carte (`trelloWriteCard`) : `AgentX <TID> — pris en charge (accord <date>)`.
   Ne la déplace pas : le tableau n'a pas de liste « en cours ».
4. Ensuite, cycle normal : `/dispatch`, intégration, `retenir`.

## 4. Déplacer (à chaque passage)

`vx trello` affiche `→ déplacer vers « <a_verifier> »` pour chaque tâche rendue (`revue`, `fait`) :
1. `trelloWriteCard` : déplace la carte vers la liste `a_verifier`, commente
   `AgentX <TID> — livré, à vérifier : <1 ligne de ce qui a été fait>`.
2. Puis **seulement** : `python3 bin/vx.py trello deplace <TID> --projet <projet> --liste "<a_verifier>"`.
`→ commenter : tâche arrêtée` : commente la carte (raison en 1 ligne), laisse-la en place, puis
`trello deplace <TID> --liste arrete`.

Rends compte en 3 lignes : cartes proposées / acceptées / déplacées. Jamais d'archivage ni de
suppression de carte Trello : l'humain s'en charge.
