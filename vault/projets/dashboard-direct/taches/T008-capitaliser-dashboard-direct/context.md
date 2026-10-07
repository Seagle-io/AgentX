---
pack: T008
projet: dashboard-direct
role: scribe
cree: 2026-10-06
---

# Pack T008 — Capitaliser dashboard-direct

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Transformer les result.md du projet `dashboard-direct` (T001-T011) en notes atomiques réutilisables, mettre à jour brief et plan, agréger les « Retour sur le pack » pour améliorer les gabarits.

## Definition of Done
- [ ] notes `vault/connaissances/` (gabarit `vault/_templates/note.md`, dense, ≤ 40 l., wikilinks) — candidats : `rgl-v2-api-reelle` (dragConfig/resizeConfig/dropConfig/droppingItem, `isDroppable` legacy, chemins des .d.ts) · `ortho-front-dashboard-carte` (fichiers, testids, classes, auto-save) · `autosave-debounce-historique` (1 vérité locale + PUT entier, écho, lastSent) · `playwright-getbyrole-sous-chaine` (exact: true) · `ortho-front-outillage` (node 24, tsc -b, lint global rouge, chromium 1243 vs 1234, stack e2e 5183 interdite aux agents)
- [ ] `brief.md` : DoD cochée/non cochée avec preuve (T007/T011) ; hypothèses invalidées ; carte du terrain mise à jour (fichiers créés/supprimés)
- [ ] `plan.md` : statuts réels, T009-T012 ajoutées, vagues réelles
- [ ] `## Pour la suite` : agrégat des « Retour sur le pack » T001-T011 → 5 corrections max pour `vault/_templates/context.md` et le skill chef (ce qui manquait ≥ 2 fois = défaut de gabarit)
- [ ] `python3 bin/vx.py index` puis `python3 bin/vx.py doctor` → sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/dashboard-direct/` | L | tous les result.md (T001-T011), decisions.md ; jamais réécrire un result.md |
| `vault/projets/dashboard-direct/brief.md` | E | |
| `vault/projets/dashboard-direct/plan.md` | E | |
| `vault/connaissances/` | E | notes nouvelles |
| `vault/_templates/note.md` | L | gabarit |
| `vault/_templates/LANGAGE.md` | L | dense |
| `vault/INDEX.md` | L | régénéré par `index` |

## Contrats
```markdown
# note.md (gabarit)
---
titre: · resume: · source: · cree: · tags: [note]
---
# <titre>
## Fait  ## Pourquoi ça compte  ## Où  (- `chemin:L1-L2` — …)  ## Voir aussi  (- [[autre-note]])
```
Règle : une note = un fait réutilisable hors de ce projet ; le récit d'une tâche n'en est pas un.

## Décisions actées
- `result.md` et `decisions.md` append-only — règle 7
- vault Obsidian, dense, à l'essentiel — règles 9-10

## Hors périmètre
- Le code ortho-front ; modifier les gabarits ou le skill toi-même (tu proposes, le chef applique).
- Archiver le projet (le chef le fera après validation humaine).

## Budget
- Lectures hors whitelist : **3 maximum**, journalisées dans `## Écarts`.
- Outils autorisés : Read, Write, Edit, Grep, Glob, `Bash(python3 bin/vx.py:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T008
statut: fait | bloque
---
## Livré
- note créée : `vault/connaissances/<slug>.md` — résumé 1 ligne
- brief/plan : ce qui a changé
## Vérifié comment
python3 bin/vx.py index → … ; doctor → …
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : corrections de gabarit/skill, par ordre de fréquence
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
