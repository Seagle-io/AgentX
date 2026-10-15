---
pack: T007
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
remplace: T003
---

# Pack T007 — L1 registre des produits : finir (remplace T003, bloquée sur le contrat)

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Terminer le registre des produits livré à 95 % par T003 (`produits.json`, `bin/produits.py`, déjà dans l'arbre) : appliquer les 2 valeurs tranchées par le chef, puis prouver la DoD L1 complète.

## Definition of Done
- [ ] `produits.json` : `seagle.sous` = `"entreprise : site, marketing, finance, RSSI"` (43 car.) ; `geolens.env` = `"vault/projets/geolens-viewer/env.md"` ; 0 autre changement (diff collé)
- [ ] `bin/produits.py` : 0 changement de règle (max `sous` reste 48) ; diff vide ou justifié en Écarts
- [ ] 3 commandes « DoD L1 » de `contrat.md:313-319` sur le VRAI registre → `'' ('kora', 'geolens', 'agentx', 'seagle') seagle` et `{'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}` (sorties collées)
- [ ] 6 registres mutés (`.cache/T007/`) → `RegistreInvalide` ×6 re-joués ; registre absent → message, 0 exception
- [ ] `git -C <d> status --porcelain` avant == après pour les 5 dépôts produits/sites
- [ ] `python3 -m py_compile bin/produits.py` rc 0
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `produits.json` | E | 2 valeurs |
| `bin/produits.py` | L | livré par T003 (relire, ne pas réécrire) |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C1 L40-116 · DoD L1 L313-319 |
| `vault/projets/seagle-pilotage/taches/T003-l1-registre-des-produits-produits-json-bin-produ/result.md` | L | ce que T003 a livré et vérifié |
| `.cache/T007/` | E | registres mutés |

## Contrats
Motif de renvoi de T003 (BLQ, faute du contrat, pas de l'agent) :
```
§C1 contradictoire : sous de seagle = 54 car. > max 48 → DoD L1 #1/#2 KO
NV geolens env infirmé : 3 vault/projets/geolens-*/env.md existent ; "" conservé
```
Tranché par le chef : `sous` raccourci (règle 48 inchangée) ; `env` geolens = fiche `geolens-viewer` (la plus complète, 44 faits). Déjà corrigé par T003 et conservé : `agentx.branche_publication` = `master`.

## Décisions actées
- le registre ne s'adapte pas à une valeur trop longue : la donnée se raccourcit
- jamais d'écriture git dans `verifier` ; jamais de push

## Hors périmètre
- `bin/vx.py`, `bin/publier.py`, `bin/dash.py`, `outils/captures/`

## Environnement
- `W` = `~/Documents/Workspace` ; HEAD de seagle-website = `feat/ascii-nuit-etoilee` (≠ `main`) : normal, `verifier` lit les refs
- `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/T007/`), Grep, `Bash(python3:*)`, `Bash(git -C:*)` (lecture), `Bash(git diff:*)`, `Bash(mkdir:*)`, `Bash(cp:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T007
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
