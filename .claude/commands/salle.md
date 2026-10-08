---
description: Ouvre la salle des agents — tableau de bord animé, lit le vault en direct
argument-hint: [port, défaut 7777]
allowed-tools: Bash(python3 bin/dash.py:*), Bash(curl:*)
---

Lance le tableau de bord s'il ne tourne pas déjà, puis donne l'URL à l'utilisateur.

1. Teste s'il est vivant :

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:7777/state.json
```

2. Si ce n'est pas `200`, démarre-le **en tâche de fond** (`run_in_background`) :

```bash
./bin/agentx salle --port 7777 --no-open
```

3. Résume ce que la salle montre en ce moment — `./bin/agentx salle --json`
   suffit, n'ouvre pas la page toi-même. Donne, dans cet ordre :
   - la **todo du chef** (clé `todo`), priorité 1 d'abord — c'est ce qui attend
     une décision de l'humain ou de toi ;
   - les **relais actifs ou bloqués** (clé `flux`) : qui attend le résultat de qui ;
   - les packs refusés par le linter.

Rappelle que le vault se lit tout seul toutes les 2 secondes : aucune action
n'est nécessaire pour rafraîchir, et le mode DÉMO disparaît dès qu'un projet
existe.
