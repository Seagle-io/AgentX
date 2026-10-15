---
pack: T009
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T009 — Evaluer T007 (registre des produits)

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le registre des produits (`produits.json` + `bin/produits.py`, écrits par T003 puis finis par T007) contre la DoD de T007 ET le contrat §C1 → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T007-l1-registre-des-produits-produits-json-bin-produ/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] §C1 complet : constantes, dataclasses `frozen`, 9 fonctions aux signatures exactes (`inspect.signature` collé) ; `bin/produits.py` n'importe ni `vx` ni `dash` (`rg -n "^import|^from"` collé)
- [ ] `_valider` : ≥ 10 registres mutés par TOI (pas ceux de T003/T007) couvrant chaque règle §C1 (bool≠int, `nom` > 24, `ui` absolu, `env` hors `vault/projets/`, `domaine` inconnu, `captures` vide, `site.depot` relatif, cle en double, 0 entreprise, entreprise archivée) → `RegistreInvalide` avec message `produits[i].<champ> : … invalide (…)` ; registre valide → OK
- [ ] cache `(chemin, st_mtime_ns)` : 2 appels → 1 lecture ; modification du fichier → relu (preuve par compteur)
- [ ] `verifier` : LECTURE seule (git status/rev-parse HEAD avant == après sur les 5 dépôts) ; branche absente forgée dans une copie → message, jamais d'exception
- [ ] valeurs : chaque chemin de `produits.json` existe (`ls` collé) ; aucune donnée chiffrée
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T007-l1-registre-des-produits-produits-json-bin-produ/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T007-l1-registre-des-produits-produits-json-bin-produ/result.md` | L | affirmations |
| `vault/projets/seagle-pilotage/taches/T003-l1-registre-des-produits-produits-json-bin-produ/result.md` | L | ce que T003 a livré |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C1 L40-116 |
| `produits.json` | L | livrable |
| `bin/produits.py` | L | livrable |
| `.cache/eval-T009/` | E | registres mutés, scripts |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T009
projet: seagle-pilotage
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
Tranché par le chef : `seagle.sous` raccourci à 43 car. (règle 48 inchangée) ; `geolens.env` = `vault/projets/geolens-viewer/env.md` ; `agentx.branche_publication` = `master` (constaté par T003).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- T005 et T006 lisent ce registre en parallèle : ne pas modifier `produits.json`

## Hors périmètre
- `bin/vx.py`, `bin/publier.py` (en cours) ; écrire hors `.cache/eval-T009/` et ton `result.md`

## Environnement
- `charger(chemin)` : passer le chemin en argument (le défaut `FICHIER` est figé à l'import)
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T009/`), `Bash(python3:*)`, `Bash(git -C:*)` (lecture), `Bash(ls:*)`, `Bash(rg:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/seagle-pilotage/taches/T009-evaluer-t007-registre-des-produits/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
