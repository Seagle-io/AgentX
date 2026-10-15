---
pack: T014
projet: geolens-preview-3d
role: verificateur
cree: 2026-10-14
tags: [pack]
---

# Pack T014 — Casser T013 au banc : purge différée

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter T013 : à la reprise du gel, la purge ne retire plus de tuiles utilisées (évaluée après une traversée au seuil affiné), sans casser gel, affinage, relance des tuiles en échec. Rejouer la repro T012-D1 sur un build NEUF de l'arbre de travail, GPU réel. Ne corrige rien. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] repro T012-D1 APRÈS (2 runs) : purge n, tuiles purgées redemandées dans les 2 s, tuiles purgées `__used` au repos ; attendu ≈ 0 (AVANT T013 : 128/128 et 129/129 redemandées) ; scénario pan + dolly arrière : purge > 0 seulement pour tuiles hors frustum/non utilisées
- [ ] non-régression : H9 requêtes inutiles ≈ 0 (T012 : 0/317 dolly, 0/162 orbite, 0/172 pan) ; H11 ET 0,5 ≈ 1 s après up, net (T012 : 2,56 s) ; gel D24 maxJobs 0 pendant drag ; relance 503 (`SCEN=h15`) 2e requête ≈ +2 s ; 0 pageerror
- [ ] relecture diff (`V/core/motionGate.ts` gateStep, Loader updateMotionGate) ; `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` exit 0 + `npx vitest run src/viewer/core/motionGate.test.ts` collés
- [ ] verdict OK | DÉFAUTS ; process tués, ports libres
- [ ] `result.md` selon « Format de sortie »

## Fichiers autorisés
Lecture seule dans G ; Write libre dans `$T` (copier les scripts de /tmp/t012-4kOe dans $T).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/t012-4kOe/bench-rm.mjs` | L | scénario repro (BASE, OUT, LABEL, DOLLY, DX, PRESET ; GPU par défaut, SWS=1 SwiftShader) |
| `/tmp/t012-4kOe/rm.mjs` | L | analyse purge / redemandes |
| `/tmp/t012-4kOe/bench-t003.mjs` | L | H9/H11 |
| `/tmp/t012-4kOe/analyse.mjs` | L | inutiles, net |
| `/tmp/t012-4kOe/probe.mjs` | L | SCEN=h15 |
| `G/web/src/viewer/core/motionGate.ts` | L | gateStep |

## Contrats
T013 livré : `gateStep(s: { gateAllowed, resumeArmed }, allowed) → { gateAllowed, resumeArmed, action: 'none'|'freeze'|'arm'|'resume' }` ; image N : arm (0 effet, maxJobs 0) ; image N+1 : resume = transitions++ → log `[motion-gate] reprise` → purge `staleQueuedTiles(items, LOADING, frameCount)` → `applyDownloadJobs()` → `scheduleJobRun()` ; mouvement ⇒ freeze, arm annulé. Cas non traité connu : image N sans update() (œil coupé, canvas 0×0).
Repro T012-D1 : `OUT=out LABEL=x PRESET=standard DOLLY=5 node bench-rm.mjs && node rm.mjs out/t003-x.json` (BASE à pointer sur le port T014).
Banc — commandes (ports DÉDIÉS T014 : API 4018, web 5188) :
```bash
G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
T=$(mktemp -d); STORE=$T/storage; OUT=$T/out; cp /tmp/t012-4kOe/*.mjs $T/
cd $G && STORE=$STORE DEPTH=6 TEX=512 node e2e/bench-tileset.mjs
cd $G/web && npx vite build --outDir $T/dist-apres > $T/build-apres.log 2>&1
cd $G/api && (PORT=4018 USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=$STORE WEB_ORIGIN=http://localhost:5188 SEED_DEMO=1 nohup npx tsx src/index.ts > $T/api.log 2>&1 &)
cd $G/web && (VITE_API_TARGET=http://localhost:4018 nohup npx vite preview --port 5188 --strictPort --outDir $T/dist-apres > $T/web.log 2>&1 &)
cd $T && BASE=http://localhost:5188 OUT=out LABEL=x PRESET=standard DOLLY=5 node bench-rm.mjs && node rm.mjs out/t003-x.json
ss -ltnp | grep -E ':(4018|5188)\b' ; kill <pids> ; ss -ltn | grep -E ':(4018|5188)\b' → ∅
```
- les scripts copiés peuvent référencer des chemins de /tmp/t012-4kOe : les adapter dans $T, ne rien écrire dans /tmp/t012-4kOe
- orbite = bouton MILIEU ; preset `glr.settings.v1` ; contexte Playwright NEUF par run

## Décisions actées
- D5/D6 purge à la reprise, plancher dès 500 ms, relance par retrait du LRU ; D24 gel conservé
- verdict seulement ; 0 modification dans G

## Hors périmètre
- modifier G ; serveur de test ; commit, push ; 3DGS
- ports 4000, 5173, 4010-4017, 5180-5187

## Environnement
- node v22.22.1 ; playwright-core 1.61.0 (G/e2e/node_modules) ; chromium-1228 ; GPU RTX 4070 Ti ; machine chargée par un job externe
- typecheck viewer = `npx tsc --noEmit -p tsconfig.viewer.json`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash (node, npx, cp, ss, kill, mktemp, ls, rg, git diff), Write (dans $T et result.md seulement)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T014
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Mesures
| métrique | T012 (avant T013) | après |
## Défauts
- D1 · repro · attendu · obtenu
## Vérifié comment
commande → sortie brute ; chemins JSON
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
