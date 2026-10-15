---
tache: T002
projet: seagle-pilotage
statut: fait
---
## Livré
- [[contrat]] contrat.md:L14-L38 — C0 options R1-R3, E0-E2, migration 11
- contrat.md:L40-L116 — C1 produits.json verbatim, API, validation
- contrat.md:L118-L176 — C2 state.immeuble par produit, sélection, perf
- contrat.md:L178-L194 — C3 front : hash `#/<cle>/<projet>`, puces projets
- contrat.md:L196-L205 — C4 CLI : `--produit`, `rattacher`, doctor
- contrat.md:L207-L247 — C5 porte publier P0-P5, ids, acquits
- contrat.md:L249-L273 — C6 captures : runner, worktree, avant/après
- contrat.md:L275-L282 — C7 étage Seagle entreprise, rôles métier
- contrat.md:L284-L289 — C8 cohabitation agentx-voix
- contrat.md:L291-L333 — C9 lots, vagues, DoD commandes
- contrat.md:L335-L341 — point de non-retour
- decisions.md — entrée `2026-10-16 — étage = produit …` (append)
## Vérifié comment
Grep `^` count contrat.md → `341`
Grep `TODO-PACK` contrat.md → 0 occurrence (seules lignes `^## ` : 14 40 118 178 196 207 249 275 284 291 335)
Bash ∅ dans les outils → 0 commande git/python lancée ; valeurs NV marquées dans C1 et vérifiées en DoD L1
## Écarts
- lecture hors WL: Glob `{bin/*,tests/**/*.py,outils/**}` — collision de noms `bin/produits.py`, `bin/publier.py` ; `tests/`, `outils/` absents
## Pour la suite
- vague 1 : L1 registre (implementeur) ∥ L6 captures (devops) — contrat L40-L116 ; L6 + L249-L273
- vague 2 : L2 CLI (L196-L205 + migration L32-L37) ∥ L3 porte (L207-L247 + signatures L85-L107)
- vague 3 : L4 serveur (L118-L176), après L2 retenu et C8 vérifié ; ∥ L7 tests (C1 + C5)
- vague 4 : L5 front (L178-L194 + forme L120-L152) ; puis verificateur Chromium ; verificateur porte après L3
- 1 evaluateur `--dep` par lot ; WL de chaque lot = C9 (≤ 6 fichiers)
- interdit : liste de projets dans produits.json ; déplacer `vault/projets/<slug>` ; `git fetch`/écriture git dans publier ; captures dans l'arbre de travail de l'humain
- L6 : chef localise le fichier de routes ortho-front avant pack (NV)
- C8 : avant L4/L5, `./bin/agentx board --projet agentx-voix` → 0 tâche en-cours/revue sur `dash.*`
## Retour sur le pack
- Manquait: outil Bash absent malgré `Bash(python3:*)`, `Bash(git -C:*)` annoncés → 0 mesure, 0 vérif git ; liste des fichiers E des tâches agentx-voix (C8 générique) ; existence de `vault/projets/geolens-*/env.md` ; branche de publication AgentX
- Inutile: ∅
