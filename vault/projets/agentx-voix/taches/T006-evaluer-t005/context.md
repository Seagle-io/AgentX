---
pack: T006
projet: agentx-voix
role: evaluateur
cree: 2026-10-16
---

# Pack T006 — Evaluer T005

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger la console vocale et les boutons voix de la salle (T005) contre la DoD de SON pack, par TON script sur l'instantané → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-voix/taches/T005-salle-bouton-voix-stop-micro/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] TON script `.cache/voix-eval-T006/e2e.mjs` sur salle-banc servant l'INSTANTANÉ `.cache/snap-voix-T005/dash` : hauteur de page 0 vs 30 entrées (1600, 1280, 1024) ; ordre (plus récente en haut) ; heure HH:MM ; hostile (`<img onerror>`, `<script>`, `&lt;` littéral) → 0 exécution, affiché tel quel ; illumination de la nouvelle phrase ; 3 boutons → requêtes interceptées exactes ; `parle`/`dictee` false → désactivés ; `voix` absent ou `null` → carte cachée, 0 erreur ; 390 px
- [ ] `/api/voix/**`, `/api/run` interceptés au niveau `context.route` (pas `page.route`) ; `/api/term/*` simulé ; jamais le vrai serveur voix
- [ ] non-régression : tour d'immeuble visible, coupe, liste du chef bornée (hauteur stable) — 3 assertions
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-voix/taches/T005-salle-bouton-voix-stop-micro/context.md` | L | DoD de référence |
| `vault/projets/agentx-voix/taches/T005-salle-bouton-voix-stop-micro/result.md` | L | affirmations |
| `.cache/snap-voix-T005/dash/` | L | livrable (instantané) |
| `bin/dash.py` | L | `state.voix`, `/api/voix/*` |
| `.cache/voix-eval-T006/` | E | banc, script, captures |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T006
projet: agentx-voix
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
`state.voix = {"mode","parle","en_cours","dictee","ecoute": bool, "journal": [{"t","texte"}]}` (journal : plus récente en DERNIER) ; panne serveur → `"voix": null`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- la 400 « état inconnu — relance dictee » loguée par Chrome est voulue : hors comptage des erreurs console

## Hors périmètre
- `dash/` réel (peut bouger), `bin/*` ; écrire hors `.cache/voix-eval-T006/` et ton `result.md` ; faire parler la machine

## Environnement
- banc : `B=.cache/voix-eval-T006/banc; rm -rf $B; mkdir -p $B; cp -r bin roles.json produits.json $B/; cp -r .cache/snap-voix-T005/dash $B/; ln -s "$PWD/vault" $B/vault` ; `AGENTX_VOIX_DIR=.cache/voix-eval-T006/v python3 $B/bin/dash.py --port 7820 --no-open &` ; kill par pid ; `http://127.0.0.1:7820`
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; état voix / journal : réécrire la route `state.json`
- salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/voix-eval-T006/`), `Bash(python3:*)`, `Bash(node:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/voix-eval-T006/banc)`, `Bash(kill:*)`, `Bash(curl:*)`, `Bash(grep:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-voix/taches/T006-evaluer-t005/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
