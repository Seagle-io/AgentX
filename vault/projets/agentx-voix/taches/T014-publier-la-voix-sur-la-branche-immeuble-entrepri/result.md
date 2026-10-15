---
tache: T014
projet: agentx-voix
statut: revue
---
## Livré
Worktree `.cache/agentx-pub`, branche `immeuble-entreprise`, commit `c91fc21` (11 fichiers, +937 −2 vs origin/immeuble-entreprise).
- `bin/parle`, `bin/dictee`, `bin/parle_hook.py` — copiés `b7ab7c1`, 100755
- `bin/voix.py` — copié `b7ab7c1`, 100644 (= travail) ; dépend de `roles.role()` présent public
- `docs/INSTALL-voix.md` — copié + 4 lignes « chez Julien » neutralisées (voir Écarts)
- `bin/dash.py` — hunks voix gardés (4) : `import voix`, `etat["voix"]`, `_voix()`, routes `/api/voix/` (do_POST ×2) / exclus (7) : import vx `PRET_SANS_AGENT_S|evenements_par_tache|sans_agent` (conflit → public gardé), `_evenements` filtre dispatch, `_empreinte_evenements`, docstring+clé cache `_bloc_projet`, `echeance`, `_CACHE (cle,…)`, `_todo` « prête mais aucun agent »
- `bin/sonnerie.py` — gardés (1) `voix.annoncer` / exclus (0)
- `dash/dash.js` — gardés (3) bloc CONSOLE VOCALE, `rendreVoix(s)`, `brancherVoix()` / exclus (0)
- `dash/dash.css` — gardés (3) `.voix-*`, media 2 / exclus (0)
- `dash/index.html` — gardés (1) section `#voix` / exclus (0)
- `CLAUDE.md` — gardés (1) puce Voix / exclus (1) « Ne jamais passer une tâche en-cours à la main »
- hors lot (non touchés) : `bin/agentx` (publier/rattacher), `bin/garde_dispatch.py` (T036), `.claude/skills/chef-de-projet/SKILL.md` (dispatch), `produits.json`, `bin/produits.py`, `bin/publier.py`, `outils/`
## Vérifié comment
`git merge-file … $P/<f> base travail` → dash.py rc 1 (1 conflit import vx) ; sonnerie, dash.js, dash.css, index.html, CLAUDE.md rc 0
`grep -rn -E "^(<<<<<<<|>>>>>>>)" <11 fichiers du diff>` → ∅ (rc 1)
`git diff --name-only origin/immeuble-entreprise..HEAD | xargs grep -n -i -E "orthopro|geolens|ortho_test|seagle-site|192\.168\.|/home/[a-z]+|jdrac|julien@"` → ∅ (rc 123 = aucun fichier ne matche)
`… | grep -E "produits|publier|^outils/|vault/(projets|syndicat|connaissances|artefacts|archive)"` → ∅ (rc 1)
`git diff | grep '^+' | grep -i -E "seagle|sylvain|kora|secret|token|…"` → `Seagle-io/AgentX` (URL clone publique), `tokenizer.json` (modèle), `commandes client` (socket parle) — légitimes
banc `.cache/banc-voix-T014` (copie worktree sans `.git`) :
`python3 -m py_compile bin/*.py` → rc 0
`ast.parse(bin/parle, bin/dictee)` → `ast OK`
`node --check dash/dash.js` → rc 0
`python3 bin/test_garde_bash.py` → `Ran 3 tests in 2.403s` / `OK`
`vx.py projet banc` + `tache … --role implementeur` (sinon mode DÉMO → `immeuble: None`)
salle `AGENTX_VOIX_DIR=<scratchpad>/voix PATH=.cache/T002/stub:$PATH dash.py --port 7824 --no-open` → GET / 200 ; state.json : `voix ['dictee','ecoute','en_cours','journal','mode','parle'] 6` · `journal 2` · `demo False` · `immeuble dict ['epingle','etages','mesure_ms','selection','sous_sol','toit']`
POST `/api/voix/mode {"on":true}` → 200 `mode: true` (flag `claude-voix-on` dans dir jetable) ; `{"on":false}` → 200 ; `micro {"on":"x"}` → 400 `on attendu : true|false` ; `/api/voix/dire` → 400 `route inconnue : dire` ; sans jeton → 403
Playwright 1.62 (`/api/term/**`, `/api/run` interceptés ; stream en `text/event-stream`) → `{"voix":true,"lignes":["10:02\nPhrase de test deux, la plus récente.","10:01\nPhrase de test une."],"pied":"parle n'est pas lancé","tour":true,"etages":2,"erreurs":[]}`
`kill <pid>` ; `curl …:7824/state.json` → `000`
`git -C .cache/agentx-pub log --oneline -2` → `c91fc21 Voix d'AgentX : parle, dictee, hook et serveur voix, annonces de la sonnerie, console vocale de la salle, guide d'installation` / `9bb1315 Immeuble et entreprise : fusion du travail AgentX dans la version publique`
`git -C .cache/agentx-pub status --short` → ∅
## Écarts
- `docs/INSTALL-voix.md` ≠ copie exacte : « chez Julien » ×4 (L3, L34, L63, L82) → « sur la machine de référence » / « chemin par défaut de `dictee --model` » — prénom perso, dépôt public
- 1er Playwright : stub JSON sur `/api/term/stream` → 1 erreur console EventSource (artefact du banc) ; stub corrigé → 0
- banc conservé `.cache/banc-voix-T014` pour l'évaluateur ; nettoyage : `rm -rf .cache/banc-voix-T014`
- 0 lecture hors WL
## Pour la suite
- humain : `git -C ~/Documents/AgentX push origin immeuble-entreprise`
- guide L26-28 : `git clone …Seagle-io/AgentX` → branche par défaut `main` sans voix tant que PR non fusionnée
- exclus dash.py dépendent de `vx.py` travail (`sans_agent`, `evenements_par_tache`) : à publier avec T036
## Retour sur le pack
- Manquait: banc vide = mode DÉMO → `immeuble: None` (créer un projet banc) ; `/api/term/stream` est un EventSource (stub `text/event-stream`) ; « chez Julien » dans le guide non signalé par le motif rg
- Inutile: ∅
