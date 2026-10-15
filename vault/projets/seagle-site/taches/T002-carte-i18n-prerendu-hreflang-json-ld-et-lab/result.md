---
tache: T002
statut: fait
---
## Livré
### Choix de langue (chaîne)
- src/lib/i18n.ts:19 — SUPPORTED_LANGUAGES = fr,en,es,de,it
- src/lib/i18n.ts:23-25 — lng = localStorage.i18nextLng ‖ navigator.language[0:2] si supporté ‖ 'fr'
- src/lib/i18n.ts:40-42 — languageChanged → écrit localStorage.i18nextLng
- src/lib/i18n.ts:31 fallbackLng fr ; ressources src/lib/local/{fr,en,es,de,it}/ (1 .ts par page)
- URL ne participe PAS à l'init ; elle corrige après montage via useLanguageRedirect
- src/hooks/useLanguageRedirect.ts:23 — currentLang = fr si i18n.language∼fr, sinon 'en' (es/de/it ≡ en)
- useLanguageRedirect.ts:33 — skip routes où paths.fr===paths.en (/, /contact, /services, /docs…)
- useLanguageRedirect.ts:47-64 — URL≠langue : toggle explicite → navigate(routes[key][lang]) ; visite directe → i18n.changeLanguage(urlLang)
- useLanguageRedirect.ts:63 — changeLanguage(urlLang) ne reçoit que 'fr'|'en' ; URL /de → ∅ (aucune notion)
- src/components/ToogleLanguage.tsx:15-21 — 5 langues listées ; :35-38 setLanguage = i18n.changeLanguage seul, pas de navigate
- src/App.tsx:85 — document.documentElement.lang = i18n.language.slice(0,2)
- index.html:2 lang="fr" ; index.html:56 og:locale fr_FR statique ; og:locale ∅ ailleurs (rg src)

### routes.ts (37 l.)
```ts
type Locale = "fr" | "en"
// routes = { key: { fr: "/…", en: "/…" } }  — 21 clés actives (home…preview), lab/orbit/rubberbuddy commentées
export type RouteKey = keyof typeof routes
export const getLocalizedPath = (lang: string | undefined, key: RouteKey) => {
	const locale: Locale = lang?.startsWith("en") ? "en" : "fr"
	return routes[key][locale]
}
```
- src/lib/routes.ts:3-26 — table routes ; :24 lab commenté
- PIÈGE routes.ts:31 — es/de/it → locale "fr" (chemins FR) ≠ useLanguageRedirect:23 (es/de/it → en)
- rg -c getLocalizedPath src → 26 fichiers ; rg -o | wc -l → 97 (imports inclus ; header 12, footer 12, Home 9, Orbit 6, RubberBuddy 5, flickering-footer 5, Career 4)

### Liens internes en dur
- rg 'to="/|href="/' src → 12 lignes, dont 2 dans App.tsx (Navigate), 4 liens à /lab (LabArticle:224,355 = KO si Lab activé sans locale)
- src/pages/Docs/index.tsx:214 /contact ; src/components/ui/flickering-footer.tsx:324 /
- src/pages/ServiceDetail/index.tsx:222 — Link to="/services"
- src/pages/Product/index.tsx:305 — PillLink to="/services/built-application"
- src/components/Header/header.tsx:55-72,96 — href "/services/*", "/global-seo" en dur
- src/components/Header/footer.tsx:42 — to: "/services" en dur
- src/components/Header/header.tsx:150 — IMMERSIVE = Set de 8 chemins fr/en en dur (4 tableaux) → à étendre par langue

