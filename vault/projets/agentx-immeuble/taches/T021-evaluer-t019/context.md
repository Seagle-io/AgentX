---
pack: T021
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T021 — Evaluer T019

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T019 (chef installé au dernier étage de la tour, plus sur le toit ; coupe `É<n+1> · CHEF` ; todo `chef` ; consigne « au dernier étage ») contre la DoD de SON pack, preuves re-exécutées par TON script sur l'instantané → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T019-chef-au-dernier-etage-pas-sur-le-toit/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/eval-T021/e2e.mjs` sur la salle-banc servant l'INSTANTANÉ `.cache/snap-T019/dash` : 0 mascotte sur le toit (aucune `.tour-chef` hors du niveau direction) ; chef dans le niveau direction pour `vivant` true/false/null (3 états visuels distincts) ; plaque et coupe `É<n+1> · CHEF` pour 0, 3, 8, 12 étages ; clic/Entrée → tiroir ; ascenseur et ↑/↓ desservent la direction ; 390 px ; reduce → 0 animation ; 0 erreur console
- [ ] non-régression : e2e de T018 (`.cache/eval-T020/e2e.mjs`) et T015 (`.cache/eval-T015/e2e.mjs`) adaptés au banc → 0 KO (adaptations listées et justifiées)
- [ ] `rg -n -i "toit" .cache/snap-T019/dash/` → seulement la clé serveur `im.toit` ; `git show 45e9fbc -- bin/terminal.py` → 1 hunk « au dernier étage »
- [ ] écarts déclarés par T019 (classes renommées, LED couleur chef, hauteur d'étage 300/(n+1)) jugés
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T019-chef-au-dernier-etage-pas-sur-le-toit/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T019-chef-au-dernier-etage-pas-sur-le-toit/result.md` | L | affirmations à réfuter |
| `.cache/snap-T019/dash/` | L | livrable (instantané = commit 45e9fbc) |
| `.cache/eval-T020/e2e.mjs` | L | non-régression T018 |
| `.cache/eval-T015/e2e.mjs` | L | non-régression T011 |
| `.cache/banc-T009/setup.py` | L | banc multi-projets |
| `.cache/eval-T021/` | E | banc, script, captures |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T021
projet: agentx-immeuble
statut: fait | bloque
evalue: T019
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
Diff de T019 = `git show 45e9fbc -- dash/ bin/terminal.py`. Couleur du chef (roles.json) : `#3b82f6`. `immeuble.toit = {"chef":{"vivant":true|false|null},"todo","urgent","etages","dormants","alerte"}` (clé serveur conservée).

## Décisions actées
- demande humaine : « ne mets pas le chef sur le toit, mets-le au dernier étage »
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien

## Hors périmètre
- `dash/` réel, `bin/*` ; écrire hors `.cache/eval-T021/` et ton `result.md`

## Environnement
- banc : `B=.cache/eval-T021/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json $B/; cp -r .cache/snap-T019/dash $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis `setup.py` de T009 adapté ; `python3 $B/bin/dash.py --port 7815 --no-open &` ; kill par pid, `curl` → 000 ; états chef et nb d'étages : réécrire la route `state.json`
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`)
- salle réelle :7777 : ne pas toucher ; vrai vault jamais muté

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T021/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T021/banc)`, `Bash(kill:*)`, `Bash(curl:*)`, `Bash(git show:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T021-evaluer-t019/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
