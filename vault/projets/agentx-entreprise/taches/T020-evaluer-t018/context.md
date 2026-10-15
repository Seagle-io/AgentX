---
pack: T020
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T020 — Evaluer T018

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T018 (verrou tache/virer, motif échappé, doctor id en double, projet par défaut) contre la DoD de SON pack, case par case, preuves re-exécutées sur TON banc → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T018-correctifs-serveur-virer-concurrent-motif-echapp/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi sur `.cache/banc-T020` (jamais recopiée du result.md évalué, jamais le banc de T018)
- [ ] S1 rejoué ≥ 3 fois (course non déterministe) : `virer A ∥ virer B` et `virer A ∥ virer A` ; toute occurrence d'id dupliqué ou de 2 rc 0 ⇒ `[ ]`
- [ ] affirmations du `result.md` évalué (« Vérifié comment ») : ≥ 3 re-jouées, écart → case `[ ]`
- [ ] périmètre : `git diff --stat -- bin/` → `bin/vx.py`, `bin/dash.py` seulement ; `git status --short bin/` sans autre fichier
- [ ] écarts déclarés par T018 (mkdir déplacé après contrôle deps ; `"` final du motif retiré) jugés : cassent-ils un consommateur ou une décision actée ?
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T018-correctifs-serveur-virer-concurrent-motif-echapp/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T018-correctifs-serveur-virer-concurrent-motif-echapp/result.md` | L | affirmations à réfuter |
| `bin/vx.py` | L | livrable évalué |
| `bin/dash.py` | L | livrable évalué |
| `.cache/banc-T020/` | E | banc jetable |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6) :
```markdown
---
tache: T020
statut: fait | bloque
evalue: T018
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
Le lot T018 n'est PAS commité : son diff = `git diff -- bin/` (arbre vs HEAD b0109a2). `dash/*` modifié par T017 (retenue) : hors évaluation. `vault/projets/agentx-entreprise/.verrou` et `.gitignore` : créés par le chef, hors évaluation.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` sur le vrai vault — le chef tient la comptabilité ; sur ton banc, tout est permis
- `NV` vaut `[ ]` — « non vérifié » = « non fait »
- tu ne corriges rien — constat seulement

## Hors périmètre
- Modifier un fichier hors `.cache/banc-T020/` et ton `result.md`
- Évaluer `dash/*` ; juger le style : seule la DoD compte

## Environnement
- banc : `B=.cache/banc-T020; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; `ROOT` = parent de `bin/` → le banc lit `$B/vault`
- fixtures : `python3 $B/bin/vx.py projet banc --titre Banc` ; `tache "<t>" --projet banc --role implementeur` ; `set Tx --statut en-cours --projet banc` (pack non vide requis pour `pret` : écrire un context.md lintable dans le banc) ; éval virer = tâche evaluateur `--dep`, result.md frontmatter `verdict: virer` + `## Motif` 1 ligne, puis `set fait`
- salle-banc : `python3 $B/bin/dash.py --port 7797 --no-open &` ; POST `/api/run` exige `X-AgentX-Jeton: <state.json.jeton>` + `Content-Type: application/json` ; kill par pid, `curl` → 000 à la fin ; NE PAS POST `/api/term/*` (socket de la vraie session chef)
- vrai vault : `./bin/agentx doctor` en lecture seule autorisé ; jamais muté
- `garde_bash` refuse tout Bash citant push/migrations ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, banc), `Bash(python3:*)`, `Bash(bash -n:*)`, `Bash(bash -c:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T020)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T020-evaluer-t018/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
