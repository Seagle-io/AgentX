---
description: Syndicat — conditions de travail des agents, cahier de revendications chiffré
argument-hint: [slug du projet | tous]
allowed-tools: Bash(python3 bin/vx.py:*)
---

Charge la compétence `chef-de-projet`, phase « Capitalisation ».

Périmètre : $ARGUMENTS (vide = tous les projets)

Personnel :
!`python3 bin/vx.py personnel`

Fais, dans cet ordre :
1. Crée la tâche `syndicat` (rôle `syndicat`) dans le projet cible (projet courant si tous) — périmètre : 1 projet ou tous.
2. Rédige son pack : périmètre, date, livrable `vault/syndicat/<AAAA-MM-JJ>-<perimetre>.md`.
3. Dispatche-la. Jamais d'appel `Agent` sans tâche vault en `pret` au pack validé.
4. À son retour : revendications acceptées → gabarit / packs types, sur accord humain.
