---
name: conventions-seagle
description: Conventions, pièges et commandes du site Seagle (seagle-website : Vite, prérendu, i18n 5 langues, a11y, e2e). À charger pour toute tâche sur le site Seagle.
---
# Conventions Seagle (seagle-website)

## Outillage/build
- `npm run build` = vite build → prerender.mjs → scripts/check-dist.mjs ; prerender lance son preview :4173 puis le tue [[seagle-outillage-build]]
- `vite preview` strictPort 4173 → build KO tant qu'un preview tourne [[seagle-outillage-build]]
- vrai déploiement = scripts/deploy-static.sh (rsync VPS, perso, non versionné) ; CI deploy.yml (Pages) ≠ seagle.io [[seagle-outillage-build]]
- plugin sitemap vite.config.js écrit `cwd/dist/sitemap.xml` en dur (≠ `--outDir`) [[seagle-outillage-build]]
- build isolé : `cd <T>/ && node_modules/.bin/vite build <repo> --outDir <T>/dist --emptyOutDir` ; vérif `md5sum dist/sitemap.xml` avant = après [[seagle-outillage-build]]
- `npx vite build` depuis le repo → écrase dist/sitemap.xml partagé [[seagle-outillage-build]]
- `<T>/dist` absent → bundle OK mais exit 1 à l'écriture sitemap [[seagle-outillage-build]]
- imagetools crée `<T>/node_modules/.cache` → supprimer [[seagle-outillage-build]]
- preview : `node_modules/.bin/vite preview` (≠ `npx`) — sinon `kill` laisse l'enfant, port pris [[seagle-outillage-build]]
- preview sert dist/index.html (fr) pour `/de/products` SANS `/` final → curl/e2e toujours avec `/` final [[seagle-outillage-build]]
- `VITE_ANALYTICS_SRC` absent → branche éliminée (`rg -c seagle-analytics dist` → 0) [[seagle-outillage-build]]
- `.env.example` ignoré par .gitignore:7 → `git add -f .env.example` [[seagle-outillage-build]]
- `VITE_CHAT_API_URL` lu en 3 copies (ChatBot/index.tsx:8-10, Booking:14-16, Contact:16-18), défaut `https://api.seagle.io` [[seagle-outillage-build]]
- serveur RDV local : `cd server && PORT=3001 ALLOWED_ORIGINS=http://localhost:4173 MAIL_TRANSPORT=json NVIDIA_API_KEY=<x> npm start` + site buildé `VITE_CHAT_API_URL=http://localhost:3001` [[seagle-outillage-build]]
- build avec `localhost:3001` part en ligne sinon → garde check-dist [[seagle-e2e-check-dist]]

