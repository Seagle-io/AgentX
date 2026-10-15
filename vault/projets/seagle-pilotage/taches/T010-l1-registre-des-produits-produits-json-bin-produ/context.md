---
pack: T010
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
remplace: T007
---

# Pack T010 — L1 registre : messages de validation et chemins de sources (remplace T007, 2e renvoi)

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger dans `bin/produits.py` les 2 défauts du renvoi de T007 (3 messages de validation hors format, `verifier` qui lève sur un chemin `~user/`) sans changer aucune règle ni API ; `produits.json` inchangé.

## Definition of Done
- [ ] motif 1 levé : TOUS les messages de `_valider` au format `produits[<i>].<champ> : <valeur> invalide (<raison>)` (ou `<champ> : <valeur> invalide (<raison>)` à la racine) — formats tranchés en Contrats pour les 3 cas ; `rg -n "raise RegistreInvalide|RegistreInvalide\(" bin/produits.py` + chaque message produit par un registre muté collés
- [ ] motif 2 levé : `sources[].chemin` validé comme `depots[].chemin` (commence par `/` ou `~/`) dans `_valider` ; ET `verifier` ne lève JAMAIS (toute exception d'un chemin → message dans la liste) ; `Source('finance','~zzinconnu/x.md')` → `RegistreInvalide` au chargement, et `verifier` sur un `Produit` forgé à la main avec ce chemin → message, 0 exception (collé)
- [ ] non-régression : les 26 registres mutés de l'évaluateur (`.cache/eval-T009/mut.py`) → `RegistreInvalide` ×26, tous au format ; DoD L1 #1/#2 (`contrat.md:313-319`) → `'' ('kora', 'geolens', 'agentx', 'seagle') seagle` et `{…: []}` ×4
- [ ] API inchangée : `inspect.signature` des 9 fonctions avant == après (collé) ; `produits.json` md5 avant == après
- [ ] `python3 -m py_compile bin/produits.py` rc 0 ; `git diff --stat -- bin/produits.py` collé
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/produits.py` | E | `_valider` (~L113-191 ; messages L130, L137, L190) · `verifier` (~L250-282) |
| `vault/projets/seagle-pilotage/taches/T009-evaluer-t007-registre-des-produits/result.md` | L | verdict détaillé |
| `.cache/eval-T009/mut.py` | L | 26 mutations à rejouer |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C1 L40-116 · DoD L1 L313-319 |
| `produits.json` | L | registre réel (ne pas modifier) |
| `.cache/T010/` | E | essais |

## Contrats
Motif de renvoi de T007 (évaluation T009, verbatim) :
```
_valider : 3 messages hors format §C1 « produits.i.champ : valeur invalide (…) » : cle en double, couleur en double, 0 entreprise
verifier lève RuntimeError sur sources.chemin ~user/ : Source('finance','~zzinconnu/x.md') → RuntimeError Could not determine home directory.
```
Formats tranchés par le chef :
```
cle en double      → produits[<i>].cle : <cle> invalide (en double, déjà produits[<j>])
couleur en double  → produits[<i>].couleur : <couleur> invalide (en double, déjà produits[<j>])
0 entreprise       → produits : 0 entreprise invalide (exactement 1 entreprise:true)
```

## Décisions actées
- 2e renvoi sur la chaîne T003 → T007 → T010 : modèle opus
- 0 changement de règle (longueurs, regex, domaines) ; 0 changement d'API ; T005 et T006 utilisent ce module en parallèle

## Hors périmètre
- `produits.json`, `bin/vx.py`, `bin/publier.py`, `outils/captures/`

## Environnement
- `charger(chemin)` : passer le chemin en argument (défaut figé à l'import)
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/T010/`), Grep, `Bash(python3:*)`, `Bash(git diff:*)`, `Bash(md5sum:*)`, `Bash(mkdir:*)`, `Bash(cp:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T010
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
