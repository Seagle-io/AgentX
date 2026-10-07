---
titre: ortho-front — commandes et pièges d'environnement
resume: node 24, tsc -b, lint global rouge, chromium 1243 vs 1234, stack e2e 5183 interdite aux agents
source: dashboard-direct T003-T011
cree: 2026-10-06
tags: [note, ortho-front, outillage]
---

# ortho-front — outillage

## Fait
- dépôt `~/Documents/Workspace/OrthoPro/ortho-front` ; branche `master` ; 178 fichiers non committés → ∅ git destructif, ∅ toucher hors WL
- `test:unit` exige node 24 : PATH `~/.nvm/versions/node/v24.15.0/bin` → `ℹ tests 406 · pass 406`
- typage : `npx tsc -b` ; e2e : `npx tsc -p tsconfig.e2e.json`
- `npm run lint` rouge repo-wide : 760 erreurs préexistantes (hors dashboard) → lint ciblé : `npx eslint src/modules/dashboard e2e/dashboard` → 0 erreur, 16 warnings (`dashboard-widgets.tsx`)
- `npm run build` → `✓ built`, réécrit `dist/` ; avertissement chunk > 500 kB normal
- Playwright attend chromium_headless_shell-1243 ; 1234 installé → `npx playwright install chromium`
- stack e2e `127.0.0.1:5183` : `make test-e2e` ; interdite aux agents → `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5183` → `000` = e2e NV
- specs : `npx playwright test e2e/dashboard` (4 fichiers, 6 tests)
- interdits : migration, push, `make deploy`

## Pourquoi ça compte
- sans ça : lint « KO » faussement attribué, test:unit KO sous node ≠ 24, e2e déclarés passés sans stack

## Où
- `ortho-front/package.json` — scripts
- `ortho-front/e2e/support/backend.js` — support e2e

## Voir aussi
- [[playwright-getbyrole-sous-chaine]]
- [[ortho-front-dashboard-carte]]
