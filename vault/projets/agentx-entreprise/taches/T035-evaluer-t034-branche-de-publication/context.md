---
pack: T035
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T035 — Evaluer T034 : branche de publication

> Seule source de vérité de l'agent T035. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger la branche `immeuble-entreprise` (worktree `.cache/agentx-pub`, fusion de T034) avant que l'humain la pousse sur le dépôt PUBLIC Seagle-io/AgentX : 0 donnée privée, 0 évolution publique perdue, tout tourne → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T034-publication-fusionner-le-travail-dans-seagle-io-/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] fuite de données — sur TOUT ce qui serait poussé (`git -C .cache/agentx-pub diff --name-only origin/main..HEAD` + contenu) : 0 chemin `vault/projets|artefacts|archive|syndicat|connaissances`, 0 `.claude/skills/conventions-*`, 0 `run/`, 0 `.cache/` ; `rg -n -i "orthopro|geolens|ortho_test|seagle-site|192\.168\.|/home/jdrac|julien@|password|token|secret" ` sur les fichiers du diff → chaque occurrence listée et jugée ; 1 donnée client ou chemin personnel ⇒ `[ ]`
- [ ] 0 perte publique : pour chaque fichier modifié des 2 côtés, les symboles/fonctions de `origin/main` (0c02c48) toujours présents dans la branche (`rg` sur les noms de fonctions publiques ajoutées par 151d153 et 0c02c48 : `environnement`, `critique`, règles de `garde_bash.py`, `outils-test`) ; liste collée
- [ ] 0 perte travail : fonctions du travail (`virer`, `retenir`, `personnel`, `manques`, `construire_etat(projet)`, `rendreTour`, `directionTour`, `rendreImmeuble`) présentes ; `roles.json` = 18 rôles affectables + `critique` cohérent
- [ ] ça tourne sur TON banc (copie du worktree) : `py_compile bin/*.py` rc 0 ; `python3 bin/test_garde_bash.py` 0 échec ; `node --check dash/dash.js` rc 0 ; `vx.py projet banc` + `tache` + `set` + `virer` + `retenir --sans-eval` + `doctor` rc 0 ; salle `--port 7816` → `state.json` avec `immeuble` et `roles` ; Playwright : tour visible, 0 erreur console
- [ ] historique propre : `git -C .cache/agentx-pub log --oneline origin/main..HEAD` → commit(s) de T034 seulement, message français + Co-Authored-By ; `git status --short` → ∅
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T034-publication-fusionner-le-travail-dans-seagle-io-/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T034-publication-fusionner-le-travail-dans-seagle-io-/result.md` | L | affirmations à réfuter |
| `.cache/agentx-pub/` | L | branche évaluée (lecture seule) |
| `.cache/banc-T035/` | E | copie de test |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T035
projet: agentx-entreprise
statut: fait | bloque
evalue: T034
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
Dépôt public : origin/main = 0c02c48 (« Mise a jour Agentx »), 151d153 (« Ajout du critiqueur »), base commune 9de5525 ≡ travail bbc7c12. Travail fusionné : `bbc7c12..45e9fbc` du dépôt `/home/jdrac/Documents/Workspace/AgentX`.

## Décisions actées
- dépôt PUBLIC : le moindre doute de fuite = `virer` (le chef corrige, rien n'est poussé)
- tu ne lances ni push ni `virer`/`retenir` ; tu ne modifies pas le worktree ; NV vaut `[ ]`

## Hors périmètre
- écrire dans `.cache/agentx-pub/` ; `git push`, remote, PR

## Environnement
- banc : `rm -rf .cache/banc-T035; cp -r .cache/agentx-pub .cache/banc-T035` (le `.git` du worktree est un fichier pointeur : travailler sur les fichiers, git en lecture via `git -C .cache/agentx-pub`)
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé ; `/api/run` sur banc seulement
- salle réelle :7777 : ne pas toucher ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, banc), `Bash(git -C .cache/agentx-pub log:*)`, `Bash(git -C .cache/agentx-pub diff:*)`, `Bash(git -C .cache/agentx-pub show:*)`, `Bash(git -C .cache/agentx-pub status:*)`, `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T035)`, `Bash(kill:*)`, `Bash(curl:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T035-evaluer-t034-branche-de-publication/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
