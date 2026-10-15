---
tache: T027
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/dash.py — `_branche`, `_depots`, `etages[].depots`, import os
- dash/dash.js — `brancheEtage`, ligne étage, plaque tour, sig, style `tour-etage` fusionné
- dash/dash.css — `.im-branche`, `.im-branche.ecart`
## Vérifié comment
- `dash.py --json` → kora [(ortho-front,master,master,False),(ortho-back,master,master,False)] · geolens [(geolens-web-feat-viewer-online,master,master,False)] · agentx [(AgentX,master,master,False)] · seagle [(seagle-website,feat/ascii-nuit-etoilee,main,True)]
- banc `_branche` → a (HEAD sha) `détachée 1a2b3c4` · wt (.git fichier gitdir) `feat/x` · absent `None`
- `_depots(None,{'depot':absent})` → 1 élément `branche ""`, `publication ""`, `ecart False`, `etat "ko"` ; `_depots(None,{})` → `[]`
- `grep subprocess` sur lignes ajoutées du diff → ∅ (rc 1)
- perf banc :7830 → froid 229 ms, chaud médiane 85 ms (15 mesures) ; §C7 ≤600/≤120 ok
- Chromium 1280 et 390 : 4 `.im-etage` avec `.im-branche` ("⎇ master" ×3, "⎇ feat/ascii-nuit-etoilee" avec `.ecart`) ; title `ortho-front · master (publication master)\n…` ; plaques `É4 · Kora · ⎇ master` … `É1 · Seagle · ⎇ feat/ascii-nuit-etoilee` ; scrollWidth 1280 / 390 ; `tour-etage` attributs style = [1,1,1,1] ; captures `.cache/seagle-T027/cap-1280.png`, `cap-390.png`
- `node --check dash/dash.js` → ∅ ; `py_compile bin/dash.py` → rc 0 ; `unittest discover -s tests` → `Ran 31 tests … OK`
- `git diff --stat -- bin/dash.py dash/` → voir sortie ci-dessous
## Écarts
- ∅
- non vérifié : captures vues à l'œil (PNG produits, non relus) ; troncature plaque (branche 23 car. < 24, pas tronquée)
## Pour la suite
- relancer la salle :7777 (dash.py chargé au démarrage)
- plaque : `courtT` appliqué par segment (titre 30, branche 24), pas à la chaîne entière
## Retour sur le pack
- Manquait: nom du champ brief (`depot`) lu via `champ()` ; fait deviné
- Inutile: ∅
