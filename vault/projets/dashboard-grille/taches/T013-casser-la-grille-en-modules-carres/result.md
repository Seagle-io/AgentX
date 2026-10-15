---
tache: T013
statut: bloque
---
## Livré
VERDICT: NON VÉRIFIABLE — livraison T006–T012 absente de `master` front et back (remisée en stash) ; 0 contrôle navigateur possible
- D1 (déclaré ≠ observé, toutes tâches) ortho-front/src/modules/dashboard/grid.constants.ts:6 — T007 déclare `GRID_COLS = 24`, MODULE_*, moduleOf L1-19 → observé `export const GRID_COLS = 12`, `ROW_HEIGHT = 24`, 8 lignes, ∅ moduleOf — repro : `cat -n src/modules/dashboard/grid.constants.ts`
- D1 bis ortho-back/src/modules/Dashboard/layout/dashboard-widget.catalog.ts:118 — T006 déclare 24 → observé `GRID_COLS = 12` ; `dto/save-dashboard.dto.spec.ts` absent ; migration `1791478545214-ConvertDashboardTo24Cols.ts` absente de `src/database/migrations/`
- D1 ter API :3000 (compte de test) — GET `/api/dashboard/layout` → `status 200 keys [ 'saved', 'tabs' ]`, ∅ `gridCols` ; onglet « Accueil » 16 cases, max(x+w)=12 ⇒ base non migrée en 24 (≠ pack « base migrée en 24 col ») — repro : `node .cache/T013/verif/get-layout.mjs`
- localisation de la livraison : front `stash@{1}` « WIP dashboard grille 24 colonnes (avant maj master 14/10) » (60 fichiers, + `e2e/dashboard/grille-24.spec.ts` en ^3) ; front `stash@{0}` « État conflictuel après pop du WIP grille 24 sur master 97949db » ; back `stash@{0}` (6 fichiers + ^3 : migration, dto.spec, verif-t014-*.spec)
- obstacles à la réapplication (constatés, pas encore défauts) :
  - base du stash front = `acbe32e`, master +202 commits, 49 fichiers `src/modules/dashboard` modifiés depuis
  - `revenue` déplacé : `components/widget/revenue/` n'existe plus ; master importe `@/modules/compta/widgets/revenue` dont `index.tsx:8` = `grid: { w: 4, h: 6, minW: 3, minH: 5, maxW: 8, maxH: 8 }` (unités 12) ⇒ édition T009 revenue perdue, widget à demi-largeur après réapplication
  - arbre de travail master : `dashboard-widgets.tsx` DEFAULT_CELLS réécrit en 12 col (bandes 8+4, non commité) + `kpi/dashboard-kpi.tsx` VALUE_MAX 40px non commité ⇒ conflit avec stash (DEFAULT_CELLS 24×31, kpi T011)
