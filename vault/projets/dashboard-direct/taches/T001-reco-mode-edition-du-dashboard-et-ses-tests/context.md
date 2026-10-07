---
pack: T001
projet: dashboard-direct
role: eclaireur
cree: 2026-10-06
---

# Pack T001 — Reco mode édition du dashboard et ses tests

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier tout ce qui dépend du **mode édition** du dashboard ortho-front (`editing`) : états, composants, flux de sauvegarde, repères e2e → carte collable dans les packs de suppression du mode.

## Definition of Done
- [ ] `dashboard-page.tsx` : chaque état/callback lié à `editing` listé `L1-L2 — rôle` (startEditing, save, cancel, confirmation, history, selectedId, dropping, settingsFor, catalogueOpen)
- [ ] flux de persistance : qui appelle `saveDashboardLayout`, quand (bouton ? auto ?), debounce, `saved` flag, `setSaved` — coordonnées
- [ ] `grid.tsx` : props/branches conditionnées par `editing` (drag handle `.dash-grip`, resize handles, PlacementOverlay, min-h) — lignes
- [ ] `edit-cell.tsx`, `edit-header.tsx`, `widget-panels.tsx` : responsabilité en 1 ligne chacun + ce qui survivrait sans mode édition (réglages widget, catalogue, onglets)
- [ ] historique : API de `use-edit-history.ts` / `edit-history.core.ts` (signatures verbatim)
- [ ] `layout-ops.core.ts` : signatures verbatim de `place`, `resize`, `nudge`, `boundsOf`
- [ ] e2e `e2e/dashboard/*.spec.ts` : chaque spec → ce qu'il suppose du mode édition (sélecteurs, data-testid, « Modifier », « Enregistrer ») — lignes
- [ ] CSS `.dash-grid-editing`, `.dash-selected`, `.dash-pushed`, `.react-grid-item` : où définies (rg)
- [ ] pièges : collisions de noms, double source de vérité layout (draft vs saved), zoom (`rootZoom`)
- [ ] `result.md` rempli selon « Format de sortie », ≤ 150 lignes

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | 627 l., cœur du mode édition |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | grille RGL v2, overlay de pose |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | habillage d'une case en édition |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-header.tsx` | L | barre d'édition |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/widget-panels.tsx` | L | catalogue + réglages |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | undo/redo |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-history.core.ts` | L | |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | place/resize/nudge |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | LayoutCell, toCells, STACK_BELOW |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | contrat API |
| `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/` | L | 3 specs |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/index.css` | L | rg .dash- seulement |

## Contrats
∅ — tu les produis (signatures verbatim dans `## Livré`).

## Décisions actées
- Mode édition supprimé — décision humain 2026-10-06
- Lib conservée : `react-grid-layout` ^2.2.4 — déjà en place
- Contrat API `saveDashboardLayout(tabs)` inchangé — back hors périmètre

## Hors périmètre
- Proposer une architecture ou un découpage.
- Lire les widgets (`components/widget/*`), le back, les autres modules.
- Toute écriture hors `result.md`.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, `Bash(rg:*)`, `Bash(ls:*)`, `Bash(wc:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots) ; contrats en bloc de code verbatim
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
