---
tache: T002
statut: fait
---
## Livré
- contrat.md:13 C0 — 3 options, B retenue (registre + actions serveur)
- contrat.md:23 C1 — schéma 10 champs + 13 entrées, `livre_en`/`juge`/`objet` ajoutés
- contrat.md:68 C2 — `roles.py` 10 fonctions ; repli `.claude/agents/<nom>.md` ; rc 3
- contrat.md:101 C3 — STATUTS +`rejete`, STATUT_FERME, ORDRE_PIPELINE 7 ; 3 refus durs `set`
- contrat.md:139 C4 — 5 champs (remplace, remplacee_par, motif, retenu, evaluation) ; motif normalisé
- contrat.md:152 C5 — argparse verbatim ; virer 7 effets ; retenir exige éval ; `rh.personnel()` + format texte ; doctor +5
- contrat.md:278 C6 — result évaluateur (evalue, verdict retenir|virer, ## Motif) ; affichage integrer
- contrat.md:315 C7 — state.json : registre_erreur, roles enrichis, taches[].actions/eval*, personnel
- contrat.md:352 C8 — /api/run virer·retenir·personnel·integrer ; `_actions_tache` par statut ; 7 règles todo
- contrat.md:397 C9 — L3 postesSalle/majRegistre/rendreRH ; L4 pilote/palette/saisie/tiroir, ids, raccourcis
- contrat.md:470 C10 — L1 6 fichiers · L2 dash.py · L3→L4 dash.{js,css}+index.html
- decisions.md — bloc `## 2026-10-15 — contrat T002` 12 lignes
## Vérifié comment
- Grep `TODO-PACK|<!-- A REMPLIR` contrat.md → 0 occurrence
- Grep `^## C\d+` → 11 sections C0..C10
- Grep `"couleur": "#[0-9a-f]{6}"` → 13 valeurs, 13 distinctes
- NV — JSON C1 non parsé (Bash hors outils)
## Écarts
- ∅ lecture hors WL
- ajout ≠ pack : champ `juge` + `dep_satisfaite` — sans lui, tâche évaluateur (dep en revue) jamais ready
- ajout : `retenir` sans éval refusé sauf `--sans-eval` ; garde_dispatch refuse rôle tâche ≠ subagent_type
- `cmd_tache` défaut `--modele` = modele du registre (était inherit)
## Pour la suite
- L1 E: roles.json, bin/roles.py, bin/rh.py, bin/vx.py, bin/garde_dispatch.py, bin/sonnerie.py — § C1 C2 C3 C4 C5 C6 ; marqueur écrit `"TODO" + "-PACK"`
- L2 E: bin/dash.py — § C2 (signatures) C3 C5 (JSON rh) C6 C7 C8 ; L lecture roles.py/rh.py
- L3 E: dash/dash.js, dash/index.html, dash/dash.css — § C1 C7 C9-L3 ; vague 1
- L4 E: mêmes 3 fichiers — § C7 C8 C9-L4 ; vague 2 après L3 ; interdit alert/confirm/prompt
- interdit : front recalcule une permission ; `set` vers rejete ; page expose `--sans-eval`
## Retour sur le pack
- Manquait: dash.py:832 do_POST (forme réponse /api/run reprise de T001) ; dash.js:366-465 construireSalle hors plages indiquées (fichier en WL, lu)
- Inutile: vault/_templates/task.md (template inchangé)
