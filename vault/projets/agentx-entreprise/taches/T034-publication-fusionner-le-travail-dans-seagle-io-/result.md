---
tache: T034
projet: agentx-entreprise
statut: revue
---
## Livré
Worktree `.cache/agentx-pub`, branche `immeuble-entreprise`, commit `9bb1315` (48 fichiers, +4398 −418 vs origin/main).
- 7 fichiers auto (rc 0) : `.claude/agents/{architecte,eclaireur}.md`, `.claude/commands/dispatch.md`, `.claude/settings.json`, `bin/agentx`, `bin/terminal.py`, `bin/garde_bash.py` (= public : règles docker travail déjà présentes)
- 29 copies travail + `roles.json` (copie + `critique` : opus, livre_en fait, juge true, `#ff4fd8`)
- `bin/vx.py` — conflits résolus (3) — ROLES/STATUTS registre ; cmd_tache public (enfants) ; cmd_set verrou public + gardes rejete/revue travail
- `bin/vx.py` — hors conflit : verrou unique `verrou_projet` (réentrant) ; `_creer_tache` modèle de roles.json + `_avec_fiche_env` ; virer re-parente l'enfant
- `bin/dash.py` — conflits résolus (15) — immeuble travail ; `_tete` + `_EXECUTION` ; journal `[-1]` ; Intégrer : statut du result + livre_en
- `bin/dash.py` — hors conflit : `RE_SLUG/RE_TID.match` → `fullmatch` (×3, regex publiques non ancrées) ; « Clore X ? » déplacé au toit (`_todo_clore`)
- `bin/garde_dispatch.py` — conflits résolus (1) — liste ROLES supprimée, roles.json fait foi
- `dash/dash.js` — conflits résolus (8) — couleurs/postes du registre ; `OBJETS` avec positions travail ; sélecteur public retiré (immeuble le remplace)
- `dash/dash.css` — conflits résolus (6) — travail, `.frame` gap 8 px public ; règles `.pa-vue/.pa-choix/.pa-epingle/.console-barre` mortes retirées
- `dash/index.html` — conflits résolus (1) — = HEAD travail (console et `pa-vue` remplacés par pilote/immeuble)
- `.claude/skills/chef-de-projet/SKILL.md` — conflits résolus (1) — table de 18 rôles, critique + architecte « en tête » ; noms conventions client → `conventions-<projet>`
- `CLAUDE.md` — conflits résolus (1) — 17+1 rôles ; + immeuble, outils-test, actions de la page
- `.gitignore` — conflits résolus (1) — union + `vault/syndicat/`
- `vault/_templates/context.md` — conflits résolus (3) — union des lignes ; `GEOLENS_ENV` → `<APP>_ENV`
- `README.md` — § Nouveautés (11 l) ; /rh, /syndicat ; table console ; § « Les rôles » + critique
## Vérifié comment
base : `bbc7c12` ≡ `9de5525` sur vx.py, dash.py, dash.js, SKILL.md, garde_dispatch.py, agentx, terminal.py, dash.css, index.html → identiques ; CLAUDE.md ≠ (L39 : 9de5525 a déjà « suppression de volumes Docker ») ; garde_bash.py ≠ (9de5525 a déjà 3 règles docker L27-30)
`rg -n "^(<<<<<<<|=======|>>>>>>>)" .cache/agentx-pub` → ∅ (rc 1)
`python3 -c "import roles; print(repr(roles.erreur()))"` → `''` ; tous 20, affectables 18
`python3 -m py_compile bin/*.py` → rc 0 ; `bin/agentx` (python) ast.parse OK
`python3 bin/test_garde_bash.py` → `Ran 3 tests in 2.033s` / `OK`
`node --check dash/dash.js` → rc 0
banc `.cache/banc-T034/depot` (copie worktree + `vx.py projet banc`) : tache implementeur → `+ T002 verificateur (enfant)` ; `set T001 --statut fait` → `livre en revue : retenir T001` rc 1 ; virer → T004 + `deps reecrites : T002`, T002 `parent: T004` ; abandon T004 → `- T002 abandonne (enfant)` ; `vx.py doctor` → `vault coherent.` rc 0
`python3 bin/dash.py --json` → rc 0 ; clés `immeuble` présente, `roles` 20 entrées (18 affectables + chef + vault), `registre_erreur` ''
`construire_argv({'action':'board','projet':'banc\n'})` → refus projet inconnu
salle `--port 7814 --no-open &` → GET / 200, /state.json 200, /dash.js 200 ; kill → 000
`rg -n -i "orthopro|geolens|ortho_test|seagle-site|192\.168\.|/home/jdrac" .cache/agentx-pub --glob '!outils-test/**' --glob '!.git/**'` → avant : 2 (`bin/garde_bash.py:12` OrthoPro, `:37` geolens-viewer, commentaires publics) → retirés ; après → ∅
`git diff --stat origin/main | rg "vault/projets/|…|\.cache/"` → ∅
`git -C .cache/agentx-pub log --oneline -2` → `9bb1315 Immeuble et entreprise : fusion du travail AgentX dans la version publique` / `0c02c48 Mise a jour Agentx`
`git -C .cache/agentx-pub status --short` → ∅
## Écarts
- DoD « roles (18) » : `roles` du --json = 20 cartes (chef, vault non affectables) ; 18 affectables
- hors liste de fusion : README.md, garde_bash.py (2 commentaires client) — exigés par la DoD
- sélecteur de projet public (`projet-choix`, localStorage) retiré : l'immeuble (hash, épingle, activité) couvre l'intention
- contraste public `.console-barre .cbtn` (`--c-bord`) perdu avec la console ; non reporté sur `.pilote-barre`
- `salon()` supprimé côté public, appelé côté travail → appel retiré
- todo : « Faire vérifier »/« Capitaliser » travail remplacés par « Contrôles manquants »/« Clore » publics
- banc dans `.cache/banc-T034/depot/` (sous-dossier : fichiers merge-file à côté)
- 0 lecture hors WL
## Pour la suite
- humain : `git -C ~/Documents/AgentX push -u origin immeuble-entreprise` puis PR vers `main`
- `.claude/skills/outils-test/SKILL.md` (public) cite `/home/sylvain/...` en dur : chemin personnel déjà publié
- gabarit `context.md` : `fichiers_whitelist` compte `result.md`, `decisions.md` → pack vierge vu « FAIL » (déjà vrai côté travail)
- virer `--role` ≠ implementeur sur un parent → doctor « parent n'est pas implementeur »
## Retour sur le pack
- Manquait: présence de `RE_SLUG`/`RE_TID` non ancrées côté public (`.match` travail = faille) ; `salon()` supprimé public ; deux verrous `.verrou` concurrents (interblocage)
- Inutile: ∅
