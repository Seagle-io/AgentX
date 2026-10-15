---
pack: T020
projet: agentx-immeuble
role: evaluateur
cree: 2026-10-15
---

# Pack T020 — Evaluer T018

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T018 (tour : rôle hostile, Échap retour immeuble, troncature emoji, focus, `#/Beta`) contre la DoD de SON pack, scénarios re-joués par TON script sur l'instantané → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-immeuble/taches/T018-correctifs-tour-role-hostile-echap-troncature-em/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/eval-T020/e2e.mjs` sur banc servant l'INSTANTANÉ `.cache/snap-T018/dash` : rôles `constructor`, `__proto__`, `toString`, `hasOwnProperty`, `valueOf` → tour rendue, plaques = étages serveur, 0 TypeError ; panne de rendu simulée → `console.error` + nouvel essai au poll suivant ; Échap (priorités palette > saisie > plein écran > retour immeuble ; xterm intouché) ; emoji / ZWJ (`👩‍💻`) / drapeau (`🇫🇷`) en fin de troncature → 0 surrogate isolé ; focus après Entrée, ⌂, Échap ; `#/Beta`
- [ ] non-régression : `.cache/eval-T015/e2e.mjs` adapté au banc → 0 KO
- [ ] affirmations du `result.md` évalué : ≥ 4 re-jouées ; écarts déclarés (POSTES sans prototype, `#/Beta` en minuscules, scripts adaptés) jugés
- [ ] périmètre : `git show --stat bb592d9 -- dash/` → `dash/dash.js` seul
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-immeuble/taches/T018-correctifs-tour-role-hostile-echap-troncature-em/context.md` | L | DoD de référence |
| `vault/projets/agentx-immeuble/taches/T018-correctifs-tour-role-hostile-echap-troncature-em/result.md` | L | affirmations à réfuter |
| `.cache/snap-T018/dash/dash.js` | L | livrable (instantané = commit bb592d9) |
| `.cache/banc-T009/setup.py` | L | banc multi-projets |
| `.cache/eval-T015/e2e.mjs` | L | non-régression |
| `.cache/eval-T020/` | E | banc, script |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T020
projet: agentx-immeuble
statut: fait | bloque
evalue: T018
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
Diff de T018 = `git show bb592d9 -- dash/dash.js` (45 lignes).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- évaluer l'INSTANTANÉ : `dash/` réel est modifié en parallèle par T019 (chef au dernier étage)

## Hors périmètre
- `dash/` réel, `bin/*` ; écrire hors `.cache/eval-T020/` et ton `result.md`

## Environnement
- banc : `B=.cache/eval-T020/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin roles.json $B/; cp -r .cache/snap-T018/dash $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis `setup.py` de T009 adapté ; rôle hostile = éditer à la main le frontmatter `role:` d'un task.md du banc ; `python3 $B/bin/dash.py --port 7813 --no-open &` ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`)
- vrai vault jamais muté ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T020/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/eval-T020/banc)`, `Bash(kill:*)`, `Bash(curl:*)`, `Bash(git show:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-immeuble/taches/T020-evaluer-t018/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
