---
pack: T001
projet: orthopro
role: eclaireur
cree: 2026-10-05
---

# Pack T001 — Reco cœur dashboard front

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier le cœur du dashboard (`ortho-front/src/modules/dashboard/`) : page, grille, mode édition, catalogue de widgets, persistance du layout, chaîne de test — rendre coordonnées + contrats verbatim + défauts constatés, pour écrire les packs d'amélioration.

## Definition of Done
- [ ] flux de données page → widgets décrit en ≤ 10 lignes-faits avec `chemin:L1-L2`
- [ ] contrat `WidgetContext`, `WidgetGrid`, fiche widget (`types.ts`) recopiés verbatim intégralement
- [ ] contrat API layout (`src/api/dashboard-layout.ts`) recopié verbatim (types + fonctions exportées)
- [ ] mode édition : opérations de `layout-ops.ts` listées (signature verbatim), tests existants OUI/NON par fonction
- [ ] grille : constantes `grid.constants.ts` recopiées, responsive/breakpoints OUI/NON avec coordonnée
- [ ] chaîne de test : commandes exactes + sortie brute de `npm run test:unit` et `npm run typecheck` (durée, nb tests, KO éventuels)
- [ ] e2e : confirmer `rg -l dashboard e2e/` = 0 ; relever le pattern d'un spec existant (`e2e/forum/markdown.spec.ts`) + helpers `e2e/support/*.ts` (signatures verbatim)
- [ ] ≥ 5 défauts/dettes concrets avec coordonnée (perf, état d'erreur/chargement, `any`, TODO, duplication) — `rg -n "TODO|FIXME|any\b|console\." src/modules/dashboard --glob '!*.test.ts'`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule partout.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | L | orchestration |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-widgets.tsx` | L | catalogue |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | contrat widget |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | grille |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/grid.constants.ts` | L | constantes |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.ts` | L | ops édition |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/use-edit-history.ts` | L | undo/redo |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/edit-cell.tsx` | L | cellule édition |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | enveloppe commune |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | persistance |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/forum/markdown.spec.ts` | L | pattern e2e |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/support/session.ts` | L | helpers e2e |

## Contrats
```
scripts package.json :
  "typecheck": "tsc --noEmit -p ."
  "test:unit": "node --test 'src/**/*.test.ts'"
  "test:e2e": "playwright test"
```

## Décisions actées
- périmètre vague = qualité widgets existants · mode édition/grille · perf/données — decisions.md#2026-10-05
- HP nouveaux widgets — reporté
- curseur solide — tests unitaires + Playwright par lot

## Hors périmètre
- modifier un fichier (lecture seule, y compris tests)
- `src/modules/dashboard/components/widget/*/` (sauf `widget-card.tsx`, `types.ts`) — couvert par T002
- back `ortho-back` — ∅ cette vague
- `git push`, migrations, `npm install`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc, npm run test:unit, npm run typecheck) — cwd /home/jdrac/Documents/Workspace/OrthoPro/ortho-front
- Scan sans Read (rg/ls/wc) autorisé sur tout ortho-front/src/modules/dashboard, ortho-front/e2e, package.json, playwright.config.ts — ne compte pas comme lecture hors WL
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Contrats
bloc(s) de code verbatim : types.ts, dashboard-layout.ts, layout-ops.ts, grid.constants.ts, helpers e2e
## Défauts
- chemin:L — défaut (≤ 12 mots) — sévérité H/M/B
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
