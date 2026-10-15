---
pack: T020
projet: agentx-voix
role: evaluateur
cree: 2026-10-16
---

# Pack T020 — Evaluer T014 (publication voix, non-fuite)

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dernier contrôle avant que l'humain pousse le commit `c91fc21` (branche `immeuble-entreprise`, dépôt PUBLIC Seagle-io/AgentX) : uniquement la voix, 0 donnée privée, 0 perte, tout tourne → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-voix/taches/T014-publier-la-voix-sur-la-branche-immeuble-entrepri/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] fuite, sur TOUT ce qui serait poussé (`git -C .cache/agentx-pub diff origin/immeuble-entreprise..HEAD`, contenu complet) : `rg -n -i "orthopro|kora|geolens|ortho_test|seagle-site|192\.168\.|/home/[a-z]+|jdrac|julien|sylvain|@seagle|password|token|secret|\.env"` → chaque occurrence listée et jugée (nom de variable, exemple générique, mot du code ≠ fuite) ; 1 donnée personnelle ou client ⇒ `[ ]`
- [ ] périmètre : fichiers du diff = exactement les 11 déclarés ; aucun hunk non voix (dispatch, produits, todo « aucun agent ») dans `bin/dash.py`, `CLAUDE.md`
- [ ] 0 perte : le reste de la branche publique intact (`git -C .cache/agentx-pub diff origin/immeuble-entreprise..HEAD --stat` limité aux 11 fichiers ; fonctions publiques de `bin/dash.py` toujours présentes : `rg` des noms collé)
- [ ] ça tourne sur TA copie (`.cache/eval-voix-T020/`) : `py_compile`, `node --check`, `test_garde_bash`, salle `--port 7825` + `AGENTX_VOIX_DIR` jetable → `state.json.voix` 6 clés ; Playwright : carte `#voix`, tour visible, 0 erreur console ; kill → 000
- [ ] `git -C .cache/agentx-pub status --short` → ∅ ; commit unique `c91fc21` en français avec Co-Authored-By
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-voix/taches/T014-publier-la-voix-sur-la-branche-immeuble-entrepri/context.md` | L | DoD de référence |
| `vault/projets/agentx-voix/taches/T014-publier-la-voix-sur-la-branche-immeuble-entrepri/result.md` | L | affirmations |
| `.cache/agentx-pub/` | L | branche évaluée (lecture seule) |
| `.cache/eval-voix-T020/` | E | copie de test |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T020
projet: agentx-voix
statut: fait | bloque
evalue: T014
verdict: retenir | virer
---
## Verdict
## DoD
## Motif
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
Déclaré par T014 : 11 fichiers, +937 −2 vs `origin/immeuble-entreprise` ; « chez Julien » ×4 remplacé par « sur la machine de référence » dans le guide.

## Décisions actées
- dépôt PUBLIC : le moindre doute de fuite = `virer` (rien n'est poussé)
- tu ne pousses rien, tu ne modifies pas le worktree ; NV vaut `[ ]`

## Hors périmètre
- écrire dans `.cache/agentx-pub/` ; push, remote, PR

## Environnement
- copie : `rm -rf .cache/eval-voix-T020; cp -r .cache/agentx-pub .cache/eval-voix-T020` (git en lecture via `git -C .cache/agentx-pub`)
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé (stub `text/event-stream` pour le flux), `/api/run` intercepté ; banc vide = mode démo → créer un projet dans la copie pour voir la tour
- jamais faire parler la machine (stub notify-send `.cache/T002/stub`, `AGENTX_VOIX_DIR` jetable)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-voix-T020/`), `Bash(git -C .cache/agentx-pub log:*)`, `Bash(git -C .cache/agentx-pub diff:*)`, `Bash(git -C .cache/agentx-pub show:*)`, `Bash(git -C .cache/agentx-pub status:*)`, `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-voix-T020)`, `Bash(kill:*)`, `Bash(curl:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-voix/taches/T020-evaluer-t014-publication-voix-non-fuite/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
