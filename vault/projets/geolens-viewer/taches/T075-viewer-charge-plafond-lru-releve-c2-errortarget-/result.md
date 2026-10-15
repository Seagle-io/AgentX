---
tache: T075
statut: fait
---
G = Geolens/geolens-web-feat-viewer-online · V = G/web/src/viewer · L = V/loaders/TilesRendererLoader.ts
## Livré
- L:35-36 — import errorTargetRefine
- L:266-280 — 0,75 supprimé ; entrée preset ; état refine + scratch pose
- L:292-303 — C2 cap 4000/8000/12000/16000, défaut 8000, commentaire réécrit
- L:341-348 — rootGroup.userData.setErrorTargetBase(v, fromUser)
- L:681-701 — pose + paliers avant update(), écriture sur changement
- L:~708 — commentaire update() aligné (affinage par paliers)
- V/core/errorTargetRefine.ts:1-46 — NEUF, pur, contrat verbatim
- V/core/errorTargetRefine.test.ts:1-66 — NEUF, 13 cas du pack
- V/ui/qualityHud.ts:328-340 — applyDetailLevel → setErrorTargetBase(v, pct≠50) sinon repli
- G/RAPPORT_CHARGE_CORRECTIFS.md — NEUF, plan contrat, mesures « en attente »
## Vérifié comment
- `npm --prefix web run typecheck` → `typecheck exit=0`
- `npm --prefix web run build:viewer-types` → `viewer-types exit=0`
- `npm --prefix web test` → `Test Files  180 passed (180)` · `Tests  1721 passed (1721)` (base 179/1708 + 1/13)
- C1 TRUST_PROXY=loopback : XFF 1.1.1.1 → `x-ratelimit-remaining: 299` · XFF 2.2.2.2 → `x-ratelimit-remaining: 299`
- C1 sans TRUST_PROXY : → `x-ratelimit-remaining: 299` puis `x-ratelimit-remaining: 298` ; process tué → `4120 libre`
- `git -C G status --short` →
```
 M web/src/viewer/loaders/TilesRendererLoader.ts
 M web/src/viewer/ui/qualityHud.ts
?? RAPPORT_CHARGE_CORRECTIFS.md
?? web/src/viewer/core/errorTargetRefine.test.ts
?? web/src/viewer/core/errorTargetRefine.ts
```
- `git log -1` → `da5fced` (0 commit) · `git diff api/ | wc -l` → 0
## Écarts
- lecture hors WL 1/3: rg `userData.tilesRenderer` V → FileManager.ts:262 — où poser le setter
- lecture hors WL 2-3/3: rg `trustProxy|keyGenerator` api/src + compose + .env.production.example — coordonnées C1 du rapport (server.ts:155, :739, tileRateKey.ts:8, compose prod:59, scaleway:32, .env.production.example:13)
- qualityHud.ts:478 (→ :482) non édité — appelle applyDetailLevel, même chemin
- setErrorTargetBase exposé aussi en fusion — shouldAutoRefine(fusion)=false → t=base, 0 écriture auto
- pose = `cam` (arg onBeforeRender), comme le contrat ; ≠ `camera` passé à update()
## Pour la suite
- Mesures navigateur avant/après C2/C3 : à faire (modèle 4 558 tuiles, standard/haute) via `window.__glrTileMem` + compte de requêtes ; rapport marqué « en attente ».
- Risque NV : si une 2e passe de rendu (minimap/composer) appelle scene.onBeforeRender avec une autre caméra, pose change à chaque frame → 0 affinage ; passer à `camera` (options) si constaté.
- Capture architecte (packs/architecte/index.ts:657-676) : si un palier change pendant la capture, le loader réécrit errorTarget ; la restauration remet prev mais `applied` diverge jusqu'au palier suivant. Fix : passer par setErrorTargetBase ou lire base.
- Mono web : entrée 4 px (vs 0,75) et palier final 1 px (vs 0,75) ; modèle complet après 3 s immobile. À valider visuellement.
- haute/maximale : hardGpuCeil 4500 borne avant 12k/16k items (watchdog inchangé).
## Retour sur le pack
- Manquait: emplacement de `userData.tilesRenderer` = FileManager.ts:262 (hors WL) ; rootGroup = objet retourné, setter posé là. Coordonnées server.ts/compose pour le rapport C1.
- Inutile: QualityPresets.ts, packs/architecte/index.ts (∅ lu, contrat suffisant)
