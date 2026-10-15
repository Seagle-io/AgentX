---
tache: T025
statut: fait
---
## Livré
- scripts/check-dist.mjs:L10 — import `existsSync`
- scripts/check-dist.mjs:L17-21 — `<dir>/index.html` absent → exit 1 (D4)
- scripts/check-dist.mjs:L23-26 — motif `/i`, http(s)/ws(s)/`//`, 4 hôtes (D3)
- scripts/check-dist.mjs:L29 — extensions `[mc]?js|json|html|css`, casse ignorée (D3)
- e2e/run.mjs:L46-47 — requête `path + "/"` sauf `/` → HTML prérendu
- e2e/run.mjs:L52-54 — canonical ≡ `https://seagle.io`+path, sans `/` final (D1)
- e2e/run.mjs:L128-132 — 0 `<loc>` → close navigateur, exit 1 (D7)
```js
const LOCAL = /(?:https?:|wss?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[:/]/i
```
- exclusion conservée : `[:/]` après hôte → `new URL("http://localhost")` react-router (base de résolution, n'appelle rien) ignoré
## Vérifié comment
`git diff --no-index --stat T025/avant/check-dist.mjs scripts/check-dist.mjs` → `1 file changed, 12 insertions(+), 5 deletions(-)` (fichiers non suivis → diff vs copie T025/avant)
`git diff --no-index --stat T025/avant/run.mjs e2e/run.mjs` → `1 file changed, 10 insertions(+), 2 deletions(-)`
`node scripts/check-dist.mjs T025/fake/<d>` (copies T020 + `index.html` vide ajouté) → exit 1 : c0000 c127 ccss(.CSS, //127.0.0.1) chtmlfull cipv6 cjson cmixed cmjs cnoscheme cupper cUPPERJS cws cwss(.cjs, WSS://[::1]) ; exit 0 `dist OK` : cconcat cnoport chtml
`node scripts/check-dist.mjs fake/empty|fake/noindex|fake/absent|/nope --warn` → `✗ <d>/index.html absent : build manquant ou incomplet` exit=1
`node scripts/check-dist.mjs T020/build-{http___localhost,HTTP___LOCALHOST,http___0_0_0_0,__localhost}_3001_` → `✗ 2 fichier(s) … appellent localhost` exit=1 ×4
`node scripts/check-dist.mjs` (dist/) → `dist OK` exit=0
`SITEMAP=T020/sitemap-vide.xml node e2e/run.mjs` → `✗ aucun <loc> dans …/sitemap-vide.xml` exit=1 ; fichier 0 octet T025/sitemap-zero.xml → idem exit=1
`SITEMAP=T020/sitemap-fantome.xml node e2e/run.mjs` → `✗ page /produits/supprime — canonical https://seagle.io/` · `✗ page /en/xyz — …` · `✗ page /nexistepas — …` · `4/7 OK en 7.5 s` exit=1
`BASE=http://localhost:4173 npm run test:e2e` → `113/113 OK en 102.8 s` exit=0, 0 `✗` (T025/e2e-4173.txt)
build/preview :4425 non lancés — :4173 suffisait, dist/ intact
## Écarts
- DoD 5 partielle : cconcat (`"http://localhost"+":3001"`), cnoport (= exclusion react-router), chtml (`localhost:3001` sans schéma, jugé inoffensif T020) restent `dist OK` — hors D3, indétectables sans faux positif
- fixtures T020 sans `index.html` → refusées par D4 avant scan ; copiées dans T025/fake + `index.html` vide pour tester le motif
- `--warn` n'adoucit pas D4 (index.html absent = exit 1 même en --warn)
## Pour la suite
- check-dist : concaténation `"http://localhost"+":3001"` non détectable par motif ; garde-fou réel = valeur de VITE_CHAT_API_URL au build (deploy.yml)
- e2e : requiert `/` final sur `<loc>` ≠ `/` ; si prérendu change de convention (fichier `x.html` au lieu de `x/index.html`) → revoir L47
- e2e : 404 réelle non testée (fallback SPA = accueil HTTP 200) ; un `<loc>` mort est détecté via canonical seulement
## Retour sur le pack
- Manquait: scripts/ et e2e/ non suivis par git → `git diff --stat` vide, prévoir copie avant | Inutile: build + preview :4425 (lecture :4173 suffit)
