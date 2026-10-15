---
pack: T030
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T030 — Evaluer T029 (correctif _branche)

> Seule source de vérité de l'agent T030. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le correctif T029 de `_branche` (`bin/dash.py:488-504`) contre la DoD de SON pack et le motif de renvoi de T027 → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T029-branche-git-de-travail-affichee-sur-chaque-etage/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par TOI (ton script, pas `cas.py` de T029)
- [ ] cas absents de T029 : sha 64 car. → `détachée <sha7>` ; sha majuscule / 39 car. → `None` ; `ref: refs/heads/` (nom vide) → `""` ou `None` jugé (≠ exception) ; HEAD avec `\r\n` → branche sans `\r`
- [ ] HEAD binaire sur un dépôt de banc → `GET /state.json` contient `immeuble`, étage visé `depots[].etat == "ko"` ; page Chromium 390 px sans erreur (`pageerror` 0)
- [ ] diff limité : `git diff -- bin/dash.py` → seules `_branche`, `_depots` et `etages[].depots` (code T027 non commité + correctif) ; 0 autre fonction touchée
- [ ] isolation : `md5sum bin/dash.py dash/dash.js produits.json` avant == après ; ports de banc → 000
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T029-branche-git-de-travail-affichee-sur-chaque-etage/context.md` | L | DoD + contrat |
| `vault/projets/seagle-pilotage/taches/T029-branche-git-de-travail-affichee-sur-chaque-etage/result.md` | L | affirmations |
| `bin/dash.py` | L | livrable |
| `.cache/eval-T030/` | E | banc, script |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T030 · projet: seagle-pilotage · statut · evalue: T029 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.
Motif T027 : `_branche laisse fuir UnicodeDecodeError sur HEAD non UTF-8 (contrat illisible→None), state.json tombe ; ref hors refs/heads affichée 'détachée ref: re' ; git diff --stat non collé`
`produits.json` banc : copie du vrai, ne changer que `produits[0].depots[0].chemin` (via `python3 -c` json load/dump).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- DoD T029 « 8 cas » = 7 énumérés : compter 7, pas un défaut
- `bin/sonnerie.py`, `bin/voix.py` modifiés par le chef : hors évaluation

## Hors périmètre
- écrire dans `bin/*`, `dash/*`, `produits.json` réels ; relancer :7777

## Environnement
- banc : `B=.cache/eval-T030/banc; mkdir -p $B; cp -r bin dash roles.json produits.json $B/; ln -s "$PWD/vault" $B/vault` puis `python3 $B/bin/dash.py --port 7833 --no-open` ; kill par pid noté (jamais `pkill -f`)
- Playwright : `import { chromium } from '/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs'` ; jamais `playwright install`
- `garde_bash` refuse push/migrations ; sorties `| tail -n 40`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (`result.md`, `.cache/eval-T030/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(printf:*)`, `Bash(md5sum:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes de corps, sections de « Contrats ».
