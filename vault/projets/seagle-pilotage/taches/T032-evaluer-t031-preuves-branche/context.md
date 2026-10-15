---
pack: T032
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T032 — Evaluer T031 (preuves branche)

> Seule source de vérité de l'agent T032. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le compte rendu T031 (preuves rejouées du correctif `_branche`, 0 édition) contre la DoD de SON pack → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T031-branche-git-de-travail-affichee-sur-chaque-etage/context.md` recopiée dans `## DoD`, cochée `[x]` seulement si la sortie est collée dans le `result.md` de T031 ET que tu l'as re-exécutée avec le même résultat
- [ ] 0 édition par T031 : `md5sum bin/dash.py dash/dash.js` == valeurs collées par T031
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car. ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T031-branche-git-de-travail-affichee-sur-chaque-etage/context.md` | L | DoD |
| `vault/projets/seagle-pilotage/taches/T031-branche-git-de-travail-affichee-sur-chaque-etage/result.md` | L | affirmations |
| `.cache/eval-T030/cas.py` | L | à exécuter |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) : frontmatter `tache: T032 · projet: seagle-pilotage · statut · evalue: T031 · verdict` ; sections `## Verdict ## DoD ## Motif ## Vérifié comment ## Écarts ## Pour la suite ## Retour sur le pack`.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien
- code `_branche` déjà jugé conforme (T030, 13 cas) : ne pas re-juger le code, seulement les preuves

## Hors périmètre
- toute écriture hors ton `result.md`

## Environnement
- arbre partagé : `git status` bouge (chef) — normal

## Budget
- Lectures hors whitelist : **0**.
- Outils autorisés : Read, Write (`result.md`), `Bash(python3:*)`, `Bash(md5sum:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 30 lignes de corps, sections de « Contrats ».
