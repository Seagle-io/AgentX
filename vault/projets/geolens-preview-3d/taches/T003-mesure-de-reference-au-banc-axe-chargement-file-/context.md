---
pack: T003
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T003 — Mesure de référence au banc, axe chargement (H9-H13)

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Confirmer ou infirmer au banc headless local, chiffres à l'appui, les hypothèses de chargement inefficace de la vue 3D (H9-H13), et produire les métriques de référence du chargement : requêtes totales, requêtes « jetables » (tuile jamais visible au repos), temps jusqu'à image nette. État de référence = arbre de travail actuel. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] journal par requête (url, profondeur déduite du nom de fichier glb, t début, t fin, statut) via `ctx.on('request'|'requestfinished'|'requestfailed')`
- [ ] métrique « net atteint » horodatée, sondée /250 ms : `stats.downloading===0 && stats.parsing===0 && downloadQueue.items.length===0` ET errorTarget au plancher de la phase ; temps depuis clic « Explorer en 3D » et depuis mouse.up
- [ ] H9 : balayage caméra (orbite 180° en 6 s puis arrêt 15 s) : requêtes dont la tuile n'est pas `__used` au repos final / total ; `downloadQueue.items.length` au moment de la reprise
- [ ] H10 : requêtes lancées dans les 500 ms après `[motion-gate] reprise` ; part hors frustum final
- [ ] H11 : requêtes par vague d'affinage (0,5 s base · 1,5 s base/2 · 3 s 1 px) après arrêt ; temps jusqu'à net
- [ ] H12 : horodatage des requêtes par profondeur à l'ouverture ⇒ cascade (Σ latences par niveau)
- [ ] H13 : `PerformanceObserver` longtask (addInitScript) pendant l'ouverture DEPTH=6 : nb, durée totale, max ; corrélation avec arrivées de tuiles
- [ ] tableau de référence : ouverture (requêtes, Mo, temps jusqu'à net) · balayage (requêtes, jetables, temps jusqu'à net après arrêt) — 2 runs chacun
- [ ] process tués, ports libres ; `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T` (scripts dérivés du banc).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/e2e/bench-3d.mjs` | L | scénario de base à copier/adapter dans $T |
| `G/e2e/bench-tileset.mjs` | L | nommage des glb (profondeur), DEPTH |
| `G/web/src/viewer/loaders/TilesRendererLoader.ts` | L | :565-603 handlers load-model, :619-640 gel |
| `G/web/src/viewer/core/errorTargetRefine.ts` | L | paliers |
| `G/web/src/viewer/core/motionGate.ts` | L | gel 500 ms |

## Contrats
Hypothèses (T001) :
| id | chemin:L | soupçon |
|---|---|---|
| H9 | lib base:13-40, 256-265, 620-659 | file jamais purgée sans pression LRU (< 7200 items, < minBytes) ⇒ tuiles hors vue téléchargées ; tri profondeur avant frustum |
| H10 | Loader:626,639 + motionGate.ts | update() empile pendant le gel ⇒ rafale de tuiles de poses intermédiaires à la reprise |
| H11 | errorTargetRefine.ts:21-25 | escalier 0,5 s → 1,5 s → 3 s ⇒ 3 vagues, net ≥ 3 s |
| H12 | lib traverseFunctions.js:402-415 | niveau d+1 demandé seulement quand d chargé ⇒ temps net ≈ Σ latences par niveau |
| H13 | Loader:565-576, :601-603 ; main.ts:3433 | traverse complet de l'arbre + de la scène à CHAQUE tuile chargée ⇒ longues tâches |
Paliers actuels : `REFINE_STILL_MS = 1500` ; `refinedErrorTarget(base, stillMs)` : ≥ 3 s → min(base,1) ; ≥ 1,5 s → max(base/2, floor) ; sinon base. Preset effectif au banc = standard (base 4) car SwiftShader ⇒ tier « integrated ».
Gel D24 : console `[motion-gate] gel` / `[motion-gate] reprise (immobile ≥ 500 ms)` ; `window.__glrMotionGate`.
Hooks iframe : `window.__glrTiles` (`.errorTarget`, `.stats.{downloading,parsing,used,visible,inFrustum}`, `.downloadQueue.{maxJobs,items}`, `.lruCache`, `.traverse(cb)` ; tuile `__depth,__used,__visible,__inFrustum,__loadingState`, `content.uri`) · `window.__tileCount` · `window.__glrTest.camPos()`
Banc — commandes (ports DÉDIÉS à T003 : API 4013, web 5183, dist propre) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=6 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist > $T/build.log 2>&1
cd $G/api && (PORT=4013 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5183 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4013 nohup npx vite preview --port 5183 --strictPort --outDir $T/dist > $T/web.log 2>&1 &)
cd $G && BASE=http://localhost:5183 OUT=$OUT LABEL=ref node e2e/bench-3d.mjs
ss -ltnp | grep -E ':(4013|5183)\b' ; kill <pids> ; ss -ltn | grep -E ':(4013|5183)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run (tuiles `immutable` 24 h)
- caméra non exposée : souris sur `frame.locator('canvas').first()` (gauche = orbite, molette = dolly)

## Décisions actées
- D2 : référence au banc avant tout correctif ; 0 correction ici
- gel D24 conservé

## Hors périmètre
- modifier G (src, e2e, web/dist : utiliser --outDir $T) ; serveur de test ; commit, push
- ports 4000, 5173, 4010-4012, 5180-5182 (autres agents)
- H1-H8, H14, H15 (tâche T002)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium_headless_shell-1228 installé ; SwiftShader lent
- 16 cœurs, 2 autres bancs en parallèle ⇒ durées absolues bruitées : 2 runs, rapporter min/max

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 160 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Référence chargement
| scénario | run | requêtes | Mo | jetables | net (ms) |
## Verdicts
| id | verdict | chiffres |
## Vérifié comment
commande → sortie brute ; chemins JSON ; scripts $T
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes (correctifs à plus fort gain)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
