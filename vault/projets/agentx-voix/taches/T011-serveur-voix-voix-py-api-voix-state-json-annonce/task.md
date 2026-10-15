---
id: T011
titre: "Serveur voix : voix.py, /api/voix, state.json, annonces"
projet: agentx-voix
role: implementeur
statut: fait
deps: []
budget_tokens: 40k
modele: opus
cree: 2026-10-16
maj: 2026-10-16
tags: [tache]
remplace: T008
retenu: 2026-10-16
evaluation: T013
---
# T011 — Serveur voix : voix.py, /api/voix, state.json, annonces

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
la salle doit lire et piloter la voix, et sonnerie annoncer les agents

## Critère côté chef
`curl :7777/state.json | jq .voix` après relance salle ; un agent qui rend, mode ON → phrase entendue
