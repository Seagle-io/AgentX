---
tache: T028
projet: seagle-pilotage
statut: fait
evalue: T027
verdict: virer
---
## Verdict
virer — HEAD non UTF-8 fait tomber state.json
## DoD
- [x] T027 serveur — `dash.py --json` → kora [(ortho-front,master,master,False,ok),(ortho-back,master,master,False,ok)] · geolens [(geolens-web-feat-viewer-online,master,master,False,ok)] · agentx [(AgentX,master,master,False,ok)] · seagle [(seagle-website,feat/ascii-nuit-etoilee,main,True,ok)]
- [x] T027 `_branche` banc — `hostile.py` → detache `'détachée 1a2b3c4'` · absent `None` · worktree `.git` fichier (gitdir abs) `'wtb'` ; `git diff | grep '^+' | grep -c subprocess` → 0
- [x] T027 mode projets — `_depots(None,{'depot':absent})` → 1 élément `branche '' publication '' ecart False etat ko` ; `_depots(None,{})` → `[]`
- [x] T027 perf §C7 — 16× `curl state.json` :7831 → froid 90 ms ; chaud médiane 86 ms n=15
- [x] T027 front — `reel.mjs` 1280/390 → 4 `.im-branche` `⎇ master`×3 + `⎇ feat/ascii-nuit-etoilee` `.ecart` ; title `seagle-website · feat/ascii-nuit-etoilee (publication main)` ; plaques `É1 · Seagle · ⎇ feat/ascii-nuit-etoilee` ; sw 1280/390
- [x] T027 correctif T026 — `sed` gabarit `<g class="${cls}"…>` `| grep -c 'style='` → 1 ; DOM `styles [1,1,1,1]`
- [ ] T027 build/tests/diff — manque : `git diff --stat` non collé dans result T027 (« voir sortie ci-dessous », rien dessous) ; re-run : node --check rc 0 · py_compile rc 0 · `Ran 31 tests OK` · stat `3 files, 56 insertions(+), 6 deletions(-)`
- [x] bascule réelle — `bascule.mjs` dépôt jetable + `switch -c essai` → `apres 624 ms ok= true` li `⎇ essai`, plaque `É1 · Seagle · ⎇ essai`, sans relance
- [ ] hostiles `_branche` — 4 cas listés OK : vide `None` · `ref: refs/remotes/x` → `'détachée ref: re'` (faux libellé) · gitdir absent `None` · 80 car. sans tronquer côté serveur ; 390 px `nomSW 752 nomCW 237 sw 390`, 0 pageerror ; MAIS HEAD non UTF-8 (`\xff\xfe\x00ref`) → `UnicodeDecodeError` non captée (contrat T027 « illisible → None ») → `curl state.json` → `{"erreur": "'utf-8' codec can't decode byte 0xff…"}`, `immeuble` absent : toute la salle tombe
- [x] captures — `cap-1280.png` : 4 étages, branche lisible, seagle jaune, rien coupé · `cap-390.png` : branches lisibles, `⎇ feat/ascii-nuit-etoilee` entier, 0 débordement
- [x] isolation — md5 4 fichiers avant == après ; status 4/5 dépôts identiques ; AgentX diffère par `bin/sonnerie.py`, `bin/voix.py` modifiés en cours de run hors de mes écritures (session concurrente ; mes écritures = `.cache/eval-T028/` seul) ; `curl :7831` → 000
- [x] verdict — 2 cases `[ ]` ⇒ virer
- [x] result.md — ce fichier
## Motif
_branche laisse fuir UnicodeDecodeError sur HEAD non UTF-8 (contrat illisible→None) et state.json tombe ; ref non refs/heads affichée détachée ref: re ; git diff --stat non collé
## Vérifié comment
- `python3 .cache/eval-T028/hostile.py` → vide None · remote 'détachée ref: re' · gitdir_absent None · long80 'b'*80 · detache 'détachée 1a2b3c4' · absent None · binaire EXCEPTION UnicodeDecodeError
- banc :7831 (pid noté, kill) · `produits.json` banc : seagle.depots → jetable / hostiles / binaire puis restauré
- `curl -s :7831/state.json` (seagle→HEAD binaire) → `True 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte False`
- `node bascule.mjs` → avant `⎇ master` ; apres 624 ms ok=true
- `node hostile.mjs` → 1280 sw 1280 · 390 sw 390 · errs 0 ; plaque `É1 · Seagle · ⎇ vide ? · remote détaché…`
## Écarts
- ∅
## Pour la suite
- `_branche` : `except (OSError, UnicodeDecodeError)` (ou `ValueError`) → None ; ou `errors="replace"`
- `tete` ni `ref: refs/heads/` ni sha hex 40/64 → None (ou `ref: X` → X brut), pas `détachée ref: re`
- DoD remplaçant : cas hostile HEAD binaire + `ref:` hors heads, sortie `state.json` collée
- correctif : 3 lignes dans `bin/dash.py` seul ; reste du livrable conforme, à reprendre tel quel
## Retour sur le pack
- Manquait: cas HEAD non UTF-8 (trouvé hors liste) ; avertir que l'arbre partagé bouge (status AgentX non stable entre avant/après)
- Inutile: ∅
