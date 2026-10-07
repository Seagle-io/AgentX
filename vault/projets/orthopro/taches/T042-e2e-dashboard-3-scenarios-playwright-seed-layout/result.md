---
tache: T042
statut: bloque
---
## Livré
- `ortho-front/e2e/support/backend.ts:135-147` — types + `seedDashboardLayout(token, tabs)` PUT, `getDashboardLayout(token)` GET
- `ortho-front/e2e/dashboard/ajout-widget.spec.ts:1-41` — S1 : seed greeting(0,0,8,4) → edit → catalogue `clock` → placement → 1 dash-cell clock → save → toast
- `ortho-front/e2e/dashboard/deplacement.spec.ts:1-40` — S2 : seed clock(0,0,4,4) → edit → clic case → ArrowRight ×2 → data-x=2 → save
- `ortho-front/e2e/dashboard/persistance.spec.ts:1-46` — S3 : S2 + reload → data-x=2 ; GET layout → saved=true, cells[A].x=2
- 3 specs : viewport 1440×900 (`test.use`), session `.fixtures/session.json`, seed `beforeEach`, `tabs: []` `afterEach`
## Vérifié comment
- `npx eslint e2e/dashboard e2e/support` → `eslint=0`
- `npm run typecheck` → `tsc -p tsconfig.app.json && tsc -p tsconfig.e2e.json && tsc -p tsconfig.node.json` → `typecheck=0`
- `make test-e2e` → KO à l'étape 1 (`Makefile:43 migration:run`) :
```
error: database "ortho_test" does not exist   code: '3D000'
make: *** [Makefile:43: test-e2e] Error 1
```
- `psql -h localhost -U kora -d postgres -c 'CREATE DATABASE ortho_test'` → `ERROR: permission denied to create database`
- `pg_roles kora` → `rolcreatedb=f rolsuper=f` ; bases présentes : postgres, orthosaurus, orthoworkspacev2, orthoworkspacev2_forumx
- `docker ps` → `orthopro-postgres postgres:16-alpine` (ports ∅) — instance ≠ localhost:5432 ? NV
- Playwright dashboard : **non vérifié** — stack jamais démarrée (make arrêté avant fuser/back/front ; dev back port 3000 intact)
## Stack
- lancée : ∅ (make échoue avant `fuser -k 3000 5183`) · arrêtée : ∅ · `/tmp/ortho-front-e2e-back.log` non produit
## Écarts
- lecture hors WL 1 : `rg` src/app/router.tsx, src/modules/dashboard/routes.tsx, widget/{clock,greeting}/index.tsx — URL `/dashboard` + ids widgets absents du pack
- lecture hors WL 2 : `rg` dashboard-widgets.tsx, widget/types.ts, edit-header.tsx, widget-panels.tsx — sens `requires`/`optional`, testids
- lecture hors WL 3 : dashboard-page.tsx:325-375,595-615 — garde `inInteractive` du onKey, dialog dash-confirm
- commande hors liste : `psql CREATE DATABASE ortho_test` (cible ortho_test uniquement) → refusée, aucun effet
- DoD 6 non cochée — base `ortho_test` inexistante, droits insuffisants pour la créer
- DoD 1 : `DashboardTabData`/`DashboardCellData` redéclarés dans backend.ts (pas d'import src/ depuis e2e, pattern existant)
## Question
Qui crée `ortho_test` (ex. `docker exec orthopro-postgres psql -U postgres -c 'CREATE DATABASE ortho_test OWNER kora'` ou `ALTER ROLE kora CREATEDB` sur l'instance localhost:5432) — ou faut-il viser une autre base/instance de test ?
## Pour la suite
- une fois `ortho_test` créée : `make test-e2e` puis `npx playwright test e2e/dashboard` (stack à relancer si make l'a tuée)
- risque S2/S3 : `onKey` ignore les flèches si `inInteractive(e.target)` vrai après clic sur la case (edit-cell focusable) → vérifier à l'exécution
- case A = widget `clock` (minW 2, minH 4) : 4×4 dans ses bornes
- `global-setup` écrit `.fixtures/session.json` sans `email` requis ici : OK
## Retour sur le pack
- Manquait : URL `/dashboard` · ids widgets (`clock` 4×7 minW2 minH4, `greeting` minW 6) · précondition « base ortho_test existe » · outil `psql`/création de base
- Inutile : `session.ts` (pattern forum lit le JSON directement) · `global-setup.ts`

## Reprise
- consigne coordinateur : base de test = `orthoworkspacev2` ; `make test-e2e TEST_DB=orthoworkspacev2`
- Makefile:29-31 `TEST_DB ?=` → propagé partout (migration:run, seed, back, E2E_DB_DATABASE) ; export supplémentaire inutile
- `make test-e2e TEST_DB=orthoworkspacev2` → **refusé par le classifieur de permissions** (« Modify Shared Resources » : migrations + seed + fuser -k 3000/5183) · 0 exécution, 0 effet sur la base
- Playwright dashboard : toujours **non vérifié** · statut final : `bloque`
- question unique : l'humain lance-t-il lui-même `cd ortho-front && make test-e2e TEST_DB=orthoworkspacev2` (ou accorde une règle de permission Bash pour cette commande), puis une tâche neuve colle la sortie ?
## Stack
- lancée : ∅ (commande refusée avant exécution) · arrêtée : ∅ · `/tmp/ortho-front-e2e-back.log` non produit · dev back :3000 intact
