---
tache: T003
statut: revue
---
## Livré
- bin/dash.py:311-315 — constantes C7, `_CACHE` + `_CACHE_VERROU`
- bin/dash.py:318-406 — `_signature` (stat seul), `_bloc_projet` en cache, jamais muté
- bin/dash.py:409-480 — `_age_j`, `_dormant`, `_ordre`, `_etage`, `_sous_sol`, `_epingle`, `_choisir`
- bin/dash.py:483-588 — `construire_etat(projet)` : séquence C7, todo C4, immeuble C1
- bin/dash.py:711,804-828 — `_todo` sans personnel ; `_todo_rh` (toit, projet "")
- bin/dash.py:861-878 — `_doctor_rapide` lit taches/packs des blocs
- bin/dash.py:230 — `_evenements` : `setdefault("projet", "")`
- bin/dash.py:987,1059-1062 — `etat_demo` : `immeuble` None + `todo_total`
- bin/dash.py:1131-1133 — do_GET : `?projet=` parse_qs → `construire_etat`
- bin/dash.py:1244,1253 — `--projet` pour `--json`
## Vérifié comment
```
python3 -m py_compile bin/dash.py → rc=0
DoD L1 #1 → 8 2 {'slug': 'agentx-entreprise', 'source': 'epingle', 'refus': ''} True
DoD L1 #2 → orthopro requete True
DoD L1 #3 → slug inconnu : ../x
DoD L1 #4 → True True True True
DoD L1 #6 → 19
perf C7 → froid 172 ms · chaud médiane 72 ms
cache (Path.read_text compté, 2e appel) → chaud lectures {'brief.md': 11, 'projet': 2, 'journal.md': 13, 'supervision.json': 1, 'task.md': 270} context+result 0 mesure_ms 75
touch (os.utime mtime+1ms puis restauré) → touch vault/projets/seagle-site/taches/T026-…/task.md -> recalcules ['seagle-site'] meme objet False
invariant (deepcopy _CACHE avant/après 3 appels + json.dumps) → blocs inchanges True
demo → etat_demo(): immeuble None, todo_total 6
clos ?projet=dashboard-direct → selection {'slug': 'dashboard-direct', 'source': 'requete', 'refus': ''} ; etages[].selection True ×0
banc :7798 ?projet=agentx-entreprise → agentx-entreprise {'slug': 'agentx-entreprise', 'source': 'requete', 'refus': ''} True(jeton)
banc ?projet=..%2Fx&t=1 → agentx-entreprise {'slug': 'agentx-entreprise', 'source': 'epingle', 'refus': 'slug inconnu : ../x'} ; HTTP 200
kill 191049 ; curl → 000
git diff bin/dash.py | rg 'construire_argv|def executer|_EXECUTION' → rc=1 (aucune ligne)
./bin/agentx doctor → vault coherent. rc=0
git diff --stat -- bin/ → bin/dash.py 246 · bin/sonnerie.py 30 · bin/terminal.py 14
```
## Écarts
- DoD `git diff --stat -- bin/` = dash.py seul : KO apparent — sonnerie.py/terminal.py = L3 (T004) parallèle, ∅ touché par T003
- comptes 8/2 = attendus T001 : 8 ouverts, sous-sol = dashboard-direct (clos) + archive/recherche-floue
- C7 « blocs[sel.name] = _bloc_projet(sel) » : sel clos via `bloc = blocs.get(...) or _bloc_projet(sel)` ; blocs reste = ouverts → clos jamais étage, todo agrégée = étages seuls
- `_doctor_rapide` sur blocs (clause MAY) : sinon 2 context.md relus/poll (T003, T004 en-cours) → DoD cache KO ; critère = `_pack_rempli` (≡ `marqueurs`) ; import `_pack_rempli` retiré
- helpers ajoutés hors liste C7 : `_age_j`, `_dormant`, `_ordre`, `_epingle` (run/projet lu 2×/poll)
- `etages[].agents` tronqué à 12 dans le bloc
## Pour la suite
- étage : `{"slug":"agentx-immeuble","titre":"AgentX immeuble : un étage par projet","statut":"cadrage","rang":0,"num":8,"activite":"2026-10-15 17:31","age_j":0.0,"dormant":false,"compteurs":{"a-faire":1,"pret":0,"en-cours":1,"bloque":0,"revue":0,"fait":4,"abandonne":0,"rejete":0},"total":6,"agents":[{"role":"implementeur","tid":"T003"}],"todo":2,"alerte":{"niveau":"","texte":""},"selection":false}`
- toit : `{"chef":{"vivant":true},"todo":98,"urgent":1,"etages":8,"dormants":0,"alerte":{"niveau":"","texte":""}}` ; sous_sol[] : `{"slug","titre","statut","source","maj","selectionnable"}`
- salle :7777 garde l'ancien code : relance humaine requise avant L2 navigateur
- cache non invalidé par `roles.json` (dep_satisfaite, livre_en, juges) : relance salle si registre change
- chaud : 270 lectures task.md/poll hors blocs = `rh.personnel()` (rh.py, hors WL)
## Retour sur le pack
- Manquait: DoD cache vs `_doctor_rapide` → `_pack_rempli` relit context.md des en-cours ; à dire dans le pack (MAY devient MUST)
- Manquait: DoD `git diff --stat` ignore L3 parallèle sur bin/
- Inutile: ∅
