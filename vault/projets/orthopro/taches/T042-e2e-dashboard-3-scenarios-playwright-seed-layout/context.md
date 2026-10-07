---
pack: T042
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T042 — E2E dashboard : 3 scénarios Playwright

> Seule source de vérité de l'agent T042. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire `e2e/dashboard/*.spec.ts` (3 scénarios du contrat T010 : ajout de widget, déplacement clavier, persistance après rechargement) sur le pattern `e2e/forum/markdown.spec.ts`, avec un helper de seed `PUT /dashboard/layout` dans `e2e/support/backend.ts`, et les faire passer avec `make test-e2e`.

## Definition of Done
- [ ] `e2e/support/backend.ts` : `export async function seedDashboardLayout(token: string, tabs: DashboardTabData[]): Promise<void>` → `PUT /dashboard/layout { tabs }` via `request()` existant ; `export async function getDashboardLayout(token)` → GET
- [ ] `e2e/dashboard/ajout-widget.spec.ts` S1 : seed 1 onglet, 1 case greeting (0,0,8,4) ; `dash-edit` → `dash-add-widget` → `dash-catalogue-item[data-widget=W]` (W sans `requires`, ex. `clock`) → clic `dash-placement` → `expect(dash-cell[data-widget=W])` ×1 → `dash-save` → toast « Tableau de bord enregistré »
- [ ] `e2e/dashboard/deplacement.spec.ts` S2 : seed case A(0,0,4,4) ; `dash-edit` → clic `dash-cell` A → `ArrowRight` ×2 → `expect A data-x=2` → `dash-save`
- [ ] `e2e/dashboard/persistance.spec.ts` S3 : après S2 → `page.reload()` → `expect A data-x=2` ; GET /dashboard/layout → cells[A].x === 2
- [ ] préconditions : viewport 1440×900 (≥ STACK_BELOW 640), session depuis `e2e/.fixtures/session.json` (pattern forum L20-22), seed en `beforeEach`, restauration `tabs: []` en `afterEach`
- [ ] `make test-e2e` lancé UNE fois (autorisé : migrations + seed sur `ortho_test`, tue les ports 3000/5183) puis `npx playwright test e2e/dashboard` tant que la stack tourne → sortie brute collée : 3 passed ; en cas d'échec : coller l'erreur Playwright complète, statut `bloque` si c'est le produit (pas le test) qui est en cause, avec UNE question
- [ ] `npx eslint e2e/dashboard e2e/support` → 0 ; `npm run typecheck` (tsconfig.e2e inclus) → 0
- [ ] `result.md` rempli selon « Format de sortie » (+ section `## Stack` : comment la stack a été lancée/arrêtée, logs /tmp/ortho-front-e2e-back.log si erreur)

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/ajout-widget.spec.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/deplacement.spec.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/dashboard/persistance.spec.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/support/backend.ts` | E | seed/get layout |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/support/session.ts` | L | Session |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/config.ts` | L | FRONT_URL, API_URL |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/forum/markdown.spec.ts` | L | pattern |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/global-setup.ts` | L | fixtures |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/playwright.config.ts` | L | testMatch, storageState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/Makefile` | L | test-e2e |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/api/dashboard-layout.ts` | L | types DashboardTabData |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/grid.tsx` | L | data-x/y/w/h, dash-cell (rg) |

## Contrats
```ts
// api : PUT /dashboard/layout { tabs: DashboardTabData[] } → DashboardLayout ; GET /dashboard/layout → { saved: boolean; tabs: DashboardTabData[] }
export type DashboardTabData = { id: string; name: string; color: string | null; cells: DashboardCellData[] }
export type DashboardCellData = { id: string; widget: string; x: number; y: number; w: number; h: number; config: Record<string, unknown> }  // id = UUID client (crypto.randomUUID())
// backend.ts : async function request<T>(method, path, body?, token?) ; API_URL = http://localhost:3000/api ; pool pg (closePool en afterAll si utilisé)
// testids : dash-grid · dash-cell + data-widget data-cell-id data-x data-y data-w data-h · dash-edit · dash-add-widget · dash-catalogue-item + data-widget · dash-placement · dash-cell-remove · dash-save · dash-cancel · dash-confirm
// clavier : flèche = nudge 1 colonne sur la case sélectionnée (dashboard-page onKey) ; sélection = clic sur la case (hors .dash-grip)
// pattern forum : import { test, expect } from '@playwright/test' ; session = JSON.parse(readFileSync('e2e/.fixtures/session.json')) ; imports '../support/backend.js' (suffixe .js) ; test.describe + beforeAll/beforeEach ; locators getByTestId / locator('[data-testid=…]')
// Makefile test-e2e : migration:run + seed sur TEST_DB=ortho_test ; fuser -k 3000 5183 ; back PORT=3000 ; front 5183 ; log /tmp/ortho-front-e2e-back.log
```

## Décisions actées
- `make test-e2e` autorisé par l'humain (base de test uniquement) — decisions.md#vague-3b
- drag souris non testé (rgl instable) : clavier — T010

## Hors périmètre
- modifier src/ ; autres specs ; snapshots visuels

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Edit, Write, Grep, Bash(make test-e2e, npx playwright, npx eslint, npm run typecheck, curl, rg, git status, fuser) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` ; interdit : toute commande sur une base autre que ortho_test
- Si bloqué : statut `bloque`, une question précise dans `result.md`, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T042
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL)
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
