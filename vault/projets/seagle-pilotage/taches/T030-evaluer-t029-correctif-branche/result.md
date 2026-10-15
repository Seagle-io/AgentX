---
tache: T030
projet: seagle-pilotage
statut: fait
evalue: T029
verdict: virer
---
## Verdict
virer — code conforme, result.md T029 absent
## DoD
- [x] T029 motif HEAD non UTF-8 → None, state.json tient — `curl -s :7833/state.json` → clés contiennent `immeuble` ; `kora [('hostile', '', 'ko'), ('ortho-back', 'master', 'ok')]`
- [x] T029 `ref: refs/remotes/x` → None — `python3 .cache/eval-T030/cas.py` → `remotes -> None`
- [x] T029 sha40/feat/x/gitdir/gitfile non UTF-8/vide — cas.py → `sha40 -> 'détachée a1b2c3d'` · `feat/x -> 'feat/x'` · `gitdir -> 'dev'` · `gitfile-nonutf8 -> None` · `vide -> None`
- [ ] T029 cas en 1 script `.cache/seagle-T029/cas.py`, sortie collée — manque : script présent, `T029/result.md` inexistant (`ls` → context.md task.md seuls) ⇒ 0 sortie collée
- [ ] T029 réel inchangé (collé) — manque : non collé par T029 ; observé par moi `python3 bin/dash.py --json` → `master×2 · master · master · ('feat/ascii-nuit-etoilee', True)`
- [ ] T029 py_compile rc 0, unittest OK, `git diff --stat` collé tel quel — manque : rien collé (motif T027 répété) ; observé `rc 0` · `Ran 31 tests … OK` · ` bin/dash.py | 39 +++…- 1 file changed, 38 insertions(+), 1 deletion(-)`
- [x] T030 cas absents — cas.py → `sha64 -> 'détachée abcdef0'` · `sha-MAJ -> None` · `sha39 -> None` · `heads-vide -> ''` (jugé ok : etat ko, 0 exception) · `crlf -> 'main'` · `inexistant -> None`
- [x] T030 HEAD binaire sur banc + Chromium 390 px — state.json ci-dessus ; `node pw.mjs` → `pageerror 0 []`
- [x] T030 diff limité — `git diff -- bin/dash.py` → hunks : `+import os` (:18, requis par `_depots`), `+_branche`, `+_depots` (:488-520), `etages[]…"depots": _depots(...)` (:685) ; 0 autre fonction
- [x] T030 isolation — `md5sum … | diff - avant.md5` → `md5 identiques` ; `curl :7833` après kill → `000`
## Motif
code _branche conforme (13 cas, state.json tient) mais result.md de T029 absent : aucune sortie collée, git diff --stat toujours non collé, livraison en revue sans compte rendu
## Vérifié comment
python3 .cache/eval-T030/cas.py → 13 lignes ci-dessus, 0 EXC
banc produits[0].depots[0].chemin → .cache/eval-T030/hostile (HEAD `\xff\xfe\x00ref`) ; dash.py --port 7833 → state.json 200, kora/hostile etat ko
python3 -m unittest discover -s tests → Ran 31 tests in 2.901s OK
git diff --stat -- bin/dash.py → 1 file changed, 38 insertions(+), 1 deletion(-)
## Écarts
- ∅ lecture hors WL ; lu `T029/task.md` + `ls .cache/seagle-T029/` pour constater l'absence de result.md (même dossier que la WL)
- `'⎇ ?'` non trouvé dans innerText à 390 px (hors DoD T030, pageerror 0) — capture `.cache/eval-T030/390.png`
## Pour la suite
- remplaçant : code déjà en place et juste → mission réduite à rejouer cas + curl + stat et écrire result.md ; 0 édition de `bin/dash.py`
- DoD remplaçant : « result.md existe, statut revue, sorties collées » en case explicite ; `vx` devrait refuser `revue` sans result.md
- vérifier au front que l'étage avec dépôt ko affiche bien `⎇ ?` à 390 px (non constaté ici)
## Retour sur le pack
- Manquait: cas « result.md évalué absent » (règle de verdict) ; outil `Bash(ls:*)`/`Bash(git:*)` hors liste stricte
- Inutile: ∅
