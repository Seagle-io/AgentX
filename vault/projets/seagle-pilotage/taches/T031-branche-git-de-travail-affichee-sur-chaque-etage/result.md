---
tache: T031
projet: seagle-pilotage
statut: revue
---
## Livré
- result.md — preuves rejouées, 0 édition
## Vérifié comment
md5sum bin/dash.py dash/dash.js (avant) → 6ecc4dbc3795df0eec55959811df2c97  bin/dash.py · f32a12a49d782ca6779276c370c9856a  dash/dash.js
python3 .cache/eval-T030/cas.py →
binaire -> None
remotes -> None
sha40 -> 'détachée a1b2c3d'
feat/x -> 'feat/x'
gitdir -> 'dev'
gitfile-nonutf8 -> None
vide -> None
sha64 -> 'détachée abcdef0'
sha-MAJ -> None
sha39 -> None
heads-vide -> ''
crlf -> 'main'
inexistant -> None
python3 bin/dash.py --json (immeuble.etages[].depots → nom, branche, ecart) →
- etage0: ortho-front master False · ortho-back master False
- etage1: geolens-web-feat-viewer-online master False
- etage2: AgentX master False
- etage3: seagle-website feat/ascii-nuit-etoilee True (publication main)
python3 -m py_compile bin/dash.py; echo rc=$? → rc=0
python3 -m unittest discover -s tests 2>&1 | tail -3 → Ran 31 tests in 2.991s / (vide) / OK
git diff --stat -- bin/dash.py →
 bin/dash.py | 39 ++++++++++++++++++++++++++++++++++++++-
 1 file changed, 38 insertions(+), 1 deletion(-)
md5sum bin/dash.py dash/dash.js (après) → 6ecc4dbc3795df0eec55959811df2c97  bin/dash.py · f32a12a49d782ca6779276c370c9856a  dash/dash.js (identique)
## Écarts
- ∅
## Pour la suite
- ∅
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
