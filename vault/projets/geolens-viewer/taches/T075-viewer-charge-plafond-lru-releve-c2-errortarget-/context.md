---
pack: T075
projet: geolens-viewer
role: implementeur
cree: 2026-10-09
---

# Pack T075 — Viewer charge : plafond LRU relevé (C2) + errorTarget preset à l'entrée et affinage à l'arrêt (C3)

> Seule source de vérité de l'agent T075. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Mission humaine « 3 correctifs de charge » (D24) : (C2) relever le plafond d'items du LRU des tuiles ; (C3) appliquer l'errorTarget du preset à l'entrée en mono web puis l'affiner par paliers quand la caméra est immobile, le remonter au mouvement, sans casser le slider HUD ; (C1) vérifier par curl que le rate-limit est déjà par IP réelle ; écrire `RAPPORT_CHARGE_CORRECTIFS.md` à la racine de G. AUCUN COMMIT. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, V = G/web/src/viewer.

## Definition of Done
- [ ] C2 · TilesRendererLoader.ts:305-310 → `{ econome: 4000, standard: 8000, haute: 12000, maximale: 16000 }`, défaut :311 → 8000 ; minSize 0,9× inchangé (:315) ; commentaire :299-304 réécrit (contrat) ; 0 autre ligne C2
- [ ] C3 · `V/core/errorTargetRefine.ts` NEUF = contrat ; `errorTargetRefine.test.ts` NEUF : cas listés, verts
- [ ] C3 · TilesRendererLoader.ts:286-289 : constante 0,75 supprimée, entrée = `entryErrorTarget(...)` ; état d'affinage + détection de pose dans le `scene.onBeforeRender` existant (~:620-709), AVANT `tilesRenderer.update()` ; mono seulement (`fusionMode !== true`) ; `tilesRenderer.userData`/objet scène expose `setErrorTargetBase(v, fromUser)` (contrat)
- [ ] C3 · qualityHud.ts:333 (et :478) : passe par `setErrorTargetBase(v, true)` si présent, sinon écriture directe actuelle (repli)
- [ ] C1 · vérif curl (contrat) : sorties brutes collées ; 0 modification api/
- [ ] `RAPPORT_CHARGE_CORRECTIFS.md` NEUF à la racine de G = plan contrat ; mesures navigateur avant/après marquées « en attente » (jamais de chiffre inventé)
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web run build:viewer-types` → exit 0 ; `npm --prefix web test` → verts (base 179 fichiers / 1708 tests) — sorties collées
- [ ] `git -C G status --short` collé ; 0 commit (D24)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | E | :240-320 ; :610-710 onBeforeRender |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/errorTargetRefine.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/errorTargetRefine.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/qualityHud.ts` | E | :320-365, :470-480 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/RAPPORT_CHARGE_CORRECTIFS.md` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/QualityPresets.ts` | L | errorTarget, cacheBudgetGiB par preset |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/packs/architecte/index.ts` | L | :650-680 capture (force 1 puis restaure) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | TRUST_PROXY, RATE_LIMIT (vérif C1) |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/taches/T074-reco-charge-viewer-errortarget-d-entree-detectio/result.md` | L | coordonnées détaillées, pièges |

