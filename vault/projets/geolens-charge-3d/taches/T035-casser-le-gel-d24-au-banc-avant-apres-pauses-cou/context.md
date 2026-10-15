---
pack: T035
projet: geolens-charge-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T035 — Casser le gel D24 au banc

> Seule source de vérité de l'agent T035. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter la livraison T032 : « caméra en mouvement ⇒ 0 nouveau téléchargement de tuile ; reprise après 500 ms d'immobilité continue ; tuiles déjà chargées affichées ». Mesure au banc headless local AVANT (HEAD, sans gel) vs APRÈS (arbre de travail), captures + compte des requêtes, puis cas limites. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] tileset DEPTH=6 (1365 glb) ⇒ streaming réel ; si tout est chargé avant drag, rapprocher la caméra (molette) avant de mesurer
- [ ] AVANT vs APRÈS, même scénario, contexte neuf chacun : reqMouvement, reqArret, delaiRepriseMs, total requêtes, tuiles chargées/visibles/profondeur max par phase ; 3 PNG chacun (avant/mouvement/apres)
- [ ] cas 1 pauses courtes : drag avec arrêts de 300 ms (souris enfoncée immobile) ⇒ 0 requête démarrée pendant toute la séquence ; puis arrêt ≥ 500 ms ⇒ reprise
- [ ] cas 2 molette (dolly) continue 4 s ⇒ gel ; cas 3 animation caméra (touche `7` vue de dessus ou `0` iso) ⇒ gel pendant l'animation
- [ ] cas 4 vue ortho (touche `5` dans l'iframe, ou bouton `[data-view="perspective"]`) puis drag : le gel se déclenche-t-il ? LOD suit-il ? (soupçon : `setCamera` posé 1× sur la caméra perspective, Loader:206)
- [ ] cas 5 délai de reprise : écart mouse.up → `[motion-gate] reprise` et → 1re requête ; amortissement caméra (camPos qui bouge encore après mouse.up ?) — chiffrer
- [ ] cas 6 tuiles déjà chargées affichées pendant le gel (capture mouvement ≠ vide) ; 0 pageerror ; statuts HTTP 200/304 seulement
- [ ] relecture du diff T032 (`git -C G diff web/src/viewer/loaders/TilesRendererLoader.ts` + motionGate.ts) : 1 seul écrivain runtime de maxJobs, scheduleJobRun à la reprise ; `npm --prefix G/web test` vert collé
- [ ] verdict : OK | DÉFAUTS (chaque défaut = repro + attendu/obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T` (scripts de scénario dérivés du banc).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `G/e2e/bench-3d.mjs` | L | scénario de base (171 l) à copier/adapter dans $T |
| `G/e2e/bench-tileset.mjs` | L | DEPTH, TEX |
| `G/web/src/viewer/core/motionGate.ts` | L | contrat livré |
| `G/web/src/viewer/core/motionGate.test.ts` | L | tests livrés |
| `G/web/src/viewer/loaders/TilesRendererLoader.ts` | L | :619-640 gel, :708-720 pose, :767-770 œil |
| `G/web/src/viewer/core/errorTargetRefine.ts` | L | poseChanged |

## Contrats
```ts
export const MOTION_STILL_MS = 500;
export function loadsAllowed(nowMs: number, lastMoveMs: number, stillMs = MOTION_STILL_MS): boolean
export function downloadJobs(s: { moving: boolean; vramThrottled: boolean; streamingActive: boolean; normal: number }): number
```
Observables T032 : console `[motion-gate] gel` / `[motion-gate] reprise (immobile ≥ 500 ms)` · `window.__glrMotionGate = {allowed, transitions}` · `window.__glrTiles.downloadQueue.maxJobs` 0 en mouvement · fetch en vol finissent (accepté) · 1ʳᵉ frame = mouvement ⇒ gel 500 ms à l'ouverture (accepté) · animation d'entrée = mouvement (accepté)
T034 (1er run, DEPTH=4) : maxJobs=0 sur 28/28 échantillons ; reprise 1035 ms après mouse.up ; tout chargé avant drag ⇒ reqMouvement=0 non probant.
Banc — commandes (T034, ports DÉDIÉS à T035 : API 4011, web 5181, dist propre) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out
cd $G && STORE=$STORE DEPTH=6 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
# AVANT = HEAD sans C3 ni gel (non commités) :
mkdir -p $T/avant && git -C $G archive HEAD web | tar -x -C $T/avant && ln -s $G/web/node_modules $T/avant/web/node_modules
cd $T/avant/web && npx vite build --outDir $T/dist-avant > $T/build-avant.log 2>&1
cd $G/api && (PORT=4011 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5181 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4011 nohup npx vite preview --port 5181 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
cd $G && BASE=http://localhost:5181 OUT=$OUT LABEL=apres node e2e/bench-3d.mjs
# pour AVANT : tuer le preview, relancer avec --outDir $T/dist-avant, LABEL=avant
ss -ltnp | grep -E ':(4011|5181)\b' ; kill <pids> ; ss -ltn | grep -E ':(4011|5181)\b' → ∅
```
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203`
- contexte Playwright NEUF par run (tuiles `immutable` 24 h)
- caméra non exposée : souris sur `frame.locator('canvas').first()` ; touches clavier : focus canvas puis `page.keyboard.press`

## Décisions actées
- D24 : levier maxJobs=0 ; update() continue ; fetch en vol non annulés ; animations programmées = mouvement
- verdict seulement ; 0 correction ; 0 modification dans G (hors web/dist interdit aussi : utiliser --outDir $T)

## Hors périmètre
- modifier G (src, e2e, dist) ; serveur de test ; commit, push, git destructif
- ports 4000, 5173, 4010, 5180, 4012-4013, 5182-5183 (autres agents)

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium_headless_shell-1228 installé
- 16 cœurs ; 2 autres bancs tournent en parallèle (ports 4012/5182, 4013/5183) ⇒ délais absolus bruités : comparer AVANT/APRÈS dans des conditions égales, répéter 2× si écart < 20 %
- project.json : `deliverables[]` requis (géré par bench-tileset.mjs)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff/archive/status, tar, ln, ss, kill, mktemp, ls), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T035
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures avant/après
| métrique | avant | après |
## Cas limites
- cas · attendu · obtenu · OK|DÉFAUT
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
