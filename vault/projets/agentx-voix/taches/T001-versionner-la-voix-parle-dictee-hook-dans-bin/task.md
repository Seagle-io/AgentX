---
id: T001
titre: Versionner la voix : parle, dictee, hook dans bin/
projet: agentx-voix
role: implementeur
statut: fait
deps: []
budget_tokens: 40k
modele: inherit
cree: 2026-10-15
maj: 2026-10-16
tags: [tache]
retenu: 2026-10-16
evaluation: T003
---
# T001 — Versionner la voix : parle, dictee, hook dans bin/

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
code voix hors dépôt, état figé sur ~/.cache — rien de testable ni de versionné

## Critère côté chef
`readlink -f ~/.local/bin/parle` → dépôt ; F8/F9 marchent après relance des démons ; `bin/dictee etat` → on|off
