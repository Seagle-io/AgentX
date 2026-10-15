---
tache: T005
statut: fait
---
## Livré
- Contrainte qui décide : chaque URL es/de/it = fichier `dist/<route>/index.html` (nginx sans réécriture lisible) → la langue doit sortir du **chemin seul**, avant `i18nReady`.
- Options (maintenant / dans 1 an / interdit) :
  - A bête `/<l>` + chemin EN : 3 fichiers de données, 0 slug à écrire, 75 URLs dérivées / page neuve = 2 slugs (fr,en) / ∅
  - B `/<l>` + slugs traduits : +75 slugs (25 grappes ×3, dont 24 services → ServiceDetail doit mapper slug→id) / 5 slugs par page / hors périmètre (traductions de slugs)
  - C `?lng=de` ou sous-domaine : `dist/<route>/index.html` ne varie pas par query ; sous-domaine = DNS+nginx illisibles / — / prérendu par langue impossible
- **Choix : A.** Point de non-retour : 1er déploiement du sitemap → 75 URLs `/es|de|it/<slug EN>` indexées ; passer à B = 75 redirections 301 dans nginx (hors dépôt).
```ts
// ── src/lib/site-routes.json — SOURCE UNIQUE : routes.ts (import), prerender.mjs + vite.config.js (JSON.parse(readFileSync))
{ "locales": ["fr","en","es","de","it"],          // ≡ SUPPORTED_LANGUAGES, même ordre
  "prefixed": ["es","de","it"], "default": "fr",
  "og": { "fr":"fr_FR","en":"en_US","es":"es_ES","de":"de_DE","it":"it_IT" },
  "routes": {                                      // 20 clés de routes.ts, chemins fr/en copiés À L'IDENTIQUE
    "home":     { "fr":"/", "en":"/", "index":true, "changefreq":"weekly", "priority":1.0 },
    "products": { "fr":"/produits", "en":"/products", "index":true, "changefreq":"weekly", "priority":0.9 },
    "services": { "fr":"/services", "en":"/services", "index":false },
    "lab":      { "fr":"/lab", "en":"/lab", "index":true, "changefreq":"weekly", "priority":0.8 } /* …   */ },
  "children": { "services": { "slugs":[/* 8 SERVICE_SLUGS */], "index":true, "changefreq":"monthly", "priority":0.85 } } }
// index:true = 16 entrées staticRoutes + lab (état arbre) ; false = services, docs, preview. children.lab : T009 seul.
// changefreq/priority = valeurs actuelles de vite.config.js:30-48. Invariant : aucun 1er segment fr/en ∈ prefixed.

// ── src/lib/site-routes.mjs + site-routes.d.mts — JS pur, 0 import, data passé en paramètre
export function normalizePath(p: string): string            // "/de/"→"/de", ""→"/"
export function localize(data, key: string, locale: string): string // fr→fr, en→en, préfixée→ en==="/" ? "/l" : "/l"+en
export function alternates(data, key: string, slug?: string): { hreflang: string; path: string }[]
  // 1 par locale SAUF "en" si path(en)===path(fr) (URL partagée = contenu fr prérendu) ; + x-default = path(fr)
export function indexedPages(data): { path: string; locale: string; changefreq: string; priority: number;
  alternates: { hreflang: string; path: string }[] }[]
  // clés index:true × locales + children × locales, dédup par path (1re locale gagne), "/" EN DERNIER
  // compte : 9 grappes distinctes ×5 + 8 partagées ×4 + 8 services ×4 = 109 (105 si lab index:false)

// ── src/lib/routes.ts — API publique ; seul module importé par le reste de src
import data from "./site-routes.json"; import type { SupportedLang } from "./i18n" // type seul, 0 cycle
export type Locale = SupportedLang
export type RouteKey = keyof typeof data.routes
export const LOCALES: readonly Locale[]; export const PREFIXED: readonly Locale[]
export const OG_LOCALE: Record<Locale, string>
export const routes: { readonly [K in RouteKey]: Readonly<Record<Locale, string>> } // forme routes[k][l] gardée
export const toLocale = (lang: string | undefined): Locale  // 2 lettres ∈ LOCALES, sinon "fr"
export const getLocalizedPath = (lang: string | undefined, key: RouteKey): string // INCHANGÉE = routes[key][toLocale(lang)]
export const getLocalizedChildPath = (lang: string | undefined, key: RouteKey, slug: string): string
export type RouteMatch = { key: RouteKey; locale: Locale | null; slug?: string } // null ⇔ URL partagée fr/en
export const matchRoute = (pathname: string): RouteMatch | null
  // p=normalizePath ; seg=1er segment ; seg∈PREFIXED → cherche reste ("/" si vide) dans routes[k].en, puis en+"/"+slug
  // sinon fr===p|en===p → locale = fr===en ? null : (fr===p?"fr":"en") ; enfants idem ; 1er trouvé, ordre JSON
export const langFromPath = (pathname: string): Locale | null // seg∈PREFIXED ? seg : matchRoute(p)?.locale ?? null
export const pathFor = (m: RouteMatch, l: Locale): string    // même page, autre locale (+ "/"+slug)
export const alternatesFor = (m: RouteMatch) => alternates(data, m.key, m.slug)
export const isIndexed = (m: RouteMatch): boolean            // slug ? children[key].index : routes[key].index
// ex : "/de/products"→{products,"de"} "/de"→{home,"de"} "/contact"→{contact,null} "/produits/"→{products,"fr"}
//      "/it/services/data-analyse"→{services,"it","data-analyse"} "/de/xyz"→null, langFromPath→"de"

// ── src/lib/i18n.ts (sur l'état T006) — seule ligne changée
const initialLanguage = langFromPath(location.pathname) ?? savedLanguage ?? (browser ∈ SUPPORTED ? browser : "fr")

// ── useLanguageRedirect — effet([pathname, i18n.language]) ; prev: Locale|null en ref
l = toLocale(i18n.language); m = matchRoute(pathname); if (!m) { prev = l; return }
ok = m.locale === null ? (l === "fr" || l === "en") : m.locale === l ; if (ok) { prev = l; return }
explicit = prev !== null && prev !== l ; prev = l
if (explicit || m.locale === null) navigate(pathFor(m, l) + search + hash, { replace: true })  // toggle, ou /contact en de → /de/contact
else void i18n.changeLanguage(m.locale)                                                         // visite directe / historique : URL gagne
// ∄ boucle : après navigate, matchRoute(new).locale ∈ {l, null∧l∈{fr,en}} ; après changeLanguage, l = m.locale → ok. ≤ 2 passages.

// ── App.tsx
Routes : routeConfig × new Set(Object.values(routes[key])) (key = path) ;
for p of ["", "/es", "/de", "/it"] : `${p}/services` → Navigate getLocalizedChildPath(l,"services","built-application") ; `${p}/services/:slug` → ServiceDetail
for l of PREFIXED : `/${l}/*` → Navigate `/${l}` ; "*" → Navigate "/"
effet([i18n.language]) : l=toLocale ; documentElement.lang = l ; meta[property=og:locale].content = OG_LOCALE[l] (index.html:56 l'a déjà)

// ── useHreflang — retire link[rel=alternate][hreflang] ; m=matchRoute ; si m && isIndexed(m) : SITE_URL+a.path pour a ∈ alternatesFor(m)
// ── usePageMeta — signature inchangée ; pageUrl = SITE_URL + normalizePath(window.location.pathname) (canonical + og:url)
// ── vite.config.js sitemap — 1 <url> par indexedPages(data), <xhtml:link> = ses alternates ; langs/staticRoutes/SERVICE_SLUGS supprimés
// ── prerender.mjs — ROUTES = indexedPages(data).map(p => ({ path: p.path, lang: p.locale })) ; boucle gardée + avant capture :
//    waitForFunction(l => document.documentElement.lang === l, lang) ; canonical !== SITE+path → throw (failed++)

// ── Séquence prérendu /de/products (T006) : ctx(locale de, localStorage de) → GET → dist/index.html (repli SPA)
//    → i18n.ts langFromPath = "de" → backend charge local/de + local/fr → i18nReady → main.tsx rend (T006)
//    → html.app-mounted → ∄ "Chargement..." → html[lang]=de → 150 ms → dist/de/products/index.html
//    T006 doit garantir : app-mounted posé APRÈS 1er rendu post-i18nReady (NV main.tsx). "/" rendu en dernier : coquille vierge.

// ── Liens en dur (règle) : tout chemin interne = getLocalizedPath / getLocalizedChildPath, 0 littéral hors site-routes.json
"/services/<s>" → getLocalizedChildPath(lang,"services",s) · "/services" "/global-seo" "/contact" "/" → getLocalizedPath(lang, services|aisio|contact|home)
"/lab", "/lab/<id>" (Lab:200, LabArticle:224,355) → même règle, exécutée par T009
ToogleLanguage:30 regex /^\/services\// → m=matchRoute(pathname); m?.key==="services" ? m.slug : undefined
header.tsx:150 IMMERSIVE → const IMMERSIVE: RouteKey[] = ["starryNight","creationOfAdam","greatWave","monaLisa"] ; test sur matchRoute(pathname)?.key
```
- Découpage (A seule en vague 1 après merge T006 ; B ∥ C en vague 2, E disjoints) :
  - **A Routage 5 langues** — E : src/lib/site-routes.json (neuf), src/lib/site-routes.mjs (neuf), src/lib/site-routes.d.mts (neuf), src/lib/routes.ts, src/lib/i18n.ts, src/hooks/useLanguageRedirect.ts, src/App.tsx · L : src/main.tsx, src/components/ToogleLanguage.tsx, tsconfig.json (10). DoD : `npx tsc --noEmit` → 0 ; `node --input-type=module -e` indexedPages(JSON).length → 109 ; `rg -l getLocalizedPath src | wc -l` → 26 ; dev : /de/products → DE + html lang de ; toggle fr sur /de/products → /produits ; `/` + localStorage de → /de ; retour historique → langue de l'URL.
  - **B SEO 5 langues** — E : prerender.mjs, vite.config.js, src/hooks/useHreflang.ts, src/hooks/usePageMeta.ts · L : src/lib/site-routes.json, src/lib/site-routes.mjs, src/lib/routes.ts (7). DoD : `npm run build` → « 109 OK, 0 erreurs » ; `grep -c '<loc>' dist/sitemap.xml` → 109 ; `grep -o 'hreflang="[a-z-]*"' dist/de/products/index.html | sort -u | wc -l` → 6 ; idem dist/contact → 5 (∅ en) ; dist/de/products : `lang="de"`, `de_DE`, canonical `https://seagle.io/de/products` ; les 34 chemins ROUTES actuels ⊂ nouvelle liste.
  - **C Liens internes** — E : src/components/Header/header.tsx, src/components/Header/footer.tsx, src/components/ToogleLanguage.tsx, src/pages/ServiceDetail/index.tsx, src/pages/Product/index.tsx, src/pages/Docs/index.tsx, src/components/ui/flickering-footer.tsx (href seul) · L : src/lib/routes.ts (8). DoD : `rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**'` → ∅ ; `rg -n 'pathname\.(match|startsWith)' src` → ∅ ; `git diff --stat -- 'src/components/ui/ascii-*' 'src/**/*.data.ts' 'src/components/kit/Ascii*'` → ∅ ; tsc → 0.
