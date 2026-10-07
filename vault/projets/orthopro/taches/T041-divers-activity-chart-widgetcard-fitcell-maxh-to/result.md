---
tache: T041
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/activity/activity-chart.tsx:7,49,70-73,173` — shell `<section>` → `WidgetCard icon='bar-chart' title='Activité' actions={toolbar}` ; sous-titre + total gardés dans le corps ; bodyClassName `@container/chart flex flex-col overflow-hidden p-4`
- `ortho-front/src/modules/dashboard/dashboard-layout.util.ts:4,51-60` — `fitCell` : `const b = boundsOf(grid)` ; w/h bornés par `b.maxW`/`b.maxH` ; `?? Infinity` et `?? GRID_COLS` supprimés
- `ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts:81,84-89` — attente `[12, 999]` → `[12, 60]` ; +1 test : h=200 sans maxH → 60, w=20 → 12
- `ortho-front/src/shared/ui/toast/toast.tsx:5,14-15,52-54` — `ToastItem.action?: { label; onClick }` ; rendu `Button variant='ghost' size='sm'`, onClick puis `onClose()`
- `ortho-front/src/modules/dashboard/dashboard-page.tsx:299` — toast « Widget retiré » : `action: { label: 'Annuler', onClick: history.undo }`, description « Ctrl + Z » retirée
- cycle `dashboard-layout.util.ts ⇄ layout-ops.core.ts` : préexistant côté core (`import { clamp } from util`), aucun appel top-level → runtime OK ; eslint sans `import/no-cycle` → 0 erreur ; tsc 0

## Vérifié comment
- `npm run test:unit` → `ℹ tests 399 · ℹ pass 399 · ℹ fail 0`
- `node --test src/modules/dashboard/dashboard-layout.util.test.ts` → `ℹ tests 16 · ℹ pass 16 · ℹ fail 0` ; `✔ cleanLayout: sans maxH, la hauteur est bornée à celle de la grille (60) ; largeur à 12 colonnes`
- `npm run typecheck` → exit 0 (3 tsc, 0 sortie)
- `npx eslint <5 fichiers WL E>` → `✖ 3 problems (0 errors, 3 warnings)` — warnings `react-refresh/only-export-components` toast.tsx:25,75,87 préexistants (exports `useToast`/`storageRefusalToast`/`unlessStorageRefusal`)
- `rg -n "rounded-card border border-border bg-bg-panel" …/components/widget` → activity-chart 0 hit ; restants : `weather-widget.tsx:77`, `kpi/dashboard-kpi.tsx:39` (voulus, exclus pack), `widget-card.tsx:35` (le shell), `forum/dashboard-forum.tsx:18` (hors WL, voir suite)

## Écarts
- lecture hors WL 1/3 : `rg "icon=" components/widget/activity/activity-year.tsx` → `icon='bar-chart'` — nom d'icône valide pour `IconType` absent du pack
- `icons.ts` introuvable au chemin suggéré par l'import `@/shared/ui/icon/icons` (rg KO) — non bloquant
- arbre partagé : `git diff --stat` montre 20 autres fichiers modifiés hors WL (clock, greeting, tomorrow, …) — non touchés
- hue non posé sur la carte (pack silencieux ; `moduleColorForPath` hors WL)

## Pour la suite
- `forum/dashboard-forum.tsx:18` : shell racine `rounded-card border border-border bg-bg-panel` hors WidgetCard, hors WL T041 — à trancher (A/B ? sinon tâche)
- `WidgetCard` body par défaut `overflow-y-auto` : activity-chart force `overflow-hidden` (ResizeObserver sur le corps) — vérifier visuellement qu'aucun ascenseur n'apparaît en case basse
- cycle util ⇄ core toléré ; un `import/no-cycle` futur casserait → déplacer `clamp` + `boundsOf` dans `grid.constants.ts`
- toast : `setTimeout` 6 s ferme le toast même si action non cliquée — l'undo reste dispo via Ctrl+Z, cohérent

## Retour sur le pack
- Manquait : nom d'icône `IconType` pour Activité ; hue ou non ; `layout-ops.core.ts` importe déjà `clamp` depuis util (cycle préexistant, à dire)
- Inutile : ∅
