---
pack: T024
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T024 — Evaluer T023

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T023 (rôle `syndicat` : registre, agent, commande `/syndicat`, doctrine) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T023-role-syndicat-conditions-de-travail-des-agents/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] chaque ligne des blocs « Sources », « Indicateurs », « Règles » du pack T023 retrouvée dans `.claude/agents/syndicat.md` : tableau ligne → `chemin:L` ; absente ou affaiblie ⇒ `[ ]`
- [ ] l'agent n'a aucun outil d'édition de packs/gabarits (`tools` sans `Edit`) et sa consigne interdit d'éditer packs, gabarits, agents : `rg` collé
- [ ] `/syndicat` : n'appelle pas `Agent` sans tâche vault (texte de la commande collé, garde `bin/garde_dispatch.py` non contournée)
- [ ] part de T023 dans `CLAUDE.md`, `SKILL.md`, `roles.json` isolée du diff T021 (retenue, non commitée) : ton attribution ligne à ligne collée
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T023-role-syndicat-conditions-de-travail-des-agents/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T023-role-syndicat-conditions-de-travail-des-agents/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-entreprise/taches/T021-4-roles-metier-juriste-fiscaliste-tresorier-prod/result.md` | L | diff T021, pour attribuer |
| `roles.json` | L | livrable |
| `.claude/agents/syndicat.md` | L | livrable |
| `.claude/commands/syndicat.md` | L | livrable |
| `.claude/skills/chef-de-projet/SKILL.md` | L | livrable |
| `CLAUDE.md` | L | livrable |
| `bin/garde_dispatch.py` | L | garde Agent |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T024
projet: agentx-entreprise
statut: fait | bloque
evalue: T023
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
Base : HEAD 44e45e5 ; T021 (5 rôles métier, retenue) et T023 sont tous deux non commités dans `roles.json`, `CLAUDE.md`, `SKILL.md`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- `syndicat` livre en `fait`, modèle opus, propose sans éditer — choix du chef, ne pas rediscuter

## Hors périmètre
- `dash/*` (glyphe `cahier` : T010 agentx-immeuble) ; écrire hors ton `result.md`

## Environnement
- `garde_bash` refuse les commandes citant push/migrations ; lire avec Read
- `./bin/agentx doctor`, `python3 bin/vx.py personnel --json` en lecture seule autorisés

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T024-evaluer-t023/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
