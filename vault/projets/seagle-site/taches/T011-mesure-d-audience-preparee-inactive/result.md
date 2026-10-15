---
tache: T011
statut: fait
---
## Livré
- src/lib/analytics.ts:L1-L20 — nouveau ; injecte script si VITE_ANALYTICS_SRC posée
- src/lib/analytics.ts:L12 — garde `!document.getElementById("seagle-analytics")` anti-doublon
- index.html:L84 — `<script type="module" src="/src/lib/analytics.ts">` fin `<head>`
- .env.example:L1-L17 — 3 variables vides + exemples Plausible/Umami commentés
- src/vite-env.d.ts — ∅ (absent ; `tsconfig.json` types `vite/client` suffit)
- artefacts/seagle-site/T011/verif.mjs — Playwright off/on, `page.route` abort audience

## Vérifié comment
npx tsc --noEmit -p . → (vide) ; exit 0
npx vite build --outDir …/T011/dist --emptyOutDir → ✓ built in 5.08s
VITE_ANALYTICS_SRC=https://plausible.io/js/script.js VITE_ANALYTICS_DOMAIN=seagle.io npx vite build --outDir …/T011/dist-on --emptyOutDir → OK
rg -c "seagle-analytics" …/T011/dist/assets → 0 (exit 1) ; branche éliminée au build
rg -c "seagle-analytics" …/T011/dist-on/assets → index-yPrB25B1.js:1
node verif.mjs off (preview :4406, dist) →
  off / script#seagle-analytics=0 · off /contact =0
  off audience-requests-blocked=0 · off external-hosts= fonts.googleapis.com
node verif.mjs on (preview :4406, dist-on) →
  on / script#seagle-analytics=1 <script id="seagle-analytics" defer="" data-domain="seagle.io" src="https://plausible.io/js/script.js"></script>
  on /contact =1 (idem)
  on audience-requests-blocked=2 (plausible.io abortée) · external-hosts= fonts.googleapis.com,plausible.io (requête émise puis abort)
git diff --stat -- index.html src/lib/analytics.ts .env.example → index.html | 1 + ; analytics.ts `??`
preview arrêté par pid → `curl :4406` KO, ∅ process `vite preview.*4406`
HTML prérendu (anti-doublon) → NV — prérendu réservé au chef

## Écarts
- DoD 4 : `rg -c` dist par défaut → 0, pas « présent » — `if (undefined && …)` éliminé par minif ; 0 octet d'audience, mieux que l'attendu
- .env.example ignoré par `.gitignore:7 .env.*` → `git add -f .env.example` requis (`.gitignore` hors WL)
- 1er run : `kill` du pid `npx` n'a pas tué l'enfant `vite` → 2e preview KO port pris ; enfant (pid 2811501, outDir T011/dist) tué par pid ; relancé via `node_modules/.bin/vite`, OK
- lecture hors WL: tsconfig.json — typage import.meta.env (vite/client)
- lecture hors WL: src/lib/smooth-scroll.ts — style voisin (sans `;`, guillemets doubles)

## Pour la suite
- commit : `git add -f .env.example` ou ajouter `!.env.example` à `.gitignore`
- prérendu avec SRC posée → la balise sera figée dans le HTML ; vérifier 1 seule `script#seagle-analytics` après hydratation
- activer = poser VITE_ANALYTICS_SRC (+ DOMAIN ou WEBSITE_ID) dans l'env du build de prod (deploy-static.sh / CI)
- CSP éventuelle : autoriser l'hôte du script en `script-src` et `connect-src`
- piège outillage : lancer `node_modules/.bin/vite preview` (pas `npx`) pour que `$!` soit le vrai pid

## Retour sur le pack
- Manquait: `.gitignore` ignore `.env.*` ; DoD 4 supposait code présent alors que Vite l'élimine
- Inutile: clé i18n / design (∅ UI)
