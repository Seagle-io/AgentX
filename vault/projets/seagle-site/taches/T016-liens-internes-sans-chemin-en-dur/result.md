---
tache: T016
statut: fait
---
## Livré
- src/components/Header/header.tsx:4 — import getLocalizedChildPath, matchRoute, RouteKey
- src/components/Header/header.tsx:55-72 — 8 services → getLocalizedChildPath(lang,"services",s)
- src/components/Header/header.tsx:96 — /global-seo → getLocalizedPath(lang,"aisio")
- src/components/Header/header.tsx:100,108 — commentés : clés "rubberBuddy"/"orbit" ∉ JSON
- src/components/Header/header.tsx:138-147,272-274 — tiroir : libellés t(clés existantes), key=pathKey
- src/components/Header/header.tsx:150,163-164,186 — IMMERSIVE: RouteKey[] testé via matchRoute
- src/components/Header/footer.tsx:42 — /services → getLocalizedPath(lang,"services")
- src/components/ToogleLanguage.tsx:6,32-33 — regex → matchRoute(...).key==="services" ? slug
- src/pages/ServiceDetail/index.tsx:20,183,231,369 — retour/fil d'Ariane/autres services localisés
- src/pages/Product/index.tsx:9,319 — PillLink → getLocalizedChildPath(…,"built-application")
- src/pages/Docs/index.tsx:3,12,174-179,222 — ContactLink (useTranslation) remplace to="/contact"
- src/components/ui/flickering-footer.tsx:13,247,278-282,286,292-296,319 — liens + couleurs via matchRoute
- mega-menu.tsx : ∅ (rg ∅ chemin en dur)

## Vérifié comment
HEAD `rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**'` → 15 lignes : footer.tsx:42 · header.tsx:55,56,57,63,64,65,71,72,96,100,108 · Docs:214 · ServiceDetail:231 · Product:319
après → ∅ (rc=1)
HEAD `rg -n 'pathname\.(match|startsWith)' src` → ToogleLanguage.tsx:31 · flickering-footer.tsx:295,298 ; après → ∅ (rc=1)
`npx tsc --noEmit -p .` → 0 ligne
`npx vite build --outDir …/T016/dist` → ✓ built in 4.43s · Sitemap 109 pages
`node …/T016/nav.mjs` (preview :4416) :
OK /de menu Services[0] → /de/services/built-application lang=de
OK /de footer about|services|contact|products|lab → /de/about|/de/services/built-application|/de/contact|/de/products|/de/lab lang=de
OK /produits menu Services[0] → /services/built-application lang=fr
OK /produits footer → /a-propos|/services/built-application|/contact|/produits|/lab lang=fr
OK /de/products 36 liens · /de/services/built-application 30 liens · /produits 36 · /services/built-application 30 → hors langue: []
KO /de→/de 39 liens, hors langue: 9× "/services/<slug>" — Home/index.tsx hors WL
mobile /de: Leistungen=/de/services | Lösungen=/de/solutions/kora | Tools=/de/products | Über uns=/de/about | Karriere=/de/careers | Kontakt=/de/contact
mobile /produits: Services=/services | Solutions=/solutions/kora | Outils=/produits | À propos=/a-propos | Carrières=/carrieres | Contact=/contact
OK header force-dark /nuit-etoilee=true · /de/starry-night=true · /de=false
pageerror: 0
`git diff --stat -- 'src/components/ui/ascii-*' …` → ascii-gallery-nav.tsx 21+/15- — préexistant (M au départ), 0 octet de T016
Docs : /docs et /de/docs → redirigés vers / ; ContactLink NV au rendu (tsc OK)
Prérendu : NV — réservé au chef

## Écarts
- lecture hors WL: src/lib/local/de/Navbar.ts — clés pour libellés du tiroir (note chef)
- tiroir : 0 nouvelle clé ; about/contact = Footer.columns.company.{about,contact}
- header.tsx:100,108 commentés : chemins → clés absentes, tsc échouera si décommentés sans route
- flickering-footer PRODUCT_COLORS : orbit/rubber-buddy retirés — ∉ routes, inatteignables ; composant importé nulle part
- DoD ascii-* ≠ ∅ : diff ascii-gallery-nav.tsx antérieur à T016

## Pour la suite
- Home/index.tsx:193,253 `to={`/services/${slug}`}` → getLocalizedChildPath(lang,"services",slug) (KO /de, 9 liens)
- Services/index.tsx:168 navigate(`/services/${slug}`) → idem
- DoD rg de T016 ne voit pas les template literals : ajouter `rg -n '(to|href)=\{`/|navigate\(`/' src`
- /docs → / : route docs absente d'App.tsx (T014 ?) ; Docs:222 non testable
- flickering-footer.tsx importé nulle part : candidat suppression

## Retour sur le pack
- Manquait: Home/index.tsx + Services/index.tsx en WL ; clés i18n du tiroir (note chef ≠ pack)
- Inutile: mega-menu.tsx (∅ chemin en dur)
