---
pack: T009
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T009 — Activer /lab avec les quatre tableaux

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réactiver la route `/lab` et remplacer `src/pages/Lab/index.tsx` par une page courte au style du kit qui présente les 4 tableaux ASCII (cartes de `AsciiGalleryNav`), liée depuis le pied de page, prérendue et dans le sitemap.

## Definition of Done
- [ ] `routes.ts` : `lab: { fr: "/lab", en: "/lab" }` actif (L24 décommentée) ; `App.tsx` : `{ key: "lab", Component: Lab }` actif (L70) ; route `/lab/:slug` (L97) reste commentée
- [ ] `Lab/index.tsx` réécrit (< 80 l.) : section hero = même structure que `Product/index.tsx:211-240` (`Kicker` + `SplitReveal`), puis `<AsciiGalleryNav />` sans `current` ; `usePageMeta(t("Lab.demos.meta.title"), t("Lab.demos.meta.description"))` ; 0 halo/blur/gradient décoratif (`rg "blur|gradient" src/pages/Lab/index.tsx` → 0)
- [ ] `ascii-gallery-nav.tsx` : `current` devient optionnel ; sans `current` → 4 cartes, sans l'étiquette « Les autres démos » ; avec `current` → rendu actuel inchangé (vérifié sur /la-joconde : 3 cartes)
- [ ] `Lab.ts` ×5 : bloc `demos: { meta: { title, description }, kicker, title, intro }` ajouté, traduit (fr, en, de, es, it) ; clés existantes intouchées
- [ ] `footer.tsx` : `{ label: "Lab", to: getLocalizedPath(lang, "lab") }` en fin de colonne produits (L49-55)
- [ ] `prerender.mjs` : `{ path: '/lab', lang: 'fr' }` dans ROUTES ; `vite.config.js` : ligne `/lab` du sitemap (L36) décommentée, bloc articles Lab (L107-119) reste commenté
- [ ] Playwright sur ton preview (:4404), fr + en, thèmes clair et sombre : `/lab` → h1, 4 liens vers les 4 tableaux qui répondent 200 ; lien « Lab » du pied de page mène à /lab ; captures dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009/`
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/pages/Lab/index.tsx` | E | réécrit entièrement |
| `~/Documents/Workspace/seagle-website/src/components/ui/ascii-gallery-nav.tsx` | E | `current` optionnel seulement |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | E | L24 |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | E | L70 seulement |
| `~/Documents/Workspace/seagle-website/src/components/Header/footer.tsx` | E | colonne produits |
| `~/Documents/Workspace/seagle-website/prerender.mjs` | E | ROUTES L23-59 |
| `~/Documents/Workspace/seagle-website/vite.config.js` | E | L36 |
| `~/Documents/Workspace/seagle-website/src/lib/local/fr/Lab.ts` | E | + `demos` (en, de, es, it : même chemin, même droit E) |
| `~/Documents/Workspace/seagle-website/src/pages/Product/index.tsx` | L | L211-240 modèle hero kit |
| `~/Documents/Workspace/seagle-website/src/components/ui/motion-kit.tsx` | L | Kicker L181, SplitReveal L50, splitAccent L193 |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009/` | E | build, captures |

## Contrats
```ts
// motion-kit.tsx
export const Kicker = ({ children, color, className }: { children: ReactNode; color?: string; className?: string }) => …
export const splitAccent = (text: string): [string, string] => …
// SplitReveal({ lines, as = "h2", className, … }) — lire L50-80 pour les props exactes
// ascii-gallery-nav.tsx (actuel)
export type GalleryKey = "starryNight" | "creationOfAdam" | "greatWave" | "monaLisa"
export function AsciiGalleryNav({ current }: { current: GalleryKey })  // → { current?: GalleryKey }
// routes.ts
export const getLocalizedPath = (lang: string | undefined, key: RouteKey) => string
```
Textes existants réutilisables : `AsciiGallery.title` = « Quatre tableaux, deux façons de les écrire », `AsciiGallery.items.<k>.{name,author,hint}`.

## Décisions actées
- /lab = les 4 tableaux seuls ; expériences et notes de recherche cachées — décision humain 2026-10-14
- `LabArticle`, `src/content/lab/` : intouchés, route article reste désactivée
- exception à l'interdit ASCII : `ascii-gallery-nav.tsx` = navigation, pas un visuel ; seule la prop `current` change
- lien de menu (header) : non — fichier écrit par une autre tâche
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- `header.tsx`, `mega-menu.tsx` (autre agent)
- les 4 pages tableaux, les composants `ascii-*` des tableaux
- URLs /de /es /it (V3) ; image OG de /lab

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009/dist --port 4404 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T009/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T009
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
