---
pack: T029
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T029 — Evaluer T026

> Seule source de vérité de l'agent T029. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T026 (`integrer` + Retour sur le pack, commande `manques`, recopie de `env.md` au scaffold) contre la DoD de SON pack ET contre les vraies fiches `env.md` livrées depuis par T027 → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T026-boucle-d-apprentissage-integrer-manques-env-md-a/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] case ajoutée par le chef — scaffold avec une VRAIE fiche : sur ton banc, copier `vault/projets/orthopro/env.md` (8 titres `## `) dans un projet banc, `vx tache` → le pack généré garde exactement les 9 sections du gabarit dans l'ordre (`rg -n "^## " <pack>` collé) et `pack-lint` ne signale aucune section manquante ou dupliquée ; titres `## ` de la fiche coupant § Environnement ⇒ `[ ]` (défaut connu signalé par T026 lui-même, « env.md avec `## ` → coupe § Environnement »)
- [ ] `manques` : catégorisation re-jouée sur ≥ 10 lignes réelles tirées au hasard (`--json`), juger le taux d'erreur (sous-chaînes `port`/`tz`/`type`/`api` sans `\b`) ; > 30 % mal classées ⇒ `[ ]` avec exemples
- [ ] affirmations du `result.md` évalué : ≥ 4 re-jouées
- [ ] périmètre : `git diff --stat -- bin/vx.py bin/agentx` ; 0 autre fichier de T026
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut, qui nomme le défaut à corriger ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T026-boucle-d-apprentissage-integrer-manques-env-md-a/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T026-boucle-d-apprentissage-integrer-manques-env-md-a/result.md` | L | affirmations à réfuter |
| `bin/vx.py` | L | livrable |
| `bin/agentx` | L | livrable (aide) |
| `vault/projets/orthopro/env.md` | L | vraie fiche (T027) |
| `vault/projets/seagle-site/env.md` | L | vraie fiche (T027) |
| `.cache/banc-T029/` | E | banc jetable |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T029
projet: agentx-entreprise
statut: fait | bloque
evalue: T026
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
Bloc scaffold contractuel (pack T026) : `Fiche projet (\`vault/projets/<slug>/env.md\`, recopiée au scaffold — ne pas éditer ici) :` + corps de env.md sans frontmatter, juste après `## Environnement`. Sections obligatoires d'un pack : Mission · Definition of Done · Fichiers autorisés · Contrats · Décisions actées · Hors périmètre · Environnement · Budget · Format de sortie.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` sur le vrai vault ; NV vaut `[ ]` ; tu ne corriges rien
- un pack scaffoldé dont § Environnement est coupé par des titres de la fiche est inutilisable : c'est un défaut du livrable, même si la DoD d'origine ne le nommait pas

## Hors périmètre
- éditer `env.md`, `bin/*` ; `dash/*` (T012 en cours)

## Environnement
- banc : `B=.cache/banc-T029; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; fixtures `python3 $B/bin/vx.py projet banc --titre Banc` puis copie de la fiche dans `$B/vault/projets/banc/env.md`
- vrai vault : `python3 bin/vx.py integrer|manques` en lecture seule autorisé
- `rg -h` = aide en rg 14 : utiliser `-I` ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, banc), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T029)`, `Bash(git diff:*)`, `Bash(./bin/agentx:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T029-evaluer-t026/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
