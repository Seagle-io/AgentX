---
tache: T008
statut: fait
---
## Livré
Racine : `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/`
- `free-slots/free-slots-widget.tsx:9,12,38-46,54,58-66` — 3 queries → widgetState, Spinner, erreur+Réessayer (refetch ×3)
- `free-slots/free-slots.util.ts:102-110` — `QueryLike` + `widgetState`, error>loading>empty>ready
- `free-slots/free-slots.util.test.ts:5,53-90` — +2 workRanges, +4 widgetState
- `week-grid/week-grid-widget.tsx:9-12,30-37,51-52,61-68` — idem free-slots ; `isEmpty=false` (workingWeek replie lundi-vendredi, 0 branche vide)
- `week-grid/week-grid.util.ts:93-101` — `QueryLike` + `widgetState`
- `week-grid/week-grid.util.test.ts:5,62-87` — +1 fills (4 statuts), +4 widgetState
- `tomorrow/tomorrow-widget.tsx:9-13,30-44,50,61-69` — queries settings+appointments → widgetState ; query désactivée (attente settings) = loading
- `tomorrow/tomorrow.util.ts:25-33` — `QueryLike` + `widgetState`
- `tomorrow/tomorrow.util.test.ts:5,33-51` — +4 widgetState
- `useful-links/useful-links.tsx:6,8,11,34-38,46-54` — Spinner, erreur+Réessayer (refetch), vide inchangé
- `useful-links/useful-links.util.ts:1-14` — créé : `QueryLike` + `widgetState`
- `useful-links/useful-links.util.test.ts:1-24` — créé : 4 cas widgetState
- Spinner wrapper = `<div className='flex justify-center py-4'><Spinner /></div>` — pattern des 9 widgets voisins
- Réessayer = `<Button variant='ghost' size='sm'>` ; types `['agenda-event-types']` (tomorrow) hors widgetState — décoratif, pas bloquant

## Vérifié comment
`npm run test:unit` →
```
ℹ tests 284
ℹ pass 284
ℹ fail 0
```
`node --test` sur les 4 dossiers → `tests 35 / pass 35 / fail 0`
`npx tsc -p tsconfig.app.json --noEmit | grep -E "free-slots|week-grid|tomorrow|useful-links"` → `∅`
`npm run typecheck` → KO hors WL (vague parallèle) :
```
onboarding/onboarding-widget.tsx(15,39): TS2305 no exported member 'widgetState'
dashboard-widgets.tsx(73,37): TS2304 Cannot find name 'WidgetGrid'
```
`npx eslint <4 dossiers WL>` → `exit=0`, 0 sortie
`npm run lint` global → 755 erreurs, 100 % `@stylistic/jsx-quotes` hors WL (préexistant, 0 dans mes fichiers)
`rg -n "WidgetNote|Spinner" <4 widgets>` → 19 lignes (import + état par widget) ; `rg "<Text"` → `∅`

## Écarts
- lecture hors WL : `rg -n "Spinner|Réessayer"` sur `components/widget/**` — aligner wrapper Spinner sur voisins
- lecture hors WL : `rg tone='error'` quick-reply — T007 pas encore livré, pattern Réessayer défini ici
- DoD « typecheck collé » : OK sur WL, KO global par fichiers T007/T005 en cours — ∅ action possible
- week-grid : 0 état `empty` rendu — `workingWeek` garantit ≥ 5 jours, branche serait morte

## Pour la suite
- `widgetState` identique ×4 (+kora-news/onboarding T007 probables) → vague 3 : `src/shared/…/widget-state.ts` + supprimer copies
- tomorrow : `widgetState` traite query `enabled:false` comme `loading` — contrat T007 à aligner si différent
- tomorrow : query `['agenda-event-types']` ignorée par widgetState (couleurs seulement) — décider si erreur visible
- lint global rouge (755 `jsx-quotes` préexistants) → tâche dédiée `eslint --fix`, hors widgets
- `typecheck` global dépend de T007 (`onboarding.util:widgetState`) et `dashboard-widgets.tsx:WidgetGrid`

## Retour sur le pack
- Manquait : pattern Réessayer attendu (variante Button, layout) ; politique pour query `enabled:false` ; wrapper Spinner des voisins
- Inutile : ∅
