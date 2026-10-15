---
tache: T009
statut: fait
---
## Livré
- src/pages/Lab/index.tsx:L1-L41 — réécrit : hero Kicker+SplitReveal, AsciiGalleryNav
- src/components/ui/ascii-gallery-nav.tsx:L27,L34-L41 — `current?` ; étiquette rendue si `current`
- src/lib/routes.ts:L24 — `lab` actif
- src/App.tsx:L70 — `{ key: "lab", Component: Lab }` actif ; L97 commentée
- src/components/Header/footer.tsx:L55 — « Lab » fin colonne produits
- prerender.mjs:L39 — `/lab` fr dans ROUTES
- vite.config.js:L36 — `/lab` sitemap actif ; L107-119 commentées
- src/lib/local/{fr,en}/Lab.ts:L57-L65, {de,es,it}/Lab.ts:L6-L14 — `demos` {meta,kicker,title,intro} ×5
## Vérifié comment
npx tsc --noEmit -p . → (vide) exit 0
rg "blur|gradient" src/pages/Lab/index.tsx → exit 1 (0 match) · wc -l → 41
npx vite build --outDir …/T009/dist --emptyOutDir → ✓ built in 10.83s · ✅ Sitemap généré — 17 routes statiques, 8 services · sitemap → `seagle.io/lab<` présent
node …/T009/check.mjs (preview :4404) →
fr/light | title="Seagle Lab : quatre tableaux en caractères" | h1="Seagle — Solutions IA & Développement Web sur mesure | Quatre tableaux. Écrits en caractères." | demos=4 [/nuit-etoilee=200 /la-creation-d-adam=200 /la-grande-vague=200 /la-joconde=200] | label=0 | footerLab=1 → /lab
fr/dark | idem fr/light
en/light | title="Seagle Lab: four paintings in characters" | h1="… | Four paintings. Written in characters." | demos=4 [/starry-night=200 /creation-of-adam=200 /the-great-wave=200 /mona-lisa=200] | label=0 | footerLab=1 → /lab
en/dark | idem en/light
/la-joconde | cards=3 [/nuit-etoilee /la-creation-d-adam /la-grande-vague] | label=1
pageerrors=0
captures → artefacts/seagle-site/T009/{lab-fr-light,lab-fr-dark,lab-en-light,lab-en-dark,lab-fr-dark-cards,la-joconde-nav}.png
prérendu /lab → NV — prérendu réservé au chef
preview :4404 → arrêté (pid 2823585 + enfant vite 2823642) ; `ss -ltn | grep -c 4404` → 0
## Écarts
- ∅ lecture hors WL
- 200 des 4 liens = fallback SPA de `vite preview` — pas preuve de prérendu
- 1er h1 = h1 statique d'index.html (préexistant), h1 page = 2e
## Pour la suite
- `/lab` sans `current` : grille `lg:grid-cols-3` → 3+1 cartes (voir lab-fr-dark-cards.png) ; proposer `lg:grid-cols-4` ou `sm:grid-cols-2` seul quand `current` absent (ascii-gallery-nav.tsx:L48)
- conteneur nav `max-w-5xl` ≠ hero `max-w-6xl` : décalage gauche visible sur /lab
- h2 nav « Quatre tableaux, deux façons… » répète le h1 /lab ; option : masquer h2 sans `current`
- index.html : h1 statique toujours présent → 2 h1 par page (préexistant, toutes pages)
- `Lab.experiments/notes/philosophy/cta/metrics/badge` désormais sans consommateur (LabArticle utilise `article`)
## Retour sur le pack
- Manquait: mise en page grille sans `current` (3 col. pour 4 cartes) non tranchée | Inutile: ∅
