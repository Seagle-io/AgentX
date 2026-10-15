---
pack: T013
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T017 — Evaluer T014 (porte corrigée)

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger `bin/publier.py` corrigé par T014 (remplaçante de T006, renvoyée pour titres d'écart contredits par git) contre la DoD de SON pack et le contrat §C5 — lecture seule des dépôts, verdicts réels kora et geolens justes, acquits et `--taches` sûrs → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T014-l3-porte-de-publication-bin-publier-py/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] verdicts réels re-joués : `python3 bin/publier.py kora --json` et `geolens --json` → chaque écart confronté à SA preuve git brute (tu relances la commande git du contrôle et compares) ; 1 écart faux (preuve qui ne dit pas ce que dit le titre) ⇒ `[ ]`
- [ ] lecture seule prouvée : `rev-parse HEAD` + `status --porcelain` + `git stash list` + `git worktree list` avant == après sur les 5 dépôts (collé)
- [ ] `--taches` et `--acquitter` sur TA copie du vault (`.cache/seagle-eval-T017/`) : idempotence (2e passage → `[]`), acquit expire quand la preuve change (forger un nouveau commit dans une COPIE git d'un petit dépôt de test, jamais un vrai dépôt), id absent → exit 2, motif vide/multiligne → refus
- [ ] codes de sortie §C5 (0/1/2/3) : 6 cas collés
- [ ] les 2 motifs du renvoi de T006 levés et les 4 amendements appliqués : chaque titre d'écart kora/geolens confronté à sa commande git relancée (0 contradiction) ; acquitter tous les bloquants kora → NO-GO tant que P4 en erreur
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T014-l3-porte-de-publication-bin-publier-py/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T014-l3-porte-de-publication-bin-publier-py/result.md` | L | affirmations |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C5 L207-247 |
| `vault/projets/seagle-pilotage/decisions.md` | L | amendements §C5 du 2026-10-16 |
| `vault/projets/seagle-pilotage/taches/T013-evaluer-t006-porte-de-publication/result.md` | L | motif du renvoi |
| `bin/publier.py` | L | livrable |
| `bin/produits.py` | L | registre |
| `produits.json` | L | registre réel |
| `.cache/seagle-eval-T017/` | E | copie du vault, dépôts de test |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T017
projet: seagle-pilotage
statut: fait | bloque
evalue: T014
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
Motif du renvoi de T006 : P3 tronqué à -n 200 (titres 2 feat / 198 autres pour 410 dont 50 feat) ; P2 « pages absentes de main » alors que seules les captures manquent.
Amendements §C5 (decisions.md 2026-10-16) : erreur ⇒ NO-GO ; P3 sans troncature silencieuse ; P2 titre selon la référence vide ; RE_FEAT + ajoute|ajout.
Verdicts déclarés par T014 : kora NO-GO (site-branche « captures absentes de main », textes « 410 commits dont 50 feat », 3 marketing, P4 erreur) ; geolens NO-GO (captures:geolens:2026-10-14).

## Décisions actées
- la porte juge les refs LOCALES ; heuristique P3 = sujets de commit ; tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]`

## Hors périmètre
- toute écriture dans un vrai dépôt ou le vrai vault ; `bin/vx.py` (T016 en parallèle)

## Environnement
- copie du vault : `rm -rf .cache/seagle-eval-T017; mkdir -p .cache/seagle-eval-T017; cp -r bin roles.json produits.json .cache/seagle-eval-T017/; cp -r vault .cache/seagle-eval-T017/vault`
- dépôt de test pour l'expiration d'acquit : `git init` dans `.cache/seagle-eval-T017/depot` + registre muté pointant dessus
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T017/`), `Bash(python3:*)`, `Bash(git -C:*)`, `Bash(git init:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-eval-T017)`, `Bash(md5sum:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/seagle-pilotage/taches/T017-evaluer-t014-porte-corrigee/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
