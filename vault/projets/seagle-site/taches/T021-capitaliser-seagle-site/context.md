---
pack: T021
projet: seagle-site
role: scribe
cree: 2026-10-14
---

# Pack T021 — Capitaliser seagle-site

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Condenser le projet seagle-site en notes atomiques réutilisables (`vault/connaissances/`) et en corrections de gabarits, à partir des sections « Retour sur le pack », « Pour la suite » et « Écarts » des 27 result.md.

## Definition of Done
- [ ] `python3 bin/vx.py integrer --projet seagle-site` lu (seule vue des result.md, pas d'ouverture fichier par fichier sauf besoin)
- [ ] 3 à 5 notes `vault/connaissances/seagle-*.md` (≤ 40 lignes, gabarit `_templates/note.md`) : outillage (build/prérendu/preview/ports/sitemap en dur), i18n + routes 5 langues (contrat, pièges), a11y (tokens texte vs encres ASCII, audit.mjs), e2e/check-dist (limites)
- [ ] gabarit `_templates/context.md` : manques récurrents ajoutés en 1 ligne chacun si absents (ex. « fichiers non suivis par git → copie avant modif pour diff », « build partagé : outDir n'isole pas les plugins qui écrivent en dur », « classe d'état figée par le prérendu ≠ preuve de montage »)
- [ ] `brief.md` : cases de la DoD du projet cochées ou annotées (preuve courte : T0xx)
- [ ] `todo.md` : relu, entrées faites cochées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/brief.md` | E | DoD projet |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/todo.md` | E | suivi |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/decisions.md` | L | décisions |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/` | L | result.md via integrer |
| `~/Documents/Workspace/AgentX/vault/_templates/context.md` | E | manques récurrents |
| `~/Documents/Workspace/AgentX/vault/_templates/note.md` | L | format note |
| `~/Documents/Workspace/AgentX/vault/connaissances/` | E | notes neuves (ne pas modifier les existantes) |
| `~/Documents/Workspace/AgentX/bin/vx.py` | L | `integrer`, `index` |

## Contrats
∅ — format des notes : `_templates/note.md` ; langage dense `_templates/LANGAGE.md`.

## Décisions actées
- projet non archivé : l'humain valide visuellement et commite d'abord
- notes = faits réutilisables, pas récit du projet

## Hors périmètre
- dépôt seagle-website (aucune écriture) ; archiver ; autres projets

## Environnement
- cwd `~/Documents/Workspace/AgentX` ; `python3 bin/vx.py index` après écriture des notes

## Budget
- Lectures hors whitelist : **3 maximum**, journalisées dans `## Écarts`.
- Outils : Read, Write, Edit (fichiers E), Grep, Glob, Bash (`python3 bin/vx.py`)
- Si bloqué : statut `bloque`, **une** question précise, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T021
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
