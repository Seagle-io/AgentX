---
pack: T036
projet: agentx-entreprise
role: implementeur
cree: 2026-10-16
---

# Pack T036 — Dispatch mécanisé et chemins personnels détectés

> Seule source de vérité de l'agent T036. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre impossibles deux incidents du 2026-10-16 : (1) une tâche passée `en-cours` par le chef mais jamais confiée à un agent (agentx-voix T009, seagle-pilotage T007) ; (2) un outil livré avec des chemins personnels en dur (`#!/home/jdrac/...` dans `bin/parle`, `bin/dictee`) — par la mécanique (hooks, doctor, todo), pas par une consigne.

## Definition of Done
- [ ] dispatch = seule voie vers `en-cours` : `bin/garde_dispatch.py`, quand il ACCEPTE un appel `Agent`, passe la tâche `pret → en-cours` (via `vx.py set`, jamais à la main) et ajoute `{"t","projet","tid","role","quoi":"dispatch"}` à `run/evenements.jsonl` ; `vx.py set --statut en-cours` à la main → refusé avec message « en-cours = dispatch : lance l'agent (le hook passe la tâche en-cours) » sauf `--force` (journalisé)
- [ ] filet : `vx.py doctor` et la todo du chef (`_todo` de `bin/dash.py`) signalent toute tâche `en-cours` sans événement `dispatch` correspondant (même projet + tid) ou `pret` depuis > 15 min sans dispatch → item prio 1 « T0xx prête mais aucun agent lancé — dispatcher » ; prouvé sur banc
- [ ] chemins personnels : `vx.py doctor` signale tout fichier suivi par git sous `bin/`, `dash/`, `outils/`, `.claude/`, `docs/` contenant `/home/<nom>/` ou un shebang absolu hors `/usr/bin/env` (`git ls-files` + lecture, exclusions : `vault/`, `.cache/`) ; sur le vrai dépôt → liste actuelle collée (attendu : `bin/parle:1`, `bin/dictee:1`, …)
- [ ] doctrine : `.claude/skills/chef-de-projet/SKILL.md` phase 4 + `CLAUDE.md` § Réflexes : 1 ligne chacun — « ne jamais passer une tâche en-cours à la main : le hook le fait au dispatch » ; gabarit `vault/_templates/context.md` § Environnement : 1 ligne « livrable exécutable = portable : 0 `/home/<nom>`, shebang `/usr/bin/env`, dépendance matérielle (GPU…) avec repli »
- [ ] banc `.cache/T036/` : 1) Agent accepté (hook appelé avec un stdin forgé) → tâche `en-cours` + événement ; 2) `set en-cours` à la main → refus ; 3) tâche `pret` vieillie (mtime) → todo prio 1 ; 4) fichier avec `/home/x/` → doctor le liste ; sorties collées
- [ ] `python3 -m py_compile bin/garde_dispatch.py bin/vx.py bin/dash.py` rc 0 ; `./bin/agentx doctor` sur le vrai vault : nouveaux signalements listés (pas d'échec bloquant de la salle)
- [ ] `git diff --stat` des fichiers E collé ; `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/garde_dispatch.py` | E | `main :38-75` (accepte → passe en-cours + événement) |
| `bin/vx.py` | E | `cmd_set` (refus en-cours manuel, `--force`), `cmd_doctor` (dispatch, chemins perso) |
| `bin/dash.py` | E | `_todo :712-800` (item « prête mais aucun agent ») |
| `.claude/skills/chef-de-projet/SKILL.md` | E | phase 4, 1 ligne |
| `CLAUDE.md` | E | § Réflexes, 1 ligne |
| `vault/_templates/context.md` | E | § Environnement, 1 ligne |
| `bin/sonnerie.py` | L | format de `run/evenements.jsonl` |
| `.cache/T036/` | E | banc |

## Contrats
Hook PreToolUse (stdin) : `{"tool_name":"Agent","tool_input":{"subagent_type":"…","prompt":"T0xx · projet <slug>\npack: vault/projets/<slug>/taches/T0xx-…/context.md …"}}` ; refus = JSON `hookSpecificOutput` + exit 0 (existant, `refuser()`).
Événement existant (sonnerie) : `{"id","t","quoi","role","tid","statut","verdict","projet"}` dans `run/evenements.jsonl` — ajouter `quoi: "dispatch"` (même fichier, mêmes clés, `statut: "en-cours"`, `verdict: ""`).
Incidents : agentx-voix T009 (`en-cours` 00:20, aucun agent avant 01:05, signalé par l'humain) ; seagle-pilotage T007 (`en-cours` sans agent jusqu'au message suivant du chef).

## Décisions actées
- demande humaine 2026-10-16 : « fais en sorte que cette problématique ne se reproduise jamais »
- le hook échoue OUVERT pour le passage en-cours (une erreur d'écriture n'empêche jamais un dispatch accepté) mais refuse comme avant ce qui doit être refusé
- `--force` existe pour le chef (reprise après crash), toujours journalisé

## Hors périmètre
- `bin/voix.py` (agentx-voix T011 en cours), `bin/parle`, `bin/dictee` (agentx-voix T012 en parallèle : c'est elle qui les rend portables), `dash/*`

## Environnement
- banc : `B=.cache/T036/banc; rm -rf $B; mkdir -p $B/vault $B/.claude $B/run; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; `ROOT` = parent de `bin/`
- les hooks s'appliquent à TA session : ne casse pas `garde_dispatch.py` réel avant d'avoir prouvé la version banc (Edit en une fois, py_compile immédiat)
- `garde_bash` refuse push/migrations ; `grep -nE` si `rg` absent

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/T036/banc)`, `Bash(git ls-files:*)`, `Bash(git diff:*)`, `Bash(grep:*)`, `Bash(touch:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T036
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
