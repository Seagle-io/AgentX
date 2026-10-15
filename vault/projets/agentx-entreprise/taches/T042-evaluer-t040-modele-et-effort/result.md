---
tache: T042
projet: agentx-entreprise
statut: fait
evalue: T040
verdict: retenir
---
## Verdict
retenir — DoD T040 tenue, 3 défauts injectés détectés
## DoD
- [x] roles.json effort+modele selon tableau ; roles.py valide — `roles_cmp.py roles.json → 17 lignes OK, "total OK 17 / 17"` ; `roles.erreur() → ''` ; effort 'max' → `"roles[1].effort : 'max' invalide (low|medium|high)"` ; effort retiré partout → `'' medium`
- [x] vx tache --modele/--effort, défauts rôle, 0 inherit neuf — banc : `tache defauts --role implementeur → modele: sonnet effort: medium` ; `--modele opus --effort high → modele: opus effort: high` ; eclaireur → `sonnet/low`
- [x] board affiche modèle/effort — `vx board → T002 sonnet/medium · T003 sonnet/- · T004 inherit/medium · T008 opus/low`
- [x] virer reprend modèle/effort sauf surcharge — `virer T001 → T007 sonnet/medium remplace: T001` ; `virer T005 --effort low → T008 opus/low` ; `virer T006 --modele opus → T009 opus/low`
- [x] garde_dispatch impose model/effort, inherit libre, sans effort: libre, message = appel attendu — cas 1-7 ci-dessous
- [x] banc T040 rejoué (défauts, surcharge, bon appel en-cours, mauvais modèle/effort refus, ancienne acceptée) — `cas.py → 1 ACCEPT en-cours ; 2,3,4 DENY pret ; 5 ACCEPT en-cours` + evenements.jsonl `quoi: dispatch` T001/T003/T004
- [x] py_compile/doctor/unittest — `py_compile → rc=0` ; `vx.py doctor → vault coherent. rc=0` ; `unittest discover -s tests → Ran 31 tests in 2.671s OK`
- [x] git diff --stat collé — diff commité dans ffae477 : `git diff --stat HEAD~1 HEAD -- 4 fichiers → garde_dispatch 12, roles.py 7, vx.py 16, roles.json 34 ; 47 ins, 22 del` = déclaré ; 0 fichier hors E
- [x] result.md T040 au format — frontmatter tache/projet/statut: revue, 5 sections présentes
## Motif
∅
## Vérifié comment
banc `.cache/eval-T042/banc` (recette du pack), projet demo T001-T006, packs = T040 recopié → `pack-lint OK — pack dispatchable.`
T003 `effort:` retiré, T004 `modele: inherit`. `python3 .cache/eval-T042/scripts/cas.py . bin/garde_dispatch.py` →
- 1 T001 sonnet/medium → rc=0 ACCEPT statut=en-cours
- 2 T005 model=sonnet effort=high → DENY pret `T005 impose modele/effort : relance l'appel avec subagent_type=implementeur, model=opus, effort=high (recu model=sonnet, effort=high).`
- 3 T005 opus/low → DENY pret, même appel attendu (recu model=opus, effort=low)
- 4 T005 sans model/effort → DENY pret (recu model=None, effort=None)
- 5 T003 sans effort:, sonnet/low → rc=0 ACCEPT en-cours
- 6 T004 inherit, haiku/medium → rc=0 ACCEPT en-cours
- 7 T004 inherit, haiku/high → DENY `… subagent_type=implementeur, effort=medium (recu model=haiku, effort=high).`
défauts sur COPIES `bin/garde_d{1,2,3}.py` (banc) :
- d1 comparaison effort supprimée → cas 3 et 7 DENY→ACCEPT
- d2 inherit traité comme contrainte → cas 6 ACCEPT→DENY
- d3 effort absent ⇒ "medium" → cas 5 ACCEPT→DENY
isolation : md5sum avant=après `e686d034… roles.json · 2251921e… roles.py · a83e78d7… vx.py · 5ae7e7cd… garde_dispatch.py` ; `git status --porcelain -- vault/projets/agentx-entreprise` avant=après (journal.md, T042 context/task) + ce result.md
## Écarts
- lecture hors WL: ∅
- diff T040 déjà commité (ffae477) : `git diff` vide, lu via `git show HEAD` / `git diff HEAD~1 HEAD`
## Pour la suite
- tâche virée sans `effort:` → remplaçante sans effort (compat, non contrainte) ; backfill si voulu
- template task.md : `effort: {{EFFORT}}` (évite réécriture frontmatter, ordre clés)
## Retour sur le pack
- Manquait: mention que le diff T040 était déjà commité (git diff vide)
- Inutile: ∅
