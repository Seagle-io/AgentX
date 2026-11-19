# Trello → AgentX

Le chef lit un tableau Trello, propose des cartes, **attend l'accord de l'humain carte par carte**,
les réalise comme des tâches AgentX, puis déplace la carte quand la tâche est rendue. Le vault garde la trace.

## Brancher un tableau (une fois par machine)

`trello.json` à la racine d'AgentX (local, non versionné ; modèle `trello.exemple.json`) :

```json
{"tableaux": [{"url": "https://trello.com/b/CLzKfnkx/kora", "projet": "kora-trello",
               "a_faire": "TODO", "a_verifier": "A Vérifier"}]}
```

- `projet` : le projet du vault qui reçoit les cartes de ce tableau ;
- `a_faire` : la liste lue ; `a_verifier` : la liste où part une carte dont la tâche est rendue.

La session Claude du chef doit avoir le connecteur Trello (claude.ai → connecteurs) : c'est lui qui lit et écrit
sur Trello. Le CLI `agentx` ne parle jamais à Trello et n'a aucun jeton.

## Le cycle

1. `/trello` : le chef lit la liste `a_faire`, écarte les cartes déjà prises, propose ≤ 4 cartes.
2. **Tu acceptes ou non, carte par carte.** Sans oui clair, rien n'est créé.
3. Carte acceptée : `agentx tache "<titre>" --projet kora-trello --role … --trello <URL carte> --accord "<tes mots>"`.
   Sans `--accord`, la commande refuse. Une carte = une tâche ouverte au plus (`carte … deja prise`).
   La carte reçoit un commentaire `AgentX <TID> — pris en charge`.
4. Tâche rendue (`revue`/`fait`) : `agentx trello` affiche `→ deplacer vers « A Vérifier »` ; le chef déplace la carte,
   la commente, puis note le déplacement : `agentx trello deplace <TID> --projet kora-trello --liste "A Vérifier"`.
5. Tâche virée : la remplaçante garde la carte et l'accord. Tâche abandonnée : la carte est commentée, laissée en place.

## Ce que garde le vault

Dans le `task.md` : `trello:` (URL courte de la carte), `trello_accord:` (date et mots de l'accord),
`trello_liste:` (dernière liste où le chef l'a posée). Au journal : la prise (`carte … — accord : …`) et chaque déplacement.
Les cartes Trello ne sont jamais archivées ni supprimées par AgentX.
