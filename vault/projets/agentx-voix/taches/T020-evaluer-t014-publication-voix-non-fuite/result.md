---
tache: T020
projet: agentx-voix
statut: fait
evalue: T014
verdict: retenir
---
## Verdict
retenir — voix seule, 0 fuite, tout tourne
## DoD
- [x] T014·1 fichiers neufs copiés tels quels, +x parle/dictee/parle_hook.py — `git show b7ab7c1:<f> | diff - $P/<f>` → parle/dictee/parle_hook.py/voix.py rc 0 ; INSTALL-voix.md rc 1 = 4 lignes L3/L34/L63/L82 « chez Julien » → « machine de référence » (déclaré, décision dépôt PUBLIC) · `ls-tree HEAD` → 100755 dictee/parle/parle_hook.py, 100644 voix.py
- [x] T014·2 merge-file, hunks voix seuls — lignes ajoutées `45e9fbc..b7ab7c1` absentes du public : dash.py 24/52 (0 voix : PRET_SANS_AGENT_S, evenements_par_tache, sans_agent, _empreinte_evenements, echeance, _CACHE cle, « prête mais aucun agent ») · CLAUDE.md 1/5 (« Ne jamais passer une tâche en-cours à la main ») · sonnerie 0/5 · dash.js 0/94 · dash.css 0/32 · index.html 0/14 ; tableau collé result T014 L9-17
- [x] T014·3 0 marqueur, 0 fuite, fichiers interdits absents — `… | xargs grep -n -E "^(<<<<<<<|>>>>>>>|=======$)"` → rc 123 (∅) ; `--name-only | grep -E "produits|publier|^outils/|^vault/|garde_dispatch|bin/agentx|SKILL"` → rc 1 (∅)
- [x] T014·4 ça tourne (refait sur `.cache/eval-voix-T020`, port 7825) — voir Vérifié comment
- [x] T014·5 1 commit FR + Co-Authored-By, status ∅ — `log origin/immeuble-entreprise..HEAD` → 1 ligne `c91fc21 Voix d'AgentX : …` ; corps finit `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>` ; `status --short` → 0 ligne
- [x] T014·6 result.md au format — sections Livré/Vérifié comment/Écarts/Pour la suite/Retour sur le pack, corps 42 l ≤ 60
- [x] T020 fuite, diff complet 1086 l — `rg -n -i "<motif DoD>" d.diff` → 13 hits : `os.environ` ×10 (dictee L11-23, parle L12/18, parle_hook L8, voix L33), `VOIX.envoi` ×6 (dash.js), `tokenizer.json` (guide L61) = mots du code ; 0 nom, 0 IP, 0 chemin /home ; motifs sup. `seagle|documents|@|https?://|chez` → `Seagle-io/AgentX` clone public, `~/Documents/Workspace` chemin générique, huggingface/astral URLs publiques
- [x] T020 périmètre = 11 fichiers — `diff --name-status` → M CLAUDE.md, bin/dash.py, bin/sonnerie.py, dash/dash.css, dash/dash.js, dash/index.html ; A bin/dictee, bin/parle, bin/parle_hook.py, bin/voix.py, docs/INSTALL-voix.md ; hunks dash.py ×4 = import voix, etat["voix"], _voix, /api/voix/ ; CLAUDE.md ×1 = puce Voix
- [x] T020 0 perte — `--numstat` → suppressions 2 (dash.py do_POST startswith, dash.js ligne brancher*) remplacées ; `def|class|function` origin→HEAD : dash.py 53→54 perdus [] (+_voix) · dash.js 78→83 perdus [] (+voixPost, brancherVoix, majBoutonsVoix, majPiedVoix, rendreVoix) ; publics dash.py : battre construire_argv executer construire_etat etat_demo changer_couleur main
- [x] T020 ça tourne sur ma copie — voir Vérifié comment
- [x] T020 status ∅, commit unique — `git -C .cache/agentx-pub status --short | wc -l` → 0 ; `rev-parse origin/immeuble-entreprise HEAD~1` → 9bb1315… ×2
- [x] T020 verdict cohérent — 0 case `[ ]` ⇒ retenir, Motif ∅
- [x] T020 result.md au format — ce fichier
## Motif
∅
## Vérifié comment
`cp -r .cache/agentx-pub .cache/eval-voix-T020` ; `.git` de la copie réécrit `gitdir: /nonexistent-eval-voix-T020` — copie ne touche pas le worktree réel
`python3 -m py_compile bin/*.py` → rc 0 · `ast.parse(parle, dictee)` → `ast OK` · `node --check dash/dash.js` → rc 0
`python3 bin/test_garde_bash.py` → `Ran 3 tests in 2.562s` / `OK`
`vx.py projet banc` + `tache "tache banc" --role implementeur` → T001 + T002
`AGENTX_VOIX_DIR=<scratchpad>/voix PATH=.cache/T002/stub:$PATH dash.py --port 7825 --no-open` → GET / 200 ; state.json → `voix ['dictee','ecoute','en_cours','journal','mode','parle'] 6` · `journal 2` · `demo False` · `immeuble dict ['epingle','etages','mesure_ms','selection','sous_sol','toit']` · `erreur None`
POST /api/voix/mode `{"on":true}` → 200 `mode: true`, flag `claude-voix-on` créé dans dir jetable ; `{"on":false}` → 200, flag retiré ; micro `{"on":"x"}` → 400 `on attendu : true|false` ; `/dire` → 400 `route inconnue : dire` ; sans jeton → 403 `jeton invalide — recharge la page`
Playwright 1.62 (`/api/term/**` stub, stream `text/event-stream`, `/api/run` intercepté) → `{"voix":true,"lignes":["10:02\nPhrase eval deux, la plus récente.","10:01\nPhrase eval une."],"pied":"parle n'est pas lancé","tour":"immeuble","etages":6,"erreurs":[]}`
`kill <pid>` ; `curl :7825/state.json` → `000`
## Écarts
- lecture hors WL: `git show b7ab7c1:<5 fichiers neufs>` dépôt de travail — vérifier « copiés tels quels »
- lecture hors WL: `git diff 45e9fbc b7ab7c1 -- <6 fichiers modifiés>` — vérifier 0 hunk voix oublié/0 non-voix gardé
- écriture `.cache/eval-voix-T020/.git` (E) — copie pointait vers le worktree réel `/home/…/AgentX/.git/worktrees/agentx-pub`
- auteur commit `dracjulien <dracjulien@users.noreply.github.com>` contient « julien » : métadonnée identique à 9bb1315/9de5525 déjà publics — pas une fuite neuve
- copie conservée ; nettoyage : `rm -rf .cache/eval-voix-T020`
## Pour la suite
- humain : `git -C ~/Documents/AgentX push origin immeuble-entreprise` (garde_bash refuse aux agents)
- guide L26-28 clone `main` sans voix tant que `immeuble-entreprise` non fusionnée
- hunks dash.py exclus (sans_agent, evenements_par_tache) à publier avec T036
## Retour sur le pack
- Manquait: `cp -r` d'un worktree copie le fichier `.git` → git dans la copie viserait l'index réel ; prescrire réécriture/suppression de `.git` · `rg` absent pour `xargs` (fonction shell) → `grep -E`
- Inutile: ∅
