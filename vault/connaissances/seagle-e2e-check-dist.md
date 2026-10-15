---
titre: seagle-website — e2e Playwright et check-dist, limites
resume: run.mjs lit sitemap ; check-dist scanne dist/ ; ce qu'ils ne voient pas
source: seagle-site T010 T020 T025 T027 T028
cree: 2026-10-14
tags: [note, seagle, e2e, garde-fou, playwright]
---

# seagle-website : e2e et check-dist

## Fait
- e2e : `e2e/run.mjs` (playwright 1.62 lib seule, ∅ `@playwright/test`, chromium installé) ; `BASE=http://localhost:4173 npm run test:e2e` ; prérequis `npm run build && npm run preview` ; 113/113 en ≈ 80-100 s (4 workers) ; `SITEMAP=<fichier>` change la source (défaut `dist/sitemap.xml`)
- e2e vérifie par page : h1, pageerror, canonical = `https://seagle.io` + chemin attendu, ≥ 1 `<loc>` ; `**/api/**` coupé/mocké (contact 200/réseau coupé, rdv 200/409)
- e2e exige `/` final sur `<loc>` ≠ `/` (convention `x/index.html`)
- canonical posé 2-5 s après load (canvas) : attente ≤ 8 s, 3 s = flaky
- e2e NE voit PAS : 404 réelle (fallback SPA = accueil HTTP 200) ; `<loc>` mort détecté via canonical seulement
- check-dist : `node scripts/check-dist.mjs [dir] [--warn]` ; scanne `dist/**` (`.js .mjs .json .css .html`) ; motif `/(?:https?:|wss?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?=[:/"'\x60]|$)/i` ; exit 1 si trouvé
  - sans `index.html` / dossier vide / absent → exit 1, même en `--warn`
  - motif nu `https?://localhost` = faux positif react-router (`let s="http://localhost"`) → exiger `[:/"'`]` ensuite
  - NON détectés : `"http://localhost"+":3001"` (concat), `localhost:3001` sans schéma, `http://localhost` sans port (exit 0, limite connue), hôtes `localhost.`, `*.localhost`, `127.0.0.2` (corrigés T028 : exit 1)
  - garde réel = valeur de `VITE_CHAT_API_URL` au build (deploy.yml)
- `npm run check:dist` à ajouter à `scripts/deploy-static.sh` (perso, humain) avant le rsync
- fichiers non suivis par git : diff par `git diff --no-index --stat <copie-avant> <fichier>`
- tests de casse du garde : fixtures `fake/<cas>/index.html` + `assets/*.js`, builds réels `VITE_CHAT_API_URL=http://localhost:3001`

## Pourquoi ça compte
- un garde-fou non cassé volontairement ne prouve rien (T018/T020/T025 en ont trouvé des trous)

## Où
- `scripts/check-dist.mjs`, `e2e/run.mjs` — non suivis (`git status ??`)
- `package.json` — scripts `build`, `check:dist`, `test:e2e`

## Voir aussi
- [[seagle-outillage-build]]
- [[playwright-getbyrole-sous-chaine]]
