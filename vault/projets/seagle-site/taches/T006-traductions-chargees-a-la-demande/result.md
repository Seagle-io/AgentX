---
tache: T006
statut: fait
---
## Livré
- src/lib/i18n.ts:1-13 — 5 imports statiques → table `locales` d'`import()`
- src/lib/i18n.ts:23-42 — `i18nReady` = `init()` + backend inline `read`
- src/lib/i18n.ts:31 — langue inconnue → `cb(null, {})`, ∅ requête
- src/lib/i18n.ts:36 — `resources` retiré ; `fallbackLng: "fr"` gardé
- src/main.tsx:6,21-26 — render + `app-mounted` après `i18nReady` ; gardes L8-17 inchangées
- `react.useSuspense` : défaut gardé — 0 écran vide mesuré à la bascule
- artefacts T006/ : check.mjs, locales.mjs, bascule-{1-fr,2-de,3-en}.png, dist/
## Vérifié comment
rg -n "^import .* from './local" src/lib/i18n.ts | wc -l → 0 (HEAD → 5)
npx tsc --noEmit -p . → tsc=0, 0 sortie
npx vite build --outDir …/T006/dist --emptyOutDir → ✓ built in 5.16s
entrée assets/index-AxYhi00Z.js : wc -c → 461313 ; gzip -c | wc -c → 150901
gain : brut 924268→461313 (−462955) ; gzip 308490→150901 (−157589)
node locales.mjs → chunks locale: {"index-BlwphXbj.js":"en","index-CKCXaVR1.js":"fr","index-CwLt3oJu.js":"es","index-DVagzrMw.js":"de","index-eiR7uOwB.js":"it"}
fr → chunks chargés: fr | en → en,fr | de → de,fr | es → es,fr | it → fr,it
node check.mjs (preview :4401, `#root h1` vs `headline`, espaces ignorés) →
fr OK h1="Optimisezvotrequotidien,libérezvotrepotentiel" clésBrutes=0 pageerror=0
en OK h1="Optimizeyourdailywork,unleashyourpotential" clésBrutes=0 pageerror=0
de OK h1="KI&WebimDienstIhresUnternehmens" clésBrutes=0 pageerror=0
es OK h1="IAywebalserviciodetunegocio" clésBrutes=0 pageerror=0
it OK h1="IAewebalserviziodellatuaazienda" clésBrutes=0 pageerror=0
fr→de OK après="KI&WebimDienstIhresUnternehmens" sondesVides=0 pageerror=0
de→en OK après="Optimizeyourdailywork,unleashyourpotential" sondesVides=0 pageerror=0
KO=0
git diff --stat -- src/lib/i18n.ts src/main.tsx → 2 files changed, 23 insertions(+), 16 deletions(-)
HTML prérendu : NV — prérendu réservé au chef
preview pid lancé → kill par pid, OK
## Écarts
- lecture hors WL (rg seul): src/pages/Home/index.tsx:79-82 — trouver source du `h1`
- DoD Playwright : `h1` = `#root h1` — index.html:88 a un `h1` statique `#fallback-content`
- DoD Playwright : comparaison sans espaces — h1 = 2 spans, `\n` non rendu
## Pour la suite
- `i18nReady` exporté (src/lib/i18n.ts:24) : réutilisable par routage V3 /de /es /it
- es/de/it font `...fr` → chunk fr toujours chargé ; supprimer = −~98 Ko par langue non-fr
- prérendu : HTML attend désormais un chunk locale avant render — vérifier `prerender.mjs` (attente réseau)
- échec `import()` locale → `cb(err)` ; reload via `vite:preloadError` NV
- entrée encore 461 Ko : prochain gros poste hors locales
## Retour sur le pack
- Manquait: `h1` statique dans index.html (fallback-content) → sélecteur `#root h1` à préciser
- Inutile: ∅
