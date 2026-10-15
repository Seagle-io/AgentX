---
pack: T015
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T015 — Evaluer T011

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T011 (vue d'ensemble animée de l'immeuble entier, `svg#tour`) contre la DoD de SON pack, preuves re-exécutées par TON script sur l'instantané → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T011-vue-d-ensemble-animee-open-space-de-l-immeuble-e/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/eval-T015/e2e.mjs` sur la salle-banc servant l'INSTANTANÉ `.cache/snap-T011/dash` : bascule IMMEUBLE ↔ ÉTAGE (hash vide / `#/slug` / bouton ⌂), clic d'étage, 3/8/12 étages, 0 mascotte sans agent (comparaison collée), dormant/bloque/urgent/sélection, sonnerie d'étage, `prefers-reduced-motion` (0 animation), 390 px, a11y (focus, `aria-label`, Entrée) ; sorties collées
- [ ] perf : nombre de re-rendus de `#tour` sur 10 polls sans changement d'état = 0 (compteur ou MutationObserver collé) ; `getAnimations().length` normal vs réduit collé
- [ ] 0 régression : salle d'étage `#room`, coupe `#immeuble`, correctifs T012 (`#tasks[inert]` pendant bascule, action refusée en transit) — 4 assertions rejouées
- [ ] affirmations du `result.md` évalué : ≥ 4 re-jouées ; écarts déclarés jugés
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T011-vue-d-ensemble-animee-open-space-de-l-immeuble-e/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T011-vue-d-ensemble-animee-open-space-de-l-immeuble-e/result.md` | L | affirmations à réfuter |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1 L23-77 (forme `immeuble`) |
| `.cache/snap-T011/dash/` | L | livrable (instantané) |
| `.cache/eval-T015/` | E | banc, script, captures |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T015
projet: agentx-immeuble
statut: fait | bloque
evalue: T011
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
Base : commit c8637d9 ; diff de T011 = `diff -r` entre `dash/` de ce commit (`git show c8637d9:dash/dash.js` …) et l'instantané.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- 0 donnée inventée : une mascotte sans agent réel dans `etages[].agents` = défaut bloquant

## Hors périmètre
- `dash/` réel, `bin/*` ; écrire hors `.cache/eval-T015/` et ton `result.md`

## Environnement
- banc : `B=.cache/eval-T015/banc; rm -rf $B; mkdir -p $B; cp -r bin roles.json $B/; cp -r .cache/snap-T011/dash $B/; ln -s "$PWD/vault" $B/vault` → `python3 $B/bin/dash.py --port 7809 --no-open &` (vrai vault, GET seulement) ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`) ; `page.emulateMedia({reducedMotion:'reduce'})`
- étages multiples, agents, alertes : réécrire la route `state.json`
- salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T015/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T015/banc)`, `Bash(kill:*)`, `Bash(curl:*)`, `Bash(git show:*)`, `Bash(diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T015-evaluer-t011/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
