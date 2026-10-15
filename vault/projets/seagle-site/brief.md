---
projet: seagle-site
titre: Seagle : vitesse, référencement, qualité
statut: cadrage
objectif: seagle.io charge moins de JS au premier écran, est indexable dans ses 5 langues avec données structurées complètes, relie ses démos ASCII via /lab, et ne peut plus partir en ligne cassé (garde-fou build, e2e, accessibilité)
depot: ~/Documents/Workspace/seagle-website
produit: seagle
cree: 2026-10-14
tags: [projet]
---

# Brief — Seagle : vitesse, référencement, qualité

## Objectif
Le site seagle.io (React/Vite, prérendu) charge moins au premier écran, est indexable en fr/en/de/es/it avec JSON-LD complet, regroupe ses tableaux ASCII sous /lab, et une suite e2e + un garde-fou bloquent toute mise en ligne cassée.

## Definition of Done du projet
- [x] chunk JS d'entrée réduit, gain chiffré avant/après (Ko brut + gzip) — build réel — T006 924268→461313 brut, 308490→150901 gz ; T023 465,5 Ko/152,2 gz
- [~] vidéos AgentX : 0 octet vidéo téléchargé avant arrivée à l'écran — mesuré navigateur — T007/T018 lazy OK 1440 (hero visible légitime), reduce 0 o ; KO 390×844 (hero 72 px sous pli, rootMargin 200px) — question T007 ouverte
- [x] /de/… /es/… /it/… prérendues, hreflang 5 langues + x-default, sitemap à jour — T015 109 pages, sitemap 109, 0 écart ; T019/T024/T027 sitemap.mjs
- [~] JSON-LD : manques comblés (liste établie par T002), valide schema.org — T008/T018 types OK (WebSite, AboutPage, ContactPage, ItemList) ; Career JobPosting ∅ (postedOn humain) ; Services ItemList mort (page non routée) ; validateur schema.org externe NV
- [x] /lab actif, lié depuis menu ou pied de page, liste les 4 tableaux — T009 + T017 : 4 cartes, footer → /lab, grille 2×2
- [~] build pointant vers localhost refusé au déploiement — T010/T020/T025/T028 check-dist exit 1 ; limites : concat, sans port, sans schéma ; humain : `npm run check:dist` dans deploy-static.sh
- [x] script de mesure d'audience chargé seulement si variable de build posée ; inactif par défaut — T011/T018 : off → 0 script, 0 requête ; on → 1 script
- [x] suite e2e Playwright versionnée, lancée par une commande npm, verte — T010/T025/T027 `npm run test:e2e` 113/113 (non commité : e2e/ `??`)
- [x] audit a11y rendu + corrections hors visuels ASCII appliquées — T003 audit ; T012/T013/T020/T026 corrigés ; résiduel contrastes clair + tokens ASCII : note [[seagle-a11y-tokens-audit]]
- [~] build vert, crawl de toutes les pages sans erreur console, validation visuelle humaine par vague — build vert + crawl 109 pages 0 pageerror (T015/T027) ; validation visuelle humaine NV

## Contraintes dures
- dépôt : `~/Documents/Workspace/seagle-website`, branche `feat/ascii-nuit-etoilee`, arbre déjà très modifié non commité — jamais stash/checkout/reset/clean
- visuels ASCII intouchables : sphère hero, tableaux, logo Kora, Saint Jérôme (`src/components/ui/ascii-*`, `*.data.ts`)
- design intouchable : kit `src/components/kit/`, pas de néon/halo/grille, Mona Sans + JetBrains Mono
- textes existants des 5 langues non réécrits ; nouvelles clés i18n → 5 langues
- jamais commiter : `Makefile`, `.claude/settings.local.json`, `docs/deploiement.md`, `scripts/deploy-static.sh`
- aucun commit ni push sans accord explicite de l'humain
- routes fr/en existantes inchangées (URLs déjà indexées)

## Hors périmètre
- preuves clients, prix indicatifs, dates `closedOn` des offres — contenu humain attendu
- bouton « Réserver une démo Kora »
- déploiement du serveur `server/` sur api.seagle.io
- choix et compte Plausible/Umami — on prépare seulement

## Hypothèses retenues
- Playwright (`playwright` ^1.62, chromium installé) suffit pour l'e2e — à invalider si `@playwright/test` requis et non installable
- prérendu par `prerender.mjs` extensible à de/es/it sans changer d'outil — à invalider si T002 montre un blocage
- reduced-motion des composants ASCII : audit seulement, correction = décision humaine (visuels interdits)

## Questions ouvertes
- reduced-motion sur les animations ASCII : corriger malgré l'interdit visuels ? — humain, après audit T003
- forme du garde-fou (script npm, plugin build) vu que `scripts/deploy-static.sh` est perso — chef, après T004

## Légende DoD
[x] fait · [~] fait avec réserve (voir preuve) · [ ] ouvert

## Questions refermées
- forme du garde-fou : script node `scripts/check-dist.mjs` en fin de `npm run build` (T004/T010)
- reduced-motion ASCII : corrigé côté CSS global sans toucher canvas (T013/T020 `canvasChanged 0`) ; ASCII intouché

## Hypothèses invalidées
- prérendu extensible sans changer d'outil : OK (T015 109 pages) · `@playwright/test` non requis : OK (lib seule)
- `routes.ts` seul module importé : KO — usePageMeta importe site-routes.mjs (todo)

## Carte du terrain
| Quoi | Où | Note |
|---|---|---|
| routes 5 langues | `src/lib/site-routes.json` + `routes.ts` | table unique ; lab actif |
| routeur | `src/App.tsx:46-97` | pages en lazy, Lab commenté |
| i18n | `src/lib/i18n.ts` (44 l.) + `src/lib/local/{fr,en,de,es,it}/` | 5 langues |
| prérendu | `prerender.mjs` (145 l.) | |
| sitemap | `vite.config.js` customSitemapPlugin | 109 URLs ; écrit dist/ en dur |
| hreflang | `src/hooks/useHreflang.ts` | |
| JSON-LD | `src/hooks/useJsonLd.ts` + 12 pages + `index.html` | déjà présent en partie |
| méta OG | `src/hooks/usePageMeta.ts` | image par page faite |
| vidéos AgentX | `src/pages/AgentX/index.tsx:34-58` | autoPlay, preload=metadata, poster ok |
| bundle | `dist/assets/index-*.js` ≈ 465 Ko / 152 gz | locales en chunks ; three à part |
| Lab | `src/pages/Lab/index.tsx`, `AsciiGalleryNav` | actif, 4 cartes |
| garde-fou / e2e | `scripts/check-dist.mjs`, `e2e/run.mjs` | non suivis |
| build local | `VITE_CHAT_API_URL=http://localhost:3001 npm run build` | preview :4173 |
