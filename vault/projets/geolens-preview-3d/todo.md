---
projet: geolens-preview-3d
tags: [todo]
---

# Todo chef — geolens-preview-3d

- [ ] packs : typecheck viewer = `cd G/web && npx tsc --noEmit -p tsconfig.viewer.json` (`npm run typecheck` exclut src/viewer) — T007
- [x] EDLRenderer.resize(w,h) ignore le pixel ratio — T016 ⇒ cible EDL en px CSS si dpr > 1 (nuages de points) — T007
- [ ] élargir `poseChanged(prev)` à `ArrayLike<number> | null`, retirer le cast Loader:727 — T007
- [ ] TopViewMapCapture.ts:230 réassigne sceneManager.camera sans `glr:active-camera` (capture temporaire, à juger) — T007
- [ ] H14 near/brouillard : near 0,3 fixe coupe à 0,5 m ; FogExp2 0,05/maxDim efface le modèle à 10 km (T002) — near relevé exprès après crash ArcelorMittal (SceneManager.ts:1396-1420) ⇒ décider avec l'humain avant de toucher
- [ ] bancs : souris gauche = translation, rotation = bouton du milieu (navigationScheme.ts:26) ; clé preset `glr.settings.v1` ; stabilisation 90-121 s (T002) — corriger bench-3d.mjs
- [x] texte d'aide sous « Rendu fluide 3DGS » — T015 ; (V/index.html:~805, viewer.html:~808) décrit encore budget/fondu/cache — T005
- [x] bug affichage ortho : molette — T016 ; = dolly avec zoom figé à 1 ⇒ échelle constante, vide à 10 km, coupe near 0,3 m (T008, préexistant) — candidat lot affichage
- [ ] boutons +/− barre d'outils (main.ts:2470-2478 `controls.dolly`) sans effet en ortho — main.ts gelé, décider (T016)
- [ ] fluid ignore le preset (overBudget:false, Lcc2Loader:97) : 7,4 M splats / 121 Mo même en économe/mobile ⇒ risque OOM (T006)
- [ ] Lcc2FluidStreamer, lcc2FluidCut, écouteur FLUID_BUDGET_DROP_EVENT = code mort non suivi (T006)
- [ ] fluid : tuile .sog en échec sautée sans réessai ⇒ trou permanent (T006)
- [x] vérificateur T015+T016 au banc — T017 (DÉFAUTS D1/D3 ⇒ T019)
- [ ] EDL jamais rendu : `EDLRenderer.render()` appelé nulle part, boucle SceneManager.ts:1895-1899 en rendu direct (T017-D2) ⇒ EDL = fonctionnalité morte ; le brancher change l'aspect des nuages ⇒ décision humaine
- [x] vérificateur T018 + T019 au banc — T020, T022, T024 ; commit b551616
- [ ] 🏠 en persp depuis d ≲ 5 m ⇒ pos (50,30,50) cible 0 (9,66 px/m au lieu de 1,61), sans vue enregistrée — repro `scratchpad/t024.sPuc/sv3.mjs CASE=homeclosePonly` (T024, préexistant ?)
- [ ] vue d'accueil 🏠 (homeView.ts + synchro glrAPI desktop) : orthoHeight non stocké (T021/D8)
- [ ] O→P→O pendant le vol d'une vue ⇒ fin de vol à l'échelle de la distance, pas l'échelle sauvée (choix UX, T024)
- [x] scribe : capitaliser banc preview 3D — T025 ([[geolens-banc-preview-3d]], gabarit +4 l)
