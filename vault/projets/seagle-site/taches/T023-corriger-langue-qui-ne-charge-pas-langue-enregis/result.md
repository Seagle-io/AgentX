---
tache: T023
statut: fait
---
## Livré
- src/lib/i18n.ts:L21-22 — `supported()` filtre langue sauvée puis navigateur (D2, D3)
- src/lib/i18n.ts:L24-44 — i18nReady rejetée si `init` reçoit err (chunk KO) ; signature `Promise<unknown>` conservée
- src/main.tsx:L25-30 — rejet → 1 reload (`reloaded:locale`), sinon React non monté
```ts
const initialLanguage = langFromPath(location.pathname) ?? supported(savedLanguage) ?? supported(browserLanguage) ?? 'fr'
export const i18nReady: Promise<unknown> = new Promise((resolve, reject) => void i18n…init({…}, err => err ? reject(err) : resolve(undefined)))
```
## Vérifié comment
npx tsc --noEmit -p . → tsc=0
cd T023 && vite build <repo> --outDir T023/dist --emptyOutDir → ✓ built in 6.72s ; entrée index-DqbihRNN.js 465.51 kB / 152.24 kB gz ; sitemap → T023/dist (dist/ partagé intouché)
preview :4423 (arrêté, pid 3068813+3068814) ; prérendu simulé = `<h1>PRERENDU</h1>` injecté dans #root via page.route
node T023/t023.mjs → (reloads = domcontentloaded − 1)
D1 abort fr / {"h1":"PRERENDU","mounted":false} reloads= 1 locales= fr pageerror= 0
D1 abort de+fr /de/products/ {"h1":"PRERENDU","mounted":false} reloads= 1 locales= de,fr pageerror= 0
D1b abort de /de/products/ {"h1":"PRERENDU","mounted":false} reloads= 1 pageerror= 0
D2 ls=xx nav=fr / {"lang":"fr","ls":"fr","inLanguage":"fr"} ; nav=de → de/de/de ; nav=ja → fr/fr/fr ; pageerror= 0
D3 ls='' nav=de / {"h1":"KI & Webim Dienst Ihres Unternehmens","lang":"de","inLanguage":"de"} pageerror= 0
ok ls=fr|en|es|de|it / → h1 "Optimisez…"|"Optimize…"|"IA y web…"|"KI & Web…"|"IA e web…", mounted, inLanguage=ls, reloads 0, pageerror 0
ok /de/products/ {"h1":"Die Software, die wir entwickeln.","lang":"de","mounted":true} reloads= 0 pageerror= 0
switch fr->de / → after {"h1":"KI & Webim Dienst…","lang":"de","url":"/de"} pageerror= 0
node T023/reloads.mjs → 2 reload() (preload+locale) même tick : 2e doc ERR_ABORTED, 1 seul document commité ; boot ss=["reloaded:preload","reloaded:locale"]
HTML prérendu réel (h1 vrai) → NV — prérendu réservé au chef
## Écarts
- ∅ lecture hors WL (source i18next node_modules lue pour flux err : dépendance, pas vault/src)
- vite/imagetools a créé T023/node_modules/.cache → supprimé
## Pour la suite
- obs. hors périmètre : bascule fr→de avec chunk de KO → `vite:preloadError` recharge, retour `/` en fr, 0 pageerror, 1 reload
- échec persistant : clé `reloaded:*` purgée 5 s après `load` → nouvelle nav = 1 nouveau reload (voulu, borné)
- chunk de seul KO sur /de/* → reload puis HTML prérendu DE figé (avant : texte FR sous lang=de)
- `vite build`/`preview` avec cwd=T023 + root en argument → sitemap écrit dans T023/dist, pas dans dist/ partagé
- vérif D1 sur vrai prérendu à refaire après `npm run build` chef (t023.mjs, B=:4173, retirer `prerender`)
## Retour sur le pack
- Manquait: hashes chunks locale (repris de T018 t006, inchangés) ; build T023 non prérendu → h1 D1 à simuler | Inutile: ∅
## Reprise 2
statut: fait — D3b OK
- src/lib/i18n.ts:L21-27 — `supported()` : `split('-')[0].toLowerCase()` ; navigator passé en forme longue (même règle)
```ts
const supported = (lng: string | null) => {
	const short = lng?.split('-')[0].toLowerCase()
	return SUPPORTED_LANGUAGES.includes(short as SupportedLang) ? short as SupportedLang : undefined
}
```
npx tsc --noEmit -p . → tsc=0 ; rebuild T023/dist → ✓ built in 4.87s ; chunks locale inchangés (5/5 hashes)
node T023/t023.mjs → T023/t023-r2.out (preview :4423 arrêté) :
- D3b ls=de-DE nav=fr / → lang de, h1 "KI & Web…", ls → "de" (normalisé), pageerror 0
- D3b ls=DE → de · ls=it-CH → it · nav=es-MX sans ls → es
- D2 ls=xx → fr (nav fr) | de (nav de) | fr (nav ja) · ls=xx-YY → fr ; inLanguage ∈ {fr,de}
- D3 ls="" nav=de-DE → de
- D1 abort fr / et de+fr /de/products/ → h1 PRERENDU, mounted false, reloads 1, pageerror 0 (inchangé)
- 5 langues / + /de/products/ + bascule fr→de → OK, pageerror 0
