---
id: T027
titre: Branche git de travail affichée sur chaque étage
projet: seagle-pilotage
role: implementeur
statut: rejete
deps: [T025]
budget_tokens: 40k
modele: sonnet
cree: 2026-10-16
maj: 2026-10-16
tags: [tache]
effort: medium
motif: "_branche laisse fuir UnicodeDecodeError sur HEAD non UTF-8 (contrat illisible→None), state.json tombe ; ref hors refs/heads affichée 'détachée ref: re' ; git diff --stat non collé"
remplacee_par: T029
---

# T027 — Branche git de travail affichée sur chaque étage

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
1 ligne — raison dans le plan.

## Critère côté chef
Comment le chef vérifie sans relire le code.
