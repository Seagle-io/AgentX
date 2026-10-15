---
tache: T038
projet: agentx-entreprise
statut: fait
evalue: T036
verdict: retenir
---
## Verdict
retenir — 7/7 cases DoD T036 prouvées sur banc
## DoD
- [x] dispatch = seule voie vers en-cours — `hook.sh implementeur T001` → rc=0 stdout vide · `statut: en-cours` · `{"id": "3aef1450d6ea026f", "t": "00:43:48", "quoi": "dispatch", "role": "implementeur", "tid": "T001", "statut": "en-cours", "verdict": "", "projet": "banc"}` · journal `T001 statut pret -> en-cours [dispatch]` ; `set T003 --statut en-cours` → `vx: erreur: en-cours = dispatch : lance l'agent (le hook passe la tâche en-cours)` rc=1 ; `set T005 … --force` → `T005 : a-faire -> en-cours` rc=0, journal `[force]`
- [x] filet doctor + `_todo` — event perdu T006/T007 en-cours → doctor `x banc/T006 : en-cours, prete mais aucun agent lance — dispatcher` ; todo `1 banc T006 prête mais aucun agent lancé — dispatcher | t6 — en-cours, aucun dispatch noté` ; T002 `touch -d '20 minutes ago'` → todo `['T002','T006','T007']` + doctor `x banc/T002 : pret, …` ; T004 14 min → absent ; hook T002 → `['T006','T007']`, doctor sans T002 ; cache in-process `t0 ['T006','T007']` · `cache True` · `t0+2min ['T004','T006','T007'] recalc True`
- [x] chemins personnels — banc git : `['outils/nonsuivi.py:1', 'dash/perso.js:2', 'outils/shebang.py:1']` ; `docs/doc.md` (`/home/<nom>/`) ∅ · `outils/binaire.bin` ∅ · `outils/ignore.py` (gitignoré) ∅ ; vrai dépôt, vx snap ROOT réel → `0 []` ; `head -1 bin/parle bin/dictee` → `#!/usr/bin/env python3` ×2 (T012)
- [x] doctrine — `grep -n` → `CLAUDE.md:19 - Ne jamais passer une tâche en-cours à la main : le hook le fait au dispatch.` · `SKILL.md:188` même phrase, sous `## Phase 4 — Dispatch` (:164) · `_templates/context.md:63 Livrable exécutable = portable : 0 /home/<nom>, shebang /usr/bin/env, dépendance matérielle (GPU…) avec repli.` sous `## Environnement` (:55)
- [x] banc 1-4 sorties collées — `result.md` T036:22-29 ; 1)2)3)4) rejoués ci-dessus, identiques
- [x] py_compile + doctor réel — `python3 -m py_compile bin/garde_dispatch.py bin/vx.py bin/dash.py` (snap) → rc=0 ; `./bin/agentx doctor` → `vault coherent.` rc=0 ; `bin/agentx:196-198` rc≠0 → « la salle démarre quand même »
- [x] git diff --stat + format — `git log -1 --stat b7ab7c1` → SKILL.md 2 · CLAUDE.md 5 · dash.py 61 · garde_dispatch.py 28 · _templates/context.md 1 = déclaré ; HEAD:{garde_dispatch.py,dash.py,CLAUDE.md} = snap ; vx.py non commité, base b9199fa→snap 195+/23- dont rattacher/publier hors T036 (déclaré « cumulé ») ; result.md 49 l., 5 sections exactes
## Motif
∅
## Vérifié comment
hook stdin forgés (banc) : rôle faux T002 → `deny … T002 est une tache « implementeur », pas « testeur »`, reste pret ; T099 → `deny … pack introuvable pour T099 (banc).` ; a-faire T003 → `deny … passe-la en pret (./bin/agentx set T003 --statut pret --projet banc)`, reste a-faire ; lint KO T004 → `deny … pack-lint refuse T004`, reste pret ; T005 déjà en-cours → rc=0 vide, +1 événement ; Explore → rc=0 vide
`chmod 555 run; chmod 444 evenements.jsonl` → T006 accepté rc=0 vide, `statut: en-cours`, 2 lignes (inchangé) ; refus T002/T003/T004 identiques ; `run` = fichier → T007 accepté rc=0, en-cours
`set T003 --statut en-cours --dispatch` (main) → `T003 : pret -> en-cours` rc=0, journal `[dispatch]` ; doctor → `x banc/T003 : en-cours, prete mais aucun agent lance — dispatcher`
sonnerie dash.js (node, `sonnerie()` extrait L881-949, stubs audio) : tic1 agent-fini → `son:agent-fini` + toast `a terminé` ; tic2 +1 dispatch → `[]` ; +3 dispatch → `[]` ; +50 → `[]` ; +52 → evs `[]` → `["son:agent-fini"]` sans toast
## Écarts
- `.cache/snap-T036/bin/__pycache__` : pyc écrits (py_compile, import snap) — dossier préexistant
- `git show b9199fa:bin/vx.py` écrit 1 fois dans `../vx_base.py` (hors banc) → déplacé `.cache/eval-T038/vx_base.py`
- `bin/agentx doctor` réel = vx.py réel ≠ snap (T019 parallèle) ; doctor snap sur vrai vault → seuls `produit … env absent` (artefact ROOT produits snap)
## Pour la suite
- `--dispatch` appelable à la main : journal ment `[dispatch]`, seul le filet doctor rattrape → réserver (jeton/env posé par le hook)
- `_evenements` tail 8 Ko : ≥52 dispatchs consécutifs → evs `[]` → bip « livré » sans toast (régression T036 ; hors usage réel) → filtrer après lecture plus large ou SON.vu inchangé si evs vide
- `sans_agent` en-cours : 1 dispatch historique suffit → `--force` après rebouclage non signalé
- sonnerie.py:95-97 tronque à 50 lignes → dispatchs perdus = faux positifs (déclaré T036)
- `#!/bin/sh` signalé (DoD littérale) ; non suivis signalés (R2 syndicat, suite)
## Retour sur le pack
- Manquait: snap sans `vault/_templates/context.md` (copie réelle utilisée) ; mode d'exécution du doctor snap sur vrai vault ; `git show`/`git log` hors outils listés | Inutile: ∅
