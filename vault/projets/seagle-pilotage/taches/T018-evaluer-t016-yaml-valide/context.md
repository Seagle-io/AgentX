---
pack: T015
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T018 — Evaluer T016 (YAML valide)

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger T016 (2e remplaçante, opus, après renvois de T005 et T012 : YAML invalide ou relecture infidèle) — `lire_frontmatter` / `ecrire_frontmatter` fidèles, code CLI `--produit` / `rattacher` / `publier` / doctor de T005, rattachement des 11 projets) contre la DoD de SON pack → `verdict: retenir | virer`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T016-l2-cli-projet-produit-rattacher-doctor-produits-/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] aller-retour à l'octet sur TOUS les `task.md`, `brief.md` du vrai vault, dans une copie (`.cache/seagle-eval-T018/`) : 0 écart (compte collé)
- [ ] motif du renvoi de T012 levé : les 26 pièges de `.cache/seagle-eval-T015/` + 15 NEUFS de toi (dont `\n` dans une note, tabulation, `a #b`, `[a, b]`, `--motif 'a "b"'`, slug numérique, `null`, `~`, `0x1F`, `1e3`, date) relus par vx ET `yaml.safe_load` (PyYAML 6.0.3 installé) → identiques ; `tache "Essai : banc eval"` et `projet --titre "A : B"` → YAML valide ; échecs listés
- [ ] quoting : ≥ 15 valeurs pièges par TOI (`: `, `#`, `"x"`, `'`, `\`, `[a, b]`, vide, espaces finaux, accents, emoji, `|`, `>`, `@`, `%`, `-` en tête) → écrire puis relire == valeur ; sortie collée
- [ ] CLI : `projet --produit` (inconnu → 2, 0 dossier), `rattacher` ×2 idempotent, `publier` délégué, doctor (produit absent/inconnu, registre invalide) sur banc ; aide `agentx help` (3 lignes)
- [ ] vrai vault : 11 briefs avec `produit:` attendu (table §C0) ; `./bin/agentx doctor` → 0 « produit absent|inconnu » ; DoD L2 #3 → `['agentx', 'geolens', 'kora', 'seagle']`
- [ ] écart déclaré (6 `titre:` non quotés déjà présents, laissés tels quels) : contredit-il une décision ? (decisions.md 2026-10-16 : différé, tâche à part)
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T016-l2-cli-projet-produit-rattacher-doctor-produits-/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T016-l2-cli-projet-produit-rattacher-doctor-produits-/result.md` | L | affirmations |
| `vault/projets/seagle-pilotage/taches/T015-evaluer-t012-frontmatter-et-rattachements/result.md` | L | motif du renvoi de T012 |
| `.cache/seagle-eval-T015/` | L | pièges de l'évaluation précédente |
| `vault/projets/seagle-pilotage/decisions.md` | L | décision « différé » |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C0 L32-37 · §C4 L196-205 · DoD L2 L320-325 |
| `bin/vx.py` | L | livrable |
| `bin/agentx` | L | aide |
| `.cache/seagle-eval-T018/` | E | copie du vault, banc |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T018
projet: seagle-pilotage
statut: fait | bloque
evalue: T016
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
Table §C0 : agentx-entreprise, agentx-immeuble, agentx-voix → agentx · geolens-viewer, geolens-preview-3d, geolens-charge-3d → geolens · orthopro, dashboard-grille, dashboard-direct → kora · seagle-site, seagle-pilotage → seagle.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien ; 0 écriture dans le vrai vault

## Hors périmètre
- `bin/publier.py` (T014 en parallèle) ; écrire hors `.cache/seagle-eval-T018/` et ton `result.md`

## Environnement
- copie : `rm -rf .cache/seagle-eval-T018; mkdir -p .cache/seagle-eval-T018; cp -r bin roles.json produits.json .cache/seagle-eval-T018/; cp -r vault .cache/seagle-eval-T018/vault`
- `garde_bash` refuse push/migrations (écrire « rattachement » plutôt que « migration » dans une commande)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/seagle-eval-T018/`), `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(cp:*)`, `Bash(cmp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-eval-T018)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/seagle-pilotage/taches/T018-evaluer-t016-yaml-valide/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
