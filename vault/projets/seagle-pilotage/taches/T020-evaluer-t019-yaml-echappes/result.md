---
tache: T020
projet: seagle-pilotage
statut: fait
evalue: T019
verdict: retenir
---
## Verdict
retenir — 3 motifs levés, 0 KO, vault intact
## DoD
- [x] T019#1 `_scalaire`/`_valeur` échappes — `banc/mien.py` 1-2,12-13,18-21,31-32,36 (`\n` `\t` `\r` `\x00` `\x1f` `\x7f` ` `) vx == yaml == valeur ; `a\x85b` → `"a\x85b"` OK
- [x] T019#2 `cmd_virer` sans strip — `grep -n "args.motif" bin/vx.py` → `482: motif = Texte(re.sub(r"\s+", " ", args.motif).strip().replace("[", "(").replace("]", ")"))` ; `virer --motif 'a "b"'` → `rejete (motif : a "b")` · `motif: a "b"`
- [x] T019#3 banc imposé + CLI — `val.py .cache/seagle-eval-T020` → `total 45 KO 0` ; `set --note` LF/TAB → `note: "l1\nl2"` · `note: "a\tb"` ; yaml == vx
- [x] T019#4 aller-retour copie — `ar.py .cache/seagle-eval-T020` → `task 345 brief 14 KO 0 []` (`find vault -name task.md | wc -l` → 345)
- [x] T019#5 non-régression T016 — `banc_valeurs.py` → `total 36 KO 0` ; séquence CLI zz-ab/zz-2026/zz-sans → `banc_cli.py` → `fichiers 8 KO 0`
- [x] T019#6 — `python3 -m py_compile bin/vx.py` → `rc=0` ; `./bin/agentx doctor` → `vault coherent.` ; `git diff --stat -- bin/vx.py` → `1 file changed, 202 insertions(+), 23 deletions(-)` ; hunks ⊂ vx.py, 0 hors E
- [x] T019#7 result.md — 5 sections exactes, 48 lignes corps ≤ 60
- [x] T020 aller-retour tous task/brief copie — `task 345 brief 14 KO 0 []`
- [x] T020 motif 3e renvoi — `val.py` → `total 45 KO 0` (27 `'ligne1\nligne2'`, 28 `'a\tb'`, 43 `'\x07bell'`, 45 `'a\rb'` OK) ; CLI `set --note` LF · TAB · `\x07` · `\r` → `note: "l1\nl2"` · `"a\tb"` · `"\x07bell"` · `"a\rb"` ; `virer --motif 'a "b"'` → `motif: a "b"` ; `yv.py zz-t020 2027 zz-sans` → `fichiers 22 KO 0`
- [x] T020 motif T012 — 26 T015 (`val.py` 1-26 OK) + 54 NEUFS `banc/mien.py` 1-54 (`\n` note, tab, `a #b`, `[a, b]`, `a "b"`, `2027`, `null`, `~`, `0x1F`, `1e3`, date, `---`, `? x`, `.inf`, `0o17`, `a: "b"\nc: d`…) vx ET yaml → `total 70 KO 0` ; `tache "Essai : banc eval"` → `titre: "Essai : banc eval"` ; `projet --titre "A : B"` → `titre: "A : B"` ; slug `2027` → `projet: "2027"` ; attendus yaml → `attendus 14 KO 0` ; échecs ∅
- [x] T020 quoting ≥ 15 — `mien.py` 55-70 (`: ` `#` `"x"` `'` `\` `[a, b]` vide `x   ` accents emoji `|` `>` `@` `%` `- x` `-`) → 16 OK, `total 70 KO 0`
- [x] T020 CLI banc — `projet zz-bad --produit inconnu` → `rc=2` · `ls` → `Aucun fichier` ; `rattacher zz-sans geolens` ×2 → `∅ -> geolens` / `deja rattache a geolens (0 changement)` rc 0 ; `zzz` → rc 2 ; `zz-nope` → rc 1 ; `publier zz` → `publier: erreur: produit inconnu` rc 2 ; `publier seagle` → `publier: erreur: seagle : entreprise` ; doctor → `x projet zz-sans : produit inconnu (zzz)` · `x projet zz-t020 : produit absent` · `x produits.json invalide : … Expecting property name` ; `agentx help` L18-L20 projet --produit · rattacher · publier
- [x] T020 vrai vault — 11 briefs table §C0 == `produit:` (+ agentx-serveur → agentx) ; `doctor | grep -cE "produit absent|produit inconnu"` → `0` ; DoD L2 #3 → `['agentx', 'geolens', 'kora', 'seagle']`
- [x] T020 écart 6 `titre:` — decisions.md:L20 « Différé : quoter les 6 titre: … tâche à part » → 0 contradiction ; `grep` briefs → 6 titres ` : ` non quotés, inchangés
- [x] T020 verdict — 0 case `[ ]` ⇒ retenir
- [x] T020 result.md — ce fichier
## Motif
∅
## Vérifié comment
`python3 .cache/seagle-eval-T020/banc/val.py .cache/seagle-eval-T020` → `total 45 KO 0`
`python3 .cache/seagle-eval-T020/banc/mien.py .cache/seagle-eval-T020` (écrit `ecrire_frontmatter`, relu vx + `yaml.safe_load`, + titre/corps intacts, 0 clé injectée) → `total 70 KO 0`
`python3 .cache/seagle-eval-T020/banc/ar.py .cache/seagle-eval-T020` → `task 345 brief 14 KO 0 []`
`python3 .cache/seagle-eval-T020/banc_valeurs.py` → `total 36 KO 0` · `banc_cli.py` → `fichiers 8 KO 0`
CLI copie, `cat -A` :
```
T001-essai-banc-eval/task.md:3:titre: "Essai : banc eval"$
T001-essai-banc-eval/task.md:13:note: "l1\nl2"$
T001-essai-banc-eval/task.md:14:motif: a "b"$
T002-deux/task.md:13:note: "a\tb"$
T002-deux/task.md:14:motif: "x #y : \"z\""$
T003-trois/task.md:13:note: "\x07bell"$
T003-trois/task.md:14:motif: "'cite'"$
T004-quatre/task.md:13:note: "a\rb"$
zz-t020/brief.md:3:titre: "A : B"$
2027/brief.md:2:projet: "2027"$
2027/taches/T001-null/task.md:3:titre: "null"$
```
`python3 -c "…vx.lire_frontmatter(p/'brief.md')…lister_projets()"` → `['agentx', 'geolens', 'kora', 'seagle']`
`python3 -c "import yaml;print(yaml.__version__)"` → `6.0.3` · `cmp bin/vx.py .cache/seagle-eval-T020/bin/vx.py` → `identique`
## Écarts
- lecture hors WL: `.cache/seagle-T016/banc_valeurs.py`, `banc_cli.py` — DoD T019#5 l'exige, copiés dans `.cache/seagle-eval-T020/`
- outils hors liste, lecture : `sed -n`, `grep`, `cat`, `ls`, `find`, `awk`, `git status --short`
- contrat.md DoD L2 à L314-L320 ≠ L320-L325 du pack ; §C0 à L32-L37 OK
- 0 écriture vrai vault hors ce result.md ; `git status` vault : modifs d'autres tâches concurrentes, ∅ imputable T019
## Pour la suite
- listes inline : `deps: ["a, b", "c]"]` → écrit `deps: [a, b, c]]` relu `['a', 'b', 'c]']` — hors motifs
- `￾` non quoté → yaml `ReaderError` (non-caractères `￾` `￿` à échapper) — hors motifs
- `virer --motif` multi-ligne aplati `\s+`→` ` : voulu (motif 1 ligne)
- 6 `titre:` briefs + lignes ` : ` task.md non quotées : tâche de normalisation différée toujours due
## Retour sur le pack
- Manquait: `.cache/seagle-T016/` en L (DoD T019#5 l'impose) ; lignes contrat.md DoD L2 décalées ; outils `grep`/`sed`/`cat` absents de la liste
- Inutile: `bin/agentx` en L — `agentx help` suffit
