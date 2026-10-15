---
pack: T019
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T019 — Evaluer T017

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T017 (correctifs front : Échap xterm, deck, RH NaN, tiroir, z-index) contre la DoD de SON pack, case par case, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T017-correctifs-front-salle-echap-xterm-deck-rh-nan-t/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi (jamais recopiée du result.md évalué)
- [ ] mesures F1/F2/F4/F5 re-jouées par TON script `.cache/eval-T019/mesure.mjs` (pas celui de T017) à 1600, 390 et 150 px de carte ; sortie collée
- [ ] affirmations du `result.md` évalué (« Vérifié comment ») : ≥ 3 re-jouées, écart → case `[ ]`
- [ ] périmètre : `git diff --stat -- dash/` → `dash/dash.js`, `dash/dash.css` seulement ; `git status --short dash/` sans autre fichier
- [ ] écarts déclarés par T017 (demo-flag déplacé à gauche, container-type sur `.card-id`) jugés : cassent-ils un consommateur ou une décision actée du pack T017 ?
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T017-correctifs-front-salle-echap-xterm-deck-rh-nan-t/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T017-correctifs-front-salle-echap-xterm-deck-rh-nan-t/result.md` | L | affirmations à réfuter |
| `dash/dash.js` | L | livrable évalué |
| `dash/dash.css` | L | livrable évalué |
| `dash/index.html` | L | structure (#tiroir dans .frame) |
| `.cache/eval-T019/` | E | script, captures jetables |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`, §C6) :
```markdown
---
tache: T019
statut: fait | bloque
evalue: T017
verdict: retenir | virer
---
## Verdict
## DoD
## Motif
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
Le lot T017 n'est PAS commité : son diff = `git diff -- dash/` (arbre de travail vs HEAD b0109a2). `bin/*` et `.gitignore` modifiés par une autre tâche (T018) : hors évaluation.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` — le chef tient la comptabilité
- `NV` vaut `[ ]` — « non vérifié » = « non fait »
- tu ne corriges rien, même une faute triviale — constat seulement

## Hors périmètre
- Modifier un fichier hors `.cache/eval-T019/` et ton `result.md`
- Évaluer `bin/*` (T018) ; juger le style : seule la DoD compte

## Environnement
- salle-banc de lecture : `python3 bin/dash.py --port 7796 --no-open &` (lit le vrai vault, GET seulement) ; kill par pid, `curl` → 000 à la fin ; `bin/dash.py` est en cours de modification par T018 : s'il ne démarre pas, relancer 1 fois puis `NV` motivé
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; navigateurs `~/.cache/ms-playwright` ; 0 `npm install`
- OBLIGATOIRE : `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé : `open|etat` → `{"vivant":true}` JSON, GET flux → `text/event-stream` vide, `in` → compté puis `{}` — la page POST seule `/api/term/open` ; le socket chef est celui de la vraie session
- `.demo-flag` absent du vrai vault : pour F5, réécrire la route `state.json` avec `demo:true`
- salle réelle :7777 : ne pas lancer, ne pas arrêter ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T019/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(mkdir:*)`, `Bash(kill:*)`, `Bash(curl:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T019-evaluer-t017/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
