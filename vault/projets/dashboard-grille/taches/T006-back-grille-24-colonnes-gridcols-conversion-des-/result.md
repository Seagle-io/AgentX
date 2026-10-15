---
tache: T006
statut: fait
---
## Livré
racine `~/Documents/Workspace/OrthoPro/ortho-back/src/`
- `modules/Dashboard/layout/dashboard-widget.catalog.ts:117-118` — GRID_COLS = 24, commentaire contrat
- `modules/Dashboard/layout/dto/save-dashboard.dto.ts:2` — import Equals
- `modules/Dashboard/layout/dto/save-dashboard.dto.ts:53-56` — gridCols @Equals(GRID_COLS), message contrat
- `modules/Dashboard/layout/dashboard-layout.rules.ts:32` — retour `{ gridCols: dto.gridCols, tabs }`
- `modules/Dashboard/layout/dashboard-layout.service.ts:8` — import GRID_COLS
- `modules/Dashboard/layout/dashboard-layout.service.ts:16-17` — DashboardView.gridCols
- `modules/Dashboard/layout/dashboard-layout.service.ts:41` — get() renvoie gridCols: GRID_COLS
- `modules/Dashboard/layout/entity/dashboard-cell.entity.ts:6` — commentaire « sur 24 colonnes »
- `modules/Dashboard/layout/dashboard-layout.rules.spec.ts:12,17` — helper + attendu avec gridCols 24
- `modules/Dashboard/layout/dashboard-layout.rules.spec.ts:29-34` — KO {x:20,w:6} ; OK {x:0,w:24},{x:23,w:1}
- `modules/Dashboard/layout/dashboard-layout.rules.spec.ts:44-45` — littéraux SaveDashboardDto + gridCols 24
- `modules/Dashboard/layout/dto/save-dashboard.dto.spec.ts:1-31` — nouveau : bornes x/w, gridCols absent/12/24
- `database/migrations/1791478545214-ConvertDashboardTo24Cols.ts:1-19` — nouveau, contrat verbatim, TS=1791478545214
## Vérifié comment
`npx vitest run src/modules/Dashboard/layout` →
```
 Test Files  3 passed (3)
      Tests  15 passed (15)
```
`npx tsc --noEmit; echo "exit=$?"` →
```
exit=0
```
migration : ni exécutée ni générée (créée via Write)
## Écarts
- lecture hors WL: `ortho-back/package.json:1-40` — commande de migration exacte exigée par DoD
- grep hors WL: usages SaveDashboardDto → seul `layout/dashboard-layout.controller.ts:30` (@Body direct) ; `exercise.dto.spec.ts` imports — 1er run KO `Reflect.getMetadata is not a function` → ajout `import 'reflect-metadata'` (idiome voisin)
- rules.spec.ts:44-45 modifiées hors liste DoD — sans gridCols, tsc KO (type SaveDashboardDto)
- `date +%s%3N` → `1791478545214753162` (%3N ignoré) ; 13 premiers chiffres retenus
## Pour la suite
- humain, depuis `~/Documents/Workspace/OrthoPro/ortho-back` : `npm run migration:run` (→ `typeorm migration:run -d src/database/typeorm.config.ts`) ; retour arrière : `npm run migration:revert`
- back `start:dev` déjà rechargé : PUT sans gridCols → 400 dès maintenant ; front (gridCols: 24 au PUT) à livrer avant/avec la migration
- fenêtre code-24/données-12 : GET renvoie gridCols 24 sur positions 12 col tant que migration non lancée → front migrerait pas ; lancer migration aussitôt
- message 400 gridCols : NV en HTTP (ValidationPipe global non lu) — vérifié par spec uniquement
## Retour sur le pack
- Manquait: `import 'reflect-metadata'` requis dans les dto.spec (idiome repo) · commande migration (package.json) · rules.spec:39-40 littéraux à adapter · `date %3N` non tronqué sur cette machine
- Inutile: `Dashboard/dashboard.controller.ts` (L) — le PUT transite par `layout/dashboard-layout.controller.ts`
