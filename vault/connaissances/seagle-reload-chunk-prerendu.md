---
titre: seagle-website — chunk locale/page en échec, rechargement et prérendu
resume: vite:preloadError → reload borné par clés sessionStorage ; repli .boot-failed ; classe d'état ≠ montage
source: seagle-site T006 T018 T023 T027 T028
cree: 2026-10-14
tags: [note, seagle, i18n, prerendu, piege]
---

# seagle-website : échec de chunk et prérendu

## Fait
- HTML prérendu contient déjà `class="app-mounted"` → `mounted` (classe) NE prouve PAS le montage React ; sonde fiable = `__reactContainer` sur `#root`
- `i18nReady` en échec de locale : garder le HTML prérendu (pas de render) ; `returnObjects` non-tableau → `.map is not a function` (page blanche, T018 D1)
- garde de reload (src/main.tsx) : clés sessionStorage `reloaded:boot`, `reloaded:preload`, `reloaded:locale`, `reloaded:<pathname>` ; borné 1 reload/adresse/session
  - 2 `reload()` même tick → 1 seul document commité (2e `ERR_ABORTED`)
  - `reloaded:boot` purgée seulement après montage à une autre adresse (purge immédiate = boucle si chunk toujours absent)
  - clés `reloaded:<pathname>` (page()) non purgées
- repli `.boot-failed` (CSS) : contenu prérendu rendu visible si l'entrée charge mais React échoue ; prérendu doit figer l'état final des animations (`opacity: 0;` avec `;` — `opacity: 0` seul touche 37 `opacity: 0.14` — + `[style^="transform: translateY("]` + `filter: none`)
- repli absent si l'entrée JS elle-même échoue (main.tsx jamais exécuté)
- reload post-montage d'un chunk non-page (DitherBackdrop, AsciiField…) : pas d'error boundary → page blanche (préexistant)
- test d'échec : `page.route` abort sur le chunk ; prérendu simulé = `<h1>PRERENDU</h1>` injecté dans `#root`
- `localStorage` : valeur hors SUPPORTED_LANGUAGES ou vide → ignorée (`||` pas `??`) ; `xx` → fr, `""` + navigator de → de

## Pourquoi ça compte
- boucle de rechargement et page blanche sont invisibles en tsc et en e2e nominal

## Où
- `src/main.tsx` — garde reload, `vite:preloadError`
- `src/lib/i18n.ts` — `i18nReady`, `supported()`
- `prerender.mjs` — capture, attente `html[lang]`

## Voir aussi
- [[seagle-i18n-routes-5-langues]]
