---
pack: T038
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T038 — Correctifs preuves e2e : upload, viewer sans assets, diag Linux

> Seule source de vérité de l'agent T038. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `proof-upload.mjs` et `proof-viewer.mjs` vertes sur G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online sans assets 3D lourds (D4), et retirer `C:/tmp` des 6 `diag-*.mjs`, sans toucher au produit.

## Definition of Done
- [ ] proof-upload.mjs:75 : assertion de présence du formulaire alignée sur Admin.tsx:806 (titre « Import direct (avancé) ») ; preuve lancée → exit 0, ou KO suivant documenté (ligne + message) si cause produit
- [ ] proof-viewer.mjs:71 : `mem` exigé seulement si `ASSETS_PRESENT` (sinon OK explicite « mémoire GPU NV : assets absents ») ; preuve lancée → exit 0
- [ ] diag-*.mjs ×6 : `const DIR = process.env.OUT || 'C:/tmp/glw-proofs';` → `import { DIR } from './_proofEnv.mjs';` ; `rg -n "C:/tmp" e2e` → ∅ ; `node --check` ×6 OK
- [ ] non-régression : proof-persistence, proof-range, proof-ortho, proof-export relancées → exit 0
- [ ] `git -C G diff --stat -- e2e` = 8 fichiers max (proof-upload, proof-viewer, 6 diag)
- [ ] stack arrêtée en fin (kill des PID lancés) ; :5173 (Vite OrthoPro) intact
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-upload.mjs` | E | :75 texte formulaire |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | E | :71 mem |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/diag-full.mjs` | E | :6 DIR |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/diag-nested.mjs` | E | :7 DIR |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/diag-nuage.mjs` | E | :5 DIR |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/diag-prod.mjs` | E | :6 DIR |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/diag-stream.mjs` | E | :14 DIR |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/diag-ui.mjs` | E | :4 DIR |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/_proofEnv.mjs` | L | DIR, ASSETS_PRESENT, minTiles |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Admin.tsx` | L | :800-860 formulaire import direct |

## Contrats
```js
// _proofEnv.mjs
export const DIR = process.env.OUT || path.join(tmpdir(), 'glw-proofs');   // mkdirSync fait à l'import
export const ASSETS_PRESENT;   // true ssi .b3dm/.pnts sous seed-data/storage/villelaure-real (ici : false)
export function minTiles(original);  // PROOF_MIN_TILES sinon original si assets, sinon 0
// proof-viewer.mjs:71 ACTUEL
ok(!!mem && mem.geometries >= minTiles(30) && mem.textures >= (ASSETS_PRESENT ? 10 : 0), `géométries/textures réelles en GPU (geom=${mem?.geometries} tex=${mem?.textures})`);
// proof-upload.mjs:75 ACTUEL
ok(await page.getByText(/import d.un tileset 3D-Tiles/i).isVisible(), 'formulaire d’upload présent sur la page Admin');
// Admin.tsx:806  <h2 className="gl-h1" …>Import direct (avancé) — tileset nu / package Builder</h2>
// Admin.tsx:812  placeholder={pkgDels ? 'Nom issu du project.json' : 'Château de Villelaure'}
// Admin.tsx:842  <input … type="file" accept=".zip,application/zip" …/>   :858 bouton « Importer le projet »
```
Défauts T036 : D2 proof-upload:75-76 TimeoutError (texte absent de /admin, défaut antérieur à la base) · D3 proof-viewer:71 `__glrTileMem` null sans tuile → exit 1 malgré D4.
Si l'upload échoue plus loin (après :76) : la cause est à documenter, pas à masquer — 0 assertion supprimée, 0 seuil abaissé hors minTiles.

## Décisions actées
- preuves réduites assumées sans assets lourds — decisions.md D4
- preview sur :5180 (`BASE=http://localhost:5180`), jamais :5173 — D11

## Hors périmètre
- web/, api/, worker/ ; _proofEnv.mjs ; autres proof-*.mjs ; migration vers le runner Playwright
- supprimer ou affaiblir une assertion de sécurité (token sur /storage, isolation membre)
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean ; npm install ; installer un navigateur

## Environnement
- node v22.22.1 ; e2e/node_modules (playwright-core 1.61.0) ; chromium_headless_shell-1228 installé par le chef → `PLAYWRIGHT_BROWSERS_PATH` inutile
- stack : `npm --prefix web run build` puis en arrière-plan `npm run dev:api` (:4000) et `npm --prefix web run preview -- --port 5180 --strictPort` ; preuves : `BASE=http://localhost:5180 node e2e/proof-x.mjs`
- :5173 = Vite OrthoPro (pid 252705) — ne jamais le tuer ; :4000 libre avant démarrage (`ss -ltnp | rg ':4000|:5180'`)
- G git : arbre partagé, le chef commite ; base preuves T036 : persistence 0 · range 0 · ortho 0 · export 0 · viewer 1 (L71) · upload 1 (:76)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Bash(npm --prefix web run build, npm run dev:api, npm --prefix web run preview, BASE=… node e2e/*.mjs, node --check, ss, rg, kill des PID lancés, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T038
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
