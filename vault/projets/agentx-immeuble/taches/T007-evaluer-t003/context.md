---
pack: T007
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T007 — Evaluer T003

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T003 (serveur : état immeuble, étage par `?projet=`, todo agrégée, cache) contre la DoD de SON pack et le contrat, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T003-l1-serveur-etat-immeuble-etage-par-projet-todo-a/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] DoD L1 `contrat.md:325-342` : les 6 commandes re-jouées, sorties collées
- [ ] perf C7 re-mesurée 3 fois (froid, chaud médiane) ; chaud > 120 ms ⇒ `[ ]`
- [ ] cache : ta propre preuve (compteur `Path.read_text` ou `open`) : 2e appel chaud → 0 `context.md`/`result.md` relu ; modification d'un `task.md` d'un étage sur TON banc → seul ce bloc recalculé, nouvel état visible (compteurs changés)
- [ ] forme `immeuble` = §C1 : script qui valide types et clés de `selection`, `toit`, `etages[]` (toutes clés STATUTS dans `compteurs`), `sous_sol[]`, `mesure_ms` ; règles C2 (ordre, dormance, `sel` jamais dormant) et C4 (tri `prio` croissant, plafond 40, `projet` sur chaque item, `todo_total ≥ len(todo)`) vérifiées sur TON banc à ≥ 3 projets dont 1 dormant (mtime vieilli par `os.utime`) et 1 clos
- [ ] sécurité `?projet=` : `../x`, `%00`, 200 caractères, slug clos, `vault/archive/*` → jamais d'accès hors `vault/projets`, refus §C3 ; sortie collée
- [ ] écarts déclarés par T003 jugés (bloc d'un clos hors `blocs`, `_doctor_rapide` sur blocs, helpers ajoutés, `agents` tronqué dans le bloc, run/projet lu 2×) : cassent-ils §C1-C4 ou un consommateur ?
- [ ] périmètre : `git diff --stat -- bin/dash.py` ; `bin/sonnerie.py`/`bin/terminal.py` = T004 (retenue), hors évaluation
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T003-l1-serveur-etat-immeuble-etage-par-projet-todo-a/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T003-l1-serveur-etat-immeuble-etage-par-projet-todo-a/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1-C4 L23-129 · §C7 L194-251 · DoD L1 L325-342 |
| `bin/dash.py` | L | livrable |
| `.cache/banc-T007/` | E | banc jetable |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T007
projet: agentx-immeuble
statut: fait | bloque
evalue: T003
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
Lot non commité : diff = `git diff -- bin/dash.py` (arbre vs HEAD 44e45e5).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` sur le vrai vault ; NV vaut `[ ]` ; tu ne corriges rien
- option B du contrat (1 state.json + immeuble + étage détaillé) : ne pas la rediscuter

## Hors périmètre
- `dash/*` (T005 en cours en parallèle) ; `bin/sonnerie.py`, `bin/terminal.py`
- modifier un fichier hors `.cache/banc-T007/` et ton `result.md`

## Environnement
- banc : `B=.cache/banc-T007; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; `ROOT` = parent de `bin/` → le banc lit `$B/vault` ; fixtures via `python3 $B/bin/vx.py projet|tache|set` ; clore un projet = `statut: clos` dans son brief.md du banc
- salle-banc : `python3 $B/bin/dash.py --port 7800 --no-open &` ; GET seulement ; NE PAS POST `/api/term/*` ; kill par pid, `curl` → 000
- vrai vault : `python3 bin/dash.py --json [--projet X]` en lecture seule autorisé ; salle réelle :7777 : ne pas toucher
- stdlib ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, banc), `Bash(python3:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T007)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T007-evaluer-t003/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
