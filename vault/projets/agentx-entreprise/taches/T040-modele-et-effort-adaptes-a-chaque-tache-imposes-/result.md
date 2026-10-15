---
tache: T040
projet: agentx-entreprise
statut: revue
---
## Livré
- roles.json:5-21 — `effort` ajouté, `modele` revu (17 rôles, tableau chef)
- bin/roles.py:20,44,81-83,95 — `EFFORTS`, `Role.effort` (défaut medium), validation
- bin/vx.py:402-404 — cmd_tache écrit `effort:` (défaut rôle ou `--effort`)
- bin/vx.py:492,503-504 — virer : remplaçante reprend modèle+effort ; `--effort` surcharge
- bin/vx.py:621,631-633 — board : colonne MODELE/EFFORT (`sonnet/-` si ancien)
- bin/vx.py:1101-1102,1116 — parser tache `--modele` (choices) `--effort` ; virer `--effort`
- bin/garde_dispatch.py:14-17,95-102 — refus si model/effort ≠ tâche ; message = appel attendu
- compat : `inherit` ou `effort:` absent → pas de contrainte ; `critique` : rôle absent de roles.json → ∅

## Vérifié comment
banc `.cache/T040/banc` (copie bin/ roles.json, projet demo) :
- `vx tache defauts --role implementeur` → task.md `modele: sonnet` `effort: medium`
- `vx tache surcharge … --modele opus --effort high` → `modele: opus` `effort: high`
- `vx board` → `T001 sonnet/medium · T002 opus/high · T003 sonnet/-`
- hook T001 model=sonnet effort=medium → rc=0 sans sortie, `statut: en-cours`, evenement `dispatch T001` ajouté
- hook T002 model=sonnet effort=high → `deny … T002 impose modele/effort : relance l'appel avec subagent_type=implementeur, model=opus, effort=high (recu model=sonnet, effort=high).`
- hook T002 model=opus effort=low → deny idem (recu model=opus, effort=low) ; statut reste `pret`
- hook T001 sans model/effort → deny `… model=sonnet, effort=medium (recu model=None…`
- hook T003 (effort: retiré) model=sonnet → rc=0, `statut: en-cours`
- hook T002 model=opus effort=high → rc=0, `statut: en-cours`
- `virer T001` → T004 `sonnet/medium` ; `virer T002 --effort low` → T005 `opus/low`
- `roles.erreur()` → `''` ; effort='max' → `roles[1].effort : 'max' invalide (low|medium|high)`
- `python3 -m py_compile bin/vx.py bin/roles.py bin/garde_dispatch.py` → rc=0
- `./bin/agentx doctor` → `vault coherent.` rc=0
- `python3 -m unittest discover -s tests` → `Ran 31 tests … OK`
- `git diff --stat` → garde_dispatch.py 12 + · roles.py 7 · vx.py 16 · roles.json 34 (47 ins, 22 del)

## Écarts
- lecture hors WL: ∅
- bin/vx.py:403 — `getattr(args,"effort",None)` : bin/publier.py:312 (hors WL) appelle cmd_tache sans `effort` ; sinon test_publier KO
- `--modele` de `tache` passe en `choices=MODELES` (avant : libre)
- tâches `vault/_templates/task.md` hors WL : `effort:` écrit par relecture/réécriture du frontmatter après rendu
- 1er essai hook T001 sous fish : JSON cassé → exit 0 silencieux ; rejoué en littéral OK (artefact du banc)

## Pour la suite
- publier.py:312 : passer `effort=None` explicite (ou laisser le getattr)
- template task.md : ajouter `effort: {{EFFORT}}` pour supprimer la réécriture
- tâches existantes : aucune n'a `effort:` → non contraintes ; backfill au besoin
- le chef doit passer `model=` et `effort=` à chaque appel `Agent` (sinon refus)
- dash.py ne montre pas encore l'effort (hors périmètre)

## Retour sur le pack
- Manquait: publier.py (appelant cmd_tache), template task.md en WL (L) ; `critique` n'existe pas dans roles.json
- Inutile: vault/syndicat/2026-10-16-tokens.md (non lu)
