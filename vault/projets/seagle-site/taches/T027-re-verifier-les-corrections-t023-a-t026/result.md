---
tache: T027
statut: fait
verdict: DÉFAUTS
---
## Livré
- [D1] G2 — chunk locale qui échoue > 5 s après `load` (réseau lent, 504 tardif) → rechargement infini, 1 toutes les ~7 s (6 loads/40 s) ≠ « 1 reload » ; purge `reloaded:*` à load+5 s s'exécute avant le rejet — src/main.tsx:15-16 (purge) × :27-28 (garde) — repro: `cd T027 && node loop.mjs / index-wrQ7AnnA.js 7000 40000` → `loads=6 load@0.2 load@7.3 … load@35.7` ; échec à 2 s → `loads=2` (OK)
- [D2] G3 — repli HTML prérendu (chunk fr KO persistant, `/`) → section Expertises vide : h2 « Un besoin, une expertise. » (translateY 110 %), « Huit métiers… », liste services à opacity 0 ; 20 blocs texte invisibles après défilement complet (montage normal : 2) ; idem /it/ 20, /a-propos/ 4, /de/products/ 1 — dist/index.html : 32 `style="opacity: 0…"` figés par le prérendu — repro: `node T027/d1.mjs` (hiddenTxt) + `node T027/shot-fallback.mjs` → T027/fallback-abort-fr-huit-metiers.png
- [D3] G3 — majuscule encodée contourne la redirection minuscules : `/%44E/products` → URL /%44e/products, lang=fr, h1 Products FR, canonical /%44e/products ; `/a-propo%53` → page À propos, canonical /a-propo%53, 0 redirection (= T019 D2 par encodage) — src/App.tsx:93 compare le chemin brut, router décode + ignore la casse — repro: `node T027/case.mjs`
- [D4] G3 — check-dist laisse passer des URL de serveur local réelles (vrai build, VITE_CHAT_API_URL) : `http://localhost.:3001`, `http://127.0.0.2:3001`, `http://api.localhost:3001` → `dist OK` exit 0 (2 fichiers contiennent l'URL chacun) ; `http://localhost` sans port → exit 0 (limite déclarée T025) — scripts/check-dist.mjs:26 — repro: cwd=T027 `VITE_CHAT_API_URL=<u> <repo>/node_modules/.bin/vite build <repo> --outDir T027/build-<u>` puis `node scripts/check-dist.mjs T027/build-<u>` → T027/build-*.check
- [D5] G3 — `/DE` ou `/IT/` + chunk de/it coupé → 2 rechargements successifs (preload puis locale) ≠ 1 ; `/de/` → 1 ; borné, 0 boucle — src/main.tsx:10-11 + :27-28 — repro: `node T027/dbl.mjs` → `/DE docs=3 /DE [] → /de ["reloaded:preload"] → /de [… "reloaded:locale"]`
- T018 D1 abort fr `/`, de `/de/products/`, de+fr, en `/about/` → HTML prérendu gardé (h1 réel, React non monté), 1 reload, pageerror 0 : OK (hors D1/D2 ci-dessus)
- T018 D1 échec unique (1er abort puis OK) → reload puis React monté, pageerror 0 : OK
- T018 D2/D3 `i18nextLng` de-DE→de · DE→de · it-CH→it · xx→fr (nav fr) / de (nav de) / fr (nav ja) · ""→de (nav de-DE) / en (nav en-US) · Es-mx→es · EN→en ; html lang + texte + JSON-LD inLanguage = attendu, ls normalisé : OK 26/26
- T019 D1 sélecteur 30/30 canonical = URL : OK · D2 /DE/products→/de/products de canon /de/products hl=6, /De→/de : OK · D3 /de/services/inconnu+fr→/services/inconnu fr : OK
- minuscules : 0 boucle (18 chemins, idle+ 0), query+hash gardés (/DE/Contact?X=1#F→/de/contact?X=1#F), `/`, `/?Q=A#H`, `/#Main` intacts : OK ; non-ASCII `/de/über` → hex minuscule puis /de (1 nav de plus) : obs.
- T020 D1 sitemap fantôme → 4/7 exit 1 · D7 vide → `✗ aucun <loc>` exit 1 · slug mort `/services/supprime` → `✗ h1 absent` : OK
- T020 D2 reduce 109 pages → `total css infinies 0`, marquee fixe : OK
- T020 D3 builds T020 ×4 → exit 1 ; fixtures + index.html vide : 12/15 exit 1, cconcat/cnoport/chtml exit 0 (= limites T025) : OK · D4 dossier vide/absent → exit 1 : OK
- T020 D5 survol+Échap → aria-expanded false, 0 lien : OK · D6 Entrée créneau → INPUT[Nom], « Changer de créneau » → BUTTON[10:00] : OK
- tiroir 390×844 client 454 = scroll 454, Langue 455-485 + CTA visibles : OK
- check-dist dist/ → `dist OK` exit 0 : OK · e2e → 113/113 exit 0 : OK
- croisé T023×T024 `/DE` /DE/ /DE/products /De/Products/ /IT/ /DE?x=1#h + chunk coupé → loads ≤ 3 en 15 s, 0 boucle, pageerror 0 : OK (hors D5)
- reduce : canvas ASCII 6 pages non vides, ∅ ancêtre `animate-`, animationName none (statiques en reduce, animés en no-pref) ; mega-menu 8 liens op 1, langue 5, tiroir op 1 : OK
- Booking 390×844 : tap 10:00 → scrollY 1031→1165→880 (2 sauts instantanés ~400 ms), Nom 377-430 dans l'écran, récap créneau @200 : OK (capture T027/booking-390x844-apres.png) ; 390×600 récap @-73 hors écran : obs.
## Vérifié comment
node t006.mjs → abort fr / h1 « Optimisez… » pageerror 0 ; `mounted` inutilisable (prérendu contient class="app-mounted") → d1.mjs sonde `__reactContainer`
node d1.mjs → abort fr persist {"react":false,"hiddenTxt":20} docs=2 ; once {"react":true,"hiddenTxt":2} docs=3 ; ok fr hiddenTxt 2
node loop.mjs / index-wrQ7AnnA.js 7000 40000 → loads=6 ; 2000 25000 → loads=2
node lsvals.mjs → 26 lignes OK, 4 obs (`"  de"`, `de_DE` → fr)
node t4-toggle.mjs → `t4 KO 0` ; t5-edges.mjs → voir Livré ; t1 → `headurls 68 checked, KO 0` ; t3 → `t3 KO 0` ; t7 idle+ 0 ; sitemap.mjs → 0 écart ; t2-static → `static 109 KO 0`
node case.mjs → 18 chemins, 0 `(+idle!)`
node cross.mjs / dbl.mjs → voir D5
BASE=:4173 SITEMAP=T020/sitemap-{fantome,vide}.xml + T027/sitemap-mort.xml node e2e/run.mjs → exit 1 ×3
BASE=http://localhost:4173 npm run test:e2e → `113/113 OK en 86.5 s` exit=0 (T027/e2e-4173.txt)
RM=reduce EXTRA=<109 loc> node motion-extra.mjs → `reduce total css infinies 0`
node hover-esc.mjs · focus-slot.mjs · drawer.mjs · rm.mjs · booking.mjs / booking2.mjs → sorties T027/*.out
md5sum dist/sitemap.xml avant=après 85876b40… ; `git status --short | wc -l` → 52 (= début) ; T027/node_modules supprimé
## Écarts
- lecture hors WL: `grep -n src/main.tsx` (reloaded, load, setTimeout) — lignes D1/D5
- lecture hors WL: `grep -n toLowerCase src/App.tsx` — ligne D3
- lecture hors WL: dist/assets/index-sYrxi1OL.js (grep reloaded) — dans dist/ (WL), logique avant src
- builds annexes vite cwd=T027 : exit 1 sur écriture `T027/dist/sitemap.xml` (dossier absent) après bundle complet → bundle exploitable, dist/ partagé intact
## Pour la suite
- D1 main.tsx : purge `reloaded:*` après montage React réussi (dans `.then`) au lieu de load+5 s
- D2 prérendu : figer l'état final des animations (opacity 1/transform none) dans le HTML capturé, ou CSS `html:not(.js-ready) [style*="opacity: 0"]{opacity:1}`
- D3 App.tsx:93 : comparer `decodeURIComponent(pathname)` ou routes `caseSensitive`
- D4 check-dist : `localhost\.?`, `[\w.-]*\.localhost`, `127(\.\d+){3}`
- D5 : clé de reload unique partagée preload/locale
## Retour sur le pack
- Manquait: `class="app-mounted"` figé dans le HTML prérendu (sonde « mounted » T023 fausse sur :4173) ; hashes chunks locale | Inutile: ∅
