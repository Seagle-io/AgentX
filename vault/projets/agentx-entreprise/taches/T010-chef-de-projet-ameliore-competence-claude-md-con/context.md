---
pack: T010
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T010 — Chef de projet amélioré : compétence, CLAUDE.md, consigne, commandes, évaluateur

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Mettre la doctrine du chef à jour pour l'entreprise à 11 rôles et la boucle évaluer → retenir/virer → remplaçant : `SKILL.md` chef-de-projet, `CLAUDE.md`, consigne du terminal, `/dispatch`, nouvelle commande `/rh`, `evaluateur.md` aligné sur §C6, gabarit de pack.

## Definition of Done
- [ ] `SKILL.md` : tableau « rôles » → 11 lignes (rôle · pour · modèle · livre en) depuis `roles.json` §C1 ; titre « Les onze rôles »
- [ ] `SKILL.md` : nouvelle phase « Évaluation et remplacement » entre Intégration et Capitalisation : producteur → `set revue` → tâche evaluateur (`--dep`) → `retenir` | `virer --motif` → corriger le pack de la remplaçante (lint bloque) → redispatcher ; second renvoi sur même tâche ⇒ `--modele opus` ; `personnel` taux ≥ 50 % ⇒ revoir le pack type du rôle
- [ ] `SKILL.md` : section « Skills » : par rôle préchargé (testeur→webapp-testing, designer→frontend-design) ; par projet, le pack nomme le skill à charger (`conventions-geolens|seagle|orthopro`) en § Environnement ; `langage-dense` pour le chef avant d'écrire un pack
- [ ] `SKILL.md` : « Ce qui rend le chef efficace » ≤ 10 lignes, depuis « Leçons » ci-dessous
- [ ] `CLAUDE.md` : section Rôles → 11 rôles ; commandes `virer`, `retenir`, `personnel` ajoutées au bloc bash ; ligne `/rh` dans Commandes ; règle 4 complétée « mécanisé : `virer` crée la remplaçante, lint bloque tant que le pack n'est pas corrigé » ; `roles.json` = registre unique
- [ ] `bin/terminal.py` : seule la constante `CONSIGNE_CHEF` (`:24-40`) modifiée — ajoute boucle évaluer/retenir/virer et `personnel` ; `python3 -c "import ast;ast.parse(open('bin/terminal.py').read())"` rc 0 ; `git diff -U0 bin/terminal.py` → hunks dans `:24-45` seulement
- [ ] `.claude/commands/dispatch.md` : étape 5 → producteurs en `revue` puis tâche evaluateur ; prompt de dispatch au format dense (cf. « Contrats »)
- [ ] `.claude/commands/rh.md` neuf : frontmatter comme dispatch.md (`description`, `allowed-tools: Bash(python3 bin/vx.py:*)`) ; injecte `!python3 bin/vx.py personnel` ; rend : rôles à taux ≥ 50 %, tâches à virer/retenir (`integrer`), proposition de correction de pack type
- [ ] `.claude/agents/evaluateur.md` : format result.md = §C6 verbatim (`verdict: retenir | virer`, sections `## Verdict`, `## DoD`, `## Motif`…) ; `rg -n "retenu|vire\b|Grille DoD|Correctifs du pack" .claude/agents/evaluateur.md` → ∅
- [ ] `vault/_templates/context.md` § Environnement : 2 lignes de « Leçons » L1-L2 ajoutées ; § Budget inchangé
- [ ] `git diff --stat` des 7 chemins E collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.claude/skills/chef-de-projet/SKILL.md` | E | doctrine du chef |
| `CLAUDE.md` | E | règles du dépôt |
| `bin/terminal.py` | E | `:24-40` CONSIGNE_CHEF seulement |
| `.claude/commands/dispatch.md` | E | boucle d'évaluation |
| `.claude/commands/rh.md` | E | neuf |
| `.claude/agents/evaluateur.md` | E | aligner §C6 |
| `vault/_templates/context.md` | E | leçons gabarit |
| `vault/projets/agentx-entreprise/contrat.md` | L | **§C1 L46-66 · §C3 L101-137 · §C5 L152-276 · §C6 L278-313** |

## Contrats
Prompt de dispatch dense (à mettre dans dispatch.md et SKILL.md) :
```
T002 · projet <slug>
pack: vault/projets/<slug>/taches/T002-<slug>/context.md
→ lire en entier · exécuter · result.md même dossier, sections « Format de sortie », dense
rien d'autre du vault
```
CLI (L1, en cours d'implémentation en parallèle — décrire, ne pas lancer) :
```
python3 bin/vx.py virer <TID> --motif "<1 ligne ≤ 200>" [--role R] [--modele M] --projet <slug>
python3 bin/vx.py retenir <TID> --projet <slug> [--sans-eval]
python3 bin/vx.py personnel [--projet <slug>] [--json]
python3 bin/vx.py tache "Evaluer <TID>" --projet <slug> --role evaluateur --dep <TID>
```
Leçons (projets 2026-10, à intégrer) :
```
L1 contenu citant des commandes interdites (push, migrations…) → outil Write ; garde_bash scanne tout le texte Bash, heredoc compris
L2 tâche « copie verbatim » → `diff` dans les outils autorisés
L3 contrat > 60 lignes → contrat.md en L avec plages `:L1-L2` par §, pas recopié (plafond 220 l du pack)
L4 lots parallèles sur fichiers disjoints ; même fichier E → vagues successives
L5 vérif sur banc jetable (`.cache/banc-<T>`) dès que la tâche mute le vault ou un état partagé
L6 fait constatable (branche, version, chemin) → le chef le constate lui-même, jamais une question à l'humain
L7 nouveaux agents (.claude/agents) visibles seulement après redémarrage de session
L8 un remplaçant n'hérite jamais du même pack : motif de renvoi recopié dans ses Contrats/DoD
```

## Décisions actées
- producteurs (implementeur, testeur, designer, devops) livrent en `revue` ; seul `retenir` → `fait` — contrat §C3
- l'évaluateur ne lance ni `virer` ni `retenir` — le chef tient la comptabilité
- pas de remplacement automatique — choix humain du cadrage
- langage dense entre agents ; français courant chef ↔ humain — inchangé

## Hors périmètre
- Code Python/JS hors constante `CONSIGNE_CHEF`
- Autres agents `.claude/agents/*` que evaluateur.md
- Lancer `virer`/`retenir` (en cours d'implémentation)
- Réécrire les règles existantes de CLAUDE.md : on ajoute/complète

## Environnement
- `garde_bash` refuse tout Bash dont le texte cite git push / migrations : écrire avec Write/Edit
- SKILL.md actuel : tableau rôles `:16-22` ; phases 1-6 ; ne pas dépasser +80 lignes nettes
- arbre partagé : 3 implémenteurs écrivent `bin/vx.py`, `bin/dash.py`, `dash/*` en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(python3 -c:*)`, `Bash(git diff:*)`, `Bash(rg:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T010
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
