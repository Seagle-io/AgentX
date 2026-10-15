---
pack: T024
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T024 — Corriger : canonical après bascule, majuscules, slug inconnu

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les défauts T019 D1-D3 : canonical/og:url mis à jour à chaque changement d'URL, URLs en majuscules ramenées en minuscules, bascule de langue sur un slug de service inconnu cohérente.

## Definition of Done
- [ ] D1 : `usePageMeta` recalcule canonical + og:url quand `pathname` change (dépendance `useLocation().pathname` ou équivalent) ; repro `t4-toggle.mjs` → 30/30 canonical = URL courante
- [ ] D2 : `/DE/products`, `/De`, `/PRODUITS` → redirection `replace` vers la même URL en minuscules (query + hash conservés) → page dans la bonne langue, canonical minuscule
- [ ] D3 : `/de/services/inconnu` + bascule fr → URL et langue cohérentes (ex. `/services/inconnu` → redirection existante vers 1er service, ou `/de` → `/`) ; règle choisie notée dans Livré
- [ ] non-régression : `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T019/t1-headurls.mjs` (68 URLs) et `t3-nav.mjs`, `t5-edges.mjs` rejoués sur ton preview → OK (BASE adapté)
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/hooks/usePageMeta.ts` | E | deps L57, pageUrl L32 |
| `~/Documents/Workspace/seagle-website/src/hooks/useLanguageRedirect.ts` | E | `!match` → return L25 |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | E | redirection minuscules (avant les Routes) |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | matchRoute, langFromPath, pathFor, getLocalizedPath |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T019-casser-les-urls-en-cinq-langues/result.md` | L | défauts + repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T019/` | L | scripts de repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T024/` | E | build, scripts |

## Contrats
Défauts T019 (verbatim) :
```
D1 G3 — sélecteur de langue → URL change, canonical + og:url restent l'ancienne URL (23/30 toggles) — usePageMeta.ts:32,57 deps [title,description,image] ∌ pathname
D2 G3 — /DE/products, /De → React Router insensible casse rend la page en fr, canon=/DE/products, 0 hreflang ; matchRoute/langFromPath sensibles casse — routes.ts:45,57
D3 G3 — /de/services/inconnu + toggle fr → URL /de…, lang fr — useLanguageRedirect.ts:25 !match → return
```
Règle de redirection (contrat T005) : `m = matchRoute(pathname)` ; `pathFor(m, l)` ; `langFromPath(p)` = 1er segment ∈ PREFIXED sinon `matchRoute(p)?.locale`.

## Décisions actées
- choix A des URLs — decisions.md 2026-10-14 ; prérendu non concerné (109/109 OK)
- `routes.ts` intouché (API stable)
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- `/services/inconnu` titre en clé brute (préexistant) ; i18n.ts (T023) ; prerender, vite.config

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T024/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T024/dist --port 4424 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T024/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T024/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T024
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
