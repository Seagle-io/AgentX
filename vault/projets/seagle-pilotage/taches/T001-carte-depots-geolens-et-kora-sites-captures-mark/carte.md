---
tache: T001
projet: seagle-pilotage
tags: [carte, seagle]
---
# Carte T001 — dépôts, sites, captures, marketing, finance (2026-10-15)
Racine `W=~/Documents/Workspace`.

## Kora = OrthoPro (OUI)
- `W/OrthoPro/ortho-front/index.html:7` — `<title>Kora — Dossier patient, agenda…`
- `W/OrthoPro/STRUCTURE.md:1` — « Structure du code — Kora (OrthoPro) »
- `W/OrthoPro/ortho-front/Makefile:1,DEPLOY_PATH` — `api.kora-suite.fr`, `/var/www/kora-suite/front/`
- `W/seagle-website/Kora.md:1-12` — doc Kora = Ortholan(front)+Orthosaurus-api(back) ; 705 l, màj mai 2026
- `W/Ortholan`, `W/Orthosaurus-api` — dossiers anciens présents NV (hors WL, non ouverts)

## Dépôts git (remote · défaut · publication · dernier commit)
| Dépôt | remote | branches | HEAD courant | dernier commit |
|---|---|---|---|---|
| OrthoPro/ortho-back | origin git@github.com:Seagle-io/ortho-back.git | master(défaut origin/HEAD), Ultime, feat/bilan, feat/comptabilite | master | 3aa51fd 2026-10-14 ; Ultime c5b4949 2026-10-06 |
| OrthoPro/ortho-front | origin git@github.com:Seagle-io/ortho-front.git | idem | master | b44dc91 2026-10-15 ; Ultime e6f38e4 2026-10-06 |
| Geolens/geolens-web-feat-viewer-online | geolens-old git@github.com:Geolens-software/geolens-old.git (∅ origin) | master seul | master | 2bf1f0e 2026-10-14 |
| Geolens/Doc-Geolens | origin git@github.com:Seagle-io/Doc-Geolens.git | main | main | 3f0eb59 2026-09-21 |
| seagle-website | origin git@github.com:Seagle-io/seagle-website.git | main(défaut), feat/ascii-nuit-etoilee, feat/payment, Awesome, backup-avant-rebase | feat/ascii-nuit-etoilee | HEAD 29d349b 2026-10-14 ; main c1a2c43 2026-09-18 |
| Geolens-website | origin https://github.com/Seagle-io/Geolens-website.git | main ; origin/HEAD→claude/nifty-bohr-900lv4 | main | 6ae6bfe 2026-10-02 |
- seagle-website : `git log main..HEAD` = 16 commits non fusionnés dans main ; toutes les pages Kora actuelles sont hors main.
- NON-git (∅ .git) : Geolens/{geolens-reality-main, geolens-risk-analysis-main, geomodeling-main, geoplan-main, safer, Geolens-Audit-Vault}, Seagle-Marketing.
- Piège : Doc-Geolens et Geolens-Audit-Vault = mêmes fichiers d'audit (doublon).
- Piège : ortho-* master = branche courante ; Ultime = branche de travail OrthoPro (env.md), Ultime en retard sur master (2026-10-06 vs 10-14/15).
- Piège : ortho-front master a des commits plus récents que Ultime → « publication » Kora ambiguë (master vs Ultime) NV.
- Piège : Geolens produit n'a pas de main/master publiable distinct : remote nommé `geolens-old`.

## seagle-website
- Pages produit : `src/pages/Kora/index.tsx` (571 l) ; Geolens ∅ — `rg -il geolens` hors node_modules = 0 fichier.
- Textes : `src/lib/local/{fr,en,de,es,it}/Kora.ts` 141 l chacun ; 5 langues.
- Fonctionnalités Kora (fr) : `Kora.ts:23-75` `modules.items` = 8 modules × 3 points ; `Kora.ts:79-89` patient + 5 jeux ; `:91` bento ; `:103` prisme ; `:112` steps.
- Routage : `src/lib/site-routes.json:16` `/solutions/kora` ; nav `src/lib/local/en/Navbar.ts:27`.
- Captures Kora : `public/kora/` 61 fichiers : webp `{dark|light}-<écran>-{1280|2400}.webp` + `game-{memory,puzzle,rime}-*.webp` + `kora-games.{mp4,webm}` + poster ; 17–130 Ko ; dernier changement git 2026-10-13 (7624a43 / c2acf15).
- Écrans : agenda, bilan, bilan-detail, bilan-trames, dashboard, documents, exercise-edit, exercises, forum, my-day, patient-detail, patient-suivi, settings.
- Référencées : `src/pages/Kora/index.tsx:77-80` (`shotBase`), `:116-122` (vidéo), `:241-242` (exercises), `:312` JSON-LD `https://seagle.io/kora/dark-agenda-1280.webp` ; aussi `pages/Product/index.tsx`, `pages/Home/index.tsx`.
- Aperçus OG : `public/og/*.jpg` 9 fichiers (kora.jpg 67 Ko), 2026-10-14.
- Production OG : `scripts/og-images.mjs` (Playwright, 1200×630, `npm run build && npm run preview` puis `node scripts/og-images.mjs`, BASE=:4173). Capture du canvas `canvas[aria-label="Kora"]`.
- Production `public/kora/*.webp` : script ∅ dans `scripts/` (add-mask.py, check-dist.mjs, deploy-static.sh, encode-painting.py, og-images.mjs) → manuel/NV.
- Autres produits (hors scope) : `public/shots/{agentx,global-seo,leef,netforge,secure-pass}`.
- Sections masquées : `HIDDEN_SECTIONS.md` (Kora : badge hero…).
- Lancer : `npm run dev` → :5173 (README:18) ; `npm run preview` ; `npm run build` ; `npm run test:e2e` (e2e/run.mjs) ; `npm run check:dist`.
- Déploiement : `scripts/deploy-static.sh`, `docs/deploiement.md`.

