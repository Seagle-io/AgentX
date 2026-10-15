---
tache: T019
statut: fait
---
## Fait
- V/core/orthoScale.ts:1-42 — neuf, pur, 0 import ; `orthoZoomForDistance`, `orthoZoomBounds`, `perspDistanceForOrtho` signatures verbatim pack
- V/core/orthoScale.test.ts:1-55 — neuf, 8 tests : formule, dist ≤0/NaN/∞ ⇒ 1, aller-retour < 1e-9, bornes, clamp 0,433 ⇒ 0,5, clamp haut
- V/core/SceneManager.ts:16 — import orthoScale
- V/core/SceneManager.ts:280 — constructeur : `installOrthoScaleOnSetLookAt()` après touches
- V/core/SceneManager.ts:1003-1006 — O→P : `perspDistanceForOrtho(visibleHeight, fov, minDistance, maxDistance)` remplace calcul en ligne
- V/core/SceneManager.ts:1021 (ex 1018-1023) — bloc `height / 20000` · `height / 0.5` supprimé
- V/core/SceneManager.ts:1065-1066 — rebind : bornes si `this.camera instanceof OrthographicCamera` + réinstalle enveloppe
- V/core/SceneManager.ts:1069-1076 — `applyOrthoZoomBounds(controls, cam)` privé → `orthoZoomBounds(top−bottom, perspectiveCamera.fov, min/maxDistance)`
- V/core/SceneManager.ts:1078-1094 — `installOrthoScaleOnSetLookAt()` privé : enveloppe `setLookAt` de l'instance ; persp ⇒ appel d'origine seul ; ortho (`controls.camera`) ⇒ bornes recalculées + `zoomTo(clamp(orthoZoomForDistance(top−bottom, fov, |p−t|)), enableTransition)` ; retourne la Promise d'origine
```ts
controls.setLookAt = (px, py, pz, tx, ty, tz, enableTransition) => {
  const done = setLookAt(px, py, pz, tx, ty, tz, enableTransition);
  const cam = controls.camera;
  if (!(cam instanceof THREE.OrthographicCamera)) return done;
  this.applyOrthoZoomBounds(controls, cam);
  const dist = Math.hypot(px - tx, py - ty, pz - tz);
  const zoom = orthoZoomForDistance(cam.top - cam.bottom, this.perspectiveCamera.fov, dist);
  void controls.zoomTo(Math.min(controls.maxZoom, Math.max(controls.minZoom, zoom)), enableTransition);
  return done;
};
```
- inchangé : molette/droit/pincement (applyNavigationScheme, touches), P→O `zoom = 1`, appelants setLookAt externes
## Vérifié comment
`cd G/web && npx tsc --noEmit -p tsconfig.viewer.json; echo "exit $?"` → `exit 0`
`npx vitest run src/viewer/core` → `Test Files  22 passed (22)` · `Tests  153 passed (153)`
`npx vitest run src/viewer/core/orthoScale.test.ts` → `Test Files  1 passed (1)` · `Tests  8 passed (8)`
`npm test` → `Test Files  195 passed (195)` · `Tests  1838 passed (1838)` — 1826 + 8 orthoScale + 4 probablement T018 (motionGate modifié en parallèle) ; NV
runtime navigateur (repro T017 h.mjs) : NV — hors outils autorisés
## Écarts
- ∅ hors WL
- promise retournée = celle de `setLookAt` d'origine ; `zoomTo` non attendu — camera-controls résout les deux au même `rest`
- ortho détecté via `instanceof THREE.OrthographicCamera` (narrowing) ≠ duck typing `isOrthographicCamera` du voisin
## Pour la suite
- D1 : `5`, 12 crans molette, puis Accueil/Recadrer/Dessus/Iso ⇒ zoom ≠ 64,74, fond ≈ 85 % comme AVANT
- D3 : ortho zoom max puis `5` ⇒ persp ≥ 0,5 m ; 1 cran molette avant ⇒ pas de recul
- ortho après fitToScene (minDistance = maxDim·0,001) : bornes à jour seulement au prochain setLookAt ou rebind
- TopViewMapCapture : bornes depuis top−bottom de SA caméra au rebind ; vérifier capture inchangée
- savedViews/cinématique en ortho : zoom recalé avec transition (même smoothTime)
## Retour sur le pack
- Manquait: getter `controls.camera` (d.ts:487) non cité ; compte de tests T018 parallèle non anticipé | Inutile: ∅
