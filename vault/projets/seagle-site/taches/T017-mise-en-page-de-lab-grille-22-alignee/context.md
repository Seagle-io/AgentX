---
pack: T017
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T017 — Mise en page de /lab : grille 2×2 alignée

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `ascii-gallery-nav.tsx`, quand `current` est absent (/lab) : 4 cartes en grille 2×2, sans étiquette ni `h2` (le h1 de /lab les remplace), conteneur aligné sur le hero (`max-w-6xl`) ; rendu avec `current` (4 pages tableaux) strictement inchangé.

## Definition of Done
- [ ] sans `current` : conteneur `max-w-6xl`, 0 `h2`, 0 étiquette, grille `sm:grid-cols-2` (pas de `lg:grid-cols-3`) → 2 lignes de 2 à 1440 px, 1 colonne à 390 px
- [ ] avec `current` : classes et DOM identiques à avant (capture /la-joconde avant/après, différence de pixels 0 sur la zone de la nav)
- [ ] /lab : bord gauche des cartes = bord gauche du h1 (± 1 px, `getBoundingClientRect`) à 1440 px
- [ ] espace hero → cartes cohérent (pas de `pb-24` + `pt` doublé : écart ≤ 96 px entre l'intro et la 1re carte)
- [ ] captures /lab clair + sombre, 1440 et 390, dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017/` (toutes les cartes visibles : défiler avant capture, animations `inView`)
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/components/ui/ascii-gallery-nav.tsx` | E | L27-50 : conteneur, label, h2, grille |
| `~/Documents/Workspace/seagle-website/src/pages/Lab/index.tsx` | E | 41 l. ; hero `max-w-6xl` L20, `pb-16` |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017/` | E | build, captures |

## Contrats
```tsx
export function AsciiGalleryNav({ current }: { current?: GalleryKey })
// actuel : <section className="relative z-10 w-full px-6 pb-24"><div className="max-w-5xl mx-auto"> {current && label} <motion.h2>…AsciiGallery.title</motion.h2>
//          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"> …cartes (others = ORDER.filter(k => k !== current))
```
Hero /lab : `<section className="relative w-full px-6 pt-40 md:pt-48 pb-16"><div className="relative mx-auto max-w-6xl">`

## Décisions actées
- cartes gardées telles quelles (contenu, coins, couleurs) — même composant que les pages tableaux
- exception ASCII : `ascii-gallery-nav.tsx` = navigation, pas un visuel
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- contenu des cartes, textes, `Lab.ts`
- pages tableaux, routes, pied de page

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017/dist --port 4417 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T017
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
