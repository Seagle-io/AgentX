---
tache: T018
statut: revue
---
## Livré
- bin/vx.py:18-24 — imports contextlib, fcntl, shlex
- bin/vx.py:185-190 — `verrou(proj)` : flock LOCK_EX sur `<proj>/.verrou`
- bin/vx.py:245-274 — cmd_tache sous verrou ; mkdir exist_ok=False après contrôle deps
- bin/vx.py:337-392 — cmd_virer entier sous verrou, task.md relu dedans
- bin/vx.py:345-346 — context.md absent → die rc 2, rien écrit
- bin/vx.py:354 — remplaçante mkdir exist_ok=False
- bin/vx.py:495-497 — `_citer_motif` : shlex.quote, sinon `"<motif>"`
- bin/vx.py:419-420, :542 — retenir die + integrer suite via `_citer_motif`
- bin/vx.py:715-720 — doctor : `<slug>/<tid> : id en double (...)`
- bin/dash.py:177-183 — `_EXECUTION` threading.Lock autour subprocess executer
- bin/dash.py:310-315 — projet non clos au journal.md le plus récent ; épingle prioritaire inchangée
- bin/dash.py:38, :528, :581 — actions/todo virer via `_citer_motif` importé de vx
## Vérifié comment
banc `.cache/banc-T018` (bin/ recopié), projet `banc`
```
S1a virer T001 & virer T002 → "T001 : en-cours -> rejete (motif : a) / T006 … rc=0" · "T002 : en-cours -> rejete (motif : b) / T005 … rc=0"
    rg remplacee_par → T001-t1/task.md:14:remplacee_par: T006 · T002-t2/task.md:14:remplacee_par: T005
S1b virer T005 & virer T005 → "vx: erreur: T005 en statut « rejete » : aucun agent a virer (abandonne-la) rc=1" · "T005 : en-cours -> rejete (motif : b) / T007 … rc=0"
S2a 2 curl //  POST /api/run virer T009 & T010 (:7795) → {"code": 0, … T011} · {"code": 0, … T012}
S2b 2 curl // virer T004 ×2 → {"code": 0, … T013} · {"code": 1, "err": "vx: erreur: T004 en statut « rejete » : aucun agent a virer (abandonne-la)\n"}
    vx doctor (banc) → vault coherent. rc=0 ; kill pid ; curl → 000
S3 cp -r T004-t4 → T004-gamma, T004-zeta ; doctor → "x banc/T004 : id en double (T004-gamma, T004-t4, T004-zeta)" rc=2 ; retrait → vault coherent. rc=0
S4 eval T008 verdict virer, Motif = a `touch $B/INJ` $(echo X) "q" ; commande extraite des 4 sources (identiques) :
    python3 bin/vx.py virer T004 --motif 'a `touch $B/INJ` $(echo X) "q"' --projet banc
    ×4 (integrer, retenir die, dash --json todo, actions T004), vault restauré entre chaque, B exporté :
    bash -n rc=0 · bash -c → "T004 : revue -> rejete (motif : a `touch $B/INJ` $(echo X) "q)" rc=0
    ls INJ → "impossible d'accéder à 'INJ'" · task.md → statut: rejete / motif: a `touch $B/INJ` $(echo X) "q
S5 T003 en-cours sans context.md → "vx: erreur: T003 sans pack : vault/projets/banc/taches/T003-t3/context.md absent, rien a recopier" rc=2 ; md5sum vault avant/après → 0 diff
S6 salle-banc, projets banc + autre (statut cadrage) → state.json projet.slug :
    création autre: autre · utime banc: banc · utime autre: autre · utime banc: banc · run/projet=autre: autre · journal autre absent: banc
python3 -m py_compile bin/vx.py bin/dash.py → rc=0
./bin/agentx doctor (vrai vault) → vault coherent. rc=0
git diff --stat -- bin/ → dash.py | 26 ++++----  vx.py | 193 ++++---  2 files, 124 insertions(+), 95 deletions(-)
git diff -w --stat -- bin/ → dash.py | 22  vx.py | 37  2 files, 44 insertions(+), 15 deletions(-)   — reste = réindentation des blocs `with`
```
## Écarts
- ∅ lecture hors WL
- cmd_tache : mkdir déplacé après contrôle deps — sinon dossier vide → FileExistsError au retry
- S4 : guillemet final du motif retiré par le nettoyage existant `strip("\"'")` (conservé, décision actée)
## Pour la suite
- `vault/projets/agentx-entreprise/.verrou` existe (17:12:44, même instant que T019) : créé par `tache` du chef avec le vx.py modifié ; .gitignore déjà à jour hors moi
- salle réelle :7777 à relancer pour charger dash.py (Lock, sélection de projet)
- motif finissant par `"`/`'` tronqué par vx : nettoyage à revoir si on veut le motif byte-exact
- banc laissé dans `.cache/banc-T018/` (jetable)
## Retour sur le pack
- Manquait: preuve S6 « journal absent → 0 » sans projet plus récent à opposer ; impact du nettoyage `strip` sur « motif intact » non signalé
- Inutile: `lister_projets :166` en WL (non modifié)
