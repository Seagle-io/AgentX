---
tache: T010
statut: fait
---
## Livré
- G/web/viewer.html:16 — meta CSP = contrat ; inline :23-26 supprimé
- G/web/src/viewer/index.html:16 — meta CSP = contrat (miroir)
- G/web/src/viewer/boot-web.ts:10,20-22 — import + `installIdleLogout()` avant `void boot()`
- G/web/src/viewer/loaders/TilesRendererLoader.ts:169,177 — `'/draco/'`, `'/basis/'`
- G/web/public/draco/ — 3 fichiers cp depuis three 0.184.0
- G/web/public/basis/ — 2 fichiers cp depuis three 0.184.0
- G/Caddyfile:1-28 — 3 l commentaire + contrat verbatim
- G/web/src/viewer/__tests__/csp.test.ts:1-47 — NEUF, 5 cas
- fin de fichier des 2 HTML : `\r` final d'origine préservé
## Vérifié comment
```
node scripts/check-viewer-html-sync.mjs → [check-viewer-html-sync] OK — 263 IDs JS vérifiés, les 2 entrées HTML sont synchronisées. exit=0
npx vitest run src/viewer/__tests__/csp.test.ts → ✓ (5 tests) · Tests 5 passed (5)
npm --prefix web test → Test Files 176 passed (176) · Tests 1683 passed (1683)
npm --prefix web run build → ✓ built in 20.71s · exit=0 (warning chunks > 500 kB seulement)
ls web/dist/draco web/dist/basis → basis_transcoder.js basis_transcoder.wasm · draco_decoder.js draco_decoder.wasm draco_wasm_wrapper.js
rg -c --pcre2 '<script(?![^>]*src=)' web/dist/viewer.html → (vide) exit=1 ⇒ 0
rg unpkg web/src web/viewer.html → 3 hits, tous csp.test.ts (assertions d'absence)
rg unpkg web/src web/viewer.html -g '!**/__tests__/**' → ∅ exit=1
git status --short web/public → ?? web/public/
git diff --stat (mes fichiers) → Caddyfile 16 +++++++- · boot-web.ts 3 +++ · index.html 2 +- · TilesRendererLoader.ts 4 +- · viewer.html 6 +-----
caddy validate → NV — Caddy non lançable ici
npm --prefix web run build:viewer-types → NV — hors outils autorisés
```
## Écarts
- DoD3 `rg unpkg` ≠ ∅ — seuls hits = littéraux du test csp
- `rg -c` exige `--pcre2` (lookahead) — commande pack sans
- git diff --stat global : 28 autres fichiers modifiés hors WL — T008/T009/autres, pas T010
- lecture hors WL: ∅ (rg/ls sur tsconfig*, package.json scripts, node_modules/three/libs — inventaire)
## Pour la suite
- csp.test.ts importe `node:fs` ; tsconfig.viewer.json `types:["vite/client"]` → `build:viewer-types` peut KO (précédent : draftContent.frozen.test.ts passé à `import.meta.glob ?raw`) ; à vérifier
- viewer.html:8-12 et index.html:8-12 : commentaires CSP cog:/photo: désormais faux ; viewer.html:22 commentaire orphelin
- nginx doit servir `/draco/*`, `/basis/*` (.wasm → application/wasm) ; non vérifié, nginx.conf hors WL
- humain : `caddy validate --config Caddyfile` + vérif en-têtes `curl -I` sur /viewer.html et /
- TilesRendererLoader.ts:167-168,175-176 commentaires « aligné unpkg 0.184 » obsolètes (copie locale = node_modules)
## Retour sur le pack
- Manquait: `rg -c` sans `--pcre2` ; DoD `rg unpkg` → ∅ incompatible avec cas test littéral `unpkg` ; contrainte typecheck viewer sans @types/node
- Inutile: ∅
