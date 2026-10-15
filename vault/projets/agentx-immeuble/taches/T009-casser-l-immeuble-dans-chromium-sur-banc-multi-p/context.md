---
pack: T009
projet: agentx-immeuble
role: verificateur
cree: 2026-10-15
---

# Pack T009 — Casser l'immeuble dans Chromium sur banc multi-projets

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Faire tomber l'immeuble de bout en bout (coupe → bascule d'étage → actions `/api/run` → vx → vault → coupe) dans un vrai Chromium, sur une salle-banc à vault jetable de ≥ 4 projets ; rendre `CONFORME` ou `DÉFAUTS` avec repro.

## Definition of Done
- [ ] banc monté (cf. Environnement) : projets `alpha` (en-cours + revue + bloque), `beta` (actif, pret), `gamma` (dormant : mtimes vieillis 10 j par `os.utime`), `delta` (clos), + 1 dossier `vault/archive/2026-01-01-vieux` ; mêmes TID (T001…) dans plusieurs projets
- [ ] salle-banc `python3 $B/bin/dash.py --port 7802 --no-open &` ; `curl -s 127.0.0.1:7802/state.json` → 3 étages, sous-sol 2, ordre et dormance §C2
- [ ] script `$B/e2e-T009.mjs` (chromium headless), sortie collée, couvrant :
  - V1 action sur le BON étage : ouvrir `#/beta`, `virer` / `set` / `retenir` depuis une ligne de tâche → la requête `/api/run` porte `projet: beta` ; vault banc : seul `beta` muté (diff des task.md collé) — même TID existant dans `alpha` intact
  - V2 bascule pendant une saisie : saisie de motif ouverte sur `#/alpha`, Alt+↓ ou clic d'étage → saisie fermée, 0 requête envoyée vers le mauvais étage
  - V3 course : 2 clics d'étage rapides (route `state.json` retardée 800 ms pour le 1er) → étage affiché = dernier clic, `#projet-nom` cohérent, actions du bon slug
  - V4 hash hostile : `#/../x`, `#/%00`, `#/<script>`, `#/` + 300 car., `#/delta` (clos), `#/2026-01-01-vieux` (archive) → 0 erreur console, 0 XSS (aucune exécution), clos lisible, archive refusée
  - V5 todo agrégée : bouton `.ti-etage` d'un item → bon étage ; item toit (`projet ""`) non cliquable ; `#todo-count` = `todo_total`
  - V6 sonnerie : ajouter au banc `run/evenements.jsonl` 1 événement `projet: beta` → `.im-etage[data-slug=beta]` reçoit `.sonne` ; événement sans `projet` → aucun étage ne sonne, toast sans étiquette
  - V7 vie du vault : pendant que la page tourne, créer un projet `epsilon` dans le banc (`vx.py projet`) puis le clore → étage apparaît puis passe au sous-sol en ≤ 2 polls ; passer une tâche `gamma` en `en-cours` → gamma n'est plus dormant
  - V8 390 px : `scrollWidth <= 390` avec 3 étages et avec 12 étages (banc : créer 9 projets de plus) ; captures
  - V9 clavier : Tab → toit → étages ; ↑/↓ ; Entrée ; bouton retour du navigateur → étage précédent ; Ctrl+K « étage » (focus hors xterm)
- [ ] captures `$B/T009-*.png` (1280, 390, 12 étages) listées
- [ ] chaque défaut : `scénario · attendu · obtenu · repro · chemin:L probable`
- [ ] fin : salle-banc tuée par pid, `curl :7802` → 000 ; vrai vault intact (`git status --short vault/projets/agentx-immeuble` ne montre que ton `result.md` et les fichiers du chef)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.cache/banc-T009/` | E | banc jetable complet |
| `vault/projets/agentx-immeuble/contrat.md` | L | **§C1-C5 L23-155 · §C8 L252-313 : comportement attendu** |
| `vault/projets/agentx-immeuble/taches/T005-l2-coupe-d-immeuble-et-bascule-d-etage-dans-la-s/result.md` | L | « Pour la suite » = scénario navigateur |
| `dash/dash.js` | L | localiser un défaut |
| `bin/dash.py` | L | localiser un défaut |
| `bin/vx.py` | L | localiser un défaut |

## Contrats
Requête page → serveur :
```
GET  /state.json?projet=<slug>&t=<ms>   → état ; slug inconnu → 200 + immeuble.selection.refus
POST /api/run  headers: Content-Type: application/json, X-AgentX-Jeton: <state.json.jeton>
     body {action, projet, tid?, statut?, motif?, role?, modele?} → {commande, code, out, err}
```
CLI banc :
```
python3 $B/bin/vx.py projet <slug> --titre "<t>"
python3 $B/bin/vx.py tache "<titre>" --projet <slug> --role implementeur [--dep T001]
python3 $B/bin/vx.py set T001 --statut pret|en-cours|revue|bloque --projet <slug>
```
`set fait` d'un implementeur refusé (livre en revue) ; `pret` exige un pack non vide lintable (écrire un context.md minimal dans le banc) ; clore = `statut: clos` dans le brief.md du banc. Évaluation `virer` : tâche evaluateur `--dep`, result.md frontmatter `verdict: virer` + `## Motif` 1 ligne, puis `set fait`.

## Décisions actées
- banc jetable seulement — vrai vault jamais muté ; tu ne corriges rien
- verdict binaire `CONFORME | DÉFAUTS` ; persistance d'étage = hash `#/slug` (pas localStorage)

## Hors périmètre
- Boutons ▶ lancer / ■ arrêter du terminal et tout `/api/term/*` réel : simuler (cf. Environnement)
- Salle réelle :7777 ; modifier un fichier hors `.cache/banc-T009/` et ton `result.md`

## Environnement
Banc : `B=.cache/banc-T009; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/`
- `ROOT` = parent de `bin/` → la salle-banc lit `$B/vault` et `$B/run/`
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; navigateurs `~/.cache/ms-playwright` ; 0 `npm install`
- OBLIGATOIRE : `/api/term/*` intercepté — `open|etat` → `{"vivant":true}` JSON, GET flux → `text/event-stream` vide, `in` → `{}` ; la page POST seule `/api/term/open` ; le socket chef `~/.local/state/agentx-chef.sock` est la vraie session
- `/api/run` : NON intercepté (le banc doit muter) — seul le vault du banc est touché
- Ctrl+K muet si focus dans xterm : cliquer hors terminal avant ; `.tasks` défile en interne
- `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, chacune journalisée dans `## Écarts`.
- Outils autorisés : Read, Grep, Glob, Write (banc + result.md), `Bash(python3:*)`, `Bash(node:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T009)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git status:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T009
projet: agentx-immeuble
statut: fait | bloque
---
## Livré
- verdict : CONFORME | DÉFAUTS (n)
- D1 · scénario · attendu · obtenu · repro · chemin:L
## Vérifié comment
commande → sortie brute (script e2e, curl)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : défauts recopiables tels quels dans un pack correctif
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
