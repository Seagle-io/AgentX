---
pack: T016
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T016 — Liens internes sans chemin en dur

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer chaque chemin interne littéral (`to="/…"`, `href="/…"`, `navigate("/…")`, regex sur `pathname`) par `getLocalizedPath` / `getLocalizedChildPath` / `matchRoute` selon la règle « Liens en dur » du contrat T005 → un visiteur en /de reste en allemand en naviguant.

## Definition of Done
- [ ] `rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**'` → ∅ (sortie HEAD avant collée, puis après)
- [ ] `rg -n 'pathname\.(match|startsWith)' src` → ∅
- [ ] `ToogleLanguage.tsx:30` : regex `/^\/services\//` → `matchRoute(pathname)?.key === "services" ? m.slug : undefined`
- [ ] `header.tsx:150` : `const IMMERSIVE: RouteKey[] = ["starryNight","creationOfAdam","greatWave","monaLisa"]` testé sur `matchRoute(pathname)?.key`
- [ ] Playwright sur ton preview (:4416) : depuis `/de` → clic menu Services → 1er service, Produits, pied de page À propos, Contact, Lab → URL commence par `/de` et page en allemand ; idem depuis `/produits` (fr) → URLs fr inchangées ; 0 `pageerror`
- [ ] `git diff --stat -- 'src/components/ui/ascii-*' 'src/**/*.data.ts' 'src/components/kit/Ascii*'` → ∅
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/components/Header/header.tsx` | E | IMMERSIVE L150, liens |
| `~/Documents/Workspace/seagle-website/src/components/Header/footer.tsx` | E | lien services en dur L45 |
| `~/Documents/Workspace/seagle-website/src/components/ToogleLanguage.tsx` | E | regex L30 |
| `~/Documents/Workspace/seagle-website/src/pages/ServiceDetail/index.tsx` | E | liens services et contact en dur |
| `~/Documents/Workspace/seagle-website/src/pages/Product/index.tsx` | E | liens en dur |
| `~/Documents/Workspace/seagle-website/src/pages/Docs/index.tsx` | E | liens en dur |
| `~/Documents/Workspace/seagle-website/src/components/ui/flickering-footer.tsx` | E | href seul |
| `~/Documents/Workspace/seagle-website/src/components/ui/mega-menu.tsx` | E | si rg y trouve des chemins en dur |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | API (T014) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T016/` | E | build, scripts |

## Contrats
Contrat T005 verbatim (ta part : « Liens en dur (règle) », API de `routes.ts`) :
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

## Décisions actées
- choix A : `/<l>` + chemin EN — decisions.md 2026-10-14
- `src/pages/Lab*/**` exclus (LabArticle désactivé ; Lab réécrit sans lien en dur)
- liens externes, `mailto:`, `tel:`, ancres `#` : intouchés
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- `prerender.mjs`, `vite.config.js`, hooks (T015 en parallèle) ; `routes.ts`, `App.tsx` (T014)
- contenu des menus, textes, style

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T016/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T016/dist --port 4416 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T016/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T016/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T016
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