## i18n
- source unique `src/lib/site-routes.json` (lue par routes.ts, prerender.mjs, vite.config.js) ; page neuve = 1 ligne JSON [[seagle-i18n-routes-5-langues]]
- URL es/de/it = `/<l>` + chemin EN ; fr/en inchangés ; 0 slug traduit [[seagle-i18n-routes-5-langues]]
- URL partagée fr/en = contenu fr : hreflang sans `en` (5 + x-default) [[seagle-i18n-routes-5-langues]]
- langue initiale = URL > localStorage > navigator ; `supported()` exact (`de-DE` → fr) [[seagle-i18n-routes-5-langues]]
- liens internes : toujours `getLocalizedPath` / `getLocalizedChildPath(lang,"services",slug)` ; 0 `to="/…"` en dur [[seagle-i18n-routes-5-langues]]
- DoD rg : `rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**'` ET `rg -n '(to|href)=\{`/|navigate\(`/' src` [[seagle-i18n-routes-5-langues]]
- `usePageMeta` : `pathname` dans les deps (sinon canonical figé) [[seagle-i18n-routes-5-langues]]
- `useLanguageRedirect` deps `search`, `hash` [[seagle-i18n-routes-5-langues]]
- Pages/nginx sans réécriture : chaque URL exige un fichier prérendu [[seagle-i18n-routes-5-langues]]
- es/de/it font `...fr` → chunk fr toujours chargé [[seagle-i18n-routes-5-langues]]
- `Services/index.tsx` jamais routé → JSON-LD ItemList mort [[seagle-i18n-routes-5-langues]]

## Accessibilité/tokens
- `--th-text-md/faint` = encres des visuels ASCII (readInk, ascii-core.ts:62-69) → NE PAS relever [[seagle-a11y-tokens-audit]]
- texte : utilitaires lisent `--th-copy-md` / `--th-copy-faint` (≥ 4.5) ; surcharge `.force-dark` [[seagle-a11y-tokens-audit]]
- preuve ASCII intact : `INK=… node ascii-sensib.mjs` (hash `/`) + `node ascii-dom.mjs` [[seagle-a11y-tokens-audit]]
- `.force-dark` copy-faint .40 → 3.77 sur #0a0a0a (sous seuil) [[seagle-a11y-tokens-audit]]
- reduced-motion : règle CSS globale coupe toute classe `animate-*` [[seagle-a11y-tokens-audit]]
- mega-menu : bouton `aria-expanded` + Entrée/Échap ; tiroir `#mobile-drawer` `inert` fermé (React 18.3 : `{ inert: "" } as object`) ; skip link `id="main"` [[seagle-a11y-tokens-audit]]
- bouton langue : nom ≠ texte visible « FR » (WCAG 2.5.3) [[seagle-a11y-tokens-audit]]
- Booking : `autoFocus` Nom ouvre le clavier mobile [[seagle-a11y-tokens-audit]]
- audit : `BASE=http://localhost:<port> node <T>/audit.mjs struct|contrast|motion|kbd|forms|extra` (banc vault/artefacts/seagle-site/T003/audit.mjs) [[seagle-a11y-tokens-audit]]

## E2E
- `BASE=http://localhost:4173 npm run test:e2e` ; prérequis `npm run build && npm run preview` ; 113/113 ≈ 80-100 s [[seagle-e2e-check-dist]]
- e2e/run.mjs : playwright lib seule (∅ @playwright/test) ; `SITEMAP=<fichier>` change la source [[seagle-e2e-check-dist]]
- vérifie par page : h1, pageerror, canonical `https://seagle.io`+chemin, ≥ 1 `<loc>` ; `**/api/**` mocké [[seagle-e2e-check-dist]]
- `/` final exigé sur `<loc>` ≠ `/` [[seagle-e2e-check-dist]]
- canonical posé 2-5 s après load : attente ≤ 8 s (3 s = flaky) [[seagle-e2e-check-dist]]
- e2e NE voit PAS : 404 réelle (fallback SPA = 200) [[seagle-e2e-check-dist]]
- check-dist : `node scripts/check-dist.mjs [dir] [--warn]` ; exit 1 si localhost/127.0.0.1/0.0.0.0/[::1] dans dist ; sans index.html → exit 1 même en `--warn` [[seagle-e2e-check-dist]]
- check-dist NON détecte : concat `"http://localhost"+":3001"`, `localhost:3001` sans schéma, `http://localhost` sans port [[seagle-e2e-check-dist]]
- garde réel = valeur de `VITE_CHAT_API_URL` au build [[seagle-e2e-check-dist]]
- tests de casse du garde : fixtures `fake/<cas>/index.html` + `assets/*.js` ; un garde non cassé ne prouve rien [[seagle-e2e-check-dist]]
- `getByRole` name = sous-chaîne → `exact: true` [[playwright-getbyrole-sous-chaine]]

## Pièges
- HTML prérendu contient déjà `class="app-mounted"` → sonde de montage fiable = `__reactContainer` sur `#root` [[seagle-reload-chunk-prerendu]]
- `i18nReady` en échec : garder le HTML prérendu ; `returnObjects` non-tableau → `.map is not a function` [[seagle-reload-chunk-prerendu]]
- garde reload (src/main.tsx) : clés sessionStorage `reloaded:boot|preload|locale|<pathname>` ; 1 reload/adresse/session [[seagle-reload-chunk-prerendu]]
- `reloaded:boot` purgée seulement après montage à une autre adresse (sinon boucle) [[seagle-reload-chunk-prerendu]]
- repli `.boot-failed` : prérendu fige `opacity: 0;` (avec `;`) + `[style^="transform: translateY("]` + `filter: none` [[seagle-reload-chunk-prerendu]]
- repli absent si l'entrée JS échoue ; chunk non-page post-montage → page blanche [[seagle-reload-chunk-prerendu]]
- test d'échec : `page.route` abort sur le chunk [[seagle-reload-chunk-prerendu]]
- localStorage hors SUPPORTED_LANGUAGES ou vide → ignoré (`||` pas `??`) [[seagle-reload-chunk-prerendu]]
- fichiers non suivis (check-dist.mjs, run.mjs) : `git diff --no-index --stat <avant> <fichier>` [[seagle-e2e-check-dist]]
