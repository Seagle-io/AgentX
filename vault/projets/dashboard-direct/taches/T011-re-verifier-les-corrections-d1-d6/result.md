---
tache: T011
statut: fait
---
## Livré
VERDICT: DÉFAUTS (2 bénins ; D1-D6 corrigés en nominal)
- D1 CORRIGÉ — `annulation.spec.ts:35` `exact: true` ; seule occurrence `name: 'Annuler'` ; harnais pw `role-exact.spec.ts` → `count exact: 1 count substr: 2`, clic OK
- D2 CORRIGÉ — `use-layout-autosave.ts:94-97` ; harnais test A → `PUTs: 0 status: idle` ; variante V1 (ordre page : schedule puis rendu V2) → `V1 PUTs: 1 name: B`
- D3 CORRIGÉ — `dashboard-page.tsx:264` restore = `commit` fonctionnel ; `use-edit-history.ts:15-16` applique l'update sur `h.present` → retirer A, ArrowRight B (`:319` step coalesce), Annuler → A ajouté à `present` courant, B reste déplacé
- D4 PARTIEL — `dashboard-page.tsx:245` coalesce `'move-tab:'+fromId` ; fenêtre glissante 1000 ms (`edit-history.core.ts:16,38`) → OK si reorders < 1 s d'écart (voir D4+)
- D5 CORRIGÉ — `use-layout-autosave.ts:63` ; variante V5 (vrai changement, 500 puis retry) → `après échec: error 500` → `après retry: idle error= null PUTs: 2`
- D6 CORRIGÉ — `dashboard-page.tsx:231-234` restore → `commit` + `selectTab(id)` même handler
- D4+ `dashboard-page.tsx:238-245` + `edit-history.core.ts:38` — glisser A sur B, survol > 1 s sans reorder, puis sur C → 2 pas → 1 Ctrl+Z = [B,A,C] ; inverse : 2 glisser distincts de A à < 1 s → 1 seul pas — repro: `CORE=<front>/src/modules/dashboard/components/edit/edit-history.core.ts node --test $S/hook/d4.test.mjs` → `pause 1200ms: present BCA past 2 1×undo → BAC` · `2 glisser 900ms: … 1×undo → ABC`
- D3+ `dashboard-page.tsx:264` — restore teste l'id de case, pas le widget : retirer case `clock` A → catalogue la repropose (`:451` filtre `onPage`) → « + » clock (id neuf) → Annuler du toast → 2 cases `clock` sur l'onglet, état que le catalogue interdit ; avant fix l'undo global défaisait l'ajout — repro: lecture `:264` + `:451` ; impact serveur (unicité widget/onglet ?) NV
## Vérifié comment
- `rg -n "name: 'Annuler'" e2e/dashboard` → `annulation.spec.ts:35 … { name: 'Annuler', exact: true }` (1 hit)
- `rg -n "getByRole\('button'" e2e/dashboard` → 2 hits :35 exact, :76 `status.getByRole` = T010 OK
- `npx playwright test -c pw.config.ts` ($S/pw) → `role.spec.ts` KO strict mode 2 éléments (ancien sélecteur, attendu) ; `role-exact` → `count exact: 1 count substr: 2` · `2 passed`
- harnais hook `repro.test.mjs` → A `PUTs: 0 status: idle` ✔ · B `après échec: idle undefined` / `après retry: idle error= undefined` ✔ VIDE (plus de PUT donc plus d'échec ; D5 non testé par B) · C `max en vol: 0 PUTs: 0` ✖ `0 !== 1`
- C ✖ = ordre harnais (rendu V2 idle puis schedule) ≠ ordre page (`:181-184` set+schedule même handler) ; V3 → `V3 PUTs: 0` ; page : seul `record=false` (`:372` byUser false) suit ce chemin
- harnais `t011.test.mjs` (V1 V2 V3 V5) → `tests 5 pass 5 fail 0`
- `npx tsc -b` → ∅, rc=0
- `npx tsc -p tsconfig.e2e.json` → ∅, rc=0
- `npx eslint src/modules/dashboard e2e/dashboard` → `✖ 16 problems (0 errors, 16 warnings)` = T007 ; `npx eslint dashboard-page.tsx use-layout-autosave.ts tab-bar.tsx` → ∅ rc=0
- `npm run test:unit` (node v24.15.0) → `ℹ tests 406 · pass 406 · fail 0` rc=0 (0 test ajouté par T009)
- `npm run build` → `✓ built in 1.56s` (avertissement chunk)
- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` → `000` rc=7 → e2e Playwright NV — stack absente
## Écarts
- lecture hors WL: `src/modules/dashboard/components/edit/use-edit-history.ts` — set fonctionnel ? (D3)
- lecture hors WL: `rg byUser… grid.tsx` + `grid.tsx:66-95` — chemins record=false (C/V3)
- lecture hors WL: `rg uniq|duplicate dashboard-widgets.tsx` → ∅ (D3+)
- lecture hors WL: `rg addToLayout dashboard-widgets.tsx:195` — unicité non tranchée (D3+)
- outils hors liste : `cat`/`sed`/`cut` lecture ; `npx playwright test` dans $S/pw (navigateur 1234) ; build a réécrit `dist/`
- $S = scratchpad session ; ajouts : `hook/t011.test.mjs`, `hook/d4.test.mjs`, `pw/role-exact.spec.ts`
## Pour la suite
- D2 : `:94-97` absorbe dans `lastSent` tout changement rendu en idle sans schedule (recompaction `record=false`) → Ctrl+S ne l'envoie plus ; si RGL 2.2.4 émet onLayoutChange pendant un glisser > 800 ms, fin de glisser jamais PUT — NV e2e
- D6 : `restore` capture `selectTab` du rendu du retrait (`shownTabs[0]` périmé) → onglet déjà revenu par Ctrl+Z puis déplacé hors tête + clic Annuler → `onglet` supprimé, pas sélectionné — dépend durée toast, NV
- D3 : restore no-op silencieux si l'onglet de la case a été supprimé ; case restaurée dans un onglet non affiché sans bascule
- D1 : 2 toasts « Annuler » simultanés → `exact` résout 2 éléments (`count exact 2 toasts: 2`) ; specs actuelles : 1 retrait → OK
- couvrir D2/D4/D5 en test node (harnais `$S/hook` adaptable) : 0 test ajouté
## Retour sur le pack
- Manquait: `use-edit-history.ts` (set fonctionnel, clé de D3) · `grid.tsx` (origine de `byUser`) · harnais B devenu vide après D2 : préciser « variante avec vrai changement »
- Inutile: `autosave.core.test.ts` (sameTabs seul)
