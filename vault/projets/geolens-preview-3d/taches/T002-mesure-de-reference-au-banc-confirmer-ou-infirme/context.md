---
pack: T002
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T002 — Mesure de référence au banc, axes détail et affichage (H1-H8, H14, H15)

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Confirmer ou infirmer au banc headless local, chiffres et captures à l'appui, les hypothèses de perte de détail et de défauts d'affichage de la vue 3D (liste ci-dessous). État de référence = arbre de travail actuel. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] chaque hypothèse H1-H8, H14, H15 : CONFIRMÉE | INFIRMÉE | NON MESURABLE (raison) + chiffres + PNG
- [ ] H1/H6 : à l'arrêt 15 s, caméra proche (DEPTH=6, TEX=512) : errorTarget effectif, cachedBytes/maxBytesSize, isFull(), nb tuiles utilisées avec `__error > errorTarget` non remplacées ; capture ; refaire avec tier GPU stubbé « discrete » (preset haute/maximale)
- [ ] H2/H3 : parcours long (orbite + zoom 60 s) : logs `[vram-watchdog]` / `[vram] backpressure`, historique `lruCache.maxBytesSize` /1 s, maxJobs au repos final
- [ ] H4 : vue rasante (~10°) : `texture.anisotropy` des tuiles (traverse scène) vs `renderer.capabilities.getMaxAnisotropy()` ; capture
- [ ] H5 : touche `5` (ortho) : `__glrTest.cameraType`, `__glrTiles.cameras[0]` = caméra active ? ; stats.used avant/après zoom en ortho ; `[motion-gate]` au drag en ortho
- [ ] H8 : contexte `deviceScaleFactor` 1, 2, 3 : `__glrDiag().pixelRatio` et taille du drawing buffer (attendu après correctif : = dpr) ; changement de dpr en cours de session non relu ?
- [ ] H14 : captures à 3 distances (loin, moyen, très proche ≤ 2 m) : camera.near/far, artefacts de profondeur visibles
- [ ] H15 : `page.route` → 503 sur 1 glb précis 1 seule fois : état `__loadingState` de la tuile après 15 s (FAILED définitif ?), trou/flou à l'image
- [ ] process tués, ports libres ; `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T` (scripts dérivés du banc). `rg` ciblé autorisé dans G/web/src/viewer pour un sélecteur ou un hook.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/e2e/bench-3d.mjs` | L | scénario de base à copier/adapter dans $T |
| `G/e2e/bench-tileset.mjs` | L | DEPTH, TEX |
| `G/web/src/viewer/loaders/TilesRendererLoader.ts` | L | coordonnées des hypothèses |
| `G/web/src/viewer/core/errorTargetRefine.ts` | L | paliers, garde 90 % |
| `G/web/src/viewer/core/QualityPresets.ts` | L | presets, clamp tier :299-307 |
| `G/web/src/viewer/core/SceneManager.ts` | L | pixelRatio :181, near/far :163,:1388,:1506, togglePerspective :947-985 |

## Contrats
Hypothèses (T001) :
| id | chemin:L | soupçon |
|---|---|---|
| H1 | Loader:721-731 + lib base:286 | cache plein (octets textures comptés RGBA ×4/3) ⇒ `isFull()` bloque les requêtes ; garde `cachedBytes ≥ 0,9×max` ⇒ errorTarget remonte à base sans hystérésis |
| H2 | Loader:675-685 | watchdog `hardGpuCeil` rétrécit maxBytesSize ×0,8 (plancher 0,5 GiB), jamais restauré ; compte géom/tex hors tuiles |
| H3 | vramBackpressure.ts:22-27 + Loader:660 | maxJobs=0 bloqué sans éviction possible |
| H4 | Loader:167-198 | anisotropie jamais posée (=1) ⇒ flou en vue oblique |
| H5 | Loader:206 + SceneManager.ts:947-985 | setCamera 1× ⇒ en ortho LOD et gel suivent l'ancienne caméra |
| H6 | errorTargetRefine.ts:21-25 | plancher auto 1 px (décision humaine D1 : cible 0,5 px physique) |
| H7 | Loader:279-281 + main.ts:4490 | couche d'appoint `fusionMode:true` ⇒ 0 affinage (mesurer si atteignable au banc, sinon NON MESURABLE) |
| H8 | SceneManager.ts:181,541-585 | `setPixelRatio(min(dpr,2))` 1× ; jamais relu ; plafond 2 (D1 : dpr réel) |
| H14 | SceneManager.ts:163,1388,1506 ; main.ts:3366 | 4 formules near/far, ratio jusqu'à 5e6, pas de logarithmicDepthBuffer |
| H15 | lib base:679-708 | tuile FAILED jamais retentée (`resetFailedTiles` jamais appelé) |
Stub tier GPU (SwiftShader ⇒ « integrated » ⇒ standard forcé, regex main.ts:1498 sur `UNMASKED_RENDERER_WEBGL`) : `ctx.addInitScript` qui surcharge `WebGLRenderingContext.prototype.getParameter` et `WebGL2RenderingContext.prototype.getParameter` : param `0x9246` → `'NVIDIA GeForce RTX 3080'`, sinon appel d'origine.
Hooks iframe : `window.__glrTiles` (`.errorTarget`, `.lruCache.{cachedBytes,maxBytesSize,isFull()}`, `.downloadQueue.{maxJobs,items}`, `.stats`, `.cameras`, `.traverse(cb)` ; tuile `__error,__depth,__loadingState,__used,__visible,__inFrustum`) · `window.__glrTileMem` · `window.__glrDiag()` (pixelRatio, render, memory) · `window.__glrTest.{cameraType,camPos,camTarget}` · `window.__glrMotionGate`
Banc — commandes (ports DÉDIÉS à T002 : API 4012, web 5182, dist propre) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist > $T/build.log 2>&1
cd $G/api && (PORT=4012 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5182 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4012 nohup npx vite preview --port 5182 --strictPort --outDir $T/dist > $T/web.log 2>&1 &)
cd $G && BASE=http://localhost:5182 OUT=$OUT LABEL=ref node e2e/bench-3d.mjs
ss -ltnp | grep -E ':(4012|5182)\b' ; kill <pids> ; ss -ltn | grep -E ':(4012|5182)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run
- caméra non exposée : souris sur `frame.locator('canvas').first()` (gauche = orbite, molette = dolly) ; touches : focus canvas puis `page.keyboard.press`
- gel D24 actif : 0 téléchargement en mouvement, reprise après 500 ms immobile

## Décisions actées
- D1 : détail max = erreur ≤ 0,5 px physique ; dpr réel sans plafond
- D2 : référence au banc avant tout correctif ; 0 correction ici

## Hors périmètre
- modifier G (src, e2e, web/dist : utiliser --outDir $T) ; serveur de test ; commit, push
- ports 4000, 5173, 4010-4011, 4013, 5180-5181, 5183 (autres agents)
- H9-H13 (tâche T003)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium_headless_shell-1228 installé ; SwiftShader lent (~15-45 s de stabilisation)
- 16 cœurs, 2 autres bancs en parallèle ⇒ durées absolues bruitées (ne conclure que sur états/compteurs)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 160 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Verdicts
| id | verdict | chiffres | PNG |
## Détails
- Hn · scénario · obtenu
## Vérifié comment
commande → sortie brute ; chemins PNG/JSON ; scripts $T
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes (priorité des correctifs)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
