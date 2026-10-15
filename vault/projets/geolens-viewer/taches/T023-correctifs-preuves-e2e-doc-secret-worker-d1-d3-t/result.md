---
tache: T023
statut: fait
---
## Livré
- G/e2e/_proofEnv.mjs:19-35 — minTiles conforme contrat, warnOnce par clé
- G/e2e/proof-interaction.mjs:39 — `>= 20` → `>= minTiles(20)`
- G/e2e/proof-viewer.mjs:11 — import `ASSETS_PRESENT` ajouté
- G/e2e/proof-viewer.mjs:71 — geom `minTiles(30)`, tex `ASSETS_PRESENT ? 10 : 0`
- G/worker/README.md:62-70 — section Sécurité, 4 puces contrat
- G/worker/geolens_worker/app.py:6-7 — docstring : secret obligatoire si production
## Vérifié comment
`node --check` ×3 → `_proofEnv.mjs OK` `proof-interaction.mjs OK` `proof-viewer.mjs OK`
`rg -n ">= 20" e2e/proof-interaction.mjs` → ∅ (rc=1)
`PROOF_MIN_TILES=abc … minTiles(30)` →
```
PROOF_MIN_TILES ignoré : "abc" invalide
SEUIL ASSOUPLI 30→0 : assets 3D absents (decisions.md D4)
0
```
`PROOF_MIN_TILES=5 …` → `SEUIL FORCÉ 30→5 (PROOF_MIN_TILES)` / `5`
sans env → `SEUIL ASSOUPLI 30→0 : assets 3D absents (decisions.md D4)` / `0`
`PROOF_MIN_TILES=-3` → `ignoré : "-3" invalide` + ASSOUPLI / `0` · `PROOF_MIN_TILES=` → `ignoré : "" invalide` + ASSOUPLI / `0`
1×/valeur : `minTiles(30),minTiles(30),minTiles(20)` → 2 warns (30, 20) / `0 0 0`
`python3 -m py_compile worker/geolens_worker/app.py` → rc=0
`git diff --stat -- e2e worker` →
```
 e2e/proof-cloudpkg.mjs       |  3 ++-
 e2e/proof-export.mjs         |  2 +-
 e2e/proof-import-lcc2.mjs    |  4 ++--
 e2e/proof-interaction.mjs    |  4 ++--
 e2e/proof-ortho.mjs          |  2 +-
 e2e/proof-package.mjs        |  3 ++-
 e2e/proof-photo.mjs          |  2 +-
 e2e/proof-pnts.mjs           |  6 +++---
 e2e/proof-refine.mjs         |  4 ++--
 e2e/proof-upload.mjs         |  2 +-
 e2e/proof-viewer.mjs         |  8 ++++----
 worker/README.md             | 10 ++++++++++
 worker/geolens_worker/app.py | 22 ++++++++--------------
 13 files changed, 39 insertions(+), 33 deletions(-)
```
_proofEnv.mjs untracked (`??`) → absent du stat
## Écarts
- DoD diff-stat « 5 fichiers max » KO littéral — 13 = T015 non commité vs 745d46f ; T023 touche 5 fichiers (WL E)
- DoD `abc` « 1 warn » → 2 warns — contrat : warn invalide PUIS règle défaut (warn ASSOUPLI)
- app.py stat 22 lignes inclut T015 ; T023 = docstring :6-7 seulement
- lectures hors WL : ∅
## Pour la suite
- diff-stat par tâche inexploitable sans commit intermédiaire — committer T015/T023 (humain, D5)
- minTiles : chaîne vide / non entier / négatif → ignoré + règle défaut
- proof-viewer:70 message « ≥30 attendu » figé ≠ seuil réel (hors DoD)
## Retour sur le pack
- Manquait: baseline diff-stat incluant T015 non commité ; nb warns attendu pour `abc` incohérent avec contrat
- Inutile: secret.py (L) — contrat README suffisait
