---
tache: T001
statut: fait
---
## Livré
Unités : 1 Ko = 1000 o ; « min » = esbuild minify isolé (estimation) ; gz = gzip -c.
### Chunk d'entrée
- dist/index.html:78 — `<script type=module src=/assets/index-BZy5-XuT.js>` ; 924 268 o brut / 308 490 gz
- dist/index.html:79 — CSS index-B8SbyGdZ.css 156 244 o, bloquant
- dist/index.html:80 — 12 `modulepreload` (11 deps Home + entry)
- dist/index.html — 160 095 o, HTML prérendu
### Composition (esbuild --bundle --minify --charset=utf8 par import ; script artefacts/seagle-site/T001/measure.sh)
| # | contributeur | brut Ko | gz Ko | part brut |
|---|---|---|---|---|
| 1 | 5 locales (fr+en+es+de+it) | 464,6 | 158,5 | 50 % |
| 2 | motion/react (MotionConfig, motion, AnimatePresence, hooks) | 145,2 | 48,5 | 16 % |
| 3 | react-dom/client (+react 7,4) | 142,1 | 45,5 | 15 % |
| 4 | i18next + react-i18next | 62,6 | 20,8 | 7 % |
| 5 | react-router (BrowserRouter, Routes, Link…) | 49,7 | 17,8 | 5 % |
| 6 | lenis | 18,6 | 5,4 | 2 % |
| 7 | lucide (28 icônes header+footer) | 16,9 | 6,4 | 2 % |
| 8 | résiduel app (Header, mega-menu, footer, AsciiCurtain, ThemeContext, hooks, routes, kora-logo) | ≈25 | ≈5 | ≈3 % |
- react compté ~4× dans 2-5 ; somme 899,7 vs réel 924,3
- ∅ dans l'entry : three, react-markdown, remixicon, simple-icons (→ index-2ySFHq9N), ChatBot
### Imports statiques
- src/main.tsx:1-2 — fontsource mona-sans + jetbrains-mono (CSS)
- src/main.tsx:3 — react-dom/client
- src/main.tsx:6 — `import "./lib/i18n"`
- src/lib/i18n.ts:3-7 — import statique fr,en,es,de,it
- src/lib/i18n.ts — `resources` 5 langues dans ns `common`, fallbackLng fr
- src/App.tsx:4 — `Layout` statique (Header, Footer, Lenis, motion, curtain)
- src/App.tsx:8 — ThemeProvider (flushSync react-dom)
- src/components/Header/layout.tsx:3 — `MotionConfig` de motion/react
- src/components/Header/layout.tsx:4 — `import Lenis from "lenis"`
- src/components/Header/layout.tsx:8 — AsciiCurtain statique
- src/components/Header/header.tsx:7 — 27 icônes lucide
- src/components/Header/header.tsx:6,8,10,37 — ToogleLanguage, mega-menu, get-started-button, kora-logo
- src/components/Header/footer.tsx:3 — lucide ArrowUp
### Traductions
- src/lib/local/{es,de,it}/index.ts:25,29 — `import fr from "../fr"` + `...fr` (fusion fallback) ; en ∅ import fr
- fr seul 98,2 Ko min / 33,5 gz ; en 88,6 / 31,1 ; es +92,7 ; de +93,5 ; it +91,5 (net du fr partagé) ; total 464,6 / 158,5 gz
- sources `du -sb` (dir 4096 inclus) : fr 111 279 · en 101 740 · es 104 891 · de 105 668 · it 103 709
- fr/ServiceDetail.ts — 20 051 o, plus gros ; page lazy mais bundlé dans l'entry
- fr/index.ts:1-25 — 25 modules, tous chargés quelle que soit la route
- code mort : Orbit+Lab+RubberBuddy ≈ 7,4 Ko src, 5 langues ; routes commentées dans App.tsx `routeConfig`
- fr/index.ts = 54 l. (> 40) non recopié
### Composants lourds sur toutes les pages
- src/components/Header/header.tsx — 12 806 o src ; mega-menu.tsx 6 912 ; ToogleLanguage.tsx 3 300
- src/components/Header/footer.tsx — 6 462 o src ; AsciiCurtain.tsx 3 108
- src/components/ChatBot/index.tsx — 5 348 o src ; seul importeur src/pages/Contact/index.tsx ; ∅ dans entry
- fond animé : `dither-backdrop` lazy (src/pages/AgentX/index.tsx:15) ; chunk 791 o
### Chunks de référence
- three-B9Abx5bY.js 445 657 o (vite.config.js manualChunks) ; ∅ chargé sur /agentx
- Home = index-LJeUymrF.js 18 203 o ; simple-icons = index-2ySFHq9N.js 43 139 o (gz 18 669) ; AgentX = index-D7S3xdIX.js 12 585 o
### Prérendu : modulepreload inutiles
- dist/agentx/index.html — préload = 11 deps Home + AsciiField + D7S3xdIX + useJsonLd + dither-backdrop
- dist/contact/index.html — préload = 11 deps Home + AsciiField + Contact (cvFupPKG, mail, send, clock) + dither
- inutiles sur /agentx (Home-only) : index-LJeUymrF 18 203 · index-2ySFHq9N 43 139 · visuals 15 464 · AsciiField 4 920 (NV usage AgentX) · product-logo 1 901 · global-seo-shots 1 237 · SwapImage 651 · sparkles 495 → ≈ 86,0 Ko brut / ≈ 34,6 gz
- utiles /agentx : usePageMeta 1 075 · check 125 · use-in-view 807 · arrow-up-right 168 · D7S3xdIX · useJsonLd 370 · dither 791
### /agentx au chargement (Playwright, sans scroll, attente 6 s, host localhost:4173)
- 1440×900 : 2 391 936 o, 27 req ; js 1 026 199 · css 156 244 · html 160 095 · img 113 981 · font 80 192 · video 855 225
- 390×844 : 2 347 322 o, 26 req ; js 1 026 199 · css 156 244 · html 160 095 · img 69 367 · font 80 192 · video 855 225
- vidéo : seule `/shots/agentx/room.webm` 855 225 o (206) ; board/ops/mp4 ∅ ; poster room-poster.webp 48 508
- 2 `<video>` dans le DOM, même src room.webm (1 requête) ; les deux readyState 4, buffered 18.8/18.8 s → fichier entier
- 390 : 2 vidéos `paused:true`, fichier entier quand même ; 1440 : hero joue, onglet `paused:true`
- 1440 seul : `/kora/dark-dashboard-1280.webp` 44 614 o chargé sur /agentx (≠ AgentX)
- js 1 026 199 = entry 924 268 + 102 k (préloads + page)
- NV : Google Fonts externes (dist/index.html:28, 4 familles) hors mesure (filtre localhost)
### RoomVideo (src/pages/AgentX/index.tsx)
- :34-58 — composant ; `autoPlay muted loop playsInline preload="metadata"` ; sources webm puis mp4 :54-55
- :36-38 — pause seulement si prefers-reduced-motion ; ∅ IntersectionObserver / lazy / pause hors vue
- :136 — onglets : `<RoomVideo name={SHOTS[active]}>`, SHOTS=[room,board,ops] (:21), sous le fold ; `key={name}` remonte à chaque onglet
- :235 — hero : `<RoomVideo name="room">` dans BrowserFrame, au-dessus du fold
- :82 — `useInView` ne pilote que le minuteur d'onglets (:87-90), ≠ vidéo
- dist/shots/agentx webm/mp4 : room 855 225 / 1 146 923 · board 959 066 / 1 228 602 · ops 613 907 / 779 926 · posters 48 508 / 63 736 / 59 024
- autres vidéos dist : rubber-buddy-hero.mp4 1 786 193 · kora-games.webm 238 271 · shots/netforge/sim.webm 273 649
## Vérifié comment
- `ls -lS dist/assets` → index-BZy5-XuT.js 924268
- `gzip -c dist/assets/index-BZy5-XuT.js | wc -c` → 308490
- `sh measure.sh` → loc-all 464605 158530 · react-dom-client 142110 45519 · motion-react 145206 48461 · react-router 49722 17774 · i18next+react-i18next 62556 20759 · lenis 18617 5405 · lucide-header 16875 6446
- `node net.mjs /agentx 1440 900` ; `node net.mjs /agentx 390 844` → totaux ci-dessus (args : path w h waitms)
- composition = estimation esbuild isolée ; ∅ .map dans dist → NV précision ±10 %
## Écarts
- lecture hors WL: dist/agentx/index.html, dist/contact/index.html (+ src/pages/Contact par grep) — préloads par route
- DoD composition : estimation, pas mesure exacte (pas de sourcemap)
## Pour la suite
- Entry 924 Ko/308 gz dont locales 5 langues 465 Ko/158,5 gz (50 %), import statique src/lib/i18n.ts:3-7 ; es/de/it ré-importent fr ; gain max visiteur fr ≈ −366 Ko/−125 gz si en/es/de/it en chargement différé
- Libs fixes ≈ 436 Ko : motion 145 (layout.tsx:3), react-dom 142, i18next 63, router 50, lenis 19 (layout.tsx:4), lucide 17 ; ChatBot et three déjà hors entry
- Prérendu : dist/{agentx,contact}/index.html préchargent les chunks Home (/agentx : ≈ 86 Ko brut/35 gz inutiles, dont simple-icons 43 Ko)
- /agentx : room.webm 855 Ko téléchargée entière au chargement (autoPlay, preload=metadata sans effet, 2 `<video>` même src, aussi à 390 px, vidéo onglet sous le fold) ; board/ops 0 o avant clic ; RoomVideo :34-58
- Pièges : ASCII intouchable ; locales mortes Orbit/Lab/RubberBuddy ; dark-dashboard-1280.webp (Kora) chargé sur /agentx à 1440
## Retour sur le pack
- Manquait: sourcemap/visualizer ; dist/<route>/index.html en WL
- Inutile: ∅
