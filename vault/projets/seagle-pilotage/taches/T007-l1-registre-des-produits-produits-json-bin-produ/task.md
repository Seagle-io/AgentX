---
id: T007
titre: L1 registre des produits : produits.json + bin/produits.py
projet: seagle-pilotage
role: implementeur
statut: rejete
deps: [T002]
budget_tokens: 40k
modele: inherit
cree: 2026-10-16
maj: 2026-10-16
tags: [tache]
remplace: T003
motif: _valider : 3 messages hors format §C1 (cle en double, couleur en double, 0 entreprise) ; verifier lève RuntimeError sur sources.chemin ~user
remplacee_par: T010
---
# T007 — L1 registre des produits : produits.json + bin/produits.py

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
1 ligne — raison dans le plan.

## Critère côté chef
Comment le chef vérifie sans relire le code.
