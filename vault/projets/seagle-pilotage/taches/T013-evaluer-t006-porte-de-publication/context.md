---
pack: T013
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T013 — Evaluer T006 (porte de publication)

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger `bin/publier.py` (porte de publication, T006) contre la DoD de SON pack et le contrat §C5 — lecture seule des dépôts, verdicts réels kora et geolens justes, acquits et `--taches` sûrs → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T006-l3-porte-de-publication-bin-publier-py/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] verdicts réels re-joués : `python3 bin/publier.py kora --json` et `geolens --json` → chaque écart confronté à SA preuve git brute (tu relances la commande git du contrôle et compares) ; 1 écart faux (preuve qui ne dit pas ce que dit le titre) ⇒ `[ ]`
- [ ] lecture seule prouvée : `rev-parse HEAD` + `status --porcelain` + `git stash list` + `git worktree list` avant == après sur les 5 dépôts (collé)
- [ ] `--taches` et `--acquitter` sur TA copie du vault (`.cache/seagle-eval-T013/`) : idempotence (2e passage → `[]`), acquit expire quand la preuve change (forger un nouveau commit dans une COPIE git d'un petit dépôt de test, jamais un vrai dépôt), id absent → exit 2, motif vide/multiligne → refus
- [ ] codes de sortie §C5 (0/1/2/3) : 6 cas collés
- [ ] écarts déclarés par T006 jugés : contrôle en `erreur` n'impose pas NO-GO ; `RE_FEAT` rate « Ajoute… » (198 commits en avertissement) ; P5 non filtré par date — défaut bloquant ou suite ?
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T006-l3-porte-de-publication-bin-publier-py/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T006-l3-porte-de-publication-bin-publier-py/result.md` | L | affirmations |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C5 L207-247 |
| `bin/publier.py` | L | livrable |
| `bin/produits.py` | L | registre |
| `produits.json` | L | registre réel |
| `.cache/seagle-eval-T013/` | E | copie du vault, dépôts de test |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T013
projet: seagle-pilotage
statut: fait | bloque
evalue: T006
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
Verdicts déclarés par T006 : kora NO-GO (`site-branche:kora:29d349b`, `textes:kora:e15a824`, 3 `marketing:*`) ; geolens NO-GO (`captures:geolens:2026-10-14`).

## Décisions actées
- la porte juge les refs LOCALES ; heuristique P3 = sujets de commit ; tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]`

## Hors périmètre
- toute écriture dans un vrai dépôt ou le vrai vault ; `bin/vx.py` (T012 en parallèle)

## Environnement
- copie du vault : `rm -rf .cache/seagle-eval-T013; mkdir -p .cache/seagle-eval-T013; cp -r bin roles.json produits.json .cache/seagle-eval-T013/; cp -r vault .cache/seagle-eval-T013/vault`
- dépôt de test pour l'expiration d'acquit : `git init` dans `.cache/seagle-eval-T013/depot` + registre muté pointant dessus
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T013/`), `Bash(python3:*)`, `Bash(git -C:*)`, `Bash(git init:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-eval-T013)`, `Bash(md5sum:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/seagle-pilotage/taches/T013-evaluer-t006-porte-de-publication/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
