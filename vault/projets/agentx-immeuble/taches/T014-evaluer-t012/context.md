---
pack: T014
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T014 — Evaluer T012

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T012 (correctifs : action sur le mauvais étage, Alt+flèches, 1er événement) contre la DoD de SON pack, scénarios du vérificateur rejoués par TON script sur l'instantané → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T012-correctifs-immeuble-saisie-sur-mauvais-etage-alt/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/eval-T014/e2e.mjs` (pas celui de T012), sur banc multi-projets servant l'INSTANTANÉ `.cache/snap-T012/dash` : D1 (saisie ouverte + bascule lente 1500 ms + Entrée → 0 requête vers l'ancien étage, vault banc inchangé), D1 bis (pilote avec `projet` ≠ affiché depuis une ligne de tâche → refusé), D2 (2 × Alt+↓ avant réponse → rang 2), D3 (`run/evenements.jsonl` absent puis 1 événement → sonne ; rechargement → ne rejoue pas) ; sorties collées
- [ ] tentative de contournement : ≥ 3 chemins pour envoyer une action pendant la bascule (palette Ctrl+K, todo ▶ lancer, double Entrée, clic sur `.tbtn` résiduel) → tous refusés ou dirigés vers l'étage affiché ; sorties collées
- [ ] décision du chef (decisions.md 2026-10-15 après T012) respectée : todo du toit peut viser un autre étage (item étiqueté), refusée pendant `transit` ; prouvé sur banc
- [ ] affirmations du `result.md` évalué : ≥ 4 re-jouées
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T012-correctifs-immeuble-saisie-sur-mauvais-etage-alt/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T012-correctifs-immeuble-saisie-sur-mauvais-etage-alt/result.md` | L | affirmations à réfuter |
| `.cache/snap-T012/dash/dash.js` | L | livrable (instantané) |
| `.cache/banc-T009/setup.py` | L | montage du banc multi-projets |
| `.cache/banc-T009/e2e-T009.mjs` | L | scénarios d'origine (lecture, ne pas réutiliser tel quel) |
| `.cache/eval-T014/` | E | banc, script |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T014
projet: agentx-immeuble
statut: fait | bloque
evalue: T012
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
Part de T012 (déclarée) dans `dash.js` : `:937-942` (SON.vu), `:985-1009` (IMMEUBLE.transit, surHash, inert), `:1189-1192` (charger), `:1209-1227` (pilote, refus), `:1275` (todo toit exemptée), `:1436-1438` (Alt+↑/↓). Commit 48a6888 contient tout `dash/` ; l'instantané = ce commit.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` sur le vrai vault ; NV vaut `[ ]` ; tu ne corriges rien
- évaluer l'INSTANTANÉ : `dash/` réel est modifié en parallèle par T011 (vue d'ensemble animée)

## Hors périmètre
- `dash/` réel ; `bin/*` ; écrire hors `.cache/eval-T014/` et ton `result.md`

## Environnement
- banc : `B=.cache/eval-T014/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json $B/; cp -r .cache/snap-T012/dash $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis fixtures via `setup.py` de T009 (adapter le chemin du banc) ; salle-banc `python3 $B/bin/dash.py --port 7808 --no-open &` ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`) ; `/api/run` NON intercepté (le banc doit muter) ; retarder `state.json` par `page.route` pour les bascules lentes
- Ctrl+K muet si focus dans xterm : cliquer hors terminal avant
- vrai vault jamais muté ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T014/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T014/banc)`, `Bash(kill:*)`, `Bash(curl:*)`, `Bash(git show:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T014-evaluer-t012/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
