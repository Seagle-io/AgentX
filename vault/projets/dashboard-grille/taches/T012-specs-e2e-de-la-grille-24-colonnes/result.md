---
tache: T012
statut: fait
---
## Livré
- ortho-front/e2e/support/backend.ts:142 — seed PUT `{ gridCols: 24, tabs }`
- ortho-front/e2e/support/backend.ts:145 — type GET + `gridCols: number`
- ortho-front/e2e/dashboard/deplacement.spec.ts:20 — clock `w: 4` → `w: 8`
- ortho-front/e2e/dashboard/persistance.spec.ts:20 — clock `w: 4` → `w: 8`
- ortho-front/e2e/dashboard/ajout-widget.spec.ts:21 — greeting `w: 8` → `w: 16` (×2)
- ortho-front/e2e/dashboard/grille-24.spec.ts (nouveau, 5 tests) — GET 24 · PUT sans gridCols 400 · bords 200 · `{x:20,w:6}` 400 · UI save → `x+w≤24`, ∅ `_grid`
## Vérifié comment
npx tsc -p tsconfig.e2e.json → (aucune sortie) exit=0
npx eslint e2e/dashboard e2e/support/backend.ts → (aucune sortie) exit=0
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183 → 000 (exit 7)
Playwright → NV — stack absente
## Écarts
- ∅ lecture hors WL
- grille-24 importe `API_URL` de `e2e/config.js` — même import que backend.ts, non ouvert
- ajout-widget : greeting doublé par cohérence ×2 ; DoD ne nommait que clock
- grille-24 : 400 vérifiés aussi par sous-chaîne message (`Grille de 24 colonnes attendue`, `dépasse la grille`)
- grille-24 UI : 1 flèche → `data-x` 1 (≠ 2 des autres specs, contrat seul visé)
- PUT bords : 2 cases dans 1 PUT, y 0 et 4 — évite chevauchement
## Pour la suite
- lancer `make test-e2e` (humain) : 4 specs dashboard NV à l'exécution
- si back renvoie 204 sur PUT OK → ajuster `toBe(200)` grille-24
- dépend de T007 (front PUT `gridCols: 24`) pour test UI grille-24, deplacement, persistance
## Retour sur le pack
- Manquait: unités 24 pour greeting (ajout-widget) ; code statut exact PUT OK (200 vs 204) ; export `API_URL` de e2e/config.ts
- Inutile: ∅
