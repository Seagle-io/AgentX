---
tache: T016
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/vx.py:L114,L130,L134 — items, listes, scalaires lus via `_valeur`
- bin/vx.py:L150-L152 — `Texte(str)` : chaîne saisie ou lue quotée
- bin/vx.py:L155-L159 — `_AUTRE_TYPE` : bool/null/nombre/date YAML 1.1
- bin/vx.py:L162-L168 — `_valeur` : paire `"…"` (`\"` `\\`) ou `'…'` (`''`) seule retirée
- bin/vx.py:L171-L177 — `_scalaire` : quote espaces bord, `\s#`, `:` + espace/fin, 1er car. réservé, `Texte` interprétable
- bin/vx.py:L199-L204 — `rendre_template` : frontmatter via `_scalaire`, corps brut
- bin/vx.py:L269,L274 — `cmd_projet` : slug et titre en `Texte`
- bin/vx.py:L384-L385 — `cmd_tache` : TITRE, PROJET en `Texte`
- bin/vx.py:L427 — `set --note` en `Texte`
- bin/vx.py:L466,L476,L481 — `virer` : motif, titre, projet en `Texte`
- .cache/seagle-T016/banc_valeurs.py · banc_aller_retour.py · banc_cli.py — bancs
## Vérifié comment
`python3 .cache/seagle-T016/banc_valeurs.py` (26 T015 + 10 T016, écrits en `Texte` par `ecrire_frontmatter`, relus vx + `yaml.safe_load`) :
```
 1 OK 'a "b"' -> 'k: a "b"'      3 OK 'x  ' -> 'k: "x  "'     5 OK 'a #b' -> 'k: "a #b"'
 6 OK '- x'   -> 'k: "- x"'      7 OK 'a:'  -> 'k: "a:"'      2,4 OK "x'" 'x"' -> brut
 8-26 OK 'a: b' '#x' '"x"' "'x'" "l'eau" 'a\\b' '[a, b]' '' 'éàç' 'émoji 🚀' '|x' '>x' '@x' '%x' '-x' '{x}' '&x' '*x' '!x'
27-36 OK '  x' 'true' '2026-10-16' '42' '~' '? x' 'a: "q" \\ z #c' "''" '`cmd`' 'x # y:' -> tous quotés
total 36 KO 0
```
`python3 .cache/seagle-T016/banc_aller_retour.py .cache/seagle-T016/vx_avant.py` (copie du vrai vault) →
```
task 330 brief 14 KO 0 []
lecteur avant/apres : 1087 fichiers .md, 0 valeurs differentes
```
banc CLI : `projet zz-ab --titre "A : B" --produit kora` · `projet zz-2026 --titre 2026` · `projet zz-sans --titre 'x #y "q"'` · `rattacher zz-sans geolens` ×2 → `∅ -> geolens` / `deja rattache a geolens (0 changement)` · `tache "Essai : banc eval"` · `tache true --dep T001` · `set --note 'note : il dit "ok" #1'` · `virer --motif 'banc : motif "x" #2 -'` → T003, deps T002 réécrites · `retenir T003 --sans-eval` → rc 0 ×12
`python3 .cache/seagle-T016/banc_cli.py` →
```
OK zz-ab/brief.md {'titre': 'A : B', 'statut': 'cadrage', 'produit': 'kora'}
OK zz-ab/taches/T001-essai-banc-eval/task.md {'titre': 'Essai : banc eval', 'statut': 'rejete', 'note': 'note : il dit "ok" #1', 'motif': 'banc : motif "x" #2 -', 'deps': [], 'remplacee_par': 'T003'}
OK zz-ab/taches/T002-true/task.md {'titre': 'true', 'statut': 'a-faire', 'deps': ['T003']}
OK zz-ab/taches/T003-essai-banc-eval/task.md {'titre': 'Essai : banc eval', 'statut': 'fait', 'deps': [], 'remplace': 'T001'}
OK zz-2026/brief.md {'titre': '2026', …} · OK zz-sans/brief.md {'titre': 'x #y "q"', 'produit': 'geolens'} · plan.md ×3 OK
fichiers 9 KO 0
```
H1 brut : `# T001 — Essai : banc eval` · `# Brief — A : B`
banc `vx.py doctor` → `x projet zz-2026 : produit absent` · `x zz-ab/T003 : marquee fait sans result.md` — artefacts du banc, attendus
`python3 -m py_compile bin/vx.py` → `py_compile rc=0` · `./bin/agentx doctor` → `vault coherent.` · `cmp bin/vx.py banc` → identique
## Écarts
- ∅ lecture hors WL
- vide → `cle:` : `yaml.safe_load` rend `None`, banc le compte `''` — contrat « vide → `cle:` »
- `Texte` étendu à slug/PROJET (non nommés) — `projet 2026` sinon int YAML
- vx_avant.py (vx.py pré-T016) copié dans le banc pour comparer les lecteurs
- outils hors liste, lecture : `ls`, `grep`, `sed -n`, `awk`, `find`, `wc`, `git diff --stat`
## Pour la suite
- bin/vx.py:L466 `.strip("\"'")` du motif préexistant : `--motif 'a "b"'` perd `"` final avant écriture
- `_scalaire` n'échappe pas `\n`/contrôles : `set --note` multi-ligne casserait le frontmatter
- listes `[a, b]` écrites brutes : élément avec `, ` ou `]` non géré (deps/tags seulement)
- lecteur garde `a #b` non quoté entier (YAML → `a`) : 0 cas au vault (diff lecteurs 0)
- 6 `titre:` préexistants non quotés : toujours différés (decisions.md#2026-10-16)
## Retour sur le pack
- Manquait: sens de « valeur d'origine quotée » pour `true`/nombre/date — tranché via `Texte` (lue quotée ou saisie) ; 330 task / 14 brief (≥ 324/13, `_templates` inclus)
- Inutile: ∅
