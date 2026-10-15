---
pack: T025
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T025 — Corriger : check-dist et e2e qui laissent passer

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Durcir `scripts/check-dist.mjs` et `e2e/run.mjs` contre les défauts T020 D1, D3, D4, D7 : URL locale sous toutes ses formes détectée, dossier vide refusé, page disparue et sitemap vide détectés.

## Definition of Done
- [ ] D3 : motif insensible à la casse ; détecte `localhost`, `127.0.0.1`, `0.0.0.0`, `[::1]` après `http(s)://`, `ws(s)://` ou `//` + port optionnel ; extensions scannées `.js .mjs .cjs .json .html .css` (casse ignorée) ; 0 faux positif sur `dist/` actuel (react-router `"http://localhost"` nu sans port ni chemin : garder l'exclusion actuelle, la justifier)
- [ ] D4 : dossier vide, absent, ou sans `index.html` → exit 1 avec message
- [ ] D1 : e2e compare le canonical au chemin attendu (`https://seagle.io` + path du `<loc>`, normalisé sans `/` final) → un `<loc>` inexistant échoue
- [ ] D7 : sitemap vide ou 0 `<loc>` → exit 1
- [ ] dossiers factices de T020 (`~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T020/`) rejoués → chacun détecté ; `node scripts/check-dist.mjs` sur `dist/` → « dist OK » ; `BASE=http://localhost:4173 npm run test:e2e` → vert (sortie : dernières lignes)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/scripts/check-dist.mjs` | E | motif L19, extensions L22 |
| `~/Documents/Workspace/seagle-website/e2e/run.mjs` | E | canonical L48-49, lecture sitemap |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T020-casser-garde-fou-e2e-et-accessibilite/result.md` | L | défauts + repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T020/` | L | dossiers factices, scripts |
| `~/Documents/Workspace/seagle-website/dist/` | L | build final (lecture) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T025/` | E | dossiers de test |

## Contrats
Défauts T020 (verbatim) :
```
D1 G2 — <loc> inexistant /nexistepas → fallback SPA = accueil (h1, title, canonical https://seagle.io/) → ✓ — e2e/run.mjs:L48-49 canonical jamais comparé au chemin
D3 G3 — HTTP://LOCALHOST:3001, http://0.0.0.0:3001, //localhost:3001 → dist OK ; [::1], ws://, casse mixte, .mjs/.json/.JS non scannés — check-dist.mjs:L19,22
D4 G3 — check-dist sur dossier vide → dist OK, exit 0
D7 G3 — sitemap vide → 4/4 OK, exit 0
```
Attention : `vite preview` sert `dist/index.html` pour un chemin sans `/` final → e2e doit requêter les `<loc>` avec `/` final (sauf `/`) pour obtenir le HTML prérendu.

## Décisions actées
- preview :4173 = build final, lecture seule ; ne pas le relancer
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- `package.json`, `deploy.yml`, sources `src/`

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T025/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T025/dist --port 4425 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T025/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T025/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T025
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
