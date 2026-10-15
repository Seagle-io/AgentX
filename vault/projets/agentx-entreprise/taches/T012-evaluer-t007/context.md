---
pack: T012
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T012 — Evaluer T007

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T007 (L1 CLI, registre, gardes) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T007-l1-registre-des-roles-virer-retenir-personnel-ga/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi (jamais recopiée du result.md évalué)
- [ ] affirmations du `result.md` évalué (« Vérifié comment ») : ≥ 3 re-jouées, écart → case `[ ]`
- [ ] périmètre : `git diff HEAD~1 HEAD --stat` → fichiers du lot ⊂ WL E du pack T007 (+ son result.md/task.md) ; autre fichier ⇒ `[ ]`
- [ ] écarts déclarés par T007 confrontés au contrat (contrat.md:23-313 (§C1-C6)) : écart non justifié qui casse un consommateur ⇒ `[ ]`
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T007-l1-registre-des-roles-virer-retenir-personnel-ga/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T007-l1-registre-des-roles-virer-retenir-personnel-ga/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-entreprise/contrat.md` | L | contrat.md:23-313 (§C1-C6) |
| `roles.json` | L | livrable évalué |
| `bin/roles.py` | L | livrable évalué |
| `bin/rh.py` | L | livrable évalué |
| `bin/vx.py` | L | livrable évalué |
| `bin/garde_dispatch.py` | L | livrable évalué |
| `bin/sonnerie.py` | L | livrable évalué |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6) :
```markdown
---
tache: T012
statut: fait | bloque
evalue: T007
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
- Évaluer d'autres tâches que T007
- Juger le style : seule la DoD compte

## Environnement
- toute preuve qui mute un vault = banc jetable `B=.cache/banc-T012` monté comme le pack T007 (`rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/`) ; jamais `virer`/`retenir`/`tache`/`set` sur le vrai vault
- `rm -rf .cache/banc-T012` autorisé en fin
- Python 3 stdlib ; `rg` dispo ; `garde_bash` refuse les commandes citant push/migrations
- arbre partagé : d'autres évaluateurs tournent en parallèle sur `.cache/` (préfixe tes fichiers par T012)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git show:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(google-chrome:*)`, `Bash(kill:*)`, `Bash(curl -s:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T012-evaluer-t007/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
