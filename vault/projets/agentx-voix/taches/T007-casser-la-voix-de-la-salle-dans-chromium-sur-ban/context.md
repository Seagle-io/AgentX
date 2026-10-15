---
pack: T007
projet: agentx-voix
role: verificateur
cree: 2026-10-15
---

# Pack T007 — Casser la voix de la salle dans Chromium, sur banc

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
1 ligne : verbe + livrable + critère + `chemin`. Pas « améliorer X ».

## Definition of Done
checklist binaire, vérifiable par commande ou lecture.
- [ ] TODO-PACK
- [ ] TODO-PACK
Regex de DoD : compter ses occurrences sur HEAD, écrire « → N sur HEAD » ; imports inclus dans « net 0 ligne ».
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
WL exhaustive ≤ 12. Droit E (écriture) / L (lecture). Plage de lignes si gros.
Inclure en L les **dépendances de comportement** (hooks, helpers appelés par le code E). 1 ligne de DoD par fichier E, sinon le retirer.
Chaque chemin/symbole cité : `rg` du symbole sur HEAD avant écriture (pas de mémoire) ; inclure en L le fichier de helpers de test (makeTestApp…) et la garde réelle si elle vit hors du fichier cité.
Plage de lignes E : inclure les imports en tête de fichier si la tâche ajoute un import. Coordonnées = n° de ligne + ancre `rg` (les lignes dérivent entre tâches sur un même fichier).
Contrat déjà recopié ⇒ retirer le fichier de la WL (remplissage). Fichier que la DoD demande de relire/vérifier (lib, module voisin, `result.md` de la tâche vérifiée) ⇒ en L. Rôle architecte : `decisions.md` en E.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` | E | |
| `TODO-PACK` | L | |

## Contrats
signatures / schémas / formats RECOPIÉS verbatim, jamais référencés. Sinon `∅`.
Y compris les **signatures externes consommées** (composants du kit, lib tierce : props exactes + chemin du `.d.ts`) et, pour un testid, son rôle ARIA et son emplacement.
Test HTTP : recopier nom du cookie de session, route de login, helpers de fabrication (multipartBody, fixtures) et clés de seed utilisées.
Prémisse de comportement du pack (mapping d'entrée, « X est appelé », état de HEAD) : preuve `rg`/exécution, sinon NV. Fichiers non suivis ⇒ absents de `git archive HEAD` (AVANT).
Option de lib tierce : vérifier le `.d.ts` de la version INSTALLÉE après toute montée de version.
Forme d'objet consommé (clés JSON/dict, format d'un nombre : `round(100*t) %`, réponse `/api/run`) : recopiée, pas déduite du code.
Types de ligne DB/API consommés : 1 ligne chacun (ex. `ProjectRow.storage_prefix: string`). Code async touché : sémantique d'abort, d'erreur et d'état global (flags module, promesses en vol).
```
…
```

## Décisions actées
« décision — raison ≤ 8 mots ». Tranché, pas débattu. Détail : `decisions.md#date`.
- TODO-PACK
Règle durcie (validation, borne) : `rg` des fixtures de test qu'elle casse AVANT dispatch, les lister dans le pack.

## Hors périmètre
ce que l'agent ne fait PAS, même tentant.
- TODO-PACK

## Environnement
Fiche projet (`vault/projets/agentx-voix/env.md`, recopiée au scaffold — ne pas éditer ici) :

**Dépôts et branches**
- `/home/jdrac/Documents/Workspace/AgentX` · branche `master` · 0 remote
- arbre partagé : `dash/dash.js` déjà `M` (agentx-immeuble T018)

**Lancer, tester, linter**
- salle : `./bin/agentx` (idempotent) · `./bin/agentx statut` · après modif `bin/dash.py` : `./bin/agentx stop && ./bin/agentx`
- serveur de test : `python3 bin/dash.py --port 7790 --no-open` (pid tué en fin)
- état sans navigateur : `python3 bin/dash.py --json`
- voix : `parle status` · `parle say "…"` · `parle stop` · `dictee toggle`
- pipe-test hook : `echo '{"last_assistant_message":"<voix>ok</voix>"}' | python3 -I bin/parle_hook.py stop`
- Playwright : node + `.cache/eval-T015/e2e.mjs` (référence salle) ; Chromium installé par Playwright, pas de nouveau

**Comptes et données de test**
- ∅

**Versions**
- python3 système 3.14 (salle, hooks) · venv TTS `~/.local/share/parle-venv` (py3.13, piper-tts 1.8.0) · venv STT `~/.local/share/whisper-venv` (faster-whisper 1.2.1)
- voix Piper : `~/.local/share/piper-voices/fr_FR-{siwis,tom}-medium.onnx`

