---
tache: T007
projet: agentx-immeuble
statut: fait
evalue: T003
verdict: retenir
---
## Verdict
retenir — 11/11 DoD T003 re-prouvées, 0 KO
## DoD
- [x] fonctions §C7 + `_CACHE`/`_CACHE_VERROU` + invariant — `inspect.signature ×8 → conformes C7 verbatim ; _CACHE dict, _CACHE_VERROU lock, 7 40 vault/archive` · `deepcopy blocs, 6 appels (None,beta,gamma,../x,delta,None)+jeton+json.dumps → blocs inchanges True`
- [x] GET `?projet=` parse_qs, refus 200, épingle puis activité — banc :7800 `..%2Fx → 200 delta activite refus 'slug inconnu : ../x'` · `beta&t=1 → beta requete` · `run/projet=epsilon → epsilon epingle` · `épingle inconnue → delta activite, epingle ''` · `refus+épingle → epsilon epingle refus ../x`
- [x] `main --projet` ; `_evenements` setdefault — `--json --projet orthopro → orthopro requete True` ; diff dash.py:230 `ev.setdefault("projet", "")`
- [x] 6 commandes DoD L1 — `8 2 {'slug': 'agentx-entreprise', 'source': 'epingle', 'refus': ''} True` · `orthopro requete True` · `slug inconnu : ../x` · `True True True True` · `19` · perf ci-dessous
- [x] perf C7 ×3 — `froid 171 ms · chaud médiane 74 ms` · `froid 167 · 74` · `froid 169 · 74` (≤ 600 / ≤ 120)
- [x] cache prouvé (compteur Path.read_text+Path.open+builtins.open, banc) — `chaud … context+result 0` · modif `delta/T005/task.md` a-faire→en-cours `→ recalcules ['delta']` ; compteurs delta `a-faire 24→23, en-cours 0→1` ; `autres egaux True` ; `agents delta [{'role':'testeur','tid':'T005'}]`
- [x] salle-banc slug + refus + kill — `--json --projet agentx-entreprise → agentx-entreprise requete` ; :7800 refus OK (ci-dessus) ; `kill 197934 ; curl → 000`
- [x] POST `/api/run` inchangé — `git diff -- bin/dash.py | grep -cE 'construire_argv|def executer|_EXECUTION' → 0`
- [x] py_compile + doctor — `py_compile rc=0` · `python3 bin/vx.py doctor → vault coherent. rc=0`
- [x] périmètre — `git diff --stat -- bin/dash.py → 246 +212 -34` ; sonnerie.py 30 / terminal.py 16 = T004, hors éval (pack T007:24)
- [x] result.md T003 au format — 5 sections exactes, 54 lignes ≤ 70
- [x] forme §C1 + C2 + C4 (banc 5 projets : alpha, delta actifs ; beta dormant utime −10 j ; epsilon −10 j + en-cours ; gamma clos ; archive/vieux-truc) — `valide.py → KO ∅` (sans param, `beta`, `gamma`) ; réel `KO ∅` (sans param, `dashboard-direct`)
  - `etages [(0,alpha,F),(1,delta,F,bloque),(2,epsilon,F,10.0),(3,beta,True,10.0,todo 0)]` · `?projet=beta → beta dormant False` · `todo 40 total 58` · `sous_sol [gamma projets, vieux-truc archive]`
- [x] sécurité `?projet=` — audit hook open/listdir : `../x`, `x\x00`, `a×200`, `vieux-truc`, `../archive/vieux-truc → accès en plus vs sans param : ∅` ; refus tronqué 48 car. ; `gamma (clos) → requete`, seul `+projets/gamma/journal.md`
- [x] écarts T003 jugés — voir Vérifié comment ; 0 rupture C1-C4 ni consommateur
## Motif
∅
## Vérifié comment
```
écart 1 clos hors blocs : ?projet=gamma → selection gamma, etages sans gamma, sous_sol gamma selectionnable — conforme C1 (etages = statut ∉ clos) ; C7 L230 littéral ferait de gamma un étage → contradiction C1/C7 tranchée pour C1
écart 2 _doctor_rapide sur blocs : HEAD vs arbre, réel → [] == [] ; banc 3 packs vides → égaux True ; banc pack rempli / minimal / absent → ['T001 : en-cours mais pack vide'] ×2 égaux True
écart 3 helpers _age_j/_dormant/_ordre/_epingle : privés, 0 clé JSON en plus (item clés = 7 C4, etage clés = 14 C1)
écart 4 agents[:12] dans bloc : C1 « ≤ 12 tronqué » ; tri tid vérifié valide.py
écart 5 run/projet lu 2× : course épingle≠selection théorique, 0 consommateur de immeuble.epingle en L1
ordre C2 banc (float) : delta 1792078795.2262864 > alpha 1792078795.2260363 > epsilon = beta (dormant en dernier)
```
## Écarts
- lecture hors WL : ∅ (`git show HEAD:bin/dash.py` → copie banc `dash_head_ref.py`, référence `_doctor_rapide` ancien)
- banc : `rm -rf run` et `rm -f …/T001-tache-e0/context.md` dans `.cache/banc-T007/` — hors motif Bash listé, périmètre E respecté
- `valide.py` 1er passage banc : faux KO ordre C2 (activite à la minute, ex æquo) ; refait en float → conforme
## Pour la suite
- contrat C7 L230 « blocs[sel.name] = _bloc_projet(sel) » contredit C1 (clos ≠ étage) : corriger le contrat au profit de C1
- cache insensible à `roles.json` (dep_satisfaite, livre_en) : invalidation à prévoir si registre change à chaud
- chaud 74 ms dont ~118 task.md relus/poll par `rh.personnel()` : 1er poste à mettre en cache si N croît
- DoD `git diff --stat -- bin/` des lots parallèles : filtrer par fichier E du lot
## Retour sur le pack
- Manquait: syntaxe `vx.py set --statut` (positionnel refusé) · `git show HEAD:` pour comparer ancien `_doctor_rapide` · `rm` sur fichiers du banc
- Inutile: ∅
