---
tache: T014
statut: fait
---
## Livré
- src/lib/site-routes.json:L1-45 — 20 clés, og, children.services 8 slugs
- src/lib/site-routes.mjs:L1-41 — normalizePath, localize, alternates, indexedPages (0 import)
- src/lib/site-routes.d.mts:L1-23 — types SiteRoutes, Alternate, IndexedPage + 4 signatures
- src/lib/routes.ts:L1-65 — API contrat ; routes[k] = 5 locales via localize
- src/lib/i18n.ts:L3,L22 — import langFromPath ; initialLanguage URL d'abord
- src/hooks/useLanguageRedirect.ts:L1-41 — règle contrat, navigate garde search+hash
- src/App.tsx:L5,L84-110 — routes 5 locales dédup, /services ×4, /l/*, og:locale
## Vérifié comment
- `diff HEAD-routes json-routes` (fr/en triés) → `12a13 > lab:{fr:/lab,en:/lab},` (seul écart, lab commentée à HEAD) ; 20 clés
- `node -e indexedPages(data)` → `length 109 last / dups 0`
- esbuild routes.ts + `match.mjs` → `/de/products {products,de}` `/de {home,de}` `/contact {contact,null}` `/produits/ {products,fr}` `/it/services/data-analyse {services,it,data-analyse}` `/de/xyz null de` `/ {home,null}` `/about {about,en}` `/lab {lab,null}` `/de/lab {lab,de}` ; getLocalizedPath("en-US","about") → `/about`, (undefined,"products") → `/produits`
- `npx tsc --noEmit -p .` → exit 0, 0 ligne
- `npx vite build --outDir …/T014/dist` → `✓ built in 14.34s`
- `node …/T014/e2e.mjs` (preview :4414) → 13 OK, `ALL OK` : /de/products de+de_DE+texte DE ; /it it ; /es/services/data-analyse es ; toggle fr → /produits ; / +de → /de ; /contact +de → /de/contact ; /produits /about /lab inchangés ; /de/xyz → /de ; /de/services → /de/services/built-application ; historique /it/about ↔ /de/products → lang it/de/it ; errors 0 partout ; navs ≤ 2
- prérendu → NV — prérendu réservé au chef
- preview arrêté (kill pid 2852907, :4414 → 000)
## Écarts
- DoD 3 : `rg -l getLocalizedPath src | wc -l` → 25 avant ET après (pack dit 26) ; 0 appelant modifié
- DoD 5 : i18n.ts = 1 ligne + 1 import (`langFromPath`) — nécessaire
- DoD 7 navs : framenavigated émis 2× pour l'URL d'arrivée (même URL, avant mes changements aussi) → compté en changements d'URL (1 sans redirection, 2 avec)
- matchRoute enfants : slug validé ∈ children[key].slugs — /services/inconnu → null
- useLanguageRedirect deps + search, hash (lus dans l'effet)
## Pour la suite
- T015 : importer site-routes.json + site-routes.mjs (JSON.parse(readFileSync)) dans vite.config.js/prerender.mjs ; indexedPages → 109 pages
- useHreflang.ts lit encore routes[k].fr/en (compile, sémantique T015)
- ToogleLanguage:30 regex /^\/services\// ne voit pas /de/services/* → couleur accent perdue (T016)
- localStorage i18nextLng écrasé par la langue d'URL à chaque visite /de/* (languageChanged) — voulu ?
- artefacts : …/T014/e2e.mjs (rejouable), match.mjs, dist/
## Retour sur le pack
- Manquait: compte réel getLocalizedPath = 25 ; comportement framenavigated (2× au chargement)
- Inutile: ∅
