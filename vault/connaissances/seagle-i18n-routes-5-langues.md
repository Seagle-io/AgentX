---
titre: seagle-website — routes et i18n en 5 langues (contrat, pièges)
resume: table unique site-routes.json ; /de /es /it = préfixe + chemin EN ; pièges langue/canonical
source: seagle-site T005 T006 T014 T015 T019 T022 T024
cree: 2026-10-14
tags: [note, seagle, i18n, routes, seo]
---

# seagle-website : routes et i18n 5 langues

## Fait
- source unique `src/lib/site-routes.json` (+ `site-routes.mjs`, `.d.mts`) lue par routes.ts, prerender.mjs, vite.config.js ; page neuve = 1 ligne JSON → 109 pages prérendues + sitemap + hreflang
- URL es/de/it = `/<l>` + chemin EN (`/de/products`, `/de`, `/de/services/<slug>`) ; fr/en inchangés ; 0 slug traduit ; décision : decisions.md#2026-10-14
- URL partagée fr/en (`/`, `/contact`, `/services/*`) = contenu fr : hreflang sans `en` (5 hreflang + x-default) ; de/es/it y sont redirigés vers `/<l>…`
- langue initiale = URL > localStorage > navigator ; `i18nReady` exporté (i18n.ts) ; `supported()` exact → ls `de-DE` ignoré (→ fr)
- locales en chunks à la demande : entrée 924 → 461 Ko brut (308 → 151 gz) ; es/de/it font `...fr` → chunk fr toujours chargé (−~98 Ko/langue si retiré)
- liens internes : toujours `getLocalizedPath` / `getLocalizedChildPath(lang,"services",slug)` ; 0 `to="/…"` en dur
  - DoD rg à utiliser : `rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**'` ET `rg -n '(to|href)=\{`/|navigate\(`/' src` (le 1er ne voit pas les template literals) ; résiduel légitime : App.tsx:108 fallback `/${lang}`
- `matchRoute` valide slug enfant ∈ `children[key].slugs` ; `/services/inconnu` → titre = clé brute `ServiceDetail.meta.inconnu.title` (préexistant)
- casse et encodage : `/DE/products` → `/de/products` (normalisé) ; canonical + og:url = URL courante après bascule
- `usePageMeta` doit avoir `pathname` dans ses deps (sinon canonical figé après navigation SPA)
- `useLanguageRedirect` deps `search`, `hash` ; `/de/xyz` → `/de` ; `/fr`, `/en/…` → `/` fr
- `Services/index.tsx` jamais routé (App.tsx redirige `/services`) → son JSON-LD ItemList est mort

## Pourquoi ça compte
- 3 listes de chemins divergeaient (prerender, vite staticRoutes, routes.ts) avant la table unique
- Pages/nginx sans réécriture : chaque URL exige un fichier prérendu

## Où
- `src/lib/routes.ts` — `matchRoute`, `getLocalizedPath` ; `src/hooks/useHreflang.ts`, `usePageMeta.ts`, `useLanguageRedirect.ts`
- `src/lib/i18n.ts` — `langFromPath`, `i18nReady`

## Voir aussi
- [[seagle-outillage-build]]
- [[seagle-reload-chunk-prerendu]]
