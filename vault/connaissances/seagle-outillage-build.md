---
titre: seagle-website — build, prérendu, preview, ports, sitemap en dur
resume: build partagé dist/ ; sitemap et prérendu ignorent outDir ; builds isolés = cwd tâche
source: seagle-site T004 T010 T011 T015 T020 T023 T024
cree: 2026-10-14
tags: [note, seagle, build, outillage, piege]
---

# seagle-website : outillage build

## Fait
- `npm run build` = vite build → prerender.mjs → `scripts/check-dist.mjs` (package.json:8, ≈) ; prerender lance son propre preview :4173 puis le tue
- `vite preview` strictPort 4173 → `npm run build` KO tant qu'un preview tourne
- vrai déploiement = `scripts/deploy-static.sh` (rsync VPS, perso, non versionné) ; CI `deploy.yml` (Pages) ≠ seagle.io ; prod nginx `try_files $uri $uri/index.html` (docs/deploiement.md:20)
- plugin sitemap `vite.config.js` écrit `cwd/dist/sitemap.xml` en dur (≠ `--outDir`) ; hostname `https://seagle.io` en dur 2× (prerender.mjs SITE, vite.config.js)
- build isolé sans toucher dist/ partagé : `cd <T>/ && node_modules/.bin/vite build <repo> --outDir <T>/dist --emptyOutDir` ; vérif `md5sum dist/sitemap.xml` avant = après
  - `npx vite build` depuis le repo → écrase `dist/sitemap.xml` (33 → 109 `<loc>` observé en cours de tâche)
  - dossier `<T>/dist` absent → bundle OK mais exit 1 à l'écriture sitemap
  - imagetools crée `<T>/node_modules/.cache` → supprimer
- preview : lancer `node_modules/.bin/vite preview` (≠ `npx`) sinon `$!` = pid npx, `kill` laisse l'enfant vite → port pris
- preview sert `dist/index.html` (fr, canon `/`) pour `/de/products` SANS `/` final ; prérendu servi seulement avec `/` final → curl/e2e toujours avec `/` final
- audience : `VITE_ANALYTICS_SRC` absent → branche éliminée du bundle (`rg -c seagle-analytics dist` → 0) ; posée → 1 `script#seagle-analytics`, figé dans HTML prérendu
- `.env.example` ignoré par `.gitignore:7 .env.*` → `git add -f .env.example`
- API : `VITE_CHAT_API_URL` lu en 3 copies (ChatBot/index.tsx:8-10, Booking:14-16, Contact:16-18), défaut `https://api.seagle.io`
- serveur RDV local : `cd server && PORT=3001 ALLOWED_ORIGINS=http://localhost:4173 MAIL_TRANSPORT=json NVIDIA_API_KEY=<x> npm start` + site buildé `VITE_CHAT_API_URL=http://localhost:3001`

## Pourquoi ça compte
- arbre partagé → un build mal ciblé écrase le dist/ d'un autre agent
- build avec `localhost:3001` part en ligne sinon (garde : [[seagle-e2e-check-dist]])

## Où
- `package.json:8` — script build ; `vite.config.js` customSitemapPlugin — sitemap en dur
- `prerender.mjs` — liste issue de `src/lib/site-routes.json`

## Voir aussi
- [[seagle-i18n-routes-5-langues]]
- [[seagle-e2e-check-dist]]