## Contrats
```ts
// ═══ V/core/errorTargetRefine.ts (NEUF, pur, 0 import)
export const REFINE_STILL_MS = 1500;              // immobile ≥ 1,5 s → palier 1 ; ≥ 3 s → palier 2
export function entryErrorTarget(presetET: number, fusion: boolean, scale: number): number;   // fusion ? presetET * scale : presetET
export function refinedErrorTarget(base: number, stillMs: number): number;
//   stillMs ≥ 2 × REFINE_STILL_MS → Math.min(base, 1) ; ≥ REFINE_STILL_MS → base / 2 (jamais < Math.min(base, 1)) ; sinon base
export function poseChanged(prev: Float32Array | number[] | null, next: ArrayLike<number>, eps?: number): boolean;  // prev null → true ; |Δ| > eps (défaut 1e-6) sur un des 16+16 termes (matrixWorld + projectionMatrix)
export function shouldAutoRefine(s: { fusion: boolean; userOverride: boolean; cachedBytes: number; maxBytes: number }): boolean;
//   !fusion && !userOverride && !(maxBytes > 0 && cachedBytes >= 0.9 * maxBytes)   // pas d'affinage si le cache est presque plein (anti-thrash)

// ═══ TilesRendererLoader.ts — CIBLE
// :286-289 ACTUEL : const MONO_WEB_ENTRY_ERROR_TARGET = 0.75; tilesRenderer.errorTarget = options.fusionMode === true ? preset.errorTarget * errorTargetScale : MONO_WEB_ENTRY_ERROR_TARGET;
// → const base0 = entryErrorTarget(preset.errorTarget, options.fusionMode === true, errorTargetScale); tilesRenderer.errorTarget = base0;
//   état local : { base: base0, userOverride: false, lastPose: null, lastMoveMs: performance.now(), applied: base0 }
//   commentaire au-dessus : remplacer l'explication du 0,75 par « preset à l'entrée (D24) ; modèle complet à l'arrêt = affinage par paliers dans onBeforeRender ; historique 0,75 : audit C-01 »
//   exposer sur l'objet racine du tileset (là où userData.tilesRenderer est posé) : userData.setErrorTargetBase = (v: number, fromUser: boolean) => { base = v; userOverride = fromUser; applied = v; tilesRenderer.errorTarget = v; }
// onBeforeRender (avant tilesRenderer.update()) :
//   pose = cam.matrixWorld.elements + cam.projectionMatrix.elements ; if (poseChanged(lastPose, pose)) { lastMoveMs = now; lastPose = copie }
//   t = shouldAutoRefine({ fusion, userOverride, cachedBytes: lru.cachedBytes ?? 0, maxBytes: lru.maxBytesSize ?? 0 }) ? refinedErrorTarget(base, now - lastMoveMs) : base
//   if (t !== applied) { tilesRenderer.errorTarget = t; applied = t; }   // écriture SEULEMENT sur changement (n'écrase pas la capture architecte qui force 1 puis restaure)
// :305-311 C2 : itemCapByPreset 4000 / 8000 / 12000 / 16000, défaut 8000
// :299-304 commentaire C2 → « filet COUNT au-dessus des modèles réels (modèle test 4 558 tuiles : cap 2000 = 17 680 requêtes) ; l'éviction est pilotée par les OCTETS (maxBytesSize = cacheBudgetBytes(preset)) ; le crash historique à ~6 600 tuiles (cap 20 000) précède l'éviction par octets ; watchdog hardGpuCeil (min(4500, budget VRAM)) inchangé »
// ═══ qualityHud.ts:333 ACTUEL : tr.errorTarget = sliderToErrorTarget(pct, preset)   (absolu ; 50 % = preset)
// → const v = sliderToErrorTarget(pct, preset); const set = obj.userData.setErrorTargetBase; set ? set(v, pct !== 50) : (tr.errorTarget = v);
//   (slider à 50 % = défaut → userOverride false → l'affinage à l'arrêt reste actif ; autre position → le choix utilisateur gagne, 0 affinage)
//   :478 (réapplication 200 ms après reload) : même chemin
```
```bash
# C1 — vérif (cwd G/api ; pg-mem ; port libre 4120 ; tuer le process à la fin)
USE_MEM_DB=1 STORAGE_DRIVER=local STORAGE_LOCAL_ROOT=../seed-data/storage JWT_SECRET=t075-verif-0123456789abcdefghijkl PORT=4120 WEB_ORIGIN=http://localhost:5180 RATE_LIMIT=1 TRUST_PROXY=loopback npx tsx src/index.ts &
curl -si http://127.0.0.1:4120/api/health -H 'X-Forwarded-For: 1.1.1.1' | grep -i x-ratelimit-remaining   # attendu 299
curl -si http://127.0.0.1:4120/api/health -H 'X-Forwarded-For: 2.2.2.2' | grep -i x-ratelimit-remaining   # attendu 299 (compteurs distincts)
# puis relancer SANS TRUST_PROXY → 299 puis 298 (XFF ignoré, anti-spoof)
```
Plan du RAPPORT_CHARGE_CORRECTIFS.md (sections) : Contexte (k6 08/10) · C1 trustProxy (déjà en place : config.ts proxyList + server.ts Fastify trustProxy, quota tuiles par compte — coordonnées ; vérif curl ; risque : API jamais exposée sans Caddy — compose prod sans `ports:` sur api) · C2 (fichier:ligne, avant/après valeurs, piège watchdog 4500) · C3 (fichier:ligne, mécanique paliers, slider, cas fusion/architecte) · Mesures navigateur avant/après : « en attente » · Effets de bord.
Cas errorTargetRefine.test.ts : entry mono 4 → 4 ; fusion 4×0.5 → 2 · refined(4, 0) → 4 ; (4, 1500) → 2 ; (4, 3000) → 1 ; (0.5, 3000) → 0.5 ; (1.5, 1500) → 1 (plancher) · poseChanged(null, x) → true ; identique → false ; Δ 1e-3 → true · shouldAutoRefine : fusion → false ; userOverride → false ; cache 95 % → false ; sinon true

## Décisions actées
- D24 : périmètre strict, PAS DE COMMIT ; D25 : correctifs web seuls, 0 contact BDD
- aucune détection d'immobilité n'existe (T074) → 1 seule, dans le onBeforeRender du loader (couvre orbite/fps/ortho)
- slider HUD gagne : position ≠ 50 % = choix utilisateur, 0 affinage auto
- pas d'affinage si cache ≥ 90 % des octets (anti-thrash)

## Hors périmètre
- watchdog hardGpuCeil, vramBackpressure, mergedScene (fusion), packs/architecte (lecture seule), QualityPresets
- api/ (vérif C1 par curl seulement) ; déploiement ; serveur de test (BDD intouchable, D25)
- commit, push, remote, PR (D24, D5) ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vitest env node (fonctions pures seulement) ; 3d-tiles-renderer 0.3.46 (LRUCache.d.ts ne déclare pas maxBytesSize/cachedBytes → accès typé `as unknown as { cachedBytes?: number; maxBytesSize?: number }`, comme le loader le fait déjà ~:640)
- G sous git HEAD da5fced, arbre propre ; seul agent sur G ; ports interdits 5173/5183

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web run typecheck, npm --prefix web run build:viewer-types, npm --prefix web test, npx vitest, npx tsx (API de vérif C1), curl, kill du seul process lancé, git status, git diff, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T075
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
