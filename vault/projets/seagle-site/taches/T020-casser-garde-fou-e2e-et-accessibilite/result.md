---
tache: T020
statut: fait
verdict: DÉFAUTS
---
## Livré
- [D1] G2 — sitemap avec chemin inexistant (`/nexistepas`, `/produits/supprime`, `/en/xyz`) → fallback SPA = accueil (h1, title, canonical `https://seagle.io/`) → `✓ page` ×3, 7/7 OK ≠ échec attendu ; canonical jamais comparé au chemin — e2e/run.mjs:L48-49 — repro: `BASE=http://localhost:4173 SITEMAP=T020/sitemap-fantome.xml node e2e/run.mjs`
- [D2] G2 — reduce : `animate-[spin_3s_linear_infinite]` tourne sur `/services/security-audit`, `/de|es|it/services/security-audit` (4/109 pages) — règle limitée à marquee/pulse/bounce — src/style.css:L112-114 — repro: `RM=reduce EXTRA=<109 chemins> node T020/motion-extra.mjs` → `reduce total css infinies 4`
- [D3] G3 — check-dist faux négatifs sur build réel (2 fichiers contiennent l'URL, exit 0) : `HTTP://LOCALHOST:3001`, `http://0.0.0.0:3001`, `//localhost:3001` ; dossier factice aussi : `http://[::1]:3001`, `ws://localhost:3001`, `http://LocalHost:3001`, `.mjs`, `.json`, `A.JS` non scannés — motif sensible casse, schéma http(s) seul, hôtes 2 — scripts/check-dist.mjs:L19,L22 — repro: `VITE_CHAT_API_URL=http://0.0.0.0:3001 vite build <dépôt> --outDir T020/build-x` (cwd=T020) puis `node scripts/check-dist.mjs T020/build-x` → `dist OK`
- [D4] G3 — dossier vide ou sans .js/.html → `dist OK` exit 0 (aucun fichier scanné ≠ échec) — scripts/check-dist.mjs:L21-27 — repro: `node scripts/check-dist.mjs T020/fake/empty`
- [D5] G3 — sous-menu ouvert au survol, focus hors `li` → Échap sans effet (`aria-expanded true`, 8 liens) ; WCAG 1.4.13 KO ; préexistant — mega-menu.tsx:L83-87 — repro: `node T020/hover-esc.mjs`
- [D6] G3 — /rendez-vous : Entrée sur créneau → `document.activeElement = BODY` (bouton démonté) ; idem « Changer de créneau » ; Tab suivant OK — src/pages/Booking/index.tsx:369 — repro: `node T020/focus-slot.mjs`
- [D7] G3 — sitemap vide → `4/4 OK`, 0 page crawlée, exit 0 — e2e/run.mjs:L126 — repro: `SITEMAP=T020/sitemap-vide.xml node e2e/run.mjs`
- e2e non vide : copie dist cassée (:4520) → `/produits` rendu null → `✗ h1 absent` ; `/a-propos` chunk `throw` → `✗ pageerror casse T020 · h1 absent` ; 5/7 exit 1 OK
- T010 check-dist localhost → exit 1, 2 fichiers : OK · `--warn` → liste, exit 0 : OK · dist final `dist OK` : OK · e2e 113/113 : OK · `git diff --stat` 2 files 6+/2- : OK · `127.0.0.1` attrapé : OK
- T012 tsc=0 : OK · kbd count 10, seq0 skip, megaMenu 8 / tabNext « Application sur-mesure », noFocusStyle [], hiddenFocus [] : OK · extra {8,0,8}, drawer -1/"false"/mobile-drawer, drawerFermé [] : OK · shots (premierTab, menuÉchap, langueÉchap, tiroirÉchap inert) : OK · diff 9 fichiers : NV
- T013 tsc=0 : OK · verif-formulaires 2 thèmes valeurs identiques : OK · motion reduce 0/15 (+/la-joconde,/nuit-etoilee,/lab,/de) : OK · no-pref marquee bouge : OK · contrast 10 combos (≠16 déclaré ; op<1 = fondus, op=1 après défilement) : OK · canvas ASCII 6/6 = ascii-avant.json : OK
- clavier final `/` et `/de` : skip 1er Tab → Entrée → `#main`, Tab suivant ∈main ; Entrée/Espace/Échap/sortie Tab menu ; langue Échap focus bouton ; tiroir fermé 0/80 Tab, Échap → burger ; Échap langue dans tiroir ne ferme pas tiroir : OK ; 109/109 HTML : 1 `<main id="main">` + `href="#main"`
- formulaires `/rendez-vous`, `/de/book`, `/contact`, `/de/contact` : champs nommés, jours 31 nommés+aria-pressed, 409 `role=alert` traduit, réseau coupé `role=alert`, focus visible 0 manquant : OK
- contrastes recalculés : sombre lo/copy-faint .46 → 4.58/4.66/4.68 · copy-md 6.27 ; clair lo/copy-faint .58 → 4.71/4.81/4.57 · copy-md 6.24 ; `--th-text-md/faint` = HEAD (diff ∅ sur ces lignes) : OK
## Vérifié comment
`BASE=http://localhost:4173 npm run test:e2e` → `113/113 OK en 79.4 s` exit=0 (T020/e2e-4173.txt)
`node scripts/check-dist.mjs` → `dist OK`
`for d in fake/*: node scripts/check-dist.mjs` → c127/chtmlfull exit 1 ; c0000 cipv6 cmixed cupper cnoscheme cws cmjs cjson cUPPERJS cconcat cnoport chtml(`localhost:3001` sans schéma, URL relative inoffensive) → `dist OK`
builds réels ×4 (cwd T020) → localhost exit 1 ; HTTP://LOCALHOST, 0.0.0.0, //localhost → exit 0, `grep -ril` 2 fichiers chacun ; `md5sum dist/sitemap.xml` avant=après 85876b40…
`BASE=:4520 SITEMAP=sitemap-casse.xml node e2e/run.mjs` → `✗ page /produits — h1 absent` · `✗ page /a-propos — pageerror casse T020 · h1 absent` · 5/7 exit=1
`node page404.mjs /nexistepas` → `200 {"h1":"Optimisez votre quotidien…","can":"https://seagle.io/"}`
`node clavier.mjs` → T020/clavier.txt (fr+de) ; `audit.mjs kbd|extra`, `shots.mjs final kbd` (copies T012, BASE=4173) → kbd-final.json, extra-final.json, shots-final.txt
`node ratio.mjs` → tableau ci-dessus ; force-dark lo/copy-faint .40 → 3.77 (#0a0a0a)
`INK=… node ascii-sensib.mjs` → hash `/` change si `--th-text-md`/`--th-text-faint` modifiés, inchangé si `--th-copy-md`/`--th-text-lo` → test ASCII non vide, découplage OK
`node ascii-dom.mjs` (17 pages) → ∅ art ASCII DOM en text-md/faint
`node motion15.mjs` → reduce total 0 ; no-pref 9 (marquee, pulse, bounce) ; `node opfinal2.mjs` → op=1.000 après défilement
`node forms.mjs` → T020/forms.txt ; `node hover-esc.mjs` → `Échap (…focus body): true liens 8`
`node focus-slot.mjs` → `après Entrée: BODY[ALLER AU CONTENU…]`
`git status --short | wc -l` → 52 (= début) ; 0 écriture dépôt
## Écarts
- lecture hors WL: `rg VITE_CHAT_API_URL src` (Booking:15, Contact:19, ChatBot:6-9) — usage URL API
- lecture hors WL: vite.config.js:L19,L45-46 (grep) — sitemap écrit `cwd/dist`
- lecture hors WL: .github/workflows/deploy.yml:L30-40 — rejouer T010
- lecture hors WL: package.json L8,11-12 (grep) — scripts build/check
- lecture hors WL: `.env*` clés seules — VITE_CHAT_API_URL absent
## Pour la suite
- e2e : comparer canonical au chemin attendu (`https://seagle.io` + path) ; exiger ≥ 1 `<loc>` (D1, D7)
- check-dist : motif `/(?:https?:|wss?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?=[:/"'\x60]|$)/i`, extensions `.mjs/.json` ; dossier sans fichier → échec (D3, D4)
- reduce : couvrir `[class*=animate-]` ou `*{animation-iteration-count:1}` (D2) ; Échap global sur menu survolé (D5) ; focus vers formulaire après choix créneau (D6)
- tiroir mobile 390×844 : `scrollHeight 454 > client 383`, Langue 455-485 / CTA 446-494 sous le bas 448 → inaccessibles au toucher (préexistant, header.tsx:258)
- accents ServiceDetail sur `surface-hi` #e9e7e1 → 4.17-4.21 (non observé) ; aria-label « Toggle theme/menu » anglais en fr/de
## Retour sur le pack
- Manquait: `npx vite build --outDir` depuis le dépôt écrase `dist/sitemap.xml` partagé (vite.config.js:L45 `cwd/dist`) → lancer avec cwd=artefact | Inutile: ∅
