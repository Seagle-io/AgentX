---
pack: T014
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T014 — Evaluer T009

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T009 (L3 salle à N rôles, RH) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T009-l3-salle-a-n-roles-deck-en-grille-panneau-rh/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi (jamais recopiée du result.md évalué)
- [ ] affirmations du `result.md` évalué (« Vérifié comment ») : ≥ 3 re-jouées, écart → case `[ ]`
- [ ] périmètre : `git diff HEAD~1 HEAD --stat` → fichiers du lot ⊂ WL E du pack T009 (+ son result.md/task.md) ; autre fichier ⇒ `[ ]`
- [ ] écarts déclarés par T009 confrontés au contrat (contrat.md:46-66, :315-351, :397-428 (§C1 C7 C9-L3)) : écart non justifié qui casse un consommateur ⇒ `[ ]`
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T009-l3-salle-a-n-roles-deck-en-grille-panneau-rh/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T009-l3-salle-a-n-roles-deck-en-grille-panneau-rh/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-entreprise/contrat.md` | L | contrat.md:46-66, :315-351, :397-428 (§C1 C7 C9-L3) |
| `dash/dash.js` | L | livrable évalué |
| `dash/index.html` | L | livrable évalué |
| `dash/dash.css` | L | livrable évalué |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6) :
```markdown
---
tache: T014
statut: fait | bloque
evalue: T009
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

## Décisions actées
- tu ne lances ni `virer` ni `retenir` — le chef tient la comptabilité
- `NV` vaut `[ ]` — « non vérifié » = « non fait »
- tu ne corriges rien, même une faute triviale — constat seulement

## Hors périmètre
- Modifier un fichier hors `.cache/` et ton `result.md`
- Évaluer d'autres tâches que T009
- Juger le style : seule la DoD compte

## Environnement
- T011 (L4) a modifié les mêmes fichiers APRÈS T009 : juger les cases DoD de T009 sur l'état actuel ; une case cassée par L4 ⇒ `[ ]` avec mention « cassé par T011 » (le chef tranchera)
- `node` v22 pour `--check` et harnais jetable `.cache/eval-T014.mjs` ; `python3 bin/dash.py --json` donne l'état réel (13 rôles)
- capture : `google-chrome --headless=new --disable-gpu --screenshot=.cache/eval-T014.png --window-size=1600,2600 http://127.0.0.1:<port>/` sur une salle lancée par TOI en arrière-plan : `python3 bin/dash.py --port 7791 &` (pid noté, kill en fin ; `--help` d'abord pour l'option exacte)
- Python 3 stdlib ; `rg` dispo ; `garde_bash` refuse les commandes citant push/migrations
- arbre partagé : d'autres évaluateurs tournent en parallèle sur `.cache/` (préfixe tes fichiers par T014)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git show:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(google-chrome:*)`, `Bash(kill:*)`, `Bash(curl -s:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T014-evaluer-t009/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
