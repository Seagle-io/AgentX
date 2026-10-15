---
pack: T011
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T011 — Mesure d'audience préparée, inactive

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter `src/lib/analytics.ts`, chargé par `index.html`, qui n'injecte le script d'audience (Plausible ou Umami) que si `VITE_ANALYTICS_SRC` est posée au build → build par défaut : 0 requête et 0 balise d'audience.

## Definition of Done
- [ ] `src/lib/analytics.ts` : lit `import.meta.env.VITE_ANALYTICS_SRC`, `VITE_ANALYTICS_DOMAIN` (Plausible `data-domain`), `VITE_ANALYTICS_WEBSITE_ID` (Umami `data-website-id`) ; si SRC vide → ne fait rien ; sinon 1 seul `<script defer>` (id `seagle-analytics`, pas de doublon si déjà présent dans le HTML prérendu)
- [ ] `index.html` : `<script type="module" src="/src/lib/analytics.ts"></script>` dans `<head>` (seule modif)
- [ ] `.env.example` : 3 variables commentées, 2 exemples (Plausible, Umami), vides
- [ ] build sans variable (`~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/dist`) : `rg -c "seagle-analytics" ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/dist/assets` → présent dans le code mais Playwright sur preview :4406 → 0 `script#seagle-analytics`, 0 requête hors origine liée à l'audience
- [ ] build `VITE_ANALYTICS_SRC=https://plausible.io/js/script.js VITE_ANALYTICS_DOMAIN=seagle.io` (`~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/dist-on`) : 1 balise avec `data-domain="seagle.io"` (requête bloquée par `page.route` → pas d'appel réel)
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/lib/analytics.ts` | E | nouveau |
| `~/Documents/Workspace/seagle-website/index.html` | E | 94 l., `<head>`, une ligne |
| `~/Documents/Workspace/seagle-website/.env.example` | E | nouveau ou complété |
| `~/Documents/Workspace/seagle-website/src/vite-env.d.ts` | E | typer les 3 variables si le fichier existe (`ls`), sinon ∅ |
| `~/Documents/Workspace/seagle-website/src/main.tsx` | L | 24 l., ne PAS l'importer ici (autre agent) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/` | E | builds, script de vérif |

## Contrats
Plausible : `<script defer data-domain="seagle.io" src="https://plausible.io/js/script.js"></script>`
Umami : `<script defer data-website-id="<uuid>" src="https://<hôte>/script.js"></script>`
Variables Vite exposées au client : préfixe `VITE_` obligatoire ; `import.meta.env.X` vaut `undefined` si non posée.

## Décisions actées
- fournisseur non choisi : code neutre, attributs posés selon variables — décision humain 2026-10-14
- point d'entrée = `index.html` (module séparé), pas `main.tsx` — main.tsx écrit par T006 en parallèle
- ∅ bandeau cookies : outils sans cookie
- 0 nouvelle dépendance
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- créer un compte, choisir le fournisseur
- événements personnalisés (clics, conversions)
- `main.tsx`, `prerender.mjs`, `vite.config.js`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/dist --port 4406 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T011/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T011
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
