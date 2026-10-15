---
pack: T010
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T010 — Casser T009 au banc (H1, H4, H6, H15)

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T009 au banc headless local, AVANT (état mesuré par T002 = HEAD + correctifs antérieurs : prendre HEAD) vs APRÈS (arbre de travail) : (H6) l'affinage atteint 0,5 px à l'arrêt et l'image est plus fine ; (H1) à budget serré l'errorTarget n'oscille plus ; (H4) anisotropie maximale sur les textures des tuiles ; (H15) une tuile en 503 est redemandée et le trou disparaît. Captures + compte des requêtes. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] H6 : arrêt 15 s caméra proche (DEPTH=6, TEX=512) : errorTarget final (attendu APRÈS 0,5 ; AVANT 1), histogramme de profondeur visible, nb requêtes après l'arrêt, PNG AVANT/APRÈS même pose (+ recadrage zoomé si utile) ; idem avec tier GPU stubbé « discrete » (preset haute/maximale)
- [ ] H1 : `glr.tileCacheMB=600` : série errorTarget /250 ms sur 120 s à l'arrêt : nb de changements (AVANT : oscillation 1↔4 entre 75-81 s ; attendu APRÈS : pas d'oscillation), tuiles figées ?
- [ ] H4 : vue rasante ~10° : anisotropy des textures de tuiles (attendu APRÈS = max GL, 16) ; PNG AVANT/APRÈS même pose ; fps relevé (coût)
- [ ] H15 : 503 une fois sur 1 glb (`ctx.route`) : logs `[tile-retry]`, instants des relances (attendu ~2 s puis croissant), `__loadingState` final de la tuile (LOADED attendu), PNG trou AVANT / comblé APRÈS ; 503 permanent sur 1 glb : relances espacées 2/4/8/16… s plafond 60 s, pas de rafale
- [ ] non-régression : gel D24 (drag pendant chargement : maxJobs 0, ~0 requête) ; 0 relance pendant le mouvement ; 0 pageerror ; statuts 200/304 (hors 503 injectés)
- [ ] relecture diff T009 (`git -C G diff web/src/viewer/core/errorTargetRefine.ts web/src/viewer/loaders/TilesRendererLoader.ts` + `core/tileTextureQuality.ts`, `core/failedTileRetry.ts`) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 et `npx vitest run src/viewer/core` collés
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/t002-kWIp/probe.mjs` | L | sondes T002 (stub GPU :73, preset :79, tileCacheMB :83, route 503 :88) à copier dans $T |
| `G/e2e/bench-3d.mjs` | L | login, iframe |
| `G/e2e/bench-tileset.mjs` | L | DEPTH, TEX |
| `G/web/src/viewer/core/errorTargetRefine.ts` | L | contrat livré |
| `G/web/src/viewer/core/failedTileRetry.ts` | L | contrat livré |
| `G/web/src/viewer/core/tileTextureQuality.ts` | L | contrat livré |

## Contrats
T009 livré :
```
errorTargetRefine.ts : REFINE_FLOOR_PX = 0.5 ; final = Math.min(base, 0.5) à ≥ 3 s ; base/2 à ≥ 1,5 s ; refineGuard(prevBlocked, cachedBytes, maxBytes) bloque ≥ 0,9×max, débloque < 0,8×max ; shouldAutoRefine({ fusion, userOverride, guardBlocked })
tileTextureQuality.ts : applyAnisotropy(root, level): number — appelé sur load-model, level = renderer.capabilities.getMaxAnisotropy() lu 1×
failedTileRetry.ts : nextRetryDelayMs(attempt) = 2000 × 2^attempt plafond 60 000 ; stepFailedTileRetry(s, failed, loadsAllowed, now) → { state, relaunch } ; Loader : relance seulement si gel levé ; log `[tile-retry] relance n°<k> (<failed> tuiles)`
limites connues (T009) : attempt peut retomber à 0 si une relance échoue après plus que le délai courant ; tileset racine en échec non relancé
```
Mesures AVANT (T002) : H1 budget 600 Mo ⇒ ET 1→4→1→4→1 entre 75 et 81 s, tileCount figé 587 pendant 8 s ; budget 1024 Mio ratio max 0,852 ; H4 355/355 textures anisotropy=1, max GL 16, vue 10,4° ; H6 plancher 1 ; H15 1 seul 503 ⇒ `__loadingState=-1` (FAILED lib = -1), 1 seule requête en 21 s, trou visible.
Pièges T002 : souris gauche = TRANSLATION, rotation = bouton du MILIEU (navigationScheme.ts:26) ; clé preset `glr.settings.v1` ; stabilisation 90-121 s (plafond 90 s de bench-3d trop court) ; SwiftShader ⇒ tier « integrated » ⇒ standard forcé sans stub.
Banc — commandes (ports DÉDIÉS T010 : API 4016, web 5186) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
mkdir -p $T/avant && git -C $G archive HEAD web | tar -x -C $T/avant && ln -s $G/web/node_modules $T/avant/web/node_modules
cd $T/avant/web && npx vite build --outDir $T/dist-avant > $T/build-avant.log 2>&1
cd $G/api && (PORT=4016 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5186 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4016 nohup npx vite preview --port 5186 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
# AVANT : relancer le preview avec --outDir $T/dist-avant
ss -ltnp | grep -E ':(4016|5186)\b' ; kill <pids> ; ss -ltn | grep -E ':(4016|5186)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run
- AVANT = HEAD : sans gel D24 ni C3 (affinage 1,5 s/3 s absent : errorTarget d'entrée 0,75 mono) — comparer états finaux et images, pas les paliers

## Décisions actées
- D1 : détail max = erreur ≤ 0,5 px physique ; D24 gel conservé
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; serveur de test ; commit, push
- paliers temporels, purge de file (tâche suivante) ; near/far ; 3DGS
- ports 4000, 5173, 4010-4015, 5180-5185 (autres agents)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium_headless_shell-1228 ; SwiftShader lent (fps 5-7) ; GPU RTX 4070 Ti disponible (`channel: 'chromium'`, `--enable-gpu --use-angle=vulkan`) si SwiftShader trop lent
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json`
- d'autres bancs peuvent tourner ⇒ CPU partagé

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive, tar, ln, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T010
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
