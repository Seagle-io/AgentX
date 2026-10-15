---
pack: T002
projet: agentx-entreprise
role: architecte
cree: 2026-10-15
---

# Pack T002 — Contrat : registre des rôles, rejet/remplacement, RH, API du poste de pilotage

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `vault/projets/agentx-entreprise/contrat.md` : contrats exécutables (schémas, signatures, sorties CLI, JSON, ids DOM) que 4 implémenteurs parallèles appliqueront sans se parler.

## Definition of Done
- [ ] `contrat.md` § C1 `roles.json` : schéma verbatim + contenu complet des 13 entrées (11 affectables + chef + vault), couleurs hexa distinctes
- [ ] § C2 `bin/roles.py` : signatures Python verbatim (`charger`, `affectables`, …) + comportement si fichier absent/invalide
- [ ] § C3 statuts : nouveau tuple `STATUTS`, `STATUT_OUVERT`, `ORDRE_PIPELINE` verbatim ; machine d'états (qui passe quoi → quoi)
- [ ] § C4 champs `task.md` ajoutés (nom, type, qui écrit) ; tâches anciennes sans champ = valides
- [ ] § C5 CLI `virer`, `retenir`, `personnel` : argparse verbatim, effets disque exacts, sortie texte exacte, codes retour, journal
- [ ] § C6 format `result.md` de l'évaluateur (frontmatter + sections) et ce que `integrer` en affiche
- [ ] § C7 `state.json` : clés ajoutées/modifiées (exemple JSON), dont `roles`, `personnel`, champs tâche
- [ ] § C8 `/api/run` : nouvelles actions (params, validation, argv construit) ; règles `_todo` ajoutées (prio, titre, cmd)
- [ ] § C9 front : ids DOM, noms de fonctions JS, raccourcis, placement des N postes de la salle, tiroir terminal, panneau RH, actions par ligne de tâche
- [ ] § C10 répartition : quel fichier appartient à quel lot (L1 CLI+gardes · L2 serveur · L3 front salle/RH · L4 front pilotage) — 0 fichier E partagé entre L1/L2 ; L3/L4 séquentiels
- [ ] `decisions.md` : bloc daté `## 2026-10-15 — contrat T002` ≤ 15 lignes
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/contrat.md` | E | livrable (à créer) |
| `vault/projets/agentx-entreprise/decisions.md` | E | append-only |
| `vault/projets/agentx-entreprise/taches/T001-reco-roles-statuts-hooks-salle-et-console/result.md` | L | carte complète, coordonnées |
| `bin/vx.py` | L | :31-33 rôles/statuts · :177 journaliser · :221 tache · :267 set · :327 integrer · :402 pack-lint · :555-599 argparse |
| `bin/dash.py` | L | :65-75 · :103-160 run · :258-420 état · :422-600 todo |
| `bin/garde_dispatch.py` | L | :20, :35-58 |
| `bin/sonnerie.py` | L | :27-57 |
| `dash/dash.js` | L | :1-90 · :150-300 salle · :520-600 tâches/todo · :980-1275 console |
| `dash/index.html` | L | 151 l, panneaux |
| `vault/_templates/task.md` | L | frontmatter tâche |

## Contrats
Faits établis (T001) :
```
vx.py:31  ROLES = ("eclaireur", "architecte", "implementeur", "verificateur", "scribe")
vx.py:32  STATUTS = ("a-faire", "pret", "en-cours", "bloque", "revue", "fait", "abandonne")
vx.py:33  STATUT_OUVERT = ("a-faire", "pret", "en-cours", "bloque", "revue")
dash.py:65 ROLES_META = [(cle, NOM, sous-titre, label-livrable), ...]  # chef, vault = pseudo-rôles
dash.py:75 ORDRE_PIPELINE = ["a-faire", "pret", "en-cours", "revue", "bloque", "fait"]
garde_dispatch : subagent_type ∈ ROLES sinon laisse passer ; task.md statut ∈ {pret,en-cours} ; pack-lint rc==0
evenements.jsonl : {"id","t","quoi":"agent-fini|agent-bloque","role","tid","statut"}
/api/run : POST {action,projet,tid,statut} ; ACTIONS_LECTURE=("board","ready","doctor","index") ; "set" ; "pack-lint"
frontmatter agent : name, description, tools, model (+ skills: liste, préchargés)
```
Rôles à déclarer (cle · modèle · livrable) :
```
eclaireur sonnet coordonnées · architecte opus contrats · implementeur inherit diff
verificateur opus défauts · scribe sonnet notes
evaluateur opus verdict · relecteur sonnet revue · testeur inherit tests
designer inherit maquettes/UI · securite opus audit · devops inherit build/env
chef (non affectable) · vault (non affectable)
```

## Décisions actées
- registre unique `roles.json` racine + `bin/roles.py` stdlib — 4 listes en dur aujourd'hui
- nouveau statut `rejete` (fermé, ≠ abandonne) — agent viré, trace gardée
- rôles « producteurs » (implementeur, testeur, designer, devops) livrent en `revue` ; seul `retenir` → `fait` — DoD gardée par évaluation
- eclaireur/architecte/scribe/verificateur/relecteur/securite/evaluateur livrent en `fait` direct — pas d'évaluation d'une reco
- `virer TID --motif` : TID → `rejete` ; crée tâche remplaçante même rôle (ou `--role`), mêmes deps, `--modele` optionnel ; copie context.md avec ligne marqueur de lint (`TODO` + `-PACK`, collés) en tête de « Décisions actées » citant le motif → pack-lint KO jusqu'à correction (règle 4)
- deps des tâches non faites pointant TID → réécrites vers le remplaçant
- RH = calcul depuis task.md (projets + archive), 0 stockage neuf ; par rôle et par modèle : livrées, retenues, virées, taux de renvoi
- évaluateur : 1 tâche = 1 tâche évaluée ; il ne lance pas `virer` (chef seul fait la comptabilité) ; salle propose les boutons
- `/api/run` gagne `virer`, `retenir`, `personnel`, `integrer` ; écrire pack/dispatcher restent hors page
- console legacy `dash.js:981-1072` + `dash.css:412-437` supprimée ; terminal xterm conservé, en tiroir
- poste de pilotage : actions par ligne de tâche + palette Ctrl/⌘K (actions liste blanche + « copier la commande » pour dispatch/pack) ; jamais `alert/confirm/prompt` — saisie inline
- salle : postes calculés pour N rôles depuis `roles.json` (grille), plus de coordonnées en dur par rôle

## Hors périmètre
- Écrire du code (.py/.js/.css/.html)
- Remplacement automatique sans chef
- Multi-sessions terminal
- Rouvrir une décision ci-dessus ; désaccord ⇒ ligne `## Écarts`, appliquer quand même

## Environnement
- Python 3 stdlib only ; JS sans build, xterm vendor `dash/vendor/`
- `rg` dispo ; salle possiblement arrêtée (routes lues dans le code)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
- contrat.md §C1..C10 — 1 ligne chacun
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : par lot L1..L4, fichiers E + § du contrat à recopier
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
