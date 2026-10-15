---
tache: T012
statut: fait
---
## Livré
- e2e/_proofEnv.mjs:1-35 — NEUF : DIR, ASSETS_PRESENT, minTiles, skipIfMissing
- e2e/proof-{upload,export,ortho,photo,import-lcc2}.mjs — `const DIR` → `import { DIR }` même ligne
- e2e/proof-import-lcc2.mjs:10 — commentaire C:/ → `$OUT ou <tmpdir>/glw-proofs/`
- e2e/proof-viewer.mjs:11,70,75 — import DIR+minTiles ; seuils `minTiles(30)`
- e2e/proof-refine.mjs:16,19 — import ; `MIN_TILES = minTiles(150)`
- e2e/proof-pnts.mjs:9,50,52 — import ; break + assert `minTiles(12)`
- e2e/proof-interaction.mjs:6,36 — import ; `minTiles(20)`
- e2e/proof-package.mjs:22,83 — import ; skipIfMissing avant buildPackageZip
- e2e/proof-cloudpkg.mjs:19,65 — import ; skipIfMissing avant buildZip
## Vérifié comment
```
node --check (12 fichiers, cwd e2e) → OK _proofEnv.mjs · OK proof-viewer · OK proof-upload · OK proof-package · OK proof-cloudpkg · OK proof-refine · OK proof-export · OK proof-pnts · OK proof-ortho · OK proof-interaction · OK proof-photo · OK proof-import-lcc2
rg -n "C:/tmp" proof-*.mjs → ∅ (exit 1)
node -e "import('./_proofEnv.mjs').then(m=>console.log(m.DIR, m.ASSETS_PRESENT, m.minTiles(30)))" →
SEUIL ASSOUPLI 30→0 : assets 3D absents (decisions.md D4)
/tmp/glw-proofs false 0
PROOF_MIN_TILES=5 … minTiles(30), minTiles(30), minTiles(3) →
SEUIL ASSOUPLI 30→5 : assets 3D absents (decisions.md D4)
5 5 5
skipIfMissing(…/pnts/pointcloud_0164.pnts) argv[1]=proof-package.mjs →
SKIP proof-package.mjs : tuile .pnts seed absente
exit 0
git -C G diff --stat (e2e) →
 e2e/proof-cloudpkg.mjs     | 3 ++-
 e2e/proof-export.mjs       | 2 +-
 e2e/proof-import-lcc2.mjs  | 4 ++--
 e2e/proof-interaction.mjs  | 2 +-
 e2e/proof-ortho.mjs        | 2 +-
 e2e/proof-package.mjs      | 3 ++-
 e2e/proof-photo.mjs        | 2 +-
 e2e/proof-pnts.mjs         | 6 +++---
 e2e/proof-refine.mjs       | 4 ++--
 e2e/proof-upload.mjs       | 2 +-
 e2e/proof-viewer.mjs       | 6 +++---
?? e2e/_proofEnv.mjs
```
- diff --stat montre aussi web/ (5) + worker/app.py → autres agents, ∅ de T012
- preuves non lancées → NV — node_modules e2e absent, stack arrêtée (pack)
## Écarts
- proof-refine.mjs:10 = commentaire ; seuil réel :19 `MIN_TILES = 150` → modifié :19
- proof-pnts.mjs:50 `break` même seuil 12 → aussi minTiles, cohérence boucle
- skipIfMissing placé top-level avant appel buildZip (:83/:65), pas dans la fonction — exit avant browser.launch
## Pour la suite
- proof-viewer.mjs:71 `mem.geometries >= 30 && mem.textures >= 10` reste dur → KO sans assets
- warn minTiles dit « assets 3D absents » même si PROOF_MIN_TILES force < original (contrat verbatim)
- libellés messages (« ≥30 attendu ») non mis à jour
- e2e lancées réellement : `npm ci` e2e + stack démarrée requis
## Retour sur le pack
- Manquait: ligne seuil refine fausse (:10 commentaire → :19) ; seuil pnts :50 non listé ; viewer :71 non tranché
- Inutile: ∅
