---
tache: T006
statut: fait
---
## Livré
- `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/deplacement.spec.ts:26-39` — focus chrome, 2×ArrowRight, attend status idle
- `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/ajout-widget.spec.ts:27-51` — clic catalogue → cell ; dragTo grid → cell (actif, pas fixme)
- `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/persistance.spec.ts:26-46` — déplacement, idle, reload, API saved/x=2
- `~/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/annulation.spec.ts:1-81` — créé : retrait+Annuler · Ctrl+Z+reload · PUT 500 → error → Réessayer → idle
## Vérifié comment
- `npx tsc -p tsconfig.e2e.json` → ∅ sortie, exit 0
- `npx eslint e2e/dashboard` → ∅ sortie, exit 0
- `rg 'dash-edit|dash-placement|dash-save\b|dash-grip' e2e` → 7 hits, tous `dash-save-status` (`\b` matche avant `-`) ; `rg "dash-edit|dash-placement|dash-grip|dash-save['\"\]]" e2e` → 0, exit 1
- `npx playwright test e2e/dashboard` → NV — stack absente (`curl 127.0.0.1:5183` → 000, `:3000/api/health` → 404)
## Écarts
- ∅ lecture hors WL
- DoD 2 : variante `dragTo` laissée active, pas `fixme` — instabilité non observable sans stack ; `targetPosition {200,400}` sous la case seedée
- DoD 5 : regex du pack faux positif sur `dash-save-status` ; sélecteurs morts réels = 0
## Pour la suite
- Lancer `make test-e2e` puis `npx playwright test e2e/dashboard` (4 fichiers, 6 tests) ; coller la sortie
- Si `ajout-widget.spec.ts:40-51` (dragTo) rouge : passer en `test.fixme('rgl dépôt HTML5 instable sous Playwright')`
- Hypothèses à confirmer côté T003/T004/T005 : toast retrait = `getByRole('button',{name:'Annuler'})` ; bouton Réessayer **dans** `dash-save-status` ; undo d'un geste déjà sauvé re-déclenche un PUT (status repasse idle)
- annulation.spec.ts:66-69 : `page.route` ne bloque que PUT, GET continue (seed afterEach non impacté : hors page)
## Retour sur le pack
- Manquait: où vit le bouton Réessayer (status vs toast) ; texte exact du toast retrait vs rôle du bouton · regex DoD 5 corrigée ci-dessus
- Inutile: ∅
