---
id: T012
titre: "Voix portable : sans chemin personnel, repli CPU, installable par Sylvain"
projet: agentx-voix
role: implementeur
statut: rejete
deps: []
budget_tokens: 40k
modele: inherit
cree: 2026-10-16
maj: 2026-10-16
tags: [tache]
motif: "bin/dictee:81 get_cuda_device_count non protégé : s'il lève, RuntimeError au lieu du repli CPU int8 ; WhisperModel cuda qui échoue sans repli ; guide L85 faux pour parle_hook.py"
remplacee_par: T016
---

# T012 — Voix portable : sans chemin personnel, repli CPU, installable par Sylvain

Fiche de pilotage (lue par `vx`). L'agent lit [[context]], écrit [[result]].

## Pourquoi
1 ligne — raison dans le plan.

## Critère côté chef
Comment le chef vérifie sans relire le code.