### prerender.mjs (145 l.)
- prerender.mjs:23-59 — ROUTES [{path,lang}] : 33 (24 fr :24-47 dont 8 /services/* ; 9 en :50-58 = products about careers book terms + 4 tableaux)
- ∅ prérendu : /services, /lab, /docs, /preview, tout es/de/it
- prerender.mjs:19,76-80 — spawn `vite preview` port 4173 --strictPort, detached
- prerender.mjs:93-96 — langue forcée : newContext({locale}) + addInitScript localStorage.i18nextLng=lang
- prerender.mjs:100-114 — goto → wait html.app-mounted → wait ≠'Chargement...' → 150ms → remove #fallback-content → page.content()
- prerender.mjs:116-120 — sortie dist/<route>/index.html ; '/' → dist/index.html
- prerender.mjs:124-126 — '/' copié aussi en dist/404.html
```js
for (const { path: route, lang } of ROUTES) {
  const context = await browser.newContext({ locale: lang })
  await context.addInitScript(l => { try { localStorage.setItem('i18nextLng', l) } catch {} }, lang)
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'load' }) // puis waitFor html.app-mounted, 150ms, remove #fallback-content
  const html = await page.content()  // → dist/<route>/index.html ('/' → dist/index.html)
}
```
- package.json build = `vite build && node prerender.mjs` ; script prerender seul existe
- PIÈGE : routes sans URL distincte (/ /contact /services/*) prérendues 1× en fr seulement → es/de/it/en sur ces URLs = SPA hydratée côté client, pas de HTML statique par langue
- PIÈGE : liste ROUTES dupliquée à la main (≠ routes.ts, ≠ staticRoutes vite.config.js, ≠ SERVICE_SLUGS) → 3 listes à tenir synchrones

### hreflang
```ts
// src/hooks/useHreflang.ts (44 l.) — useEffect([pathname])
// frPath/enPath = paths de la 1re route où paths.fr===pathname||paths.en===pathname, sinon pathname
// supprime link[rel=alternate][hreflang] existants ; if (frPath === enPath) return
[ { lang:"fr", href:`${SITE_URL}${frPath}` }, { lang:"en", href:`${SITE_URL}${enPath}` },
  { lang:"x-default", href:`${SITE_URL}${frPath}` } ]  // → <link rel=alternate> dans document.head
```
- useHreflang.ts:5-6 — SITE_URL = https://seagle.io (src/lib/site.ts:8)
- appelé src/App.tsx:82 ; seul appelant
- src/hooks/usePageMeta.ts:33-40 — canonical = SITE_URL + window.location.pathname (auto-référent par URL)
- usePageMeta.ts:44-49 — og:url idem ; og:locale ∅
- vite.config.js:15 — `const langs = ['fr','en']` ; point d'ajout de langues
- vite.config.js:29-49 — staticRoutes {fr,en,changefreq,priority} 17 entrées ; :36 lab commenté ; :37 orbit ; :41 rubber-buddy
- vite.config.js:51-85 — buildUrl : alternates via langs.map, href = lang==='fr'?frUrl:enUrl (binaire fr/en → à généraliser) ; émet 2 <url> si distincts
- vite.config.js:17-26,102-105 — 8 SERVICE_SLUGS, url identique fr/en → pas d'alternates
- vite.config.js:107-119 — articles Lab commentés (lit src/content/lab/*.md)
- sitemap écrit dist/sitemap.xml dans closeBundle (:89-125) ; AVANT prerender (build = vite build puis prerender)
- public/robots.txt:4 — Sitemap: https://seagle.io/sitemap.xml

### Hébergement
- public/_redirects ∅ · public/404.html ∅ · .htaccess ∅ · CNAME ∅ (ls)
- .github/workflows/deploy.yml — build (`npm run build`:35) puis déploiement (GitHub Pages) ; Pages ne réécrit pas → chaque URL = dist/<route>/index.html obligatoire
- 404.html généré par prerender.mjs:124 = copie de la home ; inconnue → Navigate "/" (App.tsx:100)

### JSON-LD par page (useJsonLd = 1 seul <script id="page-jsonld">, remplacé à chaque appel)
```ts
// src/hooks/useJsonLd.ts (18 l.)
export function useJsonLd(schema: object) {
  useEffect(() => {
    document.getElementById("page-jsonld")?.remove()
    const script = document.createElement("script")
    script.type = "application/ld+json"; script.id = "page-jsonld"
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { document.getElementById("page-jsonld")?.remove() }
  }, [JSON.stringify(schema)])
}
```
- index.html:57 Organization(+PostalAddress,sameAs) ; WebSite ∅
- SoftwareApplication : AgentX:163, Kora:303 (Offer 29), SecurePass:312 (Offer 2.39), AISIO:29, LeefEditor:98 (pages/<P>/index.tsx) ; Orbit:207, RubberBuddy:108 (désactivées)
- ServiceDetail/index.tsx:154 Service ; LabArticle/index.tsx:182 TechArticle
- StarryNight:29, CreationOfAdam:30, GreatWave:30, MonaLisa:30 — VisualArtwork+creator Person
- ∅ : Home, About, Contact, Career (JobPosting ∅), Product, Services, Booking, CGU, Lab index
- PIÈGE : index.html Organization + page-jsonld cohabitent (2 scripts ld+json)
- Career : offres dans src/lib/local/*/Career.ts (NV contenu)

### Lab (désactivé)
- Désactivé par commit 047cc1b (2026-07-29 "work on SEO and GEO") : routes.ts:24, App.tsx:58,70,97 (route /lab/:slug), vite.config.js:36,107-119 commentés ; raison écrite ∅ (NV : pas de commentaire explicatif)
- App.tsx:46-47 — imports lazy Lab et LabArticle toujours présents
- src/pages/Lab/index.tsx:289 l. — liste EXPERIMENTS (:~44-115) 7 entrées actives (seasearch, uigen, llm-benchmark, meridian, cogdrift, sentipred, datadrift) ; orbit commenté
- Lab/index.tsx:200 — Link to={`/lab/${exp.id}`} en dur (non localisé) ; CTA contact/about via getLocalizedPath (:273,277)
- Lab/index.tsx:123 usePageMeta(t("Lab.meta.*")) ; i18n local/<lang>/Lab.ts ; 0 lien vers les 4 tableaux ASCII (∅)
- src/content/lab/ — 11 .md : abandon-langchain, cogdrift, datadrift, fine-tuning-vs-prompting, llm-benchmark, meridian, orbit, rag-production, seasearch, sentipred, uigen
- ≠ : 11 md vs 7 entrées EXPERIMENTS → 4 md orphelins (abandon-langchain, fine-tuning-vs-prompting, orbit, rag-production)
- md : frontmatter title/status/date/authors/tags/readTime ; FR seul ; markdown chargé par import.meta.glob pages/LabArticle/index.tsx:49-52
- LabArticle : 379 l. ; liens retour /lab en dur :224,:355
- src/components/ui/ascii-gallery-nav.tsx (87 l.) — AsciiGalleryNav({current}); commentaire :8-10 « aucune des 4 pages n'est liée depuis navbar/footer »
- ascii-gallery-nav.tsx:12,17 — GalleryKey 4 tableaux ; :20-25 PREVIEW glyphs+color ; :54 getLocalizedPath(i18n.language,key)
- utilisé dans 4 pages : StarryNight:273, CreationOfAdam:270, MonaLisa:268, GreatWave (import :11) ; i18n clés AsciiGallery.* (src/lib/local/*/AsciiGallery.ts)
- header.tsx:149-150 — IMMERSIVE (tableaux plein écran) ; 4 tableaux liés nulle part ailleurs (rg header/footer ∅)

### Menu / pied de page (où ajouter Lab)
- src/components/Header/header.tsx:47 — NAV_ITEMS(lang,t): MegaMenuItem[] ; groupe « resources » id 3 (label navbar.resources.label :91) ; :113-118 sous-menu `resources.learn` {Leef Editor, GitHub} → ajouter item `{label,description,icon,href:getLocalizedPath(lang,"lab")}` ici
- src/components/Header/footer.tsx:36-66 — columns[] : company :38-45, products :47-55, contact :57-64 ; ajouter dans company (:40-44) ou products (:50-54), clé i18n Footer.columns.* (src/lib/local/*/Footer.ts, Navbar.ts)

## Vérifié comment
- rg -c getLocalizedPath src → 26 fichiers listés (outil), total 98 = somme manuelle des comptes par fichier
- rg 'to="/|href="/' src → 12 lignes (awk somme)
- ls public/_redirects public/404.html public/.htaccess .htaccess CNAME public/CNAME → 6× « Aucun fichier »
- rg -n '@type|useJsonLd' src index.html → tableau ci-dessus
- rg -c "path: '" prerender.mjs → 33

## Écarts
- lecture hors WL: src/lib/site.ts, public/robots.txt, .github/workflows/deploy.yml (3, dont deploy.yml partiel via rg)
- DoD verbatim useHreflang/useJsonLd/prerender : useJsonLd verbatim ; useHreflang et boucle prerender condensés (plafond 150 l.) — lire useHreflang.ts:1-44
- raison désactivation Lab : NV ; seul indice commit 047cc1b

## Pour la suite
- Langue : init = localStorage → navigator → 'fr' (i18n.ts:23-25) ; URL corrige après coup via useLanguageRedirect.ts (binaire fr/en, es/de/it ≡ en :23) ; getLocalizedPath routes.ts:31 envoie es/de/it vers chemins FR (incohérent) ; Locale type = "fr"|"en" à élargir en même temps que routes (21 clés, 98 appels/26 fichiers, header.tsx:150 IMMERSIVE, 12 liens en dur dont /lab ×4).
- Prérendu : prerender.mjs:23-59 liste manuelle {path,lang}, langue forcée par locale+localStorage (:93-96), sortie dist/<route>/index.html ; Pages sans réécriture (∅ _redirects/404) → chaque /de /es /it exige un fichier prérendu ; 3 listes à synchroniser (ROUTES, vite.config.js:29-49 staticRoutes, routes.ts).
- hreflang : useHreflang.ts émet fr/en/x-default (binaire, :95-100, rien si URL identiques) ; sitemap vite.config.js:15 `langs=['fr','en']` + buildUrl:51-85 binaire → à généraliser ; canonical = SITE_URL+pathname (usePageMeta:33-40), og:locale ∅ hors index.html:56.
- JSON-LD : présent sur 4 tableaux, 5 produits (SoftwareApplication), ServiceDetail, LabArticle ; ∅ sur Home, About, Contact, Career (pas de JobPosting), Product, Services, Booking, CGU ; Organization seul dans index.html:57 (WebSite ∅) ; useJsonLd = 1 script unique id page-jsonld.
- Lab : tout commenté (routes.ts:24, App.tsx:58,70,97, vite.config.js:36,107-119, commit 047cc1b), imports lazy intacts ; Lab/index.tsx 7 expériences IA en dur, ∅ lien vers 4 tableaux ; 4 md orphelins ; ajout menu header.tsx:113-118 / footer.tsx:40-44 ; AsciiGalleryNav (ui/ascii-gallery-nav.tsx) réutilisable comme grille des 4 tableaux.

## Retour sur le pack
- Manquait: chemin src/lib/local/ (dossiers, pas fichiers fr.ts) ; autorisation lire site.ts/deploy.yml/robots.txt
- Inutile: ∅
