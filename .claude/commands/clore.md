---
description: Clôt un projet — capitalise les connaissances, améliore les gabarits, archive
argument-hint: <slug du projet>
allowed-tools: Bash(python3 bin/vx.py:*), Read, Write, Edit, Glob, Grep, Agent
---

Charge la compétence `chef-de-projet`, phase 6.

Projet : $ARGUMENTS

État :
!`python3 bin/vx.py board --projet $ARGUMENTS`

1. S'il reste des tâches ouvertes, liste-les et demande s'il faut les abandonner
   (`vx set <TID> --statut abandonne`) ou finir. Ne clôs rien en silence.
2. Crée une tâche `scribe` et son pack. Whitelist : le dossier du projet dans le
   vault. Mission : notes atomiques réutilisables, mise à jour brief/plan, et
   surtout **agrégation des `## Retour sur le pack`**.
3. Dispatche le scribe, puis lis son `## Pour la suite`.
4. Applique ses recommandations aux gabarits — `vault/_templates/context.md` et la
   compétence `chef-de-projet` — si un même manque est revenu deux fois. C'est la
   boucle d'apprentissage du système : sans ça, le prochain projet refait les mêmes
   mauvais packs.
5. `./bin/agentx env down` pour chaque service du projet encore actif (`env statut`).
6. `python3 bin/vx.py doctor` puis, après accord explicite,
   `python3 bin/vx.py archive <slug>`.

Le scribe n'écrit jamais `statut:` du brief (clos, archive) — clôture = chef, après accord explicite de l'humain, `vx archive <slug>` (incident 2026-10-20 08:30).

Rends compte en 5 lignes : notes capitalisées, gabarits corrigés, ce qui a été
abandonné et pourquoi.
