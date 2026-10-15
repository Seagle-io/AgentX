---
pack: T015
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T015 — Evaluer T011

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T011 (L4 poste de pilotage) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T011-l4-poste-de-pilotage-actions-par-tache-palette-k/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi (jamais recopiée du result.md évalué)
- [ ] affirmations du `result.md` évalué (« Vérifié comment ») : ≥ 3 re-jouées, écart → case `[ ]`
- [ ] périmètre : `git diff HEAD~1 HEAD --stat` → fichiers du lot ⊂ WL E du pack T011 (+ son result.md/task.md) ; autre fichier ⇒ `[ ]`
- [ ] écarts déclarés par T011 confrontés au contrat (contrat.md:315-468 (§C7 C8 C9-L4)) : écart non justifié qui casse un consommateur ⇒ `[ ]`
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T011-l4-poste-de-pilotage-actions-par-tache-palette-k/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T011-l4-poste-de-pilotage-actions-par-tache-palette-k/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-entreprise/contrat.md` | L | contrat.md:315-468 (§C7 C8 C9-L4) |
| `dash/dash.js` | L | livrable évalué |
| `dash/index.html` | L | livrable évalué |
| `dash/dash.css` | L | livrable évalué |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6) :
```markdown
---
tache: T015
statut: fait | bloque
evalue: T011
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
- Évaluer d'autres tâches que T011
- Juger le style : seule la DoD compte

## Environnement
- `node` v22 pour `--check` et harnais jetable `.cache/eval-T015.mjs` (stubs DOM, pas de jsdom)
- ne JAMAIS POST `/api/run` d'action mutante (virer, retenir, set) sur une salle qui lit le vrai vault ; une salle lancée par toi (`python3 bin/dash.py --port 7792 &`, `--help` d'abord) peut servir aux GET et à `board`/`ready`/`doctor`/`personnel` seulement ; kill par pid en fin
- capture possible : `google-chrome --headless=new --disable-gpu --screenshot=.cache/eval-T015.png --window-size=1600,2600 http://127.0.0.1:7792/`
- Python 3 stdlib ; `rg` dispo ; `garde_bash` refuse les commandes citant push/migrations
- arbre partagé : d'autres évaluateurs tournent en parallèle sur `.cache/` (préfixe tes fichiers par T015)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git show:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(google-chrome:*)`, `Bash(kill:*)`, `Bash(curl -s:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T015-evaluer-t011/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
