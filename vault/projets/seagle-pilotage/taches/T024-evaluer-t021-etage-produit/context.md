---
pack: T024
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T024 — Evaluer T021 (étage = produit)

> Seule source de vérité de l'agent T024. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger `bin/dash.py` livré par T021 (étage = produit, sélection `?etage=&projet=`) contre la DoD de SON pack et `contrat.md` §C2 → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T021-l4-serveur-etage-produit-selection-etage-projet/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi (banc, pas les sorties de T021)
- [ ] 2 écarts déclarés par T021 jugés contre §C2 (`contrat.md:118-176`) : (a) `_choisir` sans blocs en signature, relit via cache `_bloc_projet` ; (b) mode projets tous dormants → étape 5 `projets[0]` ≠ T019 `etages[0]` → chacun `conforme` | `défaut` + citation §C2 ligne
- [ ] 3 sélections hostiles sur salle-banc : `?etage=zz&projet=orthopro`, `?projet=inexistant`, `?etage=<script>` → 200, `refus` ≠ "" ou sélection valide, 0 trace Python dans la sortie serveur
- [ ] mode secours rejoué : copie vault + `produits.json` absent → `mode == 'projets'`, `produits_erreur` ≠ "", 1 étage par projet
- [ ] isolation : `md5sum bin/dash.py bin/produits.py produits.json` avant == après ; aucun processus laissé sur :7827 (`curl` → 000)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T021-l4-serveur-etage-produit-selection-etage-projet/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T021-l4-serveur-etage-produit-selection-etage-projet/result.md` | L | affirmations |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C2 L118-176 · DoD L4 L330 |
| `vault/projets/agentx-immeuble/contrat.md` | L | §C1-C3 L23-115 (forme T019) · §C7 perf L242-251 |
| `bin/dash.py` | L | livrable |
| `bin/produits.py` | L | `produit_de`, `charger`, `erreur` |
| `produits.json` | L | registre réel (ne pas modifier) |
| `.cache/seagle-eval-T024/` | E | banc, copies |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T024 · projet: seagle-pilotage · statut · evalue: T021 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.
Rattachements réels : agentx-entreprise, agentx-immeuble, agentx-voix, agentx-serveur → agentx · geolens-* → geolens · orthopro, dashboard-grille, dashboard-direct → kora · seagle-site, seagle-pilotage → seagle.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- étage = produit (cadrage humain) ; mode projets = repli si registre invalide

## Hors périmètre
- écrire dans `bin/*`, `dash/*`, `produits.json` ; relancer la salle réelle :7777 ; front L5

## Environnement
- banc : `B=.cache/seagle-eval-T024/banc; mkdir -p $B; cp -r bin dash roles.json produits.json $B/; ln -s "$PWD/vault" $B/vault` puis `python3 $B/bin/dash.py --port 7827 --no-open` (GET seulement)
- `bin/vx.py` peut être modifié en parallèle (T040) : copier `bin/` dans le banc AVANT de mesurer ; erreur `vx.py` sans lien avec dash = Écart, pas défaut T021
- sorties bornées `| tail -n 40` ; `garde_bash` refuse push/migrations ; `grep -nE` si `rg` absent

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T024/`), `Bash(python3:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(md5sum:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections de « Contrats ».
