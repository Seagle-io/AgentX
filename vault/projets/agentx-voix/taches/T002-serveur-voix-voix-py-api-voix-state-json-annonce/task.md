---
id: T002
titre: Serveur voix : voix.py, /api/voix, state.json, annonces
projet: agentx-voix
role: implementeur
statut: rejete
deps: []
budget_tokens: 40k
modele: inherit
cree: 2026-10-15
maj: 2026-10-16
tags: [tache]
motif: "voix.etat lève sur dictee.pid énorme (OverflowError) et dictee.etat binaire (UnicodeDecodeError) : state.json entier en erreur ; pid 0 ou -1 lu comme dictee vivant, os.kill(-1) possible"
remplacee_par: T008
---
# T002 — Serveur voix : voix.py, /api/voix, state.json, annonces

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
la salle doit lire et piloter la voix, et sonnerie annoncer les agents

## Critère côté chef
`curl :7777/state.json | jq .voix` après relance salle ; un agent qui rend, mode ON → phrase entendue
