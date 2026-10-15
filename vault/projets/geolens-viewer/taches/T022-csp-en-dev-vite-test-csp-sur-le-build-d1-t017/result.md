---
tache: T022
statut: fait
---
## Livré
- web/src/viewer/cspDev.ts:1-22 — NEUF, relaxCspForDev pur, 0 import
- web/vite.config.ts:5,19-23 — import + plugin glr-csp-dev apply:'serve' après react()
- web/src/viewer/__tests__/csp.test.ts:6,30-46 — cas :29-38 lisent les 2 HTML
- web/src/viewer/__tests__/csp.test.ts:52-71 — +4 cas (on*=, relax, idempotent, sans meta)
- web/viewer.html:8 — commentaire cog:/photo: → 1 ligne CSP stricte T010
- web/src/viewer/index.html:8 — même remplacement ; meta CSP intacte (désormais :12)
## Vérifié comment
node scripts/check-viewer-html-sync.mjs → `[check-viewer-html-sync] OK — 263 IDs JS vérifiés, les 2 entrées HTML sont synchronisées.` exit=0
npx vitest run src/viewer/__tests__/csp.test.ts → `✓ src/viewer/__tests__/csp.test.ts (9 tests) 7ms`
repro dev (node -e, cwd web, createServer middlewareMode hmr 24999 → transformIndexHtml('/viewer.html') → server.close()) →
```
script-src 'self' 'wasm-unsafe-eval' blob: 'unsafe-inline'
preamble inline: true
```
npm --prefix web run build → `✓ built in 35.86s` exit=0
rg -o "script-src[^;]*" web/dist/viewer.html → `script-src 'self' 'wasm-unsafe-eval' blob:`
npm --prefix web test → `Test Files  176 passed (176)` · `Tests  1691 passed (1691)`
npm --prefix web run typecheck → `tsc --noEmit -p tsconfig.json` exit=0
git diff --stat -- vite.config.ts viewer.html src/viewer/index.html csp.test.ts →
```
 web/src/viewer/index.html | 10 +++-------
 web/viewer.html           | 14 +++-----------
 web/vite.config.ts        |  7 ++++++-
 3 files changed, 12 insertions(+), 19 deletions(-)
```
git status --short cspDev.ts csp.test.ts → `?? web/src/viewer/__tests__/csp.test.ts` · `?? web/src/viewer/cspDev.ts`
## Écarts
- csp.test.ts non suivi (??) → absent du diff --stat — non commité depuis T010
- diff --stat HTML inclut les changements non commités antérieurs (base 745d46f)
- vrai navigateur `npm run dev` NV — repro limitée à transformIndexHtml
## Pour la suite
- dev: vite.config.ts plugin glr-csp-dev (apply:'serve') ajoute 'unsafe-inline' à script-src ; prod stricte vérifiée dist/viewer.html
- relaxCspForDev(html) dans web/src/viewer/cspDev.ts, pur, idempotent, testé csp.test.ts
- csp.test.ts + cspDev.ts non suivis git → à inclure au commit D5
- meta CSP maintenant viewer.html:12 = src/viewer/index.html:12 (plus :16)
- smoke navigateur `npm run dev` sur /viewer.html (pack Risque .tsx) reste NV
## Retour sur le pack
- Manquait: csp.test.ts non suivi git (diff --stat vide) ; n° ligne meta post-édition
- Inutile: ∅
