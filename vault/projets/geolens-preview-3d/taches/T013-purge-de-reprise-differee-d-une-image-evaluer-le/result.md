---
tache: T013
statut: fait
---
## Fait
- V/core/motionGate.ts:L27-41 — `gateStep` pure : freeze / arm / resume / none
- V/core/motionGate.test.ts:L2,L36-61 — 5 tests gateStep (3 séquences DoD + arm gelé + ouvert)
- V/loaders/TilesRendererLoader.ts:L41 — import gateStep
- V/loaders/TilesRendererLoader.ts:L645 — `let resumeArmed = false`
- V/loaders/TilesRendererLoader.ts:L656-680 — updateMotionGate via gateStep ; arm ⇒ return sans effet
- resume : transitions++ → log reprise → purge `staleQueuedTiles(..., frameCount)` → `applyDownloadJobs()` → `scheduleJobRun()`
- freeze : transitions++ → log gel → `applyDownloadJobs()` (inchangé)
- `allowed` faux ⇒ resumeArmed = false (gateStep)
- hook inchangé : updateMotionGate avant affinage/update() ; affinage indépendant du gel
- log `[motion-gate] purge <n>` + `__glrMotionGate {allowed, transitions, purged}` inchangés ; écrit sur freeze/resume seulement

## Vérifié comment
```
cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo "exit $?" → exit 0
npx vitest run src/viewer/core/motionGate.test.ts → Test Files 1 passed (1) · Tests 13 passed (13)
npm test → Test Files 193 passed (193) · Tests 1816 passed (1816)
```
- repro bench `/tmp/t012-4kOe` (purge ≈ 0 en orbite proche) : NV — navigateur/bench hors outils autorisés

## Écarts
- ∅

## Pour la suite
- vérifier en bench : `cd /tmp/t012-4kOe && OUT=out LABEL=x PRESET=standard DOLLY=5 node bench-rm.mjs && node rm.mjs out/t003-x.json` → purge ≈ 0 orbite proche
- image N sans update() (œil coupé / canvas 0×0) ⇒ frameCount non incrémenté, purge N+1 sur traversée antérieure ; cas marginal non traité
- `__glrMotionGate` non mis à jour sur 'arm' — ajouter `armed` si le bench doit l'observer

## Retour sur le pack
- Manquait: ∅ (motionGate.ts existait déjà — « créer » vs « étendre » non précisé, sans gêne) | Inutile: staleQueuePurge.ts (contrat déjà recopié)
