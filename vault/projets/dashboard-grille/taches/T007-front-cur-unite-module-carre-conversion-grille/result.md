---
tache: T007
statut: bloque
---
## Livré
- src/modules/dashboard/grid.constants.ts:L1-19 — contrat 24 col, module 24–48, STACK_BELOW 944
- src/modules/dashboard/dashboard-layout.util.ts:L48-53,L113-118,L128-132 — migrateLegacyCells, readCells, cleanLayout opts.legacy
- dashboard-layout.util.ts:L147,L162,L175-186 — readTabs legacy:true ; fromServer legacy = gridCols≠24
- src/api/dashboard-layout.ts:L7-8,L27-31,L43 — gridCols?: number ; PUT {gridCols: GRID_COLS, tabs}
- src/modules/dashboard/dashboard-widgets.tsx:L45,L62-74,L141-154 — rowsToPx(h, module=MODULE_MIN), gridLabel, ré-export STACK_BELOW, DEFAULT_CELLS 24×31
- src/modules/dashboard/components/grid.tsx:L6,L63-117 — overlay prop module, pas module+GRID_GAP x/y
- grid.tsx:L154-156,L206-226,L249 — gridWidthOf/moduleOf, rowHeight module, maxWidth 1520, maxRows ∞
- src/modules/dashboard/components/widget/types.ts:L14 — commentaire « modules carrés (24 de large) »
- src/modules/showCase/components/DashboardWidgetsSection.tsx:L7-12,L47-59,L131 — toPx = modulesToPx(n, moduleOf(1600)) ; prop grid retirée
- dashboard-layout.util.test.ts — catalogue 24 col ; +migrateLegacyCells 6 ex ; fromServer 24/absent ; toServer clés ; readTabs objets/chaînes ; cleanLayout legacy
- layout-ops.core.test.ts — unités 24 ; today 8×16 [8..24] + test resize
- layout-ops.core.ts — ∅ diff : lit déjà GRID_COLS (→24), boundsOf maxW défaut 24
## Vérifié comment
- étape 0 curl → NV — lecture auth_token refusée (classifieur auto-mode, « Credential Exploration ») ; 0 requête envoyée, onglet non remis
- étape 0bis `grep -rn dashboardWidgets src` → `dashboard-widgets.tsx:168 LAYOUT_PREFERENCE = 'dashboardWidgets'` ; seul appel en écriture `dashboard-page.tsx:151 updatePreferences({ [LAYOUT_PREFERENCE]: '' })` = vidage après reprise, 0 disposition écrite → OK
- `npm run test:unit` → `ℹ tests 432 · pass 432 · fail 0`
- `npx tsc -b` → `tsc exit 0` (aucune sortie)
- `npx eslint <10 fichiers E>` → `✖ 16 problems (0 errors, 16 warnings)` — tous react-refresh/only-export-components dashboard-widgets.tsx, existants
- `grep -rnE "_grid|GRID_MARK|isLegacyLayout|stripMark|ROW_HEIGHT" src` → seulement `src/shared/ui/gantt/gantt.tsx:51,141,191,211` (const ROW_HEIGHT locale du gantt, sans rapport) ; dashboard ∅
## Écarts
- DoD 0 non cochée — gate curl non exécutée (permission refusée), donc statut bloque
- grid.constants.ts:L9 commentaire « = ancien ROW_HEIGHT » → « = ancienne hauteur de rangée » — contrat verbatim ≠ grep ∅
- grep ∅ non strict : gantt.tsx garde son ROW_HEIGHT local, hors périmètre
- DoD 0bis : 1 écriture (vidage à '') jugée non bloquante — ne porte aucune disposition
- lecture hors WL : dashboard-page.tsx:130-155 via grep -B3 -A22 — qualifier l'écriture 0bis
## Pour la suite
- La gate étape 0 doit être lancée par l'humain/le chef (token) : PUT sans gridCols→400, {x:0,w:24}/{x:23,w:1}→200, GET gridCols:24, puis remettre « Accueil » vide.
- showCase : moduleOf(1600) appliqué aussi aux échantillons « grille 1000 » → libellés trompeurs ; SAMPLES.grid n'est plus lu. Utiliser moduleOf(s.grid) ?
- widget/*/index.tsx encore en unités 12 jusqu'à T008–T011 : clamp maxW/minW peut rétrécir la disposition livrée d'ici là.
- LEGACY_COLS exporté (contrat) mais inutilisé : migrateLegacyCells code ×2 en dur (contrat).
## Retour sur le pack
- Manquait: URL du back (port) pour la gate ; accès au token incompatible avec le classifieur auto-mode — fournir un script de gate ou faire lancer la gate par le chef ; périmètre de « today 8×16 [8..24] » (quel fichier test, [8..24] = minW..maxW ?) ; moduleOf(1600) vs SAMPLES 1000 à trancher
- Inutile: ∅

Question (BLQ) : la gate étape 0 (curl authentifié sur le back) peut-elle être lancée par le chef ou l'humain, puisque la lecture de `auth_token` m'est refusée par le classifieur, afin de passer T007 à `fait` ?
