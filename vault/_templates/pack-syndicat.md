---
pack: {{ID}}
projet: {{PROJET}}
role: syndicat
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cahier de revendications {{PERIMETRE}} sur {{PERIODE}}, chiffré, livré en `vault/syndicat/<date>-<perimetre-slug>.md`.

## Definition of Done
- [ ] chaque revendication : « N. constat — source → correction → gain [cible: C · indicateur: I · attendu: X] »
- [ ] chaque chiffre sourcé (commande ou fichier:ligne) ; sans source : NV
- [ ] triées par gain attendu
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/syndicat/` | E | livrable |
| `vault/projets/` | L | journaux, result.md |

## Contrats
Raison chiffrée du cahier : {{RAISON}}
Source : `{{INTEGRER}}`
Tâches couvertes : {{TIDS}}

## Décisions actées
- il propose ; n'édite ni pack ni gabarit

## Hors périmètre
- appliquer une revendication ; modifier pack, gabarit, code

## Environnement
Période : {{PERIODE}}. `python3 bin/vx.py` pour les mesures (personnel, manques).

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write, Bash(python3 bin/vx.py:*)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- `vault/syndicat/<fichier>` — N revendications
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
