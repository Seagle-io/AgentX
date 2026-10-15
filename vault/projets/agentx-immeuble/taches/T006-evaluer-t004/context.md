---
pack: T006
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T006 — Evaluer T004

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T004 (consigne chef au toit, sonnerie avec `projet`) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T004-l3-chef-au-toit-et-sonnerie-avec-projet/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] verbatim §C6 : comparaison programmatique `contrat.md:160-188` vs `bin/terminal.py` (CONSIGNE_CHEF + PROGRAMME), sortie collée
- [ ] `projet_de` : ≥ 6 cas re-joués dont règle 1, règle 2, règle 3 univoque, règle 3 ambiguë, entrée hostile (`None`, bytes, 1 Mo de texte, slug `../x`) → jamais d'exception, sortie collée
- [ ] `main()` sur `EVENEMENTS` redirigé vers `.cache/eval-T006/` : 1 ligne JSON, 8 clés dans l'ordre §C5 ; `run/evenements.jsonl` réel : taille avant = après
- [ ] périmètre : `git diff --stat -- bin/terminal.py bin/sonnerie.py` ; aucun autre fichier de T004 (`bin/dash.py` est modifié par T003 en parallèle : hors évaluation)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T004-l3-chef-au-toit-et-sonnerie-avec-projet/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T004-l3-chef-au-toit-et-sonnerie-avec-projet/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C5 L130-155 · §C6 L156-193 · DoD L3 L343-348 |
| `bin/terminal.py` | L | livrable |
| `bin/sonnerie.py` | L | livrable |
| `.cache/eval-T006/` | E | essais jetables |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6 agentx-entreprise) :
```markdown
---
tache: T006
statut: fait | bloque
evalue: T004
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
Lot non commité : diff = `git diff -- bin/terminal.py bin/sonnerie.py` (arbre vs HEAD 44e45e5).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` — le chef tient la comptabilité
- `NV` vaut `[ ]` ; tu ne corriges rien
- un agent n'est jamais arrêté par la sonnerie : exception dans `projet_de` = défaut bloquant

## Hors périmètre
- `bin/dash.py` (T003), `dash/*` ; ■ arrêter / ▶ lancer la session chef ; écrire `run/evenements.jsonl` réel

## Environnement
- socket chef `~/.local/state/agentx-chef.sock` = vraie session : ne pas s'y connecter
- stdlib ; `garde_bash` refuse les commandes citant push/migrations (la consigne en cite : lire avec Read, comparer en `python3` sans les écrire dans la commande)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T006/`), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`, `Bash(wc:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T006-evaluer-t004/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
