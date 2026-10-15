---
tache: T018
projet: seagle-pilotage
statut: fait
evalue: T016
verdict: virer
---
## Verdict
virer — saut de ligne, tabulation, motif guillemet final KO
## DoD
- [x] T016#1 lecture paire seule — `banc/val.py` 1-4 → `'a "b"'` `"x'"` `'x  '` `'x"'` vx == yaml == valeur
- [x] T016#2 écriture `_scalaire` règles listées — `banc/val.py` 5-26, 29-41 OK (` #`, `- x`, `a:`, `null`, `~`, `0x1F`, `1e3`, date, `Yes` quotés)
- [x] T016#3 création — `projet zz-ab --titre "A : B"` → yaml `'A : B'` ; `tache "Essai : banc eval"` → `titre: "Essai : banc eval"` yaml OK ; `projet 2027` → titre `'2027'` str
- [x] T016#4 banc 36 — `python3 .cache/seagle-T016/banc_valeurs.py → total 36 KO 0` ; `cmp bin/vx.py .cache/seagle-T016/bin/vx.py → identique`
- [x] T016#5 aller-retour — `banc/ar.py → task 332 brief 14 KO 0 []`
- [x] T016#6 non-régression CLI valeurs simples — projet/rattacher×2/set/virer/retenir zz-sans → `fichiers 10 KO 0`
- [x] T016#7 — `py_compile rc=0` ; `./bin/agentx doctor → vault coherent.`
- [x] T016#8 result.md — 6 sections, 54 lignes corps ≤ 60
- [x] T018 aller-retour vrai vault copie — `task 332 brief 14 KO 0 []`
- [ ] T018 motif T012 + 15 neufs vx ET yaml — manque : 4 KO / 45 (bloc), `virer --motif 'a "b"'` → `motif: a "b` ; `set --note` `\n` → `note: l1` + yaml ScannerError ; `set --note 'a<TAB>b'` → yaml ScannerError
- [x] T018 quoting ≥ 15 pièges — `banc/val.py` 1-26 T015 + 29-42,44 → OK
- [x] T018 CLI banc — `--produit inconnu → rc=2`, `ls zz-bad → Aucun fichier` ; `rattacher` ×2 → `∅ -> geolens` / `deja rattache a geolens (0 changement)` ; `zzz → rc=2` ; `zz-nope → rc=1` ; `publier seagle|zz → rc=2 publier:` ; doctor → `produit absent` · `produit inconnu (zzz)` · `produits.json invalide : … Expecting property name` ; `agentx help` L18-L20
- [x] T018 vrai vault — 11 briefs == table §C0 ; `doctor | grep -cE "produit absent|produit inconnu" → 0` ; DoD L2 #3 → `['agentx', 'geolens', 'kora', 'seagle']`
- [x] T018 écart 6 `titre:` — decisions.md L20 « Différé » → pas de contradiction
- [ ] T018 verdict — 1 case `[ ]` ⇒ virer
- [x] T018 result.md — ce fichier
## Motif
_scalaire n'echappe ni saut de ligne ni tabulation : set --note multi-ligne ou a TAB b donne un YAML invalide ; virer --motif 'a "b"' perd le guillemet final, vx.py L466 strip
## Vérifié comment
`python3 .cache/seagle-eval-T018/banc/val.py .cache/seagle-eval-T018` (Texte écrit par `ecrire_frontmatter`, relu vx + `yaml.safe_load`) :
```
27 KO NEUF 'ligne1\nligne2' -> 'k: ligne1\nligne2' | vx 'ligne1' | yaml 'ERR ScannerError'
28 KO NEUF 'a\tb' -> 'k: a\tb' | vx 'a\tb' | yaml 'ERR ScannerError'
43 KO NEUF '\x07bell' -> 'k: \x07bell' | vx '\x07bell' | yaml 'ERR ReaderError'
45 KO NEUF 'a\rb' -> 'k: a\nb' | vx 'a' | yaml 'ERR ScannerError'
1-26 OK T015 ; 29-42,44 OK NEUF ('\tx' 'a #b c' '[a, b]' 'a "b"' '123' 'null' '~' '0x1F' '1e3' '2026-10-16' 'Yes' 'x:y' '  ' 'a\\"b' '%')
total 45 KO 4
```
CLI banc :
```
set T001 --note 'l1<LF>l2' → task.md:13 `note: l1$` → KO ScannerError {'note': ('l1', None)}
set T002 --note 'a<TAB>b'  → task.md:13 `note: a^Ib$` → KO ScannerError
virer T001 --motif 'a "b"' → `revue -> rejete (motif : a "b)` → task.md:13 `motif: a "b`
virer T002 --motif 'x #y : "z"' → `motif: "x #y : \"z"` — guillemet final perdu
```
- cause : bin/vx.py:L466 `.strip("\"'")` sur `args.motif` avant `Texte` ; bin/vx.py:L171-L177 `_scalaire` sans échappement `\n` `\t` `\r` contrôles
- `git diff --stat -- bin/vx.py bin/agentx` → `vx.py 149 +/-`, `agentx 4 +-` ; 0 fichier hors E de T016 imputable
## Écarts
- ∅ lecture hors WL
- outils hors liste, lecture : `grep`, `sed -n`, `awk`, `head`, `ls`, `git status --short` ; `printf` sur `.cache/seagle-eval-T018/produits.json` (banc)
- contrat.md DoD L2 à L314-L320, ≠ L320-L325 du pack
- T016 a lui-même signalé L466 et `\n` dans « Pour la suite » sans les corriger
## Pour la suite
- DoD remplaçant : `_scalaire` → si `\n` `\r` `\t` ou contrôle `<0x20`/`0x7F` → double-quote avec échappements `\n` `\r` `\t` `\xNN` ; `_valeur` dé-échappe symétrique
- DoD : `cmd_virer` L466 retirer `.strip("\"'")` ; `--motif 'a "b"'` relu == `a "b"`
- banc imposé : 45 valeurs `.cache/seagle-eval-T018/banc/val.py` + CLI `set --note` multi-ligne/tab, `virer --motif 'a "b"'` → vx == yaml == valeur
- garder : aller-retour 332 task / 14 brief KO 0 ; 6 `titre:` différés
## Retour sur le pack
- Manquait: lignes contrat.md décalées (DoD L2 L314-L320) ; outils `grep`/`sed`/`head` absents de la liste
- Inutile: ∅
