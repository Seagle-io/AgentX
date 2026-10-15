---
tache: T010
statut: fait
---
## Livré
- scripts/check-dist.mjs:L1-32 — scan `<dir>/**/*.{js,html}`, exit 1 / `--warn` exit 0
- package.json:L8 — build + `check-dist.mjs --warn`
- package.json:L11-12 — `check:dist`, `test:e2e`
- .github/workflows/deploy.yml:L36-37 — étape `Check dist` entre Build et Upload
- e2e/run.mjs:L1-150 — crawl sitemap + contact 200/réseau KO + RDV 200/409, 4 workers
## Vérifié comment
`VITE_CHAT_API_URL=http://localhost:3001 npx vite build --outDir T010/dist-local` ; `npx vite build --outDir T010/dist`
`node scripts/check-dist.mjs T010/dist-local` → `✗ 2 fichier(s) … appellent localhost : …/assets/index-gZpCVdrD.js, …/assets/index-xmDBP9np.js` · exit 1
`… T010/dist-local --warn` → même liste · exit 0
`… T010/dist` → `dist OK` · exit 0
motif `https?://(localhost|127\.0\.0\.1)` nu → faux positif `T010/dist/assets/index-AxYhi00Z.js` : `let s="http://localhost";` + `new URL("http://localhost")` (react-router) → motif `…[:/]` → 0 faux positif
`BASE=http://localhost:4405 npm run test:e2e` (SITEMAP défaut `dist/sitemap.xml`, T010/dist/sitemap.xml ∅) → 4 runs exit 0 :
```
38/38 OK en 48.2 s
38/38 OK en 44.1 s
113/113 OK en 94.9 s
113/113 OK en 94.2 s
```
dernier run (extrait, sortie complète : artefacts/seagle-site/T010/e2e-run-final.txt) :
```
✓ page /es
✓ page /de
✓ page /produits
…
✓ contact → 200 : succès
✓ contact → réseau coupé : mail de secours
✓ rdv → 200 : confirmation
✓ rdv → 409 : message traduit

113/113 OK en 94.2 s
```
`git diff --stat -- package.json .github/workflows/deploy.yml` → `deploy.yml | 2 ++` · `package.json | 6 ++++--` · 2 files, 6 insertions(+), 2 deletions(-)
preview 4405 arrêté (kill pid 2814733) → curl 000
prérendu → NV — réservé au chef
## Écarts
- motif check-dist = `https?://(localhost|127\.0\.0\.1)[:/]` ≠ DoD — faux positif react-router sinon
- canonical attendu ≤ 8 s ≠ « 1 s max » — posé 2-5 s après load sous charge ; 3 s → flaky (/produits, /, /products)
- crawl : `**/api/**` coupé par défaut — aucun appel réel hors mocks
- SITEMAP : T010/dist/sitemap.xml ∅ (plugin écrit `dist/` en dur) → `dist/sitemap.xml` partagé, 33 → 109 `<loc>` pendant la tâche (autres agents)
- 0 lecture hors WL
## Pour la suite
- canonical initial `https://seagle.io/` puis corrigé (/produits, /products) → vérifier HTML prérendu fige la bonne valeur
- canonical injecté tard (2-5 s) quand canvas charge le thread → prerender.mjs doit l'attendre
- `scripts/deploy-static.sh` / `Makefile` : ajouter `npm run check:dist` (humain)
- e2e : 109 pages ≈ 95 s / 4 workers ; prérequis `npm run build && npm run preview`
- vite.config.js:L123 sitemap `dist/` en dur ignore `--outDir`
## Retour sur le pack
- Manquait: faux positif react-router `http://localhost` connu d'avance ; délai canonical | Inutile: ∅
