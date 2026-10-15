---
projet: agentx-entreprise
titre: AgentX entreprise : rôles, remplacement des agents défaillants, skills, salle de pilotage
statut: cadrage
objectif: AgentX tourne comme une entreprise — 11 rôles, tout livrable évalué, un agent KO est viré et remplacé par une tâche neuve, la salle pilote (actions, palette, RH) sans passer par le terminal
depot: /home/jdrac/Documents/Workspace/AgentX
cree: 2026-10-15
tags: [projet]
---

# Brief — AgentX entreprise : rôles, remplacement des agents défaillants, skills, salle de pilotage

> Rempli par le chef après l'entretien. Section vide = question à poser, pas hypothèse.

## Objectif
Un livrable KO contre sa DoD est « viré » (statut `rejete`, motif écrit) et un remplaçant part sur un pack corrigé ; la salle montre l'équipe, le dossier RH et pilote les tâches en un clic.

## Definition of Done du projet
- [ ] 6 rôles neufs (evaluateur, relecteur, testeur, designer, securite, devops) déclarés une seule fois (`roles.json`) et reconnus par vx, gardes, sonnerie, salle
- [ ] `vx.py virer|retenir|personnel` + statut `rejete` ; remplaçant lié (`remplace`/`remplace_par`), pack copié bloqué par lint tant que non corrigé
- [ ] salle : silhouettes pour N rôles, panneau RH (livrés/virés par rôle et modèle), actions par tâche, palette ⌘K, terminal chef en tiroir, console morte retirée
- [ ] skills officiels (frontend-design, webapp-testing) + skills maison (langage dense, conventions Geolens/Seagle/OrthoPro) installés et préchargés par rôle
- [ ] compétence chef-de-projet, CLAUDE.md, commandes et consigne du chef à jour
- [ ] chaque implémentation vérifiée (verificateur) ou évaluée (evaluateur) avec sortie collée

## Contraintes dures
- Python stdlib seul, JS sans build (vendor xterm déjà là) — système zéro dépendance
- Jamais de donnée inventée dans la salle ; sans source → « aucune donnée »
- Règle 4 tenue : un remplaçant ne repart jamais avec le même pack (lint bloque)
- Liste blanche serveur stricte ; écrire un pack et dispatcher restent côté Claude Code
- Pas de push git (hook) ; le chef commite en local
- Les projets clos/en cours du vault restent lisibles (tâches sans nouveaux champs = OK)

## Hors périmètre
- Remplacement automatique sans le chef (choix humain : évaluation puis remplaçant)
- Multi-sessions chef
- Refonte visuelle complète de la salle hors panneaux cités

## Hypothèses retenues
- frontmatter subagent `skills:` précharge les skills — à invalider si l'agent ne les voit pas
- dossier RH dérivé des task.md (0 nouveau stockage) — à invalider si besoin d'historique hors vault

## Questions ouvertes
- ∅

## Carte du terrain
| Quoi | Où | Note |
|---|---|---|
| rôles en dur | `bin/vx.py:31` `bin/garde_dispatch.py:20` `bin/sonnerie.py:27` `bin/dash.py:65` | 4 listes à unifier |
| rôles front | `dash/dash.js:8,262,420-428` | couleur, poste, bureau |
| statuts | `bin/vx.py:32-33` `bin/dash.py:75` `dash/dash.js:12` | + tuples littéraux |
| todo | `bin/dash.py:422` | déduite du vault |
| /api/run | `bin/dash.py:103,133` | liste blanche |
| terminal | `dash/dash.js:1073-1270` | xterm, session unique |
| console morte | `dash/dash.js:981-1072` `dash/dash.css:412-437` | à retirer |
| reco | [[T001-reco-roles-statuts-hooks-salle-et-console/result]] | |

## Bilan
- livré : T001-T033 ; 11 → 17 rôles (+juriste, tresorier, produit, marketing, rssi, syndicat) via `roles.json` ; virer/retenir/personnel ; salle RH/palette/tiroir ; skills ; fiches env.md
- renvois : T026 (env.md coupe § Environnement), T030 (fence non fermée) ; T032 opus retenu → [[agentx-remplacement-agent-virer]]
- manques : 28 ; autre 10 · contrat 6 · coordonnee 4 · baseline 3 · outil 2 · wl 2 · env 1
- leçons → `_templates/context.md`, `pack-verificateur.md` ; [[evaluer-sur-instantane]]
- syndicat : R1-R5 appliquées ; R6-R10 refusées (`vault/syndicat/2026-10-15-tous.md`)
- reste : 12 `- [ ]` dans `todo.md` (défauts 390 px, `--motif`, orphelin task.md, `pack-lint --fichier`, `_blocs_code`)
