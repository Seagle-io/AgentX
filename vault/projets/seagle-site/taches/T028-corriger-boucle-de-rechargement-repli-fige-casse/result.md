---
tache: T028
statut: fait
---
## Livré
- src/main.tsx:8-15 — `reloadOnce` : clé unique `reloaded:boot` = adresse rechargée, preload + locale
- src/main.tsx:20-25 — purge `reloaded:boot` après render, sauf même adresse ; purge load+5 s supprimée
- src/main.tsx:26-31 — échec langue → reloadOnce + `html.boot-failed`
- src/style.css:116-124 — `.boot-failed` : opacity 0 + masque translateY → état final
- src/App.tsx:91-96 — redirection minuscules sur chemin décodé (try/catch → brut)
- scripts/check-dist.mjs:23-27 — motif : `localhost.`, `*.localhost`, 127/8
```
const LOCAL = /(?:https?:|wss?:)?\/\/((?:[\w-]+\.)*localhost\.?|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])[:/]/i
```
## Vérifié comment
build cwd=T028 `vite build <repo> --outDir T028/dist` → exit 0 ; dist/sitemap.xml md5 85876b40… avant = après
D2/D1/D5 servis par T028/pre = copie de dist/ prérendu + assets T028 (entrée/CSS réécrits), preview :4428 (pid tué)
`node loop.mjs / index-wrQ7AnnA.js 7000 40000` → `loads=2 req@0.1 load@0.2 load@11.2 req@11.2` ; 2000 25000 → `loads=2`
`node dbl.mjs` → `/DE docs=2 /DE [] → /de ["reloaded:boot"]` · `/IT/ docs=2` · `/de/ docs=2`
`node d2.mjs` (chunk coupé + défilement complet) → `/ op0 0 masked []` · `/it/ 0 []` · `/a-propos/ 0 []` · `/de/products/ 0 []`, `boot-failed`, react false
`node shot-fallback.mjs` → `vis:Un besoin, une expertise. | vis:Huit métiers complémentai | vis:01 Applications…` ; capture T028/fallback-abort-fr-huit-metiers.png
`node case.mjs` → `/%44E/products → /de/products lang=de canon=/de/products` · `/a-propo%53 → /a-propos canon=/a-propos` · 18 chemins, 0 `(+idle!)`, 16 cas valides identiques à T027 ; `/de/über` 1 nav de moins
`node extra.mjs` → normal `/ /de /es /it` react=true lang ok ; `once-fr loads=2 react=true` ; `persist-fr loads=2 boot-failed hidden 0` ; `persist-page-about loads=2` (borné)
`node en.mjs` → `/about lang=en react=true h1 "Why Seagle?"`
`node purge.mjs` → après échec unique `[["reloaded:boot","/"]]` → montage /a-propos `[]`
check-dist build-127.0.0.2 / api.localhost / localhost.:3001 → exit 1 ×3 ; build-http://localhost → exit 0 ; repo dist/ → `dist OK` exit 0 ; T028/dist → `dist OK`
`npx tsc --noEmit -p .` → tsc=0
`git diff --stat -- src/main.tsx src/App.tsx src/style.css` → 3 fichiers (cumul T023+ et autres agents) ; check-dist.mjs non suivi
## Écarts
- DoD D1 « purge reloaded:* après render » : purge de `reloaded:boot` seulement, conditionnelle — purge immédiate = boucle si chunk de page toujours absent (garde page purgée avant échec)
- clés `reloaded:<pathname>` (page()) plus purgées en session — once/adresse/session
- `reloaded:boot` gardée si montage à l'adresse rechargée — purgée au prochain montage ailleurs
- D2 sélecteur `opacity: 0;` (point-virgule) — `opacity: 0` toucherait 37 `opacity: 0.14` ; + `[style^="transform: translateY("]` (h1/h2 masqués, 66-110 %) + `filter: none` (blur figé)
- D4 build-http___localhost_ (sans port) → exit 0 = limite T025 déclarée, non visée
- non-régr. `/en` locale fr-FR → `/` fr (redirect i18n, hors périmètre) ; en vérifié sur /about
- arbre partagé : style.css modifié par un autre agent pendant la tâche, inclus dans le build
## Pour la suite
- reload post-montage d'un chunk non-page (DitherBackdrop, AsciiField…) : garde boot si adresse ≠ ; sinon pas d'error boundary → page blanche (préexistant)
- purge propre des gardes page : `page()` `.then` removeItem(`reloaded:<pathname>`) — décision « page() inchangée » à rouvrir
- prérendu : figer l'état final des animations à la capture rendrait `.boot-failed` CSS inutile
- index.html : repli si l'entrée JS elle-même échoue → pas de `.boot-failed` (main.tsx jamais exécuté)
- T028/pre (34 Mo) = copie de dist/ réutilisable pour vérif repli ; supprimable
## Retour sur le pack
- Manquait: scripts T027 codés en dur sur :4173 (copiés, BASE=:4428) ; conflit purge reloaded:* × garde page() non signalé | Inutile: ∅
