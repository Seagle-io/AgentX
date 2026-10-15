---
tache: T011
statut: fait
---
## Livré
- G/api/test/tile-route-logs.test.ts:37 — `TILE_SLOW_MS: '500'`
- G/api/test/tile-route-logs.test.ts:84,87,94-95 — titre ≥500, `delay(600)`, assertions ≥500
- G/.gitignore:16 — `tools/load/.env.k6` sous bloc Secrets/env
## Vérifié comment
- `git -C G diff --stat -- api/ .gitignore` → `.gitignore | 1 +` · `api/test/tile-route-logs.test.ts | 10 +++++-----` · `2 files changed, 6 insertions(+), 5 deletions(-)`
- `npm --prefix api test &` + `npx vitest run test/tile-route-logs.test.ts` ×10 (G/api) → `vert=10 rouge=0` · `10 Tests 7 passed (7)` · load avg 5,31 → 13,03
- `npm --prefix api test` (lancé en parallèle) → `Test Files 99 passed (99)` · `Tests 873 passed (873)` · `Duration 23.03s` · `full exit 0`
- `git -C G status --short` → ` M .gitignore` · ` M api/test/tile-route-logs.test.ts` + préexistants hors T011 : ` M web/src/viewer/loaders/TilesRendererLoader.ts` · ` M web/src/viewer/ui/qualityHud.ts` · `?? RAPPORT_CHARGE_CORRECTIFS.md` · `?? web/src/viewer/core/errorTargetRefine{,.test}.ts`
## Écarts
- recouvrement charge partiel : suite 23 s vs boucle ×10 41 s → ≈ 5 premiers runs sous charge
- load avg 13 (≠ 24-28 de T010) — machine moins chargée
- incident corrigé : `sed 15a` appliqué d'abord au test (L16) → ligne retirée avant tout test
## Pour la suite
- tile-route-logs : seuil test = prod 500 ms ; cas lent coûte +600 ms par run
- G arbre : web/ (D24 C2/C3) + RAPPORT_CHARGE_CORRECTIFS.md non commités, hors T011 — chef commite séparément
- commit T011 = `.gitignore` + `api/test/tile-route-logs.test.ts` seuls
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
