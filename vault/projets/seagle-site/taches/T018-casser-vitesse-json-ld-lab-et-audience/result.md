---
tache: T018
statut: fait
verdict: DÉFAUTS
---
## Livré
- [D1] G2 — chunk locale fr en échec (`page.route` abort index-wrQ7AnnA.js) sur `/` → `#root` vidé (innerText 0, h1 ∅), pageerror `g.map is not a function` ; HTML prérendu détruit au lieu d'être gardé — src/lib/i18n.ts:33 (`cb(err)` puis render quand même) + src/pages/Home/index.tsx:61 (`t(…chips,{returnObjects}).map` sur clé brute) ; idem `/de/products/` si de+fr abort (`o.map`) — repro: `node …/T018/t006.mjs` lignes « abort fr », « abort de+fr »
- [D2] G3 — localStorage `i18nextLng=xx` → JSON-LD WebSite de `/` émet `"inLanguage":"xx"` après hydratation — src/lib/i18n.ts:22 (langue sauvée non validée) → Home `inLanguage = i18n.language` — repro: `node …/T018/t008.mjs` dernière ligne
- [D3] G3 — localStorage `i18nextLng=""` + navigateur `de-DE` → page `fr` (HEAD : `de`) — src/lib/i18n.ts:22 `savedLanguage ??` (HEAD `||`), `""` non nullish — repro: `node …/T018/lsempty.mjs`
- [D4] G3 — 3 clics onglets en 156 ms (/agentx 1440 et 390) → board.webm 959066 o + ops.webm 613907 o téléchargés en entier, affichés < 100 ms ; 1 seule vidéo joue (DoD OK) — src/pages/AgentX/index.tsx:41-43 (play dès intersection, pas d'abandon) — repro: `node …/T018/t007.mjs`
- obs. (DoD « comportement observé ») : abort chunk de seul sur `/de/products/` → texte FR sous `<html lang="de">`, 0 pageerror ; abort en sur `/about/` → FR sous `lang="en"`
- T006 entrée ≤ 470 000 : OK (464860 / 151997 gz ; déclaré 461313/150901, build plus récent)
- T006 chunks par langue fr→fr · de→de,fr · en→en,fr : OK
- T006 HTML prérendu traduit /de/products /about /de /es /it /de/lab : OK, clés brutes 0
- T006 `ls=xx` / `ls=""` / `de-CH` / nav ja : rendu OK, pageerror 0
- T007 390×844 → 0 o vidéo : OK · 1440 → room.webm 855225 : OK · RM 390/1440 + défilement + clic onglet → 0 o : OK
- T008 HTML prérendu (fetch) / /a-propos /contact /produits : 2 ld+json, parse OK, @type attendu : OK
- T008 /services/ : KO connu (T008 Écarts) — `dist/services/index.html` ∅ → fallback racine, WebSite + canonical `/`
- T008 /carrieres → 0 page-jsonld : OK (prérendu + client)
- T008 hydratation + nav client a-propos→contact→carrieres→produits→/→a-propos + 3×back + lab + la-joconde : toujours ≤ 1 `#page-jsonld`, jamais périmé : OK
- T008 URLs JSON-LD → toutes ont un `index.html` ou fichier dans dist : OK
- T009 dist/lab/index.html h1 « Quatre tableaux… » ; /de/lab /es/lab h1 traduit ; 4 liens fr + 4 de prérendus (fichiers) et 200 ; footer Lab ; sitemap /lab ×4 langues : OK
- T017 /lab 1440 → 4 cartes 2 rangées, h2 0 ; 390 → 4 rangées : OK · /la-joconde /nuit-etoilee /de/mona-lisa → 3 cartes 1 rangée + h2 nav : OK
- T011 `rg -c seagle-analytics dist` → exit 1 : OK · 8 pages : tiers = fonts.googleapis.com seul (+ api.seagle.io 1st-party /rendez-vous) : OK
## Vérifié comment
wc -c dist/assets/index-CG-KFRmw.js → 464860 ; gzip -c | wc -c → 151997
node html-text.mjs de/products/index.html … → de/products h1="Die Software, die wir entwickeln." rawKeys=∅ ; about h1="Why Seagle?" ; de/lab h1="Vier Gemälde. In Zeichen geschrieben."
node t006.mjs → abort fr / {"h1":"","rootLen":0} pageerror=1 g.map is not a function
node t006.mjs → abort de+fr /de/products/ {"h1":"","rootLen":0} pageerror=1 o.map is not a function
node t006.mjs → abort de /de/products/ {"h1":"Les logiciels que nous éditons.","lang":"de"} pageerror=0
node t006.mjs → ls=xx / h1="Optimisez…" lang=fr pageerror=0 ; ls=empty idem
node lsempty.mjs → ls="" nav=de-DE ['fr','Optimisez…','fr'] ; ls=null nav=de-DE ['de','KI & Web…','de']
node ld.mjs / /a-propos/ /contact/ /produits/ /services/ /carrieres/ → page-jsonld:OK WebSite|AboutPage|ContactPage|ItemList|WebSite(canon /)|∅
node t008.mjs → chaque étape pageJsonld ∈ {0,1}, type = page courante ; pageerror=0
node t008.mjs (ls=xx) → {"@type":"WebSite",…,"inLanguage":"xx",…}
node t007.mjs → 390x844 load+4s vids=[] ; 1440 idle 22s vids=["room.webm:855225"]
node t007.mjs → 1440 3 clicks in 156ms → playing=1 vids=["room.webm:855225","board.webm:959066","ops.webm:613907"]
node t007.mjs → RM 390 vids=[] ; RM 1440 vids=[]
node lab.mjs → /lab/ 1440 cardRows=2 cards=4 h2=[] ; /la-joconde/ cards=3 cardRows=1 ; pageerror=0 ×7
node t011.mjs → 8 pages 3rd-party={"fonts.googleapis.com":1} analytics=0 pageerror=0
rg -c seagle-analytics dist → exit 1
curl :4173/de/products | md5sum → = dist/index.html (fallback) ; /de/products/ → = dist/de/products/index.html
scripts : vault/artefacts/seagle-site/T018/{t006,t007,t008,t011,lab,lsempty,html-text,ld}.mjs
## Écarts
- lecture hors WL: `grep returnObjects src --include=*.tsx` — localiser source du `.map` (D1)
- lecture hors WL: `git diff -- src/lib/i18n.ts` + `git show HEAD:src/pages/Home` — origine `??` (D3)
- piège outillage : `click({force:true})` sur onglet AgentX défilé → clic intercepté par lien /contact superposé ; repris en clic réel
## Pour la suite
- D1 : i18nReady en échec de locale → garder le HTML prérendu (pas de render) ou ErrorBoundary + `Array.isArray` sur `returnObjects`
- D2+D3 : i18n.ts:22 filtrer `savedLanguage` par SUPPORTED_LANGUAGES, `||` au lieu de `??`
- D4 : onglets AgentX — retarder play (~300 ms) ou `removeAttribute("src")+load()` au démontage
- pages FR (index.html, a-propos) ne preload pas le chunk fr (de/* preload de+fr) → cascade entrée→fr
- `vite preview` sans `/` final sert la racine FR : vérifier la réécriture `/x`→`/x/index.html` côté hébergeur (T019)
## Retour sur le pack
- Manquait: `/en` n'existe pas (EN = /about…, accueil EN sans URL) ; tests HTTP exigent `/` final sur :4173 | Inutile: ∅