- contrôle statique fait sur stash : DEFAULT_CELLS (stash@{1}) = 12 cases, aire 744 = 24×31, ∅ chevauchement, ∅ trou → OK sur papier, NV à l'écran
- tableau widgets OK/KO : ∅ (NV) · PNG : ∅
- fin : compte de test non modifié (0 PUT) ; état trouvé = 1 onglet « Accueil » 16 cases, pas vide
Question (BLQ) : faut-il que l'humain réapplique sur `master` les stashes « WIP grille 24 » (front `stash@{1}`, back `stash@{0}` avec fichiers non suivis), résolve les conflits (DEFAULT_CELLS, kpi, revenue déplacé dans `compta`), lance `npm run migration:run` côté back et relance Vite/`start:dev`, avant une nouvelle tâche de vérification — ou la grille 24 colonnes est-elle abandonnée ?
## Vérifié comment
`git -C ortho-front branch --show-current` → `master` ; idem back → `master`
`cat -n ortho-front/src/modules/dashboard/grid.constants.ts` → `6 export const GRID_COLS = 12` · `7 export const ROW_HEIGHT = 24` · `8 export const GRID_GAP = 16`
`grep -n GRID_COLS -r ortho-back/src/modules/Dashboard/layout/` → `dashboard-widget.catalog.ts:118:export const GRID_COLS = 12`
`ls ortho-back/src/database/migrations | grep -i dashboard` → `1790947799498-AddDashboardLayout.ts` (seule)
rejeu T006 `npx vitest run src/modules/Dashboard/layout` (back) → `Test Files  2 passed (2)` `Tests  11 passed (11)` ≠ déclaré `3 passed / 15 passed`
rejeu T007–T011 `PATH=…node24 npm run test:unit` (front) → `ℹ tests 676 · ℹ pass 676 · ℹ fail 0` ≠ déclaré 432/426 (suite de master, ne contient pas les tests 24 col)
`grep -n gridCols ortho-front/src/api/dashboard-layout.ts` → ∅ (T007 déclare L7-8,L27-31,L43)
`node verif/get-layout.mjs` → `status 200 keys [ 'saved', 'tabs' ] gridCols undefined saved true` · `[{"name":"Accueil","n":16,"maxXW":12}]`
`git stash list --date=iso` (front) → `stash@{2026-10-14 19:54:49}: … État conflictuel après pop du WIP grille 24 sur master 97949db` · `stash@{2026-10-14 19:53:40}: … WIP dashboard grille 24 colonnes (avant maj master 14/10)`
`git rev-list --count 'stash@{1}^1'..HEAD` → `202` ; `git diff --stat 'stash@{1}^1' HEAD -- src/modules/dashboard` → `49 files changed, 809 insertions(+), 641 deletions(-)`
`git show --stat 'stash@{0}^3'` (back) → migration `1791478545214-ConvertDashboardTo24Cols.ts`, `save-dashboard.dto.spec.ts`, `verif-t014-dto.spec.ts`, `verif-t014-get.spec.ts`
`git diff HEAD 'stash@{1}' -- dashboard-widgets.tsx grid.constants.ts` → contrat 24 col + DEFAULT_CELLS 24×31 présents dans le stash
`grep -rn "grid:" src/modules/compta/widgets/` → `revenue/index.tsx:8: grid: { w: 4, h: 6, minW: 3, minH: 5, maxW: 8, maxH: 8 }`
non lancés (sans objet sur master 12 col) : `npx tsc -b`, eslint, `npm run build`, back `tsc --noEmit`, Playwright 1024–1920, PUT/conversion
## Écarts
- lecture hors WL: `git status`/`git log`/`git stash list` front+back — localiser la livraison absente
- lecture hors WL: `git diff`/`git show --stat` des stashes — vérifier que la livraison y est
- lecture hors WL: `src/api/dashboard-layout.ts` (grep gridCols) — affirmation T007
- lecture hors WL: `src/modules/compta/widgets/revenue/index.tsx` (grep grid:) — revenue déplacé
- `git stash`, `git show`, `git rev-list`, `git log` hors liste Bash du pack — lecture seule
## Pour la suite
- recopier : front `stash@{1}` + `stash@{1}^3` ; back `stash@{0}` + `stash@{0}^3` (exclure `verif-t014-*.spec.ts`)
- recopier : revenue vit dans `src/modules/compta/widgets/revenue/index.tsx:8` → tailles T004 (9×6 / 7×3 / 24×12) à reporter là
- recopier : arbre master non commité `dashboard-widgets.tsx` (DEFAULT_CELLS 12 col) et `dashboard-kpi.tsx` (VALUE_MAX 40px) à trancher avant réapplication
- après réapplication + migration : relancer T013 tel quel (pack valide) ; harnais `verif/get-layout.mjs` réutilisable
## Retour sur le pack
- Manquait: précondition vérifiable « livraison présente sur master » (ex. `grep GRID_COLS grid.constants.ts → 24`, GET → `gridCols:24`) ; mention des stashes du 14/10
- Inutile: ∅
