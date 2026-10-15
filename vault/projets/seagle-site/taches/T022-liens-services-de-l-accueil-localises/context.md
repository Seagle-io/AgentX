---
pack: T022
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T022 — Liens services de l'accueil localisés

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer les 3 chemins `/services/${slug}` en template literal par `getLocalizedChildPath(i18n.language, "services", slug)` dans `Home/index.tsx:193,253` et `Services/index.tsx:168` → depuis `/de`, les liens services de l'accueil mènent à `/de/services/<slug>`.

## Definition of Done
- [ ] `rg -n '(to|href)=\{`/|navigate\(`/' src -g '!src/pages/Lab*/**' -g '!src/App.tsx'` → ∅ (HEAD de l'arbre → 3)
- [ ] Playwright sur ton preview (:4422) : `/de` → clic 1er lien service de l'accueil (L193) → URL `/de/services/…`, `html[lang=de]` ; `/` (fr) → `/services/…` inchangé ; 0 `pageerror`
- [ ] `npx tsc --noEmit -p .` → 0 erreur ; `git diff --stat` des 2 fichiers → 3 lignes changées + imports
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/pages/Home/index.tsx` | E | L193, L253 + import |
| `~/Documents/Workspace/seagle-website/src/pages/Services/index.tsx` | E | L168 + import |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | signature |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T022/` | E | build, script |

## Contrats
```ts
export const getLocalizedChildPath = (lang: string | undefined, key: RouteKey, slug: string): string
// "/de" + "/services/<slug>" pour de ; "/services/<slug>" pour fr/en
```
Home/index.tsx a déjà `useTranslation` (i18n via `const { t, i18n } = useTranslation()` — vérifier, ajouter `i18n` au destructuring si absent).

## Décisions actées
- choix A des URLs — decisions.md 2026-10-14
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- tout autre lien, le JSON-LD de Home, le reste des pages

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T022/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T022/dist --port 4422 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T022/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T022/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T022
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
