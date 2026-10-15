---
pack: T006
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T006 — Traductions chargées à la demande

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Charger seulement la langue active (+ `fr`, langue de repli) au lieu des 5 dans le chunk d'entrée, via un backend i18next maison dans `src/lib/i18n.ts`, rendu React différé jusqu'à langue prête dans `src/main.tsx` → chunk d'entrée −300 Ko brut minimum.

## Definition of Done
- [ ] `src/lib/i18n.ts` : 0 import statique de `./local/*` (`rg -n "^import .* from './local" src/lib/i18n.ts` → 0 ; sur HEAD → 5)
- [ ] chaque langue = chunk dynamique (`import('./local/xx')`) ; `ls ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/dist/assets` montre ≥ 4 chunks de locale distincts
- [ ] chunk d'entrée (`<script type=module>` de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/dist/index.html`) : taille brute et gzip avant/après, gain ≥ 300 000 o brut (avant = 924 268 o / 308 490 o gzip)
- [ ] `src/main.tsx` : `createRoot(...).render` appelé seulement après la promesse de prêt i18n ; garde `vite:preloadError` et `load` inchangées
- [ ] Playwright sur ton preview, pour fr, en, de, es, it (`i18nextLng` amorcé) : `/` affiche un texte traduit de la langue (comparer `h1` à la valeur de `src/lib/local/<l>/Home.ts`), 0 clé brute visible (`rg` motif `Home\.` dans `body.innerText` → 0), 0 `pageerror`
- [ ] bascule fr→de puis de→en via le sélecteur (`ToogleLanguage`) : texte change, 0 écran vide (capture avant/après dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/`), 0 `pageerror`
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/lib/i18n.ts` | E | 44 l., imports L3-7, init L27-38 |
| `~/Documents/Workspace/seagle-website/src/main.tsx` | E | 24 l., render L20-24 |
| `~/Documents/Workspace/seagle-website/src/lib/local/fr/index.ts` | L | forme de l'export par défaut |
| `~/Documents/Workspace/seagle-website/src/lib/local/es/index.ts` | L | `...fr` réimporté (de, it idem) |
| `~/Documents/Workspace/seagle-website/src/components/ToogleLanguage.tsx` | L | appelle `i18n.changeLanguage(code)` L36 |
| `~/Documents/Workspace/seagle-website/src/hooks/useLanguageRedirect.ts` | L | appelle `i18n.changeLanguage(urlLang)` L63 |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | L | `<Suspense>` existant |
| `~/Documents/Workspace/seagle-website/src/lib/local/fr/Home.ts` | L | textes attendus (idem en/de/es/it via `rg`) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/` | E | scripts, build, captures |

## Contrats
Exports actuels de `src/lib/i18n.ts` à conserver tels quels (importés ailleurs) :
```ts
export const defaultNS = "common"
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'it'] as const
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]
export default i18n
```
Ajout imposé (consommé par main.tsx et, en V3, par le routage /de /es /it) :
```ts
/** Résolue quand la langue initiale et le repli fr sont chargés. */
export const i18nReady: Promise<unknown>
```
Backend i18next (interface publique d'i18next, pas de dépendance) :
```ts
i18n.use({ type: "backend", init() {}, read(lng: string, _ns: string, cb: (err: unknown, data?: unknown) => void) { /* import('./local/<lng>') → cb(null, m.default) */ } })
```
Langue initiale : logique actuelle i18n.ts:22-25 inchangée (`i18nextLng` → navigator → 'fr').

## Décisions actées
- backend inline, 0 nouvelle dépendance — `i18next-resources-to-backend` refusé
- appelants de `changeLanguage` inchangés : i18next charge avant de basculer
- `partialBundledLanguages` / `resources` statiques retirés ; `fallbackLng: "fr"` gardé
- `react.useSuspense` : garder le défaut si 0 écran vide à la bascule, sinon `false` — le noter dans Livré
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- URLs /de /es /it, `routes.ts`, `useLanguageRedirect` (V3)
- motion, lenis, react-dom (libs fixes) ; préchargements du prérendu (V3)
- `src/lib/local/**` en écriture (même les `...fr` de es/de/it)
- `prerender.mjs`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/dist --port 4401 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T006
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
