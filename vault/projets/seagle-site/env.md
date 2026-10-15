---
projet: seagle-site
maj: 2026-10-15
tags: [env]
---

# Environnement — seagle-site

Format : `fait — source`. Versions : état au 2026-10-14/15.

## Dépôts et branches
- dépôt `~/Documents/Workspace/seagle-website` (noté R) — seagle-site/T006
- branche `feat/ascii-nuit-etoilee` — seagle-site/T004 ; branche non répétée depuis T006 → `git -C R branch --show-current`
- arbre partagé non commité : 6 autres agents écrivent en parallèle, leurs diffs peuvent apparaître dans ton build → signaler, ne pas corriger — seagle-site/T006
- `scripts/` et `e2e/` non suivis par git → `git diff --stat` vide, prévoir copie avant — seagle-site/T025
- `.gitignore` ignore `.env.*` — seagle-site/T011
- hébergement : GitHub Pages (`.github/workflows/deploy.yml`, `npm run build`), sans réécriture → chaque URL = `dist/<route>/index.html` ; nginx cité à tort — seagle-site/T005

## Lancer, tester, linter
- typecheck : `npx tsc --noEmit -p .` → 0 erreur sur HEAD — seagle-site/T006
- DoD périmètre : `git -C R diff --stat -- <chemins E>`, jamais global ; aucun commit (l'humain commite) — seagle-site/T006
- build agent : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/<TID>/dist --emptyOutDir` ; le plugin sitemap écrit aussi `dist/sitemap.xml` — seagle-site/T006
- cwd = dépôt écrase le `dist/sitemap.xml` partagé (vite.config.js:L45 `cwd/dist`) → `vite build <R> --outDir <artefact>/dist` depuis le dossier artefact — seagle-site/T020, seagle-site/T024
- preview agent : `npx vite preview --outDir <artefact>/dist --port 44<NN> --strictPort` en arrière-plan ; kill par pid à la fin ; `ss -ltn | grep -c <port>` → 0 — seagle-site/T006, seagle-site/T026
- build complet : `VITE_CHAT_API_URL=http://localhost:3001 npm run build` ; prérendu Playwright ≈ 109 pages, plusieurs minutes, timeout Bash 600000 — seagle-site/T001, seagle-site/T015
- prérendu non exécutable par un agent → « NV — prérendu réservé au chef » — seagle-site/T006
- e2e : `BASE=http://localhost:4173 npm run test:e2e` → 113/113 OK en 102,8 s — seagle-site/T025
- audits : `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs <struct|contrast|motion|kbd|forms|extra>` ; `BASE` codé en dur à l'époque → passer BASE — seagle-site/T003, seagle-site/T012

## Comptes et données de test
- thème : `localStorage.setItem("seagle-theme","dark"|"light")` ; langue : `localStorage.setItem("i18nextLng","fr")` via `addInitScript` — seagle-site/T006
- API créneaux (rendez-vous) injoignable depuis le preview → route Playwright (mock) — seagle-site/T013

## Versions
- React 18.3 · Vite 7.3.6 · react-router 7 · i18next 25 + react-i18next 16 · Tailwind 4 · motion 12 — seagle-site/T006
- Playwright 1.62 en lib (pas `@playwright/test`) : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` — seagle-site/T006
- WebGL headless : `chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader", …] })` — seagle-site/T001
- @types/react 19 : `inert` booléen — seagle-site/T012

## Ports, URL, fuseau
- `:4173` = `vite preview` partagé du `dist/` courant (109 pages prérendues) : ne pas l'arrêter — seagle-site/T018
- `prerender.mjs` exige `:4173` libre et tue son preview — seagle-site/T015
- ports agent : 44<NN> avec NN = numéro de tâche (4401 = T006 … 4428 = T028) — seagle-site/T028
- tests HTTP sur `:4173` exigent le `/` final ; `:4173` ≠ nginx — seagle-site/T018, seagle-site/T019
- `/en` n'existe pas (EN = `/about`…) — seagle-site/T018
- `class="app-mounted"` figé dans le HTML prérendu : sonde « mounted » fausse sur `:4173` — seagle-site/T027
- sitemap 109 pages — seagle-site/T015

## Rouge d'avance
- `check-dist` : faux positif react-router `http://localhost` connu — seagle-site/T010

## Interdits
- `npm run build` (écrit `dist/` servi sur `:4173`) sauf tâche qui l'autorise (T015) — seagle-site/T006, seagle-site/T015
- `git stash`, `checkout`, `reset`, `clean`, `commit` ; écriture dans le dépôt pour les packs de reco — seagle-site/T018
- toucher au rendu ASCII (`ascii-core.ts`, `.on-figures`, `force-dark`) — seagle-site/T013

## Bancs et scripts de référence
- `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs` (sections struct|contrast|motion|kbd|forms|extra) ; sorties `*.json` même dossier — seagle-site/T003
- scripts T027 codés en dur sur `:4173` : copier et passer `BASE` — seagle-site/T028
