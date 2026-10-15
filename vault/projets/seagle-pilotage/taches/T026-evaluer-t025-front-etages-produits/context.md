---
pack: T026
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T026 — Evaluer T025 (front étages-produits)

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le front livré par T025 (`dash/dash.js`, `dash/index.html`, `dash/dash.css` : étages-produits, puces projets, hash `#/<cle>/<projet>`) contre la DoD de SON pack, y compris les cas que T025 n'a pas observés → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T025-l5-front-etage-produit-puces-projets-hash-cle-pr/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par TON script Playwright (pas celui de T025)
- [ ] NON observés par T025, sur bancs : (a) `produits.json` absent → bandeau `produits.json invalide : …` visible, mode projets = 1 étage par projet, clic étage → `#/<projet>` fonctionnel ; (b) `roles.json` invalide → bandeau `roles.json invalide : …`
- [ ] hostiles sur :7777 : `#/kora/zz`, `#/zz/orthopro`, `#/KORA/OrthoPro`, `#/kora/%3Cscript%3E`, double clic rapide sur 2 puces → 0 erreur de page, état final cohérent (`state.projet.slug` == puce `.actif`)
- [ ] réponse périmée : bascule A→B→A en < 300 ms → détail final = A
- [ ] 390 px : `scrollWidth == 390` avec les puces de l'étage AgentX (4 projets) affichées
- [ ] isolation : `md5sum dash/dash.js dash/index.html dash/dash.css bin/dash.py produits.json roles.json` avant == après ; ports de banc → 000 à la fin
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T025-l5-front-etage-produit-puces-projets-hash-cle-pr/context.md` | L | DoD + §C3 de référence |
| `vault/projets/seagle-pilotage/taches/T025-l5-front-etage-produit-puces-projets-hash-cle-pr/result.md` | L | affirmations |
| `dash/dash.js` | L | livrable |
| `dash/index.html` | L | livrable |
| `dash/dash.css` | L | livrable |
| `.cache/seagle-T025/e2e.mjs` | L | harnais T025 (modèle, ne pas le rejouer comme preuve) |
| `.cache/seagle-eval-T026/` | E | bancs, script, PNG |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T026 · projet: seagle-pilotage · statut · evalue: T025 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.
Réel : É4 kora [orthopro] · É3 geolens [3] · É2 agentx [4] · É1 seagle [2] · sous-sol [dashboard-direct, dashboard-grille, 2026-10-05-recherche-floue].
Serveur : `GET /state.json?etage=<cle>&projet=<slug>` → `immeuble.selection {slug, projet, source, refus}` ; `produits_erreur` ≠ "" ⇒ `immeuble.mode == "projets"`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- écarts T025 acceptés par le chef : puces dans `#pa-projets` (pas dans `#pa-label`, vertical) ; hash complété en `#/<cle>/<projet>` après réponse
- `projet` invalide + `etage` valide → serveur garde l'étage, `refus ""` (acté 2026-10-16)

## Hors périmètre
- écrire dans `dash/*`, `bin/*`, `produits.json`, `roles.json` réels ; relancer :7777 ; `POST /api/*`

## Environnement
- Playwright : `import { chromium } from '/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs'` ; jamais `playwright install`
- banc (a) : `B=.cache/seagle-eval-T026/a; mkdir -p $B; cp -r bin dash roles.json $B/; ln -s "$PWD/vault" $B/vault` (sans `produits.json`) puis `python3 $B/bin/dash.py --port 7828 --no-open`
- banc (b) : idem dans `.cache/seagle-eval-T026/b` avec `produits.json` copié et `roles.json` remplacé par `{}` → `--port 7829`
- arrêt des bancs : kill par pid noté au lancement (jamais `pkill -f`/`pgrep -f` : tue ton shell)
- sorties `| tail -n 40` ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T026/`), `Bash(node:*)`, `Bash(python3:*)`, `Bash(curl -s:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(md5sum:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections de « Contrats ».
