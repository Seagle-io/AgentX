---
id: T008
titre: "Serveur voix : voix.py, /api/voix, state.json, annonces"
projet: agentx-voix
role: implementeur
statut: rejete
deps: []
budget_tokens: 40k
modele: inherit
cree: 2026-10-16
maj: 2026-10-16
tags: [tache]
remplace: T002
motif: "voix.journal lève MemoryError si le journal pointe vers /dev/zero : read_text non borné ; pid/etat dictee lus sans borne ; pid recyclé non vérifié"
remplacee_par: T011
---
# T008 — Serveur voix : voix.py, /api/voix, state.json, annonces

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
la salle doit lire et piloter la voix, et sonnerie annoncer les agents

## Critère côté chef
`curl :7777/state.json | jq .voix` après relance salle ; un agent qui rend, mode ON → phrase entendue
