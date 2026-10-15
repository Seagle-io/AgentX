---
tache: T019
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/vx.py:L166-L169 — `_CONTROLE` (C0, DEL, C1, U+2028/9), table `_ECHAPPE`/`_DE_ECHAPPE`
- bin/vx.py:L172-L179 — `_valeur` dé-échappe `\" \\ \n \r \t \xHH \uHHHH` ; inconnue gardée brute
- bin/vx.py:L182-L189 — `_scalaire` : contrôle → `"…"` ; échappes `\n \r \t \xHH \uHHHH \" \\`
- bin/vx.py:L482 — `cmd_virer` : `.strip("\"'")` retiré, nettoyage espaces/`[`→`(` gardé
- .cache/seagle-T019/banc/plus.py · cli.py · lecteurs.py — bancs (+ val.py, ar.py de T018 recopiés)
## Vérifié comment
`python3 -m py_compile bin/vx.py` → `py_compile rc=0` · `cmp bin/vx.py .cache/seagle-T019/bin/vx.py` → `identique`
`python3 .cache/seagle-T019/banc/val.py .cache/seagle-T019` (banc imposé T018) :
```
27 OK NEUF 'ligne1\nligne2' -> 'k: "ligne1\\nligne2"' | vx 'ligne1\nligne2' | yaml 'ligne1\nligne2'
28 OK NEUF 'a\tb' -> 'k: "a\\tb"' | vx 'a\tb' | yaml 'a\tb'
43 OK NEUF '\x07bell' -> 'k: "\\x07bell"' | vx '\x07bell' | yaml '\x07bell'
45 OK NEUF 'a\rb' -> 'k: "a\\rb"' | vx 'a\rb' | yaml 'a\rb'
total 45 KO 0
```
`banc/plus.py` (`\x00` `\x7f` `\x85` ` ` `\x1c` `a\\nb` `a\\x41` `"x\ny"` `x\n` `\\` `l1\n\tl2 #c: "q"` `é\t🚀`, vx == yaml == valeur, 1 ligne) → `total 12 KO 0`
`banc/ar.py` (copie vierge du vrai vault) → `task 344 brief 14 KO 0 []`
`banc/lecteurs.py .cache/seagle-T016/bin/vx.py bin/vx.py vault` → `lecteur T016/T019 : 1131 fichiers .md, 0 valeurs differentes`
CLI banc (`projet zz-t019` · 3 `tache` · `set --note 'l1<LF>l2'` · `set --note 'a<TAB>b'` · `set --statut revue --force` ×3 · `virer` ×3) → rc 0 ×9 :
```
T001 : revue -> rejete (motif : a "b")
T002 : revue -> rejete (motif : x #y : "z")
T003 : revue -> rejete (motif : 'cite')
T001-essai-un/task.md:13:note: "l1\nl2"
T001-essai-un/task.md:14:motif: a "b"
T002-essai-deux/task.md:13:note: "a\tb"
T002-essai-deux/task.md:14:motif: "x #y : \"z\""
T003-essai-trois/task.md:13:motif: "'cite'"
```
`banc/cli.py` (yaml.safe_load + vx, note/motif == attendu) → `fichiers 14 KO 0`
non-régression T016 : `python3 .cache/seagle-T019/banc_valeurs.py` → `total 36 KO 0` ; séquence CLI T016 (projet ×3, rattacher ×2, tache ×2, set, virer, retenir) rc 0 ×12 → `banc_cli.py` → `fichiers 9 KO 0`
`./bin/agentx doctor` → `vault coherent.`
`git diff --stat -- bin/vx.py` → `bin/vx.py | 225 +++++++++++++++++++++++++++++++++++++++++++++++++++++++------- · 1 file changed, 202 insertions(+), 23 deletions(-)` (cumul T016 + T036 + T019 non commités ; part T019 ≈ +10/−4)
## Écarts
- ∅ lecture hors WL
- échappement étendu à C1 `\x80-\x9f` + U+2028/9 — `splitlines` vx et YAML y coupent
- bancs T016 recopiés dans `.cache/seagle-T019/` (pas lancés en place, `.cache/seagle-T016` en L)
- Edit a écrit U+2028/9 littéraux dans `_CONTROLE` → réécrit en `  ` via python
- `.cache/seagle-T019-sv/` créé puis supprimé (sauvegarde bancs, hors E) ; outils hors liste : `sed -n`, `od`, `ls`, `touch`, `head`, `tail`
## Pour la suite
- listes `[a, b]` toujours écrites brutes : élément avec `, `/`]`/contrôle non géré
- `virer --motif` multi-ligne aplati par `\s+`→` ` (préexistant, voulu ?)
- lecteur garde `a #b` non quoté entier (YAML → `a`) : 0 cas au vault
- 6 `titre:` non quotés préexistants : toujours différés
## Retour sur le pack
- Manquait: séquence CLI exacte de `banc_cli.py` (recopiée du result T016) ; `retenir` exige `revue` ; `val.py` attend `B/banc/` et `sys.path` bin ; outils `sed`/`ls`/`tail` absents de la liste
- Inutile: ∅
