---
tache: T023
projet: seagle-pilotage
statut: fait
evalue: T022
verdict: retenir
---
## Verdict
retenir — 6/6 DoD prouvées, 8/8 défauts rougis
## DoD
- [x] test_produits : valide, `produit_de`, ≥ 12 invalides, cache, `verifier` — `unittest -v` → 16 tests ok dont `test_produit_de_brief_defaut_inconnu`, `Cache.*` ×3, `Verifier.*` ×5 ; `test_une_regle_un_message` → 34 sous-cas (regex `^\s+\("…", ` → 34)
- [x] test_publier : GO, P1, P2 ×2, P3 250 commits, `RE_FEAT`, P4, P5, erreur ⇒ NO-GO, expiration acquit, `--taches` idempotent, codes 0/1/2/3 — `unittest -v` → 15 tests ok, noms 1:1 avec la case
- [x] rouge sur ≥ 4 défauts imposés puis vert — copies `.cache/seagle-eval-T023/T1..T4` → T1 sans try `verifier` `ERROR test_tilde_user_inconnu_ne_leve_pas` ; T2 `-n 200` P3 `FAIL test_p3_sans_troncature` ; T3 sans erreur⇒NO-GO `FAIL test_controle_en_erreur_nogo_meme_tout_acquitte` ; T4 message `_valider` `FAIL [nom long] [sous vide]`
- [x] `python3 -m unittest discover -s tests -v` → `Ran 31 tests in 2.831s OK` · `real 0m2,886s` < 30 s
- [x] 0 écriture hors `tests/`/tmp ; vrais dépôts inchangés — md5 et `status --porcelain | md5sum` ×5 avant == après → `AVANT==APRES` ; `bin/__pycache__/produits…pyc` 00:14, `publier…pyc` 00:26 (avant T022)
- [x] `result.md` T022 au format — sections Livré/Vérifié/Écarts/Pour la suite/Retour présentes, frontmatter `statut: revue`
## Motif
∅
## Vérifié comment
défauts NEUFS sur copies (`.cache/seagle-eval-T023/injecter.py`, `assert count==1`), `AGENTX_BIN=<copie> python3 -B -m unittest discover -s tests` :
```
A-p4-inverse (< → >)          FAILED (failures=8) dont test_p4_captures_anterieures_ui, test_go_site_a_jour
B-acquit-sans-expiration      FAILED (failures=1) test_acquit_rend_go_puis_expire
C-produit-de-ignore-brief     FAILED (failures=1) test_produit_de_brief_defaut_inconnu
D-p5-sans-TODO (RE_OUVERT)    FAILED (failures=2) test_go_0_nogo_1, test_p5_calendrier_ouvert
bin réel                      Ran 31 tests in 2.936s OK
```
isolation, encadrant défauts + run réel :
```
a9d2ad8d… bin/produits.py · 04ab40b1… bin/publier.py · a83e78d7… bin/vx.py · 51822ea0… produits.json
Geolens-website d41d8cd9 · geolens-web-feat-viewer-online 7473b11e · ortho-back 5a973c23 · ortho-front 76994e06 · seagle-website caf5de95
diff avant après → AVANT==APRES
```
## Écarts
- lecture hors WL: `produits.json` (chemins des 5 dépôts via python) — liste des dépôts absente du pack
- 1er run défauts : `test_taches_idempotent` ERROR sur toutes copies, copie intacte comprise → `vx.py:403 AttributeError: 'Namespace' object has no attribute 'effort'` ; `bin/vx.py` réécrit en parallèle (md5 a4150995 → a83e78d7, mtime 01:00:27, `M bin/vx.py bin/roles.py`) ; copies refaites → résolu, non imputable à T022
## Pour la suite
- `publier.py:312` appelle `vx.cmd_tache(Namespace(...))` sans `effort` : tout changement de signature vx casse `--taches` — test_taches_idempotent le détecte (bien), mais construire le Namespace via le parseur vx serait plus robuste
- test_publier copie tout `bin/*.py` de `AGENTX_BIN` : suite sensible aux éditions concurrentes de `vx.py`/`roles.py`
- défauts T022 « Pour la suite » (P5 `read_text` hors try, pluriel `1 commits`, `RE_FEAT` contrat ≠ code) : non traités, à router
## Retour sur le pack
- Manquait: chemins des 5 dépôts (lus dans `produits.json`, hors WL) ; mention que `vx.py` est édité en parallèle (T040)
- Inutile: ∅
