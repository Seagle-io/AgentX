---
pack: T008
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T008 — Evaluer T005

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T005 (coupe d'immeuble + bascule d'étage dans la salle) contre la DoD de SON pack et §C8, preuves re-exécutées par TON script → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T005-l2-coupe-d-immeuble-et-bascule-d-etage-dans-la-s/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/eval-T008/e2e.mjs` (pas celui de T005) : DoD L2 `contrat.md:346-353` re-jouée ; sortie collée
- [ ] HTML §C8 verbatim : comparaison programmatique bloc `contrat.md` ↔ `dash/index.html:14-22`, sortie collée
- [ ] fonctions §C8 présentes et signatures inchangées des fonctions existantes (`construireSalle(s)`, `rendreTaches(s)`, `rendreTodo(s)`, `pilote`, `entreesPalette(s)`) : `rg` collé
- [ ] affirmations du `result.md` évalué : ≥ 4 re-jouées (dont « réponse périmée ignorée » et « 390 px scrollWidth »)
- [ ] écarts déclarés par T005 jugés (libellé `aller` dans filtrerPalette, démo sans étiquette toit, grille ≤ 480 en 2 lignes, `#9fb0cc` au lieu de `--dim`, cage/cabine) : cassent-ils §C8 ou une décision actée ?
- [ ] périmètre : `git diff --stat -- dash/` → 3 fichiers `dash/` seulement
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T005-l2-coupe-d-immeuble-et-bascule-d-etage-dans-la-s/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T005-l2-coupe-d-immeuble-et-bascule-d-etage-dans-la-s/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1 L23-77 · §C3 L93-115 · §C8 L252-313 · DoD L2 L346-353 |
| `dash/dash.js` | L | livrable |
| `dash/index.html` | L | livrable |
| `dash/dash.css` | L | livrable |
| `.cache/eval-T008/` | E | script, captures |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T008
projet: agentx-immeuble
statut: fait | bloque
evalue: T005
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
Lot non commité : diff = `git diff -- dash/` (arbre vs HEAD 44e45e5 ; inclut T017 ? non : T017 commité dans 44e45e5).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- un vérificateur (T009) casse l'immeuble en parallèle sur banc : toi, tu juges la DoD, pas la robustesse au-delà

## Hors périmètre
- `bin/*` (L1/L3 retenus) ; modifier un fichier hors `.cache/eval-T008/` et ton `result.md`

## Environnement
- salle-banc de lecture : `python3 bin/dash.py --port 7801 --no-open &` (lit le vrai vault, GET seulement) ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; navigateurs `~/.cache/ms-playwright` ; 0 `npm install`
- OBLIGATOIRE : `page.route('**/api/run', r => r.abort())` (compter) ; `/api/term/*` simulé : `open|etat` → `{"vivant":true}` JSON, GET flux → `text/event-stream` vide, `in` → `{}` ; jamais le vrai socket chef
- Ctrl+K muet si le focus est dans xterm (`term.focus()` à l'amorçage) : cliquer hors terminal avant
- `.demo-flag`/démo : réécrire la route `state.json` (`immeuble: null`) ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T008/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`, `Bash(kill:*)`, `Bash(curl:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T008-evaluer-t005/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
