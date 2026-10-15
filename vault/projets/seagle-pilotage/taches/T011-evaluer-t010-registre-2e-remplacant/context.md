---
pack: T011
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T011 — Evaluer T010 (registre, 2e remplaçant)

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le registre des produits après T010 (2e remplaçant : messages de validation au format, `verifier` qui ne lève jamais) contre la DoD de T010 et les motifs des 2 renvois → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T010-l1-registre-des-produits-produits-json-bin-produ/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] motif T007 levé : les 26 mutés de `.cache/eval-T009/mut.py` (rejoués depuis une copie dans `.cache/seagle-eval-T011/`) → `RegistreInvalide` ×26, chaque message au format `produits[<i>].<champ> : <valeur> invalide (<raison>)` (ou racine) — vérification PROGRAMMATIQUE par regex, sortie collée
- [ ] ≥ 5 mutations NEUVES de toi (ex. `sources[].domaine` inconnu, `site.captures` vide, `marketing.calendriers` vide, `env` hors `vault/projets/`, `nom` 25 car.) → format OK
- [ ] `verifier` ne lève jamais : ≥ 4 produits forgés (chemin `~user/`, chemin absolu inexistant, dépôt sans `.git`, branche absente) → liste de messages, 0 exception
- [ ] DoD L1 #1/#2 (`contrat.md:313-319`) sur le vrai registre ; API (9 signatures) inchangée ; `produits.json` inchangé (md5)
- [ ] lecture seule : `git -C <d> status --porcelain` + `rev-parse HEAD` avant == après (5 dépôts)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T010-l1-registre-des-produits-produits-json-bin-produ/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T010-l1-registre-des-produits-produits-json-bin-produ/result.md` | L | affirmations |
| `vault/projets/seagle-pilotage/taches/T009-evaluer-t007-registre-des-produits/result.md` | L | motif du 2e renvoi |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C1 L40-116 · DoD L1 L313-319 |
| `bin/produits.py` | L | livrable |
| `produits.json` | L | registre réel |
| `.cache/eval-T009/mut.py` | L | 26 mutations |
| `.cache/seagle-eval-T011/` | E | essais (préfixe projet : `.cache/eval-T011` peut être occupé par un autre projet) |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T011
projet: seagle-pilotage
statut: fait | bloque
evalue: T010
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
Formats tranchés par le chef : `produits[<i>].cle : <cle> invalide (en double, déjà produits[<j>])` · `produits[<i>].couleur : <couleur> invalide (en double, déjà produits[<j>])` · `produits : 0 entreprise invalide (exactement 1 entreprise:true)`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- 3e renvoi possible : juge sur la DoD seule ; `bin/roles.py` hors format : hors périmètre (noté par T010)

## Hors périmètre
- `bin/vx.py`, `bin/publier.py` (en cours) ; écrire hors `.cache/seagle-eval-T011/` et ton `result.md`

## Environnement
- `charger(chemin)` : passer le chemin en argument ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T011/`), `Bash(python3:*)`, `Bash(git -C:*)` (lecture), `Bash(md5sum:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/seagle-pilotage/taches/T011-evaluer-t010-registre-2e-remplacant/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
