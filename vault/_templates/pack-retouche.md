---
pack: {{ID}}
projet: {{PROJET}}
role: implementeur
cree: {{DATE}}
retouche: true
---
# Pack {{ID}} — {{TITRE}}
## Mission
TODO-PACK — 1 phrase : quoi changer, `chemin:L`.
## Definition of Done
- [ ] TODO-PACK — comportement attendu, `chemin:L` — HEAD : <commande → valeur>
- [ ] lint/tests : sorties collées (commandes exactes : TODO-PACK ; front tsc = `npx tsc -p tsconfig.app.json --noEmit`)
- [ ] `git diff --stat -- <E>` collé ; diff ≤ 30 l.
- [ ] `result.md` rempli selon « Format de sortie »
## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (≤ 3, E ou L) | E | modifié |
Bloc touché : indentation et format réels recopiés (tabs/espaces, quotes) — 2 retouches ratées sur chemin/format WL (T179 T183).
## Contrats
TODO-PACK — défaut recopié, ou lignes HEAD → cible verbatim + `chemin:L` ; sinon `∅`.
## Hors périmètre
- hors WL, refactor, mineurs ; Budget et interdits hérités de [[pack-implementeur]] ([[LANGAGE]])
## Environnement
- fichiers E déjà modifiés non commités ⇒ lister TES lignes (plages) ; `git diff --stat` global ≠ écart
- mesure : `git diff --stat -- <chemins E de ta WL>` et `git diff -U0 -- <chemins E de ta WL> | rg -c '^[+-][^+-]'` — SES fichiers seulement ; arbre partagé : un diff global compte le travail d'autrui (≠ écart)
## Format de sortie
`result.md` à côté de ce pack — **ÉCRIRE LE FICHIER avec l'outil Write** (un rendu seulement affiché est perdu) — dense, ≤ 30 lignes :
```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: revue | bloque
---
## Livré
- `chemin:L1-L2` — fait
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
