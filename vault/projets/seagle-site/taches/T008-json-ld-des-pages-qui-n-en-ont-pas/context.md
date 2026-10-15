---
pack: T008
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T008 — JSON-LD des pages qui n'en ont pas

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter via `useJsonLd` un JSON-LD schema.org aux pages accueil (WebSite), À propos (AboutPage), Contact (ContactPage), catalogue (ItemList produits), services (ItemList services) et carrières (JobPosting, offres ouvertes seulement) → 6 pages couvertes, JSON valide, 0 offre fermée annoncée.

## Definition of Done
- [ ] `rg -c "useJsonLd\(" src/pages/{Home,About,Contact,Product,Services,Career}/index.tsx` → 1 chacun (HEAD → 0 chacun)
- [ ] Home : `{"@type":"WebSite","name":"Seagle","url":"https://seagle.io","inLanguage":<langue>,"publisher":ORG}`
- [ ] About : `AboutPage` ; Contact : `ContactPage` avec `mainEntity` = Organization (email contact@seagle.io) ; `url` = SITE_URL + chemin localisé
- [ ] Product : `ItemList` des produits de `PRODUCTS` (L42) — `ListItem` position, name, url absolue
- [ ] Services : `ItemList` des 8 services de `SERVICE_CONFIG` (L12) — url `https://seagle.io/services/<slug>`, name traduit
- [ ] Career : `JobConfig` gagne `postedOn?: string` ; JobPosting (`@graph`) seulement pour `open && postedOn` ; aujourd'hui 4 offres `open: false` → **aucun** script `page-jsonld` sur /carrieres (vérifié navigateur)
- [ ] Playwright sur ton preview, 6 pages fr + /about en : `document.querySelectorAll('script[type="application/ld+json"]')` → `JSON.parse` OK, `@type` attendu, url absolues `https://seagle.io`, aucun texte `Home.`/clé brute ; sorties collées
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/pages/Home/index.tsx` | E | usePageMeta L490 : appel à côté |
| `~/Documents/Workspace/seagle-website/src/pages/About/index.tsx` | E | usePageMeta L21 |
| `~/Documents/Workspace/seagle-website/src/pages/Contact/index.tsx` | E | usePageMeta L44 |
| `~/Documents/Workspace/seagle-website/src/pages/Product/index.tsx` | E | PRODUCTS L42, usePageMeta L199 |
| `~/Documents/Workspace/seagle-website/src/pages/Services/index.tsx` | E | SERVICE_CONFIG L12, usePageMeta L115 |
| `~/Documents/Workspace/seagle-website/src/pages/Career/index.tsx` | E | JobConfig L43, JOBS_CONFIG L45-78, usePageMeta L222 |
| `~/Documents/Workspace/seagle-website/src/hooks/useJsonLd.ts` | L | 18 l., recopié ci-dessous |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | getLocalizedPath |
| `~/Documents/Workspace/seagle-website/src/pages/Kora/index.tsx` | L | L303-315 modèle d'appel |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T008/` | E | script de vérif, build |

## Contrats
```ts
// src/hooks/useJsonLd.ts — un seul <script id="page-jsonld"> par page
export function useJsonLd(schema: object): void
// src/lib/site.ts
export const SITE_URL = "https://seagle.io"
// src/lib/routes.ts:31
export const getLocalizedPath = (lang: string | undefined, key: RouteKey) => string  // fr|en seulement
```
Modèle existant (Kora L303) :
```ts
useJsonLd({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Kora", "description": t("Kora.meta.description"), "url": "https://seagle.io/solutions/kora", "provider": { "@type": "Organization", "name": "Seagle", "url": "https://seagle.io" } })
```
JobPosting requis (Google) : title, description, datePosted (=postedOn), validThrough (=closedOn si présent), employmentType (CDI→FULL_TIME, Freelance→CONTRACTOR, Stage→INTERN), hiringOrganization ORG, jobLocationType "TELECOMMUTE" + applicantLocationRequirements {"@type":"Country","name":"FR"} si `remote === "Full remote"`, sinon jobLocation PostalAddress Peyruis FR.
`ORG` = `{"@type":"Organization","name":"Seagle","url":"https://seagle.io"}` (constante locale par fichier).
Plusieurs entités → `{"@context":"https://schema.org","@graph":[…]}`.

## Décisions actées
- jamais de JobPosting pour une offre fermée — Google l'interdit
- dates `closedOn` actuelles fictives : ne pas les exposer — offres toutes fermées
- Booking et CGU : pas de JSON-LD — valeur nulle
- `ORG = { "@type": "Organization", "name": "Seagle", "url": "https://seagle.io" }` (forme Kora) ; index.html intouché — autre agent l'écrit
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- pages produits/tableaux/services détaillés (déjà couverts)
- `useJsonLd.ts`, `usePageMeta.ts`, `routes.ts` en écriture
- hreflang, sitemap, URLs /de /es /it (V3)
- textes visibles des pages

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T008/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T008/dist --port 4403 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T008/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T008/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T008
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