## Geolens-website
- Pages produit : `src/pages/Logiciel.tsx` (236 l) ; fonctionnalités `src/site.ts` : `packs` (8 packs, l.~244-253), `riskSteps` (5 étapes), listes sources/exports ; `src/content/{pages,articles}.ts` 478/119 l.
- Captures : `public/images/logiciel/vue-{coupe,courbes,mesure,protections,solaire,surete,zone}.webp` (7) ; référencées `src/site.ts:~245-251` (champ `shot.src`) + `Logiciel.tsx`. Dernier git : 2026-10-02 (6ae6bfe).
- Production : manuelle NV ; `tools/plateforme/modele.py` (nuage plateforme, 2026-10-02), `tools/scene-3d/scene.html`, `tools/maillage/*.png` ; script de capture ∅.
- Libellés packs « issus de packs/catalog.ts du produit » (`site.ts` commentaire) — copie manuelle, pas de lien automatique.
- Lancer : `npm run dev` :5173 ; `npm run build` ; `npm run preview` :4173 ; `npm run typecheck` (README).

## Écart (dates seulement)
| Produit | dernier commit produit | dernière MàJ texte site | dernière MàJ captures site |
|---|---|---|---|
| Kora | ortho-front master 2026-10-15 ; Ultime 2026-10-06 | Kora.ts/pages 2026-10-14 (hors main ; main 2026-09-18) | public/kora 2026-10-13 |
| Geolens | geolens-web master 2026-10-14 | Geolens-website 2026-10-02 (main) | public/images/logiciel 2026-10-02 |
- Geolens produit : 12 j de commits (web/src 2026-10-14) après dernière MàJ site.
- Kora : captures 2 j avant dernier commit front master.

## Seagle-Marketing (`W/Seagle-Marketing/`, pas git, vault Obsidian, ∅ .obsidian listé)
- 00 - Accueil.md — index du vault (49 l)
- 01 - Contexte et objectifs.md — contexte, objectifs (41 l)
- 02 - Positionnement et messages.md — positionnement, messages (42 l)
- 03 - Cibles et personas.md — cibles, personas (51 l)
- 04 - Canaux.md — canaux de diffusion (52 l)
- 05 - Calendrier.md — calendrier (46 l)
- 06 - Parcours et conversion.md — parcours, conversion (51 l)
- 07 - KPIs et budget.md — KPIs, budget (38 l)
- 08 - Règles éditoriales et conformité.md — règles éditoriales (42 l)
- 09 - Séquence de suivi des prospects.md — séquence prospects (145 l)
- Calendrier éditorial.md — 10 posts mer/ven 21/10→25/11 (33 l)
- Posts/ — 10 fichiers `Post NN - …md`
- Calendrier : statuts « fiche Kora à corriger » (05, 4/11), « vérification Kora à faire » (08, 18/11), « capture à faire » (07). Mardis/jeudis « réservés au lancement de Kora ».
- Mentions Geolens/Kora : 01, 02, 00, 08, 04, 05, Calendrier éditorial, Posts 01/05/08.
- Doublon : `OrthoPro/Marketing/` (mêmes 00–09, titres différents ex. « 05 - Calendrier de lancement ») → 2 vaults marketing.

## Finance (chemins seulement)
- `W/Geolens/Devis DEV-2026-001 - SEAGLE - Geolens V2.docx` (4,9 Mo, 2026-09-24)
- `W/Audit-geolens/charte_seagle/DEVIS_GEOLENS_BPIFRANCE.docx`
- `W/Audit-geolens/charte_seagle/DEVIS_GEOLENS_MEP_V1.docx`
- `W/OrthoPro/{Businessplan.md, business_plan.MD, PRICING_LICENCES.md, PLAN_COMPTABILITE.md, PLAN_FACTURATION.md}`
- `W/Seagle-Marketing/07 - KPIs et budget.md`
- Factures / tableurs (xlsx, ods) : ∅ (find maxdepth 3). `Etude-IA-Technologies/…csv` hors sujet.
- .docx : lecture binaire, 0 parseur dispo en WL.

## Lancement produits (documenté)
- Geolens web : `docker compose up --build` → :8080 (MinIO :9001) ; ou `npm run install:all`, `npm run dev:api` :4000, `npm run dev:web` :5173 (README:33-51 ; docker « non exécuté » selon README:39). Dossiers captures existants : `audit-shots/`, `design-shots/`, `report-shots/`.
- Kora : back dev :3000 (`start:dev`), front :5173 (env.md orthopro) ; node 24.15.0 requis ; `make test-e2e` réservé humain ; e2e Playwright `ortho-front/e2e/` ; script de capture marketing ∅.
- Autres Geolens (reality, risk-analysis, geomodeling, geoplan, safer) : lancement NV (non ouverts).
