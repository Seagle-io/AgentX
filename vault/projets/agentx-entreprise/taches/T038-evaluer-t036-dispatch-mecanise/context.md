---
pack: T038
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-16
---

# Pack T038 — Evaluer T036 (dispatch mécanisé)

> Seule source de vérité de l'agent T038. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger T036 (une tâche ne passe `en-cours` que par le hook de dispatch ; todo et doctor signalent une tâche prête sans agent ; doctor signale les chemins personnels) contre la DoD de SON pack, sur l'INSTANTANÉ `.cache/snap-T036/` → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T036-dispatch-mecanise-et-chemins-personnels-detectes/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi sur TON banc
- [ ] hook : stdin forgés (dispatch accepté, rôle faux, pack absent, statut `a-faire`, lint KO, tâche déjà en-cours) → décisions et effets attendus ; écriture impossible (`run/` en lecture seule) → l'agent part quand même (échec ouvert), refus inchangés
- [ ] `set --statut en-cours` manuel refusé ; `--force` journalisé ; `--dispatch` réservé au hook (que se passe-t-il si le chef l'appelle à la main ? juger)
- [ ] todo / doctor : tâche `pret` vieillie > 15 min → signalée ; dispatchée → disparaît ; événements `dispatch` jamais annoncés comme « agent a terminé » dans la page (rejouer la sonnerie de `dash.js` sur un événement `dispatch`)
- [ ] chemins personnels : 5 fichiers forgés (shebang absolu, `/home/x/` en code, littéral `/home/<nom>/` en doc, fichier binaire, fichier non suivi) → résultats collés et jugés (la revendication R2 du syndicat sur les non suivis est une suite, pas un défaut de T036)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T036-dispatch-mecanise-et-chemins-personnels-detectes/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T036-dispatch-mecanise-et-chemins-personnels-detectes/result.md` | L | affirmations |
| `.cache/snap-T036/` | L | instantané (bin, dash, .claude, CLAUDE.md) |
| `.cache/eval-T038/` | E | banc |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T038
projet: agentx-entreprise
statut: fait | bloque
evalue: T036
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
stdin du hook PreToolUse : `{"tool_name":"Agent","tool_input":{"subagent_type":"<role>","prompt":"T0xx · projet <slug>\npack: vault/projets/<slug>/taches/T0xx-<slug>/context.md …"}}`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien ; évaluer l'INSTANTANÉ (`bin/vx.py` réel est modifié en parallèle par seagle-pilotage T019)

## Hors périmètre
- le vrai vault et les vrais hooks (ne jamais appeler `bin/garde_dispatch.py` réel avec un stdin qui viserait une tâche réelle) ; écrire hors `.cache/eval-T038/` et ton `result.md`

## Environnement
- banc : `B=.cache/eval-T038/banc; rm -rf $B; mkdir -p $B/vault $B/run; cp -r .cache/snap-T036/{bin,dash,.claude,roles.json,produits.json} $B/; cp -r vault/_templates $B/vault/` ; `ROOT` = parent de `bin/` ; `git init` du banc pour les chemins suivis
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T038/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T038/banc)`, `Bash(touch:*)`, `Bash(chmod:*)`, `Bash(git init:*)`, `Bash(git -C:*)`, `Bash(grep:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T038-evaluer-t036-dispatch-mecanise/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
