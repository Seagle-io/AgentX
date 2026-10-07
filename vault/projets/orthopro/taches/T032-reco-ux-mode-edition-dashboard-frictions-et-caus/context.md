---
pack: T032
projet: orthopro
role: eclaireur
cree: 2026-10-05
---

# Pack T032 — Reco UX mode édition

> Seule source de vérité de l'agent T032. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Lire le mode édition du dashboard (entrée, sélection, déplacement, redimensionnement, ajout, réglages, suppression, undo/redo, enregistrement, sortie) et dresser la liste des frictions d'usage **prouvables par le code** (coordonnées + mécanisme), classées par gravité, avec pour chacune la correction minimale.

## Definition of Done
- [ ] parcours : 10 étapes du mode édition, chacune = `fichier:L — ce qui se passe (≤ 12 mots)`
- [ ] frictions ≥ 10, chacune : `fichier:L — symptôme utilisateur — cause — correctif ≤ 15 mots — H/M/B` ; chercher au minimum : drag souris vs rgl (grid.tsx, `isDraggable`, `draggableHandle`, `cancel`), poignées de resize visibles ?, sélection au pointerdown qui vole le clic (edit-cell.tsx:48-118), clavier sans tableau de deps (dashboard-page.tsx:253-268 : flèches capturées même dans un input ?), NumberInput bornes manuelles (edit-cell.tsx:89-101), compaction verticale qui déplace les voisins (layout-ops.core settle), placement overlay (grid.tsx:40-81), responsive <640 non éditable (grid.tsx:111-121), save qui ferme l'édition sans confirmation, Annuler qui perd tout sans confirmation, undo/redo accessibles au clavier ?, feedback visuel de la case sélectionnée, scroll pendant drag, panneau catalogue qui masque la grille (widget-panels.tsx)
- [ ] 3 contre-mesures structurantes max (≤ 3 lignes chacune) si une friction vient de react-grid-layout lui-même (version : `rg '"react-grid-layout"' package.json`)
- [ ] `result.md` ≤ 150 lignes, selon « Format de sortie »

## Fichiers autorisés
Lecture seule.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | orchestration édition L150-300 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | rgl, overlay, handles |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | sélection, outils, NumberInput |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | L | barre d'édition |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | L | catalogue, réglages |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | nudge/resize/place/settle |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | undo/redo |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/tab-bar.tsx` | L | entrée édition |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/package.json` | L | version rgl |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | L | styles .react-grid-* (rg seulement) |

## Contrats
```
nudge(layout, id, dx, dy) · resize(layout, id, w, h, gridOf) · place(layout, widget, at, newId) · boundsOf(grid) → {minW,minH,maxW,maxH} défauts 1,1,12,60
useEditHistory<T>(initial) → { value, set(update, record=true), reset, undo, redo, canUndo, canRedo, changes }
GRID_COLS 12 · ROW_HEIGHT 24 · GRID_GAP 16 · STACK_BELOW 640 (pile, non éditable)
dashboard-page.tsx:253-268 onKey : ArrowLeft/Right/Up/Down → nudge ; shift → resize ; effet sans deps
data-testid posés : dash-grid, dash-cell, dash-edit, dash-add-widget, dash-catalogue-item, dash-placement, dash-cell-remove, dash-save, dash-cancel
```

## Décisions actées
- kit UI showcase, 0 nouveau composant — RULE.MD
- react-grid-layout conservé sauf preuve d'impasse — remplacer = projet à part

## Hors périmètre
- modifier un fichier ; widgets ; style visuel pur sans effet d'usage

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc) — cwd ortho-front
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T032
statut: fait | bloque
---
## Parcours
- n. fichier:L — étape
## Frictions
- fichier:L — symptôme — cause — correctif — H/M/B
## Structurant
- ≤ 3 items
## Vérifié comment
rg/lecture → faits
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : lots proposés (fichiers disjoints)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
