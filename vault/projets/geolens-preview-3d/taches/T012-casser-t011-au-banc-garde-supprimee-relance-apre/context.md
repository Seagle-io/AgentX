---
pack: T012
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T012 — Casser T011 au banc

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T011 au banc headless local (GPU réel par défaut) : (D1) sans garde cache, l'affinage atteint 0,5 px à l'arrêt même à budget serré, sans oscillation ni thrash ; (D2) une tuile en 503 est redemandée et s'affiche ; (H9) la reprise du gel purge les tuiles hors vue ⇒ moins de requêtes inutiles ; (H11) image nette plus tôt après l'arrêt. Comparer AVANT = état T010 (rejouer ses repro) et HEAD si utile, vs APRÈS = arbre de travail. Captures + compte des requêtes. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] D1 : `SCEN=h1 PRESET=standard` (600 Mo et 1280 Mo) : série ET /250 ms sur 150 s, nb de changements, ET final (attendu 0,5), ratio cachedBytes/max, `isFull()`, requêtes /10 s à l'arrêt (attendu → 0, pas de boucle de chargement/déchargement), histogramme de profondeur ; PNG
- [ ] D2 : `SCEN=h15 FAILTILE=t/5_10_10.glb` 1 échec : 2e requête ≈ +2 s, état final LOADED (3), PNG tuile affichée ; 503 permanent 200 s : relances espacées 2/4/8/16/32/60 s (instants collés), pas de rafale
- [ ] H9 : scénarios dolly 5 crans et pan (scripts T003) : requêtes dont la tuile n'est pas utilisée au repos final / total (T003 AVANT : 72/512, 44/132), `__glrMotionGate.purged`, log `[motion-gate] purge` ; aucune tuile utilisée purgée (vérifier qu'aucune zone ne reste grossière : histogramme final, PNG)
- [ ] H11 : orbite (bouton MILIEU) puis arrêt : 1re requête après mouse.up, instant où ET = 0,5, temps jusqu'à net (T003 : ET bas atteint 4,1-8,9 s, net ≥ 11,7 s)
- [ ] non-régression : gel D24 (drag pendant chargement : maxJobs 0, ~0 requête) ; anisotropie 16 ; 0 pageerror ; statuts 200/304 (+503 injectés, 404×6 JSON optionnels connus)
- [ ] relecture diff T011 (`git -C G diff web/src/viewer/loaders/TilesRendererLoader.ts` ; `core/errorTargetRefine.ts`, `core/staleQueuePurge.ts` non suivis : lire en entier) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 et `npx vitest run src/viewer/core` collés
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/t010-030t/probe.mjs` | L | repro D1/D2 (SCEN=h1, h15, GPU=1) à copier dans $T |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t003.cFkC/dolly.mjs` | L | scénario dolly/pan |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t003.cFkC/analyse.mjs` | L | requêtes jetables, net |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t003.cFkC/bench-t003.mjs` | L | journal par requête |
| `G/web/src/viewer/core/errorTargetRefine.ts` | L | contrat livré |
| `G/web/src/viewer/core/staleQueuePurge.ts` | L | contrat livré |

## Contrats
T011 livré :
```
errorTargetRefine.ts : refinedErrorTarget(base, stillMs) : stillMs >= MOTION_STILL_MS (500) ⇒ min(base, 0.5), sinon base ; REFINE_STILL_MS et refineGuard supprimés ; shouldAutoRefine({ fusion, userOverride })
staleQueuePurge.ts : staleQueuedTiles(items, loadingState, frameCount) — LOADING et non (__lastFrameVisited === frameCount && __used)
Loader :660-674 reprise du gel : purge via lruCache.remove → log `[motion-gate] purge <n> tuiles hors vue` → scheduleJobRun() ; window.__glrMotionGate.purged cumulé
Loader :761-770 relance : traverse → tuiles FAILED (-1) → lruCache.remove → resetFailedTiles() ; échéancier 2000×2^k plafond 60 000 ; log `[tile-retry] relance n°<k> (<failed> tuiles)` ; seulement gel levé
```
AVANT (T010, mêmes scripts) : D1 ET 4 figé ratio 0,85 (standard) ; D2 1 hit, état 0 pendant 39 s, parent grossier affiché ; H4 223/223 anisotropy 16, fps 60,1 → 53,5.
AVANT (T003) : dolly 5 : 72/512 non utilisées, file à la reprise 180 ; pan 44/132 ; post-orbite : ET bas atteint 4,1-8,9 s après up, net ≥ 11,7 s (SwiftShader, machine saturée).
Pièges : souris gauche = TRANSLATION, orbite = bouton MILIEU (navigationScheme.ts:26) ; clé preset `glr.settings.v1` ; budget `glr.tileCacheMB` ; Cache Storage fait monter `loaded` sans requête (contexte neuf par run) ; cadrage d'entrée HEAD ≠ arbre ⇒ comparer histogrammes ; machine chargée par un job python externe (load 40-70/16) ⇒ GPU réel : `chromium.launch({ channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist'] })`.
Banc — commandes (ports DÉDIÉS T012 : API 4017, web 5187) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
cd $G/api && (PORT=4017 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5187 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4017 nohup npx vite preview --port 5187 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
ss -ltnp | grep -E ':(4017|5187)\b' ; kill <pids> ; ss -ltn | grep -E ':(4017|5187)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run

## Décisions actées
- D6 : garde cache supprimée (cache plein ⇒ la lib bloque d'elle-même) ; relance = retrait du LRU puis resetFailedTiles
- D5 : purge à la reprise ; plancher dès 500 ms ; D1 plancher 0,5 px ; D24 gel conservé
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; serveur de test ; commit, push ; 3DGS (T006)
- ports 4000, 5173, 4010-4016, 5180-5186 (autres agents)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 + headless_shell-1228 ; GPU RTX 4070 Ti
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive, tar, ln, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T012
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures avant/après
| id | métrique | avant | après |
## Défauts
- D1 · repro · attendu · obtenu
## Vérifié comment
commande → sortie brute ; chemins PNG/JSON
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
