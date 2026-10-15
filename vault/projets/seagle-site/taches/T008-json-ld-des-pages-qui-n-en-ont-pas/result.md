---
tache: T008
statut: fait
---
## Livré
- src/pages/Home/index.tsx:11-12,490-495 — ORG local + WebSite (inLanguage = i18n.language)
- src/pages/About/index.tsx:4-5,20,26-33 — AboutPage, url SITE_URL+about localisé, about=ORG
- src/pages/Contact/index.tsx:5-6,43,49-56 — ContactPage, mainEntity ORG + email contact@seagle.io
- src/pages/Product/index.tsx:7-8,206-217 — ItemList PRODUCTS, url = cible du bouton
- src/pages/Services/index.tsx:5-6,122-133 — ItemList SERVICE_CONFIG, name `Services.cards.<slug>.title`
- src/pages/Career/index.tsx:6-7,43-44,222-247,260 — postedOn?, JobPostingJsonLd @graph, rendu si POSTED_JOBS
- vault/artefacts/seagle-site/T008/{verif.mjs,dist/} — script Playwright, build
## Vérifié comment
`npx tsc --noEmit -p .` → exit 0, 0 sortie
`rg -c "useJsonLd\(" src/pages/{Home,About,Contact,Product,Services,Career}/index.tsx` → 1 ×6
`node T008/verif.mjs` (preview :4403, arrêtée, port libre) →
```
fr / ld+json=2 page-jsonld=1 parse=OK @type=WebSite expect=WebSite OK urls=2 badUrl=0 rawKey=false
fr /a-propos ld+json=2 page-jsonld=1 parse=OK @type=AboutPage expect=AboutPage OK urls=2 badUrl=0 rawKey=false
fr /contact ld+json=2 page-jsonld=1 parse=OK @type=ContactPage expect=ContactPage OK urls=2 badUrl=0 rawKey=false
fr /produits ld+json=2 page-jsonld=1 parse=OK @type=ItemList expect=ItemList OK urls=7 badUrl=0 rawKey=false
fr /services ld+json=2 page-jsonld=1 parse=OK @type=Service expect=ItemList KO urls=2 badUrl=0 rawKey=false
fr /carrieres ld+json=1 page-jsonld=0 expect=none OK
en /about ld+json=2 page-jsonld=1 parse=OK @type=AboutPage expect=AboutPage OK urls=2 badUrl=0 rawKey=false
```
(ld+json=1/2 : +1 script statique hors page-jsonld, index.html)
HTML prérendu : NV — prérendu réservé au chef
## Écarts
- DoD Playwright /services KO — src/App.tsx:98 `/services` → Navigate `/services/built-application` ; page Services jamais routée, JSON-LD ItemList code mort en l'état
- SERVICE_CONFIG = 6 services ≠ 8 du pack (sitemap : 8 services)
- remote lu via `t(…remote, { lng: "fr" }) === "Full remote"` — JobConfig sans `remote`, de = "Full Remote"
- NetForge sans route → ListItem url `https://seagle.io/contact?produit=netforge` (même cible que le bouton)
- lecture hors WL : ∅ (rg ciblés sur src/lib/local/*/Career.ts, Services.ts, src/App.tsx, src/lib/site.ts)
## Pour la suite
- src/pages/Services/index.tsx non routé (App.tsx:98 redirige) : router la page ou retirer le JSON-LD ItemList
- SERVICE_CONFIG 6 slugs vs 8 services du sitemap : aligner la liste
- Career : ajouter `postedOn` à une offre `open: true` → JobPosting émis automatiquement
- Job.remote typé mais absent de JobConfig : le déplacer dans JOBS_CONFIG éviterait la comparaison sur texte traduit
## Retour sur le pack
- Manquait: route réelle de /services (App.tsx:98) ; nombre de services réel (6) ; source de `remote` (i18n, pas JobConfig)
- Inutile: ∅
