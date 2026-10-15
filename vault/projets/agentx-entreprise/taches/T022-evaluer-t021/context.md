---
pack: T022
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T022 — Evaluer T021

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T021 (5 rôles métier : juriste, tresorier, produit, marketing, rssi) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T021-4-roles-metier-juriste-fiscaliste-tresorier-prod/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] chaque règle du bloc « Règles » du pack T021 (commun ×2 + 1 par rôle) retrouvée dans l'agent concerné : tableau règle → `chemin:L` ; règle absente ou affaiblie (ex. « éviter » au lieu de « jamais ») ⇒ `[ ]`
- [ ] frontmatter des 5 agents = bloc « Frontmatter agents » du pack (tools, model) : comparaison programmatique collée
- [ ] `roles.json` : 5 entrées = bloc Contrats (hors couleur), ordre après `scribe` avant `vault` ; distances couleurs re-calculées
- [ ] cohérence doctrine : `rg -n "testeur, designer, devops" CLAUDE.md bin/terminal.py .claude/agents/evaluateur.md .claude/commands/dispatch.md .claude/skills/chef-de-projet/SKILL.md` → toutes les occurrences portent les 5 nouveaux rôles ; « 11 rôles »/« onze » → ∅
- [ ] `bin/terminal.py` : seule la ligne `:43` vient de T021 (les autres hunks = T004, retenue) ; `python3 -m py_compile` rc 0
- [ ] périmètre : `git status --short` → fichiers T021 ⊂ WL du pack T021 ; `dash/*` (T005) et `bin/dash.py` (T003) hors évaluation
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T021-4-roles-metier-juriste-fiscaliste-tresorier-prod/context.md` | L | DoD, règles de référence |
| `vault/projets/agentx-entreprise/taches/T021-4-roles-metier-juriste-fiscaliste-tresorier-prod/result.md` | L | affirmations à réfuter |
| `roles.json` | L | livrable |
| `.claude/agents/juriste.md` | L | livrable |
| `.claude/agents/tresorier.md` | L | livrable |
| `.claude/agents/produit.md` | L | livrable |
| `.claude/agents/marketing.md` | L | livrable |
| `.claude/agents/rssi.md` | L | livrable |
| `.claude/skills/chef-de-projet/SKILL.md` | L | livrable |
| `CLAUDE.md` | L | livrable |
| `bin/terminal.py` | L | livrable `:43` |
| `bin/roles.py` | L | API de validation |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T022
projet: agentx-entreprise
statut: fait | bloque
evalue: T021
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
Lot non commité : diff = `git diff` (arbre vs HEAD 44e45e5) restreint aux fichiers ci-dessus + `.claude/agents/evaluateur.md`, `.claude/commands/dispatch.md` (rg seulement).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- 1 rôle `juriste` = droit + fiscalité ; `rssi` ≠ `securite` — choix humains, ne pas rediscuter

## Hors périmètre
- `dash/*`, `bin/dash.py`, `bin/sonnerie.py` (autres tâches) ; écrire hors ton `result.md`

## Environnement
- `garde_bash` refuse les commandes citant push/migrations ; lire avec Read
- stdlib ; `./bin/agentx doctor` et `python3 bin/dash.py --json` en lecture seule autorisés

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T022-evaluer-t021/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
