---
tache: T030
statut: fait
verdict: OK
---
## Vérifié comment
- `node --test layout-ops.core.test.ts dashboard-layout.util.test.ts` → tests 29 · pass 29 · fail 0
- `npx eslint` 10 fichiers WL → exit=0, 0 ligne
- `npm run typecheck` → exit=0 (app + e2e + node)
- `npm run test:unit` → tests 384 · pass 384 · fail 0 (aucun KO hors WL)
- sonde `t030.probe.test.ts` → 12 cas, 12 OK ; supprimée ; `git status --short | grep t030` → ∅
  - boundsOf(undefined) = {1,1,12,60} OK · maxW:20 → 12 OK · maxH:undefined → 60 OK
  - resize h=200, widget sans maxH → h=60 OK
  - cleanLayout([]) → [] OK · cleanLayout(['kpi']) → ['kpi','today'] OK (attendu repris de util.test.ts:95)
  - fromServer onglet `cells:[]` → layout [] OK
  - readTabs('{"tabs":[]}') = HEAD (`git show HEAD:` copié en scratchpad, comparé deepEqual) OK
  - cleanLayout ≡ HEAD sur ['kpi'], ['zzz'], ['kpi','kpi','today'], [null], [cellule], [mixte] OK ; readTabs ≡ HEAD sur undefined, '', '{pas', '["kpi"]', onglet ['kpi'] OK
  - écart voulu : `{"tabs":[{"id":"a","layout":[]}]}` HEAD → ["today"], now → [] ; `'[]'` HEAD → [today], now → []
- grid.tsx:8 `import { boundsOf } from './edit/layout-ops.core'` ; grid.tsx:86 :
```ts
const withBounds = ({ i, widget, x, y, w, h }: LayoutCell): LayoutItem => ({ i, x, y, w, h, ...boundsOf(widgetById(widget)?.grid) })
```
- même source de bornes : souris `widgetById(widget)?.grid` (grid.tsx:86) = clavier `gridOf = id => widgetById(id)?.grid` (layout-ops.ts:5)
- grid.tsx:89-91 `cellTestAttrs` → `data-testid='dash-cell' data-widget data-cell-id data-x data-y data-w data-h` ; posé pile grid.tsx:111, grille grid.tsx:151
- grid.tsx:63 `data-testid='dash-placement'` sur l'overlay
- `rg -n "data-testid='dash-" src/modules/dashboard` → 7 lignes : placement grid:63, grid page:355, edit tab-bar:64, catalogue-item widget-panels:112, add-widget edit-header:146, cancel :157, save :158
- dash-cell = grid.tsx:90 (clé objet) ; dash-cell-remove = edit-cell.tsx:75,110 via `testid` → ToolButton edit-cell.tsx:17 `data-testid={testid}` — 9/9 présents
- widget-panels.tsx:113 `data-widget={w.id}` sur dash-catalogue-item
- edit-cell.tsx:74 « Réglages » ∅ testid ; :109 « Réglages » ∅ testid
- `rg -n "maxH" grid.tsx layout-ops.core.ts edit-cell.tsx` → layout-ops.core.ts:21,50 (boundsOf/resize) ; edit-cell.tsx:101 (connu HP) ; grid.tsx ∅ borne locale
## Défauts
- ∅
## Écarts
- ∅ lecture hors WL fichier ; `rg` sur src/modules/dashboard (layout-ops.ts:5, dashboard-widgets.tsx:173) — source gridOf
- HEAD a bougé pendant vérif (9cc4a91 → eadc665, autre lot) ; `git show --stat eadc665` ne touche pas WL T028
- `dates.probe.test.ts` (today/) non suivi, pas à moi — laissé
## Pour la suite
- dashboard-layout.util.ts:58 fitCell `maxH ?? Infinity` ≠ boundsOf 60 : cellule chargée h=200 reste 200 (sonde p11) — 3e chemin de bornes, préexistant
- edit-cell.tsx:89-90,100-101 bornes manuelles (pack disait 93,102) — vague 3b
- resize(l,'a',NaN,NaN) → x/w/h null (sonde p12) ; impact si NumberInput émet NaN — NV
- data-* via ReactGridLayout dans le DOM — NV sans rendu ; e2e T010 tranchera
- legacy brut `'[]'` → onglet Accueil vide (HEAD : today) — cohérent décision, à confirmer humain
## Retour sur le pack
- Manquait: rg DoD littéral ne capte ni `'data-testid': 'dash-cell'` ni prop `testid=` → 7 lignes, pas 9 ; lignes edit-cell décalées (89/101) ; `[]` brut = cas voulu, pas « inchangé »
- Inutile: ∅
