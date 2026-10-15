---
pack: T022
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T022 — Casser T021 au banc (+ non-régression T018/T019)

> Seule source de vérité de l'agent T022. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T021 : (D1) une vue enregistrée en ortho est restaurée à son zoom ; (D2) toute 1re entrée dans la vue (barre d'outils comprise) termine l'ouverture, sauf pendant l'accueil ; (D3) `__glrMotionGate` existe dès l'ouverture. Rejouer les repro T020 sur un build NEUF de l'arbre de travail, GPU réel ; vérifier que T018/T019 tiennent toujours. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] D1 : `sv.mjs` (T020) APRÈS : zoom restauré ≈ zoom sauvé (T020 : sauvé 44,087, obtenu 1,000), px/m ≈ sauvé ; variantes : vue enregistrée en PERSP restaurée en ortho ⇒ zoom recalé sur la distance (T019) ; vue ortho restaurée en persp ⇒ pas d'erreur, position/cible exactes ; ancienne vue sans zoom (localStorage injecté) ⇒ chargée ; zoom invalide (`-1`, `"x"`) ⇒ vue gardée sans zoom ; vol : pas de saut d'échelle visible (5 PNG pendant le vol)
- [ ] D2 : `CASE='view:[data-view="top"]' WAIT=3500 node o3.mjs` ⇒ log `[motion-gate] ouverture terminée (pointerdown)` puis gel pendant l'animation (T020 : 722 req, 0 gel) ; clic « Explorer » de l'accueil (`#gx-home-explore`) ⇒ PAS de fin d'ouverture, cadrage post-accueil sans gel ; 1re entrée après dismiss ⇒ fin
- [ ] D3 : `__glrMotionGate` défini dès la création du loader : `{ allowed: true, transitions: 0, purged: 0, openingExempt: true }`
- [ ] non-régression : O1 (0 gel à l'ouverture sans entrée, ≥ 300 req dans les 4 s ; T020 : 401) ; O2 (drag ⇒ maxJobs 0, ≈ 0 req) ; V1/V2 (`h.mjs`, `z.mjs` : vues programmées ortho à l'échelle, distance persp ≥ 0,5 m) ; 0 pageerror
- [ ] relecture diff T021 (`git -C G diff web/src/viewer/ui/savedViews.ts web/src/viewer/loaders/TilesRendererLoader.ts web/src/viewer/core/motionGate.ts` ; `savedViewZoom.ts` lu) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 + `npx vitest run src/viewer/core src/viewer/ui/savedViewZoom.test.ts` collés
- [ ] verdict OK | DÉFAUTS (repro, attendu, obtenu) ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T`. `S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad`.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `S/t020.vFMn/lib.mjs` | L | login, iframe, sondes |
| `S/t020.vFMn/sv.mjs` | L | repro D1 vues enregistrées |
| `S/t020.vFMn/o3.mjs` | L | repro D2 ouverture/clic toolbar |
| `S/t020.vFMn/o.mjs` | L | O1/O2 ouverture, drag |
| `S/t020.vFMn/h.mjs` | L | V1 vues ortho |
| `S/t020.vFMn/z.mjs` | L | V2/Z1-Z5 |
| `S/t020.vFMn/png.mjs` | L | PNG |
| `G/e2e/bench-tileset.mjs` | L | STORE + project.json |
| `G/web/src/viewer/ui/savedViewZoom.ts` | L | contrat livré |

## Contrats
T021 livré : `SavedView.camera.zoom?: number` (stocké seulement si ortho à l'enregistrement) ; `parseSavedViews` : zoom invalide ⇒ vue sans zoom ; `flightZoom(savedZoom, isOrtho, startZoom, e)` ⇒ null si pas ortho ou zoom absent, sinon start + (saved − start)·e ; flyTo : `zoomTo(z, false)` après chaque `setLookAt(..., false)` ; `endsOpening(homeOpen) ⇒ !homeOpen` ; écouteurs d'ouverture sur `document` (capture, passive) : pointerdown/wheel/touchstart/keydown ; ignorés tant que `body.gx-home-open` ; `publishMotionGate` à la création.
T018/T019 (déjà vérifiés T020) : ouverture sans gel, gel après 1re entrée (stamp = now) ; enveloppe `setLookAt` ortho ⇒ zoom = distance ; bornes de zoom en distance ; O→P ≥ minDistance.
D8 (chef) : 1re entrée = n'importe où dans la vue, sauf pendant l'accueil ; vue d'accueil 🏠 (homeView.ts) : zoom ortho non stocké (connu, hors tâche).
Mesures T020 : D1 zoom 1,000 vs 44,087 sauvé ; D2 722 req, maxJobs 12, 0 gel ; D3 undefined ×138 ; O1 401 req/4 s, 0 gel ; O2 drag 0 req ; V1 Accueil zoom 0,55 fond 89 % ; V2 persp 0,500 m.
Banc — commandes (ports DÉDIÉS T022 : API 4013, web 5183) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
S=/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad
T=$(mktemp -d -p $S t022.XXXX); STORE=$T/storage; cp $S/t020.vFMn/*.mjs $T/
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
cd $G/api && (PORT=4013 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5183 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4013 nohup npx vite preview --port 5183 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
ss -ltnp | grep -E ':(4013|5183)\b' ; kill <pids> ; ss -ltn | grep -E ':(4013|5183)\b' → ∅
```
- AVANT = mesures T020 ci-dessus (pas de rebuild HEAD nécessaire)
- scripts copiés : chemins/ports T020 identiques (4013/5183) — vérifier $T
- comptes `admin@demo.geolens.fr` / `demo1234` ; projet `0a1b2c3d-0000-4000-8000-000000000203` ; contexte Playwright NEUF par run
- GPU : `chromium.launch({ headless: true, channel: 'chromium', args: ['--enable-gpu','--use-angle=vulkan','--ignore-gpu-blocklist','--no-sandbox'] })`

## Décisions actées
- D7, D8 ; D24 ; minDistance 0,5 m
- verdict seulement ; 0 modification dans G (web/dist compris : --outDir $T)

## Hors périmètre
- modifier G ; seed-data ; serveur de test ; commit, push ; 3DGS ; EDL ; vue d'accueil 🏠
- ports autres que 4013/5183

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 ; GPU RTX 4070 Ti ; machine chargée par un job externe (durées faussées, comptes fiables)
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json` ; dernier `npm test` : 196 fichiers / 1847 tests

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, git diff, cp, mkdir, ss, kill, mktemp, ls, rg), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T022
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures
| id | métrique | T020 (avant T021) | après |
## Défauts
- D1 · repro · attendu · obtenu
## Vérifié comment
commande → sortie brute ; chemins PNG/JSON ; renderer WebGL
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
