---
pack: T034
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T034 — Publication : fusionner le travail dans Seagle-io/AgentX, branche immeuble-entreprise

> Seule source de vérité de l'agent T034. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Fusionner, dans le worktree `.cache/agentx-pub` (branche `immeuble-entreprise` partie de `origin/main` = 0c02c48 du dépôt public Seagle-io/AgentX), le CODE du dépôt de travail (`bbc7c12..HEAD`, sans aucune donnée du vault) en gardant TOUTES les évolutions publiques ; prouver que tout tourne ; 1 commit local. Pas de push.

## Definition of Done
- [ ] ancêtre commun : `bbc7c12` (travail) ≡ `9de5525` (public) — vérifié à blanc par le chef sur vx.py, dash.py, dash.js, SKILL.md (identiques) ; CLAUDE.md, garde_bash.py diffèrent déjà à la base : coller leur diff de base
- [ ] fusion fichier par fichier par `git merge-file` (ours = 0c02c48 public, base = bbc7c12, theirs = HEAD travail) sur la liste « Chemins à fusionner » ; fichiers neufs côté travail → copiés ; fichiers neufs côté public (`bin/environnement.py`, `bin/test_garde_bash.py`, `environnement.exemple.json`, `outils-test/`, `.claude/agents/critique.md`, `.claude/skills/outils-test/`, `demo/`, `LICENSE`, `README.md`) → conservés tels quels ; tableau fichier → auto | conflits résolus (n) collé
- [ ] chaque conflit résolu en gardant les 2 intentions (ex. vx.py : `environnement` public + `virer/retenir/personnel/manques` travail ; garde_bash.py : règles publiques + règles travail ; garde_dispatch : liste de rôles = `roles.json`) ; 0 marqueur `<<<<<<<|>>>>>>>` : `rg -n "^(<<<<<<<|=======|>>>>>>>)" .cache/agentx-pub` → ∅
- [ ] rôle `critique` public intégré au registre `roles.json` (entrée cohérente avec son agent `.claude/agents/critique.md`) ; `python3 -c "…roles.erreur()"` → ∅
- [ ] CLAUDE.md, SKILL.md chef-de-projet, README.md : mentions publiques (outils-test, environnement, critique) ET travail (17+1 rôles, immeuble, RH, syndicat) présentes ; README : 1 section « Nouveautés » ≤ 15 lignes
- [ ] aucune donnée privée : `git -C .cache/agentx-pub diff --stat origin/main` ne contient AUCUN chemin `vault/projets/`, `vault/artefacts/`, `vault/archive/`, `vault/syndicat/`, `vault/connaissances/`, `.claude/skills/conventions-*`, `run/`, `supervision.json`, `.cache/` ; `rg -n -i "orthopro|geolens|ortho_test|seagle-site|192\.168\.|/home/jdrac" .cache/agentx-pub --glob '!outils-test/**' --glob '!.git/**'` → chaque occurrence listée et justifiée (exemple générique admis, chemin personnel ou donnée client → retirée)
- [ ] ça tourne, dans le worktree : `python3 -m py_compile bin/*.py` rc 0 ; `python3 bin/test_garde_bash.py` → sortie collée, 0 échec ; `node --check dash/dash.js` rc 0 ; `python3 bin/vx.py doctor` sur un vault banc (`.cache/banc-T034`, copie du worktree + `vx.py projet banc`) rc 0 ; `python3 bin/dash.py --json` → clés `immeuble`, `roles` (18) présentes ; salle `python3 bin/dash.py --port 7814 --no-open &` → `curl` 200, kill, 000
- [ ] 1 commit local dans le worktree, message en français, se terminant par `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>` ; `git -C .cache/agentx-pub log --oneline -2` collé ; `git -C .cache/agentx-pub status --short` → ∅
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.cache/agentx-pub/` | E | worktree de publication (dépôt public, branche immeuble-entreprise) |
| `.cache/banc-T034/` | E | banc de test |
| `bin/` | L | version travail (theirs) |
| `dash/` | L | version travail (theirs) |
| `.claude/` | L | version travail (theirs), SAUF `skills/conventions-*` |
| `roles.json` | L | registre travail |
| `CLAUDE.md` | L | version travail |
| `vault/_templates/` | L | gabarits travail |

## Contrats
Chemins à fusionner (diff travail `git diff --stat bbc7c12 HEAD`, 51 fichiers) :
```
bin/{agentx,dash.py,garde_bash.py,garde_dispatch.py,terminal.py,vx.py}       modifiés des 2 côtés → merge-file
bin/{rh.py,roles.py,sonnerie.py}                                           neufs travail → copie
dash/{dash.css,dash.js,index.html}                                         modifiés des 2 côtés → merge-file
.claude/agents/* (13 neufs travail ; architecte, eclaireur modifiés)       copie / merge-file
.claude/commands/{dispatch.md} merge-file ; {rh.md,syndicat.md} copie
.claude/settings.json merge-file ; .claude/skills/{SOURCES.md,frontend-design,langage-dense,webapp-testing} copie ; chef-de-projet/SKILL.md merge-file
roles.json copie puis + critique ; CLAUDE.md merge-file ; .gitignore merge-file
vault/_templates/{context.md} merge-file ; {env.md,pack-verificateur.md} copie
EXCLUS : .claude/skills/conventions-*, vault/taches_tmp, tout vault/ hors _templates
```
Méthode :
```
B=bbc7c12 ; T=/home/jdrac/Documents/Workspace/AgentX ; P=$T/.cache/agentx-pub
git -C $T show $B:<f> > /tmp/base ; cp $T/<f> /tmp/theirs ; git merge-file -L public -L base -L travail $P/<f> /tmp/base /tmp/theirs   # rc = nb conflits
```
(préférer un dossier sous `.cache/banc-T034/` à `/tmp`). Essai à blanc du chef : `git apply -3` → conflits dans bin/dash.py, bin/garde_dispatch.py, bin/vx.py, dash/dash.{css,js}, dash/index.html ; non applicable : CLAUDE.md, bin/garde_bash.py, vault/_templates/context.md.
Évolutions publiques à préserver (0c02c48 « Mise a jour Agentx », 151d153 « Ajout du critiqueur ») : `bin/environnement.py` (+418), `vx.py` (+647), `dash.py` (+148), `garde_bash.py` (+180), `test_garde_bash.py`, `outils-test/`, agent `critique`, skill `outils-test`.

## Décisions actées
- demande humaine 2026-10-15 : publier sur Seagle-io/AgentX (PUBLIC) — choix « code seul, branche + PR » : aucune donnée du vault, aucun skill de conventions client
- jamais de push par un agent (garde_bash) : l'humain pousse lui-même la branche
- en cas de doute sur une résolution : garder les 2 comportements derrière la même interface, noter en Écarts

## Hors périmètre
- `git push`, remote, PR ; la branche `main` du clone `~/Documents/AgentX` (ne pas y toucher)
- modifier le dépôt de travail (lecture seule)

## Environnement
- worktree créé par le chef : `git -C ~/Documents/AgentX worktree add .cache/agentx-pub immeuble-entreprise` (branche depuis origin/main 0c02c48) ; `~/Documents/AgentX` a des suppressions `.serena` non commitées sur `main` : sans effet sur le worktree
- garde_bash refuse `git branch -D`, `reset`, `checkout --`, `clean`, `stash`, push : travailler par merge-file / copie / Edit
- Python 3 stdlib ; node v22

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/agentx-pub/`, `.cache/banc-T034/`), Grep, `Bash(git -C .cache/agentx-pub:*)`, `Bash(git show:*)`, `Bash(git diff:*)`, `Bash(git merge-file:*)`, `Bash(python3:*)`, `Bash(node:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rm -rf .cache/banc-T034)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T034
projet: agentx-entreprise
statut: revue | bloque
---
## Livré
- chemin — auto | conflits résolus (n) — choix (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : commande de push exacte pour l'humain
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
