---
pack: T023
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T023 — Corriger : langue qui ne charge pas, langue enregistrée invalide

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `src/lib/i18n.ts` et `src/main.tsx` : si un chunk de langue échoue, recharger une fois puis, sinon, ne pas monter React (le HTML prérendu reste lisible) ; valider la langue enregistrée → défauts T018 D1, D2, D3 corrigés.

## Definition of Done
- [ ] D1 : abort du chunk `fr` (`page.route`) sur `/` et de `de`+`fr` sur `/de/products/` → 1 rechargement max (clé `sessionStorage` `reloaded:locale`, même mécanique que `main.tsx:8-17`) ; échec persistant → `#root` garde le HTML prérendu (h1 présent), 0 `pageerror`, pas de `app-mounted`
- [ ] D2 : `localStorage.i18nextLng = "xx"` → langue initiale = navigateur ou `fr` ; JSON-LD WebSite `inLanguage` ∈ {fr,en,es,de,it}
- [ ] D3 : `i18nextLng = ""` + `navigator.language = "de-DE"` (contexte `locale: "de-DE"`) sur `/` → `de` (comportement HEAD)
- [ ] D3b (reprise chef) : `i18nextLng = "de-DE"` (forme longue, legs HEAD) + navigateur fr sur `/` → `de` (HEAD : de) ; `supported()` normalise `xx-YY` → `xx`
- [ ] non-régression : 5 langues sur `/` et `/de/products/` normales (h1 traduit, 0 `pageerror`) ; bascule fr→de OK
- [ ] `npx tsc --noEmit -p .` → 0 erreur
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/lib/i18n.ts` | E | L18-45 : initialLanguage L22, backend read L28-33 |
| `~/Documents/Workspace/seagle-website/src/main.tsx` | E | render après i18nReady L20-25 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T018-casser-vitesse-json-ld-lab-et-audience/result.md` | L | défauts D1-D3, repro |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T018/` | L | scripts de repro (t006.mjs, lsempty.mjs) à réutiliser |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T023/` | E | build, scripts |

## Contrats
Défauts T018 (verbatim) :
```
D1 G2 — abort chunk locale fr sur / → #root vidé, HTML prérendu détruit, pageerror g.map is not a function — i18n.ts:33 (cb(err) puis render) + Home/index.tsx:61 (.map sur clé brute)
D2 G3 — localStorage i18nextLng=xx → JSON-LD WebSite "inLanguage":"xx" — i18n.ts:22 langue sauvée non validée
D3 G3 — i18nextLng="" + navigateur de-DE → page fr (HEAD donnait de) — i18n.ts:22 ?? au lieu de ||
```
Code actuel :
```ts
const initialLanguage = langFromPath(location.pathname) ?? savedLanguage ?? (SUPPORTED_LANGUAGES.includes(browserLanguage as SupportedLang) ? browserLanguage : 'fr')
read(lng, _ns, cb) { const load = locales[lng]; if (!load) return cb(null, {}); load().then(m => cb(null, m.default), (err: unknown) => cb(err)) }
// main.tsx
void i18nReady.then(() => { createRoot(rootElement).render(<App />); document.documentElement.classList.add("app-mounted") })
```
`export const i18nReady: Promise<unknown>` : signature conservée (consommée par main.tsx).

## Décisions actées
- échec de langue → rechargement unique puis HTML prérendu figé : jamais d'écran blanc — chef
- `Home/index.tsx` intouché : on ne monte pas React sans traductions
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- routes, hooks, pages ; bascule de langue après montage (chunk qui échoue au clic : observer et noter seulement)

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T023/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T023/dist --port 4423 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T023/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T023/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T023
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
