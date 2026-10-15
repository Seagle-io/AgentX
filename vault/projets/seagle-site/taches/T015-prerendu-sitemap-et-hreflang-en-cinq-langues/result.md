---
tache: T015
statut: fait
---
## Livré
- prerender.mjs:11-27 — ROUTES = indexedPages(JSON site-routes), liste en dur supprimée
- prerender.mjs:75-80 — attend html[lang]=lang ; canonical ≠ SITE+path → throw (failed++)
- vite.config.js:6-49 — sitemap = indexedPages × alternates ; langs/staticRoutes/SERVICE_SLUGS/bloc Lab supprimés
- src/hooks/useHreflang.ts:1-25 — matchRoute + isIndexed → alternatesFor, SITE_URL+path
- src/hooks/usePageMeta.ts:3,32 — pageUrl = SITE_URL + normalizePath(pathname)
- artefacts/seagle-site/T015/{check-routes.mjs,prerender.head.mjs,build.log} — vérif
## Vérifié comment
npm run build (4173, log artefacts/T015/build.log) → tail :
  ✅ /it/services/seo-branding      [it] SEO & Branding | Seagle
  ✅ /                              [fr] Seagle : Solutions IA & Développement Web sur
  Prerendering terminé — 109 OK, 0 erreurs
  dist OK
  exit=0
build.log → `✅ Sitemap généré — 109 pages`
grep -c '<loc>' dist/sitemap.xml → 109
grep -o 'hreflang="[a-z-]*"' dist/de/products/index.html | sort -u | wc -l → 6
idem dist/contact/index.html → de es fr it x-default (5, ∅ en)
dist/de/products/index.html → <html lang="de" …> · og:locale de_DE · canonical https://seagle.io/de/products · h1 "Die Software, die wir entwickeln." (fr : "Les logiciels que nous éditons.")
node artefacts/T015/check-routes.mjs → old=34 new=109 missing=0 []
node scripts/check-dist.mjs → dist OK
npx tsc --noEmit -p . → 0 sortie, exit 0
ss -ltnp | grep -c ':4173 ' → 0 (prerender tue son preview ; ∅ preview 4415 lancé)
git diff --stat -- 4 fichiers E → prerender 48, useHreflang 35, usePageMeta 3, vite.config 117 ; 39+ 164-
## Écarts
- build = `npm run build` sur dist/ (note chef) au lieu de outDir artefacts/T015 ; prérendu exécuté → vérif HTML faite, pas NV
- DoD « 35 chemins » : HEAD = 33 + /lab = 34 (tous ⊂ nouvelle liste)
- usePageMeta importe `@/lib/site-routes.mjs` directement — routes.ts n'exporte pas normalizePath (contrat : « routes.ts seul module importé par src »)
- lectures hors WL : ∅ (package.json, src/lib/site.ts : grep 1 ligne chacun, script build + SITE_URL)
## Pour la suite
- routes.ts : réexporter `normalizePath` → usePageMeta l'importerait via `@/lib/routes` (règle « seul module importé »)
- SITE codé en dur 2× hors src (`prerender.mjs` SITE, `vite.config.js` hostname) ; candidat pour site-routes.json
- dist/ actuel = build T015 complet (109 pages + sitemap 109) ; tout diff T016 ultérieur exige rebuild
- prérendu ~109 pages OK sans timeout ; attente html[lang] passe pour es/de/it
## Retour sur le pack
- Manquait: note chef (npm run build sur dist) contredit « prérendu non exécutable » + outDir artefacts ; décompte 35 ≠ 34
- Inutile: ∅
