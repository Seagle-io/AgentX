---
tache: T027
statut: fait
---
## Livré
- web/src/viewer/loaders/TilesRendererLoader.ts:143-145 — 3 l. contrat, registerPlugin si plugin
- web/src/viewer/backend/install.ts:12 — import installTileCache, type TilesPlugin
- web/src/viewer/backend/install.ts:45-46 — ProjectDetail + contentTag, viewerUserId
- web/src/viewer/backend/install.ts:117-118 — window.__glrTileCachePlugin = installTileCache(...)
- web/src/api.ts:105 — ProjectDetail + contentTag, viewerUserId
- web/src/auth.tsx:4,36,39 — login purge sélective ; logout purge avant POST
- web/src/idleLogout.ts:13,37 — defaultOnIdle purge avant redirection
- web/src/viewer/backend/__tests__/tileCacheWiring.test.ts:1-55 — idle : ordre logout→purge→redirect (spy)
## Vérifié comment
npx --prefix web vitest run --root web src/viewer/backend/__tests__/tileCacheWiring.test.ts → `✓ (1 test) 25ms · Test Files 1 passed (1) · Tests 1 passed (1)`
npm --prefix web run typecheck → `typecheck exit=0`
npm --prefix web run build:viewer-types → `viewer-types exit=0`
npm --prefix web test → `Test Files 182 passed (182) · Tests 1745 passed (1745)` ; 0 échec préexistant
git -C G diff -U0 TilesRendererLoader.ts, diff avant/après → seul ajout `@@ -140,0 +143,3 @@` (3 l. contrat) ; hunks :35, :266-311, :349, :681-690 contenu identique, décalés +3
git -C G status --short -- web/ → `M api.ts, auth.tsx, idleLogout.ts, install.ts, TilesRendererLoader.ts, qualityHud.ts · ?? tileCacheWiring.test.ts, errorTargetRefine.test.ts, errorTargetRefine.ts`
## Écarts
- contrat TRL « après :142 » → réel après :141 (`}` du if signFn) ; insertion après la fermeture, conforme intention
- auth.tsx login/logout : 0 test — React sans jsdom, NV
- lecture hors WL : ∅
## Pour la suite
- commit TRL : n'indexer que le hunk `@@ -140,0 +143,3 @@` (git add -p), reste = autre mission
- idleLogout.ts (dashboard + viewer) importe tileCache.ts → module dans bundle dashboard
- auth.tsx login/logout non testés (env node, pas de jsdom) ; à couvrir en e2e
- plugin effectif seulement si API renvoie contentTag+viewerUserId (lot A) et kill switch off
## Retour sur le pack
- Manquait: numéro de ligne TRL décalé de 1 (:141 réel) ; signaler absence de test auth/idle existant
- Inutile: ∅
