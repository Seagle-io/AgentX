---
pack: T031
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T031 — Evaluer T030

> Seule source de vérité de l'agent T031. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T030 (remplaçante de T026 : fiche env.md recopiée sans casser le pack, pack-lint qui détecte les sections cassées, catégories `manques` affinées) contre la DoD de SON pack → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T030-boucle-d-apprentissage-integrer-manques-env-md-a/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi sur `.cache/banc-T031`
- [ ] motif du renvoi de T026 levé : avec les 6 vraies fiches `vault/projets/*/env.md`, scaffold → 9 sections dans l'ordre hors blocs de code, `pack-lint` sans ✗ de structure ; boucle sur les 6 collée
- [ ] pack-lint robuste : titre `## ` à l'intérieur d'un bloc ```` ``` ```` ignoré ; bloc de code non fermé → comportement collé et jugé ; `PACK_SECTIONS` = 9 (écart déclaré : était 8)
- [ ] non-régression : `pack-lint` sur tous les packs `pret|en-cours|revue` du vrai vault (TID figés au début, liste collée) → aucun nouveau ✗ hormis orthopro T042 (déclaré) ; juger cet écart
- [ ] `manques` : 15 lignes réelles tirées au hasard (graine collée) → taux de mauvaise catégorie collé ; > 30 % ⇒ `[ ]`
- [ ] périmètre : `git diff --stat -- bin/vx.py` (base HEAD 48a6888, qui ne contient PAS bin/vx.py de T026/T030) ; 0 autre fichier
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T030-boucle-d-apprentissage-integrer-manques-env-md-a/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T030-boucle-d-apprentissage-integrer-manques-env-md-a/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-entreprise/taches/T029-evaluer-t026/result.md` | L | motif du renvoi d'origine |
| `bin/vx.py` | L | livrable |
| `vault/projets/*/env.md` | L | 6 vraies fiches |
| `.cache/banc-T031/` | E | banc jetable |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T031
projet: agentx-entreprise
statut: fait | bloque
evalue: T030
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
Motif de renvoi de T026 : `cmd_tache recopie env.md avec ses titres ## : la fiche réelle coupe § Environnement ; démoter les titres et faire détecter par pack-lint`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` sur le vrai vault ; NV vaut `[ ]` ; tu ne corriges rien
- un pack ancien (`fait`) sans `## Environnement` qui passe KO au lint : sans effet, toléré

## Hors périmètre
- éditer `env.md`, `bin/*` ; `dash/*` (T011 en cours)

## Environnement
- banc : `B=.cache/banc-T031; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; 1 projet banc par fiche (copie de `env.md`)
- vrai vault : `python3 bin/vx.py pack-lint|integrer|manques|board` en lecture seule autorisé
- `rg -h` = aide en rg 14 : utiliser `-I` ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, banc), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T031)`, `Bash(git diff:*)`, `Bash(./bin/agentx:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T031-evaluer-t030/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