**Ports, URL, fuseau**
- salle `http://127.0.0.1:7777` · test 7790 · Europe/Paris

**Rouge d'avance**
- ∅

**Interdits**
- toucher l'état voix réel en test : `~/.cache/claude-voix-on`, `~/.cache/dictee.mute`, `~/.cache/parle.sock`, `~/.cache/dictee.pid` → `AGENTX_VOIX_DIR=<banc>`
- faire parler la machine en test (fake socket qui enregistre)
- `parle quit`, `dictee stop`, kill des démons voix réels
- éditer `~/.claude/settings.json`

**Bancs et scripts de référence**
- `.cache/eval-T015/e2e.mjs` — non-régression salle

versions d'outils, commandes qui marchent, ce qui est rouge d'avance (lint global…), ce qui est interdit (stack e2e) → « NV — raison » attendu. Regex de DoD testées à blanc, y compris sur la chaîne du test lui-même (un test qui cite `unpkg` fait mentir `rg unpkg → ∅`). Lookahead → `rg --pcre2`.
Images Docker : le chef fait `docker pull` à blanc avant dispatch ; seules les images réellement pullables figurent au pack (tag exact).
DoD périmètre : `git diff --stat -- <chemins E>`, jamais diff global (arbre partagé) ; le chef commite en local après chaque tâche.
`git diff --stat` inapplicable en arbre partagé non commité ou commit multi-lots (HEAD = N tâches) : le chef commite AVANT le lot, ou donne SHA par lot + compteurs/hunks de référence (fichier déjà `M` ⇒ nombre de hunks de départ).
Évaluer un livrable pendant qu'un autre lot édite les mêmes fichiers : instantané `.cache/snap-<T>/` (copie des fichiers E) pris par le chef, DoD lue sur l'instantané.
DoD de mesure sur vault vivant (compteurs, taux, nb de tâches) : comparer des Δ avant/après, jamais des valeurs absolues ; état absent du vrai vault (dormant, urgent…) ⇒ injection `state.json` dans le pack.
Marqueur de lint (`"TODO" + "-PACK"`) : jamais en clair dans un pack rempli, y compris en citation.
Outils absents/refusés (sed, grep, mv ; `garde_bash`) et syntaxe CLI exacte (`vx.py set --statut X`, positionnel refusé) : nommés au pack.
Script Playwright sur la salle : intercepter `/api/term/*` (la page POST `/api/term/open` seule) ; étages/projets requis = banc, vrai vault intact.
Config lue par le code touché : chemin + parseur (`bool()`, `intIn`…) + fichier `.env*` d'exemple. Tests : comptes seed et leurs accès (admin / membre / tiers).
Tâche sur un banc existant : chemin des scripts, env par défaut (BASE, port), paramètres exacts des runs de référence (ou lien vers la note banc). Compte de tests de base : relevé sur HEAD au dispatch ; tâches parallèles ⇒ borne ≥.
Fichiers non suivis par git (`??`) : absents de `git diff`/`HEAD` → copie `<T>/avant/` avant modif, DoD diff = `git diff --no-index --stat`.
Build partagé : `--outDir` n'isole pas les plugins qui écrivent en dur (sitemap `dist/`) → build `cwd=<T>` ; DoD `md5sum` du fichier partagé avant = après.
Classe/état figé par le prérendu (`app-mounted`…) ≠ preuve de montage → sonde runtime (`__reactContainer`), pas la classe.
Contenu citant des commandes interdites (push, migrations…) → outil Write ; `garde_bash` scanne tout le texte Bash, heredoc compris.
Tâche « copie verbatim » → `diff` dans les outils autorisés.
Serveur de test lancé : `node_modules/.bin/<outil>` (≠ `npx`) + kill par pid, port libre vérifié en fin.
Cible déployée : protocole (http ⇒ ni secure context ni Cache Storage), variables à ne jamais poser (ex. `GEOLENS_ENV=production` en http).

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(pytest:*)
- Outils : nommer chaque commande exacte de la DoD (`npx tsc`, `node banc`, `make -n`) ; commande hors liste ⇒ NV.
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom (conteneurs `docker rm -fv <nom>`, fichiers listés) ; jamais de nettoyage global (prune, rm -r d'un dossier commun).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes (result.md ≤ 60 lignes de corps ; détail long → note à part liée `[[slug]]`) :

```markdown
---
tache: T007
projet: agentx-voix
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
