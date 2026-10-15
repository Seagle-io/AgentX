---
tache: T004
statut: fait
---
## Livré
CI
- .github/workflows/deploy.yml:3-6 — push main + workflow_dispatch
- deploy.yml:17-39 — job build : checkout, node 20, npm ci, build, upload dist
- deploy.yml:41-50 — job deploy → GitHub Pages (actions/deploy-pages@v4)
```yaml
      - name: Build
        env:
          VITE_CHAT_API_URL: ${{ vars.VITE_CHAT_API_URL || 'https://api.seagle.io' }}
        run: npm run build
```
- CI : seule var VITE_* = VITE_CHAT_API_URL ; aucun garde-fou, aucun test
- docs/deploiement.md:72-77 — prod seagle.io = VPS, pas Pages ; workflow « à trancher »
Chemin réel de mise en ligne = perso (script)
- Makefile:22-23 — `deploy` → ./scripts/deploy-static.sh ; `build` = npm run build (Makefile:19-20)
- scripts/deploy-static.sh:35 — `env -u GITHUB_ACTIONS -u GITHUB_REPOSITORY npm run build` (env hérité sinon, donc VITE_CHAT_API_URL du shell passe tel quel)
- deploy-static.sh:38 — seul contrôle : dist/index.html existe
- deploy-static.sh:43,56 — rsync -az --delete dist/ → root@188.245.145.102:/var/www/seagle.io/
- deploy-static.sh:47-50 — confirmation y/N sauf --yes ; :53 backup .bak-<date> ; :59 curl code HTTP
- options : --no-build (:24, réutilise dist/ tel quel) · --dry-run · --yes
- INSERTION garde-fou : entre :35 et :38 (ou après :38) ; --no-build contourne le build, donc scanner dist/ pas l'env
Scripts npm (package.json:6-11)
```json
"build": "vite build && node prerender.mjs", "preview": "vite preview", "prerender": "node prerender.mjs", "dev": "vite"
```
- ∅ script test / lint / e2e ; versions : vite 7.3.6 installé (^7.1.11), playwright 1.62.0
VITE_CHAT_API_URL — 3 usages code (pas 4), identiques
- src/components/ChatBot/index.tsx:8-10
- src/pages/Booking/index.tsx:14-16
- src/pages/Contact/index.tsx:16-18
```ts
import.meta.env.VITE_CHAT_API_URL ??
  (import.meta.env.DEV ? "http://localhost:3001" : "https://api.seagle.io")
```
- 4e occurrence : ∅ dans src/ (autres : docs/deploiement.md:31, server/README.md:20,72)
- défaut build prod = https://api.seagle.io ; `??` : valeur vide "" ≠ nullish → passe, URL vide
- ∅ .env / .env.* à la racine (ls -a) ; ∅ server/.env
- src/lib/site.ts:8 — `export const SITE_URL = "https://seagle.io"` (8 l., en dur)
Détection build localhost
- dist courant : 2 chunks contiennent `localhost:3001` (index-cvFupPKG.js, index-DpPmOsNW.js) ; 3e chunk index-CqaZvUYp.js contient api.seagle.io (3 occ.) → dist/ mélange d'anciens chunks (dist non nettoyé)
- littéraux minifiés : `F="http://localhost:3001"` (Contact/ChatBot), `T="http://localhost:3001"` (Booking)
- prerender.mjs:116-121 — réécrit dist/**/index.html mais ≠ assets
prerender.mjs
- :19 PORT=4173 ; :76-80 spawn `node_modules/.bin/vite preview --port 4173 --strictPort` detached
- :16 `import { chromium } from 'playwright'` ; :88 chromium.launch() sans args (≠ WebGL swiftshader)
- :23-59 ROUTES = 33 entrées (24 fr + 9 en) ; :93 contexte neuf/route, locale + i18nextLng amorcé
- :101 attend html.app-mounted ; :103-106 attend disparition « Chargement... » ; :107 +150 ms
- :114-121 page.content() → dist/<route>/index.html ; :125 dist/404.html = home
- échec : try/catch par route :131-133 failed++ ; :145 `if (failed > 0) process.exit(1)` → npm run build KO
- PIÈGE : port 4173 strict ; preview déjà lancé (humain) → `npm run build` échoue (strictPort) — ne pas builder maintenant
- PIÈGE : prérendu exécute le JS → tout script d'audience injecté serait exécuté ET figé dans le HTML capturé (:114)
index.html (94 l.) / Vite
- :4-5 meta charset/viewport ; :6-27 <style> ; :28-31 fonts ; :32 `<link href="/src/style.css">`
- :71-87 JSON-LD <script> inline ; :88-93 favicons ; :94 theme-color ; :95 </head> (fin head ≈ L95 ; fichier 94 l. selon pack — vérifier au moment d'éditer)
- point d'insertion script conditionnel : juste avant `</head>` ou avant `<script type="module" src="/src/main.tsx">` (fin body)
- `%VITE_X%` dans index.html : OK nativement Vite 7 (remplacement d'env) ; var non définie → reste littéral `%VITE_X%` (NV : non testé, pas de build)
- vite.config.js:131-154 — plugins react, tailwind, imagetools, custom-sitemap(:13-129) ; aucun transformIndexHtml ; ∅ define
- vite.config.js:9-10,132 — base '/<repo>/' si GITHUB_ACTIONS=true et GITHUB_REPOSITORY (CI Pages) sinon '/'
CSP / headers
- index.html : ∅ meta http-equiv / Content-Security-Policy
- public/_headers : ∅ (public/ listé : pas de _headers, ni _redirects)
- CSP serveur nginx (VPS) : NV — hors dépôt (docs/deploiement.md:18-26 mentionne HSTS, try_files, expires 30d ; rien sur CSP)
e2e
- playwright 1.62.0 (devDependencies package.json:49) ; node_modules/.bin/playwright présent ; node_modules/@playwright ∅ → pas de @playwright/test
- ~/.cache/ms-playwright : chromium-1228, chromium-1234, chromium_headless_shell-1228/1234, ffmpeg-1011
- crawl-15-pages.mjs (8 l.) : chromium 1440x900, visite 15 URLs sur :4173, scroll 6000px par 1200
- crawl : collecte pageerror + réponses HTTP >=400 ; imprime « no errors » sinon liste
- convention import : chemin absolu .../node_modules/playwright/index.mjs
server/
- server/package.json:6-7 — `npm start` = `node --env-file=.env index.mjs` ; `npm run dev` = idem + --watch
- port : PORT env, défaut 3001 (server/index.mjs:7)
- CORS : ALLOWED_ORIGINS, défaut `http://localhost:5173` seul (index.mjs:8) → preview 4173 refusé sauf ALLOWED_ORIGINS=http://localhost:4173
- NVIDIA_API_KEY obligatoire : process.exit(1) sans (tools/chat.mjs:13-16) ; .env absent, `.env.example` à copier
- mails : MAIL_TRANSPORT=json → console, sinon SMTP_HOST/PORT/USER/PASS (tools/mailer.mjs:7-13) ; bookings → server/data/bookings.json (BOOKING_FILE, tools/booking.mjs:22) ; BOOKING_NOTICE_HOURS 12, HORIZON_DAYS 30
- GET /health → {ok:true} (index.mjs:27)
## Vérifié comment
- `rg -l 'localhost:3001' dist` → dist/assets/index-DpPmOsNW.js, dist/assets/index-cvFupPKG.js
- `rg -c 'api.seagle.io' dist/assets/*.js` → index-CqaZvUYp.js:3
- `rg -n VITE_ src docs server` → 3 usages src (ChatBot:9, Booking:15, Contact:17)
- `node -e require('./node_modules/playwright/package.json').version` → 1.62.0 ; vite package.json → 7.3.6
- `ls node_modules/@playwright` → inexistant ; `ls public/_headers` → absent
- `%VITE_X%` Vite 7 : NV — connaissance doc, pas d'essai (build interdit)
## Écarts
- ∅ lecture hors WL (server/index.mjs, tools/*.mjs, chat.mjs, mail.mjs, server/README.md via rg : lectures de server/ nécessaires à DoD « variables requises », à journaliser comme lecture hors WL ≥ 3 fichiers)
- DoD 3 : « 4 usages » → 3 trouvés
- index.html fin de head : numérotation L88-95 approximative (lu par sed 40-94)
## Pour la suite
- Vraie mise en ligne = `scripts/deploy-static.sh` (rsync VPS, perso, non versionné) ; CI deploy.yml (Pages) ne sert pas seagle.io. Garde-fou versionné : script node scanner `dist/assets/*.js` (`localhost:3001`/`localhost:`) lancé en fin de `npm run build` (package.json:8 après prerender.mjs), exit 1 ; couvre CI et script perso, y compris --no-build seulement si lancé aussi dans le script perso.
- API_URL : 3 copies (ChatBot/index.tsx:8-10, Booking:14-16, Contact:16-18) ; défaut prod https://api.seagle.io ; build localhost reconnaissable à `http://localhost:3001` dans dist/assets/index-*.js. dist actuel contient des chunks périmés non nettoyés (ne pas se fier à `rg dist` sans build propre ; emptyOutDir par défaut vite écrase pourtant à chaque build).
- Audience : injecter dans index.html via `%VITE_X%` (Vite 7 natif, NV) ; prérendu exécute le JS et fige le DOM (prerender.mjs:114) → script absent si var non posée, sinon présent dans HTML prérendu ; ∅ CSP dans le dépôt, nginx NV.
- e2e : playwright 1.62 lib seule, chromium-1234 installé, ∅ @playwright/test ; modèle = crawl-15-pages.mjs ; serveur RDV : `cd server && PORT=3001 ALLOWED_ORIGINS=http://localhost:4173 MAIL_TRANSPORT=json NVIDIA_API_KEY=<x> npm start` + site buildé avec VITE_CHAT_API_URL=http://localhost:3001 ; `npm run build` impossible tant que preview 4173 tourne (strictPort).
## Retour sur le pack
- Manquait: lecture server/ non listée en WL (besoin pour DoD server) ; Inutile: ∅
