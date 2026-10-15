---
pack: T022
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T022 — CSP en dev vite + test CSP sur les fichiers (D1 T017)

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `npm run dev` du viewer à nouveau fonctionnel sous la CSP stricte (le préambule inline de @vitejs/plugin-react est bloqué) en assouplissant `script-src` en DEV SEULEMENT via un plugin vite `apply: 'serve'`, et durcir `csp.test.ts` pour lire les vrais fichiers ; build prod inchangé. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `web/src/viewer/cspDev.ts` NEUF = contrat (fonction pure, 0 import)
- [ ] `web/vite.config.ts` : plugin `{ name: 'glr-csp-dev', apply: 'serve', transformIndexHtml: (html) => relaxCspForDev(html) }` ajouté à `plugins` APRÈS `react()`
- [ ] `csp.test.ts` : cas existants :29-38 lisent `web/viewer.html` et `web/src/viewer/index.html` (pas la constante seule) ; + 4 cas listés
- [ ] viewer.html:8-12 commentaire « ajout cog: et photo: » remplacé par 1 ligne « CSP stricte (T010) : 0 inline script, 0 CDN ; dev assoupli par vite glr-csp-dev » ; même remplacement dans src/viewer/index.html si le commentaire y est ; `node scripts/check-viewer-html-sync.mjs` → exit 0
- [ ] repro dev : `node -e` (cwd web) createServer `{ server: { middlewareMode: true, hmr: { port: 24999 } } }` → `transformIndexHtml('/viewer.html', html)` → meta contient `'unsafe-inline'` dans script-src ; sortie collée ; `server.close()`
- [ ] `npm --prefix web run build` → exit 0 ; `rg -o "script-src[^;]*" web/dist/viewer.html` → ∌ `unsafe-inline` (sortie collée)
- [ ] `npm --prefix web test` → verts ; `npm --prefix web run typecheck` → exit 0 (sorties collées)
- [ ] `git -C G diff --stat -- web/vite.config.ts web/viewer.html web/src/viewer/index.html web/src/viewer/__tests__/csp.test.ts` + `git -C G status --short web/src/viewer/cspDev.ts` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/cspDev.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | E | :1-20 plugins (73 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/__tests__/csp.test.ts` | E | 47 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | E | :8-12 commentaire seul |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/index.html` | E | :8-12 commentaire seul |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/scripts/check-viewer-html-sync.mjs` | L | contrôle de synchro |

## Contrats
```ts
// ═══ web/src/viewer/cspDev.ts (NEUF), pur, 0 import
/** Dans la balise <meta http-equiv="Content-Security-Policy" …>, ajoute " 'unsafe-inline'" à la directive script-src
 *  si absente ; html sans meta CSP → inchangé ; idempotent ; ne touche aucune autre directive ni autre balise. */
export function relaxCspForDev(html: string): string;

// ═══ web/vite.config.ts ACTUEL :1-4, :17-18
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';
export default defineConfig({
  plugins: [react()],
// → plugins: [react(), { name: 'glr-csp-dev', apply: 'serve', transformIndexHtml: (html) => relaxCspForDev(html) }],
//   import { relaxCspForDev } from './src/viewer/cspDev';
```
```
CSP prod (inchangée, viewer.html:16 = src/viewer/index.html:16) :
default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'
Repro du défaut (T017) : en `vite` dev, plugin-react 4.7.0 injecte <script type="module">import { injectIntoGlobalHook } from "/@react-refresh"…</script> inline → bloqué → tout .tsx du viewer (pack Risque, packs/risque/index.ts:43) lève « @vitejs/plugin-react can't detect preamble »
```
Cas csp.test.ts (+4) :
- relaxCspForDev(viewer.html) : script-src contient `'unsafe-inline'`, style-src/connect-src inchangés
- relaxCspForDev(relaxCspForDev(x)) === relaxCspForDev(x)
- relaxCspForDev('<html><head></head></html>') inchangé
- web/viewer.html : 0 attribut `\son[a-z]+=` dans les balises

## Décisions actées
- dev assoupli, prod stricte — plugin apply:'serve' seulement
- pas de nonce/hash — 0 injection serveur
- commentaires seulement dans les HTML, meta :16 intacte

## Hors périmètre
- meta CSP :16, Caddyfile, TilesRendererLoader.ts, boot-web.ts
- ui/*, main.ts, POIManager, install.ts, PhotoInspectorMode (T021 en parallèle)
- retirer ou configurer plugin-react autrement
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vite + @vitejs/plugin-react 4.7.0 ; vitest env node
- `npm --prefix web run build` ≈ 20 s (tsc + vite) ; dist/ gitignoré
- `node scripts/check-viewer-html-sync.mjs` (cwd G) sans deps
- G sous git, baseline 745d46f ; T021 écrit dans web/src/viewer/{ui,core,services,backend}, main.ts en parallèle — si build/typecheck échoue sur un de ces fichiers : le noter, ne pas corriger, relancer 1 fois

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web test, npm --prefix web run build, npm --prefix web run typecheck, npx vitest, node -e, node scripts/check-viewer-html-sync.mjs, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T022
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
