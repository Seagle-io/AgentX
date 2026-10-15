---
tache: T019
statut: fait
verdict: DÉFAUTS
---
## Livré
- [D1] G3 — sélecteur de langue sur toute page → URL changée, `link[rel=canonical]` + `og:url` restent l'ancienne URL (23/30 cas : /de→fr canon=/de ; /a-propos→de canon=/a-propos ; /de/contact?x=1#f→it canon=/de/contact) — src/hooks/usePageMeta.ts:32,57 deps `[title,description,image]` ∌ pathname, effet joue avant navigate — préexistant HEAD:56 (fr↔en), désormais 4 cibles/page ; prérendu ∅ impact (chargement direct, 109/109 OK) — repro: `node …/artefacts/seagle-site/T019/t4-toggle.mjs`
- [D2] G3 — `/DE/products`, `/De` → React Router (insensible casse) rend Products/Home en fr, lang=fr, canon=/DE/products, hreflang 0 ; matchRoute/langFromPath sensibles casse → null — src/lib/routes.ts:45,57 — repro: `node …/T019/t5-edges.mjs` (lignes "/DE/products", "/De")
- [D3] G3 — `/de/services/inconnu` + sélecteur fr → URL reste /de/services/inconnu, lang=fr (URL /de ≠ langue) ; rechargement → de — src/hooks/useLanguageRedirect.ts:25 `!match` → return — repro: t5-edges.mjs ligne `{"toggle":"fr"}`
- T014 matchRoute ×10 exemples → OK (identiques) ; getLocalizedPath en-US/about=/about, undefined/products=/produits → OK
- T014 indexedPages 109, dups 0, "/" dernier → OK
- T014 tsc exit 0 → OK
- T014 e2e (de/it/es, toggle fr→/produits, /+de→/de, /contact+de→/de/contact, /de/xyz→/de, /de/services→built-application, historique) → OK (rejoué via t4/t5/t7 sur :4173)
- T015 109 `<loc>`, hreflang /de/products 6, /contact 5 ∅en, lang de/de_DE/canon /de/products → OK
- T015 check-dist → `dist OK` OK ; prérendu html[lang]/canon 109/109 → OK
- T016 rg ×2 → ∅ OK ; tsc OK ; menu/footer/tiroir /de → OK ; force-dark /nuit-etoilee,/de/starry-night=oui /de=non → OK
- T016 KO /de Home 9 liens `/services/<slug>` → corrigé (T022) : tiroir+contenu /de 8 liens `/de/services/*` cliqués → /de + de
- DoD2 URLs fr/en HEAD : 34 URLs × navigator fr-FR/en-US = 68 → 68 OK (URL finale = demandée sauf /services→/services/built-application comme HEAD, langue html+texte attendue, 0 pageerror)
- DoD3 sitemap : 109 loc, 109 fichiers, 0 hreflang→absent, 0 non réciproque, HTML↔sitemap hreflang+canonical 0 écart → OK
- DoD5 nav /de : 29 desktop (4 menus+header+footer) + 19 tiroir/mobile → 48 OK (URL /de…, lang de, og de_DE, texte de) ; sélecteur 6 pages × 5 langues → URL+langue OK 30/30 (KO = canonical seul, D1) ; retour ×3 → it/it, fr/fr, de/de, 0 nav au repos, 0 boucle
- DoD6 bords : voir Vérifié ; 0 écran blanc ; query+hash conservés (/de/contact?x=1#f, /contact?x=1#f+de→/de/contact?x=1#f)
## Vérifié comment
node T019/sitemap.mjs dist → `loc 109 uniq 109 · missing files [] · hreflang→absent 0 · non-reciprocal 0 · self missing 0 · html≠sitemap 0`
node T019/t2-static.mjs (curl :4173 `<p>/`) → `static 109 KO 0` ; /es es es_ES · /it/services/data-analyse it it_IT ∅en · /de/lab de ∅en · /about en en_US 6hl · /contact fr 5hl ∅en
node T019/t1-headurls.mjs → `headurls 68 checked, KO 0`
node T019/t3-nav.mjs → `t3 KO 0` (navs=3 = 2 chargement + 1 clic ; /de/services → 4)
node T019/t4-toggle.mjs → toggles URL/lang 30/30 ; `back seq /it/products[it/it] ← /it/contact[it/it] ← /a-propos[fr/fr] ← /de[de/de] ← blank` idle+ 0
node T019/t5-edges.mjs → `/de/`→/de/ de · `/de/produits`→/de · `/de//products`→/de · `/de/lab/x`,`/de/docs`,`/de/preview`→/de · `/fr`,`/en`,`/en/products`→/ fr · `/de/services/inconnu`→« Leistung nicht gefunden. » de · `/es/services`→/es/services/built-application · `/`+ls de→/de · `/`+nav de-AT→/de · `/`+ls xx→/ fr · `/`+ls de-DE→/de · `/es/about`+ls en→es · `/produits`+ls de→fr
node T019/t7-race.mjs → fr→de→it→en→es rapide → /es/about es ; /contact→/produits→toggle de→back → /de/contact (replace), idle+ 0
rg -n '(to|href)(=|: ?)"/[a-z]' src -g '!src/pages/Lab*/**' → rc=1 ; rg -n 'pathname\.(match|startsWith)' src → rc=1
rg chemins littéraux élargi (templates, `navigate(\``) → App.tsx:108 (fallback `/${lang}`, légitime) seul
npx tsc --noEmit -p . → exit 0 ; node scripts/check-dist.mjs → dist OK
## Écarts
- lecture hors WL: src/App.tsx (+ HEAD) — routes Navigate/fallback, D2
- lecture hors WL: src/main.tsx (grep createRoot) — render ≠ hydrate
- lecture hors WL: docs/deploiement.md (rg try_files) — comportement prod sans slash
- lecture hors WL: src/hooks/usePageMeta.ts (+ HEAD) — cause D1
- lecture hors WL: git show HEAD:src/lib/routes.ts, useLanguageRedirect.ts — base DoD2 (prévue par pack)
- :4173 `vite preview` sert dist/index.html (« / » fr, canon /) pour `/de/products` sans « / » final ; prérendu servi seulement avec « / » ; prod nginx `try_files $uri $uri/index.html` (deploiement.md:20) → ∅ défaut, NV sur serveur réel
## Pour la suite
- D1 usePageMeta.ts:57 : ajouter pathname (useLocation) aux deps
- D2 routes.ts:45,57 : matchRoute insensible casse ou Route `caseSensitive` / redirection minuscule
- D3 useLanguageRedirect.ts:25 : !match + seg préfixé + toggle → navigate pathFor(home) ou garder langue URL
- préexistant hors T014-16 : /services/inconnu → document.title = `ServiceDetail.meta.inconnu.title` (clé brute)
- e2e futurs contre :4173 : curl avec « / » final, sinon HTML prérendu ≠ page
## Retour sur le pack
- Manquait: usePageMeta.ts + App.tsx en L (cause D1/D2) ; :4173 ≠ nginx sur « / » final
- Inutile: ∅
