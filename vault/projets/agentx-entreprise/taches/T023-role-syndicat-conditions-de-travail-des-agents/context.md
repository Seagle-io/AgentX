---
pack: T023
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T023 — Rôle syndicat : conditions de travail des agents

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer le rôle `syndicat` : un agent qui évalue les conditions de travail des autres agents (packs, budgets, whitelists, blocages, renvois) à partir des traces du vault, et rend un cahier de revendications chiffré — comment faire travailler les agents de la manière la plus efficace. Entrée `roles.json`, agent `.claude/agents/syndicat.md`, commande `/syndicat`, doctrine à jour.

## Definition of Done
- [ ] `roles.json` : entrée `syndicat` (cf. Contrats) insérée après `rssi`, avant `vault` ; `roles.erreur()` → ∅ ; couleur à distance RGB ≥ 60 de toutes (script collé)
- [ ] `.claude/agents/syndicat.md` : frontmatter (`name`, `description`, `tools`, `model`) ; corps = ossature de `.claude/agents/evaluateur.md` (rôle · interdits · Langage dense · Discipline de contexte · Méthode · Sortie) ≤ 80 lignes ; contient les sources, indicateurs et règles du bloc Contrats (vérifiable par `rg`)
- [ ] `.claude/commands/syndicat.md` neuf : frontmatter comme `.claude/commands/rh.md` (`description`, `allowed-tools`) ; injecte `!python3 bin/vx.py personnel` ; demande au chef de créer la tâche `syndicat` (périmètre : 1 projet ou tous) et de la dispatcher — jamais d'appel Agent sans tâche vault
- [ ] `SKILL.md` : titre « Les dix-sept rôles » ; 1 ligne au tableau ; phase Capitalisation : 1 ligne « syndicat après 2 vagues ou taux de renvoi ≥ 50 % : ses revendications acceptées → gabarit / packs types »
- [ ] `CLAUDE.md` § Rôles : « 17 rôles » + `syndicat` décrit (≠ `scribe`, ≠ `evaluateur`) ; ligne `/syndicat` dans § Commandes
- [ ] essai à blanc : `python3 bin/vx.py personnel --json` et `rg -c "^## Retour sur le pack" vault/projets/*/taches/*/result.md | wc -l` → sorties collées (données que l'agent lira : prouver qu'elles existent)
- [ ] `python3 -c "import sys;sys.path.insert(0,'bin');import roles;print(roles.est_role_agentx('syndicat'))"` → True ; `./bin/agentx doctor` rc 0
- [ ] `git diff --stat` des fichiers E collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `roles.json` | E | registre |
| `.claude/agents/syndicat.md` | E | neuf |
| `.claude/commands/syndicat.md` | E | neuf |
| `.claude/commands/rh.md` | L | gabarit de commande |
| `.claude/agents/evaluateur.md` | L | ossature d'agent |
| `.claude/skills/chef-de-projet/SKILL.md` | E | tableau rôles `:15-37`, phase Capitalisation |
| `CLAUDE.md` | E | § Commandes, § Rôles `:72-86` |
| `bin/roles.py` | L | API (`erreur`, `est_role_agentx`) |

## Contrats
Entrée `roles.json` :
```
{"cle": "syndicat", "nom": "SYNDICAT", "sous": "conditions de travail des agents", "livrable": "revendications", "couleur": "#……", "modele": "opus", "affectable": true, "livre_en": "fait", "juge": false, "objet": "cahier"}
```
Frontmatter agent :
```
tools: Read, Grep, Glob, Bash, Write    model: opus
```
Sources (lecture seule, rien d'autre) :
```
python3 bin/vx.py personnel [--projet X] [--json]      taux de renvoi par rôle/modèle
python3 bin/vx.py integrer --projet X                  Écarts, Vérifié comment, Pour la suite
python3 bin/vx.py pack-lint <TID> --projet X           taille pack, tokens, WL
rg sur vault/projets/*/taches/*/result.md              « ## Retour sur le pack » (Manquait / Inutile), « lecture hors WL », « NV »
vault/projets/*/journal.md                             durées (création → fait), blocages, renvois
task.md frontmatter                                    statut, remplace / remplacee_par, modele
```
Indicateurs (chacun chiffré, avec sa source) :
```
charge     : lignes et tokens par pack ; WL moyenne ; packs > 180 lignes
autonomie  : lectures hors WL par tâche ; « Manquait » non vide (%) ; questions BLQ
qualité    : taux de renvoi par rôle et par modèle ; NV dans « Vérifié comment »
flux       : tâches bloquées, durée bloquée, attente en revue sans évaluateur
répétition : même « Manquait » sur ≥ 2 tâches → manque du gabarit, pas de l'agent
```
Règles :
```
défend l'agent : un échec dont la cause est le pack (Manquait, WL trop étroite, contrat absent) est imputé au pack, jamais à l'agent
revendication = constat chiffré + source (chemin:L ou commande) + correction proposée (gabarit, pack type, budget, modèle, découpe) + gain attendu
jamais d'édition des packs, gabarits ou agents : il propose, le chef décide
jamais de donnée inventée : indicateur sans source → « ∅ donnée »
livrable : vault/syndicat/<AAAA-MM-JJ>-<perimetre>.md (Obsidian, frontmatter tags: [syndicat]) + result.md
```

## Décisions actées
- demande humaine 2026-10-15 : « agent syndicat qui évalue les conditions de travail des autres agents et trouve la manière la plus optimisée pour qu'ils travaillent »
- `syndicat` ≠ `scribe` (capitalise le savoir) ≠ `evaluateur` (juge un livrable) ≠ RH `personnel` (statistique brute) ; livre en `fait` (conseil, pas production)

## Hors périmètre
- `dash/*` (glyphe `cahier` : tâche T010 agentx-immeuble en parallèle) ; `bin/*`
- lancer l'agent syndicat (tâche suivante, après redémarrage)

## Environnement
- `garde_bash` refuse tout Bash dont le texte cite push/migrations : écrire avec Write/Edit, jamais heredoc
- nouvel agent visible après redémarrage de session (ou rechargement des agents)
- arbre partagé : `dash/*` modifié par T010 en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(wc:*)`, `Bash(git diff:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T023
projet: agentx-entreprise
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
