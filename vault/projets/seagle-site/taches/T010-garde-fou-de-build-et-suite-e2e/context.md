---
pack: T010
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T010 — Garde-fou de build et suite e2e

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Livrer `scripts/check-dist.mjs` (refuse un `dist/` qui appelle localhost) branché sur `npm run build` (avertissement) et `npm run check:dist` + CI (bloquant), et `e2e/run.mjs` (`npm run test:e2e`) : crawl de toutes les URLs du sitemap + parcours contact et RDV avec API simulée.

## Definition of Done
- [ ] `node scripts/check-dist.mjs <dir>` (défaut `dist`) : cherche `https?://(localhost|127\.0\.0\.1)` dans `<dir>/**/*.{js,html}` → liste fichiers + exit 1 ; sinon « dist OK » exit 0 ; `--warn` → même liste, exit 0
- [ ] test : build `VITE_CHAT_API_URL=http://localhost:3001` dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/dist-local` → exit 1 ; build sans variable dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/dist` → exit 0 (motif sans faux positif de lib : sortie collée)
- [ ] `package.json` : `build` = `vite build && node prerender.mjs && node scripts/check-dist.mjs --warn` ; `check:dist` = `node scripts/check-dist.mjs` ; `test:e2e` = `node e2e/run.mjs`
- [ ] `.github/workflows/deploy.yml` : étape `npm run check:dist` après Build (L30-35), avant Upload
- [ ] `e2e/run.mjs` : `BASE` (défaut http://localhost:4173), `SITEMAP` (défaut `dist/sitemap.xml`) → toutes les `<loc>` réécrites sur BASE ; par page : 0 `pageerror`, 0 réponse ≥ 400 même origine, `h1` présent, `<title>` non vide, canonical commence par `https://seagle.io`
- [ ] parcours contact (`/contact`) : API simulée par `page.route` (`**/api/contact`) → 200 : message de succès visible ; → réseau coupé : lien mail de secours visible
- [ ] parcours RDV (`/rendez-vous`) : `**/api/booking/slots*` → `{timezone:"Europe/Paris",minutes:30,slots:[<ISO futur>]}` ; `**/api/booking` POST → 200 `{ok:true,booking:{…}}` : confirmation visible ; → 409 : message traduit (pas « Failed to fetch »)
- [ ] sortie : 1 ligne `✓|✗ <cas>` par test, résumé, exit 1 si 1 échec ; durée totale < 3 min sur ton preview (`~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/dist`, port 4405, `SITEMAP=~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/dist/sitemap.xml` si présent sinon `dist/sitemap.xml`) → sortie brute collée, verte
- [ ] `git diff --stat -- package.json .github/workflows/deploy.yml` → seules les lignes ci-dessus
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/scripts/check-dist.mjs` | E | nouveau |
| `~/Documents/Workspace/seagle-website/e2e/run.mjs` | E | nouveau (un seul fichier, ou + `e2e/lib.mjs` si > 250 l.) |
| `~/Documents/Workspace/seagle-website/package.json` | E | scripts L6-11 seulement |
| `~/Documents/Workspace/seagle-website/.github/workflows/deploy.yml` | E | étape check:dist |
| `~/Documents/Workspace/seagle-website/src/pages/Contact/index.tsx` | L | fetch L112, états succès/échec |
| `~/Documents/Workspace/seagle-website/src/pages/Booking/index.tsx` | L | slots L148-190, POST L203, erreurs |
| `~/Documents/Workspace/seagle-website/vite.config.js` | L | sitemap écrit `dist/sitemap.xml` en dur |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/crawl-15-pages.mjs` | L | crawl existant, modèle |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/` | E | builds, sorties |

## Contrats
API (server/tools/booking.mjs) :
```
GET  /api/booking/slots?type=<t>&days=42 → 200 {timezone, minutes, slots: string[] /*ISO*/}
POST /api/booking → 200 {ok:true, booking:{id,type,start,end}} | 409 {error} | 429 | 400 | 503
POST /api/contact → 200 | ≥400 | réseau KO → lien mailto de secours
```
`API_URL` = `import.meta.env.VITE_CHAT_API_URL ?? "https://api.seagle.io"` (Contact:16-18, Booking:14-16, ChatBot:8-10) → simuler `**/api/...` couvre les deux.
Playwright : lib seule (`playwright` 1.62), **pas** `@playwright/test` ; import dans `e2e/run.mjs` : `import { chromium } from "playwright"`.

## Décisions actées
- build local avec localhost reste possible (`--warn`) — l'humain prévisualise ainsi
- `scripts/deploy-static.sh`, `Makefile` perso : NE PAS toucher ; l'humain y ajoutera `npm run check:dist`
- API simulée, jamais de vrai serveur ni d'envoi de mail en e2e
- e2e sans attendre les animations : `waitUntil: "load"` + 1 s max
- 0 nouvelle dépendance
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- `prerender.mjs`, sources `src/` (lecture seule)
- tests unitaires, CI e2e (on ne lance pas l'e2e en CI)
- accessibilité (autre tâche)

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/dist --port 4405 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T010/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T010
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
