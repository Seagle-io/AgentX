---
pack: T013
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T013 — Evaluer T010

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T010 (todo bornée, 6 glyphes de rôles métier, 2 défauts 390 px) contre la DoD de SON pack, case par case, preuves re-exécutées par TON script sur l'instantané du livrable → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T010-front-todo-bornee-glyphes-roles-metier-defauts-3/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/eval-T013/mesure.mjs` (pas celui de T010) sur la salle-banc servant l'INSTANTANÉ : F1 Δpage 4 vs 40 items à 1600×1000 et 1280×800 ; F3 boutons `.trow` par `elementFromPoint` à 390 ; F4 tête du tiroir 34 px à 390 ; sortie collée
- [ ] F1 sans effet de bord : à ≤ 1240 px (règle `contain:none`) la todo ne repousse pas la page sans fin (mesure 4 vs 40 items à 1024 px collée) ; salle `#room` non tronquée à 1600 (capture)
- [ ] F2 : 6 glyphes rendus (capture), grammaire SVG = existants (`stroke="${c}"`, 0 couleur en dur : `rg` collé)
- [ ] 0 régression immeuble (coupe `#immeuble`, bascule `#/slug`) : 3 assertions rejouées
- [ ] affirmations du `result.md` évalué : ≥ 4 re-jouées
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T010-front-todo-bornee-glyphes-roles-metier-defauts-3/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T010-front-todo-bornee-glyphes-roles-metier-defauts-3/result.md` | L | affirmations à réfuter |
| `.cache/snap-T010/dash/` | L | instantané du livrable (dash.js, dash.css, index.html) |
| `.cache/snap-T010/diff.patch` | L | diff vs HEAD 44e45e5 (inclut T005, retenue : la coupe d'immeuble) |
| `.cache/eval-T013/` | E | banc, script, captures |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T013
projet: agentx-immeuble
statut: fait | bloque
evalue: T010
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
Part de T010 dans le diff (déclarée) : `dash.css` `.hud` `contain:size` `:272-274`, `:702` `contain:none` ≤ 1240, `:737-758` ≤ 480 ; `dash.js` GLYPHES `:337-354`. Le reste du diff = T005 (coupe d'immeuble, retenue).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- évaluer l'INSTANTANÉ `.cache/snap-T010/` : `dash/` réel est modifié en parallèle par T012

## Hors périmètre
- `dash/` réel (en cours d'édition par T012) ; `bin/*` ; écrire hors `.cache/eval-T013/` et ton `result.md`

## Environnement
- banc : `B=.cache/eval-T013/banc; rm -rf $B; mkdir -p $B; cp -r bin roles.json $B/; cp -r .cache/snap-T010/dash $B/; ln -s "$PWD/vault" $B/vault` → `python3 $B/bin/dash.py --port 7806 --no-open &` sert l'instantané et lit le vrai vault en GET ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; 0 `npm install`
- OBLIGATOIRE : `page.route('**/api/run', r => r.abort())` ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}` JSON, GET → `text/event-stream` vide, `in` → `{}`) ; jamais le vrai socket chef
- 4 vs 40 items : réécrire la route `state.json` ; capture pleine page : tiroir `position:fixed` (le masquer pour la capture seulement)
- salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T013/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T013/banc)`, `Bash(kill:*)`, `Bash(curl:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T013-evaluer-t010/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
