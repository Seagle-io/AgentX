---
pack: T023
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T023 — Evaluer T022 (tests)

> Seule source de vérité de l'agent T023. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger les tests `tests/test_produits.py` et `tests/test_publier.py` (T022) contre la DoD de SON pack : verts sur le livrable, rouges sur des défauts réels, sans toucher aux vrais dépôts → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T022-l7-tests-produits-et-porte-de-publication/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] `python3 -m unittest discover -s tests -v` → vert, durée collée
- [ ] 3 défauts NEUFS de toi (autres que les 7 de T022), injectés sur une COPIE via `AGENTX_BIN` : ex. P4 inversé, `--acquitter` sans expiration, `produit_de` qui ignore le brief → ≥ 1 test rouge chacun (sinon : trou de couverture → `[ ]`)
- [ ] isolation : `md5sum` de `bin/produits.py bin/publier.py bin/vx.py produits.json` et `git -C <d> status --porcelain` des 5 dépôts avant == après
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T022-l7-tests-produits-et-porte-de-publication/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T022-l7-tests-produits-et-porte-de-publication/result.md` | L | affirmations |
| `tests/` | L | livrable |
| `bin/produits.py` | L | code testé (copie pour injection) |
| `bin/publier.py` | L | code testé (copie pour injection) |
| `.cache/seagle-eval-T023/` | E | copies et défauts injectés |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T023 · projet: seagle-pilotage · statut · evalue: T022 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.
Les tests importent les modules par chemin depuis `AGENTX_BIN` (défaut `bin/`).

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien

## Hors périmètre
- `bin/*` réel, `tests/` réel en écriture ; `bin/dash.py` (T021 en parallèle)

## Environnement
- appels indépendants groupés ; sorties bornées `| tail -n 40` ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T023/`), `Bash(python3:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(md5sum:*)`, `Bash(git -C:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections de « Contrats ».
