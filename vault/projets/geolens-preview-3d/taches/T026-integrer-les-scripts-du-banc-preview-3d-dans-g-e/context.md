---
pack: T026
projet: geolens-preview-3d
role: implementeur
cree: 2026-10-14
tags: [pack]
---

# Pack T026 — Scripts du banc preview 3D dans G/e2e/bench-preview

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre permanents les scripts de banc écrits par les vérificateurs (aujourd'hui dans un scratchpad de session, éphémère) : les copier dans `G/e2e/bench-preview/`, paramétrés par variables d'environnement, sans chemin absolu ni port de session, avec un README d'usage. Comportement de mesure inchangé. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] fichiers créés dans `G/e2e/bench-preview/` (noms imposés) : `lib.mjs` (← t024 lib.mjs), `png.mjs` (← t024 png.mjs), `ouverture.mjs` (← t024 o.mjs), `ouverture-entree.mjs` (← t024 o3.mjs), `vues-ortho.mjs` (← t024 h.mjs), `zoom-ortho.mjs` (← t024 z.mjs), `vues-enregistrees.mjs` (← t024 sv3.mjs, + cas de sv2.mjs absents de sv3 : `frustum`, `midtoggle`, `fly`, `inject`, `wheelafter`, etc.), `3dgs.mjs` (← t006 bench.mjs ; `addlcc2.mjs` fusionné en fonction ou fichier `ajout-lcc2.mjs`), `nuage-ply.mjs` (← t017 genply.mjs), `purge.mjs` (← t012 bench-rm.mjs + rm.mjs en sous-commande ou `purge-analyse.mjs`), `README.md`
- [ ] 0 chemin absolu : `rg -n "/home/|/tmp/|scratchpad" G/e2e/bench-preview` → 0 ; imports `from 'playwright-core'` (comme `G/e2e/bench-3d.mjs:12`) ; imports locaux relatifs `./lib.mjs`, `./png.mjs`
- [ ] config : `BASE` OBLIGATOIRE (erreur claire si absent, pas de port par défaut de session) ; `OUT` défaut `./out-bench` ; autres variables conservées (CASE, DT, MODE, LABEL, DOLLY, PRESET, SWS, GPU…) et listées en tête de chaque script (commentaire ≤ 12 l : but, variables, sortie, prérequis)
- [ ] README.md (≤ 80 l) : prérequis (`node e2e/bench-tileset.mjs`, API mémoire, `vite preview --outDir`, cf. note vault non citée), une ligne d'exemple par script, ce que chaque script mesure, rappel « mesure, ne juge pas », 3DGS = copie de `seed-data/.../3dgs` dans le STORE (jamais écrire dans seed-data)
- [ ] syntaxe : `for f in G/e2e/bench-preview/*.mjs; do node --check $f; done` → 0 erreur (sortie collée) ; `cd G/e2e && node -e "import('./bench-preview/lib.mjs').then(()=>console.log('ok'))"` → ok (import sans BASE ne doit pas lancer de navigateur ; l'erreur BASE n'est levée qu'à l'usage)
- [ ] 0 exécution du banc requise (pas de serveur) ; 0 fichier hors `G/e2e/bench-preview/`
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
`S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `S/t024.sPuc/{lib,png,o,o3,h,z,sv2,sv3}.mjs` | L | sources (48, 40, 95, 64, 27, 98, 81, 104 l) |
| `S/t006.ZVgg/{bench,addlcc2}.mjs` | L | 3DGS (177, 5 l) |
| `S/t017.iDDQ/genply.mjs` | L | nuage PLY (18 l) |
| `/tmp/t012-4kOe/{bench-rm,rm}.mjs` | L | purge (225, 11 l) |
| `G/e2e/bench-3d.mjs` | L | :1-20 style d'en-tête, import playwright-core |
| `G/e2e/bench-preview/` | E (neuf) | destination |

## Contrats
Sources : `import { chromium } from '/home/…/e2e/node_modules/playwright-core/index.mjs'` ⇒ `from 'playwright-core'` ; `BASE = process.env.BASE || 'http://localhost:51xx'` ⇒ obligatoire ; lancement GPU `chromium.launch({ headless: true, channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist','--no-sandbox'] })` (SwiftShader si `SWS=1`) à conserver ; comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203`.
`G/e2e` : `package.json` + `node_modules/playwright-core` (1.61.0) ; scripts existants `bench-3d.mjs`, `bench-tileset.mjs` (ne pas modifier).

## Décisions actées
- humain : « copie les scripts dans e2e et commite » (commit par le chef)
- scripts = mesures, pas des tests CI (pas de playwright.config, pas d'assertion bloquante)

## Hors périmètre
- code viewer, `G/e2e/*.mjs` existants, package.json ; lancer serveurs ou navigateur ; commit, push

## Environnement
- node v22.22.1 ; G git local master (HEAD b551616)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Bash(node --check, node -e, rg, ls, mkdir, wc)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T026
statut: fait | bloque
---
## Fait
- chemin — source · lignes
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
