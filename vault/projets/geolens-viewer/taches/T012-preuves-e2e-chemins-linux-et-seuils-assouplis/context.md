---
pack: T012
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T012 — Preuves e2e : chemins Linux et seuils assouplis

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre les 11 preuves `e2e/proof-*.mjs` portables Linux (dossier de sortie hors `C:/`) et leurs seuils de tuiles conditionnés aux données présentes, via un module NEUF `e2e/_proofEnv.mjs` ; package/cloudpkg sautent proprement si l'asset `.pnts` manque. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `e2e/_proofEnv.mjs` NEUF = contrat verbatim, imports node: seulement
- [ ] 11 fichiers : littéral `const DIR = 'C:/tmp/glw-proofs'` remplacé par import `DIR` de `./_proofEnv.mjs` ; `rg -n "C:/tmp" e2e/proof-*.mjs` → seul proof-import-lcc2.mjs:10 (commentaire) ou ∅
- [ ] seuils : proof-viewer.mjs:70,75 (30) · proof-refine.mjs:10 (150) · proof-pnts.mjs:52 (12) · proof-interaction.mjs:36 (20) → `minTiles(<valeur d'origine>)`
- [ ] proof-package.mjs:68 · proof-cloudpkg.mjs:55 : avant readFileSync du .pnts → `skipIfMissing(chemin, 'raison')`
- [ ] `node --check` sur les 12 fichiers → 0 erreur, sortie collée
- [ ] `node -e "import('./_proofEnv.mjs').then(m=>console.log(m.DIR, m.ASSETS_PRESENT, m.minTiles(30)))"` (cwd e2e) → sortie collée ; attendu `/tmp/glw-proofs false 0`
- [ ] `git -C G diff --stat` collé : 0 fichier hors WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Colonne Pourquoi : ligne `DIR` et seuils.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/_proofEnv.mjs` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | E | DIR :11 ; seuils :70,75 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-upload.mjs` | E | DIR :19 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-package.mjs` | E | DIR :22 ; .pnts :68 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-cloudpkg.mjs` | E | DIR :19 ; .pnts :55 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-refine.mjs` | E | DIR :16 ; seuil :10 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-export.mjs` | E | DIR :8 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-pnts.mjs` | E | DIR :9 ; seuil :52 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-ortho.mjs` | E | DIR :9 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-interaction.mjs` | E | DIR :6 ; seuil :36 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-photo.mjs` | E | DIR :13 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-import-lcc2.mjs` | E | DIR :18 |

## Contrats
```js
// ═══ e2e/_proofEnv.mjs (NEUF) — imports : node:os, node:path, node:fs, node:url uniquement
/** dossier de sortie : process.env.OUT || path.join(os.tmpdir(), 'glw-proofs') ; mkdirSync recursive au chargement */
export const DIR;
/** true ssi ≥ 1 fichier .b3dm OU .pnts sous <G>/seed-data/storage/villelaure-real (récursif) ; <G> = dossier parent de e2e (fileURLToPath(import.meta.url)) */
export const ASSETS_PRESENT;
/** process.env.PROOF_MIN_TILES défini → Number(...) ; sinon ASSETS_PRESENT ? original : 0
 *  si retour < original → console.warn(`SEUIL ASSOUPLI ${original}→${n} : assets 3D absents (decisions.md D4)`) une fois par valeur */
export function minTiles(original);
/** fichier absent → console.log(`SKIP ${path.basename(process.argv[1])} : ${reason}`) puis process.exit(0) */
export function skipIfMissing(file, reason);
```
Faits T005 :
- 11 preuves : `const DIR = 'C:/tmp/glw-proofs'` (1 par fichier) ; 8 font mkdirSync à la volée → garder leurs appels, DIR existe déjà
- proof-import-lcc2.mjs:10 = commentaire contenant C:/ (adapter ou laisser)
- seed-data/storage/villelaure-real : 0 .b3dm, 0 .pnts → ASSETS_PRESENT false
- proof-package.mjs:68 / proof-cloudpkg.mjs:55 : `readFileSync(.../pnts/pointcloud_0164.pnts)` → ENOENT aujourd'hui
- preuves = `node proof-x.mjs`, import `playwright-core` ; sortie `process.exit(fails.length===0?0:1)`
- os.tmpdir() déjà utilisé proof-upload.mjs:35, proof-cloudpkg.mjs:59 (ne pas toucher)

## Décisions actées
- seuils conditionnés aux données, override PROOF_MIN_TILES — decisions.md D4
- SKIP = exit 0 + ligne SKIP visible — preuve réduite assumée
- 1 module partagé neuf, pas de factorisation du login — périmètre minimal

## Hors périmètre
- diag-*.mjs (6), proof-persistence/range/splat/pack-*/report-v2, package.json, README.md, playwright.config.ts
- factoriser login ou autre logique des preuves
- `npm ci` dans e2e, lancer les preuves (stack non démarrée) → NV assumé
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; e2e/node_modules ABSENT → aucune preuve exécutable ; `node --check` et import de _proofEnv.mjs OK sans deps
- G sous git : baseline 745d46f ; d'autres agents écrivent dans api/, web/, worker/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(node --check, node -e, git diff, git status, rg, ls)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T012
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
