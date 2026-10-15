---
pack: T013
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T013 — Evaluer T008

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T008 (L2 serveur salle) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T008-l2-serveur-de-la-salle-registre-rh-actions-par-t/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi (jamais recopiée du result.md évalué)
- [ ] affirmations du `result.md` évalué (« Vérifié comment ») : ≥ 3 re-jouées, écart → case `[ ]`
- [ ] périmètre : `git diff HEAD~1 HEAD --stat` → fichiers du lot ⊂ WL E du pack T008 (+ son result.md/task.md) ; autre fichier ⇒ `[ ]`
- [ ] écarts déclarés par T008 confrontés au contrat (contrat.md:68-100, :101-137, :228-259, :278-396 (§C2 C3 C5 C6 C7 C8)) : écart non justifié qui casse un consommateur ⇒ `[ ]`
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T008-l2-serveur-de-la-salle-registre-rh-actions-par-t/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T008-l2-serveur-de-la-salle-registre-rh-actions-par-t/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-entreprise/contrat.md` | L | contrat.md:68-100, :101-137, :228-259, :278-396 (§C2 C3 C5 C6 C7 C8) |
| `bin/dash.py` | L | livrable évalué |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6) :
```markdown
---
tache: T013
statut: fait | bloque
evalue: T008
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
- Évaluer d'autres tâches que T008
- Juger le style : seule la DoD compte

## Environnement
- `python3 bin/dash.py --json` lit le vrai vault sans l'écrire : OK
- `construire_argv`, `_actions_tache`, `_todo` testables par `python3 -c` (sys.path bin/)
- ne JAMAIS POST `/api/run` sur une salle qui lit le vrai vault ; la salle est arrêtée, ne pas la lancer
- Python 3 stdlib ; `rg` dispo ; `garde_bash` refuse les commandes citant push/migrations
- arbre partagé : d'autres évaluateurs tournent en parallèle sur `.cache/` (préfixe tes fichiers par T013)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git show:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(google-chrome:*)`, `Bash(kill:*)`, `Bash(curl -s:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T013-evaluer-t008/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
