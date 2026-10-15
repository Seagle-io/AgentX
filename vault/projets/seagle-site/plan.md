---
projet: seagle-site
titre: Seagle : vitesse, référencement, qualité
maj: 2026-10-14
tags: [plan]
---

# Plan — Seagle : vitesse, référencement, qualité

## Découpage
V1 créée. V2+ provisoire : tâches créées après intégration de V1 (deps et WL dépendent de la carte).

| ID | Rôle | Livrable | Dépend de | Parallèle avec |
|---|---|---|---|---|
| T001 | eclaireur | carte bundle d'entrée + chargement vidéos AgentX, gains chiffrés | — | T002-T004 |
| T002 | eclaireur | carte i18n/routage/prérendu/sitemap/hreflang, JSON-LD existant et manques, état Lab | — | T001,T003,T004 |
| T003 | eclaireur | audit a11y navigateur : clavier, focus, contrastes, reduced-motion | — | T001,T002,T004 |
| T004 | eclaireur | carte outillage : chaîne build/déploiement, scripts de vérif, point d'injection audience | — | T001-T003 |
| (V2) | architecte | contrat URLs de/es/it | T002 | impl. V2 |
| (V2) | implementeur | découpage du bundle | T001 | |
| (V2) | implementeur | vidéos AgentX différées | T001 | |
| (V2) | implementeur | JSON-LD manquants | T002 | |
| (V2) | implementeur | activer /lab | T002 | |
| (V2) | implementeur | garde-fou build + audience inactive | T004 | |
| (V2) | implementeur | suite e2e Playwright + script npm | T004 | |
| (V2) | implementeur | corrections a11y hors ASCII | T003 | |
| (V3) | implementeur ×2 | URLs de/es/it : routage+sélecteur / prérendu+sitemap+hreflang | contrat V2, bundle, /lab | |
| (V4) | verificateur ×3 | casser vitesse+SEO / casser i18n / casser qualité | V2, V3 | |
| (V5) | scribe | capitaliser | V4 | |

## Vagues
- **V1** : T001, T002, T003, T004 (lecture seule, aucun conflit)
- **V2** : T005 (contrat URLs), T006 (langues à la demande), T007 (vidéos), T008 (JSON-LD), T010 (garde-fou + e2e), T011 (audience) — fichiers E disjoints, builds en outDir séparés (ports 4401-4406)
- **V2b** : T009 /lab (suspendu : choix humain sur le contenu de la page), corrections a11y (après T003)
- **V3** : URLs de/es/it (après bundle et /lab : mêmes fichiers)
- **V4** : vérificateurs, juge = e2e de V2 + build + crawl
- **V5** : scribe

## Synchronisations
- après V1 : humain valide le périmètre a11y (reduced-motion ASCII ?) avant les packs V2
- après chaque vague : build + crawl + validation visuelle humaine ; commit seulement sur accord humain
- fichiers partagés (App.tsx, routes.ts, vite.config.js, prerender.mjs, i18n.ts) : 1 seul écrivain par vague

## Risques
| Risque | Signal | Parade |
|---|---|---|
| arbre non commité mêlé aux diffs agents | diff illisible par tâche | proposer un commit humain avant V2 |
| découpage i18n casse le prérendu (textes absents du HTML) | HTML prérendu sans texte traduit | vérif `dist/**/index.html` contient le titre traduit |
| URLs de/es/it changent les URLs fr/en | sitemap fr/en diffère | diff sitemap avant/après |
| e2e lents (canvas WebGL swiftshader) | > 3 min | e2e sans attente d'animation, crawl seulement |