## Vérifié comment
- `grep -n resolveJsonModule tsconfig.json` → `10:    "resolveJsonModule": true,` (+ `8: "moduleResolution": "Bundler"` → .d.mts résolu)
- `grep -cE "^\s+\{ path: '" prerender.mjs` → 34 (≠ 33 T002 : /lab ajouté arbre courant)
- `grep -cE '^\s+[a-zA-Z]+:\s*\{ ?fr:' src/lib/routes.ts` → 20 (≠ 21 T002)
- `git status --short` → routes.ts, App.tsx, vite.config.js, prerender.mjs, i18n.ts, main.tsx M (lab réactivé ; i18n.ts = backend T006 + i18nReady)
- comptes 109/105, ordre "/" dernier, html.app-mounted : NV — aucun build autorisé
## Écarts
- lecture hors WL : tsconfig.json (grep 3 drapeaux) — choix JSON vs .mjs bloquant
- arbre modifié pendant la tâche : `git diff` sur fichiers WL relu ; lab traité index:true selon l'arbre
- hébergement : pack = nginx VPS ; prerender.mjs:48-49 dit GitHub Pages → contrat valable pour les deux
## Pour la suite
- URL es/de/it = `/<l>` + chemin EN, dérivé ; fr/en intouchés ; 0 slug traduit.
- Source unique `src/lib/site-routes.json` ; interdit : liste de chemins ailleurs (prerender, vite, header, pages).
- Langue initiale = URL > localStorage > navigator ; i18n.ts ne fait que `langFromPath` avant init.
- URL partagée fr/en (/, /contact, /services/*) = contenu fr : hreflang sans `en` ; de/es/it y sont redirigés vers `/<l>…`.
- Ordre : T006 mergé → A → B ∥ C ; lab : clé présente, liens /lab = T009.
## Retour sur le pack
- Manquait: tsconfig.json en L ; état « arbre modifié par d'autres agents » (lab réactivé) ; hébergement contradictoire (nginx vs Pages)
- Inutile: ∅
