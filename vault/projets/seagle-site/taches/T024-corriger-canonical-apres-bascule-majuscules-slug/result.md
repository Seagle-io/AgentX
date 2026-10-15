---
tache: T024
statut: fait
---
## Livré
- src/hooks/usePageMeta.ts:2,15-16,36,61 — pathname via useLocation, dans les deps (D1)
- src/hooks/useLanguageRedirect.ts:4,23-40 — `!match` + bascule → préfixe de langue remplacé (D3)
- src/App.tsx:81,91-93 — pathname avec majuscules → `<Navigate>` minuscules replace, query+hash conservés (D2)
- règle D3 : slug inconnu → même chemin, préfixe remplacé (`/de/services/inconnu`+fr → `/services/inconnu` ; +it → `/it/services/inconnu`) ; sans bascule ∅ changement
- prevLangRef calculé avant le match — même sémantique qu'avant
## Vérifié comment
npx tsc --noEmit -p . → exit=0
cwd=T024 : vite build <repo> --outDir T024/dist --emptyOutDir → `✓ built in 5.61s` `Sitemap généré — 109 pages` ; dist/sitemap.xml partagé mtime 19:25:27 inchangé
preview :4424 (SPA, sans prérendu) ; scripts T019 copiés dans T024/, lib.mjs B=:4424
node t4-toggle.mjs → 30/30 OK, canon = URL courante ; back seq inchangé, idle+ 0 ; `t4 KO 0`
node t24-d123.mjs (canon + og:url) → `t24 KO 0` :
  /DE/products→/de/products de canon+og /de/products hl=6 · /De→/de de · /PRODUITS→/produits fr
  /DE/Contact?X=1#F→/de/contact?X=1#F · /IT/Services/Data-Analyse→/it/services/data-analyse it
  /DE/products+fr→/produits fr · /de/services/inconnu+fr→/services/inconnu fr · +it→/it/services/inconnu it · +en→/services/inconnu en
  /services/inconnu+de→/de/services/inconnu de · /es/services/inconnu?q=1#h+de→/de/services/inconnu?q=1#h · /a-propos+de→/de/about · /de+fr→/
node t1-headurls.mjs → `headurls 68 checked, KO 0`
node t3-nav.mjs → `t3 KO 0`
node t7-race.mjs → rapide /es/about es ; shared hist idle+ 0 (= T019)
node t5-edges.mjs → = T019 sauf : /DE/products→/de/products de canon /de/products hl=6 ; /De→/de de ; inconnu+fr→/services/inconnu fr ; `/`+ls de-DE→/ fr (T019 : /de) — cf. Écarts
prérendu → NV — prérendu réservé au chef
preview tué par pid (3068585) ; :4424 libre ; :4173 intouché
## Écarts
- lecture hors WL: git diff src/lib/i18n.ts — attribuer `/`+ls de-DE→fr
- `/`+ls `de-DE`→/ fr ≠ T019 (/de) : i18n.ts (T023) `supported(savedLanguage)` rejette `de-DE` ; ∅ lien avec T024
- builds lancés binaire `node_modules/.bin/vite <repo>` cwd=T024 (≠ `npx vite build`) — protège dist/sitemap.xml partagé
- T024/node_modules/.cache créé par le build → supprimé
## Pour la suite
- T023 i18n.ts : `supported()` exact → ls `de-DE` ignoré ; utiliser toLocale/slice(0,2) si voulu
- i18n.ts:23 langFromPath sensible casse → /DE/* démarre en langue stockée puis bascule (1 rendu) ; acceptable
- slug inconnu (/services/inconnu) : titre en clé brute toujours (hors périmètre), hl=0, canonical posé
- e2e : t24-d123.mjs (T024/) couvre D1-D3 avec og:url
## Retour sur le pack
- Manquait: `npx vite build` cwd=repo écrase dist/sitemap.xml → donner la commande cwd=artefact avec root positionnel
- Inutile: ∅
