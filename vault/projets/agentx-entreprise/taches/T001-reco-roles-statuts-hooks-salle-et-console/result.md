---
tache: T001
statut: fait
---
## Livré
### Rôles (hits `rg eclaireur|verificateur bin dash .claude`)
- bin/vx.py:31 — ROLES tuple (liste) ; usages :223-224, :526, :567 (`--role choices`)
- bin/garde_dispatch.py:20 — ROLES set (liste) ; filtre subagent_type
- bin/sonnerie.py:27 — ROLES set (liste) ; filtre agent_type
- bin/dash.py:65-73 — ROLES_META (cle,nom,sous,label) 7 entrées dont chef, vault
- bin/dash.py:300 — boucle ROLES_META → s.roles ; vault traité à part :301
- bin/dash.py:365-376 — _objet : couple de rôles → type de colis
- bin/dash.py:476-482 — todo « faire vérifier » : rôle verificateur codé
- bin/dash.py:608-681 — etat_demo : données fictives par rôle (texte)
- bin/supervision.py:330,339,347 — `--role eclaireur` dans cmd suggérées (texte, hors WL)
- dash/dash.js:8 — COULEUR_ROLE (couleur) 7 clés
- dash/dash.js:262-267 — POSTES coordonnées iso par rôle (silhouette/bureau)
- dash/dash.js:423-425 — bureau() appelé en dur par rôle (liste ; scribe/architecte/implementeur/chef idem :420-428)
- dash/dash.js:38-85 — rendreDeck : cartes `#card-<cle>` depuis s.roles
- dash/dash.css — ∅ liste de rôles ; couleurs via `--c` posé en JS
- .claude/agents/{eclaireur,architecte,implementeur,scribe,verificateur}.md — 1 fichier/rôle
- .claude/skills/chef-de-projet/SKILL.md:16-22 — tableau 5 rôles + modèle (texte)
- .claude/skills/chef-de-projet/SKILL.md:176 — verificateur DÉFAUTS (texte)
- .claude/commands/projet.md:18, pack.md:13 — mention eclaireur (texte, hors WL)
- bin/terminal.py:24-40 — CONSIGNE_CHEF texte (rôles non listés, citations statuts)
### Statuts
- bin/vx.py:32-33 verbatim ci-dessous (Pour la suite)
- bin/vx.py:269, :268 — validation `set` ; :299 STATUT_OUVERT ; :315, :340, :374 tuples en dur
- bin/dash.py:75 — ORDRE_PIPELINE 6 statuts (∅ `abandonne`)
- bin/dash.py:34,126,791 — import STATUTS ; validation ; exposé `state.json.statuts`
- bin/dash.py:229,404-409,446,471,540,594 — comparaisons littérales en-cours/bloque/pret
- bin/garde_dispatch.py:53 — `("pret","en-cours")` en dur
- bin/sonnerie.py:45 — `"bloque"` en dur ; RE_STATUT `[a-z-]+`
- dash/dash.js:12-13 — COULEUR_STATUT 6 clés (∅ `abandonne`)
- dash/dash.js:269-270,570,577 — RANG_ETAT/COULEUR_ETAT/NOM_ETAT : attente/livre/actif/bloque (états flux ≠ statuts)
- dash/dash.js:528 — classes `.trow.encours/.bloque` ; dash.css:287
### CLI (bin/vx.py, argparse sous-parsers :555-599)
- init→cmd_init:188 · projet→cmd_projet:199 · tache→cmd_tache:221 · set→cmd_set:267
- board→cmd_board:291 · ready→cmd_ready:367 · integrer→cmd_integrer:327
- pack-lint→cmd_pack_lint:402 · index→cmd_index:460 · archive→cmd_archive:498
- doctor→cmd_doctor:508 · help→lambda
- journaliser:177 — append `- \`now()\` msg` dans projet/journal.md
- vx.py:526 — doctor rejette tout role ∉ ROLES
### Gardes/hooks
- .claude/settings.json:13-39 — PreToolUse Agent→garde_dispatch ; Bash→garde_bash ; SubagentStop→sonnerie
- bin/garde_dispatch.py:35-58 — règle d'acceptation (verbatim en Pour la suite)
- bin/garde_dispatch.py:36-37 — subagent_type ∉ ROLES → autorisé sans contrôle
- bin/sonnerie.py:30-57 — écrit run/evenements.jsonl ; rotation >262144 o → 50 lignes
- bin/garde_bash.py — 55 l, non détaillé (hors DoD)
### Serveur (bin/dash.py)
- :782 do_GET · :807 _terminal · :832 do_POST · :746 _sse_terminal · :103 construire_argv · :133 executer
- :39 TERM = TerminalClient(cwd=ROOT) ; :88 JETON ; :89 HOTES_OK
- :161 _evenements (queue 8192 o, limite 12) · :258 construire_etat · :422 _todo · :604 etat_demo
- todo : _todo:422 déduite du vault ; add(prio,titre,detail,cmd,exe) :433 ; blocs prio1 bloque :446, prio3 dispatch :471, vérif :476
- :75 ORDRE_PIPELINE ; :300 roles ; :356 _objet ; :380 _flux
- GET `127.0.0.1:7777/state.json` → code 000 : salle non lancée (NV routes live)
### Console / terminal
- bin/terminal.py:47 class Terminal ; :166 _chemin_socket ; :172 _servir ; :235 class TerminalClient ; :308 main `--daemon <cwd>`
- bin/terminal.py:42 PROGRAMME ; :44 TAMPON_MAX=262144 ; socket ~/.local/state/agentx-chef.sock
- dash/dash.js:1073-1270 xterm : termPost:1084 termEnvoyer:1098 termMort:1111 termModes:1125 termRepeindre:1132 termEcrire:1155 termEcouter:1170 termLancer:1201 brancherTerminal:1215
- dash/dash.js:1078 TERMINAL={term,fit,pos,src,vivant} ; fit :1227, resize :1254 debounce 150 ms
- limites : scrollback 5000 (:1220) ; saisie découpée en blocs ≤60000 car. (dash.py:813) ; 1 seule session (TERM unique, pas d'id)
- limites : reconnexion SSE 1500 ms (:1197) ; reprise `etat` au chargement :1263 ; mort→relance 800 ms (:1118)
- limites : plein écran `.plein` (css:445) ; hauteur `min(70vh,640px)` min 320 (css:444)
- dash/dash.js:981-1072 CONSOLE legacy : sortie:981 ecrire:983 lancer:992 copier:1021 peuplerConsole:1036 brancherConsole:1053
- piège : `#console-etat` ∅ dans index.html (rg) → ecrire():987 déréférence null si appelée ; `#console-out` hidden, index.html:140
- piège : peuplerConsole/brancherConsole existent, panneau barre-console ∅ dans HTML (css:412-437 mort)
### Panneaux (index.html id → rendu JS)
- #projet-actif:15 → rendre:892 (poser #projet-*)
- #deck:29 → rendreDeck:38 · #room:46 → construireSalle/bureau:155 · #todo:61 → rendreTodo:545
- #flux:72 → rendreFlux:571 · #chart:83 → rendreCourbe:470 · #supervision:93 → rendreSupervision:655
- #tasks:106 → rendreTaches:526 · #journal:109 (dans rendreTaches) · #seuils:118 → rendreSeuils:593
- #toasts:145 → sonnerie (dash.js:787-870) · #term:139 → brancherTerminal
### Agents
- .claude/agents/*.md — 5 fichiers ; frontmatter : name, description, tools, model (4 champs)
- tools : architecte `Read, Grep, Glob, Write, Edit, WebSearch, WebFetch` · eclaireur/verificateur `Read, Grep, Glob, Bash, Write` · scribe `Read, Write, Edit, Grep, Glob, Bash`
- model : architecte opus · eclaireur sonnet · implementeur inherit · scribe sonnet · verificateur opus
- vx.py:cmd_tache `--modele` inherit|opus|sonnet|haiku (task.md) ; ≠ frontmatter agent
## Vérifié comment
- `rg -n "eclaireur|verificateur" bin dash .claude` → 3 listes (vx:31, garde_dispatch:20, sonnerie:27) + dash.py:65 + dash.js:8,262,423
- `curl -s -o /dev/null -w %{http_code} 127.0.0.1:7777/state.json` → 000
- `rg -n "console-etat" dash` → css:435-437, js:987,989 ; index.html ∅
- NV — signatures complètes cmd_integrer/cmd_pack_lint/cmd_board (lu seulement :327,:402)
- NV — dash.js:1036-1072 corps non lu
## Écarts
- ∅
## Pour la suite
- 4 sites listent les 5 rôles en dur : vx.py:31, garde_dispatch.py:20, sonnerie.py:27, dash.py ROLES_META:65 (+ dash.js COULEUR_ROLE:8, POSTES:262, bureau():420-428) ; 1 agent .md/rôle.
```
vx.py:31  ROLES = ("eclaireur", "architecte", "implementeur", "verificateur", "scribe")
vx.py:32  STATUTS = ("a-faire", "pret", "en-cours", "bloque", "revue", "fait", "abandonne")
vx.py:33  STATUT_OUVERT = ("a-faire", "pret", "en-cours", "bloque", "revue")
dash.py:75 ORDRE_PIPELINE = ["a-faire", "pret", "en-cours", "revue", "bloque", "fait"]
dash.py:65 ROLES_META: tuples (cle, NOM, sous-titre, label) ; chef + vault = pseudo-rôles non affectables
```
- garde_dispatch (accepte si) : tool_name=="Agent" ET subagent_type ∈ ROLES (sinon laisse passer) ; RE_PACK=`vault/projets/([a-z0-9-]+)/taches/(T\d{3})[^\s`'"]*?/context\.md` dans prompt ; dossier `T###-*` + context.md existent ; task.md `^statut:\s*(\S+)` ∈ {pret,en-cours} ; `vx.py pack-lint TID --projet slug` rc==0 ; sinon JSON permissionDecision=deny.
- run/evenements.jsonl (1 ligne JSON) :
```
{"id":"<hex16>","t":"HH:MM:SS","quoi":"agent-fini|agent-bloque","role":"<ROLES>","tid":"T###|\"\"","statut":"<[a-z-]+>|\"\""}
```
  tid/statut lus dans les 1000 premiers car. de last_assistant_message (`^tache:`, `^statut:`) ; role = agent_type.
- Routes dash.py : GET /state.json (+jeton, statuts) · GET /api/term/stream?jeton=&depuis= (SSE, base64 {o,pos}|{mort}|{fin,pos}) · GET statique (no-store) · POST /api/run {action,projet,tid,statut} · POST /api/term/{open,in,resize,stop,etat} ; POST exige Host local + header X-AgentX-Jeton ; corps ≤65536.
- Liste blanche /api/run : ACTIONS_LECTURE=("board","ready","doctor","index") (+`--projet` pour board/ready) ; "set" (tid,projet,statut∈STATUTS) ; "pack-lint" (tid,projet).
- API terminal.py : `Terminal(cwd)` {vivant, demarrer(cols=120,rows=32), arreter, ecrire(bytes), redimensionner(cols,rows), attendre(position, delai=15.0)->(pos, bytes, code)} ; `TerminalClient(cwd)` même API + position(), code() via socket unix.
- Frontmatter agent (champs : name, description, tools, model) :
```
---
name: implementeur
description: <texte>
tools: Read, Edit, Write, Grep, Glob, Bash
model: inherit
---
```
- Ajouter un rôle = toucher vx.py:31, garde_dispatch:20, sonnerie:27, dash.py:65 (+ _objet:365-376), dash.js:8/262/423, agent .md, SKILL.md:16-22.
- Ajouter un statut = vx.py:32-33, dash.py:75, dash.js:12, tuples littéraux garde_dispatch:53, vx.py:315/340/374.
- Terminal : session unique (TERM global dash.py:39), pas d'id multi-session ; stream indexé par position d'octets (tampon 262144).
## Retour sur le pack
- Manquait: ∅ | Inutile: SKILL.md (peu utile), settings.json
