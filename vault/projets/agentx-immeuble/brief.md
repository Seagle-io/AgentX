---
projet: agentx-immeuble
titre: AgentX immeuble : un étage par projet
statut: cadrage
objectif: la salle montre tous les projets ouverts comme les étages d'un immeuble, un chef unique au toit, et on pilote n'importe quel étage sans relancer
depot: /home/jdrac/Documents/Workspace/AgentX
produit: agentx
cree: 2026-10-15
tags: [projet]
---

# Brief — AgentX immeuble : un étage par projet

## Objectif
La page `:7777` affiche une coupe d'immeuble : 1 étage par projet ouvert, activité live par étage ; clic sur un étage → sa salle isométrique + son poste de pilotage, sans relancer la salle.

## Definition of Done du projet
- [ ] coupe : 1 étage par projet non clos, trié par activité récente ; toit = chef unique ; sous-sol = projets clos/archivés repliés
- [ ] chaque étage : agents actifs, compteurs en cours/revue/bloqué, alerte visible si bloqué ou sonde rouge
- [ ] clic étage → salle + poste de pilotage de ce projet ; actions `/api/run` portent le bon `projet`
- [ ] pool d'entreprise : 11 rôles communs, un agent apparaît à l'étage de sa tâche ; RH global inchangé
- [ ] todo du chef = agrégée sur tous les étages, chaque item étiqueté par projet
- [ ] 0 donnée inventée ; vérifié dans Chromium sur banc à ≥ 3 projets ; évaluateur `retenir` sur chaque lot

## Contraintes dures
- un seul chef (session terminal unique) — règle humaine
- pas de push, pas de migration ; vrai vault jamais muté par un test
- `bin/dash.py` relu au démarrage : relance salle après lot serveur
- compat : `agentx --projet X` (épingle) = étage ouvert par défaut

## Hors périmètre
- un chef par étage, sessions terminal multiples
- équipe fixe par étage, RH par projet
- immeuble 3D isométrique complet

## Hypothèses retenues
- état multi-projets = 1 `state.json` enrichi (`immeuble`) + état détaillé de l'étage choisi — à invalider si le calcul de N projets dépasse ~300 ms par cycle de 2 s
- étage choisi côté page (paramètre de requête), épingle = défaut — à invalider si le chef doit forcer l'étage de tous les spectateurs

## Questions ouvertes
- ∅ (entretien 2026-10-15 : vue coupe + zoom, chef unique au toit, pool, ouverts + sous-sol)

## Carte du terrain
| Quoi | Où | Note |
|---|---|---|
| choix du projet | `bin/dash.py:301-320` | épingle `run/projet` puis journal récent |
| actions par tâche | `bin/dash.py:515-530` | portent déjà `projet` |
| salle iso | `dash/dash.js:150-470` | construireSalle, postesSalle |
| poste de pilotage | `dash/dash.js:1040-1460` | pilote, palette, tiroir |

## Bilan
- livré : T001-T017 ; coupe d'immeuble, chef au toit, étage → salle + pilote, todo agrégée, liste bornée
- vérif navigateur T009 → 3 défauts (D1 action sur mauvais étage) corrigés T012 ; vue animée T011 évaluée T015, vérifiée T016 (résultats : leurs result.md)
- manques : 12 ; autre 5 · environnement 3 · outil 3 · coordonnee 1
- cache par signature : [[salle-cache-signature-mtime]] ; instantané : [[evaluer-sur-instantane]]
- reste : 5 `- [ ]` dans `todo.md` (signature `roles.json`, cache `personnel()`, 390 px, injection state.json, surHash)
