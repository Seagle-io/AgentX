---
pack: T031
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T031 — Branche git par étage : compte rendu prouvé (remplace T029)

> Seule source de vérité de l'agent T031. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rejouer les preuves du correctif `_branche` déjà en place dans `bin/dash.py` (code jugé conforme par T030) et ÉCRIRE `result.md` avec les sorties brutes collées — 0 édition de code.

## Definition of Done
- [ ] `result.md` EXISTE à côté de ce pack, frontmatter `statut: revue`, chaque ligne ci-dessous = `commande → sortie brute` collée (motif T029 : result.md absent)
- [ ] `python3 .cache/eval-T030/cas.py` → 13 lignes collées, 0 exception
- [ ] `python3 bin/dash.py --json` → par étage `[(nom, branche, ecart)]` collé : kora master×2 · geolens master · agentx master · seagle `feat/ascii-nuit-etoilee` True
- [ ] `python3 -m py_compile bin/dash.py; echo rc=$?` → collé ; `python3 -m unittest discover -s tests 2>&1 | tail -3` → collé
- [ ] `git diff --stat -- bin/dash.py` → **collé tel quel**
- [ ] `git diff --quiet -- bin/dash.py dash/` identique avant/après ton passage : `md5sum bin/dash.py dash/dash.js` avant == après (collé)

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | L | `_branche` :488-504, `_depots` :507 |
| `.cache/eval-T030/cas.py` | L | script de cas (exécuter) |

## Contrats
Motif de renvoi T029 (verbatim) : `code _branche conforme (13 cas) mais result.md absent : aucune sortie collée, git diff --stat non collé`
Motif T027 (antérieur) : `_branche laisse fuir UnicodeDecodeError sur HEAD non UTF-8 (contrat illisible→None), state.json tombe ; ref hors refs/heads affichée 'détachée ref: re' ; git diff --stat non collé`

## Décisions actées
- code conforme (T030) : tu n'édites rien ; écart constaté → `## Écarts`, pas de correction

## Hors périmètre
- toute écriture hors `result.md` ; relancer :7777

## Environnement
- arbre partagé : `git status` d'AgentX bouge (chef) — normal ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **0**.
- Outils autorisés : Read, Write (`result.md` seulement), `Bash(python3:*)`, `Bash(md5sum:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes de corps, sections exactes :

```markdown
---
tache: T031
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- result.md — preuves rejouées, 0 édition
## Vérifié comment
commande → sortie brute
## Écarts
- ∅
## Pour la suite
- ∅
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
