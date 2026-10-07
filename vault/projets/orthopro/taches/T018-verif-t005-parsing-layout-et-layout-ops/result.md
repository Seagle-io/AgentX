---
tache: T018
statut: fait
verdict: OK
---
## Vérifié comment
- `npm run test:unit` → `ℹ tests 352 · pass 350 · fail 2` ; les 2 KO = `components/widget/clock/clock.probe.test.ts:28,29` (P11/P12 alarmProblem), sonde d'un autre vérificateur, hors T005
- `node --test dashboard-layout.util.test.ts layout-ops.core.test.ts edit-history.core.test.ts` → `ℹ tests 30 · pass 30 · fail 0` (react-grid-layout/core chargé sous node)
- `npx eslint <10 fichiers WL>` → `✖ 16 problems (0 errors, 16 warnings)`, tous `react-refresh/only-export-components` dans dashboard-widgets.tsx ; exit=0
- `npm run typecheck` → exit=0, 0 sortie tsc
- sonde `t005.legacy.probe.ts` = HEAD widgets L71-74,143-206,217-329 + HEAD layout-ops verbatim ; stub 3 widgets (today, kpi{maxW6,maxH8}, billing requires facturation) ; `crypto.randomUUID`→compteur commun remis à 0 par côté ; catalogue = recopie de dashboard-widgets.tsx L173-185
- `node --test t005.probe.test.ts` → `SONDE: 77 entrées comparées, 77 égales` · `ℹ tests 4 · pass 4 · fail 0`
- 77 entrées : readTabs ×25 (undefined, '', JSON KO, null, 42, "x", {}, 0 onglet, tabs non tableau, ids ×3 dont inconnu/doublon/sans module, [], cases, cases sans module, cases pourries, ids+cases mélangés, {tabs} doublons/sans nom/nom 42/nom blanc/null, requires sans module, tous invalides, unicode 🎉, ±1e9/1e12, 1e999) · cleanLayout [] ×2 · fromServer ×3 · toServer∘fromServer ×2 · toServer ×2 · addToLayout ×3 · nudge ×19 (4 bords, ±100, 0/0, voisin, bord droit, absent →`===L`, []) · resize ×14 (sous min, sur max, h 61/1000, 0, négatif, 4.5, inconnu h70→60, x décalé, absent →`===L`) · place ×7 (case occupée, x10 débordant, négatif, y100, []) · MAX_H_DEFAULT=60
- contrôle négatif : resize kpi 99×99 → `{w:6,h:8}` ≠ `{w:99,h:99}` → la comparaison voit les écarts
- `cleanLayout([])` : HEAD `[{"i":"gen-1","widget":"today","w":4,"h":20,"x":0,"y":0}]` = T005 identique → écart déclaré confirmé, 0 régression
- `rg -n "^import" dashboard-layout.util.ts layout-ops.core.ts edit-history.core.ts` → util: `import type …/widget/types`, `import type @/api/dashboard-layout`, `GRID_COLS ./grid.constants.ts` ; core: `react-grid-layout/core`, `../../grid.constants.ts`, `../../dashboard-layout.util.ts` ; edit-history.core: ∅ → 0 `.tsx`
- `git diff HEAD -- dashboard-page.tsx | rg "^[-+]import"` → `-import { useEffect, useMemo, useRef, useState } from 'react'` / `+import { useCallback, useEffect, … } from 'react'` → seul ajout `useCallback` (T004), 0 import T005
- historyReducer, 3 cas sonde : undo×3 après 3 set → `v0`, future `[v1,v2,v3]`, 4e undo `===h` OK ; undo puis set → future `[]`, redo `===h` OK ; record=false ×3 → past `[0]`, undo → 0 OK. Déjà couverts : redo vidé (core.test L33), record=false (L15-18) ; undo×3 absent
- `git diff HEAD -- use-edit-history.ts edit-cell.tsx` → hook délègue au reducer, logique identique ; edit-cell L7 import + L101 `?? MAX_H_DEFAULT`
- `rm` des 2 sondes ; `ls src/modules/dashboard/t005.*` → `Aucun fichier` ; `git status --short src/modules/dashboard | grep t005` → ∅
## Défauts
- ∅
## Écarts
- ∅ (git show HEAD de 2 fichiers WL uniquement)
## Pour la suite
- comportement HEAD conservé, contraire à la doc util.ts:110-111 « liste vide respectée » : `fromServer` tab `cells:[]` → case `today` ajoutée, id neuf ; idem `{tabs:[{id,layout:[]}]}` — décider si bug produit
- `test:unit` rouge à cause de `clock.probe.test.ts` (sonde d'un autre vérificateur, non supprimée à l'instant T) — à purger
- arbre partagé mouvant pendant T018 (t020.probe, widget-state.ts apparus/disparus) — git status final non stable
## Retour sur le pack
- Manquait: lignes HEAD exactes des helpers hors L217-343 (fitCell, pack, layoutBottom L143-206 ; isConfig L73) ; L343 coupe patchCellConfig (prendre L217-329)
- Inutile: ∅
