---
pack: T033
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-13
tags: [pack]
---

# Pack T033 — Reco banc headless local de la preview 3D

> Seule source de vérité de l'agent T033. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre les faits pour qu'un implémenteur écrive, sans exploration, un banc headless LOCAL (aucun accès au serveur de test) qui ouvre la vue 3D d'un projet, déplace la caméra par script, compte les requêtes de tuiles et prend des captures avant/après. Le dépôt n'a AUCUNE tuile b3dm/pnts/glb en local ⇒ le banc devra générer un tileset synthétique hors `seed-data/`. 0 modification, 0 serveur lancé. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] API locale sans Docker : commande exacte (`USE_MEM_DB=1`, `STORAGE_DRIVER=local`, racine de stockage local : variable + chemin:L dans config.ts), PORT ≠ 4000 (4000 = OrthoPro, intouchable) ; comptes démo semés (email, mot de passe, rôle) seed.ts:L ; projets démo et leur storage_prefix
- [ ] racine de stockage configurable vers un dossier temporaire hors `seed-data/` ? (variable, chemin:L) ; sinon comment ajouter un projet pointant vers un tileset synthétique sans écrire dans `seed-data/` (route API de création + champ prefix, ou seed via env) — chemin:L
- [ ] route tuile en driver local : URL servie, jeton `?token=`, en-têtes cache ; 302 désactivé en local ? (chemin:L)
- [ ] web : `vite.config.ts:55-80` dev vs preview, port, `VITE_API_TARGET` ; quel mode sert `viewer.html` ; port libre proposé (≠ 5173 OrthoPro ; 5180 utilisé par les preuves)
- [ ] ouverture de la vue 3D : URL, étapes UI (login, page projet, clic « Explorer en 3D », iframe `viewer.html?project=`), sélecteurs utilisés dans `e2e/proof-refine.mjs` / `e2e/diag-stream.mjs`
- [ ] Playwright : version, lancement chromium (args WebGL/swiftshader, `--enable-precise-memory-info`), comptage des requêtes de tuiles (motif URL), hooks fenêtre lisibles (`__glrTileMem`, autres `window.__glr*`), pilotage caméra depuis la page (objet global exposant caméra/contrôles ? chemin:L) — sinon souris simulée
- [ ] formats de contenu chargés par le TilesRenderer du viewer (b3dm, glb/gltf 3D Tiles 1.1, pnts ; plugins DRACO/KTX2/GLTFExtensions) : TilesRendererLoader.ts chemin:L ; exigences du tileset.json (geometricError, refine, boundingVolume, transform/géoréférencement attendu par le viewer)
- [ ] générer PNG/GLB en node sans dépendance neuve : `zlib.deflateSync` + `zlib.crc32` (node 22) dispo ? libs déjà présentes dans G/e2e/node_modules ou G/web/node_modules (pngjs, gltf-transform, three exporters) — chemins
- [ ] proposition de contrat banc ≤ 30 lignes : fichiers à créer (sous `G/e2e/`), commandes de démarrage, scénario (ouvrir · attendre stable · orbiter N s · arrêt · attendre), mesures (requêtes pendant mouvement, après arrêt, délai reprise, captures)
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule (G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online). `rg` libre dans G/api/src, G/web/src/viewer, G/e2e (hors node_modules sauf versions).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/api/src/config.ts` | L | env : port, storage, mem db |
| `G/api/src/seed.ts` | L | comptes/projets démo |
| `G/api/src/storage.ts` | L | rg ciblé : driver local, racine |
| `G/api/src/server.ts` | L | rg ciblé seulement : route tuile, création projet (3390 l, gelé) |
| `G/web/vite.config.ts` | L | dev/preview, proxy |
| `G/web/package.json` | L | scripts |
| `G/e2e/package.json` | L | playwright-core |
| `G/e2e/_proofEnv.mjs` | L | DIR, seuils |
| `G/e2e/proof-refine.mjs` | L | ouverture viewer, mesures |
| `G/e2e/diag-stream.mjs` | L | comptage tuiles |
| `G/web/src/viewer/loaders/TilesRendererLoader.ts` | L | rg ciblé : plugins, formats |
| `G/docker-compose.yml` | L | env de la pile locale (référence) |

## Contrats
```
interdits humains : 0 accès au serveur de test (82.65.97.67) ; seed-data/ intouché ; port 4000 et 5173 = OrthoPro, ne pas toucher
e2e connu : playwright-core 1.61.0 exige chromium_headless_shell-1228 (`npx playwright-core install chromium` dans e2e/) ; preview web :5180 + BASE=http://localhost:5180
web : vite.config.ts:62,73 `target: process.env.VITE_API_TARGET || 'http://localhost:4000'`
seed-data/storage/villelaure-real : tileset.json + pnts/tileset.json mais 0 fichier .b3dm/.pnts/.glb (seulement json, btree, sog, jpg, tif)
```

## Décisions actées
- D24 : vérif du gel = locale, headless ; serveur de test = accord humain
- outillage : 0 jsdom ; dev:api = `tsx watch` (toute édition api/src redémarre l'API)

## Hors périmètre
- modifier un fichier ; lancer API, web, navigateur, Docker
- serveur de test ; commit, push

## Environnement
- node v22.22.1 ; G git local master ; e2e/node_modules présent
- ports occupés : 4000 (node OrthoPro), 5173 (Vite OrthoPro) ; conteneur `orthopro-postgres` sans port publié

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls, node -e pour tester une API node, ss -ltn), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T033
statut: fait | bloque
---
## Démarrage local
- API · commande · chemin:L
- web · commande · port
## Projet et tileset de mesure
- fait · chemin:L
## Navigateur et mesures
- fait · chemin:L
## Contrat proposé du banc
```
≤ 30 lignes
```
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
