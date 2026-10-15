---
tache: T015
projet: seagle-pilotage
statut: fait
evalue: T012
verdict: virer
---
## Verdict
virer — relecture infidèle, YAML invalide à la création
## DoD
- [x] T012#1 motif T005 levé — banc, brief sans `produit:` → `rattacher` ×11 → `diff` = `6a7 > produit: <cle>` ×9, `7a8 > produit: <cle>` ×2 (dashboard-direct, geolens-viewer), 0 autre ligne
- [x] T012#2 aller-retour — `ecrire_frontmatter(lire_frontmatter(f))` copie → `task 324 brief 13 KO 0 []`
- [ ] T012#3 non-régression — manque : `vx tache "Essai : banc eval"` → `titre: Essai : banc eval` → `yaml.safe_load` → `ScannerError: mapping values are not allowed here` ; `projet zz-titre --titre "A : B"` → idem ; set/virer/retenir → yaml OK
- [x] T012#4 rattachement vrai vault — 11 briefs `produit:` == table §C0 ; DoD L2 #3 → `['agentx', 'geolens', 'kora', 'seagle']` ; `git diff -U0` → +1 ligne ×10, seagle-pilotage `??` non suivi
- [x] T012#5 doctor/py_compile — `doctor | grep -cE "produit absent|produit inconnu"` → `0` · `vault coherent.` ; `py_compile` → `rc=0`
- [x] T012#6 result.md — sections exactes, 40 lignes de corps
- [x] T015 aller-retour tous task.md/brief.md copie — `KO 0` ; `cmp` copie vs vrai → 1 DIFF `agentx-voix/T008 statut a-faire≠en-cours` — écriture concurrente vrai vault, pas aller-retour
- [ ] T015 quoting ≥15 pièges, relire == valeur — manque : 4 KO / 26 ; YAML invalide ×2, YAML tronqué ×1 (bloc ci-dessous)
- [x] T015 CLI banc — `projet zz-essai --produit inconnu` → `rc=2`, `ls` → `Aucun fichier` ; `rattacher zz-sans geolens` ×2 → `∅ -> geolens` / `deja rattache a geolens (0 changement)` rc 0 ; `rattacher zz-sans zz` → rc 2 ; `rattacher zz-nope kora` → rc 1 ; `publier seagle|zz` → rc 2 via publier.cmd ; doctor → `x projet zz-faux : produit inconnu (zzz)` · `x projet zz-vide : produit absent` ; registre `{ invalide` → `x produits.json invalide : … Expecting property name` ; `agentx help` → L18-L20 projet --produit · rattacher · publier
- [x] T015 vrai vault 11 briefs/doctor/DoD L2 — cf. T012#4-5
- [x] T015 écart 6 `titre:` laissés — conforme decisions.md#2026-10-16 « Différé »
- [ ] T015 verdict — 3 cases `[ ]` ⇒ virer
- [x] T015 result.md — ce fichier
## Motif
lire_frontmatter tronque guillemet ou espace final non quotés ; ecrire_frontmatter ne quote ni - x en tête ni a #b ; tache et projet --titre A : B écrivent un YAML invalide
## Vérifié comment
banc `.cache/seagle-eval-T015/`, valeur `k` écrite par `ecrire_frontmatter` puis relue par `lire_frontmatter` et `yaml.safe_load` (PyYAML 6.0.3 présent) :
```
KO 'a "b"' -> 'k: a "b"' | vx 'a "b'  | yaml OK
KO "x'"    -> "k: x'"    | vx 'x'     | yaml OK
KO 'x  '   -> 'k: x  '   | vx 'x'     | yaml 'x'
KO 'x"'    -> 'k: x"'    | vx 'x'     | yaml OK
OK 'a #b'  -> 'k: a #b'  | vx OK      | yaml 'a'
OK '- x'   -> 'k: - x'   | vx OK      | yaml ScannerError
OK 'a:'    -> 'k: a:'    | vx OK      | yaml ScannerError
OK ×19 : 'a: b' '#x' '"x"' "'x'" "l'eau" 'a\\b' '[a, b]' '' 'éàç' 'émoji 🚀' '|x' '>x' '@x' '%x' '-x' '{x}' '&x' '*x' '!x'
```
- cause lecture : bin/vx.py:L136-L137 `val.strip("\"'")` sur valeur non quotée — guillemet final perdu
- cause écriture : bin/vx.py:L153-L158 `_scalaire` ignore espace final, ` #`, `- ` en tête, `:` final
- cause création : bin/vx.py:L255,L363 `rendre_template(TITRE=…)` brut → `titre: A : B`
- `set --note 'note : il dit "ok"'` → `note: "note : il dit \"ok\""` relu exact ; yaml OK
- `virer --motif 'banc : motif "x"'` → `motif` sans `"` final — bin/vx.py:L445 `.strip("\"'")` préexistant, hors T012
- `git diff -- bin/vx.py` → hunks : lire/_frontmatter/_scalaire/ecrire (T012) + produit/rattacher/publier/doctor (T005) ; 0 hors E
- `python3 -m py_compile bin/vx.py` → `py_compile rc=0`
## Écarts
- ∅ lecture hors WL
- outils hors liste : `sed -n`, `grep`, `head`, `ls`, `diff` en lecture ; `sed -i` sur banc seul (produit zzz pour doctor)
- `git diff -- bin/agentx` : E de T005, non jugé ici
## Pour la suite
- pack remplaçant DoD : lire — dépouiller seulement une paire `"…"`/`'…'` (`''` → `'`), sinon valeur brute après strip d'espaces
- écrire — quoter si espace en tête/fin, ` #`, `:` final, `- `/`? ` en tête, `"`/`'` final ; banc = 26 valeurs ci-dessus, relu vx ET `yaml.safe_load` (PyYAML présent, ≠ pack T012)
- création — `tache`/`projet` passent `TITRE` par `_scalaire` dans le frontmatter seulement (titre H1 brut)
- garder : aller-retour 324 task + 13 brief à l'octet (ligne brute recopiée si inchangée)
- 6 `titre:` + 215 lignes préexistants : toujours différés (decisions.md#2026-10-16)
## Retour sur le pack
- Manquait: PyYAML disponible → validité YAML testable directement ; liste des pièges sans « guillemet final » ni « ` #` milieu »
- Inutile: ∅
